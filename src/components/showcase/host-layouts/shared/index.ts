/**
 * Shared components and utilities for host info layouts
 */

// Components
export { default as WelcomeHeader } from './WelcomeHeader.vue'
export { default as HostLogo } from './HostLogo.vue'
export { default as HostProfilePicture } from './HostProfilePicture.vue'
export { default as AutoFitText } from './AutoFitText.vue'

// Re-export utilities from composable
export {
  getMediaUrl,
  splitToWords,
  ANIMATION_CONSTANTS,
  getTextAnimationDuration,
  useFallbackLogo,
  useAnimatedDelays,
  getKhmerClass,
  isKhmerLanguage,
  getTextStyle,
  getFontFamily,
} from '@/composables/showcase/useHostInfoUtils'

// Re-export types
export type { HostInfoProps } from '@/types/showcase'
