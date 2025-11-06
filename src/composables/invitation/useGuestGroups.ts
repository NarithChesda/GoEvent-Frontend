import { ref, computed } from 'vue'
import {
  guestGroupService,
  type GuestGroup,
  type CreateGuestGroupRequest,
  type ApiResponse,
} from '../../services/api'

export function useGuestGroups(eventId: string) {
  const groups = ref<GuestGroup[]>([])
  const loadingGroups = ref(false)
  const expandedGroups = ref<Set<number>>(new Set())

  const loadGroups = async () => {
    loadingGroups.value = true
    try {
      const response = await guestGroupService.getGroups(eventId)
      if (response.success && response.data) {
        // Handle paginated response - extract results array
        const groupsArray = Array.isArray(response.data)
          ? response.data
          : response.data.results || []
        groups.value = groupsArray.sort((a, b) => a.order - b.order)
        return response
      } else {
        return response
      }
    } catch (error) {
      console.error('Error loading groups:', error)
      return {
        success: false,
        message: 'Failed to load guest groups',
      } as ApiResponse<GuestGroup[]>
    } finally {
      loadingGroups.value = false
    }
  }

  const createGroup = async (data: CreateGuestGroupRequest) => {
    try {
      const response = await guestGroupService.createGroup(eventId, data)

      if (response.success && response.data) {
        groups.value.push(response.data)
        groups.value.sort((a, b) => a.order - b.order)
        // Auto-expand the new group (collapse all others first)
        expandedGroups.value.clear()
        expandedGroups.value.add(response.data.id)
      }

      return response
    } catch (error) {
      console.error('Error creating group:', error)
      return {
        success: false,
        message: 'Failed to create group',
      } as ApiResponse<GuestGroup>
    }
  }

  const updateGroup = async (groupId: number, data: Partial<CreateGuestGroupRequest>) => {
    try {
      const response = await guestGroupService.updateGroup(eventId, groupId, data)

      if (response.success && response.data) {
        // Update the group in the local array
        const index = groups.value.findIndex((g) => g.id === groupId)
        if (index !== -1) {
          groups.value[index] = response.data
        }
      }

      return response
    } catch (error) {
      console.error('Error updating group:', error)
      return {
        success: false,
        message: 'Failed to update group',
      } as ApiResponse<GuestGroup>
    }
  }

  const deleteGroup = async (groupId: number) => {
    try {
      const response = await guestGroupService.deleteGroup(eventId, groupId)

      if (response.success) {
        groups.value = groups.value.filter((g) => g.id !== groupId)
        expandedGroups.value.delete(groupId)
      }

      return response
    } catch (error) {
      console.error('Error deleting group:', error)
      return {
        success: false,
        message: 'Failed to delete group',
      } as ApiResponse<void>
    }
  }

  const toggleGroupExpansion = (groupId: number) => {
    if (expandedGroups.value.has(groupId)) {
      // If clicking on the already expanded group, collapse it
      expandedGroups.value.delete(groupId)
      return false
    } else {
      // Clear all expanded groups first, then expand only this one
      expandedGroups.value.clear()
      expandedGroups.value.add(groupId)
      return true
    }
  }

  const isGroupExpanded = (groupId: number) => {
    return expandedGroups.value.has(groupId)
  }

  /**
   * Increment or decrement the guest count for a specific group reactively.
   * This avoids making full API calls to refresh the group list.
   *
   * @param groupId - The ID of the group to update
   * @param delta - The amount to increment (positive) or decrement (negative)
   */
  const incrementGroupGuestCount = (groupId: number, delta: number = 1) => {
    const group = groups.value.find((g) => g.id === groupId)
    if (group) {
      group.guest_count = Math.max(0, group.guest_count + delta)
    }
  }

  /**
   * Decrement the guest count for a specific group by 1.
   * Convenience method for single guest deletions.
   *
   * @param groupId - The ID of the group to update
   */
  const decrementGroupGuestCount = (groupId: number) => {
    incrementGroupGuestCount(groupId, -1)
  }

  return {
    groups,
    loadingGroups,
    expandedGroups,
    loadGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    toggleGroupExpansion,
    isGroupExpanded,
    incrementGroupGuestCount,
    decrementGroupGuestCount,
  }
}
