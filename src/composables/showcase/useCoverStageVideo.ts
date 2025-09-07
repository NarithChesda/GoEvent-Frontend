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
  
  // Priority loading flags
  const shouldLoadEventVideo = ref(false)
  const shouldLoadBackgroundVideo = ref(false)
  
  // Video state control
  const isCoverVideoPlaying = ref(!props.shouldSkipToMainContent && props.currentShowcaseStage !== 'main_content')
  const isContentHidden = ref(false)
  
  // Event listener cleanup tracking
  const videoEventListeners = ref<Map<HTMLVideoElement, Array<{ event: string; handler: EventListener }>>>(new Map())

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
  }

  // Event video preloading handlers
  const handleEventVideoPreloaded = () => {
    eventVideoPreloaded.value = true
    emit('eventVideoPreloaded')
  }

  const handleEventVideoReady = () => {
    eventVideoReady.value = true
    emit('eventVideoReady')
    // Start loading background video after event video is ready
    if (props.backgroundVideoUrl) {
      shouldLoadBackgroundVideo.value = true
    }
  }

  // Cover video loaded handler - start loading event video
  const handleCoverVideoLoaded = () => {
    // Start loading event video after cover video is loaded
    if (props.eventVideoUrl) {
      shouldLoadEventVideo.value = true
    } else if (props.backgroundVideoUrl) {
      // No event video, start background video loading directly
      shouldLoadBackgroundVideo.value = true
    }
  }

  // Background video preloading handlers
  const handleBackgroundVideoPreloaded = () => {
    backgroundVideoPreloaded.value = true
  }

  const handleBackgroundVideoReady = () => {
    backgroundVideoReady.value = true
  }

  // Sequential video handlers
  const handleSequentialVideoEnded = () => {
    if (currentVideoPhase.value === 'event') {
      // Event video ended, switch to background video if available
      isEventVideoComplete.value = true
      
      // Hide the event video that just ended (could be preloader or sequential container)
      if (videoRefs.eventVideoPreloader.value) {
        videoRefs.eventVideoPreloader.value.style.opacity = '0'
        videoRefs.eventVideoPreloader.value.style.zIndex = '-15'
      }
      if (videoRefs.sequentialVideoContainer.value) {
        videoRefs.sequentialVideoContainer.value.style.opacity = '0'
        videoRefs.sequentialVideoContainer.value.style.zIndex = '-10'
      }
      
      if (props.backgroundVideoUrl) {
        playBackgroundVideo()
      } else {
        emit('sequentialVideoEnded')
      }
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
      console.warn('No background video URL provided')
      emit('sequentialVideoEnded')
      return
    }
    
    // Mark event video as complete
    isEventVideoComplete.value = true
    
    // Hide the event video (sequential container and event preloader)
    if (videoRefs.sequentialVideoContainer.value) {
      videoRefs.sequentialVideoContainer.value.style.opacity = '0'
      videoRefs.sequentialVideoContainer.value.style.zIndex = '-10'
    }
    if (videoRefs.eventVideoPreloader.value) {
      videoRefs.eventVideoPreloader.value.style.opacity = '0'
      videoRefs.eventVideoPreloader.value.style.zIndex = '-15'
    }
    
    // Show and play the background video
    currentVideoPhase.value = 'background'
    
    // Ensure background video loading is triggered first
    if (!shouldLoadBackgroundVideo.value) {
      shouldLoadBackgroundVideo.value = true
    }
    
    // Use preloaded background video directly - it should already be loaded and ready
    const tryPlayBackgroundVideo = (attempt = 1) => {
      if (videoRefs.backgroundVideoElement.value) {
        // Background video should already be preloaded, no need to set src again
        videoRefs.backgroundVideoElement.value.style.opacity = '1'
        videoRefs.backgroundVideoElement.value.style.zIndex = '-1' // Background but visible
        
        videoRefs.backgroundVideoElement.value.play().catch((error) => {
          console.warn('Background video play failed:', error)
          emit('sequentialVideoEnded')
        })
      } else if (attempt <= 5) {
        // Retry with exponential backoff, max 5 attempts
        setTimeout(() => {
          tryPlayBackgroundVideo(attempt + 1)
        }, 50 * attempt) // 50ms, 100ms, 150ms, 200ms, 250ms
      } else {
        // Give up after 5 attempts and continue with the flow
        emit('sequentialVideoEnded')
      }
    }
    
    // Start trying to play background video
    tryPlayBackgroundVideo()
    
    emit('playBackgroundVideo')
    
    // Emit completion since main content is now displayed
    setTimeout(() => {
      emit('sequentialVideoEnded')
    }, 500) // Small delay to ensure smooth transition
  }

  // Initialize video state based on current showcase stage and redirect state
  const initializeVideoState = () => {
    if (props.shouldSkipToMainContent || props.currentShowcaseStage === 'main_content') {
      // Skip directly to main content with background video
      isContentHidden.value = true
      isCoverVideoPlaying.value = false
      
      // If video state is preserved (from auth redirect), ensure videos are properly loaded
      if (props.videoStatePreserved) {
        // Force video loading flags to true to restore video functionality
        shouldLoadEventVideo.value = true
        shouldLoadBackgroundVideo.value = true
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
        shouldLoadEventVideo.value = true
      }
      
      if (props.eventVideoUrl) {
        playEventVideo()
      }
    } else {
      // Default: show cover stage
      currentVideoPhase.value = 'none'
      isCoverVideoPlaying.value = true
      isContentHidden.value = false
      
      // If video state is preserved but we're at cover stage, reset loading flags appropriately
      if (props.videoStatePreserved) {
        // Don't reset video loading flags, let them load normally
        if (props.eventVideoUrl) {
          shouldLoadEventVideo.value = true
        }
        if (props.backgroundVideoUrl) {
          shouldLoadBackgroundVideo.value = true
        }
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
      // When video state is being preserved, ensure video loading flags remain active
      // This prevents videos from being reset during auth redirects
      if (props.eventVideoUrl && !shouldLoadEventVideo.value) {
        shouldLoadEventVideo.value = true
      }
      if (props.backgroundVideoUrl && !shouldLoadBackgroundVideo.value) {
        shouldLoadBackgroundVideo.value = true
      }
      
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
    sequentialVideoReady,
    isEventVideoComplete,
    shouldLoadEventVideo,
    shouldLoadBackgroundVideo,
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
    startEventVideo
  }
}