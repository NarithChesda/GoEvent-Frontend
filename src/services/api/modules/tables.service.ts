/**
 * Table Seating API Service
 * Handles event seating table management (drag-and-drop seating board)
 */

import { apiClient } from '../core/ApiClient'
import type {
  ApiResponse,
  PaginatedResponse,
  EventTable,
  CreateTableRequest,
  UpdateTableRequest,
  TableListFilters,
  BulkReorderTablesRequest,
} from '../types'

export const tablesService = {
  // List all tables for an event (each includes its seated guests)
  async getTables(
    eventId: string,
    filters?: TableListFilters,
  ): Promise<ApiResponse<PaginatedResponse<EventTable>>> {
    return apiClient.get<PaginatedResponse<EventTable>>(`/api/events/${eventId}/tables/`, filters)
  },

  // Get a specific table
  async getTable(eventId: string, tableId: number): Promise<ApiResponse<EventTable>> {
    return apiClient.get<EventTable>(`/api/events/${eventId}/tables/${tableId}/`)
  },

  // Create a new table
  async createTable(eventId: string, data: CreateTableRequest): Promise<ApiResponse<EventTable>> {
    return apiClient.post<EventTable>(`/api/events/${eventId}/tables/`, data)
  },

  // Partially update a table (name, capacity, color, notes, order)
  async updateTable(
    eventId: string,
    tableId: number,
    data: UpdateTableRequest,
  ): Promise<ApiResponse<EventTable>> {
    return apiClient.patch<EventTable>(`/api/events/${eventId}/tables/${tableId}/`, data)
  },

  // Delete a table (guests seated there are set back to unassigned)
  async deleteTable(eventId: string, tableId: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/events/${eventId}/tables/${tableId}/`)
  },

  // Bulk reorder tables on the seating board
  async bulkReorderTables(
    eventId: string,
    data: BulkReorderTablesRequest,
  ): Promise<ApiResponse<{ status: string; count: number }>> {
    return apiClient.patch<{ status: string; count: number }>(
      `/api/events/${eventId}/tables/bulk-reorder/`,
      data,
    )
  },
}
