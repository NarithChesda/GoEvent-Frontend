/**
 * Payment Methods API Service
 * Handles event payment methods management
 */

import { apiClient } from '../core/ApiClient'
import type {
  ApiResponse,
  PaginatedResponse,
  EventPaymentMethod,
  CreatePaymentMethodRequest,
  BulkReorderPaymentMethodsRequest,
} from '../types'

export const paymentMethodsService = {
  // List all payment methods for an event
  async getPaymentMethods(
    eventId: string,
  ): Promise<ApiResponse<PaginatedResponse<EventPaymentMethod>>> {
    return apiClient.get<PaginatedResponse<EventPaymentMethod>>(
      `/api/events/${eventId}/payment-methods/`,
    )
  },

  // Get a specific payment method
  async getPaymentMethod(
    eventId: string,
    paymentMethodId: number,
  ): Promise<ApiResponse<EventPaymentMethod>> {
    return apiClient.get<EventPaymentMethod>(
      `/api/events/${eventId}/payment-methods/${paymentMethodId}/`,
    )
  },

  // Create a new payment method
  async createPaymentMethod(
    eventId: string,
    data: CreatePaymentMethodRequest,
  ): Promise<ApiResponse<EventPaymentMethod>> {
    return apiClient.post<EventPaymentMethod>(`/api/events/${eventId}/payment-methods/`, data)
  },

  // Create payment method with file upload (for QR code)
  async createPaymentMethodWithFile(
    eventId: string,
    formData: FormData,
  ): Promise<ApiResponse<EventPaymentMethod>> {
    return apiClient.postFormData<EventPaymentMethod>(
      `/api/events/${eventId}/payment-methods/`,
      formData,
    )
  },

  // Update a payment method (full update)
  async updatePaymentMethod(
    eventId: string,
    paymentMethodId: number,
    data: Partial<CreatePaymentMethodRequest>,
  ): Promise<ApiResponse<EventPaymentMethod>> {
    return apiClient.put<EventPaymentMethod>(
      `/api/events/${eventId}/payment-methods/${paymentMethodId}/`,
      data,
    )
  },

  // Partially update a payment method
  async patchPaymentMethod(
    eventId: string,
    paymentMethodId: number,
    data: Partial<CreatePaymentMethodRequest>,
  ): Promise<ApiResponse<EventPaymentMethod>> {
    return apiClient.patch<EventPaymentMethod>(
      `/api/events/${eventId}/payment-methods/${paymentMethodId}/`,
      data,
    )
  },

  // Update payment method with file upload (for QR code)
  async updatePaymentMethodWithFile(
    eventId: string,
    paymentMethodId: number,
    formData: FormData,
  ): Promise<ApiResponse<EventPaymentMethod>> {
    return apiClient.patchFormData<EventPaymentMethod>(
      `/api/events/${eventId}/payment-methods/${paymentMethodId}/`,
      formData,
    )
  },

  // Delete a payment method
  async deletePaymentMethod(eventId: string, paymentMethodId: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/events/${eventId}/payment-methods/${paymentMethodId}/`)
  },

  // Bulk reorder payment methods
  async bulkReorderPaymentMethods(
    eventId: string,
    data: BulkReorderPaymentMethodsRequest,
  ): Promise<ApiResponse<{ status: string; count: number }>> {
    return apiClient.patch<{ status: string; count: number }>(
      `/api/events/${eventId}/payment-methods/bulk-reorder/`,
      data,
    )
  },
}
