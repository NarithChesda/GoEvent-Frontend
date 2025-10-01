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
          v-if="canEdit && showAdminCheckin"
          @click="showCheckinModal = true"
          class="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-green-500/25 hover:shadow-green-600/30 flex items-center text-sm sm:text-base"
        >
          <UserCheck class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          <span class="hidden sm:inline">Check-in Attendee</span>
          <span class="sm:hidden">Check-in</span>
        </button>
        <!-- Refresh Button -->
        <button
          @click="loadRegistrations"
          class="bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl p-2 hover:bg-white/90 transition-all duration-200 hover:scale-[1.02] shadow-lg"
        >
          <RefreshCw class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" :class="{ 'animate-spin': loading }" />
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-3 sm:p-4">
        <div class="flex items-center space-x-2 sm:space-x-3">
          <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#B0E0E6] flex items-center justify-center">
            <Users class="w-4 h-4 sm:w-5 sm:h-5 text-[#1e90ff]" />
          </div>
          <div>
            <p class="text-xl sm:text-2xl font-bold text-slate-900">{{ totalRegistrations }}</p>
            <p class="text-xs sm:text-sm text-slate-600">Total Registered</p>
          </div>
        </div>
      </div>

      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-3 sm:p-4">
        <div class="flex items-center space-x-2 sm:space-x-3">
          <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center">
            <UserCheck class="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
          </div>
          <div>
            <p class="text-xl sm:text-2xl font-bold text-slate-900">{{ checkedInCount }}</p>
            <p class="text-xs sm:text-sm text-slate-600">Checked In</p>
          </div>
        </div>
      </div>

      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-3 sm:p-4">
        <div class="flex items-center space-x-2 sm:space-x-3">
          <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <UserPlus class="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
          </div>
          <div>
            <p class="text-xl sm:text-2xl font-bold text-slate-900">{{ totalAttendees }}</p>
            <p class="text-xs sm:text-sm text-slate-600">Total Attendees</p>
          </div>
        </div>
      </div>

      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-3 sm:p-4">
        <div class="flex items-center space-x-2 sm:space-x-3">
          <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <Clock class="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
          </div>
          <div>
            <p class="text-xl sm:text-2xl font-bold text-slate-900">{{ pendingCount }}</p>
            <p class="text-xs sm:text-sm text-slate-600">Pending</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Search and Filter -->
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
            class="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent transition-all duration-200 text-sm sm:text-base relative"
          />
        </div>
      </div>
      <div class="flex-shrink-0">
        <select
          v-model="statusFilter"
          class="px-3 sm:px-4 py-2.5 sm:py-3 bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent transition-all duration-200 text-sm sm:text-base text-slate-700 font-medium cursor-pointer appearance-none bg-no-repeat bg-right pr-8 sm:pr-10"
          style="background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%231e90ff%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e'); background-position: right 0.5rem center; background-size: 1.25rem;"
        >
          <option value="">All Status</option>
          <option value="registered">Registered</option>
          <option value="checked_in">Checked In</option>
          <option value="cancelled">Cancelled</option>
        </select>
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

            <!-- Status Badge -->
            <div class="flex justify-end">
              <span
                class="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium"
                :class="getStatusTextColor(registration.status)"
              >
                {{ getStatusLabel(registration.status) }}
              </span>
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
          class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          @click="closeCheckinModal"
        >
          <div
            class="bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6 text-white">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <UserCheck class="w-5 h-5" />
                  </div>
                  <h2 class="text-2xl font-bold">Check-in Attendee</h2>
                </div>
                <button
                  @click="closeCheckinModal"
                  class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Content -->
            <div class="p-8">
              <div class="space-y-6">
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-2"
                    >Confirmation Code</label
                  >
                  <input
                    v-model="checkinCode"
                    type="text"
                    placeholder="Enter confirmation code..."
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm"
                    :disabled="isChecking"
                  />
                </div>

                <div class="flex space-x-4 pt-4">
                  <button
                    @click="closeCheckinModal"
                    class="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-all duration-200"
                    :disabled="isChecking"
                  >
                    Cancel
                  </button>
                  <button
                    @click="performCheckin"
                    class="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-green-500/25 hover:shadow-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    :disabled="!checkinCode.trim() || isChecking"
                  >
                    <UserCheck v-if="!isChecking" class="w-4 h-4 mr-2" />
                    <div
                      v-else
                      class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                    ></div>
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
import { ref, computed, onMounted, watch } from 'vue'
import {
  Users,
  UserCheck,
  UserPlus,
  Clock,
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-vue-next'
import {
  eventsService,
  type EventRegistration,
  type EventRegistrationDetail,
} from '../services/api'

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
const statusFilter = ref('')
const showCheckinModal = ref(false)
const checkinCode = ref('')
const isChecking = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

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

const showAdminCheckin = computed(() => registrations.value.some((r) => r.status === 'registered'))

const filteredRegistrations = computed(() => {
  let filtered = registrations.value

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (r) =>
        r.user_details?.first_name?.toLowerCase().includes(query) ||
        r.user_details?.last_name?.toLowerCase().includes(query) ||
        r.user_details?.username?.toLowerCase().includes(query) ||
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
const loadRegistrations = async () => {
  // If we have registrations from props, use them
  if (props.registrations) {
    registrations.value = props.registrations
    return
  }

  // Otherwise, load from API
  loading.value = true
  try {
    const response = await eventsService.getEventRegistrations(props.eventId)

    if (response.success && response.data) {
      // Transform EventRegistration[] to EventRegistrationDetail[] format
      const registrationData = response.data.results || []
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
      // Reload registrations to reflect the change
      await loadRegistrations()
    } else {
      showMessage('error', response.message || 'Failed to check in attendee')
    }
  } catch (error) {
    console.error('Error checking in attendee:', error)
    showMessage('error', 'An error occurred during check-in')
  } finally {
    isChecking.value = false
  }
}

const closeCheckinModal = () => {
  showCheckinModal.value = false
  checkinCode.value = ''
  isChecking.value = false
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
      return 'bg-[#E6F4FF]0'
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
