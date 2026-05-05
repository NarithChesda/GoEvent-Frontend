/**
 * Promo Code validation API service.
 *
 *   POST /api/events/{event_id}/promo-code/validate/
 *
 * Buyers enter a promo code on the checkout page. The frontend should call
 * this endpoint with the current cart contents to preview the discount before
 * submitting the order. The same code string is then passed in the body of
 * `POST /api/events/{id}/ticket-orders/` — the server re-validates and applies.
 *
 * Response:
 *   - 200 OK with PromoValidationSuccess on a valid code
 *   - 400 Bad Request with `{ "code": ["...reason..."] }` on rejection
 *
 * The 400 reason already comes back via the standard `ApiResponse.errors` map,
 * so callers can surface it directly under the input.
 *
 * Reuses the existing `payment.PromoCode` model — same one used by plan-purchase
 * discounts. A code may be globally applicable or scoped to specific events /
 * tiers; this endpoint is the authoritative source for whether the user's
 * current cart actually qualifies for a discount.
 */

import { apiClient } from '../core/ApiClient'
import type { ApiResponse } from '../types/api.types'
import type {
  PromoValidationRequest,
  PromoValidationSuccess,
} from '../types/ticket.types'

export const promoCodesService = {
  validate(
    eventId: string,
    payload: PromoValidationRequest,
  ): Promise<ApiResponse<PromoValidationSuccess>> {
    return apiClient.post<PromoValidationSuccess>(
      `/api/events/${eventId}/promo-code/validate/`,
      payload,
    )
  },
}
