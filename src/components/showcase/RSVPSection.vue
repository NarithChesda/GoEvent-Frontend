<template>
  <div id="rsvp" class="mb-4 sm:mb-6 laptop-sm:mb-6 laptop-md:mb-8 laptop-lg:mb-10 desktop:mb-8">
    <!-- RSVP Section Header -->
    <h2 
      class="text-base sm:text-lg laptop-sm:text-xl laptop-md:text-2xl laptop-lg:text-3xl desktop:text-xl font-semibold mb-2 sm:mb-4 laptop-sm:mb-4 laptop-md:mb-5 laptop-lg:mb-6 desktop:mb-6 text-center px-4 sm:px-0" 
      :style="{ 
        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }"
    >
      Will you be attending?
    </h2>

    <!-- RSVP Content Container with Line Border -->
    <div class="rsvp-container" :style="{ borderColor: `${primaryColor}60` }">
      <!-- Event Date & Time Information -->
      <div class="text-center py-2 sm:py-3 laptop-sm:py-3 laptop-md:py-4 laptop-lg:py-5 desktop:py-4 border-b px-3 sm:px-0" :style="{ borderColor: `${primaryColor}20` }">
        <div class="mb-1 sm:mb-2 laptop-sm:mb-2 laptop-md:mb-3 laptop-lg:mb-3 desktop:mb-3">
          <div class="text-xs sm:text-sm laptop-sm:text-base laptop-md:text-lg laptop-lg:text-xl desktop:text-base font-medium mb-1" :style="{ color: primaryColor }">
            {{ formatEventDate }}
          </div>
          <div class="text-2xs sm:text-xs laptop-sm:text-sm laptop-md:text-base laptop-lg:text-lg desktop:text-sm opacity-80" :style="{ color: primaryColor }">
            {{ formatEventTime }}
          </div>
        </div>
        
        <!-- Countdown or Status Display -->
        <div v-if="eventStatus === 'upcoming'" class="flex justify-center items-baseline gap-1 sm:gap-2 laptop-sm:gap-3 laptop-md:gap-4 laptop-lg:gap-5 desktop:gap-3">
          <div class="text-center">
            <span class="text-2xl sm:text-3xl laptop-sm:text-4xl laptop-md:text-5xl laptop-lg:text-6xl desktop:text-4xl font-normal" :style="{ color: primaryColor }">
              {{ timeLeft.days.toString().padStart(2, '0') }}
            </span>
            <span class="text-2xs sm:text-xs laptop-sm:text-sm laptop-md:text-base laptop-lg:text-lg desktop:text-sm ml-1 font-medium opacity-70" :style="{ color: primaryColor }">days</span>
          </div>
          
          <span class="text-xl sm:text-2xl laptop-sm:text-3xl laptop-md:text-4xl laptop-lg:text-5xl desktop:text-3xl font-normal opacity-50" :style="{ color: primaryColor }">:</span>
          
          <div class="text-center">
            <span class="text-2xl sm:text-3xl laptop-sm:text-4xl laptop-md:text-5xl laptop-lg:text-6xl desktop:text-4xl font-normal" :style="{ color: primaryColor }">
              {{ timeLeft.hours.toString().padStart(2, '0') }}
            </span>
            <span class="text-2xs sm:text-xs laptop-sm:text-sm laptop-md:text-base laptop-lg:text-lg desktop:text-sm ml-1 font-medium opacity-70" :style="{ color: primaryColor }">hrs</span>
          </div>
          
          <span class="text-xl sm:text-2xl laptop-sm:text-3xl laptop-md:text-4xl laptop-lg:text-5xl desktop:text-3xl font-normal opacity-50" :style="{ color: primaryColor }">:</span>
          
          <div class="text-center">
            <span class="text-2xl sm:text-3xl laptop-sm:text-4xl laptop-md:text-5xl laptop-lg:text-6xl desktop:text-4xl font-normal" :style="{ color: primaryColor }">
              {{ timeLeft.minutes.toString().padStart(2, '0') }}
            </span>
            <span class="text-2xs sm:text-xs laptop-sm:text-sm laptop-md:text-base laptop-lg:text-lg desktop:text-sm ml-1 font-medium opacity-70" :style="{ color: primaryColor }">min</span>
          </div>
        </div>
        
        <!-- Event Status Messages -->
        <div v-else-if="eventStatus === 'ongoing'" class="py-2">
          <span class="text-base sm:text-lg font-medium" :style="{ color: primaryColor }">
            Event is happening now! 🎉
          </span>
        </div>
        
        <div v-else-if="eventStatus === 'ended'" class="py-2">
          <span class="text-base sm:text-lg font-medium opacity-70" :style="{ color: primaryColor }">
            This event has ended
          </span>
        </div>
      </div>

      <!-- Sign In Prompt for Unauthenticated Users -->
      <div v-if="eventStatus !== 'ended' && !isUserAuthenticated" class="text-center py-4 sm:py-5 px-3 sm:px-0 border-t" :style="{ borderColor: `${primaryColor}30` }">
        <p class="text-sm sm:text-base mb-3" :style="{ color: primaryColor, opacity: 0.8 }">
          Please sign in to RSVP for this event
        </p>
        <button
          @click="handleSignInClick"
          class="rsvp-btn mx-auto sign-in-btn"
          :style="{
            borderColor: primaryColor,
            backgroundColor: `${primaryColor}15`,
            color: primaryColor
          }"
        >
          <span class="whitespace-nowrap">Sign In to RSVP</span>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="eventStatus !== 'ended' && isUserAuthenticated && isLoading" class="text-center py-4 sm:py-5 px-3 sm:px-0">
        <div class="animate-spin rounded-full h-8 w-8 mx-auto mb-2" :style="{ borderColor: `${primaryColor}30`, borderTopColor: primaryColor, border: '2px solid' }"></div>
        <p class="text-sm" :style="{ color: primaryColor, opacity: 0.7 }">Loading your RSVP status...</p>
      </div>

      <!-- RSVP Toggle Buttons (Authenticated Users) -->
      <div v-else-if="eventStatus !== 'ended' && isUserAuthenticated" class="flex justify-center gap-2 sm:gap-3 py-4 sm:py-5 px-3 sm:px-0">
        <!-- Yes Button -->
        <button
          @click="setRSVPStatus('coming')"
          :disabled="isSubmitting"
          class="rsvp-btn flex-1 sm:flex-initial"
          :class="{ 
            'rsvp-btn-active': rsvpStatus === 'coming',
            'opacity-60 cursor-not-allowed': isSubmitting
          }"
          :style="{
            borderColor: rsvpStatus === 'coming' ? primaryColor : `${primaryColor}60`,
            backgroundColor: rsvpStatus === 'coming' ? `${primaryColor}20` : 'transparent',
            color: primaryColor
          }"
        >
          <span v-if="!isSubmitting || rsvpStatus !== 'coming'" class="whitespace-nowrap">
            {{ rsvpStatus === 'coming' ? 'Attending' : 'Yes, I\'ll attend' }}
          </span>
          <span v-else class="whitespace-nowrap flex items-center">
            <div class="animate-spin rounded-full h-4 w-4 mr-2" :style="{ borderColor: `${primaryColor}30`, borderTopColor: primaryColor, border: '2px solid' }"></div>
            Registering...
          </span>
        </button>

        <!-- No Button -->
        <button
          @click="setRSVPStatus('not_coming')"
          :disabled="isSubmitting"
          class="rsvp-btn flex-1 sm:flex-initial"
          :class="{ 
            'rsvp-btn-active': rsvpStatus === 'not_coming',
            'opacity-60 cursor-not-allowed': isSubmitting
          }"
          :style="{
            borderColor: rsvpStatus === 'not_coming' ? primaryColor : `${primaryColor}60`,
            backgroundColor: rsvpStatus === 'not_coming' ? `${primaryColor}10` : 'transparent',
            color: primaryColor
          }"
        >
          <span v-if="!isSubmitting || rsvpStatus !== 'not_coming'" class="whitespace-nowrap">
            {{ rsvpStatus === 'not_coming' ? 'Can\'t attend' : 'Can\'t attend' }}
          </span>
          <span v-else class="whitespace-nowrap flex items-center">
            <div class="animate-spin rounded-full h-4 w-4 mr-2" :style="{ borderColor: `${primaryColor}30`, borderTopColor: primaryColor, border: '2px solid' }"></div>
            Updating...
          </span>
        </button>
      </div>

      <!-- Guest Counter -->
      <div 
        v-if="rsvpStatus === 'coming'" 
        class="py-3 sm:py-4 border-t" 
        :style="{ borderColor: `${primaryColor}30` }"
        @mouseleave="handleGuestCounterLeave"
      >
        <div class="flex items-center justify-between max-w-sm mx-auto px-3 sm:px-4">
          <span class="text-sm sm:text-base font-medium" :style="{ color: primaryColor }">
            Additional guests
          </span>
          
          <div class="flex items-center gap-3 sm:gap-4">
            <button
              @click="decreaseGuestCount"
              :disabled="additionalGuests <= 0 || isUpdatingGuestCount"
              class="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 text-base sm:text-lg font-semibold flex items-center justify-center transition-all disabled:opacity-40"
              :style="{
                borderColor: primaryColor,
                color: primaryColor,
                backgroundColor: additionalGuests > 0 ? 'transparent' : `${primaryColor}05`
              }"
            >
              −
            </button>
            
            <div class="text-xl sm:text-2xl font-semibold min-w-[3ch] text-center flex items-center justify-center" :style="{ color: primaryColor }">
              <span v-if="!isUpdatingGuestCount">{{ additionalGuests }}</span>
              <div v-else class="animate-spin rounded-full h-5 w-5" :style="{ borderColor: `${primaryColor}30`, borderTopColor: primaryColor, border: '2px solid' }"></div>
            </div>
            
            <button
              @click="increaseGuestCount"
              :disabled="additionalGuests >= 10 || isUpdatingGuestCount"
              class="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 text-base sm:text-lg font-semibold flex items-center justify-center transition-all disabled:opacity-40 hover:scale-105"
              :style="{
                borderColor: primaryColor,
                color: primaryColor,
                backgroundColor: 'transparent'
              }"
            >
              +
            </button>
          </div>
        </div>
        
        <!-- Total Summary -->
        <div class="text-center mt-2 sm:mt-3">
          <span class="text-xs sm:text-sm font-medium opacity-75" :style="{ color: primaryColor }">
            Total attending: {{ totalAttendees }} {{ totalAttendees === 1 ? 'person' : 'people' }}
          </span>
          
          <!-- Unsaved Changes Indicator & Manual Save -->
          <div v-if="hasUnsavedGuestChanges" class="mt-2 flex flex-col items-center gap-1">
            <div class="flex items-center gap-2">
              <span class="text-xs font-medium opacity-60" :style="{ color: primaryColor }">
                • Unsaved changes
              </span>
              <button
                @click="saveGuestCountChanges"
                :disabled="isUpdatingGuestCount"
                class="text-xs px-2 py-1 rounded-md border font-medium transition-all hover:scale-105"
                :style="{
                  borderColor: primaryColor,
                  color: primaryColor,
                  backgroundColor: isUpdatingGuestCount ? `${primaryColor}10` : 'transparent'
                }"
              >
                {{ isUpdatingGuestCount ? 'Saving...' : 'Save now' }}
              </button>
            </div>
            <span class="text-xs opacity-50" :style="{ color: primaryColor }">
              Auto-saves in {{ Math.ceil((guestCountUpdateTimeout ? 2.5 : 0)) }}s
            </span>
          </div>
          
          <!-- Confirmation Code -->
          <div v-if="confirmationCode && !hasUnsavedGuestChanges" class="mt-2">
            <span class="text-xs font-medium opacity-60" :style="{ color: primaryColor }">
              Confirmation: {{ confirmationCode }}
            </span>
          </div>
        </div>
      </div>

      <!-- Status Message -->
      <div v-if="rsvpStatus === 'not_coming' && !successMessage" class="text-center py-4 border-t" :style="{ borderColor: `${primaryColor}30` }">
        <span class="text-base font-medium" :style="{ color: primaryColor, opacity: 0.8 }">
          Thank you for your response
        </span>
      </div>

      <!-- Success Message -->
      <div v-if="successMessage" class="text-center py-4 border-t" :style="{ borderColor: `${primaryColor}30` }">
        <div class="bg-green-50 border border-green-200 rounded-xl p-4 mx-3 sm:mx-0">
          <p class="text-green-800 font-medium">{{ successMessage }}</p>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="text-center py-4 border-t" :style="{ borderColor: `${primaryColor}30` }">
        <div class="bg-red-50 border border-red-200 rounded-xl p-4 mx-3 sm:mx-0">
          <p class="text-red-800 font-medium">{{ errorMessage }}</p>
          <button 
            @click="errorMessage = ''" 
            class="text-red-600 hover:text-red-800 text-sm mt-2 underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
    
    <!-- RSVP Section Endline -->
    <div class="flex justify-center mt-6">
      <div class="w-16 h-px opacity-30" :style="{ backgroundColor: primaryColor }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { eventsService, type EventRegistration } from '../../services/api'

interface Props {
  eventId: string
  eventStartDate?: string
  eventEndDate?: string
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  isEventPast?: boolean
}

const props = defineProps<Props>()

// Router and Auth
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// RSVP State
const rsvpStatus = ref<'coming' | 'not_coming' | null>(null)
const additionalGuests = ref(0)
const showConfirmationMessage = ref(false)

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
  seconds: 0
})

let countdownInterval: ReturnType<typeof setInterval> | null = null

// Computed Properties
const showRSVPSection = computed(() => {
  // Show RSVP section if event hasn't ended
  return eventStatus.value !== 'ended'
})

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
    const date = new Date(props.eventStartDate)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return props.eventStartDate
  }
})

const formatEventTime = computed(() => {
  if (!props.eventStartDate) return 'Time TBD'
  
  try {
    const date = new Date(props.eventStartDate)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  } catch {
    return 'Time TBD'
  }
})

const countdownLabel = computed(() => {
  if (eventStatus.value === 'ongoing') return 'Event in progress'
  if (eventStatus.value === 'ended') return 'Event has ended'
  return 'Time remaining'
})

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
  } catch (error) {
    console.error('Error loading registration:', error)
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
        notes: ''
      })
      
      if (response.success && response.data) {
        currentRegistration.value = response.data
        rsvpStatus.value = 'coming'
        successMessage.value = `Great! You're registered with ${response.data.total_attendees} ${response.data.total_attendees === 1 ? 'person' : 'people'}.`
        
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
          successMessage.value = "We're sorry you can't make it. Thank you for letting us know."
          
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
        successMessage.value = "Thank you for your response."
        
        setTimeout(() => {
          successMessage.value = ''
        }, 3000)
      }
    }
  } catch (error) {
    console.error('RSVP error:', error)
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
    seconds: Math.floor((timeDifference % (1000 * 60)) / 1000)
  }
  
  timeLeft.value = newTimeLeft
}

const handleSignInClick = () => {
  // Store the current route with hash for RSVP section
  const currentPath = route.fullPath + '#rsvp'
  
  // Navigate to sign-in with redirect parameter
  router.push({
    path: '/signin',
    query: { redirect: currentPath }
  })
}

const setRSVPStatus = async (status: 'coming' | 'not_coming') => {
  // Check authentication for "attending" status (fallback, should not be needed with new UI)
  if (status === 'coming' && !authStore.isAuthenticated) {
    handleSignInClick()
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
      notes: currentRegistration.value.notes || ''
    })

    if (response.success && response.data) {
      // Update the current registration data
      currentRegistration.value = response.data
      // Mark as saved
      savedGuestCount.value = additionalGuests.value
      hasUnsavedGuestChanges.value = false
      
      // Show brief success feedback
      successMessage.value = `Updated guest count to ${response.data.total_attendees} ${response.data.total_attendees === 1 ? 'person' : 'people'}`
      setTimeout(() => {
        successMessage.value = ''
      }, 2000)
    }
  } catch (error) {
    console.error('Error updating guest count:', error)
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
  if (additionalGuests.value < 10) { // Max 10 additional guests
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
    navigator.sendBeacon?.('/api/events/' + props.eventId + '/rsvp/', JSON.stringify({
      guest_count: additionalGuests.value,
      notes: currentRegistration.value?.notes || ''
    }))
  }
}

const hexToRgb = (hex: string): string => {
  // Remove # if present
  hex = hex.replace('#', '')
  
  // Parse hex to RGB
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  return `${r}, ${g}, ${b}`
}

// Watchers
watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth) {
    // User logged in, load their registration status
    loadCurrentRegistration()
  } else {
    // User logged out, clear registration state
    currentRegistration.value = null
    rsvpStatus.value = null
    additionalGuests.value = 0
  }
})

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
.rsvp-container {
  border: 2px solid;
  border-radius: 0.75rem;
  overflow: hidden;
}

.rsvp-btn {
  padding: 0.625rem 1rem;
  border: 2px solid;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  min-width: 100px;
}

/* Desktop styles */
@media (min-width: 640px) {
  .rsvp-btn {
    padding: 0.75rem 1.75rem;
    font-size: 1rem;
    min-width: 130px;
  }
}

.rsvp-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
}

.rsvp-btn-active {
  font-weight: 600;
  transform: scale(1.03);
}

.sign-in-btn {
  position: relative;
  overflow: hidden;
}

.sign-in-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.sign-in-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  transition: all 0.3s ease;
  transform: translate(-50%, -50%);
  border-radius: 50%;
}

.sign-in-btn:hover::before {
  width: 200%;
  height: 200%;
}

</style>