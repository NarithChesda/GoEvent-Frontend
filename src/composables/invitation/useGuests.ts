import { ref } from 'vue'
import {
  guestService,
  type EventGuest,
  type GuestStats,
  type ApiResponse,
  type PaginatedResponse,
} from '../../services/api'

const PAGE_SIZE = 20

interface GroupPagination {
  currentPage: number
  totalCount: number
  guests: EventGuest[]
  loading: boolean
  searchTerm: string
  hasLoaded: boolean // Track if this group has been loaded at least once
}

/**
 * Composable for managing event guests with pagination and search.
 *
 * @param eventId - The event ID
 * @param onGroupCountChange - Optional callback invoked when a group's guest count changes
 * @param onStatsChange - Optional callback invoked when overall stats change (e.g., total guests)
 */
export function useGuests(
  eventId: string,
  onGroupCountChange?: (groupId: number, delta: number) => void,
  onStatsChange?: (delta: number, statusChange?: { from?: string; to?: string }) => void
) {
  const guests = ref<EventGuest[]>([])
  const guestStats = ref<GuestStats | null>(null)
  const loadingStats = ref(false)
  const groupPagination = ref<Map<number, GroupPagination>>(new Map())

  // Separate pagination state for "All Groups" view
  const allGroupsPagination = ref<GroupPagination>({
    currentPage: 1,
    totalCount: 0,
    guests: [],
    loading: false,
    searchTerm: '',
    hasLoaded: false,
  })

  const getGroupPagination = (groupId: number): GroupPagination => {
    if (!groupPagination.value.has(groupId)) {
      groupPagination.value.set(groupId, {
        currentPage: 1,
        totalCount: 0,
        guests: [],
        loading: false,
        searchTerm: '',
        hasLoaded: false,
      })
    }
    return groupPagination.value.get(groupId)!
  }

  const getGroupTotalPages = (groupId: number): number => {
    const pagination = getGroupPagination(groupId)
    return Math.ceil(pagination.totalCount / PAGE_SIZE)
  }

  const getGroupGuests = (groupId: number): EventGuest[] => {
    return getGroupPagination(groupId).guests
  }

  const isGroupLoading = (groupId: number): boolean => {
    return getGroupPagination(groupId).loading
  }

  const loadGuestsForGroup = async (groupId: number, page: number = 1, silent: boolean = false) => {
    const pagination = getGroupPagination(groupId)

    // Only show loading state if not silent (silent is used for pagination)
    if (!silent) {
      pagination.loading = true
    }

    try {
      const response = await guestService.getGuests(eventId, {
        group: groupId,
        ordering: 'name',
        page: page,
        page_size: PAGE_SIZE,
        search: pagination.searchTerm || undefined,
      })

      if (response.success && response.data) {
        // Update data atomically to prevent flicker
        pagination.guests = response.data.results
        pagination.totalCount = response.data.count
        pagination.currentPage = page
        pagination.hasLoaded = true // Mark as loaded
      }

      return response
    } catch (error) {
      console.error('Error loading guests:', error)
      return {
        success: false,
        message: 'Failed to load guests',
      } as ApiResponse<PaginatedResponse<EventGuest>>
    } finally {
      pagination.loading = false
    }
  }

  const loadAllGuests = async (page: number = 1, silent: boolean = false) => {
    // Only show loading state if not silent (silent is used for pagination)
    if (!silent) {
      allGroupsPagination.value.loading = true
    }

    try {
      const response = await guestService.getGuests(eventId, {
        // No group filter - loads all guests
        ordering: 'name',
        page: page,
        page_size: PAGE_SIZE,
        search: allGroupsPagination.value.searchTerm || undefined,
      })

      if (response.success && response.data) {
        // Update data atomically to prevent flicker
        allGroupsPagination.value.guests = response.data.results
        allGroupsPagination.value.totalCount = response.data.count
        allGroupsPagination.value.currentPage = page
        allGroupsPagination.value.hasLoaded = true // Mark as loaded
      }

      return response
    } catch (error) {
      console.error('Error loading all guests:', error)
      return {
        success: false,
        message: 'Failed to load guests',
      } as ApiResponse<PaginatedResponse<EventGuest>>
    } finally {
      allGroupsPagination.value.loading = false
    }
  }

  const loadGuestStats = async () => {
    loadingStats.value = true
    try {
      const response = await guestService.getGuestStats(eventId)
      if (response.success && response.data) {
        guestStats.value = response.data
      }
      return response
    } catch (error) {
      console.error('Error loading guest stats:', error)
      return {
        success: false,
        message: 'Failed to load guest stats',
      } as ApiResponse<GuestStats>
    } finally {
      loadingStats.value = false
    }
  }

  const createGuest = async (name: string, groupId: number) => {
    try {
      const response = await guestService.createGuest(eventId, {
        name: name.trim(),
        group: groupId,
      })

      if (response.success && response.data) {
        // 1. Refresh guest lists FIRST (await all async operations)
        // Only refresh if this specific group has been loaded before
        if (groupPagination.value.has(groupId) && getGroupPagination(groupId).hasLoaded) {
          const currentPage = getGroupPagination(groupId).currentPage
          await loadGuestsForGroup(groupId, currentPage)
        }
        // Refresh All Guests pagination only if it has been loaded before
        if (allGroupsPagination.value.hasLoaded) {
          await loadAllGuests(allGroupsPagination.value.currentPage, true)
        }

        // 2. THEN update counts via callbacks (with error handling)
        try {
          if (onGroupCountChange) {
            onGroupCountChange(groupId, 1)
          }
          if (onStatsChange) {
            onStatsChange(1)
          }
        } catch (error) {
          console.error('Error updating counts via callback:', error)
          // Don't throw - continue execution
        }
      }

      return response
    } catch (error) {
      console.error('Error adding guest:', error)
      return {
        success: false,
        message: 'Failed to add guest',
      } as ApiResponse<EventGuest>
    }
  }

  const updateGuest = async (guestId: number, groupId: number, data: Partial<import('../../services/api').CreateGuestRequest>) => {
    try {
      const response = await guestService.updateGuest(eventId, guestId, data)

      if (response.success) {
        // 1. Refresh guest lists FIRST (await all async operations)
        if (groupPagination.value.has(groupId)) {
          const currentPage = getGroupPagination(groupId).currentPage
          await loadGuestsForGroup(groupId, currentPage, true)
        }
        // If the guest was moved to a different group, refresh that group too
        if (data.group && data.group !== groupId) {
          if (groupPagination.value.has(data.group)) {
            const currentPage = getGroupPagination(data.group).currentPage
            await loadGuestsForGroup(data.group, currentPage, true)
          }

          // 2. THEN update group counts when moving between groups (with error handling)
          try {
            if (onGroupCountChange) {
              onGroupCountChange(groupId, -1) // Decrement old group
              onGroupCountChange(data.group, 1) // Increment new group
            }
            // Total count doesn't change when moving between groups
          } catch (error) {
            console.error('Error updating counts via callback:', error)
            // Don't throw - continue execution
          }
        }

        // Refresh All Guests pagination only if it has been loaded before
        if (allGroupsPagination.value.hasLoaded) {
          await loadAllGuests(allGroupsPagination.value.currentPage, true)
        }
      }

      return response
    } catch (error) {
      console.error('Error updating guest:', error)
      return {
        success: false,
        message: 'Failed to update guest',
      } as ApiResponse<EventGuest>
    }
  }

  const deleteGuest = async (guestId: number, groupId: number) => {
    try {
      // Capture guest status BEFORE deletion
      const pagination = getGroupPagination(groupId)
      const guestToDelete = pagination.guests.find(g => g.id === guestId)
      const guestStatus = guestToDelete?.invitation_status || 'not_sent'

      const response = await guestService.deleteGuest(eventId, guestId)

      if (response.success) {
        // 1. Refresh guest lists FIRST (await all async operations)
        // Only refresh if this specific group has been loaded before
        if (groupPagination.value.has(groupId) && getGroupPagination(groupId).hasLoaded) {
          const currentPage = getGroupPagination(groupId).currentPage
          await loadGuestsForGroup(groupId, currentPage)
        }
        // Refresh All Guests pagination only if it has been loaded before
        if (allGroupsPagination.value.hasLoaded) {
          await loadAllGuests(allGroupsPagination.value.currentPage, true)
        }

        // 2. THEN update counts with actual status (with error handling)
        try {
          if (onGroupCountChange) {
            onGroupCountChange(groupId, -1)
          }
          if (onStatsChange) {
            onStatsChange(-1, { from: guestStatus, to: undefined })
          }
        } catch (error) {
          console.error('Error updating counts via callback:', error)
          // Don't throw - continue execution
        }
      }

      return response
    } catch (error) {
      console.error('Error removing guest:', error)
      return {
        success: false,
        message: 'Failed to remove guest',
      } as ApiResponse<void>
    }
  }

  const markGuestAsSent = async (guestId: number, groupId: number) => {
    try {
      const response = await guestService.markInvitationSent(eventId, guestId)

      if (response.success) {
        // 1. Refresh guest lists FIRST (await all async operations)
        // Only refresh if this specific group has been loaded before
        if (groupPagination.value.has(groupId) && getGroupPagination(groupId).hasLoaded) {
          const currentPage = getGroupPagination(groupId).currentPage
          await loadGuestsForGroup(groupId, currentPage, true)
        }
        // Refresh All Guests pagination only if it has been loaded before
        if (allGroupsPagination.value.hasLoaded) {
          await loadAllGuests(allGroupsPagination.value.currentPage, true)
        }

        // 2. THEN update stats reactively (with error handling)
        // Guest moved from 'not_sent' to 'sent'
        try {
          if (onStatsChange) {
            onStatsChange(0, { from: 'not_sent', to: 'sent' })
          }
        } catch (error) {
          console.error('Error updating counts via callback:', error)
          // Don't throw - continue execution
        }
      }

      return response
    } catch (error) {
      console.error('Error marking guest as sent:', error)
      return {
        success: false,
        message: 'Failed to mark guest as sent',
      } as ApiResponse<EventGuest>
    }
  }

  const goToGroupPage = (groupId: number, page: number) => {
    const totalPages = getGroupTotalPages(groupId)
    if (page < 1 || page > totalPages) return
    // Use silent mode to prevent loading flicker during pagination
    loadGuestsForGroup(groupId, page, true)
  }

  const nextGroupPage = (groupId: number) => {
    const pagination = getGroupPagination(groupId)
    const totalPages = getGroupTotalPages(groupId)
    if (pagination.currentPage < totalPages) {
      goToGroupPage(groupId, pagination.currentPage + 1)
    }
  }

  const previousGroupPage = (groupId: number) => {
    const pagination = getGroupPagination(groupId)
    if (pagination.currentPage > 1) {
      goToGroupPage(groupId, pagination.currentPage - 1)
    }
  }

  const setGroupSearchTerm = (groupId: number, searchTerm: string) => {
    const pagination = getGroupPagination(groupId)
    pagination.searchTerm = searchTerm
    // Reset to page 1 when searching
    loadGuestsForGroup(groupId, 1, true)
  }

  const clearGroupSearch = (groupId: number) => {
    const pagination = getGroupPagination(groupId)
    pagination.searchTerm = ''
    loadGuestsForGroup(groupId, 1, true)
  }

  // All Groups pagination functions
  const nextAllGuestsPage = () => {
    const totalPages = Math.ceil(allGroupsPagination.value.totalCount / PAGE_SIZE)
    if (allGroupsPagination.value.currentPage < totalPages) {
      loadAllGuests(allGroupsPagination.value.currentPage + 1, true)
    }
  }

  const previousAllGuestsPage = () => {
    if (allGroupsPagination.value.currentPage > 1) {
      loadAllGuests(allGroupsPagination.value.currentPage - 1, true)
    }
  }

  const setAllGuestsSearchTerm = (searchTerm: string) => {
    allGroupsPagination.value.searchTerm = searchTerm
    // Reset to page 1 when searching
    loadAllGuests(1, true)
  }

  const getAllGuestsPagination = () => {
    return allGroupsPagination.value
  }

  const isAllGuestsLoading = () => {
    return allGroupsPagination.value.loading
  }

  return {
    guests,
    guestStats,
    loadingStats,
    groupPagination, // Export for external access to pagination state
    PAGE_SIZE,
    getGroupPagination,
    getGroupTotalPages,
    getGroupGuests,
    isGroupLoading,
    loadGuestsForGroup,
    loadGuestStats,
    createGuest,
    updateGuest,
    deleteGuest,
    markGuestAsSent,
    goToGroupPage,
    nextGroupPage,
    previousGroupPage,
    setGroupSearchTerm,
    clearGroupSearch,
    // All Groups pagination
    loadAllGuests,
    getAllGuestsPagination,
    isAllGuestsLoading,
    nextAllGuestsPage,
    previousAllGuestsPage,
    setAllGuestsSearchTerm,
  }
}
