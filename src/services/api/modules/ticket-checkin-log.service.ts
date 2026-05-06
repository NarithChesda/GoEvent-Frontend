/**
 * Ticket Check-In Audit Log API service.
 *
 *   GET /api/events/{event_id}/check-in-log/                  paginated audit feed
 *
 * Every scan attempt — entry, reentry, rejected, undone, replayed — is
 * recorded as one row. Drives post-event reports and dispute resolution.
 *
 * `scanned_at` is the client-claimed time of the scan (drives report
 * timestamps). `server_recorded_at` is when the row was persisted (drives
 * ordering + dedupe). They differ for offline batch sync.
 */

import { apiClient } from '../core/ApiClient'
import type { ApiResponse, PaginatedResponse } from '../types/api.types'
import type {
  CheckInLogEntry,
  CheckInLogFilters,
} from '../types/ticket.types'

export const ticketCheckinLogService = {
  list(
    eventId: string,
    filters?: CheckInLogFilters,
  ): Promise<ApiResponse<PaginatedResponse<CheckInLogEntry>>> {
    return apiClient.get<PaginatedResponse<CheckInLogEntry>>(
      `/api/events/${eventId}/check-in-log/`,
      filters,
    )
  },
}
