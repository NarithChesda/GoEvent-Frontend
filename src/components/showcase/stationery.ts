/**
 * The stationery set: what the date, the venue & its map, the countdown and the
 * RSVP share, so that four blocks picked from four separate lists still read as
 * one printed invitation rather than four designs that happen to sit together.
 *
 * Each block keeps its own composition. What they share is the material:
 *
 *   - one PAPER for every paper object — the calendar card, the reply card
 *     (and its envelope's card), the map's polaroid. It is the calendar card's
 *     own paper when the template draws one (that is the partner's chosen
 *     stock), otherwise a warm white leaning a few percent toward the template's
 *     tone. Before this each object picked its own white: pure white for the
 *     calendar card, warm for the reply card, a third for the polaroid.
 *   - one CORNER — the calendar card's radius when there is one, else 4px.
 *   - one LIFT — the calendar card's shadow, by the paper's tone.
 *   - one ACCENT — the date design's marker colour, the mark it spends on the
 *     event day. The countdown and the RSVP used the template's accent instead,
 *     so a template whose marker is set to its secondary colour drew the day in
 *     one colour and every mark below it in another.
 *
 * Pure data, no DOM: the stage resolves it once and hands the same answer to
 * EventInfo and to the countdown + RSVP section.
 */
import type { EventDetailsMarkerColorSource } from '@/services/api/types/template.types'
import {
  paperToneOf,
  resolveCalendarCardColor,
  resolveCalendarCardRadius,
} from './calendar-designs/calendarModel'
import { parseHex, relativeLuminance } from './glassTone'

type Rgb = [number, number, number]

/**
 * Warm off-white and a deep brown-black, rather than pure white and black:
 * pure white under a hairline reads as a screen, not as card stock, and pure
 * black type on it is harsher than print.
 */
export const PAPER_LIGHT = '#fdfaf4'
export const PAPER_DARK = '#2a2118'

/** Small text — the form's labels, a caption — so AA is 4.5:1. */
const SMALL_TEXT_CONTRAST = 4.5

/** How far the default stock leans toward the template's own tone. */
const PAPER_TINT = 0.06

/** The corner of paper that has no calendar card to take one from. */
export const DEFAULT_PAPER_RADIUS = 4

/** Used only when the chosen marker slot resolves to nothing (a custom source with no hex yet). */
export const MARKER_FALLBACK = '#b3261e'

const contrast = (a: Rgb, b: Rgb): number => {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const toHex = ([r, g, b]: Rgb): string =>
  `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`

const mix = (a: Rgb, b: Rgb, amount: number): Rgb =>
  [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * amount) as Rgb

// --- The accent -------------------------------------------------------------------

export interface MarkerColorInput {
  source?: EventDetailsMarkerColorSource | null
  custom?: string | null
  primary?: string | null
  secondary?: string | null
  accent?: string | null
}

/**
 * The one colour the date design spends on its mark — the circled day, the
 * flanked rules, the ticket's perforation — and, since the stationery set, every
 * block's one mark below it too.
 */
export function resolveMarkerColor({ source, custom, primary, secondary, accent }: MarkerColorInput): string {
  switch (source) {
    case 'custom':
      return custom || MARKER_FALLBACK
    case 'primary':
      return primary || MARKER_FALLBACK
    case 'secondary':
      return secondary || primary || MARKER_FALLBACK
    case 'accent':
    default:
      return accent || primary || MARKER_FALLBACK
  }
}

// --- The paper ----------------------------------------------------------------------

export interface StationeryPaper {
  /** The stock every paper object is printed on, `#rrggbb`. */
  paper: string
  /** Its corner, in px. */
  radius: number
  /** Light or dark stock. */
  tone: 'light' | 'dark'
  /** The lift every paper object shares — the calendar card's, by tone. */
  shadow: string
}

/**
 * The calendar card's lift. The hairline keeps a white card's edge on a white
 * page; a dark card needs more shadow to leave the page at all. `currentColor`
 * resolves on whichever element spends it, so each object's hairline is in its
 * own ink.
 */
export const PAPER_SHADOW: Record<'light' | 'dark', string> = {
  light:
    'inset 0 0 0 1px color-mix(in srgb, currentColor 8%, transparent), 0 1px 2px rgb(0 0 0 / 0.06), 0 16px 36px -16px rgb(0 0 0 / 0.3)',
  dark:
    'inset 0 0 0 1px color-mix(in srgb, currentColor 16%, transparent), 0 1px 2px rgb(0 0 0 / 0.2), 0 18px 40px -16px rgb(0 0 0 / 0.55)',
}

export interface StationeryPaperInput {
  /** The template's tone (its background colour), the default stock leans toward. */
  tone?: string | null
  /**
   * The calendar card, when the date design draws one: its paper and corner
   * ARE the template's stock. Null for every other date design.
   */
  calendarCard?: { color?: string | null; radius?: number | null } | null
}

export function stationeryPaper({ tone, calendarCard }: StationeryPaperInput): StationeryPaper {
  let paper: string
  let radius: number
  if (calendarCard) {
    paper = resolveCalendarCardColor(calendarCard.color).toLowerCase()
    radius = resolveCalendarCardRadius(calendarCard.radius)
  } else {
    const base = parseHex(PAPER_LIGHT)!
    const toneRgb = parseHex(tone)
    paper = toHex(toneRgb ? mix(base, toneRgb, PAPER_TINT) : base)
    radius = DEFAULT_PAPER_RADIUS
  }
  const paperTone = paperToneOf(paper)
  return { paper, radius, tone: paperTone, shadow: PAPER_SHADOW[paperTone] }
}

/**
 * The ink small text is printed in on `paper`: the template's own when it
 * reads at small-text contrast, else whichever of the deep brown-black and the
 * warm white reads better — the paper can be the partner's dark card.
 */
export function inkOnPaper(ink: string | null | undefined, paper: string): string {
  const paperRgb = parseHex(paper)
  const inkRgb = parseHex(ink)
  if (!paperRgb) return ink || PAPER_DARK
  if (inkRgb && contrast(inkRgb, paperRgb) >= SMALL_TEXT_CONTRAST) return toHex(inkRgb)
  return contrast(parseHex(PAPER_DARK)!, paperRgb) >= contrast(parseHex(PAPER_LIGHT)!, paperRgb)
    ? PAPER_DARK
    : PAPER_LIGHT
}

/**
 * A colour readable *against* the template's ink — the label on the one filled
 * control an inked design allows (the RSVP submit, the selected answer), and
 * the flip board's digits.
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
