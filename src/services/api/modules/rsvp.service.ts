/**
 * Guest RSVP API Service — private-event flow.
 *
 * Private events are shortcode-only: the guest identifies themselves via the
 * `g=<shortcode>` query param embedded in their invitation link. The backend
 * ignores any `Authorization` header on these endpoints, so we go through
 * `getPublic` on GET to avoid sending one when the user isn't logged in.
 *
 * Public events still use the existing JWT flow on `eventsService.rsvpForEvent`.
 */

import { apiClient } from '../core/ApiClient'
import type { ApiResponse, PaginatedResponse, QueryParams } from '../types'
import type {
  BulkReorderRsvpQuestionsRequest,
  BulkReorderRsvpQuestionsResponse,
  CreateRsvpQuestionRequest,
  EventRsvpQuestion,
  GuestRsvpFormState,
  GuestRsvpSubmitRequest,
  RsvpQuestionResponses,
  RsvpQuestionResponsesFilters,
  UpdateRsvpQuestionRequest,
} from '../types/rsvp.types'

export const guestRsvpService = {
  /** Fetch the guest's form state + any previous answers (pre-fills the form). */
  async getGuestRsvp(
    eventId: string,
    shortcode: string,
  ): Promise<ApiResponse<GuestRsvpFormState>> {
    return apiClient.getPublic<GuestRsvpFormState>(
      `/api/events/${eventId}/guest-rsvp/`,
      { shortcode },
    )
  },

  /** Submit / upsert the guest's RSVP. Returns the refreshed form state. */
  async submitGuestRsvp(
    eventId: string,
    payload: GuestRsvpSubmitRequest,
  ): Promise<ApiResponse<GuestRsvpFormState>> {
    return apiClient.post<GuestRsvpFormState>(
      `/api/events/${eventId}/guest-rsvp/`,
      payload,
    )
  },
}

/**
 * Host-side RSVP question management.
 * All endpoints require JWT (organizer or collaborator).
 */
export const rsvpQuestionsService = {
  /**
   * List questions for an event (ordered, each with nested translations).
   *
   * The docs describe a bare array but the backend currently wraps the list
   * in DRF's default paginated envelope (`{ count, next, previous, results }`).
   * We normalise both shapes to a plain `EventRsvpQuestion[]` so callers
   * never need to branch.
   */
  async listQuestions(eventId: string): Promise<ApiResponse<EventRsvpQuestion[]>> {
    const response = await apiClient.get<
      EventRsvpQuestion[] | PaginatedResponse<EventRsvpQuestion>
    >(`/api/events/${eventId}/rsvp-questions/`)
    if (response.success && response.data) {
      const raw = response.data
      const list = Array.isArray(raw) ? raw : raw.results ?? []
      return { ...response, data: list }
    }
    return response as ApiResponse<EventRsvpQuestion[]>
  },

  /** Create a new question. */
  async createQuestion(
    eventId: string,
    payload: CreateRsvpQuestionRequest,
  ): Promise<ApiResponse<EventRsvpQuestion>> {
    return apiClient.post<EventRsvpQuestion>(
      `/api/events/${eventId}/rsvp-questions/`,
      payload,
    )
  },

  /**
   * Partial-update an existing question. Omitting `translations` leaves the
   * existing translations untouched; passing an array replaces them.
   */
  async updateQuestion(
    eventId: string,
    questionId: number,
    payload: UpdateRsvpQuestionRequest,
  ): Promise<ApiResponse<EventRsvpQuestion>> {
    return apiClient.patch<EventRsvpQuestion>(
      `/api/events/${eventId}/rsvp-questions/${questionId}/`,
      payload,
    )
  },

  /** Delete a question (and its answers, via backend cascade). */
  async deleteQuestion(
    eventId: string,
    questionId: number,
  ): Promise<ApiResponse<void>> {
    return apiClient.delete(
      `/api/events/${eventId}/rsvp-questions/${questionId}/`,
    )
  },

  /** Reorder questions in one round-trip. */
  async bulkReorderQuestions(
    eventId: string,
    payload: BulkReorderRsvpQuestionsRequest,
  ): Promise<ApiResponse<BulkReorderRsvpQuestionsResponse>> {
    return apiClient.patch<BulkReorderRsvpQuestionsResponse>(
      `/api/events/${eventId}/rsvp-questions/bulk-reorder/`,
      payload,
    )
  },

  /**
   * Per-question drill-through: "show me everyone's answer to *this* question".
   * Two queries on the backend regardless of scale — safe to call for large
   * guest lists. Optional filters scope both `grouped_by_answer` and
   * `guests_without_answer`.
   */
  async getQuestionResponses(
    eventId: string,
    questionId: number,
    filters?: RsvpQuestionResponsesFilters,
  ): Promise<ApiResponse<RsvpQuestionResponses>> {
    return apiClient.get<RsvpQuestionResponses>(
      `/api/events/${eventId}/rsvp-questions/${questionId}/responses/`,
      filters as QueryParams | undefined,
    )
  },
}
