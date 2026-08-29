/**
 * Font metric normalization for the event showcase.
 *
 * ## The problem this solves
 *
 * The showcase carries ~400 hard-coded `font-size` declarations, and a template
 * partner picks the family those sizes render in. Two faces set at the same
 * `font-size: 2rem` do NOT look the same size: a typeface's glyphs occupy
 * whatever fraction of its em square the designer chose, so cap height per em
 * varies widely between families. Khmer faces add a second axis — coeng
 * subscripts and stacked diacritics push their ascent/descent far past a Latin
 * face's, so the same em box needs a taller line box before anything clips.
 *
 * The old compensation lived downstream, at the symptom: a `rem` value hand-tuned
 * against one family, and `khmer-text-fix`'s blanket `line-height: 1.8 !important`.
 * That only ever holds for the font it was tuned against, which is why swapping in
 * a new one lands too big in some sections and too small in others.
 *
 * ## The mechanism
 *
 * CSS `@font-face` descriptors — `size-adjust`, `ascent-override`,
 * `descent-override`, `line-gap-override` — scale the glyphs *inside* the em box.
 * `2rem` still computes to 32px, the line box does not move, and nothing reflows,
 * so every existing declaration keeps working untouched. One number per face
 * corrects that face everywhere it is ever used.
 *
 * Two numbers multiply into the single `size-adjust` we emit:
 *
 * - `size_adjust` on the **font library record** — a fact about the typeface
 *   ("Moul renders 12% large"), set once and inherited by every template that
 *   picks it.
 * - `size_scale` on the **template's language x type row** — the partner's taste
 *   knob for one template. Because those rows are already per-language, this is
 *   also how a template says "Khmer a touch smaller" without touching English.
 *
 * Both default to 1, so a template carrying neither renders byte-identically to
 * before this existed.
 *
 * Browser support: Chrome/Edge 92+, Firefox 92+, Safari 17+. Older Safari ignores
 * the descriptors entirely and renders exactly today's behaviour — the degradation
 * is graceful and needs no fallback path.
 *
 * Backend contract: docs/backend-api-requirements/font-metric-normalization.md
 */

/** Library-level normalization. 1 = the face is already the reference size. */
export const FONT_SIZE_ADJUST_RANGE = { min: 0.5, max: 2 } as const

/**
 * Per-template partner scale. Deliberately tighter than the library range — it is
 * a trim on an already-normalized face, not a second normalization.
 */
export const FONT_SIZE_SCALE_RANGE = { min: 0.6, max: 1.6 } as const

/** Vertical metric overrides, as a fraction of the em (1 = 100%). */
export const FONT_METRIC_OVERRIDE_RANGE = { min: 0, max: 3 } as const

export const DEFAULT_SIZE_ADJUST = 1
export const DEFAULT_SIZE_SCALE = 1

/** The subset of a font-library record this module reads. */
export interface FontMetricSource {
  size_adjust?: number | string | null
  ascent_override?: number | string | null
  descent_override?: number | string | null
  line_gap_override?: number | string | null
}

export interface ResolvedFontMetrics {
  /** Library normalization x template scale, already clamped. 1 = emit nothing. */
  sizeAdjust: number
  ascentOverride: number | null
  descentOverride: number | null
  lineGapOverride: number | null
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

/**
 * Reads a decimal that may arrive as a JSON number or as a DRF `DecimalField`
 * string. Anything unparseable becomes `null` rather than `0` — a dropped or
 * malformed field must mean "unset", never "collapse this font to nothing".
 */
const readDecimal = (raw: number | string | null | undefined): number | null => {
  if (raw === null || raw === undefined || raw === '') return null
  const value = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(value) ? value : null
}

const readOverride = (raw: number | string | null | undefined): number | null => {
  const value = readDecimal(raw)
  if (value === null) return null
  return clamp(value, FONT_METRIC_OVERRIDE_RANGE.min, FONT_METRIC_OVERRIDE_RANGE.max)
}

/** The widest product the two in-range factors can legitimately produce. */
const COMBINED_MIN = FONT_SIZE_ADJUST_RANGE.min * FONT_SIZE_SCALE_RANGE.min
const COMBINED_MAX = FONT_SIZE_ADJUST_RANGE.max * FONT_SIZE_SCALE_RANGE.max

/**
 * Combines a font library record's normalization with the template row's scale.
 *
 * The two are multiplied rather than one overriding the other: the library value
 * says what the face does wrong, the template value says what this design wants.
 * A partner who dialled a scale on an uncalibrated face keeps their intent when
 * that face is calibrated later — their 1.1 stays "10% larger than correct"
 * rather than silently becoming "10% larger than raw".
 *
 * Clamping applies to the product, not to each factor, so two individually
 * in-range values can never multiply into something illegible.
 */
export const resolveFontMetrics = (
  library: FontMetricSource | null | undefined,
  sizeScale?: number | string | null,
): ResolvedFontMetrics => {
  const normalization = readDecimal(library?.size_adjust) ?? DEFAULT_SIZE_ADJUST
  const scale = readDecimal(sizeScale) ?? DEFAULT_SIZE_SCALE
  const product = normalization * scale

  return {
    sizeAdjust: Number.isFinite(product)
      ? clamp(product, COMBINED_MIN, COMBINED_MAX)
      : DEFAULT_SIZE_ADJUST,
    ascentOverride: readOverride(library?.ascent_override),
    descentOverride: readOverride(library?.descent_override),
    lineGapOverride: readOverride(library?.line_gap_override),
  }
}

/** True when the metrics are all defaults, i.e. emitting them would be a no-op. */
export const isIdentityFontMetrics = (metrics: ResolvedFontMetrics): boolean =>
  metrics.sizeAdjust === DEFAULT_SIZE_ADJUST &&
  metrics.ascentOverride === null &&
  metrics.descentOverride === null &&
  metrics.lineGapOverride === null

const percent = (value: number): string =>
  `${(value * 100).toFixed(3).replace(/\.?0+$/, '')}%`

/**
 * The descriptor lines for an `@font-face` block, newline-joined and indented to
 * match the rule the font manager builds. Empty when nothing needs adjusting, so
 * an uncalibrated font produces the exact rule it always did.
 *
 * Values are baked in as literal percentages rather than `calc()`: descriptor
 * grammar has patchy `calc()` support, and the rule is already being assembled as
 * a string, so there is nothing to gain from deferring the arithmetic to CSS.
 */
export const fontMetricDescriptorCss = (metrics: ResolvedFontMetrics): string => {
  const lines: string[] = []
  if (metrics.sizeAdjust !== DEFAULT_SIZE_ADJUST) {
    lines.push(`size-adjust: ${percent(metrics.sizeAdjust)};`)
  }
  if (metrics.ascentOverride !== null) {
    lines.push(`ascent-override: ${percent(metrics.ascentOverride)};`)
  }
  if (metrics.descentOverride !== null) {
    lines.push(`descent-override: ${percent(metrics.descentOverride)};`)
  }
  if (metrics.lineGapOverride !== null) {
    lines.push(`line-gap-override: ${percent(metrics.lineGapOverride)};`)
  }
  return lines.join('\n        ')
}

/**
 * The same descriptors in `FontFace` constructor form.
 *
 * The font manager registers each face twice — once as an injected `@font-face`
 * rule (reliable everywhere, notably Safari) and once through the `FontFace` API
 * (which is what gives it load detection). Both land under the same family name,
 * so if only one carried the descriptors the browser would hold two
 * differently-sized faces for one name and which of them painted would be
 * undefined. They have to agree; this is what keeps them from drifting.
 *
 * Browsers predating a descriptor ignore the key, matching how they treat the CSS
 * form.
 */
export const fontMetricDescriptorDict = (
  metrics: ResolvedFontMetrics,
): Record<string, string> => {
  const dict: Record<string, string> = {}
  if (metrics.sizeAdjust !== DEFAULT_SIZE_ADJUST) dict.sizeAdjust = percent(metrics.sizeAdjust)
  if (metrics.ascentOverride !== null) dict.ascentOverride = percent(metrics.ascentOverride)
  if (metrics.descentOverride !== null) dict.descentOverride = percent(metrics.descentOverride)
  if (metrics.lineGapOverride !== null) dict.lineGapOverride = percent(metrics.lineGapOverride)
  return dict
}

/**
 * A short stable string identifying one metric resolution.
 *
 * The font cache keys on family + URL, neither of which changes when a partner
 * drags the size slider — without this folded into the key, the second render of
 * the same face is served from cache, the new descriptors are never injected, and
 * the live preview sits frozen at whatever value was tried first.
 */
export const fontMetricSignature = (metrics: ResolvedFontMetrics): string =>
  [
    metrics.sizeAdjust,
    metrics.ascentOverride ?? '-',
    metrics.descentOverride ?? '-',
    metrics.lineGapOverride ?? '-',
  ].join('/')

// ---------------------------------------------------------------------------
// Auto-calibration
//
// Nobody should be typing a magic number into a size field. These derive one by
// measuring the face against a reference, which is what the studio's "Match
// reference size" button runs and what a backend calibration job would run to
// seed the library-level `size_adjust`.
// ---------------------------------------------------------------------------

/**
 * The glyph whose height stands in for "how big does this font look".
 *
 * Cap height for Latin, base-consonant height for the Indic-derived scripts.
 * Deliberately NOT a string with diacritics: the eye judges a script's size by
 * its base letterforms, while `actualBoundingBoxAscent` over a marked-up sample
 * would measure whichever accent happened to stack highest — a property of the
 * sample text, not of the typeface.
 */
export const METRIC_PROBE_GLYPH: Record<string, string> = {
  en: 'H',
  fr: 'H',
  kh: 'ក',
  th: 'ก',
  ja: '国',
  ko: '한',
  'zh-cn': '国',
  vn: 'H',
}

/**
 * The face each language's fonts are normalized against — the one the showcase's
 * existing `rem` values were tuned on, so calibrating to it means today's sizes
 * stay correct instead of every template shifting at once.
 */
export const METRIC_REFERENCE_FAMILY: Record<string, string> = {
  en: 'Inter',
  fr: 'Inter',
  kh: 'Kantumruy Pro',
  th: 'Noto Sans Thai',
  ja: 'Noto Sans JP',
  ko: 'Noto Sans KR',
  'zh-cn': 'Noto Sans SC',
  vn: 'Inter',
}

/** Big enough that a one-pixel rounding error is under 0.1% of the reading. */
const PROBE_PX = 512

let probeCanvas: HTMLCanvasElement | null = null

const probeContext = (): CanvasRenderingContext2D | null => {
  if (typeof document === 'undefined') return null
  if (!probeCanvas) probeCanvas = document.createElement('canvas')
  return probeCanvas.getContext('2d')
}

/**
 * Rendered height of one glyph in one family, in px at a fixed probe size.
 *
 * `null` when the metric is unavailable — no canvas, or a browser without
 * `actualBoundingBoxAscent` (pre-2021 Safari). Callers must treat that as "cannot
 * calibrate" and leave the value alone rather than substituting a guess.
 */
export const measureGlyphHeight = (family: string, glyph: string): number | null => {
  const ctx = probeContext()
  if (!ctx) return null

  // The generic keyword is the fallback: if `family` did not load, the reading is
  // of `serif`, not of nothing, and the ratio below would be silently wrong. The
  // caller guards this by awaiting document.fonts.load() first.
  ctx.font = `${PROBE_PX}px "${family}", serif`
  const metrics = ctx.measureText(glyph)

  const ascent = metrics.actualBoundingBoxAscent
  const descent = metrics.actualBoundingBoxDescent
  if (typeof ascent !== 'number' || !Number.isFinite(ascent)) return null

  const height = ascent + (Number.isFinite(descent) ? Math.max(descent, 0) : 0)
  return height > 0 ? height : null
}

/**
 * The `size_scale` that makes `family` read at the same visual size as the
 * language's reference face.
 *
 * Returns `null` rather than 1 when it cannot measure, so a caller can tell
 * "already correct" apart from "could not tell" — the studio surfaces the second
 * as a message instead of silently writing a no-op.
 *
 * The caller is responsible for having loaded both faces (`document.fonts.load`)
 * before calling; an unloaded family measures as the generic fallback and yields
 * a confidently wrong ratio.
 */
export const deriveSizeScale = (
  family: string,
  language: string,
  referenceFamily?: string,
): number | null => {
  const glyph = METRIC_PROBE_GLYPH[language] ?? METRIC_PROBE_GLYPH.en
  const reference = referenceFamily ?? METRIC_REFERENCE_FAMILY[language] ?? METRIC_REFERENCE_FAMILY.en

  const candidateHeight = measureGlyphHeight(family, glyph)
  const referenceHeight = measureGlyphHeight(reference, glyph)
  if (!candidateHeight || !referenceHeight) return null

  const ratio = referenceHeight / candidateHeight
  if (!Number.isFinite(ratio) || ratio <= 0) return null

  // Two decimals: the slider steps by 0.01, and finer precision is below the
  // threshold at which the difference is visible anyway.
  const rounded = Math.round(ratio * 100) / 100
  return clamp(rounded, FONT_SIZE_SCALE_RANGE.min, FONT_SIZE_SCALE_RANGE.max)
}
