/**
 * Presentation helpers shared by every admin surface.
 *
 * Small and pure on purpose — the queue views differ in what they show, not in
 * how they render a decimal or a decision date, and three copies of "parse the
 * money string" is how two of them end up disagreeing about rounding.
 */

import type { AdminActor } from '@/services/api'

/**
 * Money arrives as a Django `Decimal` **string**. Parse it here rather than
 * letting JS coerce it somewhere in a template — `"48250.00" * 1` works and
 * `"48250.00" + 1` does not, and only one of those is a bug you notice.
 *
 * Returns 0 for null/empty/unparseable so a total never renders as `NaN`.
 */
export const parseMoney = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined || value === '') return 0
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * A money string in its own currency. Falls back to a plain grouped number for
 * a currency `Intl` does not know, rather than throwing inside a render.
 */
export const formatMoney = (
  value: string | number | null | undefined,
  currency = 'USD',
): string => {
  const amount = parseMoney(value)
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'KHR' ? 0 : 2,
      maximumFractionDigits: currency === 'KHR' ? 0 : 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  }
}

/**
 * Whoever acted on a row.
 *
 * The API docs name `reviewed_by` / `confirmed_by` / `processed_by` / the
 * listing's `vendor_user` but only ever show them as `null`, so the populated
 * shape is unverified. Accept an expanded object or a bare string and render
 * whichever arrived — an admin reading "[object Object]" in an audit column is
 * a worse outcome than a guess that handles both.
 */
export const describeActor = (actor: AdminActor | undefined): string | null => {
  if (!actor) return null
  if (typeof actor === 'string') return actor || null
  return actor.full_name?.trim() || actor.email || actor.username || null
}

const DATE_TIME = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const DATE_ONLY = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : DATE_TIME.format(date)
}

export const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : DATE_ONLY.format(date)
}

/** "3 days ago" for the queue rows, where age is the thing being judged. */
export const formatRelative = (value: string | null | undefined): string => {
  if (!value) return '—'
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return '—'

  const seconds = Math.round((Date.now() - then) / 1000)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]

  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return formatter.format(-Math.round(seconds / size), unit)
  }
  return formatter.format(-seconds, 'second')
}

/** The four tones a status badge can take. */
export type AdminStatusTone = 'pending' | 'positive' | 'negative' | 'neutral'

const POSITIVE = new Set(['approved', 'confirmed', 'active', 'paid', 'published', 'claimed'])
const NEGATIVE = new Set(['rejected', 'failed', 'cancelled', 'suspended', 'refunded'])
const PENDING = new Set(['pending', 'pending_review', 'requested', 'processing'])

/**
 * Status → tone, from the raw value rather than the display string, which is
 * server-localised prose and would break the moment it is translated.
 */
export const statusTone = (status: string): AdminStatusTone => {
  const value = status?.toLowerCase() ?? ''
  if (POSITIVE.has(value)) return 'positive'
  if (NEGATIVE.has(value)) return 'negative'
  if (PENDING.has(value)) return 'pending'
  return 'neutral'
}

/** Tailwind classes per tone. Amber for pending — it is a state, not a warning. */
export const STATUS_TONE_CLASS: Record<AdminStatusTone, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  negative: 'bg-red-50 text-red-700 border-red-200',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
}

/** One entry in the toolbar's status / ordering selects. */
export interface AdminSelectOption {
  value: string
  label: string
}

/** One plotted day, after zero-fill. */
export interface AdminSeriesPoint {
  day: string
  value: number
}

/**
 * Fill in the days the metrics endpoint left out.
 *
 * `series` entries exist **only for days that had activity**, so plotting the
 * raw array puts an evenly spaced point at every entry and draws a week with
 * two payments as a week with two days in it. The x-axis would be lying about
 * the shape of the thing it is measuring.
 *
 * The window is generated from the endpoint's own `since` rather than from the
 * browser's clock, so the chart covers exactly the span the server answered for
 * even when the two disagree about what day it is.
 */
export const zeroFillSeries = <T extends { day: string }>(
  series: T[],
  since: string,
  windowDays: number,
  value: (entry: T) => number,
): AdminSeriesPoint[] => {
  const start = new Date(since)
  if (Number.isNaN(start.getTime()) || windowDays < 1) {
    return series.map((entry) => ({ day: entry.day, value: value(entry) }))
  }

  const byDay = new Map(series.map((entry) => [entry.day, value(entry)]))
  const cursor = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
  )

  return Array.from({ length: windowDays }, () => {
    const key = cursor.toISOString().slice(0, 10)
    cursor.setUTCDate(cursor.getUTCDate() + 1)
    return { day: key, value: byDay.get(key) ?? 0 }
  })
}

/** One label/value row in a decision drawer's record block. */
export interface AdminFact {
  label: string
  value: string | number | null | undefined
  /** The one or two fields the decision actually turns on. */
  strong?: boolean
}
