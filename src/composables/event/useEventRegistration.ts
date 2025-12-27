/**
 * useEventRegistration.ts
 *
 * Composable for managing event registration logic in PublicEventDrawer.
 * Handles registration, cancellation, and related state management.
 *
 * @module composables/event/useEventRegistration
 */

import { ref, computed, type Ref } from 'vue'
import { eventsService, type Event, type EventRegistration } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

interface UseEventRegistrationOptions {
  event: Ref<Event | null>
  isUserRegistered: Ref<boolean>
  isEventFull: Ref<boolean>
  isRegistrationClosed: Ref<boolean>
  userRegistration: Ref<EventRegistration | null>
  registrationChecked: Ref<boolean>
}

// Statuses that mean user is NOT actively registered/attending (lowercase for comparison)
const NON_ATTENDING_STATUSES = ['not_coming', 'declined', 'cancelled', 'withdrawn', 'no']

export function useEventRegistration(options: UseEventRegistrationOptions) {
  const authStore = useAuthStore()

  const isRegistering = ref(false)
  const isCancelling = ref(false)

  const canRegister = computed(() => {
    if (!options.event.value || !authStore.isAuthenticated) return false
    if (options.isUserRegistered.value || options.event.value.is_past) return false
    if (!options.event.value.registration_required) return false
    if (options.isEventFull.value || options.isRegistrationClosed.value) return false
    return true
  })

  const registrationMessage = computed(() => {
    if (!options.event.value?.registration_required) return ''
    if (options.isUserRegistered.value) return 'You are registered for this event.'
    if (options.isEventFull.value) return 'This event has reached capacity.'
    if (options.isRegistrationClosed.value) return 'Registration for this event has closed.'
    return 'Welcome! To join the event, please register below.'
  })

  const handleRegister = async (onSuccess?: () => void) => {
    if (!options.event.value || !authStore.isAuthenticated) return

    isRegistering.value = true

    try {
      const response = await eventsService.registerForEvent(options.event.value.id, {
        guest_count: 0,
        notes: '',
      })

      if (response.success && response.data) {
        // Update local registration state with the returned registration data
        options.userRegistration.value = response.data
        if (onSuccess) onSuccess()
      }
    } catch (err) {
      console.error('Registration failed:', err)
    } finally {
      isRegistering.value = false
    }
  }

  const handleCancelRegistration = async () => {
    if (!options.event.value || !authStore.isAuthenticated) return

    isCancelling.value = true

    try {
      const response = await eventsService.unregisterFromEvent(options.event.value.id)

      console.log('Unregister response:', response)

      if (response.success) {
        // Handle the response - backend may return updated registration or nothing
        if (response.data) {
          // Backend returns wrapped response { registration } or direct registration object
          const registrationData =
            (response.data as { registration?: EventRegistration }).registration || response.data

          console.log('Registration data after cancel:', registrationData)
          console.log('Registration status:', registrationData.status)

          // Store the updated registration data
          options.userRegistration.value = registrationData
        } else {
          console.log('No registration data returned - registration deleted')
          // No registration data returned - registration was deleted
          options.userRegistration.value = null
        }

        // Ensure registrationChecked is true so isUserRegistered uses our updated state
        options.registrationChecked.value = true
        console.log('isUserRegistered after cancel:', options.isUserRegistered.value)
      }
    } catch (err) {
      console.error('Cancel registration failed:', err)
    } finally {
      isCancelling.value = false
    }
  }

  return {
    isRegistering,
    isCancelling,
    canRegister,
    registrationMessage,
    handleRegister,
    handleCancelRegistration,
  }
}
