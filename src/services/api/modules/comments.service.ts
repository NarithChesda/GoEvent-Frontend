/**
 * Comments API Service
 * Handles event comments and feedback
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

  // Create a new comment
  async createComment(eventId: string, commentText: string): Promise<ApiResponse<EventComment>> {
    // Get user ID from auth store
    const authStore = useAuthStore()
    const userId = authStore.user?.id

    const data = {
      event: eventId,
      user: userId,
      comment_text: commentText,
    }

    return apiClient.post<EventComment>('/api/feedback/comments/', data)
  },

  // Update a comment (partial update)
  async updateComment(commentId: number, commentText: string): Promise<ApiResponse<EventComment>> {
    return apiClient.patch<EventComment>(`/api/feedback/comments/${commentId}/`, {
      comment_text: commentText,
    })
  },

  // Delete a comment
  async deleteComment(commentId: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/feedback/comments/${commentId}/`)
  },

  // Check if user has already commented on an event
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
}
