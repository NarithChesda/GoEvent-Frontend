/**
 * eventCoverPlaceholder.ts
 *
 * Default cover art for events that have no banner image.
 *
 * This replaces a map of hotlinked Unsplash photos that matched category names
 * by substring and fell back to a random pick from a five-photo pool. Seven of
 * the sixteen canonical categories matched nothing and drew from that pool, so a
 * `funeral` could be served "Celebration confetti"; `business_tech` matched
 * `business` and drew a stock portrait of a stranger, which readers reasonably
 * mistook for someone involved in the event.
 *
 * A generated cover cannot be semantically wrong. It is also resolution
 * independent, costs no network request, and carries no licensing question.
 *
 * Output is an `image/svg+xml` data URI so every existing `<img :src>` call site
 * keeps working untouched — including the ImageKit sizing helpers, which pass
 * `data:` URIs through unchanged (see `imagekitUrl` in utils/mediaUrl.ts).
 */

import { normalizeCategoryKey } from './categoryKey'

/** Authoring canvas. 16:10, so an 80x80 `object-cover` crop keeps the icon. */
const CANVAS_W = 800
const CANVAS_H = 500

/**
 * Icons are lucide bodies on their native 24x24 grid, copied verbatim from
 * lucide-vue-next's icon nodes. They are inlined rather than imported because
 * lucide closes over its node arrays inside `createLucideIcon` and never
 * exposes them, so there is no way to serialize a component to SVG markup.
 */
const ICONS = {
  palette:
    '<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>',
  cake: '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3"/><path d="M12 8v3"/><path d="M17 8v3"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/>',
  briefcase:
    '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>',
  graduationCap:
    '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  ferrisWheel:
    '<circle cx="12" cy="12" r="2"/><path d="M12 2v4"/><path d="m6.8 15-3.5 2"/><path d="m20.7 7-3.5 2"/><path d="M6.8 9 3.3 7"/><path d="m20.7 17-3.5-2"/><path d="m9 22 3-8 3 8"/><path d="M8 22h8"/><path d="M18 18.7a9 9 0 1 0-12 0"/>',
  clapperboard:
    '<path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z"/><path d="m6.2 5.3 3.1 3.9"/><path d="m12.4 3.4 3.1 4"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  utensilsCrossed:
    '<path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/><path d="m2.1 21.8 6.4-6.3"/><path d="m19 5-7 7"/>',
  flower:
    '<path d="M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1"/><circle cx="12" cy="8" r="2"/><path d="M12 10v12"/><path d="M12 22c4.2 0 7-1.667 7-5-4.2 0-7 1.667-7 5Z"/><path d="M12 22c-4.2 0-7-1.667-7-5 4.2 0 7 1.667 7 5Z"/>',
  heartPulse:
    '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
  house:
    '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
  trophy:
    '<path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978"/><path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978"/><path d="M18 9h1.5a1 1 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"/><path d="M6 9H4.5a1 1 0 0 1 0-5H6"/>',
  heart:
    '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  calendarDays:
    '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>',
} as const

interface CoverTheme {
  /** Gradient stops. Deliberately pale — a list is a wall of these. */
  from: string
  to: string
  /** Icon and tint-blob colour. */
  ink: string
  /** lucide icon body from ICONS. */
  icon: string
  /**
   * Suppresses the bright highlight and softens the icon. Used for categories
   * where a cheerful placeholder would be tasteless.
   */
  quiet?: boolean
}

/**
 * One theme per canonical event category (see i18n/locales/en/categories.json).
 * Keys are slugs from `normalizeCategoryKey`, so they match the translation
 * keys exactly rather than by coincidence.
 */
const CATEGORY_THEMES: Record<string, CoverTheme> = {
  arts_culture: { from: '#f3e8ff', to: '#e0e7ff', ink: '#7c3aed', icon: ICONS.palette },
  birthday: { from: '#fce7f3', to: '#ffedd5', ink: '#db2777', icon: ICONS.cake },
  business_tech: { from: '#dcfce7', to: '#dbeafe', ink: '#1e90ff', icon: ICONS.briefcase },
  community_social: { from: '#cffafe', to: '#dbeafe', ink: '#0284c7', icon: ICONS.users },
  education_learning: { from: '#e0e7ff', to: '#dbeafe', ink: '#4f46e5', icon: ICONS.graduationCap },
  family_kids: { from: '#ffedd5', to: '#fef9c3', ink: '#ea580c', icon: ICONS.ferrisWheel },
  film_media: { from: '#e2e8f0', to: '#cbd5e1', ink: '#475569', icon: ICONS.clapperboard },
  food_drink: { from: '#fef3c7', to: '#ffe4e6', ink: '#d97706', icon: ICONS.utensilsCrossed },
  funeral: { from: '#f1f5f9', to: '#e2e8f0', ink: '#64748b', icon: ICONS.flower, quiet: true },
  health_wellness: { from: '#ccfbf1', to: '#d1fae5', ink: '#0d9488', icon: ICONS.heartPulse },
  housewarming_party: { from: '#fef3c7', to: '#d1fae5', ink: '#ca8a04', icon: ICONS.house },
  lifestyle_wellness: { from: '#d1fae5', to: '#ecfccb', ink: '#059669', icon: ICONS.leaf },
  music: { from: '#ede9fe', to: '#fae8ff', ink: '#7c3aed', icon: ICONS.music },
  seasonal_holiday: { from: '#fee2e2', to: '#d1fae5', ink: '#dc2626', icon: ICONS.gift },
  sports_fitness: { from: '#dbeafe', to: '#cffafe', ink: '#2563eb', icon: ICONS.trophy },
  wedding: { from: '#ffe4e6', to: '#fef3c7', ink: '#e11d48', icon: ICONS.heart },
}

/** Neutral brand cover for categories we don't recognise. */
const DEFAULT_THEME: CoverTheme = {
  from: '#f1f5f9',
  to: '#e2e8f0',
  ink: '#2ecc71',
  icon: ICONS.calendarDays,
}

/**
 * Keyword net for categories the backend renames or adds without a theme entry.
 * Checked in order against the slug, so `funeral` is first and nothing that
 * follows can claim it. Unlike the map this replaced, a miss here is harmless —
 * it lands on a neutral calendar cover rather than a random photograph.
 */
const KEYWORD_ALIASES: Array<[token: string, slug: string]> = [
  ['funeral', 'funeral'],
  ['memorial', 'funeral'],
  ['wedding', 'wedding'],
  ['engagement', 'wedding'],
  ['birthday', 'birthday'],
  ['housewarming', 'housewarming_party'],
  ['graduation', 'education_learning'],
  ['education', 'education_learning'],
  ['learning', 'education_learning'],
  ['workshop', 'education_learning'],
  ['training', 'education_learning'],
  ['seminar', 'business_tech'],
  ['conference', 'business_tech'],
  ['business', 'business_tech'],
  ['corporate', 'business_tech'],
  ['tech', 'business_tech'],
  ['music', 'music'],
  ['concert', 'music'],
  ['food', 'food_drink'],
  ['drink', 'food_drink'],
  ['dining', 'food_drink'],
  ['sport', 'sports_fitness'],
  ['fitness', 'sports_fitness'],
  ['health', 'health_wellness'],
  ['wellness', 'lifestyle_wellness'],
  ['lifestyle', 'lifestyle_wellness'],
  ['family', 'family_kids'],
  ['kid', 'family_kids'],
  ['film', 'film_media'],
  ['media', 'film_media'],
  ['art', 'arts_culture'],
  ['culture', 'arts_culture'],
  ['community', 'community_social'],
  ['social', 'community_social'],
  ['network', 'community_social'],
  ['meetup', 'community_social'],
  ['holiday', 'seasonal_holiday'],
  ['seasonal', 'seasonal_holiday'],
  ['party', 'seasonal_holiday'],
  ['celebration', 'seasonal_holiday'],
]

/** Gradient directions, so same-category events aren't identical tiles. */
const GRADIENT_ANGLES = [
  { x1: 0, y1: 0, x2: 1, y2: 1 },
  { x1: 1, y1: 0, x2: 0, y2: 1 },
  { x1: 0, y1: 0.2, x2: 1, y2: 0.8 },
  { x1: 0.1, y1: 1, x2: 0.9, y2: 0 },
]

/** Soft shape placements, kept clear of the centred icon. */
const BLOB_LAYOUTS = [
  [
    { cx: 110, cy: 90, r: 190 },
    { cx: 690, cy: 430, r: 230 },
  ],
  [
    { cx: 700, cy: 80, r: 210 },
    { cx: 120, cy: 440, r: 180 },
  ],
  [
    { cx: 640, cy: 120, r: 170 },
    { cx: 180, cy: 400, r: 240 },
  ],
  [
    { cx: 90, cy: 420, r: 200 },
    { cx: 720, cy: 150, r: 190 },
  ],
]

/** Icon drawn at 168px on the 800x500 canvas, centred. */
const ICON_SCALE = 7
const ICON_OFFSET_X = CANVAS_W / 2 - (24 * ICON_SCALE) / 2
const ICON_OFFSET_Y = CANVAS_H / 2 - (24 * ICON_SCALE) / 2

/**
 * FNV-1a with a MurmurHash3 finalizer.
 *
 * The avalanche step is load-bearing, not ceremony: the variant indices below
 * are taken from this value's low bits, and the plain djb2 hash this replaced
 * moved those bits in lockstep for similar short seeds — "a1", "b2" and "c3"
 * all landed on the same gradient *and* the same shape layout. Mixing first
 * means neighbouring ids scatter.
 */
function hashString(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  hash ^= hash >>> 16
  hash = Math.imul(hash, 2246822507)
  hash ^= hash >>> 13
  hash = Math.imul(hash, 3266489909)
  hash ^= hash >>> 16
  return hash >>> 0
}

/**
 * Resolve a backend category name to its cover theme.
 * Exact slug match first, then the keyword net, then the neutral default.
 */
export function resolveCoverTheme(categoryName: string | null | undefined): CoverTheme {
  if (!categoryName) return DEFAULT_THEME

  const slug = normalizeCategoryKey(categoryName)
  if (CATEGORY_THEMES[slug]) return CATEGORY_THEMES[slug]

  for (const [token, mapped] of KEYWORD_ALIASES) {
    if (slug.includes(token)) return CATEGORY_THEMES[mapped]
  }

  return DEFAULT_THEME
}

/** Generated covers are few and stable, so build each one once. */
const coverCache = new Map<string, string>()

/**
 * Build the default cover for an event as an `image/svg+xml` data URI.
 *
 * @param categoryName - Backend category display name, e.g. "Business & Tech"
 * @param seed - Stable per-event string (id, falling back to title) that picks
 *   the gradient direction and shape layout, so a column of same-category cards
 *   varies while any one event always looks the same.
 */
export function buildEventCoverDataUri(
  categoryName: string | null | undefined,
  seed: string,
): string {
  const theme = resolveCoverTheme(categoryName)
  const hash = hashString(seed || categoryName || 'goevent')

  const angleIndex = hash % GRADIENT_ANGLES.length
  const blobIndex = (hash >>> 8) % BLOB_LAYOUTS.length
  const cacheKey = `${theme.icon.length}:${theme.ink}:${angleIndex}:${blobIndex}`

  const cached = coverCache.get(cacheKey)
  if (cached) return cached

  const angle = GRADIENT_ANGLES[angleIndex]
  const [highlight, tint] = BLOB_LAYOUTS[blobIndex]
  const highlightOpacity = theme.quiet ? 0.22 : 0.4
  const iconOpacity = theme.quiet ? 0.4 : 0.5

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}" width="${CANVAS_W}" height="${CANVAS_H}">` +
    `<defs><linearGradient id="g" x1="${angle.x1}" y1="${angle.y1}" x2="${angle.x2}" y2="${angle.y2}">` +
    `<stop offset="0" stop-color="${theme.from}"/><stop offset="1" stop-color="${theme.to}"/>` +
    `</linearGradient></defs>` +
    `<rect width="${CANVAS_W}" height="${CANVAS_H}" fill="url(#g)"/>` +
    `<circle cx="${highlight.cx}" cy="${highlight.cy}" r="${highlight.r}" fill="#ffffff" opacity="${highlightOpacity}"/>` +
    `<circle cx="${tint.cx}" cy="${tint.cy}" r="${tint.r}" fill="${theme.ink}" opacity="0.07"/>` +
    `<g transform="translate(${ICON_OFFSET_X} ${ICON_OFFSET_Y}) scale(${ICON_SCALE})" fill="none" stroke="${theme.ink}" color="${theme.ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="${iconOpacity}">` +
    `${theme.icon}</g></svg>`

  const dataUri = `data:image/svg+xml,${encodeURIComponent(svg)}`
  coverCache.set(cacheKey, dataUri)
  return dataUri
}
