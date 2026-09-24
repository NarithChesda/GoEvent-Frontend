/**
 * The countdown + RSVP section: the countdown and the reply form taken out of
 * the info card into a section of their own (`template_assets.countdown_rsvp_design`),
 * and the frame the venue map is set in back inside that card
 * (`info_card_design.map_style`).
 *
 * Everything here is data, not markup — which design a stored value means, what
 * the count reads at a given moment, which photograph the strips are cut from
 * and which paper the reply card is printed on — so the components are only the
 * drawing and these rules can be tested without mounting anything.
 *
 * Backend contract: docs/backend-api-requirements/countdown-rsvp-design.md
 */
import type {
  CountdownDesignType,
  CountdownRsvpDesignConfig,
  InfoCardMapStyle,
  RsvpDesignType,
} from '@/services/api/types/template.types'
import type { CountdownPhotoFields } from '@/services/api/types/event.types'
import type { CoverPhotoShapeMask } from '@/components/showcase-preview/edit/editContext'
import { toKhmerNumerals } from '@/utils/translations'
import { parseHex, relativeLuminance } from '../glassTone'

// --- Which design ------------------------------------------------------------

/** In the order the partner form offers them; the first is the fallback. */
export const COUNTDOWN_DESIGN_TYPES: readonly CountdownDesignType[] = [
  'strips',
  'flip',
  'orbit',
  'typeset',
]

/** In the order the partner form offers them; the first is the fallback. */
export const RSVP_DESIGN_TYPES: readonly RsvpDesignType[] = ['card', 'envelope', 'glass', 'inline']

/** `window` first: it is what every card drew before the choice existed. */
export const INFO_CARD_MAP_STYLES: readonly InfoCardMapStyle[] = ['window', 'arch', 'atlas', 'polaroid']

const isOneOf = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (list as readonly string[]).includes(value)

/**
 * The section's two designs, or null when the pair stays inside the info card.
 *
 * Null only for an absent config — which is what every template saved before
 * this existed has. Once the config is there the partner chose the section, so
 * a key this build doesn't know (a design added later) degrades to the first
 * design of its kind rather than taking the section away.
 */
export function resolveCountdownRsvpDesign(
  config: Partial<CountdownRsvpDesignConfig> | null | undefined,
): CountdownRsvpDesignConfig | null {
  if (!config || typeof config !== 'object') return null
  return {
    countdown: isOneOf(COUNTDOWN_DESIGN_TYPES, config.countdown)
      ? config.countdown
      : COUNTDOWN_DESIGN_TYPES[0],
    rsvp: isOneOf(RSVP_DESIGN_TYPES, config.rsvp) ? config.rsvp : RSVP_DESIGN_TYPES[0],
  }
}

/** `window` for anything absent or unknown — what every map was drawn in. */
export const resolveMapStyle = (style: unknown): InfoCardMapStyle =>
  isOneOf(INFO_CARD_MAP_STYLES, style) ? style : 'window'

// --- The count ---------------------------------------------------------------

export interface CountdownParts {
  days: number
  hours: number
  minutes: number
  /** The start has been reached. Every design hides then: nothing is left to count. */
  passed: boolean
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * Time left until `target`, floored to the minute.
 *
 * Unlike the card's old count, days are not capped at 99: the strips and the
 * flip board draw however many digits there are, and an invitation sent four
 * months ahead would otherwise say 99 days for its first three weeks.
 */
export function countdownParts(target: number, now: number): CountdownParts {
  const left = target - now
  if (!Number.isFinite(left) || left <= 0) return { days: 0, hours: 0, minutes: 0, passed: true }
  return {
    days: Math.floor(left / DAY),
    hours: Math.floor((left % DAY) / HOUR),
    minutes: Math.floor((left % HOUR) / MINUTE),
    passed: false,
  }
}

/** Milliseconds from `now` to the next whole minute — when the count next changes. */
export const msToNextMinute = (now: number): number => MINUTE - (now % MINUTE) || MINUTE

/**
 * A count as the invitation writes it: at least two digits (`07`, the way a
 * clock face and the card's old count set it), in Khmer numerals for Khmer.
 */
export function formatCount(value: number, language: string | undefined, minDigits = 2): string {
  const digits = String(Math.max(0, Math.floor(value))).padStart(minDigits, '0')
  return language === 'kh' ? toKhmerNumerals(digits) : digits
}

// --- The strips' photograph --------------------------------------------------

interface CountdownPhotoCandidate extends CountdownPhotoFields {
  id: number
  image: string
  is_featured?: boolean
}

/**
 * Which photograph the strips are cut from.
 *
 * The one the organizer marked for the countdown (`is_countdown_photo`) — a
 * choice of its own, so the strips need not repeat the transition stage's
 * picture. Until one is marked, the featured photo (already the event's
 * picture, and already framed), else the first photo. Null draws plain ink.
 */
export function countdownPhoto<T extends CountdownPhotoCandidate>(
  photos: readonly T[] | null | undefined,
): T | null {
  const list = (photos ?? []).filter((photo) => !!photo.image)
  return (
    list.find((photo) => photo.is_countdown_photo === true) ??
    list.find((photo) => photo.is_featured) ??
    list[0] ??
    null
  )
}

/**
 * The photo the strips are drawing that leaves the gallery, so the invitation
 * never shows one photograph twice — the rule a band photo and the cover's
 * framed photo follow.
 *
 * Only a photo MARKED for the countdown, and only while strips are drawn: the
 * featured fallback is the event's photo in general and stays where it is, and
 * a marked photo on a template without strips (or with the countdown switched
 * off) is shown nowhere else, so taking it out would lose it. Switching design
 * therefore puts it back, with nothing stored changing.
 */
export function countdownStripsPhotoId(
  photos: readonly CountdownPhotoCandidate[] | null | undefined,
  design: Partial<CountdownRsvpDesignConfig> | null | undefined,
  countdownShown: boolean,
): number | null {
  if (!countdownShown || resolveCountdownRsvpDesign(design)?.countdown !== 'strips') return null
  return photos?.find((photo) => photo.is_countdown_photo === true && !!photo.image)?.id ?? null
}

/** The PATCH body that makes a photo the countdown's photo, or stops it being one. */
export const countdownPhotoPayload = (isCountdown: boolean): Required<CountdownPhotoFields> => ({
  is_countdown_photo: isCountdown,
})

/** True once the backend echoes the field back — a server that doesn't know it drops it and answers 200. */
export const responseSupportsCountdownPhoto = (photo?: CountdownPhotoFields | null): boolean =>
  photo != null && photo.is_countdown_photo !== undefined

/**
 * The strips as a shape for the framing editor: three opaque columns with the
 * gaps between them clear, filling the frame edge to edge (so its opaque bounds
 * are the whole image). The editor dims what the gaps throw away, and the
 * picker's thumbnails are cut to the same three columns, so the organizer
 * frames against the cuts guests will see.
 *
 * `gap` is one gap's width as a share of the frame's width. Drawn in a square
 * viewBox with `preserveAspectRatio="none"`: the columns only have widths, so
 * it stretches to any frame without distorting anything.
 */
export function stripesShapeMask(gap: number, count = 3): CoverPhotoShapeMask {
  const unit = 1000
  const g = Math.min(Math.max(gap, 0), 0.2) * unit
  const width = (unit - g * (count - 1)) / count
  const rects = Array.from(
    { length: count },
    (_, i) => `<rect x="${(i * (width + g)).toFixed(2)}" y="0" width="${width.toFixed(2)}" height="${unit}"/>`,
  ).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${unit} ${unit}" preserveAspectRatio="none">${rects}</svg>`
  return {
    url: `data:image/svg+xml,${encodeURIComponent(svg)}`,
    bounds: { x: 0, y: 0, width: 1, height: 1 },
  }
}

// --- Paper and ink -----------------------------------------------------------

type Rgb = [number, number, number]

/**
 * Warm off-white and a deep brown-black, rather than pure white and black:
 * pure white under a hairline border reads as a screen, not as card stock, and
 * pure black type on it is harsher than print. The same pair EventInfo prints
 * its filled controls in.
 */
export const PAPER_LIGHT = '#fdfaf4'
export const PAPER_DARK = '#2a2118'

/** The form's smallest labels are ~0.72rem: small text, so AA is 4.5:1. */
const SMALL_TEXT_CONTRAST = 4.5

const contrast = (a: Rgb, b: Rgb): number => {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const toHex = ([r, g, b]: Rgb): string =>
  `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`

const mix = (a: Rgb, b: Rgb, amount: number): Rgb =>
  [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * amount) as Rgb

/**
 * A colour readable *against* the template's ink — the label on the one filled
 * control an inked form has (the selected answer, the submit button).
 *
 * It cannot simply be the template's background: `useTemplateProcessor`
 * substitutes the primary colour for any template that declares no colour named
 * `background`, so `background` arrives as the ink itself more often than not,
 * and the submit button would paint primary type on a primary fill. The
 * declared background is kept only while it stays readable on the ink.
 */
export function paperOnInk(ink: string | null | undefined, background: string | null | undefined): string {
  const inkRgb = parseHex(ink)
  if (!inkRgb) {
    // An ink this can't measure (a named colour, an rgb() string). The declared
    // background is only safe if it is demonstrably a different colour.
    const bg = (background ?? '').trim()
    return bg && bg.toLowerCase() !== (ink ?? '').trim().toLowerCase() ? bg : PAPER_LIGHT
  }
  const bgRgb = parseHex(background)
  if (bgRgb && contrast(bgRgb, inkRgb) >= SMALL_TEXT_CONTRAST) return background!.trim()
  return contrast(parseHex(PAPER_LIGHT)!, inkRgb) >= contrast(parseHex(PAPER_DARK)!, inkRgb)
    ? PAPER_LIGHT
    : PAPER_DARK
}

export interface ReplyCardColors {
  /** The card stock. */
  paper: string
  /** Everything printed on it, and the fill of its one solid control. */
  ink: string
}

/** How far the stock leans toward the template's own tone. */
const PAPER_TINT = 0.06

/**
 * The reply card's paper and ink.
 *
 * The stock is always light, because a reply card is: warm off-white, leaning a
 * few percent toward the template's tone so it belongs to the design rather
 * than to a stationery shop. It prints in the template's ink when that reads at
 * small-text contrast, and in deep brown-black when it doesn't — a gold-ink
 * template's gold measures about 2:1 on white, and the form's labels are small.
 */
export function replyCardColors(
  ink: string | null | undefined,
  tone: string | null | undefined,
): ReplyCardColors {
  const base = parseHex(PAPER_LIGHT)!
  const toneRgb = parseHex(tone)
  const paperRgb = toneRgb ? mix(base, toneRgb, PAPER_TINT) : base
  const inkRgb = parseHex(ink)
  const printable = inkRgb && contrast(inkRgb, paperRgb) >= SMALL_TEXT_CONTRAST
  return { paper: toHex(paperRgb), ink: printable ? toHex(inkRgb) : PAPER_DARK }
}
