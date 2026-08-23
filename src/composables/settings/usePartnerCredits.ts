/**
 * The partner's wholesale credit state: the catalogue, their balance, and their
 * order history.
 *
 * The three fetches are kept together because the tab cannot render any of them
 * in isolation - a pack card has to know whether a `once_per_vendor` trial has
 * already been claimed (that lives in the orders), and the balance headline is
 * meaningless without the codes beneath it.
 *
 * `403` from any of them means "no vendor profile yet", not a failure. It is
 * surfaced as `isPartnerGated` so the tab can route to partner signup instead of
 * showing an error state - see PARTNER_CREDIT_API_DOCS §1.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { partnerCreditsService } from '@/services/api'
import type {
  CreateCreditPackOrderData,
  CreditPack,
  CreditPackOrder,
  PartnerCreditCode,
} from '@/services/api'

/** Warn on a code within this many days of lapsing (docs §7, "UI suggestions"). */
export const CREDIT_EXPIRY_WARNING_DAYS = 30

export function usePartnerCredits() {
  const { t } = useI18n()

  const packs = ref<CreditPack[]>([])
  const codes = ref<PartnerCreditCode[]>([])
  const orders = ref<CreditPackOrder[]>([])
  const totalCreditsRemaining = ref(0)

  const isLoading = ref(false)
  const hasLoadedOnce = ref(false)
  const loadError = ref<string | null>(null)
  /** True when the API answered 403 - the account has no vendor profile. */
  const isPartnerGated = ref(false)

  const isSubmitting = ref(false)

  /**
   * Codes worth showing as spendable. `total_credits_remaining` already excludes
   * these server-side; this only decides which rows render as greyed out.
   */
  const isCodeSpent = (code: PartnerCreditCode) =>
    code.is_expired || code.is_usage_limit_reached || !code.is_active

  const daysUntilExpiry = (code: PartnerCreditCode): number | null => {
    if (!code.valid_until) return null
    const ms = new Date(code.valid_until).getTime() - Date.now()
    if (Number.isNaN(ms)) return null
    return Math.ceil(ms / 86400000)
  }

  const isExpiringSoon = (code: PartnerCreditCode): boolean => {
    if (isCodeSpent(code)) return false
    const days = daysUntilExpiry(code)
    return days !== null && days >= 0 && days <= CREDIT_EXPIRY_WARNING_DAYS
  }

  const pendingOrders = computed(() => orders.value.filter((o) => o.status === 'pending'))

  /**
   * Whether a `once_per_vendor` pack is already spoken for.
   *
   * Matched by pack id where the serializer sends one and by name otherwise -
   * the order list documents `pack_name` but not `pack`, and a claimed trial has
   * to disable its buy card either way rather than let the partner walk into a
   * guaranteed 400.
   */
  const isPackClaimed = (pack: CreditPack): boolean => {
    if (!pack.once_per_vendor) return false
    return orders.value.some(
      (order) =>
        order.status !== 'rejected' &&
        order.status !== 'cancelled' &&
        (order.pack === pack.id || order.pack_name === pack.name),
    )
  }

  /** A pending order for this pack blocks a second one (docs §3, 400). */
  const pendingOrderForPack = (pack: CreditPack): CreditPackOrder | null =>
    pendingOrders.value.find((order) => order.pack === pack.id || order.pack_name === pack.name) ??
    null

  /**
   * One round trip per surface, run together. A 403 on any of them is the same
   * answer - no vendor profile - so it short-circuits the whole tab rather than
   * leaving two of three panels in an error state.
   */
  const load = async (): Promise<void> => {
    isLoading.value = true
    loadError.value = null

    try {
      const [packsRes, creditsRes, ordersRes] = await Promise.all([
        partnerCreditsService.getPacks(),
        partnerCreditsService.getMyCredits(),
        partnerCreditsService.getOrders(),
      ])

      if ([packsRes, creditsRes, ordersRes].some((r) => r.status === 403)) {
        isPartnerGated.value = true
        packs.value = []
        codes.value = []
        orders.value = []
        totalCreditsRemaining.value = 0
        return
      }

      isPartnerGated.value = false

      if (packsRes.success && packsRes.data) {
        packs.value = [...(packsRes.data.results ?? [])].sort(
          (a, b) => a.display_order - b.display_order,
        )
      }

      if (creditsRes.success && creditsRes.data) {
        totalCreditsRemaining.value = creditsRes.data.total_credits_remaining ?? 0
        codes.value = creditsRes.data.codes ?? []
      }

      if (ordersRes.success && ordersRes.data) {
        orders.value = ordersRes.data.results ?? []
      }

      // Only a genuine failure of all three is a load error worth collapsing the
      // tab for; one endpoint being unavailable still leaves the rest usable.
      if (!packsRes.success && !creditsRes.success && !ordersRes.success) {
        loadError.value =
          packsRes.message || creditsRes.message || t('settings.credits.messages.loadFailed')
      }
    } catch (err) {
      console.error('Error loading partner credits:', err)
      loadError.value = t('settings.credits.messages.loadFailed')
    } finally {
      isLoading.value = false
      hasLoadedOnce.value = true
    }
  }

  /** Balance and orders only - what changes after a purchase or a cancel. */
  const refreshBalanceAndOrders = async (): Promise<void> => {
    const [creditsRes, ordersRes] = await Promise.all([
      partnerCreditsService.getMyCredits(),
      partnerCreditsService.getOrders(),
    ])

    if (creditsRes.success && creditsRes.data) {
      totalCreditsRemaining.value = creditsRes.data.total_credits_remaining ?? 0
      codes.value = creditsRes.data.codes ?? []
    }
    if (ordersRes.success && ordersRes.data) {
      orders.value = ordersRes.data.results ?? []
    }
  }

  /**
   * Place an order, with the proof attached up front when there is one.
   *
   * Returns the created order so the caller can branch on `status`: a free pack
   * without `requires_approval` comes back `confirmed` with the code already
   * issued, and showing that an "awaiting review" screen would be a lie.
   */
  const placeOrder = async (
    data: CreateCreditPackOrderData,
    proof?: File | null,
  ): Promise<{ success: true; order: CreditPackOrder } | { success: false; error: string }> => {
    isSubmitting.value = true

    try {
      const response = proof
        ? await partnerCreditsService.createOrderWithProof(buildOrderFormData(data, proof))
        : await partnerCreditsService.createOrder(data)

      if (response.success && response.data?.order) {
        await refreshBalanceAndOrders()
        return { success: true, order: response.data.order }
      }

      return {
        success: false,
        error: response.message || t('settings.credits.messages.orderFailed'),
      }
    } catch (err) {
      console.error('Error placing credit pack order:', err)
      return { success: false, error: t('settings.credits.messages.orderFailed') }
    } finally {
      isSubmitting.value = false
    }
  }

  const uploadProof = async (
    orderId: string,
    proof: File,
    extras?: { payment_method?: number; transaction_reference?: string },
  ): Promise<{ success: true; order: CreditPackOrder } | { success: false; error: string }> => {
    isSubmitting.value = true

    try {
      const formData = new FormData()
      formData.append('payment_proof', proof)
      if (extras?.payment_method != null) {
        formData.append('payment_method', String(extras.payment_method))
      }
      if (extras?.transaction_reference) {
        formData.append('transaction_reference', extras.transaction_reference)
      }

      const response = await partnerCreditsService.uploadProof(orderId, formData)

      if (response.success && response.data?.order) {
        await refreshBalanceAndOrders()
        return { success: true, order: response.data.order }
      }

      // The upload throttle is the one failure here with a real remedy.
      const error =
        response.status === 429
          ? t('settings.credits.messages.uploadThrottled')
          : response.message || t('settings.credits.messages.uploadFailed')
      return { success: false, error }
    } catch (err) {
      console.error('Error uploading credit pack proof:', err)
      return { success: false, error: t('settings.credits.messages.uploadFailed') }
    } finally {
      isSubmitting.value = false
    }
  }

  const cancelOrder = async (orderId: string): Promise<{ success: boolean; error?: string }> => {
    isSubmitting.value = true

    try {
      const response = await partnerCreditsService.cancelOrder(orderId)

      if (response.success) {
        await refreshBalanceAndOrders()
        return { success: true }
      }

      return {
        success: false,
        error: response.message || t('settings.credits.messages.cancelFailed'),
      }
    } catch (err) {
      console.error('Error cancelling credit pack order:', err)
      return { success: false, error: t('settings.credits.messages.cancelFailed') }
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    // state
    packs,
    codes,
    orders,
    pendingOrders,
    totalCreditsRemaining,
    isLoading,
    hasLoadedOnce,
    loadError,
    isPartnerGated,
    isSubmitting,

    // helpers
    isCodeSpent,
    isExpiringSoon,
    daysUntilExpiry,
    isPackClaimed,
    pendingOrderForPack,

    // actions
    load,
    refreshBalanceAndOrders,
    placeOrder,
    uploadProof,
    cancelOrder,
  }
}

function buildOrderFormData(data: CreateCreditPackOrderData, proof: File): FormData {
  const formData = new FormData()
  formData.append('pack', data.pack)
  if (data.payment_method != null) formData.append('payment_method', String(data.payment_method))
  if (data.transaction_reference) {
    formData.append('transaction_reference', data.transaction_reference)
  }
  if (data.vendor_notes) formData.append('vendor_notes', data.vendor_notes)
  formData.append('payment_proof', proof)
  return formData
}
