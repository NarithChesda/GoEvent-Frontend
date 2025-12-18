/**
 * Registration Management Composable
 *
 * Handles registration data fetching, check-in operations, and live updates.
 * This composable manages all registration-related state and API interactions.
 *
 * @example
 * const { registrations, loading, loadRegistrations, performCheckin } = useRegistrations(eventId)
 */

import { ref, onUnmounted, watch } from 'vue'
import {
  eventsService,
  type EventRegistration,
  type EventRegistrationDetail,
} from '../../services/api'

export interface UseRegistrationsOptions {
  /** Initial registrations from props (optional) */
  initialRegistrations?: EventRegistrationDetail[]
  /** Enable live updates on mount */
  enableLiveUpdates?: boolean
  /** Live update interval in milliseconds (default: 10000) */
  liveUpdateInterval?: number
}

export function useRegistrations(eventId: string, options: UseRegistrationsOptions = {}) {
  const {
    initialRegistrations,
    enableLiveUpdates = false,
    liveUpdateInterval = 10000,
  } = options

  // State
  const registrations = ref<EventRegistrationDetail[]>(initialRegistrations || [])
  const loading = ref(false)
  const lastUpdated = ref<Date | null>(null)
  const liveUpdates = ref(enableLiveUpdates)
  const rowChecking = ref<Record<string, boolean>>({})

  // Live updates interval
  let liveInterval: number | undefined

  /**
   * Load registrations from API
   * @param forceRefresh - Force refresh from API even if we have data
   */
  const loadRegistrations = async (forceRefresh = false): Promise<void> => {
    // If we have initial registrations and not forcing refresh, use them
    if (initialRegistrations && !forceRefresh && registrations.value.length > 0) {
      return
    }

    loading.value = true
    try {
      const response = await eventsService.getEventRegistrations(eventId)

      if (response.success && response.data) {
        // Handle both paginated response and direct array response
        const registrationData = Array.isArray(response.data)
          ? response.data
          : (response.data.results || [])

        registrations.value = registrationData.map((reg: EventRegistration) => ({
          id: reg.id,
          user: reg.user,
          user_details: reg.user_details || {
            id: reg.user,
            username: 'Unknown',
            email: '',
            first_name: '',
            last_name: '',
          },
          status: reg.status,
          guest_count: reg.guest_count,
          total_attendees: reg.total_attendees,
          confirmation_code: reg.confirmation_code,
          registered_at: reg.registered_at,
          checked_in_at: reg.checked_in_at,
          notes: reg.notes,
        }))
        lastUpdated.value = new Date()
      }
    } catch (error) {
      console.error('Error loading registrations:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * Perform check-in using confirmation code
   * @param confirmationCode - The confirmation code to check in
   * @returns Success status and message
   */
  const performCheckin = async (confirmationCode: string): Promise<{ success: boolean; message: string }> => {
    if (!confirmationCode.trim()) {
      return { success: false, message: 'Confirmation code is required' }
    }

    try {
      const response = await eventsService.adminCheckin(eventId, confirmationCode.trim())

      if (response.success) {
        // Reload registrations to reflect the change
        await loadRegistrations(true)
        return { success: true, message: 'Attendee checked in successfully!' }
      } else {
        // Handle specific error messages
        const errorMsg = response.message || 'Failed to check in attendee'

        if (errorMsg.toLowerCase().includes('already checked in') ||
            errorMsg.toLowerCase().includes('already check in')) {
          return { success: false, message: 'This attendee is already checked in' }
        } else if (errorMsg.toLowerCase().includes('not found') ||
                   errorMsg.toLowerCase().includes('invalid')) {
          return { success: false, message: 'Invalid confirmation code. Please check and try again.' }
        }
        return { success: false, message: errorMsg }
      }
    } catch (error: any) {
      console.error('Error checking in attendee:', error)

      if (error?.response?.status === 404) {
        return { success: false, message: 'Confirmation code not found or attendee already checked in' }
      } else if (error?.response?.status === 400) {
        return { success: false, message: error?.response?.data?.message || 'Invalid confirmation code' }
      }
      return { success: false, message: 'An error occurred during check-in. Please try again.' }
    }
  }

  /**
   * Perform inline row check-in for a specific registration
   * @param registration - The registration to check in
   * @returns Success status and message
   */
  const performRowCheckin = async (registration: EventRegistrationDetail): Promise<{ success: boolean; message: string }> => {
    if (!registration?.confirmation_code) {
      return { success: false, message: 'No confirmation code available' }
    }

    rowChecking.value[registration.id] = true

    try {
      const response = await eventsService.adminCheckin(
        eventId,
        registration.confirmation_code.trim(),
      )

      if (response.success) {
        // Optimistically update the row to reduce flicker
        const idx = registrations.value.findIndex((r) => r.id === registration.id)
        if (idx !== -1) {
          registrations.value[idx] = {
            ...registrations.value[idx],
            status: 'checked_in',
            checked_in_at: new Date().toISOString(),
          }
        }
        return { success: true, message: 'Attendee checked in successfully!' }
      } else {
        return { success: false, message: response.message || 'Failed to check in attendee' }
      }
    } catch (error: any) {
      console.error('Error checking in attendee:', error)
      return { success: false, message: 'An error occurred during check-in. Please try again.' }
    } finally {
      rowChecking.value[registration.id] = false
    }
  }

  /**
   * Check if a specific row is currently being checked in
   */
  const isRowChecking = (registrationId: string): boolean => {
    return rowChecking.value[registrationId] === true
  }

  /**
   * Update registrations from external source (e.g., props)
   */
  const setRegistrations = (newRegistrations: EventRegistrationDetail[]) => {
    registrations.value = newRegistrations
  }

  /**
   * Toggle live updates
   */
  const toggleLiveUpdates = (enabled?: boolean) => {
    liveUpdates.value = enabled !== undefined ? enabled : !liveUpdates.value
  }

  // Watch for live updates changes
  watch(
    () => liveUpdates.value,
    (newVal) => {
      if (newVal) {
        // Immediate refresh on enable
        loadRegistrations(true)
        liveInterval = window.setInterval(() => {
          loadRegistrations(true)
        }, liveUpdateInterval)
      } else if (liveInterval) {
        window.clearInterval(liveInterval)
        liveInterval = undefined
      }
    },
  )

  // Cleanup on unmount
  onUnmounted(() => {
    if (liveInterval) {
      window.clearInterval(liveInterval)
    }
  })

  return {
    // State
    registrations,
    loading,
    lastUpdated,
    liveUpdates,
    rowChecking,

    // Methods
    loadRegistrations,
    performCheckin,
    performRowCheckin,
    isRowChecking,
    setRegistrations,
    toggleLiveUpdates,
  }
}
