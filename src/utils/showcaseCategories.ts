/**
 * The event categories that get the V1 showcase — the Design Studio's live
 * preview, the template & payment tab and guest management. Everything else
 * (business, music, sports…) keeps the plain "Showcase" content tab.
 *
 * Backend category names may carry a suffix ("Housewarming Party", "Funeral
 * Service"), so a category matches by prefix rather than by equality.
 *
 * Note this is "has a studio", not "has designs": a studio category can have no
 * approved template yet. Ask `useDesignCategories` for the latter.
 */
export const SHOWCASE_CATEGORIES = ['wedding', 'birthday', 'housewarming', 'funeral', 'ceremony']

export const isShowcaseCategory = (category: string | null | undefined): boolean => {
  if (!category) return false
  const normalized = category.toLowerCase()
  return SHOWCASE_CATEGORIES.some((c) => normalized.startsWith(c))
}
