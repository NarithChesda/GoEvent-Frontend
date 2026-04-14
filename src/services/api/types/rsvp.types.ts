/**
 * RSVP question / guest-response types for the private-event flow.
 *
 * Public events keep using the existing `EventRegistration`-based flow (see
 * `rsvpForEvent` / `EventRegistration`). These types cover the new
 * guest-shortcode endpoint `GET|POST /api/events/{id}/guest-rsvp/`, where
 * invited guests submit custom questionnaires against their `EventGuest` row.
 */

export type GuestRsvpStatus = 'pending' | 'attending' | 'not_attending' | 'maybe'

export type EventRsvpQuestionType =
  | 'text'
  | 'long_text'
  | 'yes_no'
  | 'single_choice'
  | 'multi_choice'

export interface EventRsvpQuestionTranslation {
  language: string
  question_text: string
  choices?: string[]
}

export interface EventRsvpQuestion {
  id: number
  question_text: string
  question_type: EventRsvpQuestionType
  choices: string[]
  is_required: boolean
  order: number
  translations?: EventRsvpQuestionTranslation[]
}

export interface GuestRsvpAnswer {
  question_id: number
  answer_text?: string
  answer_choices?: string[]
}

export interface GuestRsvpFormState {
  guest_id: number
  guest_name: string
  event_id: string
  rsvp_status: GuestRsvpStatus
  rsvp_status_display: string
  rsvp_responded_at: string | null
  plus_ones_count: number
  plus_ones_names: string
  max_plus_ones: number
  private_note_to_host: string
  questions: EventRsvpQuestion[]
  answers: GuestRsvpAnswer[]
}

export interface GuestRsvpSubmitRequest {
  guest_shortcode: string
  rsvp_status: GuestRsvpStatus
  plus_ones_count?: number
  plus_ones_names?: string
  private_note_to_host?: string
  answers?: GuestRsvpAnswer[]
}

/**
 * Host-side question CRUD payloads
 * (POST / PATCH /api/events/{id}/rsvp-questions/).
 *
 * `translations.choices` must stay index-paired with the parent `choices`
 * array — the backend validates equality of length and the guest-facing
 * showcase pairs them by index at display time.
 */
export interface CreateRsvpQuestionRequest {
  question_text: string
  question_type: EventRsvpQuestionType
  choices?: string[]
  is_required?: boolean
  order?: number
  translations?: EventRsvpQuestionTranslation[]
}

export type UpdateRsvpQuestionRequest = Partial<CreateRsvpQuestionRequest>

export interface BulkReorderRsvpQuestionsRequest {
  updates: Array<{ id: number; order: number }>
}

export interface BulkReorderRsvpQuestionsResponse {
  updated: number
}

/**
 * Per-question drill-through payload returned by
 * `GET /api/events/{event_id}/rsvp-questions/{question_id}/responses/`.
 *
 * Designed for host dashboards that need "show me everyone's answer to
 * *this* question". The backend emits two flavours — one for choice-style
 * questions (`grouped_by_answer` populated, `free_text_answers` null) and
 * one for free-text types (the opposite). Both share the same wrapper so
 * callers just branch on `question_type`.
 */
export interface RsvpQuestionResponseGuest {
  id: number
  name: string
  email?: string
  group_id: number | null
  group_name: string | null
  group_color: string | null
  rsvp_status: GuestRsvpStatus
  plus_ones_count?: number
}

export interface RsvpQuestionResponseGroupedBucket {
  answer: string
  count: number
  guests: RsvpQuestionResponseGuest[]
}

export interface RsvpQuestionFreeTextAnswer extends RsvpQuestionResponseGuest {
  answer_text: string
  updated_at: string
}

export interface RsvpQuestionResponses {
  question_id: number
  question_text: string
  question_type: EventRsvpQuestionType
  is_required: boolean
  total_answers: number
  grouped_by_answer: RsvpQuestionResponseGroupedBucket[] | null
  free_text_answers: RsvpQuestionFreeTextAnswer[] | null
  guests_without_answer: RsvpQuestionResponseGuest[]
  guests_without_answer_truncated: boolean
}

/** Optional filters for the per-question drill-through. */
export interface RsvpQuestionResponsesFilters {
  rsvp_status?: GuestRsvpStatus
  group?: number
  ordering?: 'name' | '-name' | 'rsvp_responded_at' | '-rsvp_responded_at'
}
