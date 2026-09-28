/**
 * Which footer a template draws: `template_assets.footer_design`, rendered by
 * ShowcaseFooter.vue.
 *
 * The footer had two looks, and the Liquid Glass switch
 * (`display_liquid_glass_background`) chose between them as a side effect of
 * frosting the content card: white marks on a tinted band when it was on, the
 * template's ink on the page when it was off. Those two are now designs of
 * their own (`glass`, `plain`) beside two new ones (`card`, `minimal`), and the
 * footer is chosen for itself.
 *
 * A template with no `footer_design` still gets what the switch gives it, so
 * every published template renders exactly as before. `resolveFooterDesign` is
 * the only implementation of that fallback: the showcase and the partner form
 * both go through it, and the form seeds its picker from it, so it opens on the
 * footer the template already draws and a save pins exactly that. Never
 * backfill the field.
 */
import type { FooterDesignConfig, FooterDesignType } from '@/services/api/types/template.types'

export const FOOTER_DESIGN_TYPES: readonly FooterDesignType[] = [
  'plain',
  'glass',
  'card',
  'minimal',
]

/** What the Liquid Glass switch gave the footer, which is what "no design" still means. */
export const legacyFooterDesign = (liquidGlass: boolean | null | undefined): FooterDesignType =>
  // Absent counts as on: the switch has always defaulted to on.
  liquidGlass === false ? 'plain' : 'glass'

/**
 * The footer to draw. An unknown type falls back the same way an absent one
 * does, so a value from a newer build never changes what an older one draws.
 */
export const resolveFooterDesign = (
  config: FooterDesignConfig | null | undefined,
  liquidGlass: boolean | null | undefined,
): FooterDesignType => {
  const type = config?.type
  return type && (FOOTER_DESIGN_TYPES as readonly string[]).includes(type)
    ? type
    : legacyFooterDesign(liquidGlass)
}
