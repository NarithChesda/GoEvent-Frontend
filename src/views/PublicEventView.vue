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
        <div class="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
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
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="max-w-3xl mx-auto px-4 py-6 md:py-8">
        <!-- Banner Image -->
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
            <!-- Title & Category -->
            <div>
              <!-- Title -->
              <div class="mb-3">
                <h1 class="text-2xl font-bold text-slate-900 leading-tight">
                  {{ event.title }}
                </h1>
              </div>

              <!-- Organizer & Category -->
              <div class="flex items-center justify-between gap-3">
                <!-- Organizer -->
                <div v-if="event.organizer_details" class="flex items-center gap-2 text-sm text-slate-600">
                  <img
                    v-if="event.organizer_details.profile_picture"
                    :src="getProfileUrl(event.organizer_details.profile_picture)"
                    :alt="organizerName"
                    class="w-7 h-7 rounded-full object-cover"
                  />
                  <div v-else class="w-7 h-7 rounded-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white text-xs font-medium">
                    {{ getInitials(organizerName) }}
                  </div>
                  <span class="font-medium">{{ organizerName }}</span>
                </div>

                <!-- Category Badge -->
                <span v-if="event.category_details" class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full flex-shrink-0">
                  <span class="text-slate-400">#</span>
                  {{ event.category_details.name }}
                </span>
              </div>
            </div>

            <!-- Date & Time -->
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-xl flex-shrink-0 shadow-md shadow-emerald-900/10 overflow-hidden ring-1 ring-black/5">
                <!-- Month Header -->
                <div class="h-[38%] bg-gradient-to-r from-emerald-500 to-sky-500 flex items-center justify-center">
                  <span class="text-[8px] font-bold text-white uppercase tracking-wider">{{ getMonthAbbr(event.start_date) }}</span>
                </div>
                <!-- Day Number -->
                <div class="h-[62%] bg-white flex items-center justify-center">
                  <span class="text-lg font-bold text-slate-800 leading-none">{{ getDayOfMonth(event.start_date) }}</span>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-slate-900">{{ getFormattedDate(event.start_date) }}</p>
                <p class="text-sm text-slate-600">{{ getTimeRange(event.start_date, event.end_date) }}</p>

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
              <div class="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Video v-if="event.is_virtual" class="w-5 h-5 text-slate-600" />
                <MapPin v-else class="w-5 h-5 text-slate-600" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-slate-900">
                  {{ event.is_virtual ? 'Virtual Event' : (event.location || 'Location TBD') }}
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
                  @click="joinVirtualEvent"
                  class="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1.5 font-medium"
                >
                  <ExternalLink class="w-4 h-4" />
                  Join Virtual Event
                </button>
              </div>
            </div>

            <!-- Registration Section - Already Registered (You're In) -->
            <div v-if="event.registration_required && isUserRegistered" class="pt-2">
              <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <!-- Header with avatar and status -->
                <div class="p-5 pb-4">
                  <div class="flex items-center justify-between mb-3">
                    <div class="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xl font-medium shadow-md">
                      {{ getInitials(currentUser?.first_name || currentUser?.username || 'U') }}
                    </div>
                    <!-- Status Badge -->
                    <span :class="registrationStatusBadgeClass" class="px-3 py-1 text-xs font-medium rounded-full">
                      {{ registrationStatusLabel }}
                    </span>
                  </div>
                  <h3 class="text-2xl font-bold text-slate-900">You're In</h3>
                </div>

                <!-- Event countdown -->
                <div v-if="timeUntilEvent || event.is_ongoing" class="mx-5 mb-4 bg-slate-50 rounded-lg p-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 text-slate-600">
                      <Clock class="w-4 h-4" />
                      <span class="text-sm">{{ event.is_ongoing ? 'Event is happening now' : 'Event starting in' }}</span>
                    </div>
                    <span v-if="timeUntilEvent" class="text-sm font-semibold text-orange-500">{{ timeUntilEvent }}</span>
                  </div>
                  <p v-if="event.is_virtual && event.virtual_link" class="text-xs text-slate-500 mt-1.5 border-t border-slate-200 pt-2">
                    The join button will be shown when the event is about to start.
                  </p>
                </div>

                <!-- Action buttons -->
                <div class="px-5 pb-4 flex gap-2">
                  <button
                    @click="showCalendarOptions = !showCalendarOptions"
                    class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <CalendarPlus class="w-4 h-4" />
                    Add to Calendar
                  </button>
                  <button
                    @click="shareEvent"
                    class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Share2 class="w-4 h-4" />
                    Invite a Friend
                  </button>
                </div>

                <!-- Calendar Options Dropdown -->
                <div v-if="showCalendarOptions" class="px-5 pb-4 flex flex-wrap gap-2">
                  <button
                    @click="addToGoogleCalendar"
                    class="px-3 py-1.5 text-xs bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                  >
                    Google
                  </button>
                  <button
                    @click="addToOutlookCalendar"
                    class="px-3 py-1.5 text-xs bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                  >
                    Outlook
                  </button>
                  <button
                    @click="downloadICSFile"
                    class="px-3 py-1.5 text-xs bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                  >
                    Download .ics
                  </button>
                </div>

                <!-- Cancel registration link -->
                <div class="px-5 pb-4 text-sm text-slate-600">
                  No longer able to attend? Notify the host by
                  <button
                    @click="handleCancelRegistration"
                    :disabled="isCancelling"
                    class="text-pink-500 hover:text-pink-600 underline underline-offset-2 disabled:opacity-50"
                  >
                    {{ isCancelling ? 'cancelling...' : 'canceling your registration' }}
                  </button>.
                </div>

                <!-- Confirmation code (if available) -->
                <div v-if="userRegistration?.confirmation_code" class="border-t border-slate-100 px-5 py-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-xs text-slate-500 mb-0.5">Confirmation Code</p>
                      <p class="font-mono font-semibold text-slate-900">{{ userRegistration.confirmation_code }}</p>
                    </div>
                    <button
                      @click="showQRModal = true"
                      class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Show QR Code"
                    >
                      <QrCode class="w-5 h-5 text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Registration Section - Not Registered -->
            <div v-else-if="event.registration_required" class="pt-2">
              <div class="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-5 border border-emerald-100">
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
            </div>

            <!-- About Event -->
            <div v-if="event.description" class="border-t border-slate-100 pt-6">
              <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">About Event</h3>
              <div class="prose prose-sm max-w-none text-slate-700" v-html="sanitizedDescription" />
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
                      <div class="w-10 h-10 rounded-lg flex-shrink-0 shadow-sm shadow-emerald-900/10 overflow-hidden ring-1 ring-black/5">
                        <!-- Month Header -->
                        <div class="h-[38%] bg-gradient-to-r from-emerald-500 to-sky-500 flex items-center justify-center">
                          <span class="text-[7px] font-bold text-white uppercase tracking-wider">{{ getMonthAbbr(group.date) }}</span>
                        </div>
                        <!-- Day Number -->
                        <div class="h-[62%] bg-white flex items-center justify-center">
                          <span class="text-sm font-bold text-slate-800 leading-none">{{ getDayOfMonth(group.date) }}</span>
                        </div>
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
                  allowfullscreen
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

    <!-- QR Code Modal -->
    <Transition name="fade">
      <div
        v-if="showQRModal && userRegistration?.confirmation_code"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]"
        @click="showQRModal = false"
      >
        <div
          class="bg-white rounded-2xl shadow-2xl p-6 mx-4 max-w-xs w-full"
          @click.stop
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-slate-900">Check-in QR Code</h3>
            <button
              @click="showQRModal = false"
              class="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X class="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <div class="flex flex-col items-center">
            <div class="bg-white p-3 rounded-xl border border-slate-200 mb-4">
              <img
                :src="qrCodeUrl"
                :alt="userRegistration.confirmation_code"
                class="w-48 h-48"
              />
            </div>
            <p class="text-xs text-slate-500 mb-1">Confirmation Code</p>
            <p class="font-mono font-bold text-lg text-slate-900">{{ userRegistration.confirmation_code }}</p>
            <p class="text-xs text-slate-500 mt-3 text-center">Show this QR code at the event for quick check-in</p>
          </div>
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
  Clock,
  CalendarPlus,
  Share2,
  QrCode,
  X,
  ChevronDown,
} from 'lucide-vue-next'
import { eventsService, type Event, type EventRegistration } from '../services/api'
import { useAuthStore } from '../stores/auth'
import { apiClient } from '../services/api'
import { extractGoogleMapsEmbedUrl } from '../utils/embedExtractor'
import type { EventAgendaItem } from '../services/api/types/event.types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// State
const event = ref<Event | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const isRegistering = ref(false)
const isCancelling = ref(false)
const linkCopied = ref(false)
const showCalendarOptions = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const userRegistration = ref<EventRegistration | null>(null)
const registrationChecked = ref(false)
const showQRModal = ref(false)
const expandedAgendaGroups = ref<Record<string, boolean>>({})

// Statuses that mean user is NOT actively registered/attending
const NON_ATTENDING_STATUSES = ['not_coming', 'declined', 'cancelled', 'withdrawn', 'no']

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

// Registration status label for display
const registrationStatusLabel = computed(() => {
  const status = userRegistration.value?.status || ''
  return status.replace(/\b\w/g, (c) => c.toUpperCase())
})

// Registration status badge styling
const registrationStatusBadgeClass = computed(() => {
  const status = userRegistration.value?.status?.toLowerCase() || ''
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-700'
    case 'checked in':
    case 'checked_in':
      return 'bg-blue-100 text-blue-700'
    case 'registered':
      return 'bg-amber-100 text-amber-700'
    case 'pending':
      return 'bg-yellow-100 text-yellow-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
})

// Check if user is registered and attending
const isUserRegistered = computed(() => {
  if (registrationChecked.value) {
    if (!userRegistration.value) return false
    const status = userRegistration.value.status?.toLowerCase() || ''
    if (NON_ATTENDING_STATUSES.includes(status)) return false
    return true
  }
  if (event.value?.is_registered) return true
  return false
})

const canRegister = computed(() => {
  if (!event.value || !authStore.isAuthenticated) return false
  if (isUserRegistered.value || event.value.is_past) return false
  if (!event.value.registration_required) return false
  if (isEventFull.value || isRegistrationClosed.value) return false
  return true
})

// Calculate time until event starts
const timeUntilEvent = computed(() => {
  if (!event.value?.start_date) return null
  const now = new Date()
  const eventStart = new Date(event.value.start_date)
  const diff = eventStart.getTime() - now.getTime()
  if (diff <= 0) return null
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `${days}d ${hours}h`
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
})

// Generate QR code URL for confirmation code
const qrCodeUrl = computed(() => {
  if (!userRegistration.value?.confirmation_code) return ''
  const code = encodeURIComponent(userRegistration.value.confirmation_code)
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${code}`
})

const registrationMessage = computed(() => {
  if (!event.value?.registration_required) return ''
  if (isUserRegistered.value) return 'You are registered for this event.'
  if (isEventFull.value) return 'This event has reached capacity.'
  if (isRegistrationClosed.value) return 'Registration for this event has closed.'
  return 'Welcome! To join the event, please register below.'
})

// Google Map embed URL
const googleMapEmbedUrl = computed(() => {
  if (!event.value?.google_map_embed_link) return ''
  return extractGoogleMapsEmbedUrl(event.value.google_map_embed_link)
})

// Grouped agenda items
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

const formatAgendaTime = (item: { start_time_text?: string; end_time_text?: string }): string => {
  const start = item.start_time_text || ''
  const end = item.end_time_text || ''
  if (start && end) {
    return `${start} - ${end}`
  }
  return start || end
}

// Methods
const loadEvent = async () => {
  const eventId = route.params.id as string
  if (!eventId) {
    error.value = 'Invalid event ID'
    return
  }

  loading.value = true
  error.value = null
  userRegistration.value = null
  registrationChecked.value = false

  try {
    // Fetch event data and user's registration status in parallel
    const eventPromise = eventsService.getEvent(eventId)
    const registrationPromise = authStore.isAuthenticated
      ? eventsService.getMyRegistration(eventId)
      : Promise.resolve(null)

    const [eventResponse, registrationResponse] = await Promise.all([
      eventPromise,
      registrationPromise,
    ])

    if (eventResponse.success && eventResponse.data) {
      event.value = eventResponse.data

      // If user can edit this event, redirect to manage page
      if (event.value.can_edit) {
        router.replace(`/events/${eventId}/manage`)
        return
      }

      // Mark that we've checked registration status
      if (authStore.isAuthenticated) {
        registrationChecked.value = true
      }

      // Store the full registration data if user is registered
      if (registrationResponse && registrationResponse.success && registrationResponse.data) {
        userRegistration.value = registrationResponse.data
      }
    } else {
      error.value = eventResponse.message || 'Event not found'
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

const handleRegister = async () => {
  if (!event.value || !authStore.isAuthenticated) return

  isRegistering.value = true

  try {
    const response = await eventsService.registerForEvent(event.value.id, {
      guest_count: 0,
      notes: '',
    })

    if (response.success && response.data) {
      userRegistration.value = response.data
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

const handleCancelRegistration = async () => {
  if (!event.value || !authStore.isAuthenticated) return

  isCancelling.value = true

  try {
    const response = await eventsService.unregisterFromEvent(event.value.id)

    if (response.success) {
      if (response.data) {
        const registrationData = (response.data as { registration?: EventRegistration }).registration || response.data
        userRegistration.value = registrationData
      } else {
        userRegistration.value = null
      }
      registrationChecked.value = true
      showMessage('success', 'Registration cancelled successfully')
    } else {
      showMessage('error', response.message || 'Failed to cancel registration')
    }
  } catch (err) {
    showMessage('error', 'An error occurred while cancelling')
  } finally {
    isCancelling.value = false
  }
}

const shareEvent = async () => {
  if (!event.value) return

  const eventId = route.params.id as string
  const shareUrl = `${window.location.origin}/events/${eventId}`
  const shareData = {
    title: event.value.title,
    text: event.value.short_description || event.value.title,
    url: shareUrl,
  }

  try {
    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      await navigator.clipboard.writeText(shareUrl)
      showMessage('success', 'Link copied to clipboard!')
    }
  } catch {
    // User cancelled or share failed
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

const joinVirtualEvent = () => {
  if (!event.value?.virtual_link) return
  window.open(event.value.virtual_link, '_blank')
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

/* Fade transition for QR modal */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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
