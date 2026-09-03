import { computed } from 'vue'
import type { DressCodeDesignItem, DressCodeDesignProps, DressCodeGenderGroup } from './types'

/**
 * The derivations every dress code design repeats, resolved once so five
 * designs cannot drift into five answers.
 *
 * The interesting ones are the two ink helpers. Everything else in the showcase
 * is drawn in the template's ink over the template's ground, and both are known
 * ahead of time. A dress code's colour is not: it is whatever the organizer
 * typed into a colour picker, and it is a *fill* rather than an ink. So
 * anything drawn on top of it — a figure on a colour disc, a pip on a swatch —
 * cannot use the template's ink: on a black-tie code it would be invisible, and
 * on a beach code an ink-coloured mark over linen reads as dirt. It is chosen
 * against the fabric instead.
 */

/** Force a colour to `#rrggbb` so the luminance read below is always valid. */
const toHex6 = (color: string | null | undefined, fallback: string): string => {
  const value = (color ?? '').trim()
  if (/^#[0-9a-f]{6}$/i.test(value)) return value
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value)
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`
  return fallback
}

const relativeLuminance = (hex6: string): number => {
  const channel = (at: number) => parseInt(hex6.slice(at, at + 2), 16) / 255
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

/**
 * The ink for anything drawn ON a dress code's colour — the figure inside
 * `palette`'s disc and `ledger`'s badge, the pip on a swatch — chosen against
 * that colour rather than against the template's.
 *
 * The threshold is 0.58 rather than 0.5 because the crossover cases here are
 * real wedding colours — sage, dusty rose, champagne — and they sit just above
 * mid grey. Below 0.5 they take the light ink, which on a mid-tone fill is
 * lower contrast than the dark alternative.
 *
 * Neither ink is pure. Pure white on a saturated fill vibrates, and pure black
 * reads as a hole punched through the disc — the same reason `frameInkVars`
 * picks off-white and near-black for the host frames.
 */
export function garmentContrast(color: string | null | undefined): string {
  const isDark = relativeLuminance(toHex6(color, '#8c8c8c')) <= 0.58
  return isDark ? 'rgba(255, 253, 248, 0.86)' : 'rgba(26, 22, 18, 0.55)'
}

/**
 * The colour the traced fashion-plate line is drawn in: the dress code's own
 * colour, darkened only as far as it must be to stay visible.
 *
 * The line IS the colour here — that is the point of the drawing, and it is
 * what makes a burgundy code look burgundy at a glance. But a dress code is
 * frequently ivory, champagne or flat white, and a white line on the pale
 * ground the figure stands on is not a faint drawing, it is no drawing at all:
 * exactly the blank square this artwork was brought in to replace.
 *
 * So the hue is never changed, only the level. If the colour is lighter than
 * the ground can carry, every channel is scaled by one factor until its
 * luminance reaches FLOOR. Scaling uniformly is what preserves the hue — ivory
 * darkens to a warm stone, champagne to a deeper gold, and both still read as
 * themselves. Mixing toward black, or clamping to a neutral, would not.
 *
 * CEILING sits well above FLOOR so that colours which are *already* legible are
 * passed through untouched. Sage measures 0.58 and draws perfectly well;
 * darkening it too would mean no dress code ever rendered in the colour the
 * organizer actually picked.
 */
const LINE_CEILING = 0.62
const LINE_FLOOR = 0.5

export function garmentLineInk(color: string | null | undefined, ink: string): string {
  const value = (color ?? '').trim()
  // No colour set is not a pale colour — it is no instruction at all, and the
  // template's own ink is a better answer than an invented one.
  if (!value) return ink

  const hex = toHex6(value, '')
  // A colour this build cannot parse (a named colour, an rgb() string) is left
  // exactly as authored: guessing at its luminance is worse than trusting it.
  if (!hex) return value

  const luminance = relativeLuminance(hex)
  if (luminance <= LINE_CEILING) return hex

  const scale = LINE_FLOOR / luminance
  const channel = (at: number) =>
    Math.round(Math.min(255, parseInt(hex.slice(at, at + 2), 16) * scale))
      .toString(16)
      .padStart(2, '0')
  return `#${channel(1)}${channel(3)}${channel(5)}`
}

/** Khmer Unicode range U+1780–U+17FF. Drives the title's own leading. */
export function isKhmerText(value: string | null | undefined): boolean {
  return /[ក-៿]/.test(value || '')
}

/**
 * A dress code with no colour set is not an error state — the organizer may
 * only care about the *kind* of outfit. Falling back to a tint of the template's
 * ink keeps the garment drawn in the invitation's own palette instead of
 * defaulting to a grey that belongs to no template.
 */
export function fabricColor(item: DressCodeDesignItem, ink: string): string {
  const value = (item.color ?? '').trim()
  return value || `color-mix(in srgb, ${ink} 26%, #ffffff)`
}

/** The code a group is currently showing. Null only for an empty group. */
export function activeCodeOf(group: DressCodeGenderGroup): DressCodeDesignItem | null {
  return group.codes[group.activeIndex] ?? group.codes[0] ?? null
}

export function useDressCodeDesign(props: DressCodeDesignProps) {
  const displayFont = computed(() => props.primaryFont || props.currentFont)
  const bodyFont = computed(() => props.secondaryFont || props.currentFont)

  /**
   * Whether the gender captions are worth drawing.
   *
   * A single group is almost always `all` — one instruction for everyone — and
   * a caption reading "All Genders" over the only figure on screen labels
   * nothing. With two groups the caption is the entire point, because it says
   * which figure is whose.
   */
  const showCaptions = computed(() => props.groups.length > 1)

  /** Every code across every group, in group order. `ledger`'s whole list. */
  const allEntries = computed(() =>
    props.groups.flatMap((group) => group.codes.map((code) => ({ group, code }))),
  )

  return {
    displayFont,
    bodyFont,
    showCaptions,
    allEntries,
    isKhmer: isKhmerText,
    activeCodeOf,
    fabric: (item: DressCodeDesignItem) => fabricColor(item, props.primaryColor),
  }
}
