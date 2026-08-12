/**
 * categoryKey.ts
 *
 * Canonical name → slug normalization for backend category names.
 *
 * The backend stores display names ("Business & Tech"); the frontend keys both
 * translations (`categories.event.business_tech`) and default cover art off the
 * slug. Both used to derive it independently — cover art via a loose substring
 * scan — which is how "Business & Tech" ended up matching a `business` stock
 * photo and how `funeral` matched nothing at all. One normalizer, one result.
 */

/**
 * Normalize a category name into the slug used by locale files and theme maps.
 * "Wedding & Social" → "wedding_social", "Music / DJ" → "music_dj".
 */
export function normalizeCategoryKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}
