import { ref, computed, watch, type ComputedRef, type Ref } from 'vue'
import { getAnimationType, type ShowcaseAnimationType } from './useShowcaseAnimation'

/**
 * How long the cover's leaves take to swing fully open, taken from the
 * reference artwork's curtain beat.
 *
 * This is the CSS animation's duration in `cover/DoorPanel.vue` — the two have
 * to be changed together, and everything timed off the swing (the transition
 * stage's own beats, the no-featured-photo fallback in
 * EventShowcaseRefactored.vue) keys off this constant rather than repeating it.
 */
export const DOOR_OPEN_DURATION_MS = 1650

/**
 * When the leaves have travelled fully outside the frame.
 *
 * The swing runs on past this, settling the last few degrees of its overshoot,
 * but by here nothing of either leaf is on screen — so anything waiting for
 * "the cover is out of the way" can hand off at this point rather than sitting
 * through the tail.
 */
export const DOOR_CLEARED_MS = 1200

export interface DoorAnimationConfig {
  /** Animation type override */
  animationType?: ComputedRef<ShowcaseAnimationType | undefined>
  /** Current video phase */
  currentVideoPhase: Ref<string>
  /** Door animation duration in ms. Defaults to the swing's own length. */
  duration?: number
}

export interface DoorAnimationReturn {
  /** Whether using door animation */
  isDoorAnimation: ComputedRef<boolean>
  /** Whether door animation is currently in progress */
  isDoorAnimationInProgress: Ref<boolean>
  /** Start the door animation */
  startDoorAnimation: () => void
  /** Clear the door animation flag after timeout */
  clearAfterTimeout: () => void
}

/**
 * Composable for managing door animation state
 *
 * Handles the timing and state management for the door opening animation,
 * ensuring smooth transitions between cover and main content stages.
 *
 * @example
 * ```ts
 * const { isDoorAnimation, isDoorAnimationInProgress, startDoorAnimation } = useDoorAnimation({
 *   animationType: computed(() => props.animationType),
 *   currentVideoPhase: videoState.currentVideoPhase,
 * })
 * ```
 */
export function useDoorAnimation(config: DoorAnimationConfig): DoorAnimationReturn {
  const { animationType, currentVideoPhase, duration = DOOR_OPEN_DURATION_MS } = config

  const isDoorAnimationInProgress = ref(false)

  const currentAnimationType = computed(() => getAnimationType(animationType?.value))
  const isDoorAnimation = computed(() => currentAnimationType.value === 'door')

  const startDoorAnimation = () => {
    if (isDoorAnimation.value) {
      isDoorAnimationInProgress.value = true
    }
  }

  const clearAfterTimeout = () => {
    setTimeout(() => {
      isDoorAnimationInProgress.value = false
    }, duration)
  }

  // Watch for phase changes to safely clear door animation flag
  watch(currentVideoPhase, (newPhase) => {
    if (newPhase === 'background' && isDoorAnimationInProgress.value) {
      // Add a small delay to ensure Vue has fully processed the phase change
      setTimeout(() => {
        isDoorAnimationInProgress.value = false
      }, 50)
    }
  })

  return {
    isDoorAnimation,
    isDoorAnimationInProgress,
    startDoorAnimation,
    clearAfterTimeout,
  }
}
