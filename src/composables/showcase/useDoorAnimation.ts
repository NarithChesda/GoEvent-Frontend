import { ref, computed, watch, type ComputedRef, type Ref } from 'vue'
import { getAnimationType, type ShowcaseAnimationType } from './useShowcaseAnimation'

export interface DoorAnimationConfig {
  /** Animation type override */
  animationType?: ComputedRef<ShowcaseAnimationType | undefined>
  /** Current video phase */
  currentVideoPhase: Ref<string>
  /** Door animation duration in ms */
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
  const { animationType, currentVideoPhase, duration = 1200 } = config

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
