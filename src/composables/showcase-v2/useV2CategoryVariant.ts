import type { Component } from 'vue'
import type { Host } from '../useEventShowcase'
import type { V2ColorPalette, V2Fonts } from './v2Theme'
import type { V2CategoryTranslations } from './v2Translations'
import type { V2ParticleShape } from './v2ParticleShapes'
import { weddingVariant } from './categories/wedding'

/**
 * Everything that differs between V2 category experiences (wedding,
 * birthday, housewarming, …): the cover/hero/story components, the default
 * theme, and the copy. Every `core/` component (agenda, gallery, venue,
 * RSVP, guestbook, footer, chapter shell, progress dots, particle field) is
 * shared verbatim across every variant — only these three sections plus
 * theme/copy vary.
 */
export interface V2CategoryVariant {
  id: string
  CoverGate: Component
  HeroSection: Component
  StorySection: Component
  colors: V2ColorPalette
  fonts: V2Fonts
  translations: V2CategoryTranslations
  monogramFallback: string
  /**
   * Background particle silhouettes (V2Tunnel's WebGL sprites / V2PetalField's
   * CSS fallback), cycled per particle/depth-layer. Defaults to `['petals']`
   * in the orchestrator when a variant doesn't set this.
   */
  particleShapes?: V2ParticleShape[]
  /**
   * Extra props this category's CoverGate/HeroSection need beyond the shared
   * base props (eventTitle, monogram, guestName, currentLanguage, …) —
   * spread onto both via `v-bind` so the orchestrator never has to know a
   * category-specific prop name like `coupleNames`.
   */
  deriveHeroProps: (hosts: Host[]) => Record<string, unknown>
}

const V2_CATEGORY_VARIANTS: Record<string, V2CategoryVariant> = {
  wedding: weddingVariant,
}

/**
 * Resolves which V2 category variant (components/theme/copy) to render.
 * Falls back to `wedding` for unmapped categories. Today V2 is only ever
 * gated onto wedding events in the first place (see
 * EventShowcaseRefactored.vue's `useV2Showcase`), so this fallback is
 * currently unreachable — it exists so a future category degrades to a
 * working look instead of a blank screen while its own variant is still
 * being built, rather than as a real design choice for that category.
 */
export function resolveV2Variant(categoryName?: string | null): V2CategoryVariant {
  const key = (categoryName || '').toLowerCase()
  const variant = V2_CATEGORY_VARIANTS[key]
  if (!variant && import.meta.env.DEV && key) {
    console.warn(`[showcase-v2] No V2 variant registered for category "${key}" — falling back to wedding.`)
  }
  return variant || weddingVariant
}
