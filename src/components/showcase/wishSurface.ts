/**
 * The colours a guestbook blessing card is drawn in, taken from the template
 * rather than from a white that suits only some of them.
 *
 * Two looks, and the template's own ground decides between them:
 *
 *   - LIGHT — a pale tint of the template's secondary colour (its primary when
 *     it has none) on warm white. For the templates whose base is white, cream
 *     or a pastel, which is where a light card already belonged.
 *   - DEEP — the ground's own colour taken a step darker. A green template's
 *     card is a deeper green, a maroon one's a deeper maroon, so the card reads
 *     as part of the invitation rather than a white box laid on it.
 *
 * The ground is the template's declared base: its `template` colour, else its
 * `blur-effect` colour. NOT `backgroundColor`, which the template processor
 * fills with the primary itself whenever no colour is named "background" (that
 * is nearly every template), and which is how the first versions of this
 * section drew a near-white card on every one of them. Nor can the ink alone
 * decide: gold is the ink of both gold-on-maroon and gold-on-parchment
 * templates (see glassTone.ts). With no declared ground the card is light,
 * which is the look that is never unreadable.
 *
 * Either way the text is the template's primary, moved only in lightness and
 * only as far as small text needs (4.5:1): darker on a light card, lighter on a
 * deep one. Its hue is never changed, so gold on a cream card prints as a
 * bronze of the same gold rather than switching to black.
 */
import { parseHex, relativeLuminance } from './glassTone'

type Rgb = [number, number, number]

export type WishTone = 'light' | 'deep'

export interface WishSurface {
  tone: WishTone
  /** The card's fill, `#rrggbb`. */
  surface: string
  /** The message and the signature: the primary, moved only as far as 4.5:1 needs. */
  ink: string
  /** Secondary lines, softened toward the card only while they still read. */
  muted: string
  /** The inner frame and its ornament: decoration, so it is not held to 4.5:1. */
  frame: string
}

export interface WishSurfaceInput {
  /** The template's primary colour. */
  ink: string | null | undefined
  /** The template's declared base colour (`template`, else `blur-effect`), if any. */
  ground?: string | null
  /** What a light card is tinted with: the secondary colour. */
  tint?: string | null
}

/**
 * A ground darker than this is one a deep card belongs on. 0.18 sits between
 * the darkest pastels (a dusty rose is ~0.35) and the template bases that
 * read as solid colour (the greens, maroons, navies and browns measure under
 * 0.1).
 */
export const DEEP_GROUND_CEILING = 0.18

const SMALL_TEXT_CONTRAST = 4.5
const INK_ON_GROUND_CONTRAST = 3
const WARM_WHITE: Rgb = [253, 250, 244]
const BLACK: Rgb = [0, 0, 0]
const WHITE: Rgb = [255, 255, 255]

/** How much of the tint a light card carries: enough to belong, not enough to dim the ink. */
const LIGHT_TINT = 0.12
/** How far below its ground a deep card sits. */
const DEEPEN = 0.25

const mix = (a: Rgb, b: Rgb, amount: number): Rgb =>
  [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * amount) as Rgb

const toHex = (rgb: Rgb): string =>
  `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`

const contrast = (a: Rgb, b: Rgb): number => {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** The ink, moved toward black or white in small steps until it reads on `surface`. */
const readableInk = (ink: Rgb, surface: Rgb, toward: Rgb): Rgb => {
  for (let step = 0; step <= 10; step++) {
    const candidate = mix(ink, toward, step / 10)
    if (contrast(candidate, surface) >= SMALL_TEXT_CONTRAST) return candidate
  }
  return toward
}

/** A quieter step of `ink`, eased toward the card only as far as 4.5:1 allows. */
const softenedInk = (ink: Rgb, surface: Rgb): Rgb => {
  for (const amount of [0.35, 0.25, 0.15]) {
    const softer = mix(ink, surface, amount)
    if (contrast(softer, surface) >= SMALL_TEXT_CONTRAST) return softer
  }
  return ink
}

export function wishSurface({ ink, ground, tint }: WishSurfaceInput): WishSurface {
  const inkRgb = parseHex(ink) ?? [74, 35, 54]
  const groundRgb = parseHex(ground)

  // Deep only for a dark ground the template actually writes its ink on, i.e.
  // one the ink reads against (3:1, the large-text floor most of an invitation
  // is set at). Navy ink on a navy base means the template's text lives on
  // something lighter than its base, so the card does too.
  const tone: WishTone =
    groundRgb &&
    relativeLuminance(groundRgb) < DEEP_GROUND_CEILING &&
    contrast(inkRgb, groundRgb) >= INK_ON_GROUND_CONTRAST
      ? 'deep'
      : 'light'

  const surfaceRgb =
    tone === 'deep'
      ? mix(groundRgb!, BLACK, DEEPEN)
      : mix(WARM_WHITE, parseHex(tint) ?? inkRgb, LIGHT_TINT)

  const textRgb = readableInk(inkRgb, surfaceRgb, tone === 'deep' ? WHITE : BLACK)

  return {
    tone,
    surface: toHex(surfaceRgb),
    ink: toHex(textRgb),
    muted: toHex(softenedInk(textRgb, surfaceRgb)),
    frame: toHex(mix(textRgb, surfaceRgb, 0.45)),
  }
}
