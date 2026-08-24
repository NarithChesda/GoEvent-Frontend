/**
 * Partner access requests.
 *
 * The one pair of endpoints in the partner programme that a **non**-partner is
 * meant to reach — everything in `credits.service.ts` answers `403` without the
 * flag these two exist to ask for. That is why they live in their own module
 * rather than on `partnerCreditsService`, whose contract is "partner-only".
 *
 * `getMyRequest` answers `404` when the account has never applied. That is the
 * normal first-visit state, not a failure, and it is also what the frontend sees
 * while the backend side of this is still unbuilt — both correctly mean "offer
 * the request form". See docs/backend-api-requirements/partner-access-request.md.
 */

import { apiClient } from '../core/ApiClient'
import type {
  ApiResponse,
  CreatePartnerRequestData,
  PartnerRequest,
  PartnerRequestEnvelope,
} from '../types'

export const partnerRequestsService = {
  /** The caller's latest application. `404` = never applied. */
  async getMyRequest(): Promise<ApiResponse<PartnerRequest>> {
    return apiClient.get<PartnerRequest>('/api/payment/partner-requests/me/')
  },

  /**
   * Apply. A second application while one is `pending` is a `400`, so the UI
   * only offers this when there is no open request.
   */
  async createRequest(
    data: CreatePartnerRequestData,
  ): Promise<ApiResponse<PartnerRequestEnvelope>> {
    return apiClient.post<PartnerRequestEnvelope>('/api/payment/partner-requests/', data)
  },
}
