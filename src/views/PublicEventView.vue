<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="animate-pulse space-y-4 w-full max-w-md mx-auto p-6">
        <div class="h-48 bg-slate-200 rounded-xl"></div>
        <div class="h-6 bg-slate-200 rounded w-3/4"></div>
        <div class="h-4 bg-slate-200 rounded w-1/2"></div>
        <div class="space-y-2">
          <div class="h-4 bg-slate-200 rounded"></div>
          <div class="h-4 bg-slate-200 rounded"></div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen px-4">
      <div class="text-center max-w-md">
        <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle class="w-10 h-10 text-red-500" />
        </div>
        <h1 class="text-2xl font-bold text-slate-900 mb-3">Event Not Found</h1>
        <p class="text-slate-600 mb-6">{{ error }}</p>
        <button
          @click="$router.push('/events')"
          class="px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium"
        >
          Browse Events
        </button>
      </div>
    </div>

    <!-- Event Content -->
    <div v-else-if="event" class="pb-24">
      <!-- Header Bar -->
      <div class="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40">
        <div class="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            @click="$router.push('/events')"
            class="p-2 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 text-slate-600"
          >
            <ArrowLeft class="w-5 h-5" />
            <span class="hidden sm:inline">Events</span>
          </button>
          <div class="flex items-center gap-2">
            <button
              @click="copyLink"
              class="p-2 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 text-sm text-slate-600"
            >
              <Copy class="w-4 h-4" />
              <span class="hidden sm:inline">{{ linkCopied ? 'Copied!' : 'Copy Link' }}</span>
            </button>
            <button
              @click="openShowcase"
              class="p-2 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 text-sm text-slate-600"
            >
              <span>Showcase</span>
              <ExternalLink class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="max-w-2xl mx-auto">
        <!-- Banner Image -->
        <div v-if="event.banner_image" class="relative">
          <img
            :src="getBannerUrl(event.banner_image)"
            :alt="event.title"
            class="w-full h-56 sm:h-72 object-cover"
          />
        </div>

        <!-- Event Info -->
        <div class="px-4 py-6 sm:py-8 space-y-6">
          <!-- Title & Organizer -->
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-4">
              {{ event.title }}
            </h1>

            <div v-if="event.organizer_details" class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                {{ getInitials(organizerName) }}
              </div>
              <div>
                <p class="font-medium text-slate-900">{{ organizerName }}</p>
                <p v-if="event.category_details" class="text-sm text-slate-500">{{ event.category_details.name }}</p>
              </div>
            </div>
          </div>

          <!-- Date & Time -->
          <div class="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
            <div class="w-14 h-16 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center shadow-sm">
              <span class="text-xs font-medium text-slate-500 uppercase">{{ getMonthAbbr(event.start_date) }}</span>
              <span class="text-xl font-bold text-slate-900 leading-tight">{{ getDayOfMonth(event.start_date) }}</span>
            </div>
            <div class="flex-1">
              <p class="font-semibold text-slate-900 text-lg">{{ getFormattedDate(event.start_date) }}</p>
              <p class="text-slate-600">{{ getTimeRange(event.start_date, event.end_date) }}</p>
              <button
                @click="showCalendarOptions = !showCalendarOptions"
                class="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Calendar class="w-4 h-4" />
                Add to Calendar
              </button>
              <!-- Calendar Options Dropdown -->
              <div v-if="showCalendarOptions" class="mt-2 flex flex-wrap gap-2">
                <button
                  @click="addToGoogleCalendar"
                  class="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Google
                </button>
                <button
                  @click="addToOutlookCalendar"
                  class="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Outlook
                </button>
                <button
                  @click="downloadICSFile"
                  class="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Download .ics
                </button>
              </div>
            </div>
          </div>

          <!-- Location -->
          <div v-if="event.location || event.is_virtual" class="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
            <div class="w-14 h-14 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
              <Video v-if="event.is_virtual" class="w-6 h-6 text-slate-600" />
              <MapPin v-else class="w-6 h-6 text-slate-600" />
            </div>
            <div class="flex-1">
              <p class="font-semibold text-slate-900">
                {{ event.is_virtual ? 'Virtual Event' : getLocationName(event.location) }}
              </p>
              <p v-if="!event.is_virtual && event.location" class="text-slate-600">
                {{ event.location }}
              </p>
              <button
                v-if="!event.is_virtual && event.location"
                @click="openMap"
                class="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View larger map
                <ExternalLink class="w-3 h-3" />
              </button>
            </div>
          </div>

          <!-- Registration Section -->
          <div v-if="event.registration_required" class="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-5 border border-emerald-100">
            <h3 class="text-base font-semibold text-slate-800 mb-3">Registration</h3>
            <p class="text-sm text-slate-600 mb-4">
              {{ registrationMessage }}
            </p>

            <!-- User Info (if logged in) -->
            <div v-if="currentUser" class="flex items-center gap-3 mb-4 p-3 bg-white rounded-lg border border-slate-200">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-medium">
                {{ getInitials(currentUser.first_name || currentUser.username || 'U') }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-slate-900 truncate">{{ currentUser.first_name || currentUser.username }}</p>
                <p class="text-sm text-slate-500 truncate">{{ currentUser.email }}</p>
              </div>
            </div>

            <!-- Register Button -->
            <button
              v-if="canRegister"
              @click="handleRegister"
              :disabled="isRegistering"
              class="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-3.5 px-4 rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isRegistering ? 'Registering...' : 'Register for Event' }}
            </button>

            <!-- Already Registered -->
            <div
              v-else-if="event.is_registered"
              class="w-full bg-white text-green-700 font-semibold py-3.5 px-4 rounded-xl text-center flex items-center justify-center gap-2 border border-green-200"
            >
              <CheckCircle class="w-5 h-5" />
              You're Registered
            </div>

            <!-- Login to Register -->
            <button
              v-else-if="!currentUser"
              @click="handleLoginToRegister"
              class="w-full bg-slate-900 text-white font-semibold py-3.5 px-4 rounded-xl hover:bg-slate-800 transition-colors"
            >
              Login to Register
            </button>

            <!-- Registration Closed/Full -->
            <div
              v-else-if="isRegistrationClosed || isEventFull"
              class="w-full bg-slate-100 text-slate-500 font-semibold py-3.5 px-4 rounded-xl text-center"
            >
              {{ isEventFull ? 'Event is Full' : 'Registration Closed' }}
            </div>
          </div>

          <!-- About Event -->
          <div class="pt-2">
            <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">About Event</h3>
            <div
              v-if="event.description"
              class="prose prose-slate max-w-none"
              v-html="sanitizedDescription"
            />
            <p v-else-if="event.short_description" class="text-slate-700 leading-relaxed">
              {{ event.short_description }}
            </p>
            <p v-else class="text-slate-500 italic">No description provided.</p>
          </div>

          <!-- Hosts -->
          <div v-if="event.hosts && event.hosts.length > 0" class="border-t border-slate-200 pt-6">
            <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Hosted By</h3>
            <div class="space-y-4">
              <div
                v-for="host in event.hosts"
                :key="host.id"
                class="flex items-center gap-4 p-3 bg-slate-50 rounded-xl"
              >
                <img
                  v-if="host.profile_image"
                  :src="getProfileUrl(host.profile_image)"
                  :alt="host.name"
                  class="w-12 h-12 rounded-full object-cover"
                />
                <div v-else class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium">
                  {{ getInitials(host.name) }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-slate-900 truncate">{{ host.name }}</p>
                  <p v-if="host.title" class="text-sm text-slate-500 truncate">{{ host.title }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Tags -->
          <div v-if="event.category_details" class="border-t border-slate-200 pt-6">
            <div class="flex flex-wrap gap-2">
              <span class="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-full">
                <span class="text-slate-400">#</span>
                {{ event.category_details.name }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <Transition name="slide-up">
      <div v-if="message" class="fixed bottom-20 lg:bottom-4 right-4 left-4 sm:left-auto z-50">
        <div
          :class="message.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
          class="text-white px-6 py-4 rounded-xl shadow-lg flex items-center justify-center sm:justify-start"
        >
          <CheckCircle v-if="message.type === 'success'" class="w-5 h-5 mr-2" />
          <AlertCircle v-else class="w-5 h-5 mr-2" />
          {{ message.text }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DOMPurify from 'dompurify'
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  MapPin,
  Video,
  Calendar,
  AlertCircle,
  CheckCircle,
} from 'lucide-vue-next'
import { eventsService, type Event } from '../services/api'
import { useAuthStore } from '../stores/auth'
import { apiClient } from '../services/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// State
const event = ref<Event | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const isRegistering = ref(false)
const linkCopied = ref(false)
const showCalendarOptions = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Computed
const currentUser = computed(() => authStore.user)

const organizerName = computed(() => {
  if (!event.value?.organizer_details) return 'GoEvent'
  const { first_name, last_name, username } = event.value.organizer_details
  if (first_name && last_name) return `${first_name} ${last_name}`
  return first_name || username || 'GoEvent'
})

const sanitizedDescription = computed(() => {
  if (!event.value?.description) return ''
  return DOMPurify.sanitize(event.value.description, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class'],
  })
})

const isEventFull = computed(() => {
  if (!event.value || !event.value.max_attendees) return false
  return event.value.registrations_count >= event.value.max_attendees
})

const isRegistrationClosed = computed(() => {
  if (!event.value?.registration_deadline) return false
  return new Date(event.value.registration_deadline) < new Date()
})

const canRegister = computed(() => {
  if (!event.value || !authStore.isAuthenticated) return false
  if (event.value.is_registered || event.value.is_past) return false
  if (!event.value.registration_required) return false
  if (isEventFull.value || isRegistrationClosed.value) return false
  return true
})

const registrationMessage = computed(() => {
  if (!event.value?.registration_required) return ''
  if (event.value.is_registered) return 'You are registered for this event.'
  if (isEventFull.value) return 'This event has reached capacity.'
  if (isRegistrationClosed.value) return 'Registration for this event has closed.'
  return 'Welcome! To join the event, please register below.'
})

// Methods
const loadEvent = async () => {
  const eventId = route.params.id as string
  if (!eventId) {
    error.value = 'Invalid event ID'
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await eventsService.getEvent(eventId)
    if (response.success && response.data) {
      event.value = response.data

      // If user can edit this event, redirect to manage page
      if (event.value.can_edit) {
        router.replace(`/events/${eventId}/manage`)
        return
      }
    } else {
      error.value = response.message || 'Event not found'
    }
  } catch (err) {
    error.value = 'Failed to load event details'
  } finally {
    loading.value = false
  }
}

const copyLink = async () => {
  const eventId = route.params.id as string
  const url = `${window.location.origin}/events/${eventId}`
  try {
    await navigator.clipboard.writeText(url)
    linkCopied.value = true
    setTimeout(() => {
      linkCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy link:', err)
  }
}

const openShowcase = () => {
  const eventId = route.params.id as string
  router.push(`/events/${eventId}/showcase`)
}

const handleRegister = async () => {
  if (!event.value || !authStore.isAuthenticated) return

  isRegistering.value = true

  try {
    const response = await eventsService.registerForEvent(event.value.id, {
      guest_count: 0,
      notes: '',
    })

    if (response.success) {
      showMessage('success', 'Successfully registered for the event!')
      await loadEvent()
    } else {
      showMessage('error', response.message || 'Failed to register')
    }
  } catch (err) {
    showMessage('error', 'An error occurred while registering')
  } finally {
    isRegistering.value = false
  }
}

const handleLoginToRegister = () => {
  const eventId = route.params.id as string
  router.push(`/signin?redirect=${encodeURIComponent(`/events/${eventId}`)}`)
}

const openMap = () => {
  if (!event.value?.location) return
  const encoded = encodeURIComponent(event.value.location)
  window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank')
}

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

// URL helpers
const getBannerUrl = (bannerImage: string): string => {
  if (bannerImage.startsWith('http://') || bannerImage.startsWith('https://')) {
    return bannerImage
  }
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  if (bannerImage.startsWith('/')) {
    return `${API_BASE_URL}${bannerImage}`
  }
  return `${API_BASE_URL}/media/${bannerImage}`
}

const getProfileUrl = (profileImage: string): string => {
  return apiClient.getProfilePictureUrl(profileImage) || ''
}

// Date/time helpers
const getMonthAbbr = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
}

const getDayOfMonth = (dateStr: string): string => {
  return new Date(dateStr).getDate().toString()
}

const getFormattedDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

const getTimeRange = (startStr: string, endStr: string): string => {
  const start = new Date(startStr)
  const end = new Date(endStr)

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return `${formatTime(start)} - ${formatTime(end)}`
}

const getLocationName = (location: string | null): string => {
  if (!location) return ''
  const parts = location.split(',')
  return parts[0].trim()
}

const getInitials = (name: string): string => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

// Calendar functions
const addToGoogleCalendar = () => {
  if (!event.value) return

  const startDate = new Date(event.value.start_date)
  const endDate = new Date(event.value.end_date)

  const formatDateForGoogle = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '')
  }

  const sanitizeText = (text: string, maxLength = 1000): string => {
    if (!text) return ''
    let cleaned = text.replace(/<[^>]*>/g, '')
    cleaned = cleaned
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '')
      .trim()
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength) + '...'
    }
    return cleaned
  }

  const title = sanitizeText(event.value.title, 200)
  const description = sanitizeText(
    event.value.description || event.value.short_description || '',
    500
  )

  let location = ''
  if (event.value.is_virtual) {
    location = event.value.virtual_link || 'Virtual Event'
  } else {
    location = sanitizeText(event.value.location || '', 200)
  }

  const baseUrl = 'https://calendar.google.com/calendar/render'
  const params = [
    'action=TEMPLATE',
    `text=${encodeURIComponent(title)}`,
    `dates=${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}`,
    `details=${encodeURIComponent(description)}`,
    `location=${encodeURIComponent(location)}`,
    'trp=false'
  ].join('&')

  window.open(`${baseUrl}?${params}`, '_blank')
  showCalendarOptions.value = false
}

const addToOutlookCalendar = () => {
  if (!event.value) return

  const startDate = new Date(event.value.start_date)
  const endDate = new Date(event.value.end_date)

  const params = new URLSearchParams({
    subject: event.value.title,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
    body: event.value.description || event.value.short_description || '',
    location: event.value.is_virtual
      ? event.value.virtual_link || 'Virtual Event'
      : event.value.location || '',
  })

  window.open(`https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`, '_blank')
  showCalendarOptions.value = false
}

const downloadICSFile = () => {
  if (!event.value) return

  const startDate = new Date(event.value.start_date)
  const endDate = new Date(event.value.end_date)

  const formatDateForICS = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '')
  }

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//GoEvent//Event Calendar//EN
BEGIN:VEVENT
UID:${event.value.id}@goevent.com
DTSTAMP:${formatDateForICS(new Date())}
DTSTART:${formatDateForICS(startDate)}
DTEND:${formatDateForICS(endDate)}
SUMMARY:${event.value.title}
DESCRIPTION:${event.value.description || event.value.short_description || ''}
LOCATION:${
    event.value.is_virtual
      ? event.value.virtual_link || 'Virtual Event'
      : event.value.location || ''
  }
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${event.value.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  showCalendarOptions.value = false
}

// Lifecycle
onMounted(() => {
  loadEvent()
})

watch(
  () => route.params.id,
  () => {
    loadEvent()
  }
)
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Prose styling */
.prose :deep(p) {
  @apply mb-4 leading-relaxed;
}

.prose :deep(strong) {
  @apply font-semibold text-slate-900;
}

.prose :deep(a) {
  @apply text-blue-600 hover:text-blue-700 underline;
}

.prose :deep(ul),
.prose :deep(ol) {
  @apply ml-4 mb-4 space-y-2;
}

.prose :deep(li) {
  @apply leading-relaxed;
}

.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3) {
  @apply font-bold text-slate-900 mt-6 mb-3;
}

.prose :deep(h1) {
  @apply text-xl;
}

.prose :deep(h2) {
  @apply text-lg;
}

.prose :deep(h3) {
  @apply text-base;
}
</style>
