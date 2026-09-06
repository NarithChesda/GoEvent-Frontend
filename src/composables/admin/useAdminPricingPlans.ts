/**
 * The full pricing-plan list, for the two forms that have to pick a set of them.
 *
 * Both commerce catalogues carry an `applicable_plans` many-to-many, and both
 * are dangerous to get wrong in the same direction: an empty list on an issued
 * code means *every* plan, so a cheap credit pack unlocks the most expensive
 * template on the platform. Choosing well needs the **price** beside each name,
 * because a credit zeroes whichever plan it lands on — bundling an $85 plan
 * with a $600 one hands away the difference — which is why this returns rows
 * rather than a name list.
 *
 * **Every page, not the first one.** `/api/admin/pricing-plans/` is DRF
 * page-number pagination with no `page_size` override, and plans are a tier
 * repeated per event category, so twenty is a number the real catalogue passes
 * easily. A picker that silently stopped at page one would hide plans a pack
 * needs and give no sign it had — so this walks `next` to the end.
 *
 * **The admin list, deliberately, not `/api/core-data/pricing-plans/`.** A pack
 * may reference a retired plan, and the public list omits inactive ones: with
 * that source the picker would render such a pack as though the plan had been
 * unticked, and saving would then actually untick it.
 */

import { computed, ref } from 'vue'
import { adminService } from '@/services/api'
import type { AdminPricingPlanRow } from '@/services/api'

/**
 * A hard stop on the page walk. Twenty pages is four hundred plans — far past
 * anything real — and it is what stops a server-side paging bug turning a
 * picker into an unbounded request loop.
 */
const MAX_PAGES = 20

export function useAdminPricingPlans() {
  const plans = ref<AdminPricingPlanRow[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  let loaded = false

  /** Name by id, for rendering a chosen set without a second lookup. */
  const byId = computed(() => new Map(plans.value.map((plan) => [plan.id, plan])))

  const load = async (force = false): Promise<void> => {
    if (loading.value) return
    if (loaded && !force) return

    loading.value = true
    error.value = null

    const collected: AdminPricingPlanRow[] = []
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const response = await adminService.listCatalogue<AdminPricingPlanRow>('pricing-plans', {
        page: page > 1 ? page : undefined,
        ordering: 'price',
      })

      if (!response.success || !response.data) {
        error.value = response.message ?? null
        loading.value = false
        return
      }

      collected.push(...response.data.results)
      if (!response.data.next) break
    }

    plans.value = collected
    loaded = true
    loading.value = false
  }

  return { plans, byId, loading, error, load }
}
