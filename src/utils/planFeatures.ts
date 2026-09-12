/**
 * Pricing-plan feature lines.
 *
 * A plan's `features` is a flat `string[]` on the backend — one field, edited
 * as a newline-separated textarea in Admin → Pricing Plans — and the same
 * array is rendered in seven places with very different amounts of room:
 * the public pricing card has a scrollable column, while the in-app template
 * cards show a row of pills and several truncate to the first two or four
 * entries.
 *
 * So a feature line carries **both** halves in one string, separated by a
 * spaced em dash: a short title that stands alone, then the sentence that
 * explains it.
 *
 *   "តំណអញ្ជើញផ្ទាល់ខ្លួន — ឈ្មោះភ្ញៀវបង្ហាញលើកាត…"
 *     → title:       "តំណអញ្ជើញផ្ទាល់ខ្លួន"
 *       description: "ឈ្មោះភ្ញៀវបង្ហាញលើកាត…"
 *
 * The pricing card draws both; every compact surface draws `title` only. A
 * line with no separator — every feature written before this convention —
 * parses as a title with no description and renders exactly as it always did,
 * so nothing has to be migrated for the page to keep working.
 */

export interface PlanFeature {
  /** The short, standalone half. Never empty for a non-empty input. */
  title: string
  /** The explaining half, or `''` when the line carries no separator. */
  description: string
}

/**
 * A spaced dash, em or en.
 *
 * Spaces on **both** sides are required, and only the first match splits: a
 * dash inside either half (a range, a compound) is not a separator, and
 * authors reach for an en dash often enough that accepting only the em dash
 * would silently swallow descriptions into titles.
 */
const SEPARATOR_RE = /\s+[—–]\s+/

export function parsePlanFeature(raw: string): PlanFeature {
  const text = (raw ?? '').trim()
  const match = SEPARATOR_RE.exec(text)

  // `index === 0` means the line opens with a dash — that is punctuation, not
  // a separator, and splitting there would produce an empty title.
  if (!match || match.index === 0) {
    return { title: text, description: '' }
  }

  return {
    title: text.slice(0, match.index).trim(),
    description: text.slice(match.index + match[0].length).trim(),
  }
}

/** The half every compact surface shows. */
export function planFeatureTitle(raw: string): string {
  return parsePlanFeature(raw).title
}
