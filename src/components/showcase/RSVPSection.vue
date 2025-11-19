<template>
  <!-- Hide entire RSVP section for past events -->
  <div v-if="eventStatus !== 'ended'" id="rsvp" class="space-y-3">
    <!-- RSVP Header -->
    <div class="text-sm sm:text-base font-medium leading-snug">
      <span
        :class="['text-white', currentLanguage === 'kh' && 'khmer-text-fix']"
        :style="{
          fontFamily: secondaryFont || currentFont,
        }"
      >
        {{ rsvpHeaderText }}
      </span>
    </div>

    <!-- RSVP Content -->
    <div class="rsvp-content">
      <!-- Not Authenticated: Single Sign In Button -->
      <button
        v-if="!isUserAuthenticated"
        @click="handleSignInClick"
        class="rsvp-btn-signin"
        :style="{
          fontFamily: secondaryFont || currentFont,
          background: 'white',
          color: backgroundColor || primaryColor,
        }"
      >
        <svg class="signin-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
        </svg>
        {{ rsvpSignInButtonText }}
      </button>

      <!-- Loading State -->
      <div v-else-if="isUserAuthenticated && isLoading" class="rsvp-loader">
        <div class="spinner-white"></div>
      </div>

      <!-- Authenticated: RSVP Section -->
      <div v-else-if="isUserAuthenticated" class="rsvp-section-wrapper">
        <!-- Main Row: Toggle Switch + Guest Counter -->
        <div class="rsvp-main-row">
          <!-- Toggle Switch with Label -->
          <div class="toggle-container">
            <span
              class="toggle-label"
              :style="{
                fontFamily: secondaryFont || currentFont,
                opacity: rsvpStatus === 'not_coming' ? 1 : 0.6
              }"
            >
              {{ rsvpCantAttendText }}
            </span>

            <button
              @click="setRSVPStatus(rsvpStatus === 'coming' ? 'not_coming' : 'coming')"
              :disabled="isSubmitting"
              class="toggle-switch"
              :class="{ 'active': rsvpStatus === 'coming' }"
              :style="{
                background: rsvpStatus === 'coming' ? 'white' : 'rgba(255, 255, 255, 0.3)',
              }"
            >
              <span
                class="toggle-thumb"
                :style="{
                  background: rsvpStatus === 'coming' ? (backgroundColor || primaryColor) : 'white',
                  transform: rsvpStatus === 'coming' ? 'translateX(1.25rem)' : 'translateX(0)'
                }"
              ></span>
            </button>

            <span
              class="toggle-label"
              :style="{
                fontFamily: secondaryFont || currentFont,
                opacity: rsvpStatus === 'coming' ? 1 : 0.6
              }"
            >
              {{ rsvpAttendingText }}
            </span>
          </div>

          <!-- Guest Counter (only when attending) -->
          <div v-if="rsvpStatus === 'coming'" class="stepper-container">
            <span class="stepper-label" :style="{ fontFamily: secondaryFont || currentFont }">
              {{ rsvpTotalAttendingText }}
            </span>

            <div class="stepper-controls">
              <button
                @click="decreaseGuestCount"
                :disabled="additionalGuests <= 0 || isUpdatingGuestCount"
                class="stepper-btn"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6H10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>

              <span class="stepper-value" :style="{ fontFamily: secondaryFont || currentFont }">
                {{ totalAttendees }}
              </span>

              <button
                @click="increaseGuestCount"
                :disabled="additionalGuests >= 10 || isUpdatingGuestCount"
                class="stepper-btn"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 2V10M2 6H10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Confirmation Code (separate row) -->
        <div v-if="confirmationCode && rsvpStatus === 'coming'" class="confirmation-chip">
          <span class="confirmation-text" :style="{ fontFamily: secondaryFont || currentFont }">
            {{ rsvpConfirmationText }}
          </span>
          <strong class="confirmation-code-text">
            {{ confirmationCode }}
          </strong>
        </div>
      </div>

      <!-- Minimal Status Messages -->
      <div v-if="successMessage || errorMessage" class="rsvp-message">
        <span v-if="successMessage" class="message-text success">
          ✓ {{ successMessage }}
        </span>
        <span v-if="errorMessage" class="message-text error">
          ✕ {{ errorMessage }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { eventsService, type EventRegistration } from '../../services/api'
import type { EventText } from '../../composables/useEventShowcase'
import {
  translateRSVP,
  getPersonUnit,
  type SupportedLanguage,
} from '../../utils/translations'
import { useAuthModal } from '../../composables/useAuthModal'

interface Props {
  eventId: string
  eventStartDate?: string
  eventEndDate?: string
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  backgroundColor?: string
  isEventPast?: boolean
  eventTexts?: EventText[]
  currentLanguage?: string
  currentFont?: string
  primaryFont?: string
  secondaryFont?: string
  eventType?: string  // Event category name for dynamic RSVP header
}

const props = defineProps<Props>()

// Emit for auth modal control
const emit = defineEmits<{
  showAuthModal: []
}>()

// Auth
const authStore = useAuthStore()

// Auth modal composable
const { withAuth } = useAuthModal()

// State - Default to 'not_coming' for users without registration
const rsvpStatus = ref<'coming' | 'not_coming' | null>('not_coming')
const additionalGuests = ref(0)

// API Registration State
const currentRegistration = ref<EventRegistration | null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const isUpdatingGuestCount = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Guest count save management
let guestCountUpdateTimeout: ReturnType<typeof setTimeout> | null = null
const hasUnsavedGuestChanges = ref(false)
const savedGuestCount = ref(0) // Track last saved count

// Computed Properties

const isUserAuthenticated = computed(() => {
  return authStore.isAuthenticated
})

const eventStatus = computed(() => {
  if (!props.eventStartDate || !props.eventEndDate) {
    return 'upcoming' // Default to upcoming if dates not available
  }

  const now = new Date()
  const startDate = new Date(props.eventStartDate)
  const endDate = new Date(props.eventEndDate)

  if (now >= endDate) return 'ended'
  if (now >= startDate && now < endDate) return 'ongoing'
  return 'upcoming'
})

const totalAttendees = computed(() => {
  return rsvpStatus.value === 'coming' ? 1 + additionalGuests.value : 0
})

const confirmationCode = computed(() => {
  return currentRegistration.value?.confirmation_code || null
})

// Enhanced translation function that combines database content with frontend translations
const getTextContent = (textType: string, fallback = ''): string => {
  // First, try to get content from database (eventTexts)
  if (props.eventTexts && props.currentLanguage) {
    const text = props.eventTexts.find(
      (text) => text.text_type === textType && text.language === props.currentLanguage,
    )
    if (text?.content) {
      return text.content
    }
  }

  // Fallback to frontend translation system
  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'

  // Map text types to translation keys
  const keyMap: Record<
    string,
    keyof typeof import('../../utils/translations').rsvpTranslations.en
  > = {
    rsvp_header: 'rsvp_header',
    rsvp_header_birthday: 'rsvp_header_birthday',
    rsvp_header_default: 'rsvp_header_default',
    rsvp_yes_button: 'rsvp_yes_button',
    rsvp_no_button: 'rsvp_no_button',
    rsvp_attending: 'rsvp_attending',
    rsvp_cant_attend: 'rsvp_cant_attend',
    rsvp_sign_in: 'rsvp_sign_in',
    rsvp_sign_in_button: 'rsvp_sign_in_button',
    rsvp_additional_guests: 'rsvp_additional_guests',
    rsvp_total_attending: 'rsvp_total_attending',
    rsvp_person: 'rsvp_person',
    rsvp_people: 'rsvp_people',
    rsvp_thank_you: 'rsvp_thank_you',
    rsvp_status_live: 'rsvp_status_live',
    rsvp_status_ended: 'rsvp_status_ended',
    rsvp_loading_status: 'rsvp_loading_status',
    rsvp_registering: 'rsvp_registering',
    rsvp_updating: 'rsvp_updating',
    rsvp_saving: 'rsvp_saving',
    rsvp_unsaved_changes: 'rsvp_unsaved_changes',
    rsvp_save_now: 'rsvp_save_now',
    rsvp_auto_save: 'rsvp_auto_save',
    rsvp_seconds: 'rsvp_seconds',
    rsvp_days: 'rsvp_days',
    rsvp_hours: 'rsvp_hours',
    rsvp_confirmation: 'rsvp_confirmation',
    rsvp_dismiss: 'rsvp_dismiss',
  }

  const translationKey = keyMap[textType]
  if (translationKey) {
    return translateRSVP(translationKey, currentLang)
  }

  return fallback
}

// RSVP-related text content computed properties
const rsvpHeaderText = computed(() => {
  // Determine which header to use based on event type
  const eventType = props.eventType?.toLowerCase() || 'default'

  // Map event types to translation keys (similar to AgendaSection)
  const headerKeyMap: Record<string, string> = {
    'wedding': 'rsvp_header',
    'birthday': 'rsvp_header_birthday',
    'birthday party': 'rsvp_header_birthday',
    'default': 'rsvp_header_default',
  }

  // Select the appropriate header key, defaulting to 'rsvp_header_default' for unknown types
  const headerKey = headerKeyMap[eventType] || 'rsvp_header_default'

  // Fallback text based on event type
  const fallbackMap: Record<string, string> = {
    'rsvp_header': 'Will you attend our wedding?',
    'rsvp_header_birthday': 'Will you join our birthday party?',
    'rsvp_header_default': 'Will you attend our event?',
  }

  return getTextContent(headerKey, fallbackMap[headerKey] || 'Will you attend our event?')
})

const rsvpAttendingText = computed(() => getTextContent('rsvp_attending', 'Attending'))

const rsvpCantAttendText = computed(() => getTextContent('rsvp_cant_attend', "Can't attend"))

const rsvpSignInButtonText = computed(() =>
  getTextContent('rsvp_sign_in_button', 'Sign In to RSVP'),
)

const rsvpTotalAttendingText = computed(() =>
  getTextContent('rsvp_total_attending', 'Total attending'),
)

const rsvpConfirmationText = computed(() => getTextContent('rsvp_confirmation', 'Confirmation:'))

// API Methods
const loadCurrentRegistration = async () => {
  if (!authStore.isAuthenticated || !props.eventId) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await eventsService.getMyRegistration(props.eventId)

    if (response.success && response.data) {
      currentRegistration.value = response.data

      // Update UI state based on registration status
      // Map backend status to UI state
      // Backend uses: 'registered', 'confirmed', 'coming', 'not_coming', 'declined', 'pending'
      if (response.data.status === 'not_coming' || response.data.status === 'declined') {
        // User explicitly marked as not attending
        rsvpStatus.value = 'not_coming'
        additionalGuests.value = 0
        savedGuestCount.value = 0
      } else if (response.data.status === 'registered' || response.data.status === 'confirmed' ||
                 response.data.status === 'coming' || response.data.status === 'pending') {
        // User is attending (registered, confirmed, coming, or pending)
        rsvpStatus.value = 'coming'
        additionalGuests.value = response.data.guest_count || 0
        savedGuestCount.value = response.data.guest_count || 0
      } else {
        // Unknown status - default to not attending for safety
        rsvpStatus.value = 'not_coming'
        additionalGuests.value = 0
        savedGuestCount.value = 0
      }
      hasUnsavedGuestChanges.value = false
    } else {
      // User has no registration record - default to "not attending" state
      currentRegistration.value = null
      rsvpStatus.value = 'not_coming'
      additionalGuests.value = 0
      savedGuestCount.value = 0
      hasUnsavedGuestChanges.value = false
    }
  } catch (error) {
    // Error loading registration - treat as not attending
    currentRegistration.value = null
    rsvpStatus.value = 'not_coming'
    additionalGuests.value = 0
    savedGuestCount.value = 0
    hasUnsavedGuestChanges.value = false
  } finally {
    isLoading.value = false
  }
}

const submitRSVP = async (status: 'coming' | 'not_coming') => {
  if (!authStore.isAuthenticated || !props.eventId) return

  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    let response

    if (status === 'not_coming') {
      // When user selects "not attending", use unregister endpoint
      response = await eventsService.unregisterFromEvent(props.eventId)
    } else {
      // When user selects "attending", use RSVP endpoint
      const requestData: { guest_count: number; notes: string; status?: string } = {
        guest_count: additionalGuests.value,
        notes: currentRegistration.value?.notes || '',
        status: 'confirmed',
      }
      response = await eventsService.rsvpForEvent(props.eventId, requestData)
    }

    if (response.success && response.data) {
      // Preserve confirmation code if it exists and isn't in the new response
      const existingConfirmationCode = currentRegistration.value?.confirmation_code

      // FIX: Backend returns wrapped response { message, registration } for POST /rsvp/
      // but returns direct registration object for GET /my-registration/
      // Unwrap if needed to ensure consistent data structure
      const registrationData = (response.data as any).registration || response.data
      currentRegistration.value = registrationData

      // If response doesn't have confirmation code but we had one before, preserve it
      if (currentRegistration.value && !currentRegistration.value.confirmation_code && existingConfirmationCode) {
        currentRegistration.value = {
          ...currentRegistration.value,
          confirmation_code: existingConfirmationCode
        } as EventRegistration
      }

      // Update local rsvpStatus based on the actual registration data returned
      // Use the backend's status if available, otherwise use requested status
      const backendStatus = registrationData.status

      // Backend status values: 'registered', 'confirmed', 'coming', 'not_coming', 'declined', 'pending'
      if (backendStatus === 'not_coming' || backendStatus === 'declined') {
        rsvpStatus.value = 'not_coming'
      } else if (backendStatus === 'registered' || backendStatus === 'confirmed' ||
                 backendStatus === 'coming' || backendStatus === 'pending') {
        rsvpStatus.value = 'coming'
      } else {
        // Fallback to requested status if backend status is unknown
        rsvpStatus.value = status
      }

      if (rsvpStatus.value === 'coming') {
        const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
        const unit = getPersonUnit(registrationData.total_attendees, currentLang)
        successMessage.value = translateRSVP('rsvp_registration_success', currentLang, {
          count: registrationData.total_attendees,
          unit: unit,
        })
        savedGuestCount.value = additionalGuests.value
      } else if (rsvpStatus.value === 'not_coming') {
        // Status is 'not_coming' - registration still exists but status changed
        additionalGuests.value = 0
        savedGuestCount.value = 0
        const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
        successMessage.value = translateRSVP('rsvp_thank_you_simple', currentLang)
      }

      // Show success message temporarily
      setTimeout(() => {
        successMessage.value = ''
      }, 5000)
    } else {
      errorMessage.value = response.message || 'Failed to update RSVP'
      // Revert status on error
      if (currentRegistration.value) {
        rsvpStatus.value = currentRegistration.value.status === 'confirmed' || currentRegistration.value.status === 'coming'
          ? 'coming'
          : 'not_coming'
      } else {
        rsvpStatus.value = 'not_coming'
      }
    }
  } catch (error) {
    errorMessage.value = 'An unexpected error occurred. Please try again.'
    // Revert to previous state on error
    if (currentRegistration.value) {
      rsvpStatus.value = currentRegistration.value.status === 'confirmed' || currentRegistration.value.status === 'coming'
        ? 'coming'
        : 'not_coming'
    } else {
      rsvpStatus.value = 'not_coming'
    }
  } finally {
    isSubmitting.value = false
  }
}

// Methods
const handleSignInClick = () => {
  // Emit event to show auth modal instead of redirecting
  emit('showAuthModal')

  // Optionally, you can use withAuth if you want to perform an action after authentication
  // withAuth(() => {
  //   // This code will run after successful authentication
  //   console.log('User authenticated, can now RSVP')
  // })
}

const setRSVPStatus = async (status: 'coming' | 'not_coming') => {
  // Check authentication for "attending" status
  if (status === 'coming' && !authStore.isAuthenticated) {
    // Use withAuth to handle authentication and then submit RSVP
    withAuth(async () => {
      await submitRSVP(status)
    })
    // Also emit to show modal
    emit('showAuthModal')
    return
  }

  // Call API to save RSVP
  await submitRSVP(status)
}

const updateGuestCountInAPI = async () => {
  // Only update if user is registered and authenticated
  if (!currentRegistration.value || !authStore.isAuthenticated || isSubmitting.value) {
    return
  }

  isUpdatingGuestCount.value = true

  try {
    // Update registration with new guest count
    const response = await eventsService.rsvpForEvent(props.eventId, {
      guest_count: additionalGuests.value,
      notes: currentRegistration.value.notes || '',
    })

    if (response.success && response.data) {
      // Preserve confirmation code if it exists and isn't in the new response
      const existingConfirmationCode = currentRegistration.value?.confirmation_code

      // FIX: Backend returns wrapped response { message, registration } for POST /rsvp/
      // Unwrap if needed to ensure consistent data structure
      const registrationData = (response.data as any).registration || response.data
      currentRegistration.value = registrationData

      // If response doesn't have confirmation code but we had one before, preserve it
      if (currentRegistration.value && !currentRegistration.value.confirmation_code && existingConfirmationCode) {
        currentRegistration.value = {
          ...currentRegistration.value,
          confirmation_code: existingConfirmationCode
        } as EventRegistration
      }

      // Mark as saved
      savedGuestCount.value = additionalGuests.value
      hasUnsavedGuestChanges.value = false

      // Show brief success feedback
      const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
      const unit = getPersonUnit(registrationData.total_attendees, currentLang)
      successMessage.value = translateRSVP('rsvp_guest_update_success', currentLang, {
        count: registrationData.total_attendees,
        unit: unit,
      })
      setTimeout(() => {
        successMessage.value = ''
      }, 2000)
    }
  } catch {
    // Handle guest count update error
    // Show error for manual saves
    errorMessage.value = 'Failed to update guest count. Please try again.'
  } finally {
    isUpdatingGuestCount.value = false
  }
}

const saveGuestCountChanges = async () => {
  // Only save if there are actual changes
  if (!hasUnsavedGuestChanges.value || additionalGuests.value === savedGuestCount.value) {
    return
  }

  await updateGuestCountInAPI()
}

const debouncedUpdateGuestCount = () => {
  // Mark as having unsaved changes
  hasUnsavedGuestChanges.value = true

  // Clear existing timeout
  if (guestCountUpdateTimeout) {
    clearTimeout(guestCountUpdateTimeout)
  }

  // Set new timeout for debounced update (longer delay)
  guestCountUpdateTimeout = setTimeout(() => {
    saveGuestCountChanges()
  }, 2500) // Wait 2.5 seconds after last change
}

const increaseGuestCount = () => {
  if (additionalGuests.value < 10) {
    // Max 10 additional guests
    additionalGuests.value++
    // Debounced auto-save if user is already registered
    if (currentRegistration.value) {
      debouncedUpdateGuestCount()
    }
  }
}

const decreaseGuestCount = () => {
  if (additionalGuests.value > 0) {
    additionalGuests.value--
    // Debounced auto-save if user is already registered
    if (currentRegistration.value) {
      debouncedUpdateGuestCount()
    }
  }
}

// Save before page navigation/reload
const handleBeforeUnload = () => {
  if (hasUnsavedGuestChanges.value && !isUpdatingGuestCount.value) {
    // For synchronous save on page unload
    navigator.sendBeacon?.(
      '/api/events/' + props.eventId + '/rsvp/',
      JSON.stringify({
        guest_count: additionalGuests.value,
        notes: currentRegistration.value?.notes || '',
      }),
    )
  }
}

// Watchers
watch(
  () => authStore.isAuthenticated,
  (isAuth, oldValue) => {
    // Only load registration when auth state changes from false to true
    // This prevents duplicate loading since onMounted already loads it
    if (isAuth && !oldValue) {
      // User just logged in, load their registration status
      loadCurrentRegistration()
    } else if (!isAuth) {
      // User logged out, clear all registration state and default to not attending
      currentRegistration.value = null
      rsvpStatus.value = 'not_coming'
      additionalGuests.value = 0
      savedGuestCount.value = 0
      hasUnsavedGuestChanges.value = false
      errorMessage.value = ''
      successMessage.value = ''
    }
  },
)

// Lifecycle
onMounted(() => {
  // Load current registration if user is authenticated
  if (authStore.isAuthenticated) {
    loadCurrentRegistration()
  }

  // Add beforeunload listener for unsaved changes
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  // Clear guest count update timeout
  if (guestCountUpdateTimeout) {
    clearTimeout(guestCountUpdateTimeout)
  }

  // Remove beforeunload listener
  window.removeEventListener('beforeunload', handleBeforeUnload)

  // Save any pending changes before component unmounts
  if (hasUnsavedGuestChanges.value && !isUpdatingGuestCount.value) {
    // Quick save attempt
    saveGuestCountChanges()
  }
})
</script>

<style scoped>
/* Content Container */
.rsvp-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* RSVP Section Wrapper */
.rsvp-section-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
}

/* Main Row - Toggle + Guest Counter */
.rsvp-main-row {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Toggle Container */
.toggle-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: center;
}

.toggle-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  white-space: nowrap;
  transition: opacity 0.2s ease;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  width: 2.75rem;
  height: 1.5rem;
  border-radius: 0.75rem;
  border: none;
  cursor: pointer;
  transition: background 0.3s ease;
  padding: 0;
  flex-shrink: 0;
}

.toggle-switch:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toggle-thumb {
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease;
}

/* Sign In Button */
.rsvp-btn-signin {
  padding: 0.625rem 1.25rem;
  border-radius: 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid white;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.rsvp-btn-signin:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.rsvp-btn-signin:active {
  transform: scale(0.98);
}

.signin-icon {
  width: 1.125rem;
  height: 1.125rem;
}

/* Stepper Container */
.stepper-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stepper-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: white;
  white-space: nowrap;
}

.stepper-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stepper-btn {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  border: 1.5px solid white;
  background: transparent;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.stepper-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
}

.stepper-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.stepper-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.stepper-btn svg {
  flex-shrink: 0;
}

.stepper-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  min-width: 2rem;
  text-align: center;
}

/* Confirmation Chip */
.confirmation-chip {
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  border: 1.5px solid white;
}

.confirmation-text {
  font-size: 0.75rem;
  font-weight: 500;
  color: white;
}

.confirmation-code-text {
  font-family: 'Courier New', Courier, monospace;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-left: 0.25rem;
  color: white;
  font-size: 0.75rem;
}

/* Loading - White Spinner */
.rsvp-loader {
  display: flex;
  justify-content: center;
  padding: 0.5rem;
}

.spinner-white {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Status Messages */
.rsvp-message {
  display: flex;
  justify-content: center;
  padding: 0.5rem 0;
}

.message-text {
  font-size: 0.8125rem;
  font-weight: 500;
}

.message-text.success {
  color: #86efac;
}

.message-text.error {
  color: #fca5a5;
}

/* Khmer text fix now defined globally in src/assets/main.css */

/* Mobile Responsive */
@media (max-width: 639px) {
  .rsvp-main-row {
    gap: 0.75rem;
    flex-direction: column;
  }

  .toggle-container {
    gap: 0.5rem;
  }

  .toggle-label {
    font-size: 0.75rem;
  }

  .toggle-switch {
    width: 2.5rem;
    height: 1.375rem;
  }

  .toggle-thumb {
    width: 0.875rem;
    height: 0.875rem;
  }

  .rsvp-btn-signin {
    padding: 0.5rem 1rem;
    font-size: 0.8125rem;
    border-radius: 1.25rem;
  }

  .signin-icon {
    width: 1rem;
    height: 1rem;
  }

  .stepper-container {
    gap: 0.75rem;
    padding: 0.5rem 0.875rem;
  }

  .stepper-label {
    font-size: 0.75rem;
  }

  .stepper-controls {
    gap: 0.625rem;
  }

  .stepper-btn {
    width: 1.625rem;
    height: 1.625rem;
  }

  .stepper-value {
    font-size: 1rem;
    min-width: 1.75rem;
  }

  .confirmation-chip {
    padding: 0.5rem 0.875rem;
  }

  .confirmation-text {
    font-size: 0.6875rem;
  }
}

/* Very narrow screens */
@media (max-width: 360px) {
  .toggle-label {
    font-size: 0.6875rem;
  }

  .toggle-switch {
    width: 2.25rem;
    height: 1.25rem;
  }

  .stepper-container {
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
  }

  .stepper-label {
    font-size: 0.6875rem;
  }

  .stepper-controls {
    gap: 0.5rem;
  }

  .stepper-btn {
    width: 1.5rem;
    height: 1.5rem;
  }

  .stepper-value {
    font-size: 0.9375rem;
    min-width: 1.5rem;
  }
}

/* Tablet */
@media (min-width: 640px) and (max-width: 1023px) {
  .rsvp-btn-signin {
    padding: 0.625rem 1.125rem;
    font-size: 0.8125rem;
  }
}

/* Small laptops - Reduce all components by 20% except header text */
@media (min-width: 1024px) and (max-width: 1365px) {
  /* Toggle labels - match location text size */
  .toggle-label {
    font-size: 0.6rem; /* 9.6px - match location text size */
    line-height: 1rem;
  }

  .stepper-label {
    font-size: 0.6rem; /* 9.6px - match location text size */
    line-height: 1rem;
  }

  .stepper-value {
    font-size: 0.9rem; /* 14.4px - 20% smaller than 18px */
    min-width: 1.6rem; /* 20% smaller */
    line-height: 1rem;
  }

  .confirmation-text,
  .confirmation-code-text {
    font-size: 0.6rem; /* 9.6px - match location text size */
    line-height: 1rem;
  }

  /* Ensure confirmation chip has even padding */
  .confirmation-chip {
    display: flex;
    align-items: center;
    line-height: 1;
  }

  .message-text {
    font-size: 0.65rem; /* 10.4px - 20% smaller than 13px */
    line-height: 1rem;
  }

  .rsvp-btn-signin {
    padding: 0.5rem 1rem; /* 20% smaller padding */
    font-size: 0.7rem; /* 11.2px - 20% smaller than 14px */
    border-radius: 1.2rem; /* 20% smaller */
  }

  .signin-icon {
    width: 0.9rem; /* 14.4px - 20% smaller than 18px */
    height: 0.9rem;
  }

  /* Toggle switch - 20% reduction */
  .toggle-switch {
    width: 2.2rem; /* 20% smaller than 2.75rem */
    height: 1.2rem; /* 20% smaller than 1.5rem */
    border-radius: 0.6rem;
  }

  .toggle-thumb {
    width: 0.8rem; /* 20% smaller than 1rem */
    height: 0.8rem;
    top: 0.2rem;
    left: 0.2rem;
  }

  .toggle-thumb {
    transform: translateX(0) !important;
  }

  .toggle-switch.active .toggle-thumb {
    transform: translateX(1rem) !important; /* 20% smaller than 1.25rem */
  }

  /* Stepper buttons - 20% reduction */
  .stepper-btn {
    width: 1.4rem; /* 20% smaller than 1.75rem */
    height: 1.4rem;
    border-width: 1.2px; /* 20% smaller */
  }

  .stepper-btn svg {
    width: 9.6px; /* 20% smaller than 12px */
    height: 9.6px;
  }

  /* Spacing - 20% reduction */
  .rsvp-content {
    gap: 0.8rem; /* 20% smaller than 1rem */
  }

  .rsvp-section-wrapper {
    gap: 0.6rem; /* 20% smaller than 0.75rem */
  }

  .rsvp-main-row {
    gap: 1rem; /* 20% smaller than 1.25rem */
  }

  .toggle-container {
    gap: 0.6rem; /* 20% smaller than 0.75rem */
  }

  .stepper-container {
    gap: 0.8rem; /* 20% smaller than 1rem */
  }

  .stepper-controls {
    gap: 0.6rem; /* 20% smaller than 0.75rem */
  }

  /* Confirmation chip - 20% reduction */
  .confirmation-chip {
    padding: 0.4rem 0.8rem; /* 20% smaller than 0.5rem 1rem */
    border-radius: 0.8rem; /* 20% smaller */
    border-width: 1.2px; /* 20% smaller */
  }

  /* Override any default margin on confirmation chip */
  .rsvp-section-wrapper .confirmation-chip {
    margin-top: 0 !important;
  }

  /* Loader - 20% reduction */
  .spinner-white {
    width: 1rem; /* 20% smaller than 1.25rem */
    height: 1rem;
    border-width: 1.6px; /* 20% smaller */
  }

  /* Header text size - match location text size */
  .text-sm {
    font-size: 0.6rem !important; /* 9.6px - match location text size */
    line-height: 1rem !important; /* adjusted for smaller text */
  }

  .text-base {
    font-size: 0.6rem !important; /* 9.6px - match location text size */
    line-height: 1rem !important; /* adjusted for smaller text */
  }

  /* Spacing for parent container - 20% reduction */
  .space-y-3 > * + * {
    margin-top: 0.6rem !important; /* 20% smaller than 0.75rem */
  }

  /* Message padding - 20% reduction */
  .rsvp-message {
    padding: 0.4rem 0 !important; /* 20% smaller than 0.5rem */
  }

  /* Loader padding - 20% reduction */
  .rsvp-loader {
    padding: 0.4rem !important; /* 20% smaller than 0.5rem */
  }
}

/* Medium laptops 14-15 inch (1366px+) */
@media (min-width: 1366px) {
  /* RSVP Header text - reduced by one size */
  .text-sm {
    font-size: 0.875rem !important; /* 14px - reduced from 1rem */
    line-height: 1.1rem !important;
  }

  .text-base {
    font-size: 1rem !important; /* 16px - reduced from 1.125rem */
    line-height: 1.1rem !important;
  }
}

/* Large laptops 16+ inch (1536px+) */
@media (min-width: 1536px) {
  /* RSVP Header text - reduced by one size */
  .text-sm {
    font-size: 0.875rem !important; /* 14px - reduced from 1rem */
    line-height: 1.2rem !important;
  }

  .text-base {
    font-size: 1rem !important; /* 16px - reduced from 1.125rem */
    line-height: 1.2rem !important;
  }
}
</style>
