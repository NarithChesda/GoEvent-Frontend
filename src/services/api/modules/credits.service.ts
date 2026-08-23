/**
 * Partner Credit Packs API module.
 *
 * Wholesale credits a partner buys up front and spends one per event at
 * template-activation checkout. See PARTNER_CREDIT_API_DOCS.md.
 *
 * Pagination is *not* consistent across these endpoints - the catalogue and the
 * order list are paginated, `my-credits` returns its own aggregate shape, and
 * `activation-options` is a single object. The return types below say which.
 *
 * Every endpoint except `getActivationOptions` requires a partner account and
 * answers `403` without one. That is "not a partner", not a failure - callers
 * should render the gated state rather than an error.
 *
 * The check used to be for a *vendor profile*; as of 2026-08-23 the backend
 * looks only at the account's partner flag, so a partner with no storefront can
 * buy credits and spend them. Anything in the UI that decides whether to offer
 * credits reads `user.is_partner`, never `useVendorProfile`.
 */

import { apiClient } from '../core/ApiClient'
import type {
  ApiResponse,
  PaginatedResponse,
  ActivationOptions,
  CreateCreditPackOrderData,
  CreditPack,
  CreditPackOrder,
  CreditPackOrderEnvelope,
  PartnerCreditsSummary,
} from '../types'

export const partnerCreditsService = {
  /** The wholesale catalogue. Partner-only - non-partners get 403, not []. */
  async getPacks(): Promise<ApiResponse<PaginatedResponse<CreditPack>>> {
    return apiClient.get<PaginatedResponse<CreditPack>>('/api/payment/credit-packs/')
  },

  async getPack(packId: string): Promise<ApiResponse<CreditPack>> {
    return apiClient.get<CreditPack>(`/api/payment/credit-packs/${packId}/`)
  },

  /**
   * Place an order. Branch on the returned `status`, never on the pack price:
   * a $0 pack without `requires_approval` comes back already `confirmed` with
   * `promo_code_detail` populated.
   */
  async createOrder(
    data: CreateCreditPackOrderData,
  ): Promise<ApiResponse<CreditPackOrderEnvelope>> {
    return apiClient.post<CreditPackOrderEnvelope>('/api/payment/credit-pack-orders/', data)
  },

  /** Same as `createOrder`, with the proof of payment attached up front. */
  async createOrderWithProof(formData: FormData): Promise<ApiResponse<CreditPackOrderEnvelope>> {
    return apiClient.postFormData<CreditPackOrderEnvelope>(
      '/api/payment/credit-pack-orders/',
      formData,
    )
  },

  async getOrders(page?: number): Promise<ApiResponse<PaginatedResponse<CreditPackOrder>>> {
    return apiClient.get<PaginatedResponse<CreditPackOrder>>(
      '/api/payment/credit-pack-orders/',
      page ? { page } : undefined,
    )
  },

  async getOrder(orderId: string): Promise<ApiResponse<CreditPackOrder>> {
    return apiClient.get<CreditPackOrder>(`/api/payment/credit-pack-orders/${orderId}/`)
  },

  /**
   * Attach or replace the proof. Only while `status` is `pending`; a repeat call
   * replaces the file. Throttled by the backend's `file_upload` limiter, so a
   * 429 here needs a friendly retry message rather than a generic failure.
   */
  async uploadProof(
    orderId: string,
    formData: FormData,
  ): Promise<ApiResponse<CreditPackOrderEnvelope>> {
    return apiClient.postFormData<CreditPackOrderEnvelope>(
      `/api/payment/credit-pack-orders/${orderId}/upload-proof/`,
      formData,
    )
  },

  /** Only valid while `pending`; 400 otherwise. */
  async cancelOrder(orderId: string): Promise<ApiResponse<CreditPackOrderEnvelope>> {
    return apiClient.post<CreditPackOrderEnvelope>(
      `/api/payment/credit-pack-orders/${orderId}/cancel/`,
    )
  },

  /** The "My credits" screen. Partner-only. Not paginated. */
  async getMyCredits(): Promise<ApiResponse<PartnerCreditsSummary>> {
    return apiClient.get<PartnerCreditsSummary>('/api/payment/my-credits/')
  },

  /**
   * What the funding options are for one plan. Authenticated but *not*
   * partner-gated, so the shared activation checkout can call it unconditionally
   * - a normal user simply gets `credit: null`.
   */
  async getActivationOptions(
    pricingPlanId: number | string,
  ): Promise<ApiResponse<ActivationOptions>> {
    return apiClient.get<ActivationOptions>('/api/payment/activation-options/', {
      pricing_plan_id: pricingPlanId,
    })
  },
}
