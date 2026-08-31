/**
 * The sample invitation the PUBLIC template preview renders.
 *
 * The manage-page studio previews a template against the event being managed;
 * the partner programme page has no event and no signed-in user, so it needs a
 * stand-in. This module is that stand-in, and it deliberately behaves like the
 * showcase endpoint rather than like a fixture: `loadDemoShowcase(language)`
 * answers ONE language's worth of content, exactly as
 * `GET /api/events/:id/showcase/?lang=` does. That is what lets
 * `useEventShowcase` treat it as a drop-in data source (see its `dataSource`
 * option) with every downstream merge, font pass and language switch unchanged.
 *
 * The content itself lives in `src/assets/demo-showcase-event.json` — see the
 * `_comment` at the top of that file for its shape.
 */
import demoShowcaseJson from '@/assets/demo-showcase-event.json'
import type { ShowcaseData } from '@/composables/useEventShowcase'

/** Path prefix of the sample media in `public/`. */
const DEMO_ASSET_PREFIX = '/demo-showcase/'

/**
 * How far ahead the sample event must sit before it is worth showing. Below
 * this the countdown reads as an event that is basically over, which is not
 * what a template should be judged on — so the year rolls forward instead.
 */
const MIN_DAYS_AHEAD = 30

const KHMER_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩']

interface DemoTranslations {
  event?: Record<string, string>
  hosts?: Record<string, Record<string, string>>
  agenda_items?: Record<string, Record<string, string>>
  dress_codes?: Record<string, Record<string, string>>
  payment_methods?: Record<string, Record<string, string>>
  photos?: Record<string, Record<string, string>>
}

interface DemoShowcaseFile {
  meta: ShowcaseData['meta']
  event: Record<string, unknown>
  translations?: Record<string, DemoTranslations>
}

const source = demoShowcaseJson as unknown as DemoShowcaseFile

/** Which of the event's own collections a `translations.<lang>` block can overlay. */
const TRANSLATABLE_COLLECTIONS = [
  'hosts',
  'agenda_items',
  'dress_codes',
  'payment_methods',
  'photos',
] as const

function toKhmerDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => KHMER_DIGITS[Number(d)])
}

/**
 * The year the sample event happens in.
 *
 * Derived from the JSON's own `start_date` rather than configured separately,
 * so the anchor day (12 December) is stated once. The current year is used
 * while it is still comfortably ahead; after that it rolls to the next one, and
 * the same number is substituted into every authored date line — which is why
 * those lines carry `{year}` instead of a written-out weekday: only the year is
 * safe to move.
 */
function resolveDemoYear(): number {
  const template = String(source.event.start_date ?? '')
  const thisYear = new Date().getFullYear()
  const candidate = new Date(template.replace('{year}', String(thisYear)))
  if (Number.isNaN(candidate.getTime())) return thisYear
  const daysAhead = (candidate.getTime() - Date.now()) / 86_400_000
  return daysAhead >= MIN_DAYS_AHEAD ? thisYear : thisYear + 1
}

/**
 * Absolute, because `getMediaUrl` prefixes the API base onto anything that
 * isn't — and this media is served by the app, not by the backend. Guarded for
 * SSR-less safety only; every caller runs in the browser.
 */
function resolveDemoAsset(path: string): string {
  if (typeof window === 'undefined') return path
  return `${window.location.origin}${path}`
}

/**
 * One pass over every string in the payload: the year placeholders and the
 * sample media paths. Done generically rather than field by field so a field
 * added to the JSON later can't be silently missed.
 */
function hydrateValue(value: unknown, year: number): unknown {
  if (typeof value === 'string') {
    let next = value
    if (next.includes('{year}')) next = next.replaceAll('{year}', String(year))
    if (next.includes('{yearKh}')) next = next.replaceAll('{yearKh}', toKhmerDigits(year))
    if (next.startsWith(DEMO_ASSET_PREFIX)) next = resolveDemoAsset(next)
    return next
  }
  if (Array.isArray(value)) {
    return value.map((entry) => hydrateValue(entry, year))
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      out[key] = hydrateValue(entry, year)
    }
    return out
  }
  return value
}

/** Typed wrapper: the walk is shape-preserving, so the input's type survives it. */
function hydrateStrings<T>(value: T, year: number): T {
  return hydrateValue(value, year) as T
}

/** Overlay one `translations.<lang>` block onto the English baseline. */
function applyTranslations(
  event: Record<string, unknown>,
  translations: DemoTranslations | undefined,
): void {
  if (!translations) return

  Object.assign(event, translations.event ?? {})

  for (const collection of TRANSLATABLE_COLLECTIONS) {
    const overlay = translations[collection]
    const rows = event[collection]
    if (!overlay || !Array.isArray(rows)) continue
    event[collection] = rows.map((row) => {
      const record = row as { id?: number | string }
      const fields = record.id != null ? overlay[String(record.id)] : undefined
      return fields ? { ...record, ...fields } : record
    })
  }
}

/**
 * The sample showcase for one language.
 *
 * `event_texts` is filtered down to the requested language on purpose: the real
 * endpoint only ever returns the language it was asked for, and
 * `updateLanguageContent` merges each response over the languages it already
 * holds. Returning everything at once would work but would quietly duplicate
 * rows on every switch.
 */
export async function loadDemoShowcase(language: string): Promise<ShowcaseData> {
  const year = resolveDemoYear()
  // The baseline IS English, so it needs no overlay; anything else falls back
  // to it rather than rendering half-translated.
  const lang = language === 'en' || source.translations?.[language] ? language : 'en'

  // Cloned and hydrated together with its overlay, so a `{year}` written into a
  // translated line is substituted the same way the baseline's is.
  const event = hydrateStrings(
    JSON.parse(JSON.stringify(source.event)) as Record<string, unknown>,
    year,
  )
  applyTranslations(event, hydrateStrings(source.translations?.[lang], year))

  const texts = (event.event_texts as Array<{ language: string }> | undefined) ?? []
  event.event_texts = texts.filter((text) => text.language === lang)

  return {
    event,
    meta: { ...source.meta, language: lang },
  } as unknown as ShowcaseData
}

/** The languages the sample invitation is authored in. */
export function demoShowcaseLanguages(): string[] {
  return (source.meta.available_languages ?? []).map((entry) => entry.code)
}
