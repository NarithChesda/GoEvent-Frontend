import { computed, ref, type Ref } from 'vue'
import { packagePlanService } from '@/services/api'
import type { EventTemplatePackagePlan, PackagePlan, PartnerTemplate } from '@/services/api'

/**
 * Named by the plan's name rather than its type, so they answer for a plan from
 * either shape — the catalogue's `PackagePlan` and the leaner
 * `EventTemplatePackagePlan` a template carries. See `planOptions`.
 */
export function isPlanBasic(plan: { name: string }): boolean {
  return plan.name.toLowerCase().includes('basic')
}

export function isPlanStandard(plan: { name: string }): boolean {
  return plan.name.toLowerCase().includes('standard')
}

/**
 * The pricing plan shelf a template sits on.
 *
 * Outside the component because the Basics panel draws the picker while the
 * editor itself decides when to load it (on open, and on mount) — and because
 * `isPlanStandard` is read in both places, which as two copies of a
 * three-line predicate is exactly how they drift.
 */
export function useTemplatePlans(existingTemplate: Ref<PartnerTemplate | null>) {
  const plansLoading = ref(false)
  const availablePlans = ref<PackagePlan[]>([])

  /**
   * The plans the picker draws: everything on offer, plus whatever this template
   * is already on.
   *
   * `fetchPlans` keeps free plans out of the *choices* deliberately — a template
   * on an active zero-price plan becomes eligible for automatic assignment to
   * every newly created event, which is not a shelf anyone should publish onto by
   * accident. But a template can already be on one, and now routinely is: the
   * free plan's system template is exactly what new events pick up, and system
   * templates are what staff edit through this form.
   *
   * Filtering out the plan a template already carries left the picker with
   * nothing highlighted — which reads as "you have not chosen a plan" on a
   * template that has one, and invites a click that quietly moves a live public
   * template onto a paid shelf. Showing it costs nothing: it is still not a plan
   * anyone can newly select, because it only appears when it is already selected.
   */
  const planOptions = computed<EventTemplatePackagePlan[]>(() => {
    const current = existingTemplate.value?.package_plan
    if (!current || availablePlans.value.some((plan) => plan.id === current.id)) {
      return availablePlans.value
    }
    return [current, ...availablePlans.value]
  })

  async function fetchPlans(): Promise<void> {
    if (availablePlans.value.length > 0) return
    plansLoading.value = true
    try {
      const response = await packagePlanService.listPlans()
      if (response.success && response.data) {
        const data = response.data
        const plans = Array.isArray(data)
          ? data
          : ((data as unknown as { results: PackagePlan[] }).results ?? [])
        // Only show active basic/standard plans, exclude free plans
        availablePlans.value = plans.filter(
          (p) =>
            p.is_active &&
            (isPlanBasic(p) || isPlanStandard(p)) &&
            !p.name.toLowerCase().includes('free'),
        )
      }
    } catch {
      // Plans will remain empty, user sees "No plans available"
    } finally {
      plansLoading.value = false
    }
  }

  return { plansLoading, availablePlans, planOptions, fetchPlans }
}

export type TemplatePlans = ReturnType<typeof useTemplatePlans>
