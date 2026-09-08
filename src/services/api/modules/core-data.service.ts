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
  BackgroundMusicFilters,
  BackgroundMusicCategoryInfo,
  BackgroundMusicPaginatedResponse,
} from '../types'

// Core Data Service
export const coreDataService = {
  /**
   * The whole icon library, artwork included.
   *
   * `include_svg=1` is not optional: without it the endpoint answers
   * `{id, name, uploaded_at}` and every icon renders blank. It is the only way
   * to get `svg_code` now that agenda items carry a reference rather than the
   * drawing.
   *
   * Fetched with `getPublic` — no Authorization header — because the response
   * is byte-identical for every caller and comes back
   * `Cache-Control: public, max-age=300, s-maxage=3600`. That is the whole
   * win: one edge-cached ~394KB request shared across every visitor and every
   * event, instead of the same drawings re-sent inside each agenda payload.
   * The reads are open to anyone, so a guest on a showcase resolves icons the
   * same way an organizer does.
   *
   * Call this through `useIconLibraryStore` rather than directly — the store
   * is what keeps it to one request per app.
   */
  async getIcons(): Promise<ApiResponse<AgendaIcon[]>> {
    const response = await apiClient.getPublic<{ results: AgendaIcon[] }>(
      '/api/core-data/custom-icons/',
      { include_svg: 1 },
    )
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

// Background Music Service
export const backgroundMusicService = {
  /**
   * Get background music tracks with infinite scroll pagination
   * This is a public endpoint - no authentication required
   *
   * @param filters - Optional filters including limit, offset, category, search
   * @returns Paginated response with has_more flag for infinite scroll
   */
  async getBackgroundMusic(
    filters?: BackgroundMusicFilters
  ): Promise<ApiResponse<BackgroundMusicPaginatedResponse>> {
    const params = new URLSearchParams()

    // Pagination params
    if (filters?.limit !== undefined) {
      params.append('limit', String(filters.limit))
    }
    if (filters?.offset !== undefined) {
      params.append('offset', String(filters.offset))
    }

    // Filter params
    if (filters?.category) {
      params.append('category', filters.category)
    }
    if (filters?.is_active !== undefined) {
      params.append('is_active', String(filters.is_active))
    }
    if (filters?.search) {
      params.append('search', filters.search)
    }
    if (filters?.ordering) {
      params.append('ordering', filters.ordering)
    }

    const queryString = params.toString()
    const url = `/api/core-data/background-music/${queryString ? `?${queryString}` : ''}`

    return apiClient.getPublic<BackgroundMusicPaginatedResponse>(url)
  },

  /**
   * Get all available music categories with track counts
   * This is a public endpoint - no authentication required
   */
  async getMusicCategories(): Promise<ApiResponse<BackgroundMusicCategoryInfo[]>> {
    return apiClient.getPublic<BackgroundMusicCategoryInfo[]>(
      '/api/core-data/background-music/categories/'
    )
  },
}
