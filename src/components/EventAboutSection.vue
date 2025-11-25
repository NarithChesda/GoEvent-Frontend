<template>
  <div class="pb-8">
    <!-- Banner Image (1200x630 ratio) -->
    <div v-if="event.banner_image" class="relative w-full mb-6 rounded-2xl overflow-hidden shadow-lg" style="aspect-ratio: 1200 / 630;">
      <img
        :src="getBannerUrl(event.banner_image)"
        :alt="event.title"
        class="w-full h-full object-cover"
      />
    </div>

    <!-- Event Info Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="px-5 py-6 space-y-6">
        <!-- Title & Organizer -->
        <div>
          <h1 class="text-2xl font-bold text-slate-900 leading-tight mb-3">
            {{ event.title }}
          </h1>

          <!-- Organizer -->
          <div v-if="event.organizer_details" class="flex items-center gap-2 text-sm text-slate-600">
            <div class="flex items-center gap-2">
              <img
                v-if="event.organizer_details.profile_picture"
                :src="getProfileUrl(event.organizer_details.profile_picture)"
                :alt="organizerName"
                class="w-7 h-7 rounded-full object-cover"
              />
              <div v-else class="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-medium">
                {{ getInitials(organizerName) }}
              </div>
              <span class="font-medium">{{ organizerName }}</span>
            </div>
          </div>
        </div>

        <!-- Date & Time -->
        <div class="flex items-start gap-4">
          <div class="w-12 h-16 bg-slate-100 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
            <span class="text-[10px] font-semibold text-slate-500 uppercase leading-none">{{ getMonthAbbr(event.start_date) }}</span>
            <span class="text-xl font-bold text-slate-900 leading-tight">{{ getDayOfMonth(event.start_date) }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-slate-900">{{ getFormattedDate(event.start_date) }}</p>
            <p class="text-sm text-slate-600">{{ getTimeRange(event.start_date, event.end_date) }}</p>
            <button
              @click="showCalendarOptions = !showCalendarOptions"
              class="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1.5 font-medium"
            >
              <CalendarPlus class="w-4 h-4" />
              Add to Calendar
            </button>
            <!-- Calendar Options Dropdown -->
            <div v-if="showCalendarOptions" class="mt-2 flex flex-wrap gap-2">
              <button
                @click="addToGoogleCalendar"
                class="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Google
              </button>
              <button
                @click="addToOutlookCalendar"
                class="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Outlook
              </button>
              <button
                @click="downloadICSFile"
                class="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Download .ics
              </button>
            </div>
          </div>
        </div>

        <!-- Location -->
        <div v-if="event.location || event.is_virtual" class="flex items-start gap-4">
          <div class="w-12 h-16 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Video v-if="event.is_virtual" class="w-5 h-5 text-slate-600" />
            <MapPin v-else class="w-5 h-5 text-slate-600" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-slate-900">
              {{ event.is_virtual ? 'Virtual Event' : getLocationName(event.location) }}
            </p>
            <p v-if="!event.is_virtual && event.location" class="text-sm text-slate-600">
              {{ event.location }}
            </p>
            <p v-if="event.is_virtual && event.virtual_link" class="text-sm text-slate-600 truncate">
              {{ event.virtual_link }}
            </p>
            <button
              v-if="!event.is_virtual && event.location"
              @click="openMap"
              class="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1.5 font-medium"
            >
              <ExternalLink class="w-4 h-4" />
              View on Map
            </button>
            <button
              v-if="event.is_virtual && event.virtual_link"
              @click="$emit('join-virtual')"
              class="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1.5 font-medium"
            >
              <ExternalLink class="w-4 h-4" />
              Join Virtual Event
            </button>
          </div>
        </div>

        <!-- About Event -->
        <div class="border-t border-slate-100 pt-6">
          <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">About Event</h3>
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
        <div v-if="event.agenda_items && event.agenda_items.length > 0" class="border-t border-slate-100 pt-6">
          <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Agenda</h3>
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
                  class="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div class="min-w-0 flex-1">
                    <p class="font-medium text-slate-900">{{ item.title }}</p>
                    <p v-if="item.description" class="text-sm text-slate-500 line-clamp-1">{{ item.description }}</p>
                  </div>
                  <p v-if="item.start_time_text || item.end_time_text" class="text-sm text-slate-500 flex-shrink-0">
                    {{ formatAgendaTime(item) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Location Map -->
        <div v-if="googleMapEmbedUrl" class="border-t border-slate-100 pt-6">
          <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Location</h3>
          <div class="rounded-xl overflow-hidden border border-slate-200">
            <iframe
              :src="googleMapEmbedUrl"
              width="100%"
              height="250"
              style="border:0;"
              allowfullscreen=""
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              class="w-full"
            />
          </div>
        </div>

        <!-- Hosts -->
        <div v-if="event.hosts && event.hosts.length > 0" class="border-t border-slate-100 pt-6">
          <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Hosted By</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              v-for="host in event.hosts"
              :key="host.id"
              class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
            >
              <img
                v-if="host.profile_image"
                :src="getProfileUrl(host.profile_image)"
                :alt="host.name"
                class="w-12 h-12 rounded-full object-cover"
              />
              <div v-else class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                {{ getInitials(host.name) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-slate-900 truncate">{{ host.name }}</p>
                <p v-if="host.title" class="text-sm text-slate-500 truncate">{{ host.title }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Category Tag -->
        <div v-if="event.category_details" class="border-t border-slate-100 pt-6">
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
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import DOMPurify from 'dompurify'
import {
  MapPin,
  Video,
  ChevronDown,
  CalendarPlus,
  ExternalLink,
} from 'lucide-vue-next'
import { type Event } from '../services/api'
import { apiClient } from '../services/api'
import { extractGoogleMapsEmbedUrl } from '../utils/embedExtractor'
import type { EventAgendaItem } from '../services/api/types/event.types'

interface Props {
  event: Event
}

interface Emits {
  (e: 'join-virtual'): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

// State
const showCalendarOptions = ref(false)
const expandedAgendaGroups = ref<Record<string, boolean>>({})

// Get organizer name
const organizerName = computed(() => {
  if (!props.event.organizer_details) return 'GoEvent'
  const { first_name, last_name, username } = props.event.organizer_details
  if (first_name && last_name) return `${first_name} ${last_name}`
  return first_name || username || 'GoEvent'
})

// Sanitize HTML description
const sanitizedDescription = computed(() => {
  if (!props.event.description) return ''
  return DOMPurify.sanitize(props.event.description, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class'],
  })
})

// Google Map embed URL
const googleMapEmbedUrl = computed(() => {
  if (!props.event.google_map_embed_link) return ''
  return extractGoogleMapsEmbedUrl(props.event.google_map_embed_link)
})

// Grouped agenda items
interface AgendaGroup {
  date: string
  displayDate: string
  items: EventAgendaItem[]
}

const groupedAgendaItems = computed(() => {
  if (!props.event.agenda_items) return {} as Record<string, AgendaGroup>

  const sorted = [...props.event.agenda_items].sort((a, b) => a.order - b.order)
  const groups: Record<string, AgendaGroup> = {}

  sorted.forEach((item) => {
    const dateKey = item.date_text || item.date || props.event.start_date || 'unknown'
    const dateForDisplay = item.date || props.event.start_date || new Date().toISOString()

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

const formatAgendaTime = (item: { start_time_text?: string; end_time_text?: string }): string => {
  const start = item.start_time_text || ''
  const end = item.end_time_text || ''
  if (start && end) {
    return `${start} - ${end}`
  }
  return start || end
}

const openMap = () => {
  if (!props.event.location) return
  const encoded = encodeURIComponent(props.event.location)
  window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank')
}

// Calendar functions
const addToGoogleCalendar = () => {
  const startDate = new Date(props.event.start_date)
  const endDate = new Date(props.event.end_date)

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

  const title = sanitizeText(props.event.title, 200)
  const description = sanitizeText(
    props.event.description || props.event.short_description || '',
    500
  )

  let location = ''
  if (props.event.is_virtual) {
    location = props.event.virtual_link || 'Virtual Event'
  } else {
    location = sanitizeText(props.event.location || '', 200)
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
  const startDate = new Date(props.event.start_date)
  const endDate = new Date(props.event.end_date)

  const params = new URLSearchParams({
    subject: props.event.title,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
    body: props.event.description || props.event.short_description || '',
    location: props.event.is_virtual
      ? props.event.virtual_link || 'Virtual Event'
      : props.event.location || '',
  })

  window.open(`https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`, '_blank')
  showCalendarOptions.value = false
}

const downloadICSFile = () => {
  const startDate = new Date(props.event.start_date)
  const endDate = new Date(props.event.end_date)

  const formatDateForICS = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '')
  }

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//GoEvent//Event Calendar//EN
BEGIN:VEVENT
UID:${props.event.id}@goevent.com
DTSTAMP:${formatDateForICS(new Date())}
DTSTART:${formatDateForICS(startDate)}
DTEND:${formatDateForICS(endDate)}
SUMMARY:${props.event.title}
DESCRIPTION:${props.event.description || props.event.short_description || ''}
LOCATION:${
    props.event.is_virtual
      ? props.event.virtual_link || 'Virtual Event'
      : props.event.location || ''
  }
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${props.event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  showCalendarOptions.value = false
}
</script>

<style scoped>
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

.prose :deep(h1) {
  @apply text-xl font-bold text-slate-900 mb-3 mt-4;
}

.prose :deep(h2) {
  @apply text-lg font-bold text-slate-900 mb-2 mt-3;
}

.prose :deep(h3) {
  @apply text-base font-semibold text-slate-900 mb-2 mt-3;
}

/* Line clamp utility */
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
