import { ref, computed, onUnmounted, nextTick, watch, readonly, type Ref } from 'vue'

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

// Basic device detection
const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
  navigator.userAgent,
)
const isLowEndDevice = (navigator as any).deviceMemory
  ? (navigator as any).deviceMemory <= 2
  : navigator.hardwareConcurrency <= 2

// Development logging utility - disabled
const isDevelopment = false // Completely disabled
const devLog = (message: string, ...args: any[]) => {
  // Logging disabled
}
const devWarn = (message: string, ...args: any[]) => {
  // Logging disabled
}
const devError = (message: string, ...args: any[]) => {
  // Logging disabled
}

export function useCoverStageVideo(
  videoRefs: VideoElementRefs,
  props: VideoProps,
  emit: (event: keyof VideoEmits, ...args: any[]) => void,
) {
  // Video state management
  const currentVideoPhase = ref<VideoPhase>('none')
  const eventVideoPreloaded = ref(false)
  const eventVideoReady = ref(false)
  const backgroundVideoPreloaded = ref(false)
  const backgroundVideoReady = ref(false)

  // Video state control
  const isCoverVideoPlaying = ref(
    !props.shouldSkipToMainContent && props.currentShowcaseStage !== 'main_content',
  )
  const isContentHidden = ref(false)

  // Store blob URLs for cleanup with proper tracking
  const videoBlobUrls = ref<Map<string, string>>(new Map())
  const videoDownloadPromises = new Map<string, Promise<string | null>>()
  const preloadedVideos = new Set<string>()

  // Video resource manager with WeakMap for automatic memory management
  const videoListenerRefs = new WeakMap<
    HTMLVideoElement,
    Array<{ event: string; handler: EventListener; controller: AbortController }>
  >()

  // Track all video elements for guaranteed cleanup
  const trackedVideoElements = new Set<HTMLVideoElement>()

  const addVideoEventListener = (
    video: HTMLVideoElement,
    event: string,
    handler: EventListener,
  ) => {
    const controller = new AbortController()
    video.addEventListener(event, handler, { signal: controller.signal })

    if (!videoListenerRefs.has(video)) {
      videoListenerRefs.set(video, [])
    }
    videoListenerRefs.get(video)?.push({ event, handler, controller })

    // Track this video element for cleanup
    trackedVideoElements.add(video)
  }

  // Centralized video element management
  const createVideoElementManager = () => {
    const cleanupVideoElement = (video: HTMLVideoElement | null) => {
      if (!video) return

      // Remove from tracked elements
      trackedVideoElements.delete(video)

      // Abort all event listeners for this video element
      const listeners = videoListenerRefs.get(video)
      if (listeners) {
        listeners.forEach(({ controller }) => {
          try {
            controller.abort()
          } catch (e) {
            // Ignore abort errors
          }
        })
        videoListenerRefs.delete(video)
      }

      // Cleanup video resources with enhanced error handling
      try {
        // First pause to stop any pending operations
        if (!video.paused) {
          video.pause()
        }

        // Clear the source URL if it's a blob
        const currentSrc = video.currentSrc || video.src
        if (currentSrc && currentSrc.startsWith('blob:')) {
          // Revoke the blob URL to free memory
          URL.revokeObjectURL(currentSrc)

          // Also check our blob URL map
          videoBlobUrls.value.forEach((blobUrl, key) => {
            if (blobUrl === currentSrc) {
              videoBlobUrls.value.delete(key)
            }
          })
        }

        // Clear the video source
        video.removeAttribute('src')
        video.srcObject = null
        video.load() // Reset the video element
      } catch (error) {
        // Silently handle cleanup errors
      }
    }

    const setVideoVisibility = (
      video: HTMLVideoElement | null,
      visible: boolean,
      zIndex?: string,
    ) => {
      if (!video) return
      video.style.opacity = visible ? '1' : '0'
      if (zIndex) {
        video.style.zIndex = zIndex
      }
    }

    const setupVideoForPlayback = (
      video: HTMLVideoElement,
      muted: boolean = false,
      loop: boolean = false,
    ) => {
      video.muted = muted
      video.loop = loop
      video.style.pointerEvents = 'none'
    }

    return {
      cleanup: cleanupVideoElement,
      setVisibility: setVideoVisibility,
      setupForPlayback: setupVideoForPlayback,
    }
  }

  const videoManager = createVideoElementManager()

  const cleanupAllVideoResources = () => {
    // Cleanup all tracked video elements
    trackedVideoElements.forEach((video) => {
      videoManager.cleanup(video)
    })
    trackedVideoElements.clear()

    // Cleanup specific video refs as backup
    videoManager.cleanup(videoRefs.eventVideoPreloader())
    videoManager.cleanup(videoRefs.sequentialVideoContainer())
    videoManager.cleanup(videoRefs.coverVideoElement())
    videoManager.cleanup(videoRefs.backgroundVideoElement())

    // Cleanup all blob URLs with enhanced tracking
    videoBlobUrls.value.forEach((blobUrl) => {
      try {
        URL.revokeObjectURL(blobUrl)
      } catch (error) {
        // Silently handle revocation errors
      }
    })
    videoBlobUrls.value.clear()

    // Clear download promises to prevent memory leaks
    videoDownloadPromises.clear()
    preloadedVideos.clear()

    // Force garbage collection hint for mobile browsers
    if (isMobile && typeof window !== 'undefined' && 'gc' in window) {
      try {
        ;(window as any).gc()
      } catch (e) {
        // Ignore GC errors
      }
    }
  }

  // Video download with device optimization and deduplication
  const forceFullVideoDownload = async (videoUrl: string, videoType: 'event' | 'background') => {
    try {
      // Check if already downloaded
      const existingBlob = videoBlobUrls.value.get(videoUrl)
      if (existingBlob) {
        return existingBlob
      }

      // Check if download is already in progress
      const existingPromise = videoDownloadPromises.get(videoUrl)
      if (existingPromise) {
        return await existingPromise
      }

      // Skip background video for low-end devices
      if (videoType === 'background' && isLowEndDevice) {
        return null
      }

      // Get the full URL if it's relative
      const fullUrl = videoUrl.startsWith('http')
        ? videoUrl
        : `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}${videoUrl.startsWith('/') ? videoUrl : `/media/${videoUrl}`}`

      // Basic fetch configuration
      const fetchOptions: RequestInit = {}

      // Mobile optimizations
      if (isMobile) {
        fetchOptions.cache = 'force-cache'
        fetchOptions.keepalive = true
      }

      // Skip large videos on low-end devices
      if (isLowEndDevice) {
        const headResponse = await fetch(fullUrl, { ...fetchOptions, method: 'HEAD' })
        const contentLength = headResponse.headers.get('content-length')
        const videoSizeInMB = contentLength ? parseInt(contentLength) / (1024 * 1024) : 0

        if (videoSizeInMB > 10) {
          return null
        }
      }

      // Create and store the download promise for deduplication
      const downloadPromise = (async () => {
        const response = await fetch(fullUrl, fetchOptions)

        if (!response.ok) {
          throw new Error(`Failed to fetch ${videoType} video: ${response.status}`)
        }

        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)
        videoBlobUrls.value.set(videoUrl, blobUrl)
        preloadedVideos.add(videoUrl)

        return blobUrl
      })()

      videoDownloadPromises.set(videoUrl, downloadPromise)
      const result = await downloadPromise
      videoDownloadPromises.delete(videoUrl) // Clean up promise after completion

      return result
    } catch (error) {
      videoDownloadPromises.delete(videoUrl) // Clean up on error
      return null
    }
  }

  // Background video loading with progressive streaming
  const loadBackgroundVideo = async () => {
    if (!props.backgroundVideoUrl) return

    const bgVideo = videoRefs.backgroundVideoElement()
    if (!bgVideo) return

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

    // Set the source directly for progressive download
    bgVideo.src = fullUrl
    bgVideo.preload = 'auto'
    bgVideo.load()

    devLog('Background video load initiated:', fullUrl)
  }

  // Event video preloading handlers
  const handleEventVideoPreloaded = () => {
    if (eventVideoPreloaded.value) return
    eventVideoPreloaded.value = true
    emit('eventVideoPreloaded')
  }

  const handleEventVideoReady = () => {
    if (eventVideoReady.value) return
    eventVideoReady.value = true
    emit('eventVideoReady')
    // Background video is already loading in parallel, no need to start here
  }

  // Parallel video loading for improved performance
  const startParallelVideoLoading = async () => {
    const loadPromises: Promise<void>[] = []

    // Load event video if available
    if (props.eventVideoUrl) {
      const eventLoadPromise = (async () => {
        emit('eventVideoLoadStarted')
        const eventBlobUrl = await forceFullVideoDownload(props.eventVideoUrl, 'event')
        if (eventBlobUrl && videoRefs.eventVideoPreloader()) {
          videoRefs.eventVideoPreloader()!.src = eventBlobUrl
        }
      })()
      loadPromises.push(eventLoadPromise)
    }

    // Load background video if available (in parallel)
    if (props.backgroundVideoUrl && !isLowEndDevice) {
      const bgLoadPromise = (async () => {
        // Small delay to prioritize event video slightly
        await new Promise(resolve => setTimeout(resolve, 100))
        await loadBackgroundVideo()
      })()
      loadPromises.push(bgLoadPromise)
    }

    // Wait for all videos to load in parallel
    await Promise.allSettled(loadPromises)
  }

  // Event video loading (can be called independently)
  const loadEventVideo = async () => {
    if (!props.eventVideoUrl) return

    // Check if already loading via parallel system
    if (videoDownloadPromises.has(props.eventVideoUrl)) {
      await videoDownloadPromises.get(props.eventVideoUrl)
      return
    }

    // Emit event that event video loading has started
    emit('eventVideoLoadStarted')

    const eventBlobUrl = await forceFullVideoDownload(props.eventVideoUrl, 'event')
    if (eventBlobUrl && videoRefs.eventVideoPreloader()) {
      videoRefs.eventVideoPreloader()!.src = eventBlobUrl
    }
  }

  // Cover video loaded handler - start parallel loading of other videos
  const handleCoverVideoLoaded = () => {
    startParallelVideoLoading()
  }

  // Event to trigger background video loading externally
  const triggerBackgroundVideoLoad = () => {
    loadBackgroundVideo()
  }

  // Background video handlers
  const handleBackgroundVideoPreloaded = () => {
    if (backgroundVideoPreloaded.value) return
    backgroundVideoPreloaded.value = true
  }

  const handleBackgroundVideoReady = () => {
    if (backgroundVideoReady.value) return
    backgroundVideoReady.value = true
  }

  // Sequential video handlers
  const handleSequentialVideoEnded = () => {
    if (currentVideoPhase.value === 'event') {
      // Event video ended, keep it visible (paused at last frame) while background loads
      // Don't hide the event video here, let playBackgroundVideo handle the transition
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
    if (!videoToUse) return

    // Setup video for playback
    videoManager.setupForPlayback(videoToUse, false, false)
    videoManager.setVisibility(videoToUse, true, '10')

    // Set source if using sequential container
    if (videoToUse === videoRefs.sequentialVideoContainer() && props.eventVideoUrl) {
      videoToUse.src = props.eventVideoUrl
    }

    videoToUse.play().catch(() => {
      handleSequentialVideoEnded()
    })

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

        const bufferedRanges = []
        for (let i = 0; i < bgVideo.buffered.length; i++) {
          bufferedRanges.push(`${bgVideo.buffered.start(i)}-${bgVideo.buffered.end(i)}`)
        }

        devLog('Background video state:', {
          readyState: bgVideo.readyState,
          networkState: bgVideo.networkState,
          paused: bgVideo.paused,
          currentTime: bgVideo.currentTime,
          buffered: bufferedRanges.join(', '),
          src: bgVideo.src ? 'set' : 'not set',
        })
      }, 5000) // Check every 5 seconds
    }

    const tryPlayBackgroundVideo = () => {
      if (hasStartedPlaying) return

      if (playAttempts >= maxPlayAttempts) {
        devWarn('Max play attempts reached for background video')
        clearDebugInterval()
        return
      }

      // Check if video has enough data to start playing
      if (bgVideo.readyState >= 1) {
        playAttempts++
        showBackgroundVideo()

        bgVideo
          .play()
          .then(() => {
            hasStartedPlaying = true
            devLog('Background video started playing successfully')
            hideEventVideos()
          })
          .catch((error) => {
            devWarn(`Background video play attempt ${playAttempts} failed, will retry:`, error)
            setTimeout(() => {
              if (!hasStartedPlaying) {
                tryPlayBackgroundVideo()
              }
            }, 1000)
          })
      } else {
        devLog(`Background video not ready, readyState: ${bgVideo.readyState}`)
        setTimeout(() => {
          if (!hasStartedPlaying) {
            tryPlayBackgroundVideo()
          }
        }, 500)
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
        devLog('Background video started loading')
      },

      handleLoadedMetadata: (bgVideo: HTMLVideoElement) => {
        devLog(`Background video metadata loaded - duration: ${bgVideo.duration}s`)
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

      handleStalled: (bgVideo: HTMLVideoElement) => {
        devWarn(
          `Background video stalled at readyState: ${bgVideo.readyState}, buffered: ${bgVideo.buffered.length > 0 ? bgVideo.buffered.end(0) : 0}s`,
        )
        setTimeout(() => {
          if (!playbackManager.hasStartedPlaying()) {
            playbackManager.tryPlay()
          }
        }, 2000)
      },

      handleWaiting: (bgVideo: HTMLVideoElement) => {
        const bufferedTime = bgVideo.buffered.length > 0 ? bgVideo.buffered.end(0) : 0
        devLog(
          `Background video waiting for data - buffered: ${bufferedTime}s, currentTime: ${bgVideo.currentTime}s`,
        )
      },

      handlePlaying: () => {
        playbackManager.setStartedPlaying(true)
        devLog('Background video is now playing')
        // Hide event videos when background video starts playing
        videoManager.setVisibility(videoRefs.eventVideoPreloader(), false)
        videoManager.setVisibility(videoRefs.sequentialVideoContainer(), false)
      },

      handleError: (e: Event) => {
        const error = (e.target as HTMLVideoElement).error
        devError('Background video error:', error?.message || 'Unknown error', 'Code:', error?.code)
        playbackManager.clearDebugInterval()
      },

      handleSuspend: (bgVideo: HTMLVideoElement) => {
        devWarn('Background video loading suspended by browser')
        setTimeout(() => {
          if (!playbackManager.hasStartedPlaying() && bgVideo.paused) {
            devLog('Attempting to resume background video loading')
            bgVideo.load()
            playbackManager.tryPlay()
          }
        }, 3000)
      },
    }
  }

  const playBackgroundVideo = () => {
    if (!props.backgroundVideoUrl) {
      emit('sequentialVideoEnded')
      return
    }

    const bgVideo = videoRefs.backgroundVideoElement()
    if (!bgVideo) {
      emit('sequentialVideoEnded')
      return
    }

    // Immediately transition to main content stage while background video loads
    currentVideoPhase.value = 'background'
    emit('sequentialVideoEnded')

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

    // Set up event listeners
    addVideoEventListener(bgVideo, 'loadstart', eventHandlers.handleLoadStart)
    addVideoEventListener(bgVideo, 'loadedmetadata', () =>
      eventHandlers.handleLoadedMetadata(bgVideo),
    )
    addVideoEventListener(bgVideo, 'canplay', eventHandlers.handleCanPlay)
    addVideoEventListener(bgVideo, 'canplaythrough', eventHandlers.handleCanPlayThrough)
    addVideoEventListener(bgVideo, 'progress', eventHandlers.handleProgress)
    addVideoEventListener(bgVideo, 'stalled', () => eventHandlers.handleStalled(bgVideo))
    addVideoEventListener(bgVideo, 'suspend', () => eventHandlers.handleSuspend(bgVideo))
    addVideoEventListener(bgVideo, 'waiting', () => eventHandlers.handleWaiting(bgVideo))
    addVideoEventListener(bgVideo, 'playing', () => {
      eventHandlers.handlePlaying()
      playbackManager.clearDebugInterval()
    })
    addVideoEventListener(bgVideo, 'error', eventHandlers.handleError)
  }

  // Initialize video state with parallel loading
  const initializeVideoState = () => {
    // Start parallel loading immediately for better performance
    if (props.eventVideoUrl || props.backgroundVideoUrl) {
      startParallelVideoLoading()
    }

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

  // Computed properties
  const shouldShowButtonLoading = computed(() => {
    return props.eventVideoUrl && !eventVideoReady.value
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

  watch(isCoverVideoPlaying, (isPlaying) => {
    const coverVideo = videoRefs.coverVideoElement()
    if (coverVideo) {
      if (isPlaying) {
        coverVideo.play().catch(() => {})
      } else {
        coverVideo.pause()
      }
    }
  })

  // Cleanup on component unmount
  onUnmounted(() => {
    cleanupAllVideoResources()
  })

  const startEventVideo = () => {
    playEventVideo()
  }

  return {
    // State
    currentVideoPhase: readonly(currentVideoPhase),
    eventVideoPreloaded: readonly(eventVideoPreloaded),
    eventVideoReady: readonly(eventVideoReady),
    backgroundVideoPreloaded: readonly(backgroundVideoPreloaded),
    backgroundVideoReady: readonly(backgroundVideoReady),
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
    triggerBackgroundVideoLoad,
    loadBackgroundVideo,
    loadEventVideo,
    startParallelVideoLoading,
  }
}
