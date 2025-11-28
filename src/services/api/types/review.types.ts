/**
 * Review API Type Definitions
 * Types for event organizer platform reviews
 */

import type { UserDetails } from './core-data.types'

/**
 * Event Review (Organizer Platform Feedback)
 * Allows event organizers to rate their experience hosting events on GoEvent
 */
export interface EventReview {
  id: number
  event: string // Event UUID
  user: number // User ID (organizer)
  rating: number // 1-5 stars
  review_text: string // Detailed feedback about platform experience
  created_at: string // ISO timestamp
  user_info: UserDetails // Organizer details
}

/**
 * Create Review Request
 */
export interface CreateReviewRequest {
  event: string // Event UUID
  rating: number // 1-5 stars
  review_text: string // Review content
}

/**
 * Update Review Request
 */
export interface UpdateReviewRequest {
  rating?: number // Optional: 1-5 stars
  review_text?: string // Optional: Updated review content
}

/**
 * Review Filters for querying reviews
 */
export interface ReviewFilters {
  event?: string // Filter by event UUID
  page?: number // Page number for pagination
  page_size?: number // Results per page (default: 20)
  [key: string]: string | number | boolean | null | undefined // Index signature for QueryParams compatibility
}
