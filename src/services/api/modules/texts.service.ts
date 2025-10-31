/**
 * Event Texts API Service
 * Handles multi-language event text content
 */

import { apiClient } from '../core/ApiClient'
import type {
  ApiResponse,
  PaginatedResponse,
  EventText,
  CreateEventTextRequest,
} from '../types'

export const eventTextsService = {
  // List all texts for an event
  async getEventTexts(eventId: string): Promise<ApiResponse<PaginatedResponse<EventText>>> {
    return apiClient.get<PaginatedResponse<EventText>>(`/api/events/${eventId}/texts/`)
  },

  // Get a specific text
  async getEventText(eventId: string, textId: number): Promise<ApiResponse<EventText>> {
    return apiClient.get<EventText>(`/api/events/${eventId}/texts/${textId}/`)
  },

  // Create a new text
  async createEventText(
    eventId: string,
    data: CreateEventTextRequest,
  ): Promise<ApiResponse<EventText>> {
    return apiClient.post<EventText>(`/api/events/${eventId}/texts/`, data)
  },

  // Update a text (full update)
  async updateEventText(
    eventId: string,
    textId: number,
    data: Partial<CreateEventTextRequest>,
  ): Promise<ApiResponse<EventText>> {
    return apiClient.put<EventText>(`/api/events/${eventId}/texts/${textId}/`, data)
  },

  // Partially update a text
  async patchEventText(
    eventId: string,
    textId: number,
    data: Partial<CreateEventTextRequest>,
  ): Promise<ApiResponse<EventText>> {
    return apiClient.patch<EventText>(`/api/events/${eventId}/texts/${textId}/`, data)
  },

  // Delete a text
  async deleteEventText(eventId: string, textId: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/events/${eventId}/texts/${textId}/`)
  },
}
