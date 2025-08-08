<template>
  <div class="mb-8">
    <!-- RSVP Section Header -->
    <h2 
      class="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-center px-4 sm:px-0" 
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
      <div class="text-center py-3 sm:py-4 border-b px-3 sm:px-0" :style="{ borderColor: `${primaryColor}20` }">
        <div class="mb-2 sm:mb-3">
          <div class="text-sm sm:text-base font-medium mb-1" :style="{ color: primaryColor }">
            {{ formatEventDate }}
          </div>
          <div class="text-xs sm:text-sm opacity-80" :style="{ color: primaryColor }">
            {{ formatEventTime }}
          </div>
        </div>
        
        <!-- Countdown or Status Display -->
        <div v-if="eventStatus === 'upcoming'" class="flex justify-center items-baseline gap-2 sm:gap-3">
          <div class="text-center">
            <span class="text-3xl sm:text-4xl font-normal" :style="{ color: primaryColor }">
              {{ timeLeft.days.toString().padStart(2, '0') }}
            </span>
            <span class="text-xs sm:text-sm ml-1 font-medium opacity-70" :style="{ color: primaryColor }">days</span>
          </div>
          
          <span class="text-2xl sm:text-3xl font-normal opacity-50" :style="{ color: primaryColor }">:</span>
          
          <div class="text-center">
            <span class="text-3xl sm:text-4xl font-normal" :style="{ color: primaryColor }">
              {{ timeLeft.hours.toString().padStart(2, '0') }}
            </span>
            <span class="text-xs sm:text-sm ml-1 font-medium opacity-70" :style="{ color: primaryColor }">hrs</span>
          </div>
          
          <span class="text-2xl sm:text-3xl font-normal opacity-50" :style="{ color: primaryColor }">:</span>
          
          <div class="text-center">
            <span class="text-3xl sm:text-4xl font-normal" :style="{ color: primaryColor }">
              {{ timeLeft.minutes.toString().padStart(2, '0') }}
            </span>
            <span class="text-xs sm:text-sm ml-1 font-medium opacity-70" :style="{ color: primaryColor }">min</span>
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

      <!-- RSVP Toggle Buttons -->
      <div v-if="eventStatus !== 'ended'" class="flex justify-center gap-2 sm:gap-3 py-4 sm:py-5 px-3 sm:px-0">
        <!-- Yes Button -->
        <button
          @click="setRSVPStatus('coming')"
          class="rsvp-btn flex-1 sm:flex-initial"
          :class="{ 'rsvp-btn-active': rsvpStatus === 'coming' }"
          :style="{
            borderColor: rsvpStatus === 'coming' ? primaryColor : `${primaryColor}60`,
            backgroundColor: rsvpStatus === 'coming' ? `${primaryColor}20` : 'transparent',
            color: primaryColor
          }"
        >
          <span class="whitespace-nowrap">Yes, I'll attend</span>
        </button>

        <!-- No Button -->
        <button
          @click="setRSVPStatus('not_coming')"
          class="rsvp-btn flex-1 sm:flex-initial"
          :class="{ 'rsvp-btn-active': rsvpStatus === 'not_coming' }"
          :style="{
            borderColor: rsvpStatus === 'not_coming' ? primaryColor : `${primaryColor}60`,
            backgroundColor: rsvpStatus === 'not_coming' ? `${primaryColor}10` : 'transparent',
            color: primaryColor
          }"
        >
          <span class="whitespace-nowrap">Can't attend</span>
        </button>
      </div>

      <!-- Guest Counter -->
      <div v-if="rsvpStatus === 'coming'" class="py-3 sm:py-4 border-t" :style="{ borderColor: `${primaryColor}30` }">
        <div class="flex items-center justify-between max-w-sm mx-auto px-3 sm:px-4">
          <span class="text-sm sm:text-base font-medium" :style="{ color: primaryColor }">
            Additional guests
          </span>
          
          <div class="flex items-center gap-3 sm:gap-4">
            <button
              @click="decreaseGuestCount"
              :disabled="additionalGuests <= 0"
              class="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 text-base sm:text-lg font-semibold flex items-center justify-center transition-all disabled:opacity-40"
              :style="{
                borderColor: primaryColor,
                color: primaryColor,
                backgroundColor: additionalGuests > 0 ? 'transparent' : `${primaryColor}05`
              }"
            >
              −
            </button>
            
            <span class="text-xl sm:text-2xl font-semibold min-w-[3ch] text-center" :style="{ color: primaryColor }">
              {{ additionalGuests }}
            </span>
            
            <button
              @click="increaseGuestCount"
              :disabled="additionalGuests >= 10"
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
        </div>
      </div>

      <!-- Status Message -->
      <div v-if="rsvpStatus === 'not_coming'" class="text-center py-4 border-t" :style="{ borderColor: `${primaryColor}30` }">
        <span class="text-base font-medium" :style="{ color: primaryColor, opacity: 0.8 }">
          Thank you for your response
        </span>
      </div>
    </div>
    
    <!-- RSVP Section Endline -->
    <div class="flex justify-center mt-6">
      <div class="w-16 h-px opacity-30" :style="{ backgroundColor: primaryColor }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  eventStartDate?: string
  eventEndDate?: string
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  isEventPast?: boolean
}

const props = defineProps<Props>()

// RSVP State
const rsvpStatus = ref<'coming' | 'not_coming' | null>(null)
const additionalGuests = ref(0)
const showConfirmationMessage = ref(false)

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

const setRSVPStatus = (status: 'coming' | 'not_coming') => {
  rsvpStatus.value = status
  
  // Reset additional guests if not coming
  if (status === 'not_coming') {
    additionalGuests.value = 0
  }
  
  // Show confirmation message
  showConfirmationMessage.value = true
  setTimeout(() => {
    showConfirmationMessage.value = false
  }, 3000)
  
  // TODO: Emit event or call API to save RSVP
  console.log('RSVP Status:', status, 'Additional Guests:', additionalGuests.value)
}

const increaseGuestCount = () => {
  if (additionalGuests.value < 10) { // Max 10 additional guests
    additionalGuests.value++
  }
}

const decreaseGuestCount = () => {
  if (additionalGuests.value > 0) {
    additionalGuests.value--
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
})

onUnmounted(() => {
  if (countdownInterval) {
    window.clearInterval(countdownInterval)
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

</style>