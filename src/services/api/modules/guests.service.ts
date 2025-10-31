/**
 * Guest Management API Service
 * Handles guest lists and guest groups
 */

import { apiClient } from '../core/ApiClient'
import type {
  ApiResponse,
  PaginatedResponse,
  EventGuest,
  GuestGroup,
  CreateGuestRequest,
  CreateGuestGroupRequest,
  GuestListFilters,
  GuestStats,
  GuestGroupStats,
} from '../types'

// Guest Service
export const guestService = {
  // List all guests for an event
  async getGuests(
    eventId: string,
    filters?: GuestListFilters,
  ): Promise<ApiResponse<PaginatedResponse<EventGuest>>> {
    return apiClient.get<PaginatedResponse<EventGuest>>(`/api/events/${eventId}/guests/`, filters)
  },

  // Get guest statistics
  async getGuestStats(eventId: string): Promise<ApiResponse<GuestStats>> {
    return apiClient.get<GuestStats>(`/api/events/${eventId}/guests/stats/`)
  },

  // Get a specific guest
  async getGuest(eventId: string, guestId: number): Promise<ApiResponse<EventGuest>> {
    return apiClient.get<EventGuest>(`/api/events/${eventId}/guests/${guestId}/`)
  },

  // Add a new guest
  async createGuest(eventId: string, data: CreateGuestRequest): Promise<ApiResponse<EventGuest>> {
    return apiClient.post<EventGuest>(`/api/events/${eventId}/guests/`, data)
  },

  // Update a guest
  async updateGuest(
    eventId: string,
    guestId: number,
    data: Partial<CreateGuestRequest>,
  ): Promise<ApiResponse<EventGuest>> {
    return apiClient.patch<EventGuest>(`/api/events/${eventId}/guests/${guestId}/`, data)
  },

  // Delete a guest
  async deleteGuest(eventId: string, guestId: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/events/${eventId}/guests/${guestId}/`)
  },

  // Mark invitation as sent
  async markInvitationSent(eventId: string, guestId: number): Promise<ApiResponse<EventGuest>> {
    return apiClient.patch<EventGuest>(`/api/events/${eventId}/guests/${guestId}/mark-sent/`, {})
  },

  // Mark invitation as viewed
  async markInvitationViewed(eventId: string, guestId: number): Promise<ApiResponse<EventGuest>> {
    return apiClient.patch<EventGuest>(`/api/events/${eventId}/guests/${guestId}/mark-viewed/`, {})
  },

  // Bulk import guests (DEPRECATED - use guestGroupService.bulkImportToGroup instead)
  async bulkImportGuests(
    eventId: string,
    guests: CreateGuestRequest[],
  ): Promise<ApiResponse<{ created: EventGuest[]; failed: { name: string; error: string }[] }>> {
    return apiClient.post<{ created: EventGuest[]; failed: { name: string; error: string }[] }>(
      `/api/events/${eventId}/guests/bulk-import/`,
      { guests },
    )
  },
}

// Guest Group Service
export const guestGroupService = {
  // List all groups for an event
  async getGroups(eventId: string): Promise<ApiResponse<PaginatedResponse<GuestGroup>>> {
    return apiClient.get<PaginatedResponse<GuestGroup>>(`/api/events/${eventId}/guest-groups/`)
  },

  // Create a new group
  async createGroup(
    eventId: string,
    data: CreateGuestGroupRequest,
  ): Promise<ApiResponse<GuestGroup>> {
    return apiClient.post<GuestGroup>(`/api/events/${eventId}/guest-groups/`, data)
  },

  // Get group details
  async getGroup(eventId: string, groupId: number): Promise<ApiResponse<GuestGroup>> {
    return apiClient.get<GuestGroup>(`/api/events/${eventId}/guest-groups/${groupId}/`)
  },

  // Update group
  async updateGroup(
    eventId: string,
    groupId: number,
    data: Partial<CreateGuestGroupRequest>,
  ): Promise<ApiResponse<GuestGroup>> {
    return apiClient.patch<GuestGroup>(`/api/events/${eventId}/guest-groups/${groupId}/`, data)
  },

  // Delete group (WARNING: Deletes all guests in the group due to CASCADE)
  async deleteGroup(eventId: string, groupId: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/events/${eventId}/guest-groups/${groupId}/`)
  },

  // Get group statistics
  async getGroupStats(eventId: string, groupId: number): Promise<ApiResponse<GuestGroupStats>> {
    return apiClient.get<GuestGroupStats>(`/api/events/${eventId}/guest-groups/${groupId}/stats/`)
  },

  // Invite all guests in group
  async inviteAllInGroup(eventId: string, groupId: number): Promise<ApiResponse<{ sent: number }>> {
    return apiClient.post<{ sent: number }>(
      `/api/events/${eventId}/guest-groups/${groupId}/invite-all/`,
      {},
    )
  },

  // List guests in group
  async getGroupGuests(
    eventId: string,
    groupId: number,
  ): Promise<ApiResponse<PaginatedResponse<EventGuest>>> {
    return apiClient.get<PaginatedResponse<EventGuest>>(
      `/api/events/${eventId}/guest-groups/${groupId}/guests/`,
    )
  },

  // Bulk import guests to group
  async bulkImportToGroup(
    eventId: string,
    groupId: number,
    file: File,
  ): Promise<
    ApiResponse<{
      success: boolean
      message: string
      created: number
      skipped: number
      errors_count: number
      created_guests: Array<{
        id: number
        name: string
        group: string
        showcase_link: string
      }>
      skipped_guests: Array<{ name: string; reason: string }>
      errors: Array<{ name: string; error: string }>
    }>
  > {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('group', groupId.toString())

    return apiClient.postFormData(`/api/events/${eventId}/guests/bulk-import/`, formData)
  },
}
