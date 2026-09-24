import type { EventDetailsCalendarStyle } from '@/services/api/types/template.types'
import { toKhmerNumerals } from '@/utils/translations'

/**
 * Everything the calendar styles draw, derived once from the event's date.
 *
 * Pure and DOM-free, so each style is a composition over the same facts rather
 * than a second opinion about which week the date falls in or how a Khmer
 * numeral is written. EventInfo builds it; the styles only read it.
 */

export interface CalendarDay {
  /** The number as printed — Khmer numerals in Khmer. */
  label: string
  day: number
  isEvent: boolean
  /** False for the neighbouring month's days in the event's week. */
  inMonth: boolean
}

export interface CalendarDesignModel {
  /** "December 2025", localized. */
  heading: string
  month: string
  year: string
  /** Full weekday name of the event day. */
  weekday: string
  /** The event day's number as printed. */
  dayLabel: string
  /** The day before's number — the page a desk calendar tears off to get here. */
  previousDayLabel: string
  /** Short weekday names, Sunday first. */
  weekdayLabels: string[]
  /** The month as rows of seven, padded with nulls on both ends. */
  weeks: (CalendarDay | null)[][]
  /** The event's own Sunday-to-Saturday week, neighbouring-month days included. */
  week: CalendarDay[]
  /** Every day of the month, 1 → N. */
  monthDays: CalendarDay[]
}

export interface CalendarDesignInput {
  date: Date
  language: string
  heading: string
  weekdayLabels: string[]
  weekday: string
  month: string
  year: string
}

export const CALENDAR_STYLES: readonly EventDetailsCalendarStyle[] = [
  'classic',
  'wall',
  'week',
  'desk',
  'dial',
  'card',
]

/** The `card` calendar's corner radius range, in px. */
export const CALENDAR_CARD_RADIUS_MAX = 40

/** A stored radius, clamped to what the editor offers; absent → square. */
export function resolveCalendarCardRadius(radius: unknown): number {
  const value = typeof radius === 'number' && Number.isFinite(radius) ? radius : 0
  return Math.min(CALENDAR_CARD_RADIUS_MAX, Math.max(0, Math.round(value)))
}

/** The `card` calendar's paper when the template sets none: plain white card. */
export const CALENDAR_CARD_DEFAULT_COLOR = '#FFFFFF'

/** A stored paper colour if it is a hex this can read, else white. */
export function resolveCalendarCardColor(color: unknown): string {
  return typeof color === 'string' && parseHex(color) ? color.trim() : CALENDAR_CARD_DEFAULT_COLOR
}

/**
 * The ink the `card` calendar prints in: the template's own, unless it would be
 * unreadable on the paper the template chose — then near-black or white,
 * whichever reads.
 *
 * The paper is the template's choice, and it is chosen once for every event
 * that uses it, so the classic failure is a white card on a gold-ink template:
 * gold on white measures about 2:1, and the liquid-glass work showed that is
 * not text. 3:1 is the line, the WCAG floor for text this size and larger.
 */
export function cardInkFor(ink: string | null | undefined, paper: string): string {
  const inkRgb = parseHex(ink)
  const paperRgb = parseHex(paper)
  if (!inkRgb || !paperRgb) return ink || inkOn(paper)
  return contrastRatio(inkRgb, paperRgb) >= 3 ? ink! : inkOn(paper)
}

/** Light or dark paper — which decides how deep the card's shadow is drawn. */
export function paperToneOf(paper: string): 'light' | 'dark' {
  const rgb = parseHex(paper)
  return rgb && relativeLuminance(rgb) < 0.3 ? 'dark' : 'light'
}

function contrastRatio(a: [number, number, number], b: [number, number, number]): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** `classic` for anything absent or unknown — what every calendar drew before. */
export function resolveCalendarStyle(
  style: string | null | undefined,
): EventDetailsCalendarStyle {
  return style && (CALENDAR_STYLES as readonly string[]).includes(style)
    ? (style as EventDetailsCalendarStyle)
    : 'classic'
}

export function buildCalendarDesignModel(input: CalendarDesignInput): CalendarDesignModel {
  const { date, language } = input
  const numeral = (n: number) => (language === 'kh' ? toKhmerNumerals(n) : String(n))

  const year = date.getFullYear()
  const month = date.getMonth()
  const eventDay = date.getDate()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = new Date(year, month, 1).getDay()

  const dayOf = (d: Date): CalendarDay => ({
    label: numeral(d.getDate()),
    day: d.getDate(),
    isEvent: d.getMonth() === month && d.getDate() === eventDay,
    inMonth: d.getMonth() === month,
  })

  const monthDays = Array.from({ length: daysInMonth }, (_, i) =>
    dayOf(new Date(year, month, i + 1)),
  )

  const padded: (CalendarDay | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...monthDays,
  ]
  while (padded.length % 7) padded.push(null)
  const weeks = Array.from({ length: padded.length / 7 }, (_, row) =>
    padded.slice(row * 7, row * 7 + 7),
  )

  // Built from dates rather than sliced out of the grid, so a week that
  // straddles two months shows the real neighbouring days instead of blanks.
  const sunday = new Date(year, month, eventDay - date.getDay())
  const week = Array.from({ length: 7 }, (_, i) =>
    dayOf(new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i)),
  )

  const previous = new Date(year, month, eventDay - 1)

  return {
    heading: input.heading,
    month: input.month,
    year: input.year,
    weekday: input.weekday,
    dayLabel: numeral(eventDay),
    previousDayLabel: numeral(previous.getDate()),
    weekdayLabels: input.weekdayLabels,
    weeks,
    week,
    monthDays,
  }
}

/**
 * The ink for a mark drawn ON the marker colour — the wall stamp's number, the
 * week capsule's, the desk calendar's month band. Whichever of near-white and
 * near-black has more contrast against it; the marker is a template colour,
 * so it can be anything from a pale gold to a deep red.
 */
export function inkOn(color: string | null | undefined): string {
  const LIGHT = '#ffffff'
  const DARK = '#1f1a17'
  const rgb = parseHex(color)
  if (!rgb) return LIGHT
  const lum = relativeLuminance(rgb)
  const contrastWithLight = 1.05 / (lum + 0.05)
  const contrastWithDark = (lum + 0.05) / (relativeLuminance(parseHex(DARK)!) + 0.05)
  return contrastWithLight >= contrastWithDark ? LIGHT : DARK
}

function parseHex(color: string | null | undefined): [number, number, number] | null {
  const hex = color?.trim().replace(/^#/, '')
  if (!hex || !/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return null
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number]
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}
