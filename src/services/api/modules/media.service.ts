/**
 * Media API Service
 * Handles event photo/media uploads and management
 */

import { apiClient } from '../core/ApiClient'
import type { ApiResponse, PaginatedResponse, EventPhoto } from '../types'

export const mediaService = {
  // List all media/photos for an event
  async getEventMedia(eventId: string): Promise<ApiResponse<PaginatedResponse<EventPhoto>>> {
    return apiClient.get<PaginatedResponse<EventPhoto>>(`/api/events/${eventId}/photos/`)
  },

  // Upload new media/photo
  async uploadEventMedia(
    eventId: string,
    file: File,
    mediaData: { caption?: string; order?: number; is_featured?: boolean },
    options?: { onProgress?: (progress: number) => void }
  ): Promise<ApiResponse<EventPhoto>> {
    const formData = new FormData()
    formData.append('image', file)

    if (mediaData.caption) formData.append('caption', mediaData.caption)
    if (mediaData.order !== undefined) formData.append('order', mediaData.order.toString())
    if (mediaData.is_featured !== undefined)
      formData.append('is_featured', mediaData.is_featured.toString())

    return apiClient.uploadFile<EventPhoto>(
      `/api/events/${eventId}/photos/`,
      formData,
      options
    )
  },

  // Bulk upload multiple photos (up to 50 per request)
  async bulkUploadEventMedia(
    eventId: string,
    files: File[],
    options?: {
      captions?: string[]
      onProgress?: (progress: number) => void
    },
  ): Promise<
    ApiResponse<{
      status: string
      count: number
      photos: EventPhoto[]
    }>
  > {
    const additionalFields: Record<string, string[]> = {}

    if (options?.captions && options.captions.length > 0) {
      additionalFields.captions = options.captions
    }

    const result = await apiClient.bulkUploadFiles<{
      status: string
      count: number
      photos: EventPhoto[]
    }>(
      `/api/events/${eventId}/photos/bulk-upload/`,
      files,
      {
        fieldName: 'images', // Backend expects 'images' field
        additionalFields,
        onProgress: options?.onProgress,
      }
    )

    // Convert relative image URLs to full URLs
    if (result.success && result.data?.photos) {
      result.data.photos = result.data.photos.map((photo) => ({
        ...photo,
        image: apiClient.getProfilePictureUrl(photo.image) || photo.image,
      }))
    }

    return result
  },

  // Update media/photo
  async updateEventMedia(
    eventId: string,
    mediaId: number,
    data: Partial<EventPhoto>,
  ): Promise<ApiResponse<EventPhoto>> {
    return apiClient.patch<EventPhoto>(`/api/events/${eventId}/photos/${mediaId}/`, data)
  },

  // Delete media/photo
  async deleteEventMedia(eventId: string, mediaId: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/events/${eventId}/photos/${mediaId}/`)
  },

  // Bulk reorder media/photos
  async bulkReorderEventMedia(
    eventId: string,
    data: { updates: { id: number; order: number }[] },
  ): Promise<ApiResponse<{ status: string; count: number }>> {
    return apiClient.patch<{ status: string; count: number }>(
      `/api/events/${eventId}/photos/bulk-reorder/`,
      data,
    )
  },
}
