import { ref, computed, onUnmounted, nextTick, watch, readonly } from 'vue'
import { useVideoResourceManager, type RegisterVideoOptions } from './useVideoResourceManager'
import { isInMemoryMediaUrl, resolveMediaUrl } from '@/utils/mediaUrl'

export type VideoPhase = 'none' | 'event' | 'background'
export type ShowcaseStage = 'cover' | 'transition' | 'event_video' | 'main_content'

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
  const registerVideoForCleanup = (
    video: HTMLVideoElement,
    identifier?: string,
    options?: RegisterVideoOptions,
  ) => {
    videoResourceManager.registerVideo(video, identifier, options)
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
      // Timers this composable owns outlive the elements they poll — a keyed
      // remount (every template switch in the preview) would otherwise leave
      // the outgoing instance's readiness poll and stall watchdog running
      // against a detached <video>.
      clearBackgroundStallTimer()
      backgroundPlaybackManager?.dispose()
      backgroundPlaybackManager = null

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

    } catch {
      // Ensure state is cleared even if cleanup fails
      videoDownloadPromises.clear()
      preloadedVideos.clear()
    }
  }

  /**
   * The absolute URL to point a <video> at.
   *
   * Delegates to the shared resolver rather than prefixing the API base by
   * hand, because "not http" is not the same as "relative path": the template
   * studio previews a just-picked, not-yet-uploaded file as a `blob:` object
   * URL, and the hand-rolled check turned that into
   * `http://api-host/media/blob:http://host/uuid`, which 404s. That is why a
   * standard template's background video stayed invisible in the live preview
   * while the cover video — which the markup points at directly, with no
   * resolution step of its own — showed up fine.
   */
  const resolveVideoUrl = (videoUrl: string): string => resolveMediaUrl(videoUrl) ?? videoUrl

  // Enhanced video download with mobile optimizations and resource management
  const forceFullVideoDownload = async (videoUrl: string, videoType: 'event' | 'background') => {
    try {
      // Get the full URL if it's relative
      const fullUrl = resolveVideoUrl(videoUrl)

      // A file the user picked but hasn't uploaded (the template studio's
      // object URLs): the bytes are already in memory, so there is nothing to
      // download — fetching one only to hand back a second blob URL for the
      // same data wastes it, and the low-memory HEAD size check below can't
      // read a content-length off it at all.
      if (isInMemoryMediaUrl(fullUrl)) {
        preloadedVideos.add(videoUrl)
        return fullUrl
      }

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
        } catch {
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
    } catch {
      videoDownloadPromises.delete(videoUrl)
      return null
    }
  }

  /**
   * How long a background video may make NO progress at all before it is worth
   * starting its download over.
   *
   * Deliberately long, and deliberately the only reload there is. `load()` runs
   * the media load algorithm, which ABORTS the in-flight fetch and resets
   * readyState to 0 — so every reload throws away everything downloaded so far.
   * On a fast link that is invisible; on a slow one it is the difference
   * between a video that eventually plays and one that can never finish. This
   * file previously reloaded from three separate places (a 500ms readyState
   * check, a 3s `suspend` timer that re-armed itself, and a play-failure
   * counter), which on a phone connection restarted the same download every few
   * seconds, forever.
   */
  const BACKGROUND_STALL_RECOVERY_MS = 20000

  let backgroundStallTimer: ReturnType<typeof setTimeout> | null = null
  let backgroundReloadUsed = false

  const clearBackgroundStallTimer = () => {
    if (backgroundStallTimer) clearTimeout(backgroundStallTimer)
    backgroundStallTimer = null
  }

  /**
   * The one recovery reload, armed once per source.
   *
   * Only fires when NOTHING has arrived — no readyState, no buffered range. A
   * video that is slowly filling its buffer is working, and restarting it is
   * strictly worse than waiting.
   */
  const armBackgroundStallRecovery = (bgVideo: HTMLVideoElement) => {
    if (backgroundReloadUsed) return
    clearBackgroundStallTimer()
    backgroundStallTimer = setTimeout(() => {
      backgroundStallTimer = null
      if (backgroundReloadUsed) return
      if (bgVideo.readyState > 0 || bgVideo.buffered.length > 0) return
      backgroundReloadUsed = true
      bgVideo.load()
    }, BACKGROUND_STALL_RECOVERY_MS)
  }

  // Background video loading with progressive streaming and resource management
  const loadBackgroundVideo = async () => {
    if (!props.backgroundVideoUrl) return

    const bgVideo = videoRefs.backgroundVideoElement()
    if (!bgVideo) return

    // Registered, but never auto-torn-down: this is the one video with no
    // fallback behind it (see RegisterVideoOptions).
    registerVideoForCleanup(bgVideo, 'background-video', { autoTeardownOnFailure: false })

    // Check if already loading or loaded
    if (bgVideo.src && bgVideo.readyState > 0) {
      return
    }

    // Emit event that background video loading has started
    emit('backgroundVideoLoadStarted')

    // Use progressive streaming for background video
    const fullUrl = resolveVideoUrl(props.backgroundVideoUrl)

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

    // A single bounded recovery, and only if nothing arrives at all. There used
    // to be an unconditional `load()` here at 500ms: on any connection slower
    // than a desk, readyState is ALWAYS still 0 at 500ms for a multi-megabyte
    // file, so that reload fired every time and restarted the download from
    // zero — worst of all against an MP4 whose moov atom sits at the end, where
    // readyState cannot reach 1 until nearly the whole file has arrived.
    armBackgroundStallRecovery(bgVideo)
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

  /**
   * Whether this showcase will ever play the middle-stage film.
   *
   * A stage that starts at the invitation has already passed that beat and will
   * never go back to it — yet `startParallelVideoLoading` used to `fetch()` the
   * whole file into a blob regardless. On the catalogue's Main Content frame
   * that is an entire video downloaded to memory, never decoded, never shown,
   * competing for the same connection as the background video the frame does
   * need; with several frames mounted at once it is several of them. On a slow
   * link that alone can keep the background video from arriving.
   */
  const willPlayEventVideo = (): boolean =>
    !props.shouldSkipToMainContent && props.currentShowcaseStage !== 'main_content'

  // Enhanced parallel video loading with mobile resource management
  const startParallelVideoLoading = async () => {
    const loadPromises: Promise<void>[] = []

    // Load event video if available, and if this stage can still reach it
    if (props.eventVideoUrl && willPlayEventVideo()) {
      const eventLoadPromise = (async () => {
        try {
          emit('eventVideoLoadStarted')
          const eventBlobUrl = await forceFullVideoDownload(props.eventVideoUrl!, 'event')
          if (eventBlobUrl && videoRefs.eventVideoPreloader()) {
            const eventVideo = videoRefs.eventVideoPreloader()!
            registerVideoForCleanup(eventVideo, 'event-video-preloader')
            eventVideo.src = eventBlobUrl
          }
        } catch {
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
        } catch {
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

    // DON'T stop cover video yet - keep it playing until event video frames are visible
    // This prevents the primary background color from flashing during the transition
    // isCoverVideoPlaying.value = false  // <-- Moved to after frames are visible
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

    // Set source if using sequential container, or if the preloader was never
    // given one — a stage that did not expect to reach this beat skips the
    // preload entirely (see willPlayEventVideo), so falling back to streaming
    // the URL directly is what keeps that decision safe rather than load-bearing.
    if (!videoToUse.src && props.eventVideoUrl) {
      videoToUse.src = resolveVideoUrl(props.eventVideoUrl)
    }

    // Fallback timeout in case timeupdate doesn't fire (edge cases)
    let fallbackTimeout: ReturnType<typeof setTimeout> | null = null

    // Use timeupdate event instead of playing event to ensure frames are actually rendered
    // The 'playing' event fires when playback starts, but frames may not be painted yet
    // The 'timeupdate' event fires when currentTime changes, meaning frames are rendering
    const onVideoTimeUpdate = () => {
      // Wait until video has progressed slightly to ensure frames are painted
      if (videoToUse.currentTime > 0.01) {
        videoToUse.removeEventListener('timeupdate', onVideoTimeUpdate)
        if (fallbackTimeout) {
          clearTimeout(fallbackTimeout)
          fallbackTimeout = null
        }
        // NOW stop cover video and trigger animation - event video frames are visible
        isCoverVideoPlaying.value = false
        isContentHidden.value = true
      }
    }
    videoToUse.addEventListener('timeupdate', onVideoTimeUpdate)

    fallbackTimeout = setTimeout(() => {
      videoToUse.removeEventListener('timeupdate', onVideoTimeUpdate)
      isCoverVideoPlaying.value = false
      isContentHidden.value = true
      fallbackTimeout = null
    }, 500)

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
            } catch {
              // Could not unmute video
            }
          }, 500)
        }
      } catch {
        // If video fails to play, still hide content to show fallback
        clearTimeout(fallbackTimeout)
        videoToUse.removeEventListener('timeupdate', onVideoTimeUpdate)
        isCoverVideoPlaying.value = false
        isContentHidden.value = true
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
    /**
     * Bounds the "not enough data yet, look again shortly" poll.
     *
     * It used to be unbounded: `playAttempts` is only incremented on the branch
     * that actually calls `play()`, so a video that never cleared the readiness
     * bar re-armed this timer every 800ms for the life of the page — a timer
     * leak, and one that kept a dead video looking like a pending one.
     *
     * A deadline rather than a call count, because this branch is reached from
     * the media events too (`progress` alone can fire several times a second
     * for the whole of a long download), and a count would be spent by a video
     * that is downloading perfectly well. Ten minutes is far more than any real
     * connection needs and still terminates. Giving up stops only the polling —
     * `loadedmetadata` and `canplay` still call straight through to `play()`,
     * which is the primary path; this was always the fallback for events that
     * never arrive.
     */
    const POLL_DEADLINE_MS = 600000
    let pollDeadline = 0
    let readinessTimer: ReturnType<typeof setTimeout> | null = null

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
      //
      // HAVE_METADATA everywhere, phones included. Mobile used to demand
      // HAVE_CURRENT_DATA — a decoded frame — which is a bar a slow connection
      // can take a long time to clear, and while it waited nothing was on
      // screen but the flat background. `play()` is allowed to be called at
      // HAVE_METADATA and is what buffering was designed for: the browser
      // fetches what it needs and starts when it can, instead of this poll
      // guessing when that moment arrived.
      const minReadyState = 1

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
          .catch((_error) => {
            // Retry the PLAY, never the download. A rejected play() is an
            // autoplay-policy or transient-state failure and says nothing about
            // the bytes; the `bgVideo.load()` that used to fire here after the
            // third attempt threw away the whole buffer to fix a problem that
            // was never in the buffer. Genuine "nothing is arriving" is handled
            // once, by armBackgroundStallRecovery.
            const retryDelay = isMobile ? 1500 : 1000
            setTimeout(() => {
              if (!hasStartedPlaying) tryPlayBackgroundVideo()
            }, retryDelay)
          })
      } else {
        if (!pollDeadline) pollDeadline = Date.now() + POLL_DEADLINE_MS
        if (Date.now() >= pollDeadline) {
          clearDebugInterval()
          return
        }
        const checkDelay = isMobile ? 800 : 500
        if (readinessTimer) clearTimeout(readinessTimer)
        readinessTimer = setTimeout(() => {
          readinessTimer = null
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
      /** Every timer this manager owns, for unmount. */
      dispose: () => {
        clearDebugInterval()
        if (readinessTimer) clearTimeout(readinessTimer)
        readinessTimer = null
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

      handleProgressBytes: (bgVideo: HTMLVideoElement) => {
        // Bytes are arriving, so the "nothing at all has come back" watchdog
        // is answered and must not fire — it would abort a download that is
        // working.
        if (bgVideo.buffered.length > 0) clearBackgroundStallTimer()
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

      handleError: (_e: Event) => {
        playbackManager.clearDebugInterval()
      },

      /**
       * `suspend` means the browser has stopped fetching for now — which it
       * does routinely while buffering a large file on a constrained link, and
       * again every time `load()` is called.
       *
       * This used to reload the video 3 seconds later whenever playback had not
       * started. That was a self-sustaining loop: the reload aborted the
       * in-flight fetch, reset readyState to 0, and eventually fired another
       * `suspend`, which armed the next reload. On a fast connection playback
       * began before the first timer and nobody ever saw it; on a slow one the
       * download restarted every few seconds and could never finish, so the
       * invitation rendered over a bare background forever. That is the whole
       * bug. Try to PLAY — which is free and may be exactly what a suspended,
       * partially-buffered video is waiting for — and never re-fetch.
       */
      handleSuspend: (_bgVideo: HTMLVideoElement) => {
        if (!playbackManager.hasStartedPlaying()) playbackManager.tryPlay()
      },
    }
  }

  // Guards the one deferred retry below so a genuinely absent element can't
  // schedule an unbounded nextTick loop.
  let backgroundPlayDeferred = false

  /** The single playback manager for this composable's background video. */
  let backgroundPlaybackManager: ReturnType<
    typeof createBackgroundVideoPlaybackManager
  > | null = null

  const playBackgroundVideo = () => {
    if (!props.backgroundVideoUrl) {
      // No background video, just keep the event video frozen
      return
    }

    const bgVideo = videoRefs.backgroundVideoElement()
    if (!bgVideo) {
      // Called before VideoContainer mounted. This composable is created — and
      // initializeVideoState plus the immediate watchers below all run — during
      // CoverStage's setup, so any stage that STARTS past the cover asks to play
      // a <video> that doesn't exist yet, and the request was previously dropped
      // on the floor: the manage-page preview's Main Content frame (forced
      // straight to `main_content`) and a returning guest skipped past the cover
      // both ended up showing the main content over the bare primary colour with
      // no background video behind it. Retry once the refs are populated.
      if (!backgroundPlayDeferred) {
        backgroundPlayDeferred = true
        nextTick(() => {
          backgroundPlayDeferred = false
          playBackgroundVideo()
        })
      }
      return
    }

    // Start loading background video if not already loaded
    if (!bgVideo.src) {
      loadBackgroundVideo()
    }

    // One manager per element, ever. This function is reachable from four
    // places — initializeVideoState, both immediate watchers, and the event
    // video ending — and each call used to build a fresh manager and register a
    // second, third, fourth full set of listeners on the same <video>. Every
    // duplicate `progress` and `suspend` then drove its own retry schedule
    // against the same element, multiplying exactly the traffic this change
    // exists to stop.
    if (backgroundPlaybackManager) {
      backgroundPlaybackManager.tryPlay()
      return
    }

    // Create playback manager and event handlers
    const playbackManager = createBackgroundVideoPlaybackManager(bgVideo)
    backgroundPlaybackManager = playbackManager
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
    addVideoEventListener(bgVideo, 'progress', () => {
      eventHandlers.handleProgressBytes(bgVideo)
      eventHandlers.handleProgress()
    })
    addVideoEventListener(bgVideo, 'stalled', eventHandlers.handleStalled)
    addVideoEventListener(bgVideo, 'suspend', () => eventHandlers.handleSuspend(bgVideo))
    addVideoEventListener(bgVideo, 'waiting', eventHandlers.handleWaiting)
    addVideoEventListener(bgVideo, 'playing', () => {
      eventHandlers.handlePlaying()
      clearBackgroundStallTimer()
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

  // Skip directly to main content (for basic mode)
  const skipToMainContent = () => {
    // Hide the cover content
    isContentHidden.value = true

    // Set video phase to background to show main content
    setTimeout(() => {
      currentVideoPhase.value = 'background'
      isCoverVideoPlaying.value = false
      emit('sequentialVideoEnded')
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
        } catch {
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
    skipToMainContent,
    initializeVideoState,
    cleanupAllVideoResources,
    startEventVideo,
  }
}
