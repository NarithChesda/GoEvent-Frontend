/**
 * Notification types for the in-app + Telegram notifications system.
 * Mirrors the backend serializer at /api/notifications/.
 */

export type NotificationType =
  | 'event_registration'
  | 'rsvp_response'
  | 'event_comment'
  | 'collaborator_invite'
  | 'collaborator_added'
  | 'payment_confirmed'
  | 'payment_rejected'
  | 'event_reminder'
  | 'check_in'
  | 'guest_cash_gift'

export type NotificationChannel = 'in_app' | 'telegram'

export interface NotificationItem {
  id: string
  notification_type: NotificationType
  title: string
  message: string
  source_type: string | null
  source_id: string | null
  action_url: string
  metadata: Record<string, unknown>
  channels_sent: NotificationChannel[]
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface NotificationListFilters {
  unread?: boolean
  type?: NotificationType
  page?: number
  page_size?: number
}

export interface MarkReadResponse {
  id: string
  is_read: boolean
  read_at: string | null
}

export interface MarkAllReadResponse {
  marked_read: number
}

export interface UnreadCountResponse {
  count: number
}

/**
 * Per-type toggles + master switches. PATCH accepts any subset of these fields.
 */
export interface NotificationPreferences {
  telegram_enabled: boolean
  in_app_enabled: boolean
  notify_event_registration: boolean
  notify_rsvp_response: boolean
  notify_event_comment: boolean
  notify_collaborator_invite: boolean
  notify_collaborator_added: boolean
  notify_payment_status: boolean
  notify_event_reminder: boolean
  notify_check_in: boolean
  notify_guest_cash_gift: boolean
  updated_at: string
}

export type UpdateNotificationPreferencesRequest = Partial<
  Omit<NotificationPreferences, 'updated_at'>
>
