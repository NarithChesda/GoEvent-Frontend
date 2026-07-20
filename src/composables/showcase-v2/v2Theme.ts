import type { TemplateColor, TemplateFont } from '../useEventShowcase'

/**
 * Generic V2 theming mechanism, shared by every category variant.
 *
 * V2 is template-driven the same way V1 is: colors come from the event's
 * `template_colors` (matched by `name`, see `V2_COLOR_NAMES` below) and fonts
 * come from `template_fonts` (matched by `font_type`, see `V2_FONT_TYPES`
 * below). Both fall back to the active category variant's own default (e.g.
 * `categories/wedding.ts`'s "Storybook Romance" look) for any slot a
 * template doesn't define. See docs/backend-api-requirements/showcase-v2-theming.md.
 *
 * The 8 slot names below (`ivory`, `blush`, `gold`, …) are a fixed design-
 * token *contract* — every `core/` component's `<style>` references these
 * exact `--v2-*` CSS variable names, so every category variant must supply
 * values for all 8, even if a name reads as wedding-flavored (a birthday
 * variant's "confetti pink" still maps into the `blush` slot). Only the
 * *values* differ per category, never the slot names/CSS var names — that's
 * what keeps `core/` components category-agnostic without a rename.
 */
export const V2_COLOR_SLOTS = [
  'ivory',
  'blush',
  'blushDeep',
  'sage',
  'sageDeep',
  'charcoal',
  'gold',
  'inkSoft',
] as const

export type V2ColorSlot = (typeof V2_COLOR_SLOTS)[number]
export type V2ColorPalette = Record<V2ColorSlot, string>
export type V2Fonts = { display: string; body: string }

/**
 * `TemplateColor.name` values that map to each V2 palette slot. Prefixed
 * `v2-` so a template can carry both a V1 palette (primary/secondary/accent/…)
 * and a V2 palette side by side without collisions.
 */
export const V2_COLOR_NAMES: Record<V2ColorSlot, string> = {
  ivory: 'v2-ivory',
  blush: 'v2-blush',
  blushDeep: 'v2-blush-deep',
  sage: 'v2-sage',
  sageDeep: 'v2-sage-deep',
  charcoal: 'v2-charcoal',
  gold: 'v2-gold',
  inkSoft: 'v2-ink-soft',
}

/**
 * Resolves the V2 color palette from a template's `template_colors` array,
 * falling back to `defaults` (the active category variant's palette) for any
 * slot the template doesn't define (name lookup is case-insensitive,
 * mirroring `useTemplateProcessor.extractTemplateColors`).
 */
export function resolveV2Colors(
  defaults: V2ColorPalette,
  templateColors: TemplateColor[] = [],
): V2ColorPalette {
  const byName = (name: string): string | undefined => {
    const match = templateColors.find((c) => c.name?.toLowerCase() === name)
    return match?.hex_color_code || match?.hex_code || undefined
  }

  const result = {} as V2ColorPalette
  for (const slot of V2_COLOR_SLOTS) {
    result[slot] = byName(V2_COLOR_NAMES[slot]) || defaults[slot]
  }
  return result
}

export type V2FontRole = 'body' | 'display'

/**
 * `TemplateFont.font_type` values that map to each V2 font role. Dedicated
 * values (not V1's `primary`/`secondary`/`accent`/`decorative`) so a
 * template's V1 fonts never leak into V2 by accident — V2 keeps rendering
 * its own default typeface until a template explicitly assigns a font to
 * one of these two. Not yet a valid backend `font_type` choice — see
 * docs/backend-api-requirements/showcase-v2-theming.md.
 */
export const V2_FONT_TYPES: Record<V2FontRole, string> = {
  body: 'v2-body',
  display: 'v2-display',
}

/**
 * Finds the template font assigned to a V2 role for the current language.
 * Deliberately does **not** reuse `useTemplateProcessor.getLanguageFonts` —
 * that helper cascades unset roles down to V1's `primary` font, which is
 * exactly the accidental inheritance this is meant to avoid. No match here
 * means "template didn't opt this role into V2" — the caller should fall
 * back to the category variant's own default font, not to any V1 font.
 */
export function findV2TemplateFont(
  templateFonts: TemplateFont[],
  language: string,
  role: V2FontRole,
): TemplateFont | null {
  return (
    templateFonts.find((f) => f.language === language && f.font_type === V2_FONT_TYPES[role]) ||
    null
  )
}

/** CSS custom properties applied on the V2 experience root. */
export function buildV2CssVars(colors: V2ColorPalette, fonts: V2Fonts): Record<string, string> {
  return {
    '--v2-ivory': colors.ivory,
    '--v2-blush': colors.blush,
    '--v2-blush-deep': colors.blushDeep,
    '--v2-sage': colors.sage,
    '--v2-sage-deep': colors.sageDeep,
    '--v2-charcoal': colors.charcoal,
    '--v2-gold': colors.gold,
    '--v2-ink-soft': colors.inkSoft,
    '--v2-display': fonts.display,
    '--v2-body': fonts.body,
  }
}

/**
 * Generic monogram/initials for the cover seal, footer credit, etc. Works
 * for any category: pass whichever 1-2 "named parties" the category cares
 * about (couple hosts for a wedding, the honoree for a birthday, …) and a
 * category-appropriate fallback glyph.
 */
export function deriveV2Monogram(
  names: Array<string | undefined>,
  eventTitle: string | undefined,
  fallbackSymbol: string,
): string {
  const initials = names
    .map((n) => n?.trim().charAt(0))
    .filter((c): c is string => Boolean(c))
  if (initials.length >= 2) return initials.slice(0, 2).join(' · ')
  if (initials.length === 1) return initials[0]
  return eventTitle?.trim().charAt(0) || fallbackSymbol
}
