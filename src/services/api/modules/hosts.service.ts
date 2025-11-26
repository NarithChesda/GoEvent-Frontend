/**
 * Hosts API Service
 * Handles event host management
 */

import { apiClient } from '../core/ApiClient'
import type {
  ApiResponse,
  PaginatedResponse,
  EventHost,
  CreateHostRequest,
  BulkReorderHostsRequest,
} from '../types'

export const hostsService = {
  // List all hosts for an event
  async getHosts(eventId: string): Promise<ApiResponse<PaginatedResponse<EventHost>>> {
    return apiClient.get<PaginatedResponse<EventHost>>(`/api/events/${eventId}/hosts/`)
  },

  // Get a specific host
  async getHost(eventId: string, hostId: number): Promise<ApiResponse<EventHost>> {
    return apiClient.get<EventHost>(`/api/events/${eventId}/hosts/${hostId}/`)
  },

  // Create a new host
  async createHost(eventId: string, data: CreateHostRequest): Promise<ApiResponse<EventHost>> {
    return apiClient.post<EventHost>(`/api/events/${eventId}/hosts/`, data)
  },

  // Create a new host with file upload
  async createHostWithFile(
    eventId: string,
    data: CreateHostRequest,
    profileImageFile?: File,
  ): Promise<ApiResponse<EventHost>> {
    if (profileImageFile) {
      const formData = new FormData()

      // Add all the host data as form fields
      formData.append('name', data.name)
      if (data.parent_a_name) formData.append('parent_a_name', data.parent_a_name)
      if (data.parent_b_name) formData.append('parent_b_name', data.parent_b_name)
      if (data.title) formData.append('title', data.title)
      if (data.bio) formData.append('bio', data.bio)
      if (data.email) formData.append('email', data.email)
      if (data.linkedin_url) formData.append('linkedin_url', data.linkedin_url)
      if (data.twitter_url) formData.append('twitter_url', data.twitter_url)
      if (data.website_url) formData.append('website_url', data.website_url)
      if (data.order !== undefined) formData.append('order', data.order.toString())

      // Add the profile image file
      formData.append('profile_image', profileImageFile)

      // Add translations as JSON string if they exist
      if (data.translations && data.translations.length > 0) {
        formData.append('translations', JSON.stringify(data.translations))
      }

      return apiClient.postFormData<EventHost>(`/api/events/${eventId}/hosts/`, formData)
    } else {
      return apiClient.post<EventHost>(`/api/events/${eventId}/hosts/`, data)
    }
  },

  // Update a host (full update)
  async updateHost(
    eventId: string,
    hostId: number,
    data: Partial<CreateHostRequest>,
  ): Promise<ApiResponse<EventHost>> {
    return apiClient.put<EventHost>(`/api/events/${eventId}/hosts/${hostId}/`, data)
  },

  // Update a host with file upload
  // Use removeImage=true to explicitly remove the existing image
  async updateHostWithFile(
    eventId: string,
    hostId: number,
    data: Partial<CreateHostRequest>,
    profileImageFile?: File,
    removeImage = false,
  ): Promise<ApiResponse<EventHost>> {
    // Always use FormData when this method is called
    const formData = new FormData()

    // Add all the host data as form fields
    if (data.name) formData.append('name', data.name)
    if (data.parent_a_name !== undefined) formData.append('parent_a_name', data.parent_a_name)
    if (data.parent_b_name !== undefined) formData.append('parent_b_name', data.parent_b_name)
    if (data.title !== undefined) formData.append('title', data.title)
    if (data.bio !== undefined) formData.append('bio', data.bio)
    if (data.email !== undefined) formData.append('email', data.email)
    if (data.linkedin_url !== undefined) formData.append('linkedin_url', data.linkedin_url)
    if (data.twitter_url !== undefined) formData.append('twitter_url', data.twitter_url)
    if (data.website_url !== undefined) formData.append('website_url', data.website_url)
    if (data.order !== undefined) formData.append('order', data.order.toString())

    // Handle profile image - only append if there's a new file or explicit removal
    if (profileImageFile) {
      formData.append('profile_image', profileImageFile)
    } else if (removeImage) {
      // Only send empty string when explicitly removing the image
      formData.append('profile_image', '')
    }
    // If neither, don't append profile_image at all - keeps existing image

    // Add translations as JSON string if they exist
    if (data.translations && data.translations.length > 0) {
      formData.append('translations', JSON.stringify(data.translations))
    }

    return apiClient.patchFormData<EventHost>(`/api/events/${eventId}/hosts/${hostId}/`, formData)
  },

  // Partially update a host
  async patchHost(
    eventId: string,
    hostId: number,
    data: Partial<CreateHostRequest>,
  ): Promise<ApiResponse<EventHost>> {
    return apiClient.patch<EventHost>(`/api/events/${eventId}/hosts/${hostId}/`, data)
  },

  // Delete a host
  async deleteHost(eventId: string, hostId: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/events/${eventId}/hosts/${hostId}/`)
  },

  // Bulk reorder hosts
  async bulkReorderHosts(
    eventId: string,
    data: BulkReorderHostsRequest,
  ): Promise<ApiResponse<{ status: string; count: number }>> {
    return apiClient.patch<{ status: string; count: number }>(
      `/api/events/${eventId}/hosts/bulk-reorder/`,
      data,
    )
  },
}
