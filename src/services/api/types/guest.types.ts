/**
 * Guest management type definitions
 */

import type { QueryParams } from './api.types'

export interface GuestGroup {
  id: number
  name: string
  description?: string
  color?: string
  order: number
  guest_count: number
  invitation_stats?: {
    total: number
    not_sent: number
    sent: number
    viewed: number
  }
  event: string
  created_at?: string
  updated_at?: string
}

export interface CreateGuestGroupRequest {
  name: string
  description?: string
  color?: string
  order?: number
}

export interface GuestGroupStats {
  total: number
  not_sent: number
  sent: number
  viewed: number
}

/** RSVP response state stored on the guest row (private-event flow). */
export type GuestRsvpStatusValue = 'pending' | 'attending' | 'not_attending' | 'maybe'

/**
 * One hydrated RSVP answer as returned by the host guest-detail endpoint
 * (`GET /api/events/{id}/guests/{guest_id}/`). Each row embeds the question's
 * text/type/order so the frontend can render without cross-referencing the
 * question list.
 */
export interface GuestRsvpAnswerDetail {
  question_id: number
  question_text: string
  question_type: 'text' | 'long_text' | 'yes_no' | 'single_choice' | 'multi_choice'
  question_order: number
  answer_text: string
  answer_choices: string[]
  updated_at: string
}

export interface EventGuest {
  id: number
  name: string
  email?: string
  phone_number?: string
  cash_gift_amount?: string
  cash_gift_currency?: string
  invitation_status: 'not_sent' | 'sent' | 'viewed'
  invitation_status_display: string
  /** Full showcase URL path (e.g., "/events/{uuid}/showcase/?guest_name=...") */
  showcase_link: string
  /**
   * Backend-generated shortlink path (e.g., "/g/CKZNuy")
   * @deprecated Use short_url instead which contains the full URL
   */
  short_link: string
  /**
   * Full shortlink URL (e.g., "https://goevent.online/g/CKZNuy")
   * Used for social media sharing with proper meta tags and analytics
   */
  short_url: string
  group: number
  group_details?: {
    id: number
    name: string
    color?: string
    order: number
    guest_count: number
  }
  added_by?: number
  added_by_details?: {
    id: number
    username: string
    email: string
    profile?: {
      full_name: string
      profile_picture: string | null
    }
  }
  // ---- RSVP fields (private-event guest-shortcode flow) -----------------
  rsvp_status?: GuestRsvpStatusValue
  rsvp_status_display?: string
  rsvp_responded_at?: string | null
  plus_ones_count?: number
  plus_ones_names?: string
  private_note_to_host?: string
  max_plus_ones?: number
  /**
   * How many custom RSVP questions this guest has answered. Present on the
   * list endpoint (cheap SQL count) and echoed on the detail endpoint.
   */
  rsvp_answered_count?: number
  /**
   * Fully-hydrated per-question answers. Only present on the **detail**
   * endpoint (`GET /api/events/{id}/guests/{guest_id}/`) — the list endpoint
   * deliberately omits this to stay lightweight.
   */
  rsvp_answers?: GuestRsvpAnswerDetail[]
  created_at: string
  updated_at: string
}

export interface CreateGuestRequest {
  name: string
  group: number
  email?: string
  phone_number?: string
  cash_gift_amount?: string
  cash_gift_currency?: string
}

/**
 * Patch payload for `PATCH /api/events/{id}/guests/{id}/`.
 *
 * Extends the create fields with host-editable RSVP fields. Hosts can
 * override a guest's `rsvp_status` (e.g. record an RSVP collected offline)
 * and raise `max_plus_ones` when a particular guest needs a higher cap.
 * `plus_ones_*` and `private_note_to_host` are also writable so the host can
 * correct mistakes — but the guest is the primary author via the showcase.
 */
export interface UpdateGuestRequest extends Partial<CreateGuestRequest> {
  rsvp_status?: GuestRsvpStatusValue
  max_plus_ones?: number
  plus_ones_count?: number
  plus_ones_names?: string
  private_note_to_host?: string
}

export interface GuestListFilters extends QueryParams {
  search?: string
  invitation_status?: 'not_sent' | 'sent' | 'viewed'
  /** Server-side RSVP status filter (`pending` / `attending` / `not_attending` / `maybe`). */
  rsvp_status?: GuestRsvpStatusValue
  group?: number
  /**
   * Field to order by — e.g. `rsvp_responded_at` for most-recent-first, or
   * `-rsvp_status` to group by status.
   */
  ordering?: string
  page?: number
  page_size?: number
  limit?: number
}

export interface GuestStats {
  total_guests: number
  not_sent: number
  sent: number
  viewed: number
}

export interface BulkOperationResponse {
  status: string
  count: number
}

/**
 * Aggregated RSVP dashboard for the host.
 * Backed by `GET /api/events/{id}/guests/rsvp-summary/`.
 *
 * - `total_expected_attendees` counts the guest themselves plus their
 *   plus-ones for every guest whose status is `attending`.
 * - `question_breakdowns[*].breakdown` is null for free-text question types.
 */
export interface GuestRsvpStatusCounts {
  pending: number
  attending: number
  not_attending: number
  maybe: number
}

export interface GuestRsvpPendingGuest {
  id: number
  name: string
  email: string
  invitation_status: 'not_sent' | 'sent' | 'viewed'
}

export interface GuestRsvpQuestionBreakdown {
  question_id: number
  question_text: string
  question_type: string
  is_required: boolean
  total_answers: number
  breakdown: Record<string, number> | null
}

export interface GuestRsvpSummary {
  total_invited: number
  status_counts: GuestRsvpStatusCounts
  total_expected_attendees: number
  pending_guests: GuestRsvpPendingGuest[]
  question_breakdowns: GuestRsvpQuestionBreakdown[]
}
