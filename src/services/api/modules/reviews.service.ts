/**
 * Reviews API Service
 * Handles event organizer platform reviews (feedback about GoEvent hosting experience)
 */

import { apiClient } from '../core/ApiClient'
import type {
  ApiResponse,
  PaginatedResponse,
} from '../types/api.types'
import type {
  EventReview,
  CreateReviewRequest,
  UpdateReviewRequest,
  ReviewFilters,
} from '../types/review.types'

export const reviewsService = {
  /**
   * List all reviews (authenticated users only)
   * @param filters - Optional filters for pagination and event filtering
   * @returns Paginated list of reviews
   */
  async getReviews(
    filters?: ReviewFilters,
  ): Promise<ApiResponse<PaginatedResponse<EventReview>>> {
    return apiClient.get<PaginatedResponse<EventReview>>('/api/feedback/reviews/', filters)
  },

  /**
   * Get reviews for a specific event
   * @param eventId - Event UUID
   * @param page - Page number (default: 1)
   * @param pageSize - Results per page (default: 20)
   * @returns Paginated list of reviews for the event
   */
  async getEventReviews(
    eventId: string,
    page?: number,
    pageSize?: number,
  ): Promise<ApiResponse<PaginatedResponse<EventReview>>> {
    const params: ReviewFilters = {
      event: eventId,
      page: page || 1,
      page_size: pageSize || 20,
    }
    return apiClient.get<PaginatedResponse<EventReview>>('/api/feedback/reviews/', params)
  },

  /**
   * Get a specific review by ID
   * @param reviewId - Review ID
   * @returns Review details
   */
  async getReview(reviewId: number): Promise<ApiResponse<EventReview>> {
    return apiClient.get<EventReview>(`/api/feedback/reviews/${reviewId}/`)
  },

  /**
   * Create a new review (organizer only)
   * @param data - Review data (event, rating, review_text)
   * @returns Created review
   */
  async createReview(data: CreateReviewRequest): Promise<ApiResponse<EventReview>> {
    // User field is auto-set by backend from authenticated request
    return apiClient.post<EventReview>('/api/feedback/reviews/', data)
  },

  /**
   * Update an existing review (owner only)
   * @param reviewId - Review ID
   * @param data - Partial review data to update
   * @returns Updated review
   */
  async updateReview(
    reviewId: number,
    data: UpdateReviewRequest,
  ): Promise<ApiResponse<EventReview>> {
    return apiClient.patch<EventReview>(`/api/feedback/reviews/${reviewId}/`, data)
  },

  /**
   * Delete a review (owner only)
   * @param reviewId - Review ID
   * @returns Success response
   */
  async deleteReview(reviewId: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/feedback/reviews/${reviewId}/`)
  },

  /**
   * Check if a specific user has already reviewed this event
   * @param eventId - Event UUID
   * @param userId - User ID to check
   * @returns True if user has reviewed, false otherwise
   */
  async hasUserReviewed(eventId: string, userId: number): Promise<boolean> {
    const response = await this.getEventReviews(eventId)

    if (!response.success || !response.data) {
      console.warn('Failed to check if user reviewed:', response.message)
      return false
    }

    // Check if any review belongs to specified user
    return response.data.results.some((review) => review.user === userId)
  },

  /**
   * Get a specific user's review for an event (if exists)
   * @param eventId - Event UUID
   * @param userId - User ID to find review for
   * @returns User's review or null
   */
  async getUserReview(eventId: string, userId: number): Promise<EventReview | null> {
    const response = await this.getEventReviews(eventId)

    if (!response.success || !response.data) {
      return null
    }

    // Find user's review
    const userReview = response.data.results.find((review) => review.user === userId)
    return userReview || null
  },
}
