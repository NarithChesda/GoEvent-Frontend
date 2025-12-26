/**
 * Donation API Service
 * Handles cash and item donations for events with fundraising enabled
 */

import { apiClient } from '../core/ApiClient'
import type {
  ApiResponse,
  PaginatedResponse,
  EventDonation,
  UserDonation,
  DonationFilters,
  FundraisingProgress,
  VerifyDonationRequest,
  VerifyDonationResponse,
  CreateDonationRequest,
  UpdateDonationRequest,
  DonationItemCategory,
  CreateDonationItemCategoryRequest,
  DonationCategorySummary,
} from '../types'

/**
 * Donation service for managing event donations
 * Supports both cash and item (in-kind) donations
 */
export const donationService = {
  // ============================================================================
  // DONATIONS CRUD
  // ============================================================================

  /**
   * List all donations for an event with optional filtering
   * @param eventId - The event UUID
   * @param filters - Optional filters (status, donation_type, ordering, etc.)
   */
  async getDonations(
    eventId: string,
    filters?: DonationFilters,
  ): Promise<ApiResponse<PaginatedResponse<EventDonation>>> {
    return apiClient.get<PaginatedResponse<EventDonation>>(
      `/api/events/${eventId}/donations/`,
      filters,
    )
  },

  /**
   * Get a specific donation by ID
   * @param eventId - The event UUID
   * @param donationId - The donation ID
   */
  async getDonation(
    eventId: string,
    donationId: number,
  ): Promise<ApiResponse<EventDonation>> {
    return apiClient.get<EventDonation>(
      `/api/events/${eventId}/donations/${donationId}/`,
    )
  },

  /**
   * Get current user's donations across all events
   * @param filters - Optional filters (status, donation_type, ordering, etc.)
   */
  async getMyDonations(
    filters?: DonationFilters,
  ): Promise<ApiResponse<PaginatedResponse<UserDonation>>> {
    return apiClient.get<PaginatedResponse<UserDonation>>(
      `/api/events/my-donations/`,
      filters,
    )
  },

  /**
   * Create a new donation (cash or item)
   * @param eventId - The event UUID
   * @param data - Donation data (CreateCashDonationRequest or CreateItemDonationRequest)
   * @param receiptFile - Optional receipt image file
   */
  async createDonation(
    eventId: string,
    data: CreateDonationRequest,
    receiptFile?: File,
  ): Promise<ApiResponse<EventDonation>> {
    if (receiptFile) {
      // Use FormData for file upload
      const formData = new FormData()

      // Add all donation fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })

      formData.append('receipt_image', receiptFile)

      return apiClient.postFormData<EventDonation>(
        `/api/events/${eventId}/donations/`,
        formData,
      )
    }

    return apiClient.post<EventDonation>(
      `/api/events/${eventId}/donations/`,
      data,
    )
  },

  /**
   * Update a pending donation
   * @param eventId - The event UUID
   * @param donationId - The donation ID
   * @param data - Partial donation data to update
   * @param receiptFile - Optional new receipt image file
   */
  async updateDonation(
    eventId: string,
    donationId: number,
    data: UpdateDonationRequest,
    receiptFile?: File,
  ): Promise<ApiResponse<EventDonation>> {
    if (receiptFile) {
      const formData = new FormData()

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })

      formData.append('receipt_image', receiptFile)

      return apiClient.patchFormData<EventDonation>(
        `/api/events/${eventId}/donations/${donationId}/`,
        formData,
      )
    }

    return apiClient.patch<EventDonation>(
      `/api/events/${eventId}/donations/${donationId}/`,
      data,
    )
  },

  /**
   * Delete a pending donation
   * @param eventId - The event UUID
   * @param donationId - The donation ID
   */
  async deleteDonation(
    eventId: string,
    donationId: number,
  ): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/events/${eventId}/donations/${donationId}/`)
  },

  // ============================================================================
  // VERIFICATION ACTIONS
  // ============================================================================

  /**
   * Verify a pending donation (mark as verified)
   * @param eventId - The event UUID
   * @param donationId - The donation ID
   */
  async verifyDonation(
    eventId: string,
    donationId: number,
  ): Promise<ApiResponse<VerifyDonationResponse>> {
    const request: VerifyDonationRequest = { action: 'verify' }
    return apiClient.post<VerifyDonationResponse>(
      `/api/events/${eventId}/donations/${donationId}/verify/`,
      request,
    )
  },

  /**
   * Reject a pending donation with a reason
   * @param eventId - The event UUID
   * @param donationId - The donation ID
   * @param reason - The rejection reason to provide to the donor
   */
  async rejectDonation(
    eventId: string,
    donationId: number,
    reason: string,
  ): Promise<ApiResponse<VerifyDonationResponse>> {
    const request: VerifyDonationRequest = {
      action: 'reject',
      rejection_reason: reason,
    }
    return apiClient.post<VerifyDonationResponse>(
      `/api/events/${eventId}/donations/${donationId}/verify/`,
      request,
    )
  },

  // ============================================================================
  // PROGRESS & STATS
  // ============================================================================

  /**
   * Get fundraising progress for an event
   * Includes goal, total raised, donor count, percentage, and recent donations
   * @param eventId - The event UUID
   */
  async getFundraisingProgress(
    eventId: string,
  ): Promise<ApiResponse<FundraisingProgress>> {
    return apiClient.get<FundraisingProgress>(
      `/api/events/${eventId}/donations/progress/`,
    )
  },

  // ============================================================================
  // ITEM CATEGORIES (for in-kind donations)
  // ============================================================================

  /**
   * List all donation item categories for an event
   * @param eventId - The event UUID
   * @param params - Optional query params (ordering, is_active)
   */
  async getItemCategories(
    eventId: string,
    params?: { ordering?: string; is_active?: boolean },
  ): Promise<ApiResponse<PaginatedResponse<DonationItemCategory>>> {
    return apiClient.get<PaginatedResponse<DonationItemCategory>>(
      `/api/events/${eventId}/donation-categories/`,
      params,
    )
  },

  /**
   * Get a specific item category
   * @param eventId - The event UUID
   * @param categoryId - The category ID
   */
  async getItemCategory(
    eventId: string,
    categoryId: number,
  ): Promise<ApiResponse<DonationItemCategory>> {
    return apiClient.get<DonationItemCategory>(
      `/api/events/${eventId}/donation-categories/${categoryId}/`,
    )
  },

  /**
   * Create a new item category
   * @param eventId - The event UUID
   * @param data - Category data
   */
  async createItemCategory(
    eventId: string,
    data: CreateDonationItemCategoryRequest,
  ): Promise<ApiResponse<DonationItemCategory>> {
    return apiClient.post<DonationItemCategory>(
      `/api/events/${eventId}/donation-categories/`,
      data,
    )
  },

  /**
   * Update an item category
   * @param eventId - The event UUID
   * @param categoryId - The category ID
   * @param data - Partial category data to update
   */
  async updateItemCategory(
    eventId: string,
    categoryId: number,
    data: Partial<CreateDonationItemCategoryRequest>,
  ): Promise<ApiResponse<DonationItemCategory>> {
    return apiClient.patch<DonationItemCategory>(
      `/api/events/${eventId}/donation-categories/${categoryId}/`,
      data,
    )
  },

  /**
   * Delete an item category
   * @param eventId - The event UUID
   * @param categoryId - The category ID
   */
  async deleteItemCategory(
    eventId: string,
    categoryId: number,
  ): Promise<ApiResponse<void>> {
    return apiClient.delete(
      `/api/events/${eventId}/donation-categories/${categoryId}/`,
    )
  },

  /**
   * Get summary of all item categories with donation stats
   * @param eventId - The event UUID
   */
  async getItemCategorySummary(
    eventId: string,
  ): Promise<ApiResponse<DonationCategorySummary>> {
    return apiClient.get<DonationCategorySummary>(
      `/api/events/${eventId}/donation-categories/summary/`,
    )
  },

  /**
   * Reorder item categories
   * @param eventId - The event UUID
   * @param categoryIds - Array of category IDs in the desired order
   */
  async reorderItemCategories(
    eventId: string,
    categoryIds: number[],
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(
      `/api/events/${eventId}/donation-categories/reorder/`,
      { category_ids: categoryIds },
    )
  },
}
