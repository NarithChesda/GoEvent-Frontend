import { ref, computed, nextTick, onUnmounted } from 'vue'
import { useVideoResourceManager } from './useVideoResourceManager'

export type ShowcaseStage = 'cover' | 'event_video' | 'main_content'

/**
 * Showcase Stages Composable
 *
 * Manages the three-stage wedding invitation experience:
 *
 * **Stage 1 (Cover)**: Static invitation with envelope opening animation
 * **Stage 2 (Event Video)**: Personal video message from couple (optional)
 * **Stage 3 (Main Content)**: Full invitation details, RSVP, gallery, etc.
 *
 * The flow is designed for optimal emotional impact:
 * - Cover stage creates anticipation
 * - Event video provides personal touch
 * - Main content delivers all practical information
 *
 * Includes intelligent skipping for return visitors and proper audio management.
 */
export function useShowcaseStages() {
  // Initialize video resource manager for comprehensive cleanup
  const videoManager = useVideoResourceManager()

  // Stage state
  const currentShowcaseStage = ref<ShowcaseStage>('cover')
  const isEnvelopeOpened = ref(false)
  const isPlayingEventVideo = ref(false)
  const videoLoading = ref(false)
  const coverStageReady = ref(false)

  // Media references with enhanced cleanup tracking
  const eventVideoRef = ref<HTMLVideoElement | null>(null)
  const audioRef = ref<HTMLAudioElement | null>(null)
  const isMusicPlaying = ref(false)

  // Track audio for cleanup
  const audioCleanupCallbacks = ref<Set<() => void>>(new Set())

  /**
   * Computed properties for stage checks
   */
  const isCoverStage = computed(() => currentShowcaseStage.value === 'cover')
  const isEventVideoStage = computed(() => currentShowcaseStage.value === 'event_video')
  const isMainContentStage = computed(() => currentShowcaseStage.value === 'main_content')

  /**
   * Initialize audio with proper cleanup registration and mobile optimizations
   */
  const initializeAudio = (musicUrl?: string) => {
    if (musicUrl && !audioRef.value) {
      audioRef.value = new Audio(musicUrl)
      audioRef.value.loop = true
      audioRef.value.volume = 0.35

      // Register blob URL if it exists
      if (musicUrl.startsWith('blob:')) {
        videoManager.registerBlobUrl(musicUrl, musicUrl)
      }

      // Add cleanup callback for audio
      const cleanup = () => {
        if (audioRef.value) {
          audioRef.value.pause()
          audioRef.value.src = ''
          // Clean up blob URL if it was one
          if (musicUrl.startsWith('blob:')) {
            try {
              URL.revokeObjectURL(musicUrl)
            } catch (error) {
              // Ignore revocation errors
            }
          }
          audioRef.value = null
        }
        isMusicPlaying.value = false
      }

      audioCleanupCallbacks.value.add(cleanup)
      videoManager.addCleanupCallback(cleanup)
    }
  }

  /**
   * Play music with error handling
   */
  const playMusic = async (): Promise<void> => {
    if (!audioRef.value) return

    try {
      await audioRef.value.play()
      isMusicPlaying.value = true
    } catch (error) {
      console.warn('Failed to play music:', error)
      isMusicPlaying.value = false
    }
  }

  /**
   * Pause music
   */
  const pauseMusic = (): void => {
    if (audioRef.value) {
      audioRef.value.pause()
      isMusicPlaying.value = false
    }
  }

  /**
   * Toggle music playback
   */
  const toggleMusic = (): void => {
    if (isMusicPlaying.value) {
      pauseMusic()
    } else {
      playMusic()
    }
  }

  /**
   * Advanced Showcase Stage Flow Controller
   *
   * Opens the envelope and transitions through stages
   */
  const openEnvelope = async (eventVideoUrl?: string, eventMusicUrl?: string): Promise<void> => {
    isEnvelopeOpened.value = true

    // Transition to event video stage
    currentShowcaseStage.value = 'event_video'

    if (eventVideoUrl) {
      isPlayingEventVideo.value = true

      initializeAudio(eventMusicUrl)
      if (eventMusicUrl) {
        await playMusic()
      }

      await nextTick()
      if (eventVideoRef.value) {
        eventVideoRef.value.muted = false
        try {
          await eventVideoRef.value.play()
        } catch (playError) {
          console.warn('Failed to play event video unmuted, trying muted:', playError)
          // Try playing muted if unmuted fails
          if (eventVideoRef.value) {
            eventVideoRef.value.muted = true
            try {
              await eventVideoRef.value.play()
            } catch (mutedError) {
              console.warn('Failed to play event video even when muted:', mutedError)
            }
          }
        }
      }
    } else {
      // No event video, skip directly to main content
      setTimeout(() => {
        isPlayingEventVideo.value = false
        currentShowcaseStage.value = 'main_content'

        initializeAudio(eventMusicUrl)
        if (eventMusicUrl) {
          playMusic()
        }
      }, 1000)
    }
  }

  /**
   * Handle video ready state
   */
  const onVideoCanPlay = (): void => {
    videoLoading.value = false
  }

  /**
   * Handles the completion of the event video stage
   * Automatically transitions to main content
   */
  const onEventVideoEnded = (): void => {
    isPlayingEventVideo.value = false
    // Transition to main content stage when event video ends
    currentShowcaseStage.value = 'main_content'
  }

  /**
   * Graceful error recovery for event video playback failures
   * Ensures the showcase continues to function even if video fails
   * Automatically falls back to music and main content
   */
  const onEventVideoError = (eventMusicUrl?: string): void => {
    isPlayingEventVideo.value = false

    // On video error, skip to main content gracefully
    currentShowcaseStage.value = 'main_content'

    // Ensure audio is still available as fallback
    if (!audioRef.value && eventMusicUrl) {
      initializeAudio(eventMusicUrl)
      playMusic()
    }
  }

  /**
   * Handle cover stage readiness
   */
  const handleCoverStageReady = (): void => {
    coverStageReady.value = true
  }

  /**
   * Set current stage directly (useful for redirects)
   */
  const setStage = (stage: ShowcaseStage): void => {
    currentShowcaseStage.value = stage
  }

  /**
   * Reset all stage state (useful for cleanup)
   */
  const resetStages = (): void => {
    currentShowcaseStage.value = 'cover'
    isEnvelopeOpened.value = false
    isPlayingEventVideo.value = false
    videoLoading.value = false
    coverStageReady.value = false
    isMusicPlaying.value = false
  }

  /**
   * Enhanced audio cleanup with blob URL management
   */
  const cleanupAudio = (): void => {
    // Execute all audio cleanup callbacks
    audioCleanupCallbacks.value.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.warn('Error during audio cleanup:', error)
      }
    })
    audioCleanupCallbacks.value.clear()

    // Fallback direct cleanup
    if (audioRef.value) {
      audioRef.value.pause()

      // Clean up blob URL if present
      const audioSrc = audioRef.value.src
      if (audioSrc && audioSrc.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(audioSrc)
        } catch (error) {
          // Ignore revocation errors
        }
      }

      audioRef.value.src = ''
      audioRef.value = null
    }
    isMusicPlaying.value = false
  }

  /**
   * Enhanced video cleanup with resource manager integration
   */
  const cleanupVideo = async (): Promise<void> => {
    if (eventVideoRef.value) {
      // Use the enhanced video resource manager for cleanup
      await videoManager.cleanupVideo(eventVideoRef.value)
      eventVideoRef.value = null
    }
    isPlayingEventVideo.value = false
    videoLoading.value = false
  }

  /**
   * Complete cleanup of all stage resources with mobile optimizations
   */
  const cleanup = async (): Promise<void> => {
    try {
      // Clean up audio first (faster)
      cleanupAudio()

      // Clean up video with proper async handling
      await cleanupVideo()

      // Clean up all managed video resources
      await videoManager.cleanupAllVideos()

      // Reset stage state
      resetStages()

      // Force memory cleanup on mobile devices
      if (videoManager.isMobileDevice()) {
        videoManager.triggerMemoryCleanup()
      }
    } catch (error) {
      console.warn('Error during stage cleanup:', error)
      // Ensure state is reset even if cleanup fails
      resetStages()
    }
  }

  // Automatic cleanup on component unmount
  onUnmounted(async () => {
    await cleanup()
  })

  return {
    // State
    currentShowcaseStage,
    isEnvelopeOpened,
    isPlayingEventVideo,
    videoLoading,
    coverStageReady,
    eventVideoRef,
    audioRef,
    isMusicPlaying,

    // Computed
    isCoverStage,
    isEventVideoStage,
    isMainContentStage,

    // Audio methods
    initializeAudio,
    playMusic,
    pauseMusic,
    toggleMusic,

    // Stage flow methods
    openEnvelope,
    onVideoCanPlay,
    onEventVideoEnded,
    onEventVideoError,
    handleCoverStageReady,
    setStage,
    resetStages,

    // Cleanup methods
    cleanupAudio,
    cleanupVideo,
    cleanup,

    // Video resource manager access
    videoResourceManager: videoManager,
  }
}
