/**
 * Which event categories have invitation designs to choose from.
 *
 * The create wizard asks this twice: to lead its first question with the
 * categories GoEvent can actually dress, and — once the event exists — to decide
 * whether the organizer lands on the template browser or straight on the
 * Showcase tab. `isShowcaseCategory` is not the answer. It says which categories
 * have a Design Studio, and a studio category can have no approved template at
 * all (Housewarming, as of September 2026); opening an empty browser on a
 * brand-new event is a worse welcome than not opening one.
 *
 * So the answer comes from the public catalogue, which also makes it work
 * signed out: a template points at a pricing plan and a plan carries its event
 * category — the same join the public design catalogue
 * (PartnerTemplateGalleryView) makes. Fetched once per page load and shared by
 * every caller; a failure is not cached, so the next open simply retries. While
 * no answer is available, the studio list stands in for it.
 */
import { ref, shallowRef } from 'vue'
import {
  eventTemplateService,
  packagePlanService,
  type PackagePlan,
  type PublicEventTemplate,
} from '@/services/api'
import { isShowcaseCategory } from '@/utils/showcaseCategories'

/** Category id → number of approved designs. Absent means none. */
export type DesignCounts = ReadonlyMap<number, number>

/** The catalogue is ~50 templates at 20 a page; this bounds a runaway walk. */
const MAX_PAGES = 6

let cached: DesignCounts | null = null
let inflight: Promise<DesignCounts | null> | null = null

const plansFrom = (data: unknown): PackagePlan[] => {
  const shaped = data as PackagePlan[] | { results?: PackagePlan[] } | null
  if (!shaped) return []
  return Array.isArray(shaped) ? shaped : (shaped.results ?? [])
}

async function fetchDesignCounts(): Promise<DesignCounts | null> {
  const [plansResponse, firstPage] = await Promise.all([
    packagePlanService.listPlans(),
    eventTemplateService.listPublicTemplates({ page: 1 }),
  ])
  if (!plansResponse.success || !firstPage.success || !firstPage.data) return null

  const templates: PublicEventTemplate[] = [...(firstPage.data.results ?? [])]

  // The rest of the pages in parallel rather than by following `next` one
  // request at a time: this sits on the path to the wizard's first question.
  const pageSize = templates.length
  if (firstPage.data.next && pageSize) {
    const pageCount = Math.min(Math.ceil(firstPage.data.count / pageSize), MAX_PAGES)
    const rest = await Promise.all(
      Array.from({ length: pageCount - 1 }, (_, i) =>
        eventTemplateService.listPublicTemplates({ page: i + 2 }),
      ),
    )
    for (const page of rest) {
      if (page.success && page.data) templates.push(...(page.data.results ?? []))
    }
  }

  const categoryOfPlan = new Map<number, number>()
  for (const plan of plansFrom(plansResponse.data)) {
    if (plan.category?.id != null) categoryOfPlan.set(plan.id, plan.category.id)
  }

  const counts = new Map<number, number>()
  for (const template of templates) {
    if (template.status !== 'approved' || template.package_plan == null) continue
    const categoryId = categoryOfPlan.get(template.package_plan)
    if (categoryId != null) counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1)
  }
  return counts
}

/** The shared, once-per-page-load fetch. Resolves `null` when it could not be read. */
export function loadDesignCounts(): Promise<DesignCounts | null> {
  if (cached) return Promise.resolve(cached)
  inflight ??= fetchDesignCounts()
    .catch(() => null)
    .then((counts) => {
      inflight = null
      cached = counts
      return counts
    })
  return inflight
}

/** The counts if they arrive within `ms`, else whatever is already known. */
export async function loadDesignCountsWithin(ms: number): Promise<DesignCounts | null> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms)
  })
  try {
    return (await Promise.race([loadDesignCounts(), timeout])) ?? cached
  } finally {
    clearTimeout(timer)
  }
}

interface CategoryLike {
  id: number
  /** Only needed for the fallback; a caller that has just the id passes none. */
  name?: string
}

/**
 * Whether a category has designs, given what is known. With no answer from the
 * catalogue, fall back to "has a studio" — the right answer for every category
 * but one, and the one it gets wrong only opens a browser that says it is empty.
 */
export function categoryHasDesigns(
  category: CategoryLike | null | undefined,
  counts: DesignCounts | null,
): boolean {
  if (!category) return false
  if (counts) return (counts.get(category.id) ?? 0) > 0
  return isShowcaseCategory(category.name)
}

/** Reactive wrapper for a component that renders from the answer. */
export function useDesignCategories() {
  const counts = shallowRef<DesignCounts | null>(cached)
  /** True once there is an answer, or once waiting for one stopped being worth it. */
  const settled = ref(cached !== null)

  /**
   * Fetch, but stop waiting after `capMs`: a caller that renders from this
   * shows the fallback rather than a skeleton for as long as a slow network
   * takes. A late answer still lands in `counts`.
   */
  const load = async (capMs: number): Promise<void> => {
    if (cached) {
      counts.value = cached
      settled.value = true
      return
    }
    const late = loadDesignCounts().then((result) => {
      counts.value = result
    })
    await Promise.race([late, new Promise((resolve) => setTimeout(resolve, capMs))])
    settled.value = true
  }

  return {
    counts,
    settled,
    load,
    hasDesigns: (category: CategoryLike | null | undefined) =>
      categoryHasDesigns(category, counts.value),
  }
}

/** Test seam: forget the shared answer. */
export function resetDesignCountsCache(): void {
  cached = null
  inflight = null
}
