/**
 * Composable for managing collaborator role editing
 *
 * Provides functionality for editing, saving, and canceling role changes
 * for event collaborators. Extracted from EventCollaboratorsTab.vue for
 * better maintainability and reusability.
 */

import { ref, type Ref } from 'vue'
import { eventsService, type EventCollaborator } from '@/services/api'

/**
 * Message object for user feedback
 */
interface Message {
  type: 'success' | 'error'
  text: string
}

/**
 * Options for role management composable
 */
interface UseCollaboratorRoleOptions {
  eventId: string
  onMessage: (type: 'success' | 'error', text: string) => void
  onRoleUpdated: (collaborator: EventCollaborator) => void
}

/**
 * Return type for useCollaboratorRole composable
 */
interface UseCollaboratorRoleReturn {
  editingRole: Ref<number | null>
  tempRole: Ref<'admin' | 'editor' | 'viewer'>
  isUpdatingRole: Ref<boolean>
  startRoleEdit: (collaborator: EventCollaborator) => void
  cancelRoleEdit: () => void
  saveRoleUpdate: (collaborator: EventCollaborator) => Promise<void>
}

/**
 * Composable for managing collaborator role editing
 *
 * @param options - Configuration options
 * @returns Role management functions and state
 */
export function useCollaboratorRole(options: UseCollaboratorRoleOptions): UseCollaboratorRoleReturn {
  const { eventId, onMessage, onRoleUpdated } = options

  // State
  const editingRole = ref<number | null>(null)
  const tempRole = ref<'admin' | 'editor' | 'viewer'>('editor')
  const isUpdatingRole = ref(false)

  /**
   * Start editing a collaborator's role
   *
   * @param collaborator - The collaborator whose role to edit
   */
  const startRoleEdit = (collaborator: EventCollaborator): void => {
    editingRole.value = collaborator.id
    tempRole.value = collaborator.role
  }

  /**
   * Cancel role editing and reset state
   */
  const cancelRoleEdit = (): void => {
    editingRole.value = null
    tempRole.value = 'editor'
  }

  /**
   * Save role changes to the server
   *
   * @param collaborator - The collaborator to update
   */
  const saveRoleUpdate = async (collaborator: EventCollaborator): Promise<void> => {
    // No changes, just cancel
    if (tempRole.value === collaborator.role) {
      cancelRoleEdit()
      return
    }

    isUpdatingRole.value = true
    try {
      const response = await eventsService.updateCollaborator(eventId, collaborator.id, {
        role: tempRole.value,
      })

      if (response.success && response.data) {
        onMessage('success', `Role updated to ${tempRole.value}`)
        onRoleUpdated(response.data)
        cancelRoleEdit()
      } else {
        onMessage('error', response.message || 'Failed to update collaborator role')
      }
    } catch (error) {
      console.error('Error updating collaborator role:', error)
      onMessage('error', 'Failed to update collaborator role. Please try again.')
    } finally {
      isUpdatingRole.value = false
    }
  }

  return {
    editingRole,
    tempRole,
    isUpdatingRole,
    startRoleEdit,
    cancelRoleEdit,
    saveRoleUpdate,
  }
}
