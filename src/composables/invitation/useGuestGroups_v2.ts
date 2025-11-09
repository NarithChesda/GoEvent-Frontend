/**
 * Guest Groups Composable (V2 - Store-based)
 *
 * This is a thin wrapper around the Pinia store that maintains
 * backward compatibility with the old composable API while
 * eliminating state management complexity.
 *
 * @example
 * const { groups, loadGroups, createGroup } = useGuestGroups(eventId)
 */

import { useGuestManagementStore } from '../../stores/guestManagement'
import { storeToRefs } from 'pinia'

export function useGuestGroups(eventId: string) {
  const store = useGuestManagementStore()

  // Extract reactive refs from store
  const { groups, loadingGroups } = storeToRefs(store)

  // Wrap store actions with eventId pre-filled
  const loadGroups = async () => {
    return store.loadGroups(eventId)
  }

  const createGroup = async (data: Parameters<typeof store.createGroup>[1]) => {
    return store.createGroup(eventId, data)
  }

  const updateGroup = async (groupId: number, data: Parameters<typeof store.updateGroup>[2]) => {
    return store.updateGroup(eventId, groupId, data)
  }

  const deleteGroup = async (groupId: number) => {
    return store.deleteGroup(eventId, groupId)
  }

  // Direct pass-through (no eventId needed)
  const toggleGroupExpansion = (groupId: number) => {
    return store.toggleGroupExpansion(groupId)
  }

  const isGroupExpanded = (groupId: number) => {
    return store.isGroupExpanded(groupId)
  }

  // Deprecated methods (maintained for backward compatibility)
  const incrementGroupGuestCount = (groupId: number, delta: number = 1) => {
    console.warn('incrementGroupGuestCount is deprecated - counts are now managed automatically by the store')
    // No-op: store handles this internally
  }

  const decrementGroupGuestCount = (groupId: number) => {
    console.warn('decrementGroupGuestCount is deprecated - counts are now managed automatically by the store')
    // No-op: store handles this internally
  }

  return {
    // State
    groups,
    loadingGroups,
    expandedGroups: storeToRefs(store).groups, // Kept for compatibility

    // Actions
    loadGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    toggleGroupExpansion,
    isGroupExpanded,

    // Deprecated (no-ops)
    incrementGroupGuestCount,
    decrementGroupGuestCount,
  }
}
