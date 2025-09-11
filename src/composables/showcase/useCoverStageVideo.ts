import { ref, computed, onUnmounted, nextTick, watch, type Ref } from 'vue'

export type VideoPhase = 'none' | 'event' | 'background'
export type ShowcaseStage = 'cover' | 'event_video' | 'main_content'

interface VideoElementRefs {
  eventVideoPreloader: Ref<HTMLVideoElement | null>
  sequentialVideoContainer: Ref<HTMLVideoElement | null>
  coverVideoElement: Ref<HTMLVideoElement | null>
  backgroundVideoElement: Ref<HTMLVideoElement | null>
}

interface VideoUrls {
  eventVideoUrl?: string | null
  backgroundVideoUrl?: string | null
}

interface VideoEmits {
  eventVideoPreloaded: []
  eventVideoReady: []
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
  emit: (event: keyof VideoEmits, ...args: any[]) => void
) {
  // Video state management
  const currentVideoPhase = ref<VideoPhase>('none')
  const eventVideoPreloaded = ref(false)
  const eventVideoReady = ref(false)
  const backgroundVideoPreloaded = ref(false)
  const backgroundVideoReady = ref(false)
  const sequentialVideoReady = ref(false)
  const isEventVideoComplete = ref(false)
  
  // Loading state flags (for UI feedback only)
  const eventVideoLoading = ref(false)
  const backgroundVideoLoading = ref(false)
  
  // Video state control
  const isCoverVideoPlaying = ref(!props.shouldSkipToMainContent && props.currentShowcaseStage !== 'main_content')
  const isContentHidden = ref(false)
  
  // Event listener cleanup tracking
  const videoEventListeners = ref<Map<HTMLVideoElement, Array<{ event: string; handler: EventListener }>>>(new Map())
  
  // Store blob URLs for cleanup
  const videoBlobUrls = ref<Map<string, string>>(new Map())

  // Video resource manager for memory cleanup
  const addVideoEventListener = (video: HTMLVideoElement, event: string, handler: EventListener) => {
    video.addEventListener(event, handler)
    
    if (!videoEventListeners.value.has(video)) {
      videoEventListeners.value.set(video, [])
    }
    videoEventListeners.value.get(video)?.push({ event, handler })
  }

  const cleanupVideoElement = (video: HTMLVideoElement | null) => {
    if (!video) return
    
    // Remove all tracked event listeners
    const listeners = videoEventListeners.value.get(video)
    if (listeners) {
      listeners.forEach(({ event, handler }) => {
        video.removeEventListener(event, handler)
      })
      videoEventListeners.value.delete(video)
    }
    
    // Cleanup video resources
    video.pause()
    video.src = ''
    video.load() // Reset the video element
  }

  const cleanupAllVideoResources = () => {
    // Cleanup all video elements
    cleanupVideoElement(videoRefs.eventVideoPreloader.value)
    cleanupVideoElement(videoRefs.sequentialVideoContainer.value)
    cleanupVideoElement(videoRefs.coverVideoElement.value)
    cleanupVideoElement(videoRefs.backgroundVideoElement.value)
    
    // Clear all listener tracking
    videoEventListeners.value.clear()
    
    // Cleanup all blob URLs
    videoBlobUrls.value.forEach((blobUrl) => {
      URL.revokeObjectURL(blobUrl)
    })
    videoBlobUrls.value.clear()
  }

  // Force full video download using fetch with priority support
  const forceFullVideoDownload = async (videoUrl: string, videoType: 'event' | 'background') => {
    try {
      // Check if already downloaded
      const existingBlob = videoBlobUrls.value.get(videoUrl)
      if (existingBlob) {
        return existingBlob
      }
      
      // Get the full URL if it's relative
      const fullUrl = videoUrl.startsWith('http') 
        ? videoUrl 
        : `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}${videoUrl.startsWith('/') ? videoUrl : `/media/${videoUrl}`}`
      
      // Fetch with priority hint for event video
      const response = await fetch(fullUrl, {
        priority: videoType === 'event' ? 'high' : 'low'
      } as RequestInit)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${videoType} video: ${response.status}`)
      }
      
      // Read the response as blob
      const blob = await response.blob()
      
      // Create and store blob URL for cleanup
      const blobUrl = URL.createObjectURL(blob)
      videoBlobUrls.value.set(videoUrl, blobUrl)
      
      return blobUrl
    } catch (error) {
      return null
    }
  }

  // Event video preloading handlers
  const handleEventVideoPreloaded = () => {
    if (eventVideoPreloaded.value) return // Prevent duplicate firing
    
    eventVideoPreloaded.value = true
    emit('eventVideoPreloaded')
  }

  const handleEventVideoReady = () => {
    if (eventVideoReady.value) return // Prevent duplicate firing
    
    eventVideoReady.value = true
    emit('eventVideoReady')
  }

  // Priority-based video loading with fetch
  const startPriorityVideoLoading = async () => {
    // Priority 1: Load event video first (highest priority)
    if (props.eventVideoUrl) {
      eventVideoLoading.value = true
      const eventBlobUrl = await forceFullVideoDownload(props.eventVideoUrl, 'event')
      if (eventBlobUrl && videoRefs.eventVideoPreloader.value) {
        videoRefs.eventVideoPreloader.value.src = eventBlobUrl
      }
      eventVideoLoading.value = false
    }
    
    // Priority 2: Load background video after event video starts
    if (props.backgroundVideoUrl) {
      // Small delay to ensure event video gets network priority
      await new Promise(resolve => setTimeout(resolve, 500))
      
      backgroundVideoLoading.value = true
      const bgBlobUrl = await forceFullVideoDownload(props.backgroundVideoUrl, 'background')
      if (bgBlobUrl && videoRefs.backgroundVideoElement.value) {
        videoRefs.backgroundVideoElement.value.src = bgBlobUrl
      }
      backgroundVideoLoading.value = false
    }
  }

  // Cover video loaded handler - start loading event video
  const handleCoverVideoLoaded = () => {
    startPriorityVideoLoading()
  }

  // Background video preloading handlers
  const handleBackgroundVideoPreloaded = () => {
    if (backgroundVideoPreloaded.value) return // Prevent duplicate firing
    
    backgroundVideoPreloaded.value = true
  }

  const handleBackgroundVideoReady = () => {
    if (backgroundVideoReady.value) return // Prevent duplicate firing
    
    backgroundVideoReady.value = true
  }

  // Handle background video playing event - simplified
  const handleBackgroundVideoPlaying = () => {}

  // Sequential video handlers
  const handleSequentialVideoEnded = () => {
    if (currentVideoPhase.value === 'event') {
      // Event video ended, switch to background video
      playBackgroundVideo()
    } else if (currentVideoPhase.value === 'background') {
      // Background video ended, emit completion (though background should loop)
      emit('sequentialVideoEnded')
    }
  }

  const handleSequentialVideoError = () => {
    // Continue with the flow even if there's an error
    emit('sequentialVideoEnded')
  }

  const playEventVideo = () => {
    if (!props.eventVideoUrl) return
    
    // Stop cover video
    isCoverVideoPlaying.value = false
    
    currentVideoPhase.value = 'event'
    
    // Use preloaded event video if available, otherwise fallback to sequential container
    const videoToUse = videoRefs.eventVideoPreloader.value || videoRefs.sequentialVideoContainer.value
    if (!videoToUse) return
    
    // If using the preloaded video, we don't need to set src again
    if (videoToUse === videoRefs.eventVideoPreloader.value) {
      // Use the preloaded video directly - no need to set src again
      videoToUse.style.opacity = '1'
      videoToUse.style.zIndex = '20'
      videoToUse.style.pointerEvents = 'none'
      videoToUse.muted = false // Unmute for event video
      videoToUse.loop = false // Don't loop event video
    } else {
      // Fallback to sequential container if preloader not available
      videoToUse.src = props.eventVideoUrl
      videoToUse.style.opacity = '1'
      videoToUse.style.zIndex = '20'
      videoToUse.muted = false // Unmute for event video
      videoToUse.loop = false // Don't loop event video
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
    
    const bgVideo = videoRefs.backgroundVideoElement.value
    if (!bgVideo) {
      emit('sequentialVideoEnded')
      return
    }
    
    // Prepare background video for smooth transition
    bgVideo.style.opacity = '1'
    bgVideo.style.zIndex = '-1'
    
    bgVideo.play()
      .then(() => {
        // Only hide event video after background video starts playing (smooth crossfade)
        if (videoRefs.eventVideoPreloader.value) {
          videoRefs.eventVideoPreloader.value.style.opacity = '0'
        }
        currentVideoPhase.value = 'background'
        emit('sequentialVideoEnded')
      })
      .catch((error) => {
        // Still transition to main content even if video fails
        currentVideoPhase.value = 'background'
        emit('sequentialVideoEnded')
      })
  }

  // Initialize video state based on current showcase stage and redirect state
  const initializeVideoState = () => {
    if (props.shouldSkipToMainContent || props.currentShowcaseStage === 'main_content') {
      // Skip directly to main content with background video
      isContentHidden.value = true
      isCoverVideoPlaying.value = false
      
      // If video state is preserved (from auth redirect), ensure videos are properly loaded
      if (props.videoStatePreserved) {
        // Re-initiate priority loading to restore video functionality
        startPriorityVideoLoading()
      }
      
      if (props.backgroundVideoUrl) {
        playBackgroundVideo()
      } else {
        currentVideoPhase.value = 'background'
        emit('sequentialVideoEnded')
      }
    } else if (props.currentShowcaseStage === 'event_video') {
      // Initialize for event video stage
      isContentHidden.value = true
      isCoverVideoPlaying.value = false
      
      // If video state is preserved, ensure event video loading is enabled
      if (props.videoStatePreserved && props.eventVideoUrl) {
        startPriorityVideoLoading()
      }
      
      if (props.eventVideoUrl) {
        playEventVideo()
      }
    } else {
      // Default: show cover stage
      currentVideoPhase.value = 'none'
      isCoverVideoPlaying.value = true
      isContentHidden.value = false
      
      // If video state is preserved but we're at cover stage, start priority loading
      if (props.videoStatePreserved) {
        // Re-initiate priority loading to restore video functionality
        startPriorityVideoLoading()
      }
    }
  }

  // Handle envelope opening with smooth transition
  const handleOpenEnvelope = () => {
    // First hide the content with fade animation
    isContentHidden.value = true
    
    // After content is hidden, start the sequential video or emit the openEnvelope event
    setTimeout(() => {
      if (props.eventVideoUrl) {
        playEventVideo()
      } else if (props.backgroundVideoUrl) {
        // If no event video but has background video, go directly to background video
        playBackgroundVideo()
      } else {
        // No videos available, just emit the event
        // This needs to be handled by parent component
        emit('sequentialVideoEnded')
      }
    }, 500) // Match the CSS transition duration
  }

  // Computed properties
  const shouldShowButtonLoading = computed(() => {
    // Show loading if there's an event video but it's not ready yet
    return props.eventVideoUrl && !eventVideoReady.value
  })

  // Watchers
  watch(() => props.currentShowcaseStage, (newStage) => {
    if (newStage === 'event_video' && currentVideoPhase.value === 'none') {
      // User returned to event video stage after login
      isContentHidden.value = true
      if (props.eventVideoUrl) {
        playEventVideo()
      }
    } else if (newStage === 'main_content' && currentVideoPhase.value !== 'background') {
      // User returned to main content stage after login  
      isContentHidden.value = true
      if (props.backgroundVideoUrl) {
        playBackgroundVideo()
      } else {
        emit('sequentialVideoEnded')
      }
    }
  }, { immediate: true })

  // Watch for redirect state changes to skip directly to main content
  watch(() => props.shouldSkipToMainContent, (shouldSkip) => {
    if (shouldSkip) {
      // Skip cover and event video, go directly to main content
      isContentHidden.value = true
      isCoverVideoPlaying.value = false // Stop cover video immediately
      
      if (props.backgroundVideoUrl) {
        // Force background video phase regardless of current phase
        playBackgroundVideo()
      } else {
        // If no background video, just show main content
        currentVideoPhase.value = 'background'
        emit('sequentialVideoEnded')
      }
    }
  }, { immediate: true })

  // Watch for video state preservation changes to restore video loading after auth redirects
  watch(() => props.videoStatePreserved, (isPreserved) => {
    if (isPreserved) {
      // When video state is being preserved, restart priority loading
      // This prevents videos from being reset during auth redirects
      startPriorityVideoLoading()
      
      // Re-initialize video state to handle any stage changes during preservation
      nextTick(() => {
        initializeVideoState()
      })
    }
  }, { immediate: true })

  // Watch cover video playing state and pause/resume accordingly
  watch(isCoverVideoPlaying, (isPlaying) => {
    if (videoRefs.coverVideoElement.value) {
      if (isPlaying) {
        // Resume cover video
        videoRefs.coverVideoElement.value.play().catch(() => {
          // Silently handle play errors
        })
      } else {
        // Pause and hide cover video
        videoRefs.coverVideoElement.value.pause()
      }
    }
  })

  // Enhanced video element management
  watch(videoRefs.eventVideoPreloader, (newVideo, oldVideo) => {
    // Cleanup old video if it exists
    if (oldVideo) {
      cleanupVideoElement(oldVideo)
    }
    
    // Setup new video with tracked event listeners
    if (newVideo) {
      addVideoEventListener(newVideo, 'loadeddata', handleEventVideoPreloaded)
      addVideoEventListener(newVideo, 'canplaythrough', handleEventVideoReady)
      addVideoEventListener(newVideo, 'ended', handleSequentialVideoEnded)
      
      // Add error handler for memory cleanup
      const errorHandler = () => {
        cleanupVideoElement(newVideo)
      }
      addVideoEventListener(newVideo, 'error', errorHandler)
    }
  })

  // Enhanced background video element management
  watch(videoRefs.backgroundVideoElement, (newVideo, oldVideo) => {
    // Cleanup old video if it exists
    if (oldVideo) {
      cleanupVideoElement(oldVideo)
    }
    
    // Setup new video with tracked event listeners
    if (newVideo) {
      addVideoEventListener(newVideo, 'loadeddata', handleBackgroundVideoPreloaded)
      addVideoEventListener(newVideo, 'canplaythrough', handleBackgroundVideoReady)
      
      // Add error handler for memory cleanup
      const errorHandler = () => {
        cleanupVideoElement(newVideo)
      }
      addVideoEventListener(newVideo, 'error', errorHandler)
    }
  })

  // Cleanup on component unmount
  onUnmounted(() => {
    cleanupAllVideoResources()
  })

  // Expose method for parent to trigger event video
  const startEventVideo = () => {
    playEventVideo()
  }

  return {
    // State
    currentVideoPhase,
    eventVideoPreloaded,
    eventVideoReady,
    backgroundVideoPreloaded,
    backgroundVideoReady,
    eventVideoLoading,
    backgroundVideoLoading,
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
    handleBackgroundVideoPlaying,
    handleSequentialVideoEnded,
    handleSequentialVideoError,
    playEventVideo,
    playBackgroundVideo,
    handleOpenEnvelope,
    initializeVideoState,
    cleanupAllVideoResources,
    startEventVideo
  }
}