/**
 * Dress Code API Service
 * Handles event dress code guidelines management
 */

import { apiClient } from '../core/ApiClient'
import type { ApiResponse, PaginatedResponse } from '../types'
import type {
  EventDressCode,
  CreateDressCodeRequest,
  UpdateDressCodeRequest,
  BulkReorderDressCodesRequest,
  DressCodeFilters,
} from '../types/dress-code.types'

export const dressCodeService = {
  /**
   * List all dress codes for an event with optional filtering
   */
  async getDressCodes(
    eventId: string,
    filters?: DressCodeFilters,
  ): Promise<ApiResponse<PaginatedResponse<EventDressCode>>> {
    const params: Record<string, string> = {}

    if (filters?.dress_code_type) params.dress_code_type = filters.dress_code_type
    if (filters?.time_period) params.time_period = filters.time_period
    if (filters?.gender) params.gender = filters.gender
    if (filters?.is_active !== undefined) params.is_active = String(filters.is_active)
    if (filters?.search) params.search = filters.search
    if (filters?.ordering) params.ordering = filters.ordering

    return apiClient.get<PaginatedResponse<EventDressCode>>(
      `/api/events/${eventId}/dress-codes/`,
      params,
    )
  },

  /**
   * Get a single dress code by ID
   */
  async getDressCode(eventId: string, dressCodeId: number): Promise<ApiResponse<EventDressCode>> {
    return apiClient.get<EventDressCode>(`/api/events/${eventId}/dress-codes/${dressCodeId}/`)
  },

  /**
   * Create a new dress code (with or without image)
   */
  async createDressCode(
    eventId: string,
    data: CreateDressCodeRequest,
  ): Promise<ApiResponse<EventDressCode>> {
    // If there's an image, use FormData
    if (data.image) {
      const formData = new FormData()
      formData.append('dress_code_type', data.dress_code_type)
      formData.append('time_period', data.time_period)
      formData.append('gender', data.gender)

      if (data.title) formData.append('title', data.title)
      if (data.description) formData.append('description', data.description)
      if (data.color) formData.append('color', data.color)
      if (data.order !== undefined) formData.append('order', data.order.toString())
      if (data.is_active !== undefined) formData.append('is_active', data.is_active.toString())
      formData.append('image', data.image)

      return apiClient.postFormData<EventDressCode>(
        `/api/events/${eventId}/dress-codes/`,
        formData,
      )
    }

    // Otherwise, use JSON
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { image, ...jsonData } = data
    return apiClient.post<EventDressCode>(`/api/events/${eventId}/dress-codes/`, jsonData)
  },

  /**
   * Update a dress code (partial update with PATCH)
   */
  async updateDressCode(
    eventId: string,
    dressCodeId: number,
    data: UpdateDressCodeRequest,
  ): Promise<ApiResponse<EventDressCode>> {
    // If there's an image file or we need to explicitly handle image, use FormData
    if (data.image instanceof File || data.image === null) {
      const formData = new FormData()

      if (data.dress_code_type) formData.append('dress_code_type', data.dress_code_type)
      if (data.time_period) formData.append('time_period', data.time_period)
      if (data.gender) formData.append('gender', data.gender)
      if (data.title !== undefined) formData.append('title', data.title)
      if (data.description !== undefined) formData.append('description', data.description)
      if (data.color !== undefined) formData.append('color', data.color)
      if (data.order !== undefined) formData.append('order', data.order.toString())
      if (data.is_active !== undefined) formData.append('is_active', data.is_active.toString())

      // If image is null, send empty string to remove it
      // If image is a File, append it
      if (data.image === null) {
        formData.append('image', '')
      } else if (data.image instanceof File) {
        formData.append('image', data.image)
      }

      return apiClient.patchFormData<EventDressCode>(
        `/api/events/${eventId}/dress-codes/${dressCodeId}/`,
        formData,
      )
    }

    // Otherwise, use JSON
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { image, ...jsonData } = data
    return apiClient.patch<EventDressCode>(
      `/api/events/${eventId}/dress-codes/${dressCodeId}/`,
      jsonData,
    )
  },

  /**
   * Delete a dress code
   */
  async deleteDressCode(eventId: string, dressCodeId: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/events/${eventId}/dress-codes/${dressCodeId}/`)
  },

  /**
   * Bulk reorder dress codes
   */
  async bulkReorderDressCodes(
    eventId: string,
    data: BulkReorderDressCodesRequest,
  ): Promise<ApiResponse<{ status: string; count: number }>> {
    return apiClient.patch<{ status: string; count: number }>(
      `/api/events/${eventId}/dress-codes/bulk-reorder/`,
      data,
    )
  },
}
