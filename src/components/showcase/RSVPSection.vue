<template>
  <div id="rsvp" class="mb-4 sm:mb-6 laptop-sm:mb-6 laptop-md:mb-8 laptop-lg:mb-10 desktop:mb-8">
    <!-- RSVP Section Header - Matching MainContentStage Welcome Header -->
    <div class="text-center py- laptop-sm:mb-6 laptop-md:mb-8 laptop-lg:mb-10 desktop:mb-8">
      <h1
        class="leading-relaxed py-2 text-base sm:text-lg md:text-xl lg:text-2xl font-semibold sm:mb-4 md:mb-6 capitalize"
        :style="{
          fontFamily: primaryFont || currentFont,
          color: primaryColor,
        }"
      >
        {{ rsvpHeaderText }}
      </h1>
    </div>

    <!-- Open Transparent RSVP Card -->
    <div
      class="rsvp-card-container"
      :style="{
        background: 'transparent',
      }"
    >
      <!-- RSVP Content - Always Visible -->
      <div class="rsvp-content-open">
        <!-- Ultra Minimal RSVP Row -->
        <div class="rsvp-main-row">
          <!-- Not Authenticated: Single Sign In Button -->
          <button
            v-if="eventStatus !== 'ended' && !isUserAuthenticated"
            @click="handleSignInClick"
            class="rsvp-btn rsvp-btn--primary"
            :style="{
              background: primaryColor,
              color: '#ffffff',
              fontFamily: secondaryFont || currentFont,
            }"
          >
            {{ rsvpSignInButtonText }}
          </button>

          <!-- Loading State -->
          <div v-else-if="eventStatus !== 'ended' && isUserAuthenticated && isLoading" class="rsvp-loader">
            <div class="spinner" :style="{ borderTopColor: primaryColor }"></div>
          </div>

          <!-- Authenticated: Inline RSVP with Guest Counter -->
          <div v-else-if="eventStatus !== 'ended' && isUserAuthenticated" class="rsvp-inline">
            <!-- RSVP Toggle Buttons -->
            <div class="rsvp-toggle">
              <button
                @click="setRSVPStatus('coming')"
                :disabled="isSubmitting"
                class="rsvp-btn"
                :class="{ 'active': rsvpStatus === 'coming' }"
                :style="{
                  background: rsvpStatus === 'coming' ? primaryColor : 'transparent',
                  color: rsvpStatus === 'coming' ? '#ffffff' : primaryColor,
                  borderColor: primaryColor,
                  fontFamily: secondaryFont || currentFont,
                }"
              >
                {{ rsvpStatus === 'coming' ? rsvpAttendingText : rsvpYesButtonText }}
              </button>

              <button
                @click="setRSVPStatus('not_coming')"
                :disabled="isSubmitting"
                class="rsvp-btn"
                :class="{ 'active': rsvpStatus === 'not_coming' }"
                :style="{
                  background: rsvpStatus === 'not_coming' ? primaryColor : 'transparent',
                  color: rsvpStatus === 'not_coming' ? '#ffffff' : primaryColor,
                  borderColor: primaryColor,
                  fontFamily: secondaryFont || currentFont,
                }"
              >
                {{ rsvpStatus === 'not_coming' ? rsvpCantAttendText : rsvpNoButtonText }}
              </button>
            </div>

            <!-- Inline Guest Counter (only when attending) -->
            <div v-if="rsvpStatus === 'coming'" class="guest-counter-inline">
              <span class="guest-label" :style="{ color: primaryColor, fontFamily: secondaryFont || currentFont }">
                {{ rsvpTotalAttendingText }}:
              </span>

              <button
                @click="decreaseGuestCount"
                :disabled="additionalGuests <= 0 || isUpdatingGuestCount"
                class="counter-btn-minimal"
                :style="{ color: primaryColor }"
              >
                −
              </button>

              <span class="guest-count" :style="{ color: primaryColor, fontFamily: secondaryFont || currentFont }">
                {{ totalAttendees }}
              </span>

              <button
                @click="increaseGuestCount"
                :disabled="additionalGuests >= 10 || isUpdatingGuestCount"
                class="counter-btn-minimal"
                :style="{ color: primaryColor }"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <!-- Confirmation Code -->
        <div v-if="confirmationCode && rsvpStatus === 'coming'" class="rsvp-confirmation">
          <span class="confirmation-label" :style="{ color: primaryColor, fontFamily: secondaryFont || currentFont }">
            {{ rsvpConfirmationText }}
          </span>
          <span class="confirmation-code" :style="{ color: primaryColor, fontFamily: 'monospace' }">
            {{ confirmationCode }}
          </span>
        </div>

        <!-- Minimal Status Messages -->
        <div v-if="successMessage || errorMessage" class="rsvp-message">
          <span v-if="successMessage" class="message-text success" :style="{ color: '#10b981' }">
            ✓ {{ successMessage }}
          </span>
          <span v-if="errorMessage" class="message-text error" :style="{ color: '#ef4444' }">
            ✕ {{ errorMessage }}
          </span>
        </div>
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
  formatDateLocalized,
  formatTimeLocalized,
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
  isEventPast?: boolean
  eventTexts?: EventText[]
  currentLanguage?: string
  currentFont?: string
  primaryFont?: string
  secondaryFont?: string
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

// State
const rsvpStatus = ref<'coming' | 'not_coming' | null>(null)
const additionalGuests = ref(0)
// const showConfirmationMessage = ref(false) // Unused

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

// Countdown Timer State
const timeLeft = ref({
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
})

let countdownInterval: ReturnType<typeof setInterval> | null = null

// Computed Properties
// const showRSVPSection = computed(() => {
//   // Show RSVP section if event hasn't ended
//   return eventStatus.value !== 'ended'
// }) // Unused

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

const formatEventDate = computed(() => {
  if (!props.eventStartDate) return 'Date TBD'

  try {
    const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
    return formatDateLocalized(props.eventStartDate, 'long', currentLang)
  } catch {
    return props.eventStartDate
  }
})

const formatEventTime = computed(() => {
  if (!props.eventStartDate) return 'Time TBD'

  try {
    const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
    return formatTimeLocalized(props.eventStartDate, currentLang)
  } catch {
    return 'Time TBD'
  }
})

// const countdownLabel = computed(() => {
//   if (eventStatus.value === 'ongoing') return 'Event in progress'
//   if (eventStatus.value === 'ended') return 'Event has ended'
//   return 'Time remaining'
// }) // Unused

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
const rsvpHeaderText = computed(() => getTextContent('rsvp_header', 'Will you attend our wedding?'))

const rsvpYesButtonText = computed(() => getTextContent('rsvp_yes_button', "Yes, I'll attend"))

const rsvpNoButtonText = computed(() => getTextContent('rsvp_no_button', "Can't attend"))

const rsvpAttendingText = computed(() => getTextContent('rsvp_attending', 'Attending'))

const rsvpCantAttendText = computed(() => getTextContent('rsvp_cant_attend', "Can't attend"))

const rsvpSignInText = computed(() =>
  getTextContent('rsvp_sign_in', 'Please sign in to RSVP for this event'),
)

const rsvpSignInButtonText = computed(() =>
  getTextContent('rsvp_sign_in_button', 'Sign In to RSVP'),
)

const rsvpAdditionalGuestsText = computed(() =>
  getTextContent('rsvp_additional_guests', 'Additional guests'),
)

const rsvpTotalAttendingText = computed(() =>
  getTextContent('rsvp_total_attending', 'Total attending'),
)

// Note: rsvp_person and rsvp_people are now handled by getPersonUnitForTemplate function

const rsvpThankYouText = computed(() =>
  getTextContent('rsvp_thank_you', 'Thank you for your response'),
)

// Status messages
const rsvpStatusLiveText = computed(() => getTextContent('rsvp_status_live', 'Live'))

const rsvpStatusEndedText = computed(() => getTextContent('rsvp_status_ended', 'Ended'))

// Loading states
const rsvpLoadingStatusText = computed(() =>
  getTextContent('rsvp_loading_status', 'Loading your RSVP status...'),
)

const rsvpRegisteringText = computed(() => getTextContent('rsvp_registering', 'Registering...'))

const rsvpUpdatingText = computed(() => getTextContent('rsvp_updating', 'Updating...'))

// Guest management
const rsvpUnsavedChangesText = computed(() =>
  getTextContent('rsvp_unsaved_changes', 'Unsaved changes'),
)

const rsvpSaveNowText = computed(() => getTextContent('rsvp_save_now', 'Save now'))

const rsvpSavingText = computed(() => getTextContent('rsvp_saving', 'Saving...'))

const rsvpAutoSaveText = computed(() => getTextContent('rsvp_auto_save', 'Auto-saves in'))

const rsvpSecondsText = computed(() => getTextContent('rsvp_seconds', 's'))

// System messages
const rsvpConfirmationText = computed(() => getTextContent('rsvp_confirmation', 'Confirmation:'))

// Error handling
const rsvpDismissText = computed(() => getTextContent('rsvp_dismiss', 'Dismiss'))

// Countdown format
const rsvpDaysText = computed(() => getTextContent('rsvp_days', 'd'))

const rsvpHoursText = computed(() => getTextContent('rsvp_hours', 'h'))

// Note: Success message templates are now handled directly in the functions using translateRSVP

// Expose translation utilities for template use
const getPersonUnitForTemplate = (count: number) => {
  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
  return getPersonUnit(count, currentLang)
}

// API Methods
const loadCurrentRegistration = async () => {
  if (!authStore.isAuthenticated || !props.eventId) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await eventsService.getMyRegistration(props.eventId)

    if (response.success && response.data) {
      currentRegistration.value = response.data
      // Update UI state based on registration
      rsvpStatus.value = 'coming'
      additionalGuests.value = response.data.guest_count || 0
      // Initialize saved state
      savedGuestCount.value = response.data.guest_count || 0
      hasUnsavedGuestChanges.value = false
    } else {
      // User is not registered
      currentRegistration.value = null
      rsvpStatus.value = null
      additionalGuests.value = 0
      savedGuestCount.value = 0
      hasUnsavedGuestChanges.value = false
    }
  } catch {
    currentRegistration.value = null
    rsvpStatus.value = null
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
    if (status === 'coming') {
      // Register or update registration
      const response = await eventsService.rsvpForEvent(props.eventId, {
        guest_count: additionalGuests.value,
        notes: '',
      })

      if (response.success && response.data) {
        currentRegistration.value = response.data
        rsvpStatus.value = 'coming'
        const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
        const unit = getPersonUnit(response.data.total_attendees, currentLang)
        successMessage.value = translateRSVP('rsvp_registration_success', currentLang, {
          count: response.data.total_attendees,
          unit: unit,
        })

        // Show success message temporarily
        setTimeout(() => {
          successMessage.value = ''
        }, 5000)
      } else {
        errorMessage.value = response.message || 'Failed to register for event'
      }
    } else {
      // Unregister from event
      if (currentRegistration.value) {
        const response = await eventsService.unregisterFromEvent(props.eventId)

        if (response.success) {
          currentRegistration.value = null
          rsvpStatus.value = 'not_coming'
          additionalGuests.value = 0
          const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
          successMessage.value = translateRSVP('rsvp_unregister_success', currentLang)

          // Show success message temporarily
          setTimeout(() => {
            successMessage.value = ''
          }, 5000)
        } else {
          errorMessage.value = response.message || 'Failed to cancel registration'
        }
      } else {
        // User wasn't registered, just update UI
        rsvpStatus.value = 'not_coming'
        const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
        successMessage.value = translateRSVP('rsvp_thank_you_simple', currentLang)

        setTimeout(() => {
          successMessage.value = ''
        }, 3000)
      }
    }
  } catch {
    errorMessage.value = 'An unexpected error occurred. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

// Methods
const updateCountdown = () => {
  if (!props.eventStartDate) {
    timeLeft.value = { days: 0, hours: 0, minutes: 0, seconds: 0 }
    return
  }

  const now = new Date()
  const targetDate = new Date(props.eventStartDate)
  const timeDifference = targetDate.getTime() - now.getTime()

  if (timeDifference <= 0) {
    // Event has started or passed
    timeLeft.value = { days: 0, hours: 0, minutes: 0, seconds: 0 }
    if (countdownInterval) {
      window.clearInterval(countdownInterval)
      countdownInterval = null
    }
    return
  }

  const newTimeLeft = {
    days: Math.floor(timeDifference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((timeDifference % (1000 * 60)) / 1000),
  }

  timeLeft.value = newTimeLeft
}

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
      // Update the current registration data
      currentRegistration.value = response.data
      // Mark as saved
      savedGuestCount.value = additionalGuests.value
      hasUnsavedGuestChanges.value = false

      // Show brief success feedback
      const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
      const unit = getPersonUnit(response.data.total_attendees, currentLang)
      successMessage.value = translateRSVP('rsvp_guest_update_success', currentLang, {
        count: response.data.total_attendees,
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

// Smart save triggers
const handleGuestCounterLeave = () => {
  // Save when user moves mouse away from guest counter
  if (hasUnsavedGuestChanges.value && !isUpdatingGuestCount.value) {
    saveGuestCountChanges()
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

// const hexToRgb = (hex: string): string => {
//   // Remove # if present
//   hex = hex.replace('#', '')
//
//   // Parse hex to RGB
//   const r = parseInt(hex.substr(0, 2), 16)
//   const g = parseInt(hex.substr(2, 2), 16)
//   const b = parseInt(hex.substr(4, 2), 16)
//
//   return `${r}, ${g}, ${b}`
// } // Unused

// Watchers
watch(
  () => authStore.isAuthenticated,
  (isAuth) => {
    if (isAuth) {
      // User logged in, load their registration status
      loadCurrentRegistration()
    } else {
      // User logged out, clear registration state
      currentRegistration.value = null
      rsvpStatus.value = null
      additionalGuests.value = 0
    }
  },
)

// Lifecycle
onMounted(() => {
  // Initial countdown update
  updateCountdown()

  // Set up interval for upcoming events
  if (props.eventStartDate && eventStatus.value === 'upcoming') {
    countdownInterval = window.setInterval(() => {
      updateCountdown()
    }, 1000)
  }

  // Load current registration if user is authenticated
  if (authStore.isAuthenticated) {
    loadCurrentRegistration()
  }

  // Add beforeunload listener for unsaved changes
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  if (countdownInterval) {
    window.clearInterval(countdownInterval)
  }

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
/* Container */
.rsvp-card-container {
  padding: 0;
}

.rsvp-content-open {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Main Row - Ultra Minimal */
.rsvp-main-row {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0;
}

/* Inline RSVP Layout */
.rsvp-inline {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.rsvp-toggle {
  display: flex;
  gap: 0.5rem;
}

/* RSVP Button - Minimal Design */
.rsvp-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  background: transparent;
}

.rsvp-btn--primary {
  border: none;
}

.rsvp-btn:hover:not(:disabled) {
  opacity: 0.85;
}

.rsvp-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.rsvp-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rsvp-btn.active {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Inline Guest Counter */
.guest-counter-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.5rem;
}

.guest-label {
  font-size: 0.8125rem;
  font-weight: 500;
  opacity: 0.8;
  white-space: nowrap;
}

.counter-btn-minimal {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.25rem;
  border: 1px solid currentColor;
  background: transparent;
  cursor: pointer;
  font-size: 1.125rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  opacity: 0.7;
}

.counter-btn-minimal:hover:not(:disabled) {
  opacity: 1;
  background: currentColor;
  color: white;
}

.counter-btn-minimal:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.guest-count {
  font-size: 0.875rem;
  font-weight: 600;
  min-width: 1.5rem;
  text-align: center;
}

/* Confirmation Code */
.rsvp-confirmation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.375rem 0;
}

.confirmation-label {
  font-size: 0.75rem;
  font-weight: 500;
  opacity: 0.7;
}

.confirmation-code {
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  opacity: 0.9;
}

/* Loading */
.rsvp-loader {
  display: flex;
  justify-content: center;
  padding: 0.5rem;
}

.spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Minimal Messages */
.rsvp-message {
  display: flex;
  justify-content: center;
  padding: 0.5rem 0;
}

.message-text {
  font-size: 0.8125rem;
  font-weight: 500;
}

/* Mobile Responsive */
@media (max-width: 639px) {
  .rsvp-main-row {
    padding: 0.375rem 0;
  }

  .rsvp-inline {
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 0.5rem;
    width: 100%;
    justify-content: space-between;
    align-items: center;
  }

  .rsvp-toggle {
    display: flex;
    gap: 0.375rem;
    flex: 1;
  }

  .rsvp-btn {
    flex: 1;
    padding: 0.5rem 0.375rem;
    font-size: 0.75rem;
    border-radius: 0.313rem;
  }

  .guest-counter-inline {
    display: flex;
    align-items: center;
    padding: 0;
    gap: 0.375rem;
    flex-shrink: 0;
  }

  .guest-label {
    font-size: 0.6875rem;
    white-space: nowrap;
  }

  .counter-btn-minimal {
    width: 1.75rem;
    height: 1.75rem;
    font-size: 0.875rem;
  }

  .guest-count {
    font-size: 0.875rem;
    min-width: 1.25rem;
  }

  .rsvp-confirmation {
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem 0;
  }

  .confirmation-label {
    font-size: 0.6875rem;
  }

  .confirmation-code {
    font-size: 0.8125rem;
  }
}

/* Tablet */
@media (min-width: 640px) and (max-width: 1023px) {
  .rsvp-btn {
    padding: 0.5rem 0.875rem;
    font-size: 0.8125rem;
  }
}

/* Small laptops */
@media (min-width: 1024px) and (max-width: 1365px) {
  .rsvp-btn {
    padding: 0.5rem 0.875rem;
    font-size: 0.8125rem;
  }
}
</style>
