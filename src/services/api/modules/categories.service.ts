/**
 * Event Categories API Service
 * Handles event category management
 */

import { apiClient } from '../core/ApiClient'
import type { ApiResponse, PaginatedResponse, EventCategory } from '../types'

export const eventCategoriesService = {
  async getCategories(): Promise<ApiResponse<PaginatedResponse<EventCategory>>> {
    return apiClient.get<PaginatedResponse<EventCategory>>('/api/core-data/event-categories/')
  },

  async getCategory(id: number): Promise<ApiResponse<EventCategory>> {
    return apiClient.get<EventCategory>(`/api/core-data/event-categories/${id}/`)
  },
}
