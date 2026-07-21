import type { Host } from '../../useEventShowcase'
import type { V2CategoryVariant } from '../useV2CategoryVariant'
import V2CoverGate from '../../../components/showcase-v2/wedding/V2CoverGate.vue'
import V2HeroSection from '../../../components/showcase-v2/wedding/V2HeroSection.vue'
import V2StorySection from '../../../components/showcase-v2/wedding/V2StorySection.vue'
import {
  WEDDING_COLORS,
  WEDDING_FONTS,
  WEDDING_TRANSLATIONS,
  WEDDING_MONOGRAM_FALLBACK,
  WEDDING_PARTICLE_SHAPES,
} from './wedding.data'
import { getWeddingCoupleNames } from './useWeddingCoupleNames'

/** The "Storybook Romance" V2 category variant. */
export const weddingVariant: V2CategoryVariant = {
  id: 'wedding',
  CoverGate: V2CoverGate,
  HeroSection: V2HeroSection,
  StorySection: V2StorySection,
  colors: WEDDING_COLORS,
  fonts: WEDDING_FONTS,
  translations: WEDDING_TRANSLATIONS,
  monogramFallback: WEDDING_MONOGRAM_FALLBACK,
  particleShapes: WEDDING_PARTICLE_SHAPES,
  deriveHeroProps: (hosts: Host[]) => ({ coupleNames: getWeddingCoupleNames(hosts) }),
}
