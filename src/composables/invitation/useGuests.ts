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
}

export function useGuests(eventId: string) {
  const guests = ref<EventGuest[]>([])
  const guestStats = ref<GuestStats | null>(null)
  const loadingStats = ref(false)
  const groupPagination = ref<Map<number, GroupPagination>>(new Map())

  const getGroupPagination = (groupId: number): GroupPagination => {
    if (!groupPagination.value.has(groupId)) {
      groupPagination.value.set(groupId, {
        currentPage: 1,
        totalCount: 0,
        guests: [],
        loading: false,
        searchTerm: '',
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
        // Refresh the group's guest list if it's currently loaded
        if (groupPagination.value.has(groupId)) {
          const currentPage = getGroupPagination(groupId).currentPage
          await loadGuestsForGroup(groupId, currentPage)
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

  const deleteGuest = async (guestId: number, groupId: number) => {
    try {
      const response = await guestService.deleteGuest(eventId, guestId)

      if (response.success) {
        // Refresh the group's guest list if it's currently loaded
        if (groupPagination.value.has(groupId)) {
          const currentPage = getGroupPagination(groupId).currentPage
          await loadGuestsForGroup(groupId, currentPage)
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
        // Refresh the group's guest list to show updated status
        if (groupPagination.value.has(groupId)) {
          const currentPage = getGroupPagination(groupId).currentPage
          await loadGuestsForGroup(groupId, currentPage, true)
        }
        // Also refresh stats to update the count
        await loadGuestStats()
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

  return {
    guests,
    guestStats,
    loadingStats,
    groupPagination,
    PAGE_SIZE,
    getGroupPagination,
    getGroupTotalPages,
    getGroupGuests,
    isGroupLoading,
    loadGuestsForGroup,
    loadGuestStats,
    createGuest,
    deleteGuest,
    markGuestAsSent,
    goToGroupPage,
    nextGroupPage,
    previousGroupPage,
    setGroupSearchTerm,
    clearGroupSearch,
  }
}
