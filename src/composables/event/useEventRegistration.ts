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

/**
 * The outcome of a registration action, for the caller to surface.
 *
 * `message` carries the API layer's user-friendly text when there is one; the
 * caller falls back to its own copy when there isn't.
 */
export interface RegistrationResult {
  ok: boolean
  message?: string
}


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

  /**
   * Move the attendee count by one, locally.
   *
   * The count feeds the hero's "312 going", the stats strip's spots-left and
   * `isEventFull`, so leaving it stale after the reader registers means the
   * panel contradicts itself until something re-fetches. Applied optimistically
   * and then reconciled by the caller's silent refresh.
   */
  const nudgeAttendance = (delta: number) => {
    const current = options.event.value
    if (!current) return
    current.registrations_count = Math.max((current.registrations_count || 0) + delta, 0)
  }

  /**
   * Register, and reflect it locally straight away.
   *
   * Returns the outcome rather than swallowing it: a failed registration used
   * to reach the console and nowhere else, so the reader saw the spinner stop
   * and nothing else change, with no way to tell a rejection from a no-op.
   */
  const handleRegister = async (): Promise<RegistrationResult> => {
    if (!options.event.value || !authStore.isAuthenticated) {
      return { ok: false }
    }

    isRegistering.value = true

    try {
      const response = await eventsService.registerForEvent(options.event.value.id, {
        guest_count: 0,
        notes: '',
      })

      if (response.success && response.data) {
        options.userRegistration.value = response.data
        options.registrationChecked.value = true
        nudgeAttendance(1)
        return { ok: true }
      }

      return { ok: false, message: response.message }
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : undefined }
    } finally {
      isRegistering.value = false
    }
  }

  const handleCancelRegistration = async (): Promise<RegistrationResult> => {
    if (!options.event.value || !authStore.isAuthenticated) {
      return { ok: false }
    }

    const wasRegistered = options.isUserRegistered.value
    isCancelling.value = true

    try {
      const response = await eventsService.unregisterFromEvent(options.event.value.id)

      if (response.success) {
        // The backend either returns the updated registration — wrapped as
        // `{ registration }` or bare — or nothing at all when the row is
        // deleted outright.
        options.userRegistration.value = response.data
          ? (response.data as { registration?: EventRegistration }).registration || response.data
          : null

        // So `isUserRegistered` trusts the state we just set rather than
        // falling back to the event payload's stale `is_registered`.
        options.registrationChecked.value = true

        if (wasRegistered && !options.isUserRegistered.value) nudgeAttendance(-1)
        return { ok: true }
      }

      return { ok: false, message: response.message }
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : undefined }
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
