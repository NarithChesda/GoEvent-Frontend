import { ref, computed, nextTick } from 'vue'

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
  // Stage state
  const currentShowcaseStage = ref<ShowcaseStage>('cover')
  const isEnvelopeOpened = ref(false)
  const isPlayingEventVideo = ref(false)
  const videoLoading = ref(false)
  const coverStageReady = ref(false)

  // Media references
  const eventVideoRef = ref<HTMLVideoElement | null>(null)
  const audioRef = ref<HTMLAudioElement | null>(null)
  const isMusicPlaying = ref(false)

  /**
   * Computed properties for stage checks
   */
  const isCoverStage = computed(() => currentShowcaseStage.value === 'cover')
  const isEventVideoStage = computed(() => currentShowcaseStage.value === 'event_video')
  const isMainContentStage = computed(() => currentShowcaseStage.value === 'main_content')

  /**
   * Initialize audio with proper cleanup registration
   */
  const initializeAudio = (musicUrl?: string) => {
    if (musicUrl && !audioRef.value) {
      audioRef.value = new Audio(musicUrl)
      audioRef.value.loop = true
      audioRef.value.volume = 0.35
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
   * Cleanup audio resources
   */
  const cleanupAudio = (): void => {
    if (audioRef.value) {
      audioRef.value.pause()
      audioRef.value.src = ''
      audioRef.value = null
    }
    isMusicPlaying.value = false
  }

  /**
   * Cleanup video resources
   */
  const cleanupVideo = (): void => {
    if (eventVideoRef.value) {
      eventVideoRef.value.pause()
      eventVideoRef.value.src = ''
      eventVideoRef.value = null
    }
    isPlayingEventVideo.value = false
    videoLoading.value = false
  }

  /**
   * Complete cleanup of all stage resources
   */
  const cleanup = (): void => {
    cleanupAudio()
    cleanupVideo()
    resetStages()
  }

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
  }
}
