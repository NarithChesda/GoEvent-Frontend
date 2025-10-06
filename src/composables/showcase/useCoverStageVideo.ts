import { ref, computed, onUnmounted, nextTick, watch, readonly, type Ref } from 'vue'
import { useVideoResourceManager } from './useVideoResourceManager'

export type VideoPhase = 'none' | 'event' | 'background'
export type ShowcaseStage = 'cover' | 'event_video' | 'main_content'

interface VideoElementRefs {
  eventVideoPreloader: () => HTMLVideoElement | null
  sequentialVideoContainer: () => HTMLVideoElement | null
  coverVideoElement: () => HTMLVideoElement | null
  backgroundVideoElement: () => HTMLVideoElement | null
}

interface VideoUrls {
  eventVideoUrl?: string | null
  backgroundVideoUrl?: string | null
}

interface VideoEmits {
  eventVideoLoadStarted: []
  eventVideoPreloaded: []
  eventVideoReady: []
  backgroundVideoLoadStarted: []
  sequentialVideoEnded: []
  playEventVideo: []
  playBackgroundVideo: []
}

interface VideoProps extends VideoUrls {
  currentShowcaseStage?: ShowcaseStage
  shouldSkipToMainContent?: boolean
  videoStatePreserved?: boolean
  templateAssets?: { standard_cover_video?: string } | null
}

export function useCoverStageVideo(
  videoRefs: VideoElementRefs,
  props: VideoProps,
  emit: (event: keyof VideoEmits, ...args: any[]) => void,
) {
  // Initialize enhanced video resource manager
  const videoResourceManager = useVideoResourceManager()

  // Video state management
  const currentVideoPhase = ref<VideoPhase>('none')
  const eventVideoReady = ref(false)

  // Video state control
  const isCoverVideoPlaying = ref(
    !props.shouldSkipToMainContent && props.currentShowcaseStage !== 'main_content',
  )
  const isContentHidden = ref(false)

  // Video download tracking (simplified with resource manager)
  const videoDownloadPromises = new Map<string, Promise<string | null>>()
  const preloadedVideos = new Set<string>()

  // Mobile optimization flags
  const isMobile = videoResourceManager.isMobileDevice()
  const isLowMemory = videoResourceManager.isLowMemoryDevice()
  const maxConcurrentVideos = videoResourceManager.maxVideoLimit()

  // Safari/iOS detection for compatibility fixes
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

  // Safari/iOS detection for compatibility fixes

  // Safari timeout fallback for envelope button
  const safariTimeoutReached = ref(false)

  // Use the resource manager's event listener system
  const addVideoEventListener = (
    video: HTMLVideoElement,
    event: string,
    handler: EventListener,
  ) => {
    videoResourceManager.addVideoEventListener(video, event, handler)
  }

  // Register video elements with the resource manager
  const registerVideoForCleanup = (video: HTMLVideoElement, identifier?: string) => {
    videoResourceManager.registerVideo(video, identifier)
  }

  // Simplified video element management using resource manager
  const videoManager = {
    cleanup: (video: HTMLVideoElement | null) => {
      if (video) {
        return videoResourceManager.cleanupVideo(video)
      }
      return Promise.resolve()
    },
    setVisibility: (video: HTMLVideoElement | null, visible: boolean, zIndex?: string) => {
      if (!video) return
      video.style.opacity = visible ? '1' : '0'
      if (zIndex) {
        video.style.zIndex = zIndex
      }
    },
    setupForPlayback: (video: HTMLVideoElement, muted: boolean = false, loop: boolean = false) => {
      video.muted = muted
      video.loop = loop
      video.style.pointerEvents = 'none'

      // Mobile-specific optimizations
      if (isMobile) {
        video.playsInline = true
        // Ensure preload is appropriate for mobile
        if (!video.preload || video.preload === 'auto') {
          video.preload = isLowMemory ? 'none' : 'metadata'
        }
      }
    },
  }

  const cleanupAllVideoResources = async () => {
    try {
      // Use the enhanced resource manager for comprehensive cleanup
      await videoResourceManager.cleanupAllVideos()

      // Clear local state
      videoDownloadPromises.clear()
      preloadedVideos.clear()

      // Clean up specific video refs as backup
      const videoElements = [
        videoRefs.eventVideoPreloader(),
        videoRefs.sequentialVideoContainer(),
        videoRefs.coverVideoElement(),
        videoRefs.backgroundVideoElement()
      ].filter(Boolean)

      // Cleanup remaining elements in parallel
      await Promise.allSettled(
        videoElements.map(video => videoManager.cleanup(video))
      )

    } catch (error) {
      // Ensure state is cleared even if cleanup fails
      videoDownloadPromises.clear()
      preloadedVideos.clear()
    }
  }

  // Enhanced video download with mobile optimizations and resource management
  const forceFullVideoDownload = async (videoUrl: string, videoType: 'event' | 'background') => {
    try {
      // Get the full URL if it's relative
      const fullUrl = videoUrl.startsWith('http')
        ? videoUrl
        : `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}${videoUrl.startsWith('/') ? videoUrl : `/media/${videoUrl}`}`

      // Safari/iOS: Use direct URL with progressive loading instead of blob
      // Safari has issues with blob URLs for video and strict memory limits
      if (isSafari || isIOS) {
        preloadedVideos.add(videoUrl)
        return fullUrl
      }

      // Check if download is already in progress
      const existingPromise = videoDownloadPromises.get(videoUrl)
      if (existingPromise) {
        return await existingPromise
      }

      // Mobile-specific constraints
      if (videoType === 'background' && isLowMemory) {
        return null
      }

      // Enforce video limits for mobile
      if (isMobile && videoResourceManager.managedVideoCount() >= maxConcurrentVideos) {
        return null
      }

      // Mobile-optimized fetch configuration
      const fetchOptions: RequestInit = {}

      if (isMobile) {
        fetchOptions.cache = 'force-cache'
        fetchOptions.keepalive = true
        // Add priority hints if supported
        if ('priority' in fetchOptions) {
          (fetchOptions as any).priority = videoType === 'event' ? 'high' : 'low'
        }
      }

      // Enhanced size checking for low-memory devices
      if (isLowMemory) {
        try {
          const headResponse = await fetch(fullUrl, { ...fetchOptions, method: 'HEAD' })
          const contentLength = headResponse.headers.get('content-length')
          const videoSizeInMB = contentLength ? parseInt(contentLength) / (1024 * 1024) : 0

          // More aggressive size limits for low-memory devices
          const maxSize = videoType === 'event' ? 15 : 8 // MB
          if (videoSizeInMB > maxSize) {
            return null
          }
        } catch (error) {
          // Continue with download if HEAD request fails
        }
      }

      // Create and store the download promise (Chrome/Firefox blob strategy)
      const downloadPromise = (async () => {
        const response = await fetch(fullUrl, fetchOptions)

        if (!response.ok) {
          throw new Error(`Failed to fetch ${videoType} video: ${response.status}`)
        }

        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)

        // Register the blob URL with the resource manager
        videoResourceManager.registerBlobUrl(videoUrl, blobUrl)
        preloadedVideos.add(videoUrl)

        return blobUrl
      })()

      videoDownloadPromises.set(videoUrl, downloadPromise)
      const result = await downloadPromise
      videoDownloadPromises.delete(videoUrl)

      return result
    } catch (error) {
      videoDownloadPromises.delete(videoUrl)
      return null
    }
  }

  // Background video loading with progressive streaming and resource management
  const loadBackgroundVideo = async () => {
    if (!props.backgroundVideoUrl) return

    const bgVideo = videoRefs.backgroundVideoElement()
    if (!bgVideo) return

    // Register video with resource manager
    registerVideoForCleanup(bgVideo, 'background-video')

    // Check if already loading or loaded
    if (bgVideo.src && bgVideo.readyState > 0) {
      return
    }

    // Emit event that background video loading has started
    emit('backgroundVideoLoadStarted')

    // Use progressive streaming for background video
    const fullUrl = props.backgroundVideoUrl.startsWith('http')
      ? props.backgroundVideoUrl
      : `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}${props.backgroundVideoUrl.startsWith('/') ? props.backgroundVideoUrl : `/media/${props.backgroundVideoUrl}`}`

    // Safari-friendly preload strategy
    if (isSafari || isIOS) {
      // Safari respects 'metadata' better than 'auto' and won't block it
      bgVideo.preload = 'metadata'
    } else {
      // Force aggressive preloading for in-app browsers (Telegram/Messenger)
      // These browsers often ignore preload="none" or "metadata"
      bgVideo.preload = 'auto'
    }

    // Set the source directly for progressive download
    bgVideo.src = fullUrl
    bgVideo.load()

    // Safari doesn't need forced reload, but keep it for other browsers
    if (!isSafari && !isIOS) {
      setTimeout(() => {
        if (bgVideo.readyState === 0) {
          bgVideo.load()
        }
      }, 500)
    }
  }

  // Event video preloading handlers
  const handleEventVideoPreloaded = () => {
    emit('eventVideoPreloaded')
  }

  const handleEventVideoReady = () => {
    if (eventVideoReady.value) return
    eventVideoReady.value = true
    emit('eventVideoReady')
    // Background video is already loading in parallel, no need to start here
  }

  // Enhanced parallel video loading with mobile resource management
  const startParallelVideoLoading = async () => {
    const loadPromises: Promise<void>[] = []

    // Load event video if available
    if (props.eventVideoUrl) {
      const eventLoadPromise = (async () => {
        try {
          emit('eventVideoLoadStarted')
          const eventBlobUrl = await forceFullVideoDownload(props.eventVideoUrl!, 'event')
          if (eventBlobUrl && videoRefs.eventVideoPreloader()) {
            const eventVideo = videoRefs.eventVideoPreloader()!
            registerVideoForCleanup(eventVideo, 'event-video-preloader')
            eventVideo.src = eventBlobUrl
          }
        } catch (error) {
          // Event video loading failed
        }
      })()
      loadPromises.push(eventLoadPromise)
    }

    // Load background video if available (mobile-aware)
    if (props.backgroundVideoUrl && !isLowMemory) {
      const bgLoadPromise = (async () => {
        try {
          // Prioritize event video on mobile with longer delay
          const delay = isMobile ? 500 : 100
          await new Promise(resolve => setTimeout(resolve, delay))
          await loadBackgroundVideo()
        } catch (error) {
          // Background video loading failed
        }
      })()
      loadPromises.push(bgLoadPromise)
    }

    // Wait for all videos to load with timeout for mobile
    const timeout = isMobile ? 15000 : 30000 // Shorter timeout for mobile
    const timeoutPromise = new Promise<void>(resolve => {
      setTimeout(() => {
        resolve()
      }, timeout)
    })

    await Promise.race([
      Promise.allSettled(loadPromises),
      timeoutPromise
    ])
  }

  // Cover video loaded handler - start parallel loading of other videos
  const handleCoverVideoLoaded = () => {
    startParallelVideoLoading()
  }

  // Background video handlers (simplified - events emitted directly in VideoContainer)
  const handleBackgroundVideoPreloaded = () => {
    // No-op: event is emitted directly from VideoContainer
  }

  const handleBackgroundVideoReady = () => {
    // No-op: event is emitted directly from VideoContainer
  }

  // Sequential video handlers
  const handleSequentialVideoEnded = () => {
    if (currentVideoPhase.value === 'event') {
      // Event video ended - immediately show main content while keeping last frame visible
      // This prevents the gap on Telegram/Messenger browsers
      currentVideoPhase.value = 'background'
      emit('sequentialVideoEnded')

      // Now prepare background video in the background for smooth transition
      playBackgroundVideo()
    } else if (currentVideoPhase.value === 'background') {
      emit('sequentialVideoEnded')
    }
  }

  const handleSequentialVideoError = () => {
    emit('sequentialVideoEnded')
  }

  const playEventVideo = () => {
    if (!props.eventVideoUrl) return

    isCoverVideoPlaying.value = false
    currentVideoPhase.value = 'event'

    const videoToUse = videoRefs.eventVideoPreloader() || videoRefs.sequentialVideoContainer()
    if (!videoToUse) {
      return
    }

    // Register video with resource manager if not already registered
    registerVideoForCleanup(videoToUse, 'event-video')

    // Setup video for playback with mobile optimizations
    videoManager.setupForPlayback(videoToUse, isMobile, false) // Mobile needs muted start
    videoManager.setVisibility(videoToUse, true, '10')

    // Set source if using sequential container
    if (videoToUse === videoRefs.sequentialVideoContainer() && props.eventVideoUrl) {
      videoToUse.src = props.eventVideoUrl
    }

    // Enhanced play handling for mobile
    const playVideo = async () => {
      try {
        await videoToUse.play()

        // Try to unmute after play starts on mobile if user interacted
        if (isMobile && videoToUse.muted) {
          // Small delay to ensure playback is stable
          setTimeout(() => {
            try {
              videoToUse.muted = false
            } catch (error) {
              // Could not unmute video
            }
          }, 500)
        }
      } catch (error) {
        handleSequentialVideoEnded()
      }
    }

    playVideo()
    emit('playEventVideo')
  }

  // Helper functions for background video playback
  const createBackgroundVideoPlaybackManager = (bgVideo: HTMLVideoElement) => {
    let hasStartedPlaying = false
    let playAttempts = 0
    const maxPlayAttempts = 10
    let debugInterval: number | null = null

    const hideEventVideos = () => {
      videoManager.setVisibility(videoRefs.eventVideoPreloader(), false)
      videoManager.setVisibility(videoRefs.sequentialVideoContainer(), false)
    }

    const showBackgroundVideo = () => {
      videoManager.setVisibility(bgVideo, true, '5') // Same level as event video to replace it
    }

    const clearDebugInterval = () => {
      if (debugInterval) {
        clearInterval(debugInterval)
        debugInterval = null
      }
    }

    const startDebugInterval = () => {
      if (debugInterval) return // Already running

      debugInterval = setInterval(() => {
        if (hasStartedPlaying || playAttempts >= maxPlayAttempts) {
          clearDebugInterval()
          return
        }
        // Force another play attempt if video is stuck
        if (bgVideo.readyState >= 1 && bgVideo.paused) {
          tryPlayBackgroundVideo()
        }
      }, 5000) // Check every 5 seconds
    }

    const tryPlayBackgroundVideo = () => {
      if (hasStartedPlaying) return

      if (playAttempts >= maxPlayAttempts) {
        clearDebugInterval()
        return
      }

      // Check if video has enough data to start playing
      // HAVE_METADATA (1) - basic info loaded
      // HAVE_CURRENT_DATA (2) - current frame loaded
      // HAVE_FUTURE_DATA (3) - enough data to play a bit
      // HAVE_ENOUGH_DATA (4) - enough data to play through
      const minReadyState = isMobile ? 2 : 1 // Higher threshold for mobile

      if (bgVideo.readyState >= minReadyState) {
        playAttempts++

        // Show background video immediately for frame-perfect transition
        showBackgroundVideo()

        bgVideo
          .play()
          .then(() => {
            hasStartedPlaying = true
            // Hide event video immediately for instant frame-perfect transition
            // No delay needed since video frames are designed to connect seamlessly
            hideEventVideos()
          })
          .catch((error) => {
            // More aggressive retry strategy for problematic browsers
            const retryDelay = isMobile ? 1500 : 1000
            setTimeout(() => {
              if (!hasStartedPlaying) {
                // Force reload if multiple attempts failed
                if (playAttempts > 3 && bgVideo.src) {
                  bgVideo.load()
                }
                tryPlayBackgroundVideo()
              }
            }, retryDelay)
          })
      } else {
        const checkDelay = isMobile ? 800 : 500
        setTimeout(() => {
          if (!hasStartedPlaying) {
            tryPlayBackgroundVideo()
          }
        }, checkDelay)
      }
    }

    return {
      tryPlay: tryPlayBackgroundVideo,
      startDebugInterval,
      clearDebugInterval,
      hasStartedPlaying: () => hasStartedPlaying,
      setStartedPlaying: (value: boolean) => {
        hasStartedPlaying = value
      },
    }
  }

  const createBackgroundVideoEventHandlers = (
    playbackManager: ReturnType<typeof createBackgroundVideoPlaybackManager>,
  ) => {
    return {
      handleLoadStart: () => {
        // Background video loading started
      },

      handleLoadedMetadata: () => {
        playbackManager.tryPlay()
      },

      handleCanPlay: () => {
        playbackManager.tryPlay()
      },

      handleCanPlayThrough: () => {
        playbackManager.tryPlay()
      },

      handleProgress: () => {
        playbackManager.tryPlay()
      },

      handleStalled: () => {
        setTimeout(() => {
          if (!playbackManager.hasStartedPlaying()) {
            playbackManager.tryPlay()
          }
        }, 2000)
      },

      handleWaiting: () => {
        // Background video waiting for data
      },

      handlePlaying: () => {
        playbackManager.setStartedPlaying(true)
        // Hide event videos when background video starts playing
        videoManager.setVisibility(videoRefs.eventVideoPreloader(), false)
        videoManager.setVisibility(videoRefs.sequentialVideoContainer(), false)
      },

      handleError: (e: Event) => {
        playbackManager.clearDebugInterval()
      },

      handleSuspend: (bgVideo: HTMLVideoElement) => {
        setTimeout(() => {
          if (!playbackManager.hasStartedPlaying() && bgVideo.paused) {
            bgVideo.load()
            playbackManager.tryPlay()
          }
        }, 3000)
      },
    }
  }

  const playBackgroundVideo = () => {
    if (!props.backgroundVideoUrl) {
      // No background video, just keep the event video frozen
      return
    }

    const bgVideo = videoRefs.backgroundVideoElement()
    if (!bgVideo) {
      // No background video element available
      return
    }

    // Start loading background video if not already loaded
    if (!bgVideo.src) {
      loadBackgroundVideo()
    }

    // Create playback manager and event handlers
    const playbackManager = createBackgroundVideoPlaybackManager(bgVideo)
    const eventHandlers = createBackgroundVideoEventHandlers(playbackManager)

    // Try to play immediately if video is ready
    playbackManager.tryPlay()

    // Start debug monitoring
    playbackManager.startDebugInterval()

    // Set up event listeners - background video loads silently behind event video
    addVideoEventListener(bgVideo, 'loadstart', eventHandlers.handleLoadStart)
    addVideoEventListener(bgVideo, 'loadedmetadata', eventHandlers.handleLoadedMetadata)
    addVideoEventListener(bgVideo, 'canplay', eventHandlers.handleCanPlay)
    addVideoEventListener(bgVideo, 'canplaythrough', eventHandlers.handleCanPlayThrough)
    addVideoEventListener(bgVideo, 'progress', eventHandlers.handleProgress)
    addVideoEventListener(bgVideo, 'stalled', eventHandlers.handleStalled)
    addVideoEventListener(bgVideo, 'suspend', () => eventHandlers.handleSuspend(bgVideo))
    addVideoEventListener(bgVideo, 'waiting', eventHandlers.handleWaiting)
    addVideoEventListener(bgVideo, 'playing', () => {
      eventHandlers.handlePlaying()
      playbackManager.clearDebugInterval()
    })
    addVideoEventListener(bgVideo, 'error', (e) => {
      eventHandlers.handleError(e)
      playbackManager.clearDebugInterval()
    })
  }

  // Enhanced video state initialization with resource management
  const initializeVideoState = () => {
    // Register cover video if available
    const coverVideo = videoRefs.coverVideoElement()
    if (coverVideo) {
      registerVideoForCleanup(coverVideo, 'cover-video')
    }

    // Register sequential video container
    const sequentialVideo = videoRefs.sequentialVideoContainer()
    if (sequentialVideo) {
      registerVideoForCleanup(sequentialVideo, 'sequential-video')
    }

    // Setup Safari timeout for envelope button
    setupSafariVideoTimeout()

    // Start parallel loading with mobile consideration
    if (props.eventVideoUrl || props.backgroundVideoUrl) {
      // Delay loading slightly on mobile to ensure UI is ready
      if (isMobile) {
        setTimeout(() => {
          startParallelVideoLoading()
        }, 200)
      } else {
        startParallelVideoLoading()
      }
    }

    // Stage-specific initialization
    if (props.shouldSkipToMainContent || props.currentShowcaseStage === 'main_content') {
      isContentHidden.value = true
      isCoverVideoPlaying.value = false

      if (props.backgroundVideoUrl) {
        playBackgroundVideo()
      } else {
        currentVideoPhase.value = 'background'
        emit('sequentialVideoEnded')
      }
    } else if (props.currentShowcaseStage === 'event_video') {
      isContentHidden.value = true
      isCoverVideoPlaying.value = false

      if (props.eventVideoUrl) {
        playEventVideo()
      }
    } else {
      currentVideoPhase.value = 'none'
      isCoverVideoPlaying.value = true
      isContentHidden.value = false
    }
  }

  // Handle envelope opening
  const handleOpenEnvelope = () => {
    isContentHidden.value = true

    setTimeout(() => {
      if (props.eventVideoUrl) {
        playEventVideo()
      } else if (props.backgroundVideoUrl) {
        playBackgroundVideo()
      } else {
        emit('sequentialVideoEnded')
      }
    }, 500)
  }

  // Safari timeout for envelope button - don't wait forever on Safari
  const setupSafariVideoTimeout = () => {
    if (!isSafari && !isIOS) return
    if (!props.eventVideoUrl) return

    setTimeout(() => {
      if (!eventVideoReady.value) {
        safariTimeoutReached.value = true
        eventVideoReady.value = true // Mark as ready to allow playback
      }
    }, 5000) // 5 second timeout
  }

  // Computed properties
  const shouldShowButtonLoading = computed(() => {
    // Safari/iOS: Use timeout-based ready state
    if (isSafari || isIOS) {
      return Boolean(props.eventVideoUrl) && !eventVideoReady.value && !safariTimeoutReached.value
    }

    // Chrome/Firefox: Original behavior
    return Boolean(props.eventVideoUrl) && !eventVideoReady.value
  })

  // Watchers
  watch(
    () => props.currentShowcaseStage,
    (newStage) => {
      if (newStage === 'event_video' && currentVideoPhase.value === 'none') {
        isContentHidden.value = true
        if (props.eventVideoUrl) {
          playEventVideo()
        }
      } else if (newStage === 'main_content' && currentVideoPhase.value !== 'background') {
        isContentHidden.value = true
        if (props.backgroundVideoUrl) {
          playBackgroundVideo()
        } else {
          emit('sequentialVideoEnded')
        }
      }
    },
    { immediate: true },
  )

  watch(
    () => props.shouldSkipToMainContent,
    (shouldSkip) => {
      if (shouldSkip) {
        isContentHidden.value = true
        isCoverVideoPlaying.value = false

        if (props.backgroundVideoUrl) {
          playBackgroundVideo()
        } else {
          currentVideoPhase.value = 'background'
          emit('sequentialVideoEnded')
        }
      }
    },
    { immediate: true },
  )

  watch(
    () => props.videoStatePreserved,
    (isPreserved) => {
      if (isPreserved) {
        // When video state is being preserved, start parallel loading
        startParallelVideoLoading()
        nextTick(() => {
          initializeVideoState()
        })
      }
    },
    { immediate: true },
  )

  watch(isCoverVideoPlaying, async (isPlaying) => {
    const coverVideo = videoRefs.coverVideoElement()
    if (coverVideo) {
      // Ensure video is registered for cleanup
      registerVideoForCleanup(coverVideo, 'cover-video-watcher')

      if (isPlaying) {
        try {
          // Mobile-specific play handling
          if (isMobile) {
            videoManager.setupForPlayback(coverVideo, true, true) // Muted and looped
          }
          await coverVideo.play()
        } catch (error) {
          // Cover video play failed
        }
      } else {
        coverVideo.pause()
      }
    }
  })

  // Enhanced cleanup on component unmount
  onUnmounted(async () => {
    await cleanupAllVideoResources()
  })

  const startEventVideo = () => {
    playEventVideo()
  }

  return {
    // State
    currentVideoPhase: readonly(currentVideoPhase),
    eventVideoReady: readonly(eventVideoReady),
    isCoverVideoPlaying,
    isContentHidden,

    // Computed
    shouldShowButtonLoading,

    // Methods
    handleEventVideoPreloaded,
    handleEventVideoReady,
    handleCoverVideoLoaded,
    handleBackgroundVideoPreloaded,
    handleBackgroundVideoReady,
    handleSequentialVideoEnded,
    handleSequentialVideoError,
    playEventVideo,
    playBackgroundVideo,
    handleOpenEnvelope,
    initializeVideoState,
    cleanupAllVideoResources,
    startEventVideo,
  }
}
