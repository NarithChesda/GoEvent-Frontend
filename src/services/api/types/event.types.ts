/**
 * Event-related type definitions
 */

import type { QueryParams } from './api.types'

export interface EventCategory {
  id: number
  name: string
  color: string
  icon: string
  description: string
  is_active: boolean
}

export interface Event {
  id: string
  title: string
  slug?: string
  description: string
  short_description: string
  start_date: string
  end_date: string
  timezone?: string
  location: string | null
  virtual_link: string | null
  is_virtual: boolean
  privacy: 'public' | 'private'
  status: 'draft' | 'published' | 'cancelled' | 'completed'
  organizer: number
  organizer_name?: string
  organizer_email?: string
  organizer_details?: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    profile_picture: string | null
  }
  category: number | null
  category_name?: string | null
  category_color?: string | null
  category_details?: {
    id: number
    name: string
    description: string
    color: string
    icon: string
  }
  max_attendees: number | null
  registration_required?: boolean
  registration_deadline?: string | null
  banner_image: string | null
  logo_one?: string | null
  logo_two?: string | null
  event_video?: string | null
  music?: string | null
  google_map_embed_link?: string | null
  youtube_embed_link?: string | null
  event_template?: number | null
  event_template_enabled?: boolean
  collaborators_count: number
  registrations_count: number
  is_ongoing: boolean
  is_upcoming: boolean
  is_past: boolean
  can_edit?: boolean
  can_delete?: boolean
  is_registered?: boolean
  payment_lock?: boolean
  created_at: string
  updated_at: string
  // Additional fields from detailed event response
  hosts?: EventHost[]
  agenda_items?: EventAgendaItem[]
  photos?: EventPhoto[]
  collaborators_details?: EventCollaborator[]
  registrations_details?: EventRegistrationDetail[]
  event_template_details?: EventTemplate
}

export interface EventHost {
  id: number
  name: string
  parent_a_name: string
  parent_b_name: string
  title: string
  bio: string
  profile_image: string | null
  email: string
  linkedin_url: string
  twitter_url: string
  website_url: string
  order: number
  translations: HostTranslation[]
}

export interface HostTranslation {
  id?: number
  host?: number
  language: string
  name: string
  parent_a_name: string
  parent_b_name: string
  title: string
  bio: string
  created_at?: string
  updated_at?: string
}

export interface CreateHostRequest {
  name: string
  parent_a_name?: string
  parent_b_name?: string
  title?: string
  bio?: string
  profile_image?: string
  email?: string
  linkedin_url?: string
  twitter_url?: string
  website_url?: string
  order?: number
  translations?: Omit<HostTranslation, 'id' | 'host' | 'created_at' | 'updated_at'>[]
}

export interface BulkReorderHostsRequest {
  updates: { id: number; order: number }[]
}

// Import AgendaIcon from core-data.types.ts to avoid duplication
import type { AgendaIcon } from './core-data.types'

// Re-export for convenience
export type { AgendaIcon }

export interface EventAgendaItem {
  id: number
  title: string
  description: string
  agenda_type: 'session' | 'break' | 'networking' | 'keynote' | 'workshop' | 'panel' | 'other'
  date: string | null
  date_text: string
  start_time_text: string
  end_time_text: string
  speaker: string
  location: string
  icon?: AgendaIcon | null
  virtual_link: string
  order: number
  is_featured: boolean
  color: string
  translations: AgendaTranslation[]
}

export interface AgendaTranslation {
  id?: number
  agenda?: number
  language: string
  title: string
  description: string
  date_text: string
  start_time_text: string
  end_time_text: string
  speaker: string
  created_at?: string
  updated_at?: string
}

export interface CreateAgendaRequest {
  title: string
  description?: string
  agenda_type: 'session' | 'break' | 'networking' | 'keynote' | 'workshop' | 'panel' | 'other'
  date?: string | null
  date_text?: string
  start_time_text?: string
  end_time_text?: string
  speaker?: string
  location?: string
  virtual_link?: string
  icon_id?: number | null
  order?: number
  is_featured?: boolean
  color?: string
  translations?: Omit<AgendaTranslation, 'id' | 'agenda' | 'created_at' | 'updated_at'>[]
}

export interface BulkReorderRequest {
  updates: { id: number; order: number }[]
}

export interface EventPhoto {
  id: number
  event: string
  image: string
  caption: string
  order: number
  is_featured: boolean
  created_at: string
}

export interface EventCollaborator {
  id: number
  user: number | null
  user_details?: {
    id: number
    email: string
    username: string
    first_name: string
    last_name: string
    profile_picture: string | null
    bio: string
    is_verified: boolean
    created_at: string
    updated_at: string
  }
  email: string
  role: 'admin' | 'editor' | 'viewer'
  invited_by: number
  invited_by_name: string
  invited_at: string
  accepted_at: string | null
  is_accepted: boolean
}

export interface EventRegistrationDetail {
  id: number
  user: number
  user_details: {
    id: number
    username: string
    email: string
    first_name?: string
    last_name?: string
  }
  status: string
  guest_count: number
  total_attendees: number
  confirmation_code: string
  registered_at?: string
  checked_in_at?: string | null
  notes?: string
}

export interface EventFilters extends QueryParams {
  search?: string
  category?: number | string
  organizer?: number | string
  start_date_after?: string
  start_date_before?: string
  is_virtual?: boolean
  status?: string
  privacy?: string
  ordering?: string
  is_registered?: boolean
  page?: number
}

export interface EventRegistration {
  id: number
  event: string
  user: number
  user_details?: {
    id: number
    username: string
    email: string
    first_name?: string
    last_name?: string
  }
  status: string
  registered_at: string
  confirmation_code: string
  guest_count: number
  total_attendees: number
  notes?: string
  checked_in_at?: string | null
  checked_in_by?: number | null
  checked_in_by_details?: {
    id: number
    username: string
    email: string
    first_name?: string
    last_name?: string
  }
  cancelled_at?: string | null
  is_checked_in: boolean
  can_check_in: boolean
  attended_at?: string | null
}

export interface MyEventsResponse {
  organized: Event[]
  collaborated: Event[]
}

export interface EventText {
  id: number
  text_type: string
  language: string
  title: string
  content: string
  order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateEventTextRequest {
  text_type: string
  language: string
  title?: string
  content: string
  order?: number
  is_active?: boolean
}

export interface EventComment {
  id: number
  event: string
  user: number
  user_info?: {
    id: number
    username: string
    first_name: string
    last_name: string
    profile_picture: string
  }
  comment_text: string
  created_at: string
}

export interface CreateCommentRequest {
  event: string
  comment_text: string
}

export interface CommentFilters extends QueryParams {
  event?: string
  page?: number
  page_size?: number
}

// Import template types from template.types.ts to avoid duplication
import type {
  EventTemplate,
  EventTemplateFont,
  EventTemplateLanguageFont,
  EventTemplateColor,
  EventTemplatePackagePlan,
} from './template.types'

// Re-export for convenience
export type {
  EventTemplate,
  EventTemplateFont,
  EventTemplateLanguageFont,
  EventTemplateColor,
  EventTemplatePackagePlan,
}
