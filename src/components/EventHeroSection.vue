<template>
  <div
    class="relative min-h-[400px] md:min-h-[450px] lg:min-h-[500px] xl:min-h-[550px] overflow-hidden"
  >
    <!-- Banner Image with Fallback -->
    <div class="absolute inset-0">
      <img
        v-if="bannerImageUrl"
        :src="bannerImageUrl"
        :alt="event.title"
        class="w-full h-full object-cover"
        @error="handleImageError"
      />
      <!-- Fallback Gradient -->
      <div v-else class="w-full h-full" :style="fallbackGradientStyle"></div>
    </div>

    <!-- Overlay -->
    <div class="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60"></div>

    <!-- Hero Content -->
    <div class="relative z-10 w-full py-12 md:py-14 lg:py-16 xl:py-20">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 gap-8 items-start">
          <!-- Main Event Info -->
          <div class="space-y-8 max-w-5xl">
            <!-- Top Row: Status & Category -->
            <div class="flex flex-wrap items-center gap-3">
              <EventStatusBadge v-if="event.is_ongoing" type="live" label="Live Now" />
              <EventStatusBadge v-else-if="event.is_upcoming" type="upcoming" label="Upcoming" />
              <EventStatusBadge v-else-if="event.is_past" type="past" label="Past Event" />

              <!-- Category Tag -->
              <div
                v-if="event.category_details"
                class="px-3 py-1 rounded-full text-sm font-medium text-white/90 border border-white/30"
                :style="{ backgroundColor: event.category_details.color + '40' }"
              >
                {{ event.category_details.name }}
              </div>
            </div>

            <!-- Title -->
            <h1
              class="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight tracking-tight"
            >
              {{ event.title }}
            </h1>

            <!-- Key Details Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <!-- Date & Time -->
              <div class="flex items-center space-x-4 text-white/90">
                <div class="flex-shrink-0">
                  <Calendar class="w-6 h-6" />
                </div>
                <div>
                  <p class="font-semibold text-lg">{{ formatEventDate(event.start_date) }}</p>
                  <p class="text-white/80">{{ formatEventTime(event.start_date) }}</p>
                </div>
              </div>

              <!-- Location -->
              <div class="flex items-center space-x-4 text-white/90">
                <div class="flex-shrink-0">
                  <component :is="event.is_virtual ? Monitor : MapPin" class="w-6 h-6" />
                </div>
                <div>
                  <p class="font-semibold text-lg">
                    {{ event.is_virtual ? 'Virtual Event' : event.location || 'Location TBA' }}
                  </p>
                  <p class="text-white/80">
                    {{ event.is_virtual ? 'Join online' : 'In-person' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Social Proof & Metrics -->
            <div class="flex flex-wrap items-center gap-8 text-white/90">
              <!-- Attendees -->
              <div class="flex items-center space-x-3">
                <Users class="w-5 h-5" />
                <span class="font-medium">
                  {{ event.registrations_count || 0
                  }}{{ event.max_attendees ? `/${event.max_attendees}` : '' }} attending
                </span>
              </div>

              <!-- Host Preview -->
              <div v-if="primaryHost" class="flex items-center space-x-3">
                <img
                  :src="getHostProfileUrl(primaryHost.profile_image)"
                  :alt="primaryHost.name"
                  class="w-8 h-8 rounded-full border-2 border-white/40 ring-1 ring-white/20"
                  @error="handleHostImageError"
                />
                <span class="font-medium">Hosted by {{ primaryHost.name }}</span>
              </div>

              <!-- Price -->
              <div v-if="eventPrice" class="flex items-center space-x-2">
                <DollarSign class="w-5 h-5" />
                <span class="font-medium">{{ eventPrice }}</span>
              </div>
            </div>

            <!-- Urgency Indicator -->
            <div
              v-if="urgencyMessage"
              class="inline-flex items-center space-x-3 bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-3 backdrop-blur-sm"
            >
              <Clock class="w-5 h-5 text-red-300" />
              <span class="font-semibold text-red-200">{{ urgencyMessage }}</span>
            </div>

            <!-- Primary Action Buttons -->
            <div class="flex flex-wrap gap-3 md:gap-4 pt-4">
              <!-- Main Registration CTA -->
              <button
                v-if="canRegister"
                @click="$emit('register')"
                :disabled="isRegistering"
                class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5 flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-blue-500/25 hover:shadow-blue-600/30"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                {{ isRegistering ? 'Registering...' : 'Register Now' }}
              </button>

              <!-- Registered Status -->
              <div
                v-else-if="event.is_registered"
                class="inline-flex items-center bg-green-500/20 border border-green-400/40 text-green-200 px-8 py-4 rounded-xl font-semibold backdrop-blur-sm"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                You're Registered
              </div>

              <!-- Virtual Event Access -->
              <button
                v-if="event.virtual_link && (event.is_ongoing || event.is_registered)"
                @click="$emit('join-virtual')"
                class="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5 flex items-center shadow-green-500/25 hover:shadow-green-600/30"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Join Event
              </button>

              <!-- Quick Calendar Add -->
              <button
                @click="$emit('add-to-google-calendar')"
                class="bg-white/20 hover:bg-white/30 text-white border border-white/40 font-semibold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 flex items-center backdrop-blur-sm hover:bg-white/40"
              >
                <Calendar class="w-5 h-5 mr-2" />
                Add to Calendar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Calendar, MapPin, Monitor, Users, DollarSign, Clock } from 'lucide-vue-next'
import { type Event } from '../services/api'
import EventStatusBadge from './EventStatusBadge.vue'

interface Props {
  event: Event
  canRegister: boolean
  isRegistering: boolean
}

interface Emits {
  register: []
  'join-virtual': []
  'add-to-google-calendar': []
  'add-to-outlook-calendar': []
  'download-ics': []
}

const props = defineProps<Props>()
defineEmits<Emits>()

// State for image handling
const imageError = ref(false)

// Banner image with fallback
const bannerImageUrl = computed(() => {
  if (imageError.value) return null
  return getBannerImageUrl(props.event.banner_image)
})

// Fallback gradient based on category or default
const fallbackGradientStyle = computed(() => {
  const category = props.event.category_details

  if (category?.color) {
    // Use the category color for the gradient
    return {
      background: `linear-gradient(to bottom right, ${category.color}, ${category.color}dd)`,
    }
  }

  // Default gradients based on event type
  if (props.event.is_virtual) {
    return {
      background: 'linear-gradient(to bottom right, #2563eb, #7c3aed)',
    }
  }

  return {
    background: 'linear-gradient(to bottom right, #374151, #111827)',
  }
})

// Primary host for social proof
const primaryHost = computed(() => {
  if (!props.event.hosts || props.event.hosts.length === 0) return null
  return props.event.hosts[0]
})

// Event pricing display
const eventPrice = computed(() => {
  if (!props.event.registration_required) return null
  // For now, assume events are free unless we have pricing data
  // This can be enhanced when pricing fields are added to the Event interface
  return 'Free'
})

// Urgency messaging
const urgencyMessage = computed(() => {
  const now = new Date()

  // Registration deadline urgency
  if (props.event.registration_deadline) {
    const deadline = new Date(props.event.registration_deadline)
    const timeLeft = deadline.getTime() - now.getTime()
    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24))

    if (daysLeft <= 3 && daysLeft > 0) {
      return `Registration closes in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
    }
  }

  // Capacity urgency
  if (props.event.max_attendees && props.event.registrations_count) {
    const spotsLeft = props.event.max_attendees - props.event.registrations_count
    const percentageFull = (props.event.registrations_count / props.event.max_attendees) * 100

    if (percentageFull >= 90) {
      return `Only ${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left!`
    }
  }

  return null
})

// Image handling utilities
const getBannerImageUrl = (bannerImage: string | null): string | null => {
  if (!bannerImage) return null

  // If it's already a full URL, return as is
  if (bannerImage.startsWith('http://') || bannerImage.startsWith('https://')) {
    return bannerImage
  }

  // If it's a relative URL, prepend the API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  if (bannerImage.startsWith('/')) {
    return `${API_BASE_URL}${bannerImage}`
  }

  // If it doesn't start with /, assume it needs /media/ prefix
  return `${API_BASE_URL}/media/${bannerImage}`
}

const getHostProfileUrl = (profileImage: string | null): string => {
  if (!profileImage) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(primaryHost.value?.name || 'Host')}&background=6366f1&color=fff&size=128`
  }

  // If it's already a full URL, return as is
  if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) {
    return profileImage
  }

  // If it's a relative URL, prepend the API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  if (profileImage.startsWith('/')) {
    return `${API_BASE_URL}${profileImage}`
  }

  // If it doesn't start with /, assume it needs /media/ prefix
  return `${API_BASE_URL}/media/${profileImage}`
}

const handleImageError = () => {
  imageError.value = true
}

const handleHostImageError = (event: any) => {
  const img = event.target as HTMLImageElement
  if (primaryHost.value) {
    img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(primaryHost.value.name)}&background=6366f1&color=fff&size=128`
  }
}

// Date formatting utilities
const formatEventDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatEventTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>
