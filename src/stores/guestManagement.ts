/**
 * Guest Management Store
 *
 * Centralized state management for guest groups and guests.
 * This store serves as the single source of truth for all guest-related data,
 * eliminating the need for callbacks and prop drilling.
 *
 * @example
 * const store = useGuestManagementStore()
 * await store.loadGroups(eventId)
 * await store.createGuest(eventId, 'John Doe', groupId)
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  guestService,
  guestGroupService,
  type EventGuest,
  type GuestGroup,
  type GuestStats,
  type CreateGuestRequest,
  type CreateGuestGroupRequest,
  type PaginatedResponse,
} from '../services/api'

// Constants
const PAGE_SIZE = 20
const CACHE_DURATION_MS = 30000 // 30 seconds cache

// Types
interface PaginationState {
  currentPage: number
  totalCount: number
  guests: EventGuest[]
  loading: boolean
  loadingMore: boolean // For infinite scroll "load more" state
  searchTerm: string
  hasLoaded: boolean
  hasMore: boolean // Whether there are more items to load
  lastFetched: number // Timestamp of last fetch for cache invalidation
}

export const useGuestManagementStore = defineStore('guestManagement', () => {
  // ============================================================================
  // STATE
  // ============================================================================

  // Guest Groups
  const groups = ref<GuestGroup[]>([])
  const loadingGroups = ref(false)
  const expandedGroupIds = ref<Set<number>>(new Set())

  // Guest Statistics
  const stats = ref<GuestStats | null>(null)
  const loadingStats = ref(false)

  // Per-Group Pagination
  const groupPagination = ref<Map<number, PaginationState>>(new Map())

  // All Guests Pagination
  const allGuestsPagination = ref<PaginationState>({
    currentPage: 1,
    totalCount: 0,
    guests: [],
    loading: false,
    loadingMore: false,
    searchTerm: '',
    hasLoaded: false,
    hasMore: true,
    lastFetched: 0,
  })

  // ============================================================================
  // GETTERS
  // ============================================================================

  const totalGuestCount = computed(() => {
    return groups.value.reduce((sum, group) => sum + group.guest_count, 0)
  })

  const sortedGroups = computed(() => {
    return [...groups.value].sort((a, b) => a.order - b.order)
  })

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Get or create pagination state for a group
   */
  function getGroupPaginationState(groupId: number): PaginationState {
    if (!groupPagination.value.has(groupId)) {
      groupPagination.value.set(groupId, {
        currentPage: 1,
        totalCount: 0,
        guests: [],
        loading: false,
        loadingMore: false,
        searchTerm: '',
        hasLoaded: false,
        hasMore: true,
        lastFetched: 0,
      })
    }
    return groupPagination.value.get(groupId)!
  }

  /**
   * Check if cache is still valid (within CACHE_DURATION_MS)
   */
  function isCacheValid(lastFetched: number): boolean {
    return Date.now() - lastFetched < CACHE_DURATION_MS
  }

  /**
   * Update guest count for a group
   */
  function updateGroupGuestCount(groupId: number, delta: number) {
    const group = groups.value.find((g) => g.id === groupId)
    if (group) {
      group.guest_count = Math.max(0, group.guest_count + delta)
    }
  }

  /**
   * Update stats based on guest changes
   */
  function updateStats(delta: number, statusChange?: { from?: string; to?: string }) {
    if (!stats.value) return

    stats.value.total_guests += delta

    if (statusChange) {
      const { from, to } = statusChange

      // Handle deletions (to is undefined)
      if (from && !to) {
        if (from === 'not_sent') {
          stats.value.not_sent = Math.max(0, stats.value.not_sent - 1)
        } else if (from === 'sent') {
          stats.value.sent = Math.max(0, stats.value.sent - 1)
        } else if (from === 'viewed') {
          stats.value.viewed = Math.max(0, stats.value.viewed - 1)
        }
      }
      // Handle status transitions
      else if (from && to) {
        if (from === 'not_sent' && to === 'sent') {
          stats.value.not_sent = Math.max(0, stats.value.not_sent - 1)
          stats.value.sent += 1
        } else if (from === 'sent' && to === 'viewed') {
          stats.value.sent = Math.max(0, stats.value.sent - 1)
          stats.value.viewed += 1
        }
      }
    } else if (delta > 0) {
      // New guest additions (no status change info)
      stats.value.not_sent += delta
    }
  }

  // ============================================================================
  // GUEST GROUPS ACTIONS
  // ============================================================================

  /**
   * Load all guest groups for an event
   */
  async function loadGroups(eventId: string) {
    loadingGroups.value = true
    try {
      const response = await guestGroupService.getGroups(eventId)
      if (response.success && response.data) {
        const groupsArray = Array.isArray(response.data)
          ? response.data
          : response.data.results || []
        groups.value = groupsArray.sort((a, b) => a.order - b.order)
        return response
      }
      return response
    } catch (error) {
      console.error('Error loading groups:', error)
      throw error
    } finally {
      loadingGroups.value = false
    }
  }

  /**
   * Create a new guest group
   */
  async function createGroup(eventId: string, data: CreateGuestGroupRequest) {
    try {
      const response = await guestGroupService.createGroup(eventId, data)

      if (response.success && response.data) {
        groups.value.push(response.data)
        groups.value.sort((a, b) => a.order - b.order)
        // Auto-expand the new group
        expandedGroupIds.value.clear()
        expandedGroupIds.value.add(response.data.id)
      }

      return response
    } catch (error) {
      console.error('Error creating group:', error)
      throw error
    }
  }

  /**
   * Update a guest group
   */
  async function updateGroup(eventId: string, groupId: number, data: Partial<CreateGuestGroupRequest>) {
    try {
      const response = await guestGroupService.updateGroup(eventId, groupId, data)

      if (response.success && response.data) {
        const index = groups.value.findIndex((g) => g.id === groupId)
        if (index !== -1) {
          groups.value[index] = response.data
        }
      }

      return response
    } catch (error) {
      console.error('Error updating group:', error)
      throw error
    }
  }

  /**
   * Delete a guest group (cascades to all guests in the group)
   */
  async function deleteGroup(eventId: string, groupId: number) {
    try {
      const group = groups.value.find((g) => g.id === groupId)
      const guestCount = group?.guest_count || 0

      const response = await guestGroupService.deleteGroup(eventId, groupId)

      if (response.success) {
        groups.value = groups.value.filter((g) => g.id !== groupId)
        expandedGroupIds.value.delete(groupId)
        groupPagination.value.delete(groupId)

        // Update stats
        if (guestCount > 0) {
          updateStats(-guestCount)
        }
      }

      return response
    } catch (error) {
      console.error('Error deleting group:', error)
      throw error
    }
  }

  /**
   * Toggle group expansion (allows multiple groups to be expanded)
   */
  function toggleGroupExpansion(groupId: number): boolean {
    if (expandedGroupIds.value.has(groupId)) {
      expandedGroupIds.value.delete(groupId)
      return false
    } else {
      expandedGroupIds.value.add(groupId)
      return true
    }
  }

  /**
   * Check if a group is expanded
   */
  function isGroupExpanded(groupId: number): boolean {
    return expandedGroupIds.value.has(groupId)
  }

  // ============================================================================
  // GUESTS ACTIONS
  // ============================================================================

  /**
   * Load guests for a specific group with pagination and caching
   * @param forceRefresh - If true, bypasses cache and fetches fresh data
   * @param append - If true, appends results to existing list (for infinite scroll)
   */
  async function loadGuestsForGroup(eventId: string, groupId: number, page: number = 1, silent: boolean = false, forceRefresh: boolean = false, append: boolean = false) {
    const pagination = getGroupPaginationState(groupId)

    // Use cache if valid and not force-refreshing and same page and not appending
    if (!append && !forceRefresh && pagination.hasLoaded && pagination.currentPage === page && isCacheValid(pagination.lastFetched)) {
      return { success: true, data: { results: pagination.guests, count: pagination.totalCount } }
    }

    // Set appropriate loading state
    if (append) {
      pagination.loadingMore = true
    } else if (!silent) {
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
        if (append && page > 1) {
          // Append new guests to existing list (infinite scroll)
          pagination.guests = [...pagination.guests, ...response.data.results]
        } else {
          // Replace guests (initial load or refresh)
          pagination.guests = response.data.results
        }
        pagination.totalCount = response.data.count
        pagination.currentPage = page
        pagination.hasLoaded = true
        pagination.hasMore = pagination.guests.length < response.data.count
        pagination.lastFetched = Date.now()
      }

      return response
    } catch (error) {
      console.error('Error loading guests for group:', error)
      throw error
    } finally {
      pagination.loading = false
      pagination.loadingMore = false
    }
  }

  /**
   * Load all guests (across all groups) with pagination and caching
   * @param forceRefresh - If true, bypasses cache and fetches fresh data
   * @param append - If true, appends results to existing list (for infinite scroll)
   */
  async function loadAllGuests(eventId: string, page: number = 1, silent: boolean = false, forceRefresh: boolean = false, append: boolean = false) {
    // Use cache if valid and not force-refreshing and same page and not appending
    if (!append && !forceRefresh && allGuestsPagination.value.hasLoaded && allGuestsPagination.value.currentPage === page && isCacheValid(allGuestsPagination.value.lastFetched)) {
      return { success: true, data: { results: allGuestsPagination.value.guests, count: allGuestsPagination.value.totalCount } }
    }

    // Set appropriate loading state
    if (append) {
      allGuestsPagination.value.loadingMore = true
    } else if (!silent) {
      allGuestsPagination.value.loading = true
    }

    try {
      const response = await guestService.getGuests(eventId, {
        ordering: 'name',
        page: page,
        page_size: PAGE_SIZE,
        search: allGuestsPagination.value.searchTerm || undefined,
      })

      if (response.success && response.data) {
        if (append && page > 1) {
          // Append new guests to existing list (infinite scroll)
          allGuestsPagination.value.guests = [...allGuestsPagination.value.guests, ...response.data.results]
        } else {
          // Replace guests (initial load or refresh)
          allGuestsPagination.value.guests = response.data.results
        }
        allGuestsPagination.value.totalCount = response.data.count
        allGuestsPagination.value.currentPage = page
        allGuestsPagination.value.hasLoaded = true
        allGuestsPagination.value.hasMore = allGuestsPagination.value.guests.length < response.data.count
        allGuestsPagination.value.lastFetched = Date.now()
      }

      return response
    } catch (error) {
      console.error('Error loading all guests:', error)
      throw error
    } finally {
      allGuestsPagination.value.loading = false
      allGuestsPagination.value.loadingMore = false
    }
  }

  /**
   * Load guest statistics
   */
  async function loadGuestStats(eventId: string) {
    loadingStats.value = true
    try {
      const response = await guestService.getGuestStats(eventId)
      if (response.success && response.data) {
        stats.value = response.data
      }
      return response
    } catch (error) {
      console.error('Error loading guest stats:', error)
      throw error
    } finally {
      loadingStats.value = false
    }
  }

  /**
   * Create a new guest with optimistic update
   */
  async function createGuest(eventId: string, name: string, groupId: number) {
    // Generate temporary ID for optimistic update
    const tempId = -Date.now()
    const trimmedName = name.trim()

    // Find group details for optimistic guest
    const group = groups.value.find(g => g.id === groupId)

    // Create optimistic guest object
    const optimisticGuest: EventGuest = {
      id: tempId,
      name: trimmedName,
      group: groupId,
      group_details: group ? { id: group.id, name: group.name, color: group.color } : undefined,
      invitation_status: 'not_sent',
      short_link: '',
      showcase_link: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Optimistic update: immediately add to UI
    const groupPag = getGroupPaginationState(groupId)
    groupPag.guests = [optimisticGuest, ...groupPag.guests]
    groupPag.totalCount += 1
    allGuestsPagination.value.guests = [optimisticGuest, ...allGuestsPagination.value.guests]
    allGuestsPagination.value.totalCount += 1
    updateGroupGuestCount(groupId, 1)
    updateStats(1)

    try {
      const response = await guestService.createGuest(eventId, {
        name: trimmedName,
        group: groupId,
      })

      if (response.success && response.data) {
        // Replace optimistic guest with real data
        const realGuest = response.data

        // Update in group pagination
        const guestIndex = groupPag.guests.findIndex(g => g.id === tempId)
        if (guestIndex !== -1) {
          groupPag.guests[guestIndex] = realGuest
        }

        // Update in all guests pagination
        const allGuestIndex = allGuestsPagination.value.guests.findIndex(g => g.id === tempId)
        if (allGuestIndex !== -1) {
          allGuestsPagination.value.guests[allGuestIndex] = realGuest
        }
      } else {
        // Rollback optimistic update on failure
        groupPag.guests = groupPag.guests.filter(g => g.id !== tempId)
        groupPag.totalCount -= 1
        allGuestsPagination.value.guests = allGuestsPagination.value.guests.filter(g => g.id !== tempId)
        allGuestsPagination.value.totalCount -= 1
        updateGroupGuestCount(groupId, -1)
        updateStats(-1)
      }

      return response
    } catch (error) {
      // Rollback optimistic update on error
      groupPag.guests = groupPag.guests.filter(g => g.id !== tempId)
      groupPag.totalCount -= 1
      allGuestsPagination.value.guests = allGuestsPagination.value.guests.filter(g => g.id !== tempId)
      allGuestsPagination.value.totalCount -= 1
      updateGroupGuestCount(groupId, -1)
      updateStats(-1)

      console.error('Error creating guest:', error)
      throw error
    }
  }

  /**
   * Update a guest
   */
  async function updateGuest(eventId: string, guestId: number, groupId: number, data: Partial<CreateGuestRequest>) {
    try {
      const response = await guestService.updateGuest(eventId, guestId, data)

      if (response.success) {
        // If guest moved to different group
        if (data.group && data.group !== groupId) {
          updateGroupGuestCount(groupId, -1)
          updateGroupGuestCount(data.group, 1)

          // Refresh both groups
          const oldGroupPag = getGroupPaginationState(groupId)
          if (oldGroupPag.hasLoaded) {
            await loadGuestsForGroup(eventId, groupId, oldGroupPag.currentPage, true)
          }

          const newGroupPag = getGroupPaginationState(data.group)
          if (newGroupPag.hasLoaded) {
            await loadGuestsForGroup(eventId, data.group, newGroupPag.currentPage, true)
          }
        } else {
          // Just refresh the current group
          const groupPag = getGroupPaginationState(groupId)
          if (groupPag.hasLoaded) {
            await loadGuestsForGroup(eventId, groupId, groupPag.currentPage, true)
          }
        }

        // Always refresh all guests
        await loadAllGuests(eventId, allGuestsPagination.value.currentPage, true)
      }

      return response
    } catch (error) {
      console.error('Error updating guest:', error)
      throw error
    }
  }

  /**
   * Delete a guest with optimistic update
   */
  async function deleteGuest(eventId: string, guestId: number, groupId: number) {
    // Capture guest data BEFORE deletion for rollback
    const groupPag = getGroupPaginationState(groupId)
    const guestToDelete = groupPag.guests.find((g) => g.id === guestId)
    const allGuestToDelete = allGuestsPagination.value.guests.find((g) => g.id === guestId)
    const guestStatus = guestToDelete?.invitation_status || 'not_sent'
    const guestIndexInGroup = groupPag.guests.findIndex((g) => g.id === guestId)
    const guestIndexInAll = allGuestsPagination.value.guests.findIndex((g) => g.id === guestId)

    // Optimistic update: immediately remove from UI
    groupPag.guests = groupPag.guests.filter(g => g.id !== guestId)
    groupPag.totalCount -= 1
    allGuestsPagination.value.guests = allGuestsPagination.value.guests.filter(g => g.id !== guestId)
    allGuestsPagination.value.totalCount -= 1
    updateGroupGuestCount(groupId, -1)
    updateStats(-1, { from: guestStatus, to: undefined })

    try {
      const response = await guestService.deleteGuest(eventId, guestId)

      if (!response.success) {
        // Rollback optimistic update on failure
        if (guestToDelete && guestIndexInGroup !== -1) {
          groupPag.guests.splice(guestIndexInGroup, 0, guestToDelete)
          groupPag.totalCount += 1
        }
        if (allGuestToDelete && guestIndexInAll !== -1) {
          allGuestsPagination.value.guests.splice(guestIndexInAll, 0, allGuestToDelete)
          allGuestsPagination.value.totalCount += 1
        }
        updateGroupGuestCount(groupId, 1)
        updateStats(1, { from: undefined, to: guestStatus })
      }

      return response
    } catch (error) {
      // Rollback optimistic update on error
      if (guestToDelete && guestIndexInGroup !== -1) {
        groupPag.guests.splice(guestIndexInGroup, 0, guestToDelete)
        groupPag.totalCount += 1
      }
      if (allGuestToDelete && guestIndexInAll !== -1) {
        allGuestsPagination.value.guests.splice(guestIndexInAll, 0, allGuestToDelete)
        allGuestsPagination.value.totalCount += 1
      }
      updateGroupGuestCount(groupId, 1)
      updateStats(1, { from: undefined, to: guestStatus })

      console.error('Error deleting guest:', error)
      throw error
    }
  }

  /**
   * Mark a guest invitation as sent with optimistic update
   */
  async function markGuestAsSent(eventId: string, guestId: number, groupId: number) {
    // Capture original status for rollback
    const groupPag = getGroupPaginationState(groupId)
    const guestInGroup = groupPag.guests.find(g => g.id === guestId)
    const guestInAll = allGuestsPagination.value.guests.find(g => g.id === guestId)
    const originalStatus = guestInGroup?.invitation_status || 'not_sent'

    // Optimistic update: immediately update status in UI
    if (guestInGroup) {
      guestInGroup.invitation_status = 'sent'
    }
    if (guestInAll) {
      guestInAll.invitation_status = 'sent'
    }
    updateStats(0, { from: 'not_sent', to: 'sent' })

    try {
      const response = await guestService.markInvitationSent(eventId, guestId)

      if (!response.success) {
        // Rollback optimistic update on failure
        if (guestInGroup) {
          guestInGroup.invitation_status = originalStatus
        }
        if (guestInAll) {
          guestInAll.invitation_status = originalStatus
        }
        updateStats(0, { from: 'sent', to: 'not_sent' })
      }

      return response
    } catch (error) {
      // Rollback optimistic update on error
      if (guestInGroup) {
        guestInGroup.invitation_status = originalStatus
      }
      if (guestInAll) {
        guestInAll.invitation_status = originalStatus
      }
      updateStats(0, { from: 'sent', to: 'not_sent' })

      console.error('Error marking guest as sent:', error)
      throw error
    }
  }

  /**
   * Bulk mark guests as sent
   */
  async function bulkMarkGuestsAsSent(eventId: string, guestIds: number[]) {
    try {
      const response = await guestService.bulkMarkInvitationSent(eventId, guestIds)

      if (response.success && response.data) {
        const count = response.data.count

        // Update stats for each guest
        for (let i = 0; i < count; i++) {
          updateStats(0, { from: 'not_sent', to: 'sent' })
        }

        // Refresh all guests list
        await loadAllGuests(eventId, allGuestsPagination.value.currentPage, true)

        // Refresh any expanded groups
        expandedGroupIds.value.forEach(async (groupId) => {
          const groupPag = getGroupPaginationState(groupId)
          if (groupPag.hasLoaded) {
            await loadGuestsForGroup(eventId, groupId, groupPag.currentPage, true)
          }
        })
      }

      return response
    } catch (error) {
      console.error('Error bulk marking guests as sent:', error)
      throw error
    }
  }

  /**
   * Bulk delete guests
   */
  async function bulkDeleteGuests(eventId: string, guestIds: number[], groupId?: number) {
    try {
      // Get guest statuses BEFORE deletion
      const guestsToDelete: EventGuest[] = []

      if (groupId && groupId !== 0) {
        const groupPag = getGroupPaginationState(groupId)
        guestsToDelete.push(...groupPag.guests.filter((g) => guestIds.includes(g.id)))
      } else {
        guestsToDelete.push(...allGuestsPagination.value.guests.filter((g) => guestIds.includes(g.id)))
      }

      // Count by status
      const statusCounts = {
        not_sent: 0,
        sent: 0,
        viewed: 0,
      }
      guestsToDelete.forEach((guest) => {
        const status = guest.invitation_status || 'not_sent'
        if (status in statusCounts) {
          statusCounts[status as keyof typeof statusCounts]++
        } else {
          statusCounts.not_sent++
        }
      })

      const response = await guestService.bulkDeleteGuests(eventId, guestIds)

      if (response.success && response.data) {
        const count = response.data.count

        // Update group count if specific group
        if (groupId && groupId !== 0) {
          updateGroupGuestCount(groupId, -count)
        } else {
          // Need to reload groups to get accurate counts
          await loadGroups(eventId)
        }

        // Update stats
        for (let i = 0; i < statusCounts.not_sent; i++) {
          updateStats(-1, { from: 'not_sent', to: undefined })
        }
        for (let i = 0; i < statusCounts.sent; i++) {
          updateStats(-1, { from: 'sent', to: undefined })
        }
        for (let i = 0; i < statusCounts.viewed; i++) {
          updateStats(-1, { from: 'viewed', to: undefined })
        }

        // Refresh lists
        await loadAllGuests(eventId, allGuestsPagination.value.currentPage, true)

        if (groupId && groupId !== 0) {
          const groupPag = getGroupPaginationState(groupId)
          if (groupPag.hasLoaded) {
            await loadGuestsForGroup(eventId, groupId, groupPag.currentPage, true)
          }
        }
      }

      return response
    } catch (error) {
      console.error('Error bulk deleting guests:', error)
      throw error
    }
  }

  /**
   * Bulk import guests to a group
   */
  async function bulkImportGuests(eventId: string, groupId: number, file: File) {
    try {
      const response = await guestGroupService.bulkImportToGroup(eventId, groupId, file)

      if (response.success && response.data) {
        const createdCount = response.data.created || 0

        // Update counts
        if (createdCount > 0) {
          updateGroupGuestCount(groupId, createdCount)
          updateStats(createdCount)
        }

        // Reset and refresh lists for infinite scroll
        // Reset group pagination to page 1 and reload fresh data
        resetGroupPagination(groupId)
        await loadGuestsForGroup(eventId, groupId, 1, true)

        // Reset all guests pagination and reload fresh data
        resetAllGuestsPagination()
        await loadAllGuests(eventId, 1, true)
      }

      return response
    } catch (error) {
      console.error('Error importing guests:', error)
      throw error
    }
  }

  // ============================================================================
  // PAGINATION ACTIONS
  // ============================================================================

  /**
   * Navigate to next page for a group
   */
  async function nextGroupPage(eventId: string, groupId: number) {
    const pagination = getGroupPaginationState(groupId)
    const totalPages = Math.ceil(pagination.totalCount / PAGE_SIZE)

    if (pagination.currentPage < totalPages) {
      await loadGuestsForGroup(eventId, groupId, pagination.currentPage + 1, true)
    }
  }

  /**
   * Navigate to previous page for a group
   */
  async function previousGroupPage(eventId: string, groupId: number) {
    const pagination = getGroupPaginationState(groupId)

    if (pagination.currentPage > 1) {
      await loadGuestsForGroup(eventId, groupId, pagination.currentPage - 1, true)
    }
  }

  /**
   * Set search term for a group and reload
   */
  async function setGroupSearchTerm(eventId: string, groupId: number, searchTerm: string) {
    const pagination = getGroupPaginationState(groupId)
    pagination.searchTerm = searchTerm
    await loadGuestsForGroup(eventId, groupId, 1, true)
  }

  /**
   * Navigate to next page for all guests
   */
  async function nextAllGuestsPage(eventId: string) {
    const totalPages = Math.ceil(allGuestsPagination.value.totalCount / PAGE_SIZE)

    if (allGuestsPagination.value.currentPage < totalPages) {
      await loadAllGuests(eventId, allGuestsPagination.value.currentPage + 1, true)
    }
  }

  /**
   * Navigate to previous page for all guests
   */
  async function previousAllGuestsPage(eventId: string) {
    if (allGuestsPagination.value.currentPage > 1) {
      await loadAllGuests(eventId, allGuestsPagination.value.currentPage - 1, true)
    }
  }

  /**
   * Set search term for all guests and reload
   */
  async function setAllGuestsSearchTerm(eventId: string, searchTerm: string) {
    allGuestsPagination.value.searchTerm = searchTerm
    // Reset to page 1 and clear existing guests for fresh search
    allGuestsPagination.value.guests = []
    allGuestsPagination.value.hasMore = true
    await loadAllGuests(eventId, 1, true)
  }

  // ============================================================================
  // INFINITE SCROLL ACTIONS
  // ============================================================================

  /**
   * Load more guests for infinite scroll (all guests view)
   */
  async function loadMoreAllGuests(eventId: string) {
    if (allGuestsPagination.value.loadingMore || !allGuestsPagination.value.hasMore) {
      return { success: true, data: null }
    }

    const nextPage = allGuestsPagination.value.currentPage + 1
    return await loadAllGuests(eventId, nextPage, true, false, true)
  }

  /**
   * Load more guests for infinite scroll (specific group view)
   */
  async function loadMoreGroupGuests(eventId: string, groupId: number) {
    const pagination = getGroupPaginationState(groupId)

    if (pagination.loadingMore || !pagination.hasMore) {
      return { success: true, data: null }
    }

    const nextPage = pagination.currentPage + 1
    return await loadGuestsForGroup(eventId, groupId, nextPage, true, false, true)
  }

  /**
   * Reset pagination state for fresh load (useful when changing filters)
   */
  function resetAllGuestsPagination() {
    allGuestsPagination.value.currentPage = 1
    allGuestsPagination.value.guests = []
    allGuestsPagination.value.hasMore = true
    allGuestsPagination.value.hasLoaded = false
  }

  /**
   * Reset group pagination state for fresh load
   */
  function resetGroupPagination(groupId: number) {
    const pagination = getGroupPaginationState(groupId)
    pagination.currentPage = 1
    pagination.guests = []
    pagination.hasMore = true
    pagination.hasLoaded = false
  }

  // ============================================================================
  // RESET STATE
  // ============================================================================

  /**
   * Reset all state (useful when switching events or unmounting)
   */
  function $reset() {
    groups.value = []
    loadingGroups.value = false
    expandedGroupIds.value.clear()
    stats.value = null
    loadingStats.value = false
    groupPagination.value.clear()
    allGuestsPagination.value = {
      currentPage: 1,
      totalCount: 0,
      guests: [],
      loading: false,
      loadingMore: false,
      searchTerm: '',
      hasLoaded: false,
      hasMore: true,
      lastFetched: 0,
    }
  }

  /**
   * Invalidate all caches (forces fresh data on next load)
   */
  function invalidateCache() {
    allGuestsPagination.value.lastFetched = 0
    groupPagination.value.forEach(pagination => {
      pagination.lastFetched = 0
    })
  }

  // ============================================================================
  // RETURN PUBLIC API
  // ============================================================================

  return {
    // State
    groups: sortedGroups,
    loadingGroups,
    stats,
    loadingStats,
    allGuestsPagination,

    // Getters
    totalGuestCount,

    // Group Actions
    loadGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    toggleGroupExpansion,
    isGroupExpanded,

    // Guest Actions
    loadGuestsForGroup,
    loadAllGuests,
    loadGuestStats,
    createGuest,
    updateGuest,
    deleteGuest,
    markGuestAsSent,
    bulkMarkGuestsAsSent,
    bulkDeleteGuests,
    bulkImportGuests,

    // Pagination Actions
    nextGroupPage,
    previousGroupPage,
    setGroupSearchTerm,
    nextAllGuestsPage,
    previousAllGuestsPage,
    setAllGuestsSearchTerm,

    // Infinite Scroll Actions
    loadMoreAllGuests,
    loadMoreGroupGuests,
    resetAllGuestsPagination,
    resetGroupPagination,

    // Helpers
    getGroupPaginationState,

    // Cache
    invalidateCache,

    // Reset
    $reset,

    // Constants
    PAGE_SIZE,
    CACHE_DURATION_MS,
  }
})
