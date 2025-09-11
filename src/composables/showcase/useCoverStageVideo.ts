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
const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
const isLowEndDevice = (navigator as any).deviceMemory ? (navigator as any).deviceMemory <= 2 : navigator.hardwareConcurrency <= 2

export function useCoverStageVideo(
  videoRefs: VideoElementRefs,
  props: VideoProps,
  emit: (event: keyof VideoEmits, ...args: any[]) => void
) {
  // Video state management
  const currentVideoPhase = ref<VideoPhase>('none')
  const eventVideoPreloaded = ref(false)
  const eventVideoReady = ref(false)
  const backgroundVideoPreloaded = ref(false)
  const backgroundVideoReady = ref(false)
  
  // Video state control
  const isCoverVideoPlaying = ref(!props.shouldSkipToMainContent && props.currentShowcaseStage !== 'main_content')
  const isContentHidden = ref(false)
  
  // Store blob URLs for cleanup
  const videoBlobUrls = ref<Map<string, string>>(new Map())

  // Video resource manager with WeakMap
  const videoListenerRefs = new WeakMap<HTMLVideoElement, Array<{ event: string; handler: EventListener; controller: AbortController }>>()

  const addVideoEventListener = (video: HTMLVideoElement, event: string, handler: EventListener) => {
    const controller = new AbortController()
    video.addEventListener(event, handler, { signal: controller.signal })
    
    if (!videoListenerRefs.has(video)) {
      videoListenerRefs.set(video, [])
    }
    videoListenerRefs.get(video)?.push({ event, handler, controller })
  }

  const cleanupVideoElement = (video: HTMLVideoElement | null) => {
    if (!video) return
    
    // Abort all event listeners for this video element
    const listeners = videoListenerRefs.get(video)
    if (listeners) {
      listeners.forEach(({ controller }) => {
        controller.abort()
      })
      videoListenerRefs.delete(video)
    }
    
    // Cleanup video resources with error handling
    try {
      video.pause()
      video.src = ''
      video.load()
      
      // Clear any remaining blob URL if it exists
      const currentSrc = video.currentSrc
      if (currentSrc && currentSrc.startsWith('blob:')) {
        URL.revokeObjectURL(currentSrc)
      }
    } catch (error) {
      // Silently handle cleanup errors
    }
  }

  const cleanupAllVideoResources = () => {
    // Cleanup all video elements
    cleanupVideoElement(videoRefs.eventVideoPreloader())
    cleanupVideoElement(videoRefs.sequentialVideoContainer())
    cleanupVideoElement(videoRefs.coverVideoElement())
    cleanupVideoElement(videoRefs.backgroundVideoElement())
    
    // Cleanup all blob URLs
    videoBlobUrls.value.forEach((blobUrl) => {
      try {
        URL.revokeObjectURL(blobUrl)
      } catch (error) {
        // Silently handle revocation errors
      }
    })
    videoBlobUrls.value.clear()
    
    // Force garbage collection hint for mobile browsers
    if (isMobile && typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc()
    }
  }

  // Video download with device optimization
  const forceFullVideoDownload = async (videoUrl: string, videoType: 'event' | 'background') => {
    try {
      // Check if already downloaded
      const existingBlob = videoBlobUrls.value.get(videoUrl)
      if (existingBlob) {
        return existingBlob
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
      
      const response = await fetch(fullUrl, fetchOptions)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${videoType} video: ${response.status}`)
      }
      
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      videoBlobUrls.value.set(videoUrl, blobUrl)
      
      return blobUrl
    } catch (error) {
      return null
    }
  }

  // Background video loading (triggered after event video is ready)
  const loadBackgroundVideo = async () => {
    if (!props.backgroundVideoUrl) return
    
    // Emit event that background video loading has started
    emit('backgroundVideoLoadStarted')
    
    const bgBlobUrl = await forceFullVideoDownload(props.backgroundVideoUrl, 'background')
    if (bgBlobUrl && videoRefs.backgroundVideoElement()) {
      videoRefs.backgroundVideoElement()!.src = bgBlobUrl
    }
  }

  // Event video preloading handlers
  const handleEventVideoPreloaded = () => {
    if (eventVideoPreloaded.value) return
    eventVideoPreloaded.value = true
    emit('eventVideoPreloaded')
  }

  // Handler for event video load started event
  const handleEventVideoLoadStarted = () => {
    // This can be used by parent components to show loading indicators
    // or perform other actions when event video loading begins
  }

  const handleEventVideoReady = () => {
    if (eventVideoReady.value) return
    eventVideoReady.value = true
    emit('eventVideoReady')
    // Start loading background video only after event video is ready
    loadBackgroundVideo()
  }

  // Event video loading (triggered after cover video is loaded)
  const loadEventVideo = async () => {
    if (!props.eventVideoUrl) return
    
    // Emit event that event video loading has started
    emit('eventVideoLoadStarted')
    
    const eventBlobUrl = await forceFullVideoDownload(props.eventVideoUrl, 'event')
    if (eventBlobUrl && videoRefs.eventVideoPreloader()) {
      videoRefs.eventVideoPreloader()!.src = eventBlobUrl
    }
  }

  // Cover video loaded handler - start loading event video after cover video is ready
  const handleCoverVideoLoaded = () => {
    loadEventVideo()
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

  // Handler for background video load started event
  const handleBackgroundVideoLoadStarted = () => {
    // This can be used by parent components to show loading indicators
    // or perform other actions when background video loading begins
  }

  const handleBackgroundVideoPlaying = () => {}

  // Sequential video handlers
  const handleSequentialVideoEnded = () => {
    if (currentVideoPhase.value === 'event') {
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
    
    if (videoToUse === videoRefs.eventVideoPreloader()) {
      videoToUse.style.opacity = '1'
      videoToUse.style.zIndex = '20'
      videoToUse.style.pointerEvents = 'none'
      videoToUse.muted = false
      videoToUse.loop = false
    } else {
      videoToUse.src = props.eventVideoUrl
      videoToUse.style.opacity = '1'
      videoToUse.style.zIndex = '20'
      videoToUse.muted = false
      videoToUse.loop = false
    }
    
    videoToUse.play().catch(() => {
      handleSequentialVideoEnded()
    })
    
    emit('playEventVideo')
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
    
    bgVideo.style.opacity = '1'
    bgVideo.style.zIndex = '-1'
    
    bgVideo.play()
      .then(() => {
        // Hide the event video that was playing
        if (videoRefs.eventVideoPreloader()) {
          videoRefs.eventVideoPreloader()!.style.opacity = '0'
        }
        if (videoRefs.sequentialVideoContainer()) {
          videoRefs.sequentialVideoContainer()!.style.opacity = '0'
        }
        currentVideoPhase.value = 'background'
        emit('sequentialVideoEnded')
      })
      .catch((error) => {
        currentVideoPhase.value = 'background'
        emit('sequentialVideoEnded')
      })
  }

  // Initialize video state
  const initializeVideoState = () => {
    if (props.shouldSkipToMainContent || props.currentShowcaseStage === 'main_content') {
      isContentHidden.value = true
      isCoverVideoPlaying.value = false
      
      if (props.videoStatePreserved) {
        // If video state is preserved, load event video immediately
        loadEventVideo()
      }
      
      if (props.backgroundVideoUrl) {
        playBackgroundVideo()
      } else {
        currentVideoPhase.value = 'background'
        emit('sequentialVideoEnded')
      }
    } else if (props.currentShowcaseStage === 'event_video') {
      isContentHidden.value = true
      isCoverVideoPlaying.value = false
      
      if (props.videoStatePreserved && props.eventVideoUrl) {
        // If video state is preserved, load event video immediately
        loadEventVideo()
      }
      
      if (props.eventVideoUrl) {
        playEventVideo()
      }
    } else {
      currentVideoPhase.value = 'none'
      isCoverVideoPlaying.value = true
      isContentHidden.value = false
      
      if (props.videoStatePreserved) {
        // If video state is preserved, load event video immediately
        loadEventVideo()
      } else if (!props.templateAssets?.standard_cover_video) {
        // If there's no cover video, start loading event video immediately
        loadEventVideo()
      }
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
  watch(() => props.currentShowcaseStage, (newStage) => {
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
  }, { immediate: true })

  watch(() => props.shouldSkipToMainContent, (shouldSkip) => {
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
  }, { immediate: true })

  watch(() => props.videoStatePreserved, (isPreserved) => {
    if (isPreserved) {
      // When video state is being preserved, load event video immediately
      loadEventVideo()
      nextTick(() => {
        initializeVideoState()
      })
    }
  }, { immediate: true })

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
    handleEventVideoLoadStarted,
    handleEventVideoPreloaded,
    handleEventVideoReady,
    handleCoverVideoLoaded,
    handleBackgroundVideoLoadStarted,
    handleBackgroundVideoPreloaded,
    handleBackgroundVideoReady,
    handleBackgroundVideoPlaying,
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
    loadEventVideo
  }
}