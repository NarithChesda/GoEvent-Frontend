/**
 * The `datetime-local` string (`YYYY-MM-DDTHH:mm`) is the wire format every
 * date field in the app speaks — the event form holds it, the drawers convert
 * it to ISO on submit, and the pickers edit it.
 *
 * These helpers were three private copies inside `DateTimePickerField` before
 * the calendar body was extracted; they live here so the field, the inline
 * disclosure row and the shared calendar cannot disagree about what a value
 * means. Everything is *local* time on purpose: `toISOString()` shifts to UTC,
 * which is how a 6pm event becomes an 11am one.
 */

export interface DateTimeParts {
  y: number
  /** 0-based, to match `Date`. */
  mo: number
  d: number
  h: number
  mi: number
}

export const pad = (n: number): string => String(n).padStart(2, '0')

export const parseDateTime = (value: string | null | undefined): DateTimeParts | null => {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!match) return null
  return {
    y: Number(match[1]),
    mo: Number(match[2]) - 1,
    d: Number(match[3]),
    h: Number(match[4]),
    mi: Number(match[5]),
  }
}

export const formatDateTime = (p: DateTimeParts): string =>
  `${p.y}-${pad(p.mo + 1)}-${pad(p.d)}T${pad(p.h)}:${pad(p.mi)}`

/** Midnight of the parts' day, so `min`/`max` disable whole days. */
export const dayStart = (p: DateTimeParts | null): number | null =>
  p ? new Date(p.y, p.mo, p.d).getTime() : null

/**
 * What an empty field should open on: now, rounded up to the next 5-minute
 * step, pulled inside `min`/`max` if it falls outside them. The time of day is
 * kept when a bound moves the date — a deadline clamped to the event's start
 * day should not also jump to midnight.
 */
export const seedDateTime = (
  value: string | null | undefined,
  min?: string | null,
  max?: string | null,
): DateTimeParts => {
  const parsed = parseDateTime(value)
  if (parsed) return parsed

  const now = new Date()
  const seeded: DateTimeParts = {
    y: now.getFullYear(),
    mo: now.getMonth(),
    d: now.getDate(),
    h: now.getHours(),
    mi: (Math.ceil(now.getMinutes() / 5) * 5) % 60,
  }

  const time = dayStart(seeded)!
  const minParts = parseDateTime(min)
  const maxParts = parseDateTime(max)
  const maxTime = dayStart(maxParts)
  const minTime = dayStart(minParts)

  if (maxParts && maxTime !== null && time > maxTime) {
    return { ...maxParts, h: seeded.h, mi: seeded.mi }
  }
  if (minParts && minTime !== null && time < minTime) {
    return { ...minParts, h: seeded.h, mi: seeded.mi }
  }
  return seeded
}

/**
 * The one human-readable rendering of a value, shared by the popover field and
 * the inline row so the same instant never reads two different ways in one
 * drawer. Returns `''` for an empty or unparseable value, which every caller
 * treats as "show the placeholder".
 */
export const formatDateTimeDisplay = (
  value: string | null | undefined,
  intlLocale: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  },
): string => {
  const parsed = parseDateTime(value)
  if (!parsed) return ''
  return new Intl.DateTimeFormat(intlLocale, options).format(
    new Date(parsed.y, parsed.mo, parsed.d, parsed.h, parsed.mi),
  )
}
