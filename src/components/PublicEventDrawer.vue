<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/50 z-[998]"
        @click="closeDrawer"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="slide-right">
      <div
        v-if="modelValue"
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[520px] lg:w-[580px] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden will-change-transform"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-white border-b border-slate-100 z-10">
          <div class="flex items-center justify-between px-4 py-3">
            <!-- Left Actions -->
            <div class="flex items-center gap-2">
              <button
                @click="closeDrawer"
                class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Close"
              >
                <ChevronDown class="w-5 h-5 text-slate-600 md:hidden" />
                <ChevronRight class="w-5 h-5 text-slate-600 hidden md:block" />
              </button>
            </div>

            <!-- Right Actions -->
            <div class="flex items-center gap-1">
              <button
                @click="navigatePrev"
                :disabled="!hasPrev"
                class="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronUp class="w-5 h-5 text-slate-600" />
              </button>
              <button
                @click="navigateNext"
                :disabled="!hasNext"
                class="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronDown class="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <!-- Loading State -->
          <div v-if="loading" class="p-6">
            <div class="animate-pulse space-y-4">
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
          <div v-else-if="error" class="p-6 text-center">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle class="w-8 h-8 text-red-500" />
            </div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">Unable to Load Event</h3>
            <p class="text-slate-600 mb-4">{{ error }}</p>
            <button
              @click="loadEvent"
              class="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Try Again
            </button>
          </div>

          <!-- Event Content -->
          <div v-else-if="event" class="pb-24">
            <!-- Banner Image (1200x630 ratio = 1.905:1) -->
            <div class="relative w-full" style="aspect-ratio: 1200 / 630;">
              <img
                v-if="!fallbackBannerError"
                :src="currentBannerSrc"
                :alt="event.title"
                class="w-full h-full object-cover"
                @error="handleBannerImageError"
              />
              <!-- Fallback when both primary and fallback images fail -->
              <div
                v-else
                class="w-full h-full bg-gradient-to-br from-[#2ecc71]/10 to-[#1e90ff]/10 flex flex-col items-center justify-center"
              >
                <CalendarDays class="w-12 h-12 text-[#2ecc71]/40 mb-2" />
                <span class="text-sm text-slate-400">{{ event.category_details?.name || 'Event' }}</span>
              </div>
            </div>

            <!-- Event Info -->
            <div class="px-4 py-5 space-y-5">
              <!-- Title & Category -->
              <div>
                <div class="flex items-start justify-between gap-3 mb-3">
                  <h1 class="text-xl font-bold text-slate-900 leading-tight">
                    {{ event.title }}
                  </h1>
                  <span v-if="event.category_details" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-full flex-shrink-0">
                    <span class="text-slate-400">#</span>
                    {{ event.category_details.name }}
                  </span>
                </div>

                <!-- Organizer -->
                <div v-if="event.organizer_details" class="flex items-center gap-2 text-sm text-slate-600">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-medium">
                      {{ getInitials(organizerName) }}
                    </div>
                    <span>{{ organizerName }}</span>
                  </div>
                </div>
              </div>

              <!-- Date & Time -->
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 bg-slate-100 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                  <span class="text-[10px] font-semibold text-slate-500 uppercase leading-none">{{ getMonthAbbr(event.start_date) }}</span>
                  <span class="text-xl font-bold text-slate-900 leading-tight">{{ getDayOfMonth(event.start_date) }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-slate-900">{{ getFormattedDate(event.start_date) }}</p>
                  <p class="text-sm text-slate-600">{{ getTimeRange(event.start_date, event.end_date) }}</p>
                  <button
                    @click="showCalendarOptions = !showCalendarOptions"
                    class="mt-1.5 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <CalendarPlus class="w-4 h-4" />
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
              <div v-if="event.location || event.is_virtual" class="flex items-start gap-4">
                <div class="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Video v-if="event.is_virtual" class="w-5 h-5 text-slate-600" />
                  <MapPin v-else class="w-5 h-5 text-slate-600" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-slate-900">
                    {{ event.is_virtual ? 'Virtual Event' : event.location }}
                  </p>
                  <button
                    v-if="!event.is_virtual && event.location"
                    @click="openMap"
                    class="mt-1.5 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <ExternalLink class="w-4 h-4" />
                    View on Map
                  </button>
                </div>
              </div>

              <!-- Registration Section -->
              <div v-if="event.registration_required" class="bg-slate-50 rounded-xl p-4">
                <h3 class="text-sm font-semibold text-slate-700 mb-3">Registration</h3>
                <p class="text-sm text-slate-600 mb-4">
                  {{ registrationMessage }}
                </p>

                <!-- User Info (if logged in) -->
                <div v-if="currentUser" class="flex items-center gap-3 mb-4 p-3 bg-white rounded-lg border border-slate-200">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-medium">
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
                  class="w-full bg-slate-900 text-white font-semibold py-3 px-4 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ isRegistering ? 'Registering...' : 'Register' }}
                </button>

                <!-- Already Registered -->
                <div
                  v-else-if="event.is_registered"
                  class="w-full bg-green-50 text-green-700 font-semibold py-3 px-4 rounded-xl text-center flex items-center justify-center gap-2"
                >
                  <CheckCircle class="w-5 h-5" />
                  You're Registered
                </div>

                <!-- Login to Register -->
                <button
                  v-else-if="!currentUser"
                  @click="handleLoginToRegister"
                  class="w-full bg-slate-900 text-white font-semibold py-3 px-4 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Login to Register
                </button>

                <!-- Registration Closed/Full -->
                <div
                  v-else-if="isRegistrationClosed || isEventFull"
                  class="w-full bg-slate-100 text-slate-500 font-semibold py-3 px-4 rounded-xl text-center"
                >
                  {{ isEventFull ? 'Event is Full' : 'Registration Closed' }}
                </div>
              </div>

              <!-- About Event -->
              <div class="border-t border-slate-100 pt-5">
                <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">About Event</h3>
                <div
                  v-if="event.description"
                  class="prose prose-sm max-w-none text-slate-700"
                  v-html="sanitizedDescription"
                />
                <p v-else-if="event.short_description" class="text-slate-700 leading-relaxed">
                  {{ event.short_description }}
                </p>
                <p v-else class="text-slate-500 italic">No description provided.</p>
              </div>

              <!-- Agenda -->
              <div v-if="event.agenda_items && event.agenda_items.length > 0" class="border-t border-slate-100 pt-5">
                <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Agenda</h3>
                <div class="space-y-3">
                  <div
                    v-for="(group, dateKey) in groupedAgendaItems"
                    :key="dateKey"
                    class="border border-slate-200 rounded-xl overflow-hidden"
                  >
                    <!-- Date Group Header -->
                    <button
                      @click="toggleAgendaGroup(dateKey)"
                      class="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-white rounded-lg flex flex-col items-center justify-center border border-slate-200">
                          <span class="text-[9px] font-semibold text-slate-500 uppercase leading-none">{{ getMonthAbbr(group.date) }}</span>
                          <span class="text-sm font-bold text-slate-900 leading-tight">{{ getDayOfMonth(group.date) }}</span>
                        </div>
                        <div class="text-left">
                          <p class="font-medium text-slate-900 text-sm">{{ group.displayDate }}</p>
                          <p class="text-xs text-slate-500">{{ group.items.length }} {{ group.items.length === 1 ? 'item' : 'items' }}</p>
                        </div>
                      </div>
                      <ChevronDown
                        class="w-5 h-5 text-slate-400 transition-transform duration-200"
                        :class="{ 'rotate-180': expandedAgendaGroups[dateKey] }"
                      />
                    </button>

                    <!-- Agenda Items -->
                    <div
                      v-show="expandedAgendaGroups[dateKey]"
                      class="divide-y divide-slate-100"
                    >
                      <div
                        v-for="item in group.items"
                        :key="item.id"
                        class="flex items-center justify-between gap-3 px-4 py-2.5"
                      >
                        <p class="font-medium text-slate-900 truncate">{{ item.title }}</p>
                        <p v-if="item.start_time_text || item.end_time_text" class="text-sm text-slate-500 flex-shrink-0">
                          {{ formatAgendaTime(item) }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Location Map -->
              <div v-if="googleMapEmbedUrl" class="border-t border-slate-100 pt-5">
                <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Location</h3>
                <div class="rounded-xl overflow-hidden border border-slate-200">
                  <iframe
                    :src="googleMapEmbedUrl"
                    width="100%"
                    height="200"
                    style="border:0;"
                    allowfullscreen
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"
                    class="w-full"
                  />
                </div>
              </div>

              <!-- Hosts -->
              <div v-if="event.hosts && event.hosts.length > 0" class="border-t border-slate-100 pt-5">
                <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Hosted By</h3>
                <div class="space-y-3">
                  <div
                    v-for="host in event.hosts"
                    :key="host.id"
                    class="flex items-center gap-3"
                  >
                    <img
                      v-if="host.profile_image"
                      :src="getProfileUrl(host.profile_image)"
                      :alt="host.name"
                      class="w-10 h-10 rounded-full object-cover"
                    />
                    <div v-else class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                      {{ getInitials(host.name) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-slate-900 truncate">{{ host.name }}</p>
                      <p v-if="host.title" class="text-sm text-slate-500 truncate">{{ host.title }}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DOMPurify from 'dompurify'
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MapPin,
  Video,
  AlertCircle,
  CheckCircle,
  CalendarPlus,
  ExternalLink,
  CalendarDays,
} from 'lucide-vue-next'
import { eventsService, type Event } from '../services/api'
import { getEventFallbackImage } from '@/composables/useEventFormatters'
import { useAuthStore } from '../stores/auth'
import { apiClient } from '../services/api'
import { extractGoogleMapsEmbedUrl } from '../utils/embedExtractor'

interface Props {
  modelValue: boolean
  eventId: string | null
  hasPrev?: boolean
  hasNext?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'navigate-prev'): void
  (e: 'navigate-next'): void
  (e: 'registered'): void
  (e: 'login-required'): void
}

const props = withDefaults(defineProps<Props>(), {
  hasPrev: false,
  hasNext: false,
})

const emit = defineEmits<Emits>()

const router = useRouter()
const authStore = useAuthStore()

// State
const event = ref<Event | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const isRegistering = ref(false)
const showCalendarOptions = ref(false)
const expandedAgendaGroups = ref<Record<string, boolean>>({})

// Banner image fallback state
const primaryBannerError = ref(false)
const fallbackBannerError = ref(false)

// Handle banner image load error - try fallback first, then show placeholder
const handleBannerImageError = () => {
  if (!primaryBannerError.value) {
    primaryBannerError.value = true
  } else {
    fallbackBannerError.value = true
  }
}

// Reset banner error states when event changes
const resetBannerErrors = () => {
  primaryBannerError.value = false
  fallbackBannerError.value = false
}

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

const googleMapEmbedUrl = computed(() => {
  if (!event.value?.google_map_embed_link) return ''
  return extractGoogleMapsEmbedUrl(event.value.google_map_embed_link)
})

// Current banner image source - primary first, then fallback
const currentBannerSrc = computed(() => {
  if (!event.value) return ''
  if (!primaryBannerError.value && event.value.banner_image) {
    return getBannerUrl(event.value.banner_image)
  }
  return getEventFallbackImage(event.value)
})

import type { EventAgendaItem } from '../services/api/types/event.types'

interface AgendaGroup {
  date: string
  displayDate: string
  items: EventAgendaItem[]
}

const groupedAgendaItems = computed(() => {
  if (!event.value?.agenda_items) return {} as Record<string, AgendaGroup>

  const sorted = [...event.value.agenda_items].sort((a, b) => a.order - b.order)
  const groups: Record<string, AgendaGroup> = {}

  sorted.forEach((item) => {
    // Use date_text as primary, fallback to date field, then event start_date
    const dateKey = item.date_text || item.date || event.value?.start_date || 'unknown'
    const dateForDisplay = item.date || event.value?.start_date || new Date().toISOString()

    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: dateForDisplay,
        displayDate: item.date_text || getFormattedDate(dateForDisplay),
        items: []
      }
      // Auto-expand first group
      if (Object.keys(groups).length === 1 && expandedAgendaGroups.value[dateKey] === undefined) {
        expandedAgendaGroups.value[dateKey] = true
      }
    }
    groups[dateKey].items.push(item)
  })

  return groups
})

const toggleAgendaGroup = (dateKey: string) => {
  expandedAgendaGroups.value[dateKey] = !expandedAgendaGroups.value[dateKey]
}

// Methods
const loadEvent = async () => {
  if (!props.eventId) return

  loading.value = true
  error.value = null
  resetBannerErrors()

  try {
    const response = await eventsService.getEvent(props.eventId)
    if (response.success && response.data) {
      event.value = response.data
    } else {
      error.value = response.message || 'Event not found'
    }
  } catch (err) {
    error.value = 'Failed to load event details'
  } finally {
    loading.value = false
  }
}

const closeDrawer = () => {
  emit('update:modelValue', false)
}

const navigatePrev = () => {
  emit('navigate-prev')
}

const navigateNext = () => {
  emit('navigate-next')
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
      emit('registered')
      await loadEvent()
    }
  } catch (err) {
    console.error('Registration failed:', err)
  } finally {
    isRegistering.value = false
  }
}

const handleLoginToRegister = () => {
  emit('login-required')
  closeDrawer()
  router.push(`/signin?redirect=${encodeURIComponent(`/events/${props.eventId}`)}`)
}

const openMap = () => {
  if (!event.value?.location) return
  const encoded = encodeURIComponent(event.value.location)
  window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank')
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

const getInitials = (name: string): string => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

const formatAgendaTime = (item: { start_time_text?: string; end_time_text?: string }): string => {
  const start = item.start_time_text || ''
  const end = item.end_time_text || ''
  if (start && end) {
    return `${start} - ${end}`
  }
  return start || end
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

// Watchers
watch(
  () => props.eventId,
  (newId) => {
    if (newId && props.modelValue) {
      loadEvent()
    }
  },
  { immediate: true }
)

// Calculate scrollbar width to prevent layout shift
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen && props.eventId) {
      loadEvent()
    }
    // Prevent body scroll when drawer is open, compensate for scrollbar width
    if (isOpen) {
      const scrollbarWidth = getScrollbarWidth()
      document.body.style.overflow = 'hidden'
      // Add padding to prevent layout shift when scrollbar disappears
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    } else {
      // Defer body style resets until after transition completes (350ms)
      // to prevent layout recalculation during animation
      setTimeout(() => {
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
      }, 350)
    }
  }
)

onMounted(() => {
  if (props.modelValue && props.eventId) {
    loadEvent()
  }
})
</script>

<style scoped>
/* Fade transition for backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide from right on desktop, from bottom on mobile */
.slide-right-enter-active {
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}

.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateY(100%) translateZ(0);
}

@media (min-width: 768px) {
  .slide-right-enter-from,
  .slide-right-leave-to {
    transform: translateX(100%) translateZ(0);
  }
}

/* Prose styling for description */
.prose :deep(p) {
  @apply mb-3 leading-relaxed;
}

.prose :deep(strong) {
  @apply font-semibold text-slate-900;
}

.prose :deep(a) {
  @apply text-blue-600 hover:text-blue-700 underline;
}

.prose :deep(ul),
.prose :deep(ol) {
  @apply ml-4 mb-3 space-y-1;
}

.prose :deep(li) {
  @apply leading-relaxed;
}
</style>
