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
import type { ApiResponse } from '../types'
import type {
  GuestRsvpFormState,
  GuestRsvpSubmitRequest,
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
