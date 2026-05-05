/**
 * Ticket Checkout Questions API service.
 *
 *   GET    /api/events/{event_id}/checkout-questions/                       list (public OK; supports ?ticket_type_id=)
 *   POST   /api/events/{event_id}/checkout-questions/                       organizer create
 *   GET    /api/events/{event_id}/checkout-questions/{id}/                  get
 *   PATCH  /api/events/{event_id}/checkout-questions/{id}/                  update
 *   DELETE /api/events/{event_id}/checkout-questions/{id}/                  delete
 *
 * Bulk reorder: backend has **not** built a dedicated bulk-reorder endpoint
 * for ticket checkout questions yet (TICKETS_API_DOCS "NOT yet built" list).
 * `bulkReorder` is implemented client-side as parallel `PATCH` calls — same
 * signature as the eventual server endpoint, so callers don't need to change
 * once the bulk endpoint ships.
 *
 * Pattern mirrors `rsvpQuestionsService` — including the paginated-envelope
 * normalization (`{ count, next, previous, results }` → `T[]`).
 */

import { apiClient } from '../core/ApiClient'
import type { ApiResponse, PaginatedResponse } from '../types/api.types'
import type {
  TicketCheckoutQuestion,
  CreateCheckoutQuestionRequest,
  UpdateCheckoutQuestionRequest,
  BulkReorderCheckoutQuestionsRequest,
  BulkReorderCheckoutQuestionsResponse,
} from '../types/ticket.types'

function unwrap<T>(data: T[] | PaginatedResponse<T> | undefined): T[] {
  if (!data) return []
  return Array.isArray(data) ? data : data.results ?? []
}

const eventScope = (eventId: string) => `/api/events/${eventId}/checkout-questions/`
const questionScope = (eventId: string, id: number) =>
  `/api/events/${eventId}/checkout-questions/${id}/`

export const checkoutQuestionsService = {
  /**
   * Public list for the buyer-facing checkout page. Optionally scoped to a
   * single tier — backend returns event-scoped questions plus tier-scoped
   * questions matching `ticket_type_id`.
   */
  async listPublic(
    eventId: string,
    ticketTypeId?: number,
  ): Promise<ApiResponse<TicketCheckoutQuestion[]>> {
    const params = ticketTypeId ? { ticket_type_id: ticketTypeId } : undefined
    const response = await apiClient.getPublic<
      TicketCheckoutQuestion[] | PaginatedResponse<TicketCheckoutQuestion>
    >(eventScope(eventId), params)
    if (response.success) {
      return { ...response, data: unwrap(response.data) }
    }
    return response as ApiResponse<TicketCheckoutQuestion[]>
  },

  /** Authed list for the organizer management tab. */
  async list(
    eventId: string,
    ticketTypeId?: number,
  ): Promise<ApiResponse<TicketCheckoutQuestion[]>> {
    const params = ticketTypeId ? { ticket_type_id: ticketTypeId } : undefined
    const response = await apiClient.get<
      TicketCheckoutQuestion[] | PaginatedResponse<TicketCheckoutQuestion>
    >(eventScope(eventId), params)
    if (response.success) {
      return { ...response, data: unwrap(response.data) }
    }
    return response as ApiResponse<TicketCheckoutQuestion[]>
  },

  get(
    eventId: string,
    questionId: number,
  ): Promise<ApiResponse<TicketCheckoutQuestion>> {
    return apiClient.get<TicketCheckoutQuestion>(questionScope(eventId, questionId))
  },

  create(
    eventId: string,
    payload: CreateCheckoutQuestionRequest,
  ): Promise<ApiResponse<TicketCheckoutQuestion>> {
    return apiClient.post<TicketCheckoutQuestion>(eventScope(eventId), payload)
  },

  update(
    eventId: string,
    questionId: number,
    payload: UpdateCheckoutQuestionRequest,
  ): Promise<ApiResponse<TicketCheckoutQuestion>> {
    return apiClient.patch<TicketCheckoutQuestion>(
      questionScope(eventId, questionId),
      payload,
    )
  },

  remove(eventId: string, questionId: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(questionScope(eventId, questionId))
  },

  /**
   * Reorder N questions. Until the backend exposes a single bulk endpoint,
   * we PATCH each affected row in parallel and synthesize the same response
   * shape so callers don't have to branch.
   *
   * Failure mode: if any individual PATCH fails, we return the first error
   * verbatim. Already-applied PATCHes are not rolled back — caller should
   * refetch the list to resolve any partial drift.
   */
  async bulkReorder(
    eventId: string,
    payload: BulkReorderCheckoutQuestionsRequest,
  ): Promise<ApiResponse<BulkReorderCheckoutQuestionsResponse>> {
    const responses = await Promise.all(
      payload.updates.map((u) =>
        apiClient.patch<TicketCheckoutQuestion>(questionScope(eventId, u.id), {
          order: u.order,
        }),
      ),
    )
    const failure = responses.find((r) => !r.success)
    if (failure) {
      return failure as unknown as ApiResponse<BulkReorderCheckoutQuestionsResponse>
    }
    return {
      success: true,
      data: { updated: responses.length },
    }
  },
}
