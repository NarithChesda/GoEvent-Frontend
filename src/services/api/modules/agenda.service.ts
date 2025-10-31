/**
 * Agenda API Service
 * Handles event agenda item management
 */

import { apiClient } from '../core/ApiClient'
import type {
  ApiResponse,
  PaginatedResponse,
  EventAgendaItem,
  CreateAgendaRequest,
  BulkReorderRequest,
} from '../types'

export const agendaService = {
  // List all agenda items for an event
  async getAgendaItems(eventId: string): Promise<ApiResponse<PaginatedResponse<EventAgendaItem>>> {
    return apiClient.get<PaginatedResponse<EventAgendaItem>>(`/api/events/${eventId}/agenda/`)
  },

  // Get a specific agenda item
  async getAgendaItem(eventId: string, agendaId: number): Promise<ApiResponse<EventAgendaItem>> {
    return apiClient.get<EventAgendaItem>(`/api/events/${eventId}/agenda/${agendaId}/`)
  },

  // Create a new agenda item
  async createAgendaItem(
    eventId: string,
    data: CreateAgendaRequest,
  ): Promise<ApiResponse<EventAgendaItem>> {
    return apiClient.post<EventAgendaItem>(`/api/events/${eventId}/agenda/`, data)
  },

  // Update an agenda item (full update)
  async updateAgendaItem(
    eventId: string,
    agendaId: number,
    data: Partial<CreateAgendaRequest>,
  ): Promise<ApiResponse<EventAgendaItem>> {
    return apiClient.put<EventAgendaItem>(`/api/events/${eventId}/agenda/${agendaId}/`, data)
  },

  // Partially update an agenda item
  async patchAgendaItem(
    eventId: string,
    agendaId: number,
    data: Partial<CreateAgendaRequest>,
  ): Promise<ApiResponse<EventAgendaItem>> {
    return apiClient.patch<EventAgendaItem>(`/api/events/${eventId}/agenda/${agendaId}/`, data)
  },

  // Delete an agenda item
  async deleteAgendaItem(eventId: string, agendaId: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/events/${eventId}/agenda/${agendaId}/`)
  },

  // Bulk reorder agenda items
  async bulkReorderAgendaItems(
    eventId: string,
    data: BulkReorderRequest,
  ): Promise<ApiResponse<{ status: string; count: number }>> {
    return apiClient.patch<{ status: string; count: number }>(
      `/api/events/${eventId}/agenda/bulk-reorder/`,
      data,
    )
  },
}
