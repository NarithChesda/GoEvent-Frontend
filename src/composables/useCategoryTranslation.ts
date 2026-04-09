/**
 * useCategoryTranslation
 *
 * Translates category names that come from the backend (event categories,
 * service categories) into the current app language. Backend stores
 * canonical English names; we normalize them to a slug key and look them
 * up under the `categories.event.*` or `categories.service.*` namespaces.
 *
 * Behavior:
 *   - Returns the translated string if a key exists for the normalized name.
 *   - Falls back to the original name (as-is) if no translation is found —
 *     so new backend categories continue to render rather than showing a
 *     missing-key placeholder.
 *
 * Example:
 *   const { translateEventCategory } = useCategoryTranslation()
 *   translateEventCategory('Wedding')   // → 'Wedding' (en) or 'អាពាហ៍ពិពាហ៍' (kh)
 *   translateEventCategory('UnknownX')  // → 'UnknownX' (fallback)
 */

import { useI18n } from 'vue-i18n'

type CategoryKind = 'event' | 'service'

/**
 * Normalize a category name into a key used by the locale files.
 * "Wedding & Social" → "wedding_social", "Music / DJ" → "music_dj", etc.
 * We keep it simple: lowercase, strip non-alphanumeric, collapse spaces.
 */
function normalizeCategoryKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function useCategoryTranslation() {
  const { t, te } = useI18n()

  function translateCategory(name: string | null | undefined, kind: CategoryKind): string {
    if (!name) return ''
    const key = normalizeCategoryKey(name)
    const fullKey = `categories.${kind}.${key}`
    // te() → true only when the exact key exists in the current/fallback messages
    if (te(fullKey)) {
      return t(fullKey)
    }
    // Unknown categories fall back to the backend-provided name
    return name
  }

  return {
    translateEventCategory: (name: string | null | undefined) =>
      translateCategory(name, 'event'),
    translateServiceCategory: (name: string | null | undefined) =>
      translateCategory(name, 'service'),
    /** Translated label for the "All Categories" filter option. */
    allCategoriesLabel: () => t('categories.allCategories'),
  }
}
