/**
 * Notifications API service.
 *
 * Backend reference: /api/notifications/ (see NOTIFICATIONS_API_DOCS.md).
 *
 * - GET    /api/notifications/                → paginated list (filters: unread, type)
 * - GET    /api/notifications/unread-count/   → { count }
 * - POST   /api/notifications/{id}/read/      → mark single as read
 * - POST   /api/notifications/read-all/       → mark all as read
 * - DELETE /api/notifications/{id}/           → delete one
 * - GET    /api/notifications/preferences/    → preferences (auto-created)
 * - PATCH  /api/notifications/preferences/    → update preferences
 */

import { apiClient } from '../core/ApiClient'
import type { ApiResponse, PaginatedResponse, QueryParams } from '../types/api.types'
import type {
  NotificationItem,
  NotificationListFilters,
  NotificationPreferences,
  UpdateNotificationPreferencesRequest,
  MarkReadResponse,
  MarkAllReadResponse,
  UnreadCountResponse,
} from '../types/notification.types'

const BASE = '/api/notifications'

function toQueryParams(filters?: NotificationListFilters): QueryParams | undefined {
  if (!filters) return undefined
  const params: QueryParams = {}
  if (filters.unread !== undefined) params.unread = filters.unread
  if (filters.type) params.type = filters.type
  if (filters.page) params.page = filters.page
  if (filters.page_size) params.page_size = filters.page_size
  return params
}

export const notificationsService = {
  list(
    filters?: NotificationListFilters,
  ): Promise<ApiResponse<PaginatedResponse<NotificationItem>>> {
    return apiClient.get<PaginatedResponse<NotificationItem>>(`${BASE}/`, toQueryParams(filters))
  },

  unreadCount(): Promise<ApiResponse<UnreadCountResponse>> {
    return apiClient.get<UnreadCountResponse>(`${BASE}/unread-count/`)
  },

  markRead(id: string): Promise<ApiResponse<MarkReadResponse>> {
    return apiClient.post<MarkReadResponse>(`${BASE}/${id}/read/`)
  },

  markAllRead(): Promise<ApiResponse<MarkAllReadResponse>> {
    return apiClient.post<MarkAllReadResponse>(`${BASE}/read-all/`)
  },

  remove(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${BASE}/${id}/`)
  },

  getPreferences(): Promise<ApiResponse<NotificationPreferences>> {
    return apiClient.get<NotificationPreferences>(`${BASE}/preferences/`)
  },

  updatePreferences(
    data: UpdateNotificationPreferencesRequest,
  ): Promise<ApiResponse<NotificationPreferences>> {
    return apiClient.patch<NotificationPreferences>(`${BASE}/preferences/`, data)
  },
}
