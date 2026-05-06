/**
 * Issued Tickets + Door Check-In API service.
 *
 *   GET  /api/tickets/my/                                     all my valid/used tickets across events
 *   GET  /api/tickets/{qr_code_or_check_in_code}/             single-ticket view (door-pass screen)
 *   POST /api/tickets/check-in/                               scanner endpoint — accepts qr_code OR check_in_code
 *   POST /api/tickets/{code}/check-in/undo/                   reverse a fat-finger scan
 *   POST /api/events/{event_id}/check-in/batch/               sync queued offline scans (≤200 per batch)
 *
 * The check-in endpoints always return HTTP 200; success is signaled by
 * `response.ok` in the body. Caller decides whether to render entry / re-entry
 * / rejected based on `ok`, `was_reentry`, and `wrong_tier`.
 *
 * Pass an `idempotency_key` (UUID v4) on every real scan — replays return the
 * cached outcome with `replayed: true` instead of double-counting. The key
 * threads through to the offline-queue batch sync as well.
 */

import { apiClient } from '../core/ApiClient'
import type { ApiResponse, PaginatedResponse } from '../types/api.types'
import type {
  Ticket,
  CheckInRequest,
  CheckInResponse,
  UndoCheckInRequest,
  UndoCheckInResponse,
  BatchSyncRequest,
  BatchSyncResponse,
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
   *   - HTTP 200 + ok=false, wrong_tier=true    → wrong gate, redirect to {tier}
   *   - HTTP 200 + ok=false                     → rejected (used/refunded/cancelled/event-not-running)
   *   - HTTP 200 + replayed=true                → idempotency cache hit, no mutation
   *   - HTTP 400                                → malformed request
   */
  checkIn(payload: CheckInRequest): Promise<ApiResponse<CheckInResponse>> {
    return apiClient.post<CheckInResponse>('/api/tickets/check-in/', payload)
  },

  /**
   * Undo a check-in. Reverts the ticket to `valid`, clears `check_in_count`
   * and timestamps. The original entry row stays in the audit log; an
   * additional row with `outcome='undone'` is written. No server-side time
   * cap — clients can enforce a soft "undo only within 5 minutes" UI rule.
   *
   * `code` is either the QR token or the short check-in code.
   * Returns 400 if the ticket isn't in `used` status, 404 if the code
   * doesn't match, 403 if the caller isn't an event editor.
   */
  undo(
    code: string,
    payload: UndoCheckInRequest = {},
  ): Promise<ApiResponse<UndoCheckInResponse>> {
    return apiClient.post<UndoCheckInResponse>(
      `/api/tickets/${encodeURIComponent(code)}/check-in/undo/`,
      payload,
    )
  },

  /**
   * Sync scans collected while the scanner was offline. Each scan is
   * processed independently — a single bad scan never aborts the rest of
   * the batch. Maximum 200 scans per batch; entries with `scanned_at` older
   * than 7 days are rejected per-row. The endpoint is event-scoped:
   * cross-event tickets are rejected with `ok: false` without mutation.
   *
   * `results[]` preserves input order; reconcile by `idempotency_key`.
   */
  batchSync(
    eventId: string,
    payload: BatchSyncRequest,
  ): Promise<ApiResponse<BatchSyncResponse>> {
    return apiClient.post<BatchSyncResponse>(
      `/api/events/${eventId}/check-in/batch/`,
      payload,
    )
  },
}
