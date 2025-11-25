<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">
          Event Attendees
        </h2>
        <p class="text-xs sm:text-sm text-slate-600 mt-1">Manage registrations and check-ins</p>
      </div>
      <div class="flex items-center space-x-2 sm:space-x-3">
        <!-- Admin Check-in Button -->
        <button
          v-if="canEdit"
          @click="showCheckinModal = true"
          class="hidden sm:flex bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-green-500/25 hover:shadow-green-600/30 flex items-center text-sm sm:text-base"
        >
          <UserCheck class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          <span class="hidden sm:inline">Check-in Attendee</span>

        </button>
        <!-- Refresh Button -->
        <button
          @click="loadRegistrations(true)"
          class="bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl p-2 hover:bg-white/90 transition-all duration-200 hover:scale-[1.02] shadow-lg"
          :disabled="loading"
        >
          <RefreshCw class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" :class="{ 'animate-spin': loading }" />
        </button>
        <!-- Live Toggle -->
        <button
          @click="liveUpdates = !liveUpdates"
          class="bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl px-2.5 py-2 hover:bg-white/90 transition-all duration-200 shadow-lg flex items-center gap-1.5 text-slate-700 text-sm"
          :aria-pressed="liveUpdates"
          title="Toggle live updates"
        >
          <span
            class="inline-block w-2.5 h-2.5 rounded-full"
            :class="liveUpdates ? 'bg-green-500 animate-pulse' : 'bg-slate-300'"
          ></span>
          <span class="hidden sm:inline">Live</span>
        </button>
        <div v-if="liveUpdates && lastUpdatedText" class="hidden sm:block text-xs text-slate-500">
          Updated {{ lastUpdatedText }}
        </div>
      </div>
    </div>

    <!-- Removed stats cards for a cleaner, action-focused UI -->

    <!-- Search and Filter -->
    <div class="flex flex-col gap-2 sm:gap-3">
      <div class="flex gap-2 sm:gap-4">
        <div class="flex-1">
          <div class="relative">
            <Search
              class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#1e90ff] pointer-events-none z-10"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search attendees..."
              class="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2.5 sm:py-3 bg-white/60 backdrop-blur-md border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff]/30 transition-all duration-200 text-sm sm:text-base relative text-slate-800 placeholder-slate-400 shadow-sm"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-600 hover:text-[#1e90ff] rounded-lg hover:bg-white/60 active:bg-white/70"
              aria-label="Clear search"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Status Filter Chips -->
      <div class="flex flex-wrap gap-2">
        <button
          class="px-3 py-1.5 rounded-full border border-white/30 bg-white/60 text-xs sm:text-sm font-medium text-slate-700 hover:bg-white/80 transition-colors"
          :class="{ 'bg-[#B0E0E6] text-[#1873cc] border-[#B0E0E6]': statusFilter === '' }"
          @click="statusFilter = ''"
          aria-label="Filter: All"
        >
          All ({{ allCount }})
        </button>
        <button
          class="px-3 py-1.5 rounded-full border border-white/30 bg-white/60 text-xs sm:text-sm font-medium text-slate-700 hover:bg-white/80 transition-colors"
          :class="{ 'bg-[#B0E0E6] text-[#1873cc] border-[#B0E0E6]': statusFilter === 'registered' }"
          @click="statusFilter = 'registered'"
          aria-label="Filter: Not Checked In"
        >
          Not Checked In ({{ pendingCount }})
        </button>
        <button
          class="px-3 py-1.5 rounded-full border border-white/30 bg-white/60 text-xs sm:text-sm font-medium text-slate-700 hover:bg-white/80 transition-colors"
          :class="{ 'bg-emerald-100 text-emerald-700 border-emerald-200': statusFilter === 'checked_in' }"
          @click="statusFilter = 'checked_in'"
          aria-label="Filter: Checked In"
        >
          Checked In ({{ checkedInCount }})
        </button>
        <button
          class="px-3 py-1.5 rounded-full border border-white/30 bg-white/60 text-xs sm:text-sm font-medium text-slate-700 hover:bg-white/80 transition-colors"
          :class="{ 'bg-red-100 text-red-800 border-red-200': statusFilter === 'cancelled' }"
          @click="statusFilter = 'cancelled'"
          aria-label="Filter: Cancelled"
        >
          Cancelled ({{ cancelledCount }})
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6 sm:p-8"
    >
      <div class="flex items-center justify-center">
        <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#1e90ff]"></div>
        <span class="ml-2 sm:ml-3 text-xs sm:text-sm text-slate-600">Loading attendees...</span>
      </div>
    </div>

    <!-- Attendees List -->
    <div v-else-if="filteredRegistrations.length > 0" class="space-y-3 sm:space-y-4">
      <div
        v-for="registration in filteredRegistrations"
        :key="registration.id"
        class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
      >
        <div class="flex items-center justify-between gap-3 sm:gap-4">
          <div class="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <!-- Avatar -->
            <div class="relative flex-shrink-0">
              <div
                class="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-600 to-sky-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm"
              >
                {{
                  getInitials(
                    registration.user_details?.first_name || '',
                    registration.user_details?.last_name || '',
                  )
                }}
              </div>
              <!-- Status Indicator -->
              <div
                class="absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full border-2 border-white flex items-center justify-center"
                :class="getStatusBadgeColor(registration.status)"
              >
                <CheckCircle
                  v-if="registration.status === 'checked_in'"
                  class="w-2 h-2 sm:w-3 sm:h-3 text-white"
                />
                <Clock
                  v-else-if="registration.status === 'registered'"
                  class="w-2 h-2 sm:w-3 sm:h-3 text-white"
                />
                <X v-else class="w-2 h-2 sm:w-3 sm:h-3 text-white" />
              </div>
            </div>

            <!-- User Info -->
            <div class="min-w-0 flex-1">
              <h4 class="font-semibold text-slate-800 text-sm sm:text-lg mb-0.5 leading-tight truncate">
                {{ registration.user_details?.first_name }}
                {{ registration.user_details?.last_name }}
              </h4>
              <p class="text-xs sm:text-base text-slate-600 leading-tight truncate">
                @{{ registration.user_details?.username }}
              </p>
              <div class="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-1 sm:mt-2 space-y-0.5 sm:space-y-0">
                <span v-if="registration.registered_at" class="text-xs sm:text-sm text-slate-500">
                  Registered: {{ formatDate(registration.registered_at) }}
                </span>
                <span v-if="registration.checked_in_at" class="text-xs sm:text-sm text-green-600">
                  Checked in: {{ formatDate(registration.checked_in_at) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Registration Details -->
          <div class="text-right space-y-0.5 sm:space-y-2 flex-shrink-0">
            <!-- Attendee Count -->
            <div class="text-xs sm:text-base font-semibold text-slate-800 leading-tight whitespace-nowrap">
              {{ registration.total_attendees }}
              {{ registration.total_attendees === 1 ? 'person' : 'people' }}
            </div>

            <!-- Confirmation Code -->
            <div
              class="text-xs sm:text-sm font-mono text-slate-500 tracking-wide bg-slate-100 px-2 py-1 rounded inline-block"
            >
              {{ registration.confirmation_code }}
            </div>
            <button
              class="inline-flex items-center p-1.5 ml-1 rounded-lg bg-white/70 border border-white/40 text-slate-600 hover:text-slate-800 hover:bg-white/90 transition-colors"
              @click="copyToClipboard(registration.confirmation_code)"
              aria-label="Copy confirmation code"
              title="Copy code"
            >
              <Copy class="w-3.5 h-3.5" />
            </button>

            <!-- Status Badge -->
            <div class="flex justify-end">
              <span
                class="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium"
                :class="getStatusTextColor(registration.status)"
              >
                {{ getStatusLabel(registration.status) }}
              </span>
            </div>

            <!-- Inline Actions -->
            <div class="flex justify-end gap-2">
              <button
                v-if="registration.status === 'registered' && canEdit"
                @click="performRowCheckin(registration)"
                class="inline-flex items-center px-2.5 py-1 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="rowChecking[registration.id] === true"
                aria-label="Check in attendee"
              >
                <div v-if="rowChecking[registration.id]" class="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                <UserCheck v-else class="w-3.5 h-3.5 mr-1" />
                Check In
              </button>
            </div>

            <!-- Notes -->
            <div v-if="registration.notes" class="text-xs sm:text-sm text-slate-600 italic max-w-xs">
              "{{ registration.notes }}"
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!loading"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 sm:p-12 text-center"
    >
      <Users class="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3 sm:mb-4" />
      <h3 class="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">
        {{ searchQuery || statusFilter ? 'No attendees found' : 'No registrations yet' }}
      </h3>
      <p class="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6">
        {{
          searchQuery || statusFilter
            ? 'Try adjusting your search or filter criteria.'
            : 'Share your event to start getting registrations!'
        }}
      </p>
      <button
        v-if="searchQuery || statusFilter"
        @click="clearFilters"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 text-sm sm:text-base"
      >
        Clear Filters
      </button>
    </div>

    <!-- Admin Check-in Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showCheckinModal"
          class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70]"
          :class="{ 'md:items-center items-end': showQRScanner }"
          @click="closeCheckinModal"
        >
          <div
            class="bg-white/95 backdrop-blur-sm border border-white/20 shadow-2xl w-full overflow-hidden relative"
            :class="showQRScanner ? 'h-full md:h-auto md:max-w-lg md:mx-4 md:rounded-3xl' : 'rounded-3xl max-w-lg mx-4'"
            @click.stop
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-slate-200 bg-white/90">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                    <UserCheck class="w-4.5 h-4.5" />
                  </div>
                  <h2 class="text-lg sm:text-xl font-semibold text-slate-900">Check-in Attendee</h2>
                </div>
                <button
                  @click="closeCheckinModal"
                  class="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Content -->
            <div class="p-6">
              <!-- QR Scanner View (Mobile Only) -->
              <div v-if="showQRScanner" class="space-y-4">
                <QRCodeScanner
                  @scan-success="handleQRScanSuccess"
                  @scan-error="handleQRScanError"
                  @close="showQRScanner = false"
                />
              </div>

              <!-- Manual Input View -->
              <div v-else class="space-y-5">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2"
                    >Confirmation Code <span class="text-red-500">*</span></label
                  >
                  <div class="relative">
                    <input
                      v-model="checkinCode"
                      type="text"
                      placeholder="Enter confirmation code..."
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                      :class="isMobile ? 'pr-12' : ''"
                      :disabled="isChecking"
                      @keyup.enter="performCheckin"
                    />
                    <!-- Camera Icon Button (Shows on mobile or narrow screens) -->
                    <button
                      v-if="isMobile"
                      type="button"
                      @click.prevent="showQRScanner = true"
                      class="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-600 hover:text-sky-600 transition-colors duration-200 rounded-lg hover:bg-slate-100 active:bg-slate-200"
                      :disabled="isChecking"
                      title="Scan QR Code"
                    >
                      <svg
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        ></path>
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        ></path>
                      </svg>
                    </button>
                  </div>
                  <p class="text-xs text-slate-500 mt-2">
                    {{ isMobile ? 'Enter code or tap camera icon to scan QR' : 'Enter the attendee\'s confirmation code' }}
                  </p>
                </div>

                <div class="flex flex-row justify-end gap-3 pt-5 border-t border-slate-200">
                  <button
                    @click="closeCheckinModal"
                    class="flex-1 sm:flex-none px-5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                    :disabled="isChecking"
                  >
                    Cancel
                  </button>
                  <button
                    @click="performCheckin"
                    class="flex-1 sm:flex-none px-6 py-2.5 text-sm bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-lg font-semibold transition-colors shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    :disabled="!checkinCode.trim() || isChecking"
                  >
                    <span
                      v-if="isChecking"
                      class="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"
                    ></span>
                    <UserCheck v-else class="w-4 h-4 mr-2" />
                    {{ isChecking ? 'Checking in...' : 'Check In' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Success/Error Messages -->
    <Transition name="slide-up">
      <div v-if="message" class="fixed bottom-8 right-8 z-50">
        <div
          :class="message.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
          class="text-white px-6 py-4 rounded-xl shadow-lg flex items-center"
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  Users,
  UserCheck,
  Clock,
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-vue-next'
import { Copy } from 'lucide-vue-next'
import {
  eventsService,
  type EventRegistration,
  type EventRegistrationDetail,
} from '../services/api'
import QRCodeScanner from './QRCodeScanner.vue'

interface Props {
  eventId: string
  canEdit: boolean
  registrations?: EventRegistrationDetail[]
}

const props = defineProps<Props>()

// State
const registrations = ref<EventRegistrationDetail[]>([])
const loading = ref(false)
const searchQuery = ref('')
const debouncedQuery = ref('')
let searchTimer: number | undefined
const statusFilter = ref('')
const showCheckinModal = ref(false)
const checkinCode = ref('')
const isChecking = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const showQRScanner = ref(false)
const rowChecking = ref<Record<string, boolean>>({})
const liveUpdates = ref(false)
let liveInterval: number | undefined
const lastUpdated = ref<Date | null>(null)
const lastUpdatedText = computed(() =>
  lastUpdated.value
    ? lastUpdated.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '',
)

// Detect if device is mobile (reactive to window resize)
const windowWidth = ref(window.innerWidth)
const isMobile = computed(() => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || windowWidth.value < 768
})

// Update window width on resize
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

// Computed
const totalRegistrations = computed(
  () => registrations.value.filter((r) => r.status !== 'cancelled').length,
)

const checkedInCount = computed(
  () => registrations.value.filter((r) => r.status === 'checked_in').length,
)

const totalAttendees = computed(() =>
  registrations.value
    .filter((r) => r.status !== 'cancelled')
    .reduce((sum, r) => sum + (r.total_attendees || 1), 0),
)

const pendingCount = computed(
  () => registrations.value.filter((r) => r.status === 'registered').length,
)

const cancelledCount = computed(
  () => registrations.value.filter((r) => r.status === 'cancelled').length,
)

const allCount = computed(() => registrations.value.length)

const filteredRegistrations = computed(() => {
  let filtered = registrations.value

  // Filter by search query
  if (debouncedQuery.value.trim()) {
    const query = debouncedQuery.value.toLowerCase()
    filtered = filtered.filter(
      (r) =>
        r.user_details?.first_name?.toLowerCase().includes(query) ||
        r.user_details?.last_name?.toLowerCase().includes(query) ||
        r.user_details?.username?.toLowerCase().includes(query) ||
        r.user_details?.email?.toLowerCase().includes(query) ||
        r.confirmation_code?.toLowerCase().includes(query),
    )
  }

  // Filter by status
  if (statusFilter.value) {
    filtered = filtered.filter((r) => r.status === statusFilter.value)
  }

  // Sort by registration date (newest first)
  return filtered.sort((a, b) => {
    const dateA = a.registered_at ? new Date(a.registered_at).getTime() : 0
    const dateB = b.registered_at ? new Date(b.registered_at).getTime() : 0
    return dateB - dateA
  })
})

// Methods
const loadRegistrations = async (forceRefresh = false) => {
  // If we have registrations from props and not forcing refresh, use them
  if (props.registrations && !forceRefresh) {
    registrations.value = props.registrations
    return
  }

  // Otherwise, load from API
  loading.value = true
  try {
    const response = await eventsService.getEventRegistrations(props.eventId)

    if (response.success && response.data) {
      // Handle both paginated response and direct array response
      const registrationData = Array.isArray(response.data)
        ? response.data
        : (response.data.results || [])

      registrations.value = registrationData.map((reg: EventRegistration) => ({
        id: reg.id,
        user: reg.user,
        user_details: reg.user_details || {
          id: reg.user,
          username: 'Unknown',
          email: '',
          first_name: '',
          last_name: '',
        },
        status: reg.status,
        guest_count: reg.guest_count,
        total_attendees: reg.total_attendees,
        confirmation_code: reg.confirmation_code,
        registered_at: reg.registered_at,
        checked_in_at: reg.checked_in_at,
        notes: reg.notes,
      }))
      lastUpdated.value = new Date()
    } else {
      showMessage('error', response.message || 'Failed to load registrations')
    }
  } catch (error) {
    console.error('Error loading registrations:', error)
    showMessage('error', 'An error occurred while loading registrations')
  } finally {
    loading.value = false
  }
}

const performCheckin = async () => {
  if (!checkinCode.value.trim()) return

  isChecking.value = true
  try {
    // Call the admin checkin API
    const response = await eventsService.adminCheckin(props.eventId, checkinCode.value.trim())

    if (response.success) {
      showMessage('success', 'Attendee checked in successfully!')
      closeCheckinModal()
      // Force reload registrations from API to reflect the change
      await loadRegistrations(true)
    } else {
      // Handle specific error messages
      const errorMsg = response.message || 'Failed to check in attendee'

      // Check for common error scenarios
      if (errorMsg.toLowerCase().includes('already checked in') ||
          errorMsg.toLowerCase().includes('already check in')) {
        showMessage('error', 'This attendee is already checked in')
      } else if (errorMsg.toLowerCase().includes('not found') ||
                 errorMsg.toLowerCase().includes('invalid')) {
        showMessage('error', 'Invalid confirmation code. Please check and try again.')
      } else {
        showMessage('error', errorMsg)
      }
    }
  } catch (error: any) {
    console.error('Error checking in attendee:', error)

    // Handle HTTP error responses
    if (error?.response?.status === 404) {
      showMessage('error', 'Confirmation code not found or attendee already checked in')
    } else if (error?.response?.status === 400) {
      showMessage('error', error?.response?.data?.message || 'Invalid confirmation code')
    } else {
      showMessage('error', 'An error occurred during check-in. Please try again.')
    }
  } finally {
    isChecking.value = false
  }
}

const performRowCheckin = async (registration: EventRegistrationDetail) => {
  if (!registration?.confirmation_code) return
  rowChecking.value[registration.id] = true
  try {
    const response = await eventsService.adminCheckin(
      props.eventId,
      registration.confirmation_code.trim(),
    )
    if (response.success) {
      showMessage('success', 'Attendee checked in successfully!')
      // Optimistically update the row to reduce flicker
      const idx = registrations.value.findIndex((r) => r.id === registration.id)
      if (idx !== -1) {
        registrations.value[idx] = {
          ...registrations.value[idx],
          status: 'checked_in',
          checked_in_at: new Date().toISOString(),
        }
      }
    } else {
      showMessage('error', response.message || 'Failed to check in attendee')
    }
  } catch (error: any) {
    console.error('Error checking in attendee:', error)
    showMessage('error', 'An error occurred during check-in. Please try again.')
  } finally {
    rowChecking.value[registration.id] = false
  }
}

const closeCheckinModal = () => {
  showCheckinModal.value = false
  checkinCode.value = ''
  isChecking.value = false
  showQRScanner.value = false
}

const handleQRScanSuccess = async (code: string) => {
  // Set the scanned code and automatically perform check-in
  checkinCode.value = code
  showQRScanner.value = false

  // Automatically trigger check-in after QR scan
  await performCheckin()
}

const handleQRScanError = (error: string) => {
  showMessage('error', error)
  showQRScanner.value = false
}

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
}

const getInitials = (firstName: string, lastName: string): string => {
  const first = firstName?.charAt(0)?.toUpperCase() || ''
  const last = lastName?.charAt(0)?.toUpperCase() || ''
  return `${first}${last}` || '?'
}

const getStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'checked_in':
      return 'bg-green-500'
    case 'registered':
      return 'bg-[#1e90ff]'
    case 'cancelled':
      return 'bg-red-500'
    default:
      return 'bg-slate-500'
  }
}

const getStatusTextColor = (status: string): string => {
  switch (status) {
    case 'checked_in':
      return 'bg-green-100 text-green-800'
    case 'registered':
      return 'bg-[#B0E0E6] text-[#1873cc]'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-slate-100 text-slate-800'
  }
}

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'checked_in':
      return 'Checked In'
    case 'registered':
      return 'Registered'
    case 'cancelled':
      return 'Cancelled'
    default:
      return status || 'Unknown'
  }
}

const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

const copyToClipboard = async (text: string) => {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const el = document.createElement('textarea')
      el.value = String(text)
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    showMessage('success', 'Confirmation code copied')
  } catch (e) {
    showMessage('error', 'Failed to copy code')
  }
}

// Watchers
watch(
  () => props.registrations,
  (newRegistrations) => {
    if (newRegistrations) {
      registrations.value = newRegistrations
    }
  },
  { immediate: true },
)

// Lifecycle
onMounted(() => {
  loadRegistrations()
  window.addEventListener('resize', handleResize)
  // Initialize debounced search
  debouncedQuery.value = searchQuery.value
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (liveInterval) window.clearInterval(liveInterval)
})

// Debounce search input
watch(
  () => searchQuery.value,
  (val) => {
    if (searchTimer) window.clearTimeout(searchTimer)
    searchTimer = window.setTimeout(() => {
      debouncedQuery.value = val
    }, 250)
  },
)

// Live updates watcher
watch(
  () => liveUpdates.value,
  (newVal) => {
    if (newVal) {
      // immediate refresh on enable
      loadRegistrations(true)
      liveInterval = window.setInterval(() => {
        loadRegistrations(true)
      }, 10000)
    } else if (liveInterval) {
      window.clearInterval(liveInterval)
      liveInterval = undefined
    }
  },
)

// Expose method for parent component (Smart FAB)
defineExpose({
  openCheckinModal: () => {
    showCheckinModal.value = true
  }
})
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

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: all 0.3s ease;
  transform-origin: center;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  opacity: 0;
  transform: scale(0.95) translateY(-20px);
}
</style>
