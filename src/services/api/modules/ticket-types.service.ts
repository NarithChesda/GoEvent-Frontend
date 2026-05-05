/**
 * Ticket Types (a.k.a. tiers) API service.
 *
 * Backend reference: TICKETS_FRONTEND_GUIDE.md → Endpoint Map.
 *
 *   GET    /api/events/{event_id}/ticket-types/             public list (on-sale rows for buyers)
 *   POST   /api/events/{event_id}/ticket-types/             organizer create
 *   GET    /api/events/{event_id}/ticket-types/{id}/        get
 *   PATCH  /api/events/{event_id}/ticket-types/{id}/        update (toggle sale via { is_active })
 *   DELETE /api/events/{event_id}/ticket-types/{id}/        delete
 *
 * Note: there's no separate `/toggle-active/` action endpoint — flipping sale
 * is just a `PATCH` on the detail endpoint with `{ is_active: <bool> }`.
 *
 * The list endpoint is reachable without auth so that anonymous browsers can
 * see "Buy Tickets" pricing. We expose two list helpers — `listPublic` uses
 * `apiClient.getPublic` (no Authorization header); `list` uses the standard
 * authed client and is appropriate for the organizer dashboard. The backend
 * already filters out inactive/expired tiers from the public response.
 */

import { apiClient } from '../core/ApiClient'
import type { ApiResponse, PaginatedResponse } from '../types/api.types'
import type {
  TicketType,
  CreateTicketTypeRequest,
  UpdateTicketTypeRequest,
} from '../types/ticket.types'

/** Strip a paginated envelope down to a plain array — backend may wrap or not. */
function unwrap<T>(data: T[] | PaginatedResponse<T> | undefined): T[] {
  if (!data) return []
  return Array.isArray(data) ? data : data.results ?? []
}

const eventScope = (eventId: string) => `/api/events/${eventId}/ticket-types/`
const tierScope = (eventId: string, id: number) =>
  `/api/events/${eventId}/ticket-types/${id}/`

export const ticketTypesService = {
  /** Public list — no auth required. Use on the public event detail page. */
  async listPublic(eventId: string): Promise<ApiResponse<TicketType[]>> {
    const response = await apiClient.getPublic<TicketType[] | PaginatedResponse<TicketType>>(
      eventScope(eventId),
    )
    if (response.success) {
      return { ...response, data: unwrap(response.data) }
    }
    return response as ApiResponse<TicketType[]>
  },

  /** Authed list — used by the organizer management tab. */
  async list(eventId: string): Promise<ApiResponse<TicketType[]>> {
    const response = await apiClient.get<TicketType[] | PaginatedResponse<TicketType>>(
      eventScope(eventId),
    )
    if (response.success) {
      return { ...response, data: unwrap(response.data) }
    }
    return response as ApiResponse<TicketType[]>
  },

  get(eventId: string, ticketTypeId: number): Promise<ApiResponse<TicketType>> {
    return apiClient.get<TicketType>(tierScope(eventId, ticketTypeId))
  },

  create(
    eventId: string,
    payload: CreateTicketTypeRequest,
  ): Promise<ApiResponse<TicketType>> {
    return apiClient.post<TicketType>(eventScope(eventId), payload)
  },

  update(
    eventId: string,
    ticketTypeId: number,
    payload: UpdateTicketTypeRequest,
  ): Promise<ApiResponse<TicketType>> {
    return apiClient.patch<TicketType>(tierScope(eventId, ticketTypeId), payload)
  },

  remove(eventId: string, ticketTypeId: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(tierScope(eventId, ticketTypeId))
  },

  /**
   * Flip the `is_active` flag. Backend returns the updated tier.
   * Caller passes the desired next value (typically `!tier.is_active`).
   */
  toggleActive(
    eventId: string,
    ticketTypeId: number,
    nextValue: boolean,
  ): Promise<ApiResponse<TicketType>> {
    return apiClient.patch<TicketType>(tierScope(eventId, ticketTypeId), {
      is_active: nextValue,
    })
  },
}
