import { computed, reactive, watch } from 'vue'
import { usePaymentTemplateIntegration } from './usePaymentTemplateIntegration'
import type { Event, EventTemplate } from '@/services/api'
import type { Payment } from '@/types/payment'

/**
 * The four states of "can guests actually see this showcase yet?".
 *
 * This is deliberately one flat enum rather than the scattered booleans the
 * template-payment tab used to derive inline (`hasSelectedTemplate` +
 * `isTemplateActivated` + `currentPayment?.status`), because the Design Studio
 * and the activation tab must agree on the *same* four states — the studio's
 * status pill and the tab's stepper are two renderings of one truth.
 */
export type ActivationState = 'no-template' | 'unpaid' | 'pending' | 'active'

const normalize = (value?: string | null) =>
  value && typeof value === 'string' ? value.trim().toLowerCase() : null

/**
 * Shared activation/payment status for an event's selected template.
 *
 * Why this exists: the showcase endpoint intentionally nulls `template_assets`
 * until a Payment row is confirmed, and the Design Studio backfills them from
 * the public template assets so the preview renders anyway (see
 * ShowcasePreviewTab's loadPreviewTemplateFallback). That's great for designing
 * and terrible for expectations — without a status signal the organizer sees a
 * finished invitation and assumes guests do too. Both the studio pill and the
 * activation tab read this composable so that signal can never drift between
 * them.
 *
 * @param getEvent          the manage page's event record (may be undefined
 *                          while it loads)
 * @param getFallbackTemplate optional already-loaded template details for when
 *                          `event.event_template_details` isn't populated (the
 *                          activation tab loads them separately via
 *                          useTemplateLoader)
 */
export function useTemplateActivation(
  getEvent: () => Event | null | undefined,
  getFallbackTemplate?: () => EventTemplate | null,
) {
  // usePaymentTemplateIntegration takes its event *by reference* (a plain
  // object, not a ref or getter), so hand it a reactive proxy kept in sync with
  // whatever the caller's event currently is — same pattern
  // MediaUploadsSection.vue uses for the same reason.
  const eventProxy = reactive({
    id: '',
    event_template: null as number | null | undefined,
    event_template_details: undefined as Event['event_template_details'],
  })

  watch(
    () =>
      [getEvent()?.id, getEvent()?.event_template, getEvent()?.event_template_details] as const,
    ([id, templateId, details]) => {
      eventProxy.id = id ?? ''
      eventProxy.event_template = templateId ?? null
      eventProxy.event_template_details = details ?? undefined
    },
    { immediate: true },
  )

  const integration = usePaymentTemplateIntegration(eventProxy as Event)

  /** Event's own details when present, else whatever the caller loaded. */
  const templateDetails = computed(
    () => getEvent()?.event_template_details ?? getFallbackTemplate?.() ?? null,
  )

  const hasTemplate = computed(() => Boolean(getEvent()?.event_template))
  const templateName = computed(() => templateDetails.value?.name ?? null)
  const templatePackage = computed(() => templateDetails.value?.package_plan ?? null)
  const price = computed(() => templatePackage.value?.price ?? null)

  /**
   * The payment row that represents *this* template — matched by template name,
   * then plan name, falling back to any open payment when neither is known yet.
   * (Payments carry no template id from the API, so name matching is the only
   * option; normalized on both sides to survive whitespace/case differences.)
   */
  const currentPayment = computed<Payment | null>(() => {
    const wanted = normalize(templateName.value)
    const wantedPlan = normalize(templatePackage.value?.name)
    const isOpen = (p: Payment) => p.status === 'confirmed' || p.status === 'pending'
    const open = integration.payments.value.filter(isOpen) as readonly Payment[]

    if (!wanted && !wantedPlan) return open[0] ?? null

    return (
      open.find((p) => {
        if (wanted) return normalize(p.template_name) === wanted
        return normalize(p.plan_name) === wantedPlan
      }) ?? null
    )
  })

  /**
   * `integration.isTemplateActivated` only sees `event.event_template_details`;
   * OR-in a name match against the fallback details so the state is correct on
   * the activation tab too, where those details arrive from useTemplateLoader
   * rather than the event payload.
   */
  const isActivated = computed(() => {
    if (!hasTemplate.value) return false
    if (integration.isTemplateActivated.value) return true
    const wanted = normalize(templateName.value)
    if (!wanted) return false
    return integration.payments.value.some(
      (p) => p.status === 'confirmed' && normalize(p.template_name) === wanted,
    )
  })

  const state = computed<ActivationState>(() => {
    if (!hasTemplate.value) return 'no-template'
    if (isActivated.value) return 'active'
    if (currentPayment.value?.status === 'pending') return 'pending'
    return 'unpaid'
  })

  /**
   * False until the payment rows have been fetched at least once.
   *
   * `state` can't express "don't know yet" without forcing every consumer to
   * handle a fifth case, so it optimistically resolves to `unpaid` — which is
   * wrong for an already-activated event, and briefly claiming a live showcase
   * is preview-only is the one mistake this whole feature exists to prevent.
   * Consumers must withhold status UI (the studio pill, the tab's stepper and
   * badges) until this is true.
   */
  const isResolved = computed(() => integration.lastUpdated.value !== null)

  /** A new payment can only be started when no confirmed/pending one exists. */
  const canStartPayment = computed(() => hasTemplate.value && !currentPayment.value)

  return {
    // state
    state,
    isResolved,
    isActivated,
    hasTemplate,
    canStartPayment,

    // template
    templateDetails,
    templateName,
    templatePackage,
    price,

    // payments
    payments: integration.payments,
    loadingPayments: integration.loadingPayments,
    currentPayment,
    loadPayments: integration.loadPayments,
    refreshPayments: integration.refreshPayments,
  }
}
