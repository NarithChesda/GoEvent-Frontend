/**
 * GoEvent's *own* receiving accounts - the bank details and QR codes a customer
 * pays GoEvent through.
 *
 * Not to be confused with `paymentMethodsService`, which manages the methods an
 * organizer publishes on their own event for guests to send gifts to. These come
 * from `/api/payment/payment-methods/` and are the same list for everyone.
 *
 * Extracted from PaymentDrawer once a second checkout - the partner credit-pack
 * order - needed the identical list, loader, and empty state.
 */
import { ref } from 'vue'
import { apiClient } from '@/services/api'
import type { PaymentMethod } from '@/types/payment'

export function usePlatformPaymentMethods() {
  const paymentMethods = ref<readonly PaymentMethod[]>([])
  const loadingMethods = ref(false)
  const methodsError = ref<string | null>(null)

  /**
   * Fetched on first need rather than on mount: both call sites keep their
   * drawer mounted-but-closed, and neither should pay for a request the user
   * may never open.
   */
  const loadPaymentMethods = async (): Promise<void> => {
    if (loadingMethods.value) return

    loadingMethods.value = true
    methodsError.value = null

    try {
      const response = await apiClient.get<{ results: PaymentMethod[] }>(
        '/api/payment/payment-methods/',
      )

      if (response.success && response.data) {
        paymentMethods.value = Object.freeze(response.data.results || [])
      } else {
        throw new Error(response.message || 'Failed to load payment methods')
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Error loading payment methods:', err)
        methodsError.value = 'Failed to load payment methods. Please try again.'
      }
    } finally {
      loadingMethods.value = false
    }
  }

  /** Load once per session-of-this-drawer; repeat opens reuse what's in hand. */
  const ensurePaymentMethods = async (): Promise<void> => {
    if (paymentMethods.value.length > 0) return
    await loadPaymentMethods()
  }

  return {
    paymentMethods,
    loadingMethods,
    methodsError,
    loadPaymentMethods,
    ensurePaymentMethods,
  }
}
