import { ref, type Ref } from 'vue'
import { agendaService, type EventAgendaItem } from '@/services/api'
import { NO_DATE_SENTINEL, isUnscheduled, toApiDate } from '@/constants/agenda'

export interface DateGroupInfo {
  date: string
  itemCount: number
}

export interface UseDateGroupOperationsOptions {
  eventId: Ref<string> | string
  agendaItems: Ref<EventAgendaItem[]>
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
  expandedDates?: Ref<Set<string>> | Ref<string[]>
}

/**
 * Composable for managing bulk date group operations on agenda items.
 * Handles editing date for all items in a group and deleting all items in a group.
 */
export function useDateGroupOperations(options: UseDateGroupOperationsOptions) {
  const { agendaItems, onSuccess, onError, expandedDates } = options

  // Get eventId as string (handles both Ref and string)
  const getEventId = () => {
    return typeof options.eventId === 'string' ? options.eventId : options.eventId.value
  }

  // Edit modal state
  const showEditDateGroupModal = ref(false)
  const dateGroupToEdit = ref<DateGroupInfo | null>(null)
  const newDateForGroup = ref('')
  const isUpdatingDateGroup = ref(false)

  // Delete modal state
  const showDeleteDateGroupModal = ref(false)
  const dateGroupToDelete = ref<DateGroupInfo | null>(null)
  const isDeletingDateGroup = ref(false)

  /**
   * Open the edit date group modal
   */
  const openEditDateGroupModal = (date: string, itemCount: number) => {
    dateGroupToEdit.value = { date, itemCount }
    // Pre-fill with current date if it's a valid date
    newDateForGroup.value = isUnscheduled(date) ? '' : date
    showEditDateGroupModal.value = true
  }

  /**
   * Close the edit date group modal and reset state
   */
  const closeEditDateGroupModal = () => {
    showEditDateGroupModal.value = false
    dateGroupToEdit.value = null
    newDateForGroup.value = ''
  }

  /**
   * Update the date for all items in a date group
   */
  const updateDateGroup = async () => {
    if (!dateGroupToEdit.value || !newDateForGroup.value) return

    isUpdatingDateGroup.value = true
    try {
      const oldDate = toApiDate(dateGroupToEdit.value.date)
      const response = await agendaService.bulkUpdateDate(
        getEventId(),
        oldDate,
        newDateForGroup.value
      )

      if (response.success) {
        // Update local state - change date for all items with the old date
        agendaItems.value = agendaItems.value.map((item) => {
          const itemDate = item.date || null
          if (itemDate === oldDate) {
            return { ...item, date: newDateForGroup.value, date_text: '' }
          }
          return item
        })

        // Auto-expand the new date group if expandedDates is provided
        if (expandedDates) {
          const newDate = newDateForGroup.value
          if (expandedDates.value instanceof Set) {
            expandedDates.value.add(newDate)
          } else if (Array.isArray(expandedDates.value)) {
            if (!expandedDates.value.includes(newDate)) {
              expandedDates.value.push(newDate)
            }
          }
        }

        const count = response.data?.count || dateGroupToEdit.value.itemCount
        onSuccess?.(`Successfully moved ${count} items to new date`)
        closeEditDateGroupModal()
      } else {
        onError?.(response.message || 'Failed to update date group')
      }
    } catch (error) {
      console.error('Error updating date group:', error)
      onError?.('An error occurred while updating the date group')
    } finally {
      isUpdatingDateGroup.value = false
    }
  }

  /**
   * Open the delete date group modal
   */
  const openDeleteDateGroupModal = (date: string, itemCount: number) => {
    dateGroupToDelete.value = { date, itemCount }
    showDeleteDateGroupModal.value = true
  }

  /**
   * Close the delete date group modal and reset state
   */
  const closeDeleteDateGroupModal = () => {
    showDeleteDateGroupModal.value = false
    dateGroupToDelete.value = null
  }

  /**
   * Delete all items in a date group
   */
  const deleteDateGroup = async () => {
    if (!dateGroupToDelete.value) return

    isDeletingDateGroup.value = true
    try {
      const dateToDelete = toApiDate(dateGroupToDelete.value.date)
      const response = await agendaService.bulkDeleteByDate(getEventId(), dateToDelete)

      if (response.success) {
        // Remove all items with the deleted date from local state
        agendaItems.value = agendaItems.value.filter((item) => {
          const itemDate = item.date || null
          return itemDate !== dateToDelete
        })

        const count = response.data?.count || dateGroupToDelete.value.itemCount
        onSuccess?.(`Successfully deleted ${count} agenda items`)
        closeDeleteDateGroupModal()
      } else {
        onError?.(response.message || 'Failed to delete date group')
      }
    } catch (error) {
      console.error('Error deleting date group:', error)
      onError?.('An error occurred while deleting the date group')
    } finally {
      isDeletingDateGroup.value = false
    }
  }

  return {
    // Edit modal
    showEditDateGroupModal,
    dateGroupToEdit,
    newDateForGroup,
    isUpdatingDateGroup,
    openEditDateGroupModal,
    closeEditDateGroupModal,
    updateDateGroup,

    // Delete modal
    showDeleteDateGroupModal,
    dateGroupToDelete,
    isDeletingDateGroup,
    openDeleteDateGroupModal,
    closeDeleteDateGroupModal,
    deleteDateGroup,

    // Re-export constants for convenience
    NO_DATE_SENTINEL,
    isUnscheduled,
  }
}
