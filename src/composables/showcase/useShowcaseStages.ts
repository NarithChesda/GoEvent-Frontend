import { ref, computed, nextTick, onUnmounted } from 'vue'
import { useVideoResourceManager } from './useVideoResourceManager'
import type { MusicStartStage } from '@/services/api/types/event.types'

export type ShowcaseStage = 'cover' | 'transition' | 'event_video' | 'main_content'

/**
 * Cue points the music gate understands, in the order the showcase reaches them.
 *
 * Only three of the four stages are cue points: `event_video` is deliberately
 * absent. Music is paused for the duration of that video anyway (the view swaps
 * it out and restores it after), so a cue there would start a track that is
 * silenced in the same breath.
 */
const MUSIC_CUE_ORDER: Record<MusicStartStage, number> = {
  cover: 0,
  transition: 1,
  main_content: 2,
}

/**
 * What an unset `music_start_stage` means, per flow — i.e. exactly where each
 * flow started its music before the field existed. Keyed by the branch of
 * `openEnvelope` that runs, so an event with no setting is untouched by this
 * feature:
 *
 * - `transition` flow (basic wedding, cover → transition → main content):
 *   music began in `onTransitionComplete`, with the invitation.
 * - `video` flow: music began on the tap, under the event video's opening.
 * - `direct` flow (no video, no transition stage): music began with the main
 *   content a second after the tap.
 */
const MUSIC_STAGE_FALLBACK = {
  transition: 'main_content',
  video: 'cover',
  direct: 'main_content',
} as const satisfies Record<string, MusicStartStage>

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
  const isTransitionStage = computed(() => currentShowcaseStage.value === 'transition')
  const isEventVideoStage = computed(() => currentShowcaseStage.value === 'event_video')
  const isMainContentStage = computed(() => currentShowcaseStage.value === 'main_content')

  /**
   * Initialize audio with proper cleanup registration and mobile optimizations
   *
   * Loops manually within [loopStart, loopEnd] instead of using the native
   * `loop` attribute, which always loops the whole file — this lets hosts
   * trim a long silent/instrumental intro via music_start_time/music_end_time.
   */
  const initializeAudio = (musicUrl?: string, loopStart = 0, loopEnd?: number) => {
    if (musicUrl && !audioRef.value) {
      audioRef.value = new Audio(musicUrl)
      audioRef.value.volume = 0.35

      const audio = audioRef.value

      const handleLoadedMetadata = () => {
        if (loopStart > 0) {
          audio.currentTime = loopStart
        }
      }

      const handleTimeUpdate = () => {
        const end = loopEnd ?? audio.duration
        if (end > loopStart && audio.currentTime >= end) {
          audio.currentTime = loopStart
        }
      }

      const handleEnded = () => {
        // Fallback for browsers where 'timeupdate' fires after 'ended' near the tail
        audio.currentTime = loopStart
        audio.play().catch(() => {
          isMusicPlaying.value = false
        })
      }

      audio.addEventListener('loadedmetadata', handleLoadedMetadata)
      audio.addEventListener('timeupdate', handleTimeUpdate)
      audio.addEventListener('ended', handleEnded)

      // Register blob URL if it exists
      if (musicUrl.startsWith('blob:')) {
        videoManager.registerBlobUrl(musicUrl, musicUrl)
      }

      // Add cleanup callback for audio
      const cleanup = () => {
        if (audioRef.value) {
          audioRef.value.removeEventListener('loadedmetadata', handleLoadedMetadata)
          audioRef.value.removeEventListener('timeupdate', handleTimeUpdate)
          audioRef.value.removeEventListener('ended', handleEnded)
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

  // ── Music start gate ──────────────────────────────────────────────
  //
  // One place decides when the track begins, so `music_start_stage` is honoured
  // identically across all three flows and the "unset" case can be proven to
  // reproduce the old per-flow timing (see MUSIC_STAGE_FALLBACK). Every call
  // site cues a stage; the gate decides whether that cue is the one to fire on.

  /** The track and its loop window, held from envelope-open until its cue lands. */
  const musicCue = ref<{ url?: string; loopStart?: number; loopEnd?: number } | null>(null)
  /** The stage the cue is waiting for, resolved once at envelope-open. */
  const musicCueStage = ref<MusicStartStage>('main_content')
  /** Latched so a track can only ever be started once per session by the gate. */
  const musicCueFired = ref(false)

  /**
   * Arm the gate for this session. Called from `openEnvelope`, whose tap is the
   * user gesture the autoplay policy requires — every later cue rides on that
   * same interaction, which is why nothing can start music before it.
   */
  const armMusic = (
    musicUrl: string | undefined,
    loopStart: number | undefined,
    loopEnd: number | undefined,
    stage: MusicStartStage,
  ): void => {
    musicCue.value = { url: musicUrl, loopStart, loopEnd }
    musicCueStage.value = stage
    musicCueFired.value = false
    // The tap itself is the `cover` cue.
    cueMusic('cover')
  }

  /**
   * Announce that the showcase has reached `stage`. Fires the armed cue if this
   * is the requested stage *or any later one* — a template whose flow skips the
   * requested stage (no transition stage, say) still gets its music at the next
   * stage it does reach, instead of silently never playing.
   */
  const cueMusic = (stage: MusicStartStage): void => {
    if (musicCueFired.value) return
    if (MUSIC_CUE_ORDER[stage] < MUSIC_CUE_ORDER[musicCueStage.value]) return

    const cue = musicCue.value
    if (!cue?.url) return

    musicCueFired.value = true
    initializeAudio(cue.url, cue.loopStart, cue.loopEnd)
    void playMusic()
  }

  /**
   * Advanced Showcase Stage Flow Controller
   *
   * Opens the envelope and transitions through stages
   */
  const openEnvelope = async (
    eventVideoUrl?: string,
    eventMusicUrl?: string,
    options?: {
      useTransitionStage?: boolean
      musicLoopStart?: number
      musicLoopEnd?: number
      /** Organizer's `music_start_stage`; unset falls back per flow. */
      musicStartStage?: MusicStartStage | null
    },
  ): Promise<void> => {
    isEnvelopeOpened.value = true

    // For transition stage flow (basic wedding events)
    if (options?.useTransitionStage) {
      armMusic(
        eventMusicUrl,
        options?.musicLoopStart,
        options?.musicLoopEnd,
        options?.musicStartStage ?? MUSIC_STAGE_FALLBACK.transition,
      )
      currentShowcaseStage.value = 'transition'
      cueMusic('transition')
      return
    }

    // Transition to event video stage
    currentShowcaseStage.value = 'event_video'

    if (eventVideoUrl) {
      isPlayingEventVideo.value = true

      armMusic(
        eventMusicUrl,
        options?.musicLoopStart,
        options?.musicLoopEnd,
        options?.musicStartStage ?? MUSIC_STAGE_FALLBACK.video,
      )

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
      armMusic(
        eventMusicUrl,
        options?.musicLoopStart,
        options?.musicLoopEnd,
        options?.musicStartStage ?? MUSIC_STAGE_FALLBACK.direct,
      )
      setTimeout(() => {
        isPlayingEventVideo.value = false
        currentShowcaseStage.value = 'main_content'
        cueMusic('main_content')
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
    // Only does anything for an event that asked to hold its music until the
    // invitation; a `cover` event's track has been playing since the tap (and
    // was merely paused for the video's own audio).
    cueMusic('main_content')
  }

  /**
   * Graceful error recovery for event video playback failures
   * Ensures the showcase continues to function even if video fails
   * Automatically falls back to music and main content
   */
  const onEventVideoError = (eventMusicUrl?: string, musicLoopStart?: number, musicLoopEnd?: number): void => {
    isPlayingEventVideo.value = false

    // On video error, skip to main content gracefully
    currentShowcaseStage.value = 'main_content'

    // The video was the reason the guest is here and it just failed — start the
    // music whatever stage was asked for, rather than leaving them in silence.
    // Re-arms rather than cueing, since the gate may never have been armed (the
    // error can precede openEnvelope's own arming on a broken source).
    if (!audioRef.value && eventMusicUrl) {
      armMusic(eventMusicUrl, musicLoopStart, musicLoopEnd, 'cover')
    }
  }

  /**
   * Handle transition stage animation completion
   * Moves from transition stage to main content
   */
  const onTransitionComplete = (eventMusicUrl?: string, musicLoopStart?: number, musicLoopEnd?: number): void => {
    currentShowcaseStage.value = 'main_content'

    // Normally a no-op beyond the cue: openEnvelope armed the gate on the tap.
    // The re-arm covers the redirect path, where a returning guest is dropped
    // straight onto main content and openEnvelope never ran.
    if (!musicCue.value && eventMusicUrl) {
      armMusic(eventMusicUrl, musicLoopStart, musicLoopEnd, 'main_content')
    }
    cueMusic('main_content')
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
    // Disarm too, or a re-opened envelope would find the gate already fired and
    // stay silent for the rest of the session.
    musicCue.value = null
    musicCueFired.value = false
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
    isTransitionStage,
    isEventVideoStage,
    isMainContentStage,

    // Audio methods
    initializeAudio,
    playMusic,
    pauseMusic,
    toggleMusic,
    armMusic,
    cueMusic,

    // Stage flow methods
    openEnvelope,
    onVideoCanPlay,
    onEventVideoEnded,
    onEventVideoError,
    onTransitionComplete,
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
