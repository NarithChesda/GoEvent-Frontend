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
