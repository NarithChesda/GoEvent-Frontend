/**
 * Ticket Analytics + Attendee List API service.
 *
 *   GET /api/events/{event_id}/ticket-analytics/                       summary + by_tier + by_day + refund table
 *   GET /api/events/{event_id}/ticket-attendees/                       paginated attendee JSON (?status=, ?ticket_type_id=)
 *   GET /api/events/{event_id}/ticket-attendees/export.csv             text/csv download
 *
 * The CSV endpoint returns a non-JSON `text/csv` body, so it cannot use the
 * shared `apiClient` (which always parses JSON). We hit it with `fetch`
 * directly and surface the result as a Blob; the caller decides whether to
 * trigger a browser download or render preview rows.
 */

import { apiClient } from '../core/ApiClient'
import { tokenManager } from '@/services/tokenManager'
import type { ApiResponse, PaginatedResponse } from '../types/api.types'
import type {
  TicketAnalytics,
  AttendeeListItem,
  AttendeeFilters,
} from '../types/ticket.types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export interface AttendeesCsvDownload {
  blob: Blob
  /** Filename suggested by the backend's Content-Disposition header, if any. */
  filename: string | null
}

export const ticketAnalyticsService = {
  getAnalytics(eventId: string): Promise<ApiResponse<TicketAnalytics>> {
    return apiClient.get<TicketAnalytics>(`/api/events/${eventId}/ticket-analytics/`)
  },

  listAttendees(
    eventId: string,
    filters?: AttendeeFilters,
  ): Promise<ApiResponse<PaginatedResponse<AttendeeListItem>>> {
    return apiClient.get<PaginatedResponse<AttendeeListItem>>(
      `/api/events/${eventId}/ticket-attendees/`,
      filters,
    )
  },

  /**
   * CSV download. Throws on network failure or non-2xx response so callers
   * can show a toast — different shape from the JSON endpoints because the
   * payload is binary and the standard `ApiResponse` wrapper assumes JSON.
   */
  async downloadAttendeesCsv(
    eventId: string,
    filters?: AttendeeFilters,
  ): Promise<AttendeesCsvDownload> {
    const url = new URL(
      `${API_BASE_URL}/api/events/${eventId}/ticket-attendees/export.csv`,
    )
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          url.searchParams.append(key, String(value))
        }
      })
    }

    const accessToken = tokenManager.getAccessToken()
    const headers: Record<string, string> = {
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'text/csv',
    }
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
    }

    const response = await fetch(url.toString(), { method: 'GET', headers })

    if (!response.ok) {
      throw new Error(
        `Attendee CSV download failed (HTTP ${response.status} ${response.statusText})`,
      )
    }

    // RFC 6266 quoted form, e.g. `attachment; filename="attendees-foo-2026-05-05.csv"`.
    const disposition = response.headers.get('Content-Disposition')
    const filename = disposition
      ? /filename\*?=(?:UTF-8'')?"?([^;"\n]+)"?/i.exec(disposition)?.[1] ?? null
      : null

    return { blob: await response.blob(), filename }
  },
}
