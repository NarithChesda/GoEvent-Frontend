/**
 * Issued Tickets API service.
 *
 *   GET  /api/tickets/my/                                     all my valid/used tickets across events
 *   GET  /api/tickets/{qr_code_or_check_in_code}/             single-ticket view (door-pass screen)
 *   POST /api/tickets/check-in/                               scanner endpoint — accepts qr_code OR check_in_code
 *
 * The check-in endpoint always returns HTTP 200; success is signaled by
 * `response.ok` in the body. Caller decides whether to render entry / re-entry
 * / rejected based on `ok` and `was_reentry`.
 */

import { apiClient } from '../core/ApiClient'
import type { ApiResponse, PaginatedResponse } from '../types/api.types'
import type {
  Ticket,
  CheckInRequest,
  CheckInResponse,
} from '../types/ticket.types'

export const ticketsService = {
  /**
   * List tickets for the current user. Backend returns a paginated response —
   * we keep the envelope so callers can wire up "load more" as needed.
   */
  listMine(params?: { page?: number; page_size?: number }): Promise<
    ApiResponse<PaginatedResponse<Ticket>>
  > {
    return apiClient.get<PaginatedResponse<Ticket>>('/api/tickets/my/', params)
  },

  /**
   * Fetch a single ticket by either its long QR token or its short check-in
   * code. Used by the buyer's "show this at the door" screen.
   */
  getByCode(qrCodeOrCheckInCode: string): Promise<ApiResponse<Ticket>> {
    return apiClient.get<Ticket>(
      `/api/tickets/${encodeURIComponent(qrCodeOrCheckInCode)}/`,
    )
  },

  /**
   * Door-staff check-in. Pass exactly one of `qr_code` or `check_in_code`.
   *
   *   - HTTP 200 + ok=true,  was_reentry=false  → first scan, big green ENTRY
   *   - HTTP 200 + ok=true,  was_reentry=true   → re-entry (#N), big yellow
   *   - HTTP 200 + ok=false                     → rejected, big red + message
   *   - HTTP 400                                → malformed request
   */
  checkIn(payload: CheckInRequest): Promise<ApiResponse<CheckInResponse>> {
    return apiClient.post<CheckInResponse>('/api/tickets/check-in/', payload)
  },
}
