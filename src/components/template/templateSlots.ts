/**
 * The named slots the showcase actually looks up on a template.
 *
 * Both colors and fonts are stored as free-form rows, but the showcase doesn't
 * read them positionally — it searches them BY NAME. A color called `accent` is
 * what tints falling particles; a color called `banana` is never read as
 * anything. Nothing in the template form communicated that, so partners were
 * naming colors however they liked and then wondering why the showcase ignored
 * them. These lists are what the suggestion dropdowns offer.
 *
 * Kept in lockstep with:
 *   - `extractTemplateColors` in composables/showcase/useTemplateProcessor.ts
 *     (the color name lookups + their fallback chains)
 *   - `getLanguageFonts` in the same file, plus TemplateFontType
 */

export interface TemplateSlotOption {
  /**
   * Canonical value written to the template. Color lookup lower-cases both
   * sides before comparing, so this is the normalized form rather than a
   * required spelling.
   */
  value: string
  /** i18n key root — `${i18nBase}.label`, `.description`, and `.fallback`. */
  i18nBase: string
  /**
   * The showcase resolves this slot but no component renders the result, so
   * setting it currently does nothing visible. Surfaced in the dropdown rather
   * than hidden, because the value is still a valid backend enum and a partner
   * who sees it in the API would otherwise wonder why it's missing here.
   */
  unused?: boolean
}

const COLOR_BASE = 'management.templateSlots.colors'

/**
 * Ordered by how much of the showcase each one paints, so the most consequential
 * slots are the first things a partner sees.
 */
export const TEMPLATE_COLOR_SLOTS: TemplateSlotOption[] = [
  { value: 'primary', i18nBase: `${COLOR_BASE}.primary` },
  { value: 'secondary', i18nBase: `${COLOR_BASE}.secondary` },
  { value: 'accent', i18nBase: `${COLOR_BASE}.accent` },
  { value: 'background', i18nBase: `${COLOR_BASE}.background` },
  { value: 'template', i18nBase: `${COLOR_BASE}.template` },
  { value: 'guestname', i18nBase: `${COLOR_BASE}.guestname` },
  { value: 'blur-effect', i18nBase: `${COLOR_BASE}.blurEffect` },
]

const FONT_BASE = 'management.templateSlots.fonts'

/**
 * Mirrors TemplateFontType. `accent` and `decorative` ARE resolved by
 * useEventShowcase (accentFont/decorativeFont) and returned from it, but no
 * component consumes either — verified across the whole `src` tree — so they're
 * flagged rather than presented as equals to primary/secondary.
 *
 * `v2-body` and `v2-display` are flagged for a different reason: they render, but
 * only in the scroll-story showcase, which is still behind
 * `VITE_SHOWCASE_TEMPLATE_VERSION=v2` and reaches no partner's guests yet. They
 * are listed anyway, for the reason in `unused` above — they are valid backend
 * enum values as of the Aug 2026 font-library release, and a partner who meets
 * them in the API would wonder why the studio pretends they don't exist.
 */
export const TEMPLATE_FONT_TYPE_SLOTS: TemplateSlotOption[] = [
  { value: 'primary', i18nBase: `${FONT_BASE}.primary` },
  { value: 'secondary', i18nBase: `${FONT_BASE}.secondary` },
  { value: 'accent', i18nBase: `${FONT_BASE}.accent`, unused: true },
  { value: 'decorative', i18nBase: `${FONT_BASE}.decorative`, unused: true },
  { value: 'v2-body', i18nBase: `${FONT_BASE}.v2Body`, unused: true },
  { value: 'v2-display', i18nBase: `${FONT_BASE}.v2Display`, unused: true },
]

/** Whether a partner-typed name maps onto a slot the showcase reads. */
export function isRecognizedColorSlot(name: string): boolean {
  const normalized = name.trim().toLowerCase()
  return TEMPLATE_COLOR_SLOTS.some((slot) => slot.value === normalized)
}
