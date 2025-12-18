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

export interface GuestListFilters extends QueryParams {
  search?: string
  invitation_status?: 'not_sent' | 'sent' | 'viewed'
  group?: number
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
