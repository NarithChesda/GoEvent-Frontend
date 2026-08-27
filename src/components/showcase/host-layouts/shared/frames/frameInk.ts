import type { HostFrameStyle } from '@/services/api/types/template.types'

/**
 * The colour half of the frame contract, shared by the title frame and the
 * avatar frame so a matched pair can never resolve to two different fills.
 *
 * Two of the five styles (`banner`, `ribbon`) put content *on* the accent, and
 * two (`plaque`, `laurel`) leave it on the page. That split is the only thing
 * these helpers decide — the geometry belongs to each component's stylesheet.
 */

/** Force a template colour to `#rrggbb` so the mixes below are always valid. */
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

/** Styles whose label sits on the fill rather than on the page. */
const FILLED: ReadonlySet<HostFrameStyle> = new Set<HostFrameStyle>(['banner', 'ribbon'])

export const isFilledFrame = (frame: HostFrameStyle): boolean => FILLED.has(frame)

/**
 * The CSS custom properties a frame draws with.
 *
 * `--frame-ink` is only meaningful on the filled styles, and it is chosen
 * against the fill rather than inherited: nothing stops a template from picking
 * a near-white accent, and a title inheriting the primary onto that is
 * unreadable. Off-white and near-black rather than pure — pure white on a
 * saturated fill vibrates, and pure black reads as a hole punched in it.
 */
export function frameInkVars(
  frame: HostFrameStyle,
  accentColor: string,
  primaryColor: string,
): Record<string, string> {
  const accent = toHex6(accentColor || primaryColor, '#b08d57')
  const primary = toHex6(primaryColor || accentColor, '#7a5c3e')

  return {
    '--frame-fill': accent,
    '--frame-rule': accent,
    '--frame-ink': isFilledFrame(frame)
      ? relativeLuminance(accent) > 0.62
        ? '#2a2118'
        : '#fdfaf4'
      : primary,
  }
}
