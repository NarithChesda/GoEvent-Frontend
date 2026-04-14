/**
 * Comments API Service
 * Handles event comments and feedback.
 *
 * Auth model is privacy-partitioned:
 *  - public events  → JWT only (Authorization header injected by ApiClient)
 *  - private events → guest_shortcode in body (no JWT required)
 *
 * Listings (GET) are public. Writes (POST/PATCH/DELETE) require one credential.
 */

import { apiClient } from '../core/ApiClient'
import type {
  ApiResponse,
  PaginatedResponse,
  EventComment,
  CommentFilters,
} from '../types'
import { useAuthStore } from '@/stores/auth'

export const commentsService = {
  // List all comments (with optional filtering)
  async getComments(
    filters?: CommentFilters,
  ): Promise<ApiResponse<PaginatedResponse<EventComment>>> {
    return apiClient.get<PaginatedResponse<EventComment>>('/api/feedback/comments/', filters)
  },

  // Get comments for a specific event
  async getEventComments(
    eventId: string,
    page?: number,
    pageSize?: number,
  ): Promise<ApiResponse<PaginatedResponse<EventComment>>> {
    const params: CommentFilters = {
      event: eventId,
      page: page || 1,
      page_size: pageSize || 20,
    }
    return apiClient.get<PaginatedResponse<EventComment>>('/api/feedback/comments/', params)
  },

  // Get a specific comment
  async getComment(commentId: number): Promise<ApiResponse<EventComment>> {
    return apiClient.get<EventComment>(`/api/feedback/comments/${commentId}/`)
  },

  /**
   * Create a comment.
   * Pass `guestShortcode` for guests on private events. The backend's
   * privacy partition ensures the right credential wins:
   *   - private event → shortcode wins (JWT ignored)
   *   - public event  → JWT wins (shortcode silently ignored)
   */
  async createComment(
    eventId: string,
    commentText: string,
    guestShortcode?: string | null,
  ): Promise<ApiResponse<EventComment>> {
    const data: Record<string, string> = {
      event: eventId,
      comment_text: commentText,
    }
    if (guestShortcode) {
      data.guest_shortcode = guestShortcode
    }
    return apiClient.post<EventComment>('/api/feedback/comments/', data)
  },

  // Update a comment (partial update). Guest comments must re-send the shortcode.
  async updateComment(
    commentId: number,
    commentText: string,
    guestShortcode?: string | null,
  ): Promise<ApiResponse<EventComment>> {
    const data: Record<string, string> = { comment_text: commentText }
    if (guestShortcode) {
      data.guest_shortcode = guestShortcode
    }
    return apiClient.patch<EventComment>(`/api/feedback/comments/${commentId}/`, data)
  },

  // Delete a comment. Guest comments must re-send the shortcode in the body.
  async deleteComment(
    commentId: number,
    guestShortcode?: string | null,
  ): Promise<ApiResponse<void>> {
    const body = guestShortcode ? { guest_shortcode: guestShortcode } : undefined
    return apiClient.delete(`/api/feedback/comments/${commentId}/`, body)
  },

  // Check if the logged-in user has already commented on an event.
  // Only meaningful for public events (private events use the guest channel).
  async hasUserCommented(eventId: string): Promise<boolean> {
    const response = await this.getEventComments(eventId)

    if (!response.success || !response.data) {
      console.warn('Failed to check if user commented:', response.message)
      return false
    }

    const authStore = useAuthStore()
    const userId = authStore.user?.id

    if (!userId) {
      return false
    }

    return response.data.results.some((comment) => comment.user === userId)
  },

  // Check if the guest identified by `guestShortcode` (via stored guest name)
  // has already commented on this event. We compare by guest_info.name because
  // the shortcode itself is write-only and never echoed back in responses.
  async hasGuestCommented(eventId: string, guestName: string): Promise<boolean> {
    if (!guestName) return false
    const response = await this.getEventComments(eventId)

    if (!response.success || !response.data) {
      return false
    }

    return response.data.results.some(
      (comment) => comment.guest_info?.name === guestName,
    )
  },
}
