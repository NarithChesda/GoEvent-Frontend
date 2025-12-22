import { computed, type Ref, type ComputedRef } from 'vue'

/**
 * Available animation types for showcase cover-to-main-content transition
 */
export type ShowcaseAnimationType = 'decoration' | 'door'

/**
 * Animation configuration from environment
 */
const ENV_ANIMATION_TYPE = (import.meta.env.VITE_SHOWCASE_ANIMATION_TYPE || 'decoration') as ShowcaseAnimationType

/**
 * Validate animation type
 */
function isValidAnimationType(type: string): type is ShowcaseAnimationType {
  return type === 'decoration' || type === 'door'
}

/**
 * Get the animation type from environment or prop override
 */
export function getAnimationType(override?: ShowcaseAnimationType | null): ShowcaseAnimationType {
  if (override && isValidAnimationType(override)) {
    return override
  }
  return isValidAnimationType(ENV_ANIMATION_TYPE) ? ENV_ANIMATION_TYPE : 'decoration'
}

export interface ShowcaseAnimationConfig {
  /** Animation type override (defaults to env variable) */
  animationType?: Ref<ShowcaseAnimationType | undefined> | ComputedRef<ShowcaseAnimationType | undefined>
  /** Whether the content is hidden (transition triggered) */
  isContentHidden: Ref<boolean> | ComputedRef<boolean>
}

export interface ShowcaseAnimationReturn {
  /** Current animation type */
  currentAnimationType: ComputedRef<ShowcaseAnimationType>
  /** Whether using decoration animation */
  isDecorationAnimation: ComputedRef<boolean>
  /** Whether using door animation */
  isDoorAnimation: ComputedRef<boolean>
  /** CSS classes for cover container based on animation type */
  coverContainerClasses: ComputedRef<Record<string, boolean>>
  /** CSS classes for left door panel */
  leftDoorClasses: ComputedRef<Record<string, boolean>>
  /** CSS classes for right door panel */
  rightDoorClasses: ComputedRef<Record<string, boolean>>
  /** CSS classes for decoration elements */
  decorationClasses: ComputedRef<{
    left: Record<string, boolean>
    right: Record<string, boolean>
    top: Record<string, boolean>
    bottom: Record<string, boolean>
  }>
  /** CSS classes for main content swipe-up */
  mainContentClasses: ComputedRef<Record<string, boolean>>
}

/**
 * Composable for managing showcase transition animations
 *
 * Supports two animation types:
 * - 'decoration': Current animation where decorations slide out in sequence
 * - 'door': Cover splits into two halves that open like doors from center
 *
 * @example
 * ```ts
 * const { currentAnimationType, leftDoorClasses, rightDoorClasses } = useShowcaseAnimation({
 *   isContentHidden: computed(() => props.isContentHidden),
 *   animationType: computed(() => props.animationType)
 * })
 * ```
 */
export function useShowcaseAnimation(config: ShowcaseAnimationConfig): ShowcaseAnimationReturn {
  const { animationType, isContentHidden } = config

  // Current animation type (from prop or env)
  const currentAnimationType = computed<ShowcaseAnimationType>(() => {
    return getAnimationType(animationType?.value)
  })

  // Animation type checks
  const isDecorationAnimation = computed(() => currentAnimationType.value === 'decoration')
  const isDoorAnimation = computed(() => currentAnimationType.value === 'door')

  // Cover container classes
  const coverContainerClasses = computed(() => ({
    'swipe-up-hidden': isDecorationAnimation.value && isContentHidden.value,
    'door-animation-active': isDoorAnimation.value && isContentHidden.value,
  }))

  // Door animation classes
  const leftDoorClasses = computed(() => ({
    'door-panel': isDoorAnimation.value,
    'door-panel-left': isDoorAnimation.value,
    'door-open-left': isDoorAnimation.value && isContentHidden.value,
  }))

  const rightDoorClasses = computed(() => ({
    'door-panel': isDoorAnimation.value,
    'door-panel-right': isDoorAnimation.value,
    'door-open-right': isDoorAnimation.value && isContentHidden.value,
  }))

  // Decoration animation classes
  const decorationClasses = computed(() => ({
    left: {
      'slide-out-to-left': isDecorationAnimation.value && isContentHidden.value,
    },
    right: {
      'slide-out-to-right': isDecorationAnimation.value && isContentHidden.value,
    },
    top: {
      'slide-out-to-top': isDecorationAnimation.value && isContentHidden.value,
    },
    bottom: {
      'slide-out-to-bottom': isDecorationAnimation.value && isContentHidden.value,
    },
  }))

  // Main content classes
  const mainContentClasses = computed(() => ({
    'swipe-up-hidden': isDecorationAnimation.value && isContentHidden.value,
    'door-content-hidden': isDoorAnimation.value && !isContentHidden.value,
    'door-content-reveal': isDoorAnimation.value && isContentHidden.value,
  }))

  return {
    currentAnimationType,
    isDecorationAnimation,
    isDoorAnimation,
    coverContainerClasses,
    leftDoorClasses,
    rightDoorClasses,
    decorationClasses,
    mainContentClasses,
  }
}
