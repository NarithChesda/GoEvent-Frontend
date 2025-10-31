/**
 * Core Data API Service
 * Handles icons, team members, and other core data
 */

import { apiClient } from '../core/ApiClient'
import type {
  ApiResponse,
  PaginatedResponse,
  AgendaIcon,
  TeamMember,
  UserDetails,
} from '../types'

// Core Data Service
export const coreDataService = {
  // Get available icons
  async getIcons(): Promise<ApiResponse<AgendaIcon[]>> {
    const response = await apiClient.get<{ results: AgendaIcon[] }>('/api/core-data/custom-icons/')
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.results,
      }
    }
    return {
      success: false,
      message: response.message,
    }
  },
}

// Team Members Service
export const teamMembersService = {
  async getTeamMembers(): Promise<ApiResponse<PaginatedResponse<TeamMember>>> {
    return apiClient.get<PaginatedResponse<TeamMember>>('/api/core-data/team-members/')
  },

  async getTeamMember(id: number): Promise<ApiResponse<TeamMember>> {
    return apiClient.get<TeamMember>(`/api/core-data/team-members/${id}/`)
  },
}

// User Details Service
export const userService = {
  // Simple cache to avoid repeated API calls for the same user
  userCache: new Map<number, { data: UserDetails; timestamp: number }>(),

  // Cache duration: 5 minutes
  CACHE_DURATION: 5 * 60 * 1000,

  // Try to get user details from potential /api/users/ endpoint
  async getUserDetails(userId: number): Promise<UserDetails | null> {
    // Check cache first
    const cached = this.userCache.get(userId)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }

    // Try to fetch user details from a potential users API
    const response = await apiClient.get<UserDetails>(`/api/users/${userId}/`)

    if (!response.success || !response.data) {
      // If the API doesn't exist or fails, silently fail
      console.debug('Failed to fetch user details for user', userId, '- API might not be available')
      return null
    }

    const userDetails = {
      username: response.data.username,
      first_name: response.data.first_name,
      last_name: response.data.last_name,
      profile_picture: response.data.profile_picture,
    }

    // Cache the result
    this.userCache.set(userId, {
      data: userDetails,
      timestamp: Date.now(),
    })

    return userDetails
  },

  // Clear cache (useful for testing or when needed)
  clearCache() {
    this.userCache.clear()
  },
}
