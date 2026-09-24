/**
 * Which way the main stage's liquid glass moves the ground behind the text —
 * `template_assets.display_liquid_glass_background`, drawn by MainContentStage.
 *
 * The switch exists for templates whose backdrop sits in the same tone as their
 * ink. What separates text from a ground is the gap in luminance between the
 * two, and the glass used to be one fixed white film: it can only ever raise
 * the ground. That is the right direction for dark ink and the wrong one for
 * everything else — and "everything else" is exactly the case the switch gets
 * turned on for, gold on parchment:
 *
 *   - Gold is a mid-tone ink. #dfa54b measures 2.2:1 against pure white, so no
 *     amount of frost makes it legible; the film only washed out the artwork.
 *     (Measured on AM004: 1.88:1 with the glass on.)
 *   - Pale ink over a dark backdrop is worse than useless: the film lifted
 *     AM003's maroon to a muddy mauve and cut its contrast from 9.4:1 to 5.2:1.
 *   - Tinting the glass dark instead fails at any strength short of a near-black
 *     card, because it drags the ground *through* the ink's own luminance on the
 *     way down — a moderate smoke took #dfa54b to 1.04:1.
 *
 * So the tone is chosen against the ink. Ink that white can lift to 3:1 keeps
 * the frost. Any lighter ink gets `clear` glass — the blur, which calms petals
 * and filigree behind the glyphs, without the film — and MainContentStage gives
 * its text a fine edge in a deep shade of its own colour instead, which is how
 * the metallic finishes already keep pale gold legible on a cream card. The
 * contrast then comes from the glyph rather than from covering the backdrop.
 *
 * Glass shaped around the text instead of spread across the card was tried and
 * rejected: feathered pools read as smudges on a pale ground, and hard-edged
 * plates turned a centred paragraph into a stack of redaction bars.
 */
export type GlassTone = 'frost' | 'clear'

/**
 * The lightest ink a white ground can still carry at 3:1 (the WCAG floor for
 * large text, which is most of an invitation): (1 + 0.05) / (L + 0.05) ≥ 3 at
 * L ≤ 0.30. Past it, frosting can't reach legibility at all.
 */
export const FROST_INK_CEILING = 0.3

/** `#rgb` / `#rrggbb` → [r, g, b] in 0–255, or null for anything else. */
export const parseHex = (color: string | null | undefined): [number, number, number] | null => {
  const value = (color ?? '').trim()
  const long = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value)
  if (long) return [parseInt(long[1], 16), parseInt(long[2], 16), parseInt(long[3], 16)]
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value)
  if (short)
    return [
      parseInt(short[1] + short[1], 16),
      parseInt(short[2] + short[2], 16),
      parseInt(short[3] + short[3], 16),
    ]
  return null
}

/**
 * WCAG relative luminance — linearised, unlike the gamma-space shortcut the
 * frame and dress-code inks use. Those only rank a fill as light or dark; this
 * one feeds a contrast bound, and the shortcut reads mid tones far too dark.
 */
export const relativeLuminance = ([r, g, b]: [number, number, number]): number => {
  const linear = (channel: number) => {
    const c = channel / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

/**
 * The glass tone for a template's primary ink. An ink this can't read keeps
 * `frost`, which is what every template rendered before the tone existed.
 */
export const resolveGlassTone = (ink: string | null | undefined): GlassTone => {
  const rgb = parseHex(ink)
  if (!rgb) return 'frost'
  return relativeLuminance(rgb) > FROST_INK_CEILING ? 'clear' : 'frost'
}
