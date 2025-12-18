<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">
          Event Registration
        </h2>
        <p class="text-xs sm:text-sm text-slate-600 mt-1">Manage registrations and check-ins</p>
      </div>
      <!-- Admin Check-in Button -->
      <button
        v-if="canEdit"
        @click="showCheckinModal = true"
        class="flex bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-green-500/25 hover:shadow-green-600/30 items-center text-sm sm:text-base"
      >
        <UserCheck class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
        <span class="hidden sm:inline">Check-in Attendee</span>
      </button>
    </div>

    <!-- Removed stats cards for a cleaner, action-focused UI -->

    <!-- Search and Filter Bar - Clean Minimalist Design -->
    <div class="sticky top-0 z-20">
      <div class="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-sm">
        <!-- Search Row (Mobile Only - appears first on mobile) -->
        <div class="p-3 pb-0 sm:hidden">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search registrations..."
              aria-label="Search registrations by name, username, or code"
              class="w-full pl-9 pr-8 py-2 bg-slate-50/50 border-0 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
              aria-label="Clear search"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Filter and Actions Row -->
        <div class="flex items-center gap-3 p-3">
          <!-- Status Filter Dropdown -->
          <div class="relative" ref="filterDropdownContainer">
            <button
              @click="isFilterDropdownOpen = !isFilterDropdownOpen"
              class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border"
              :class="getFilterButtonClass()"
              :style="getFilterButtonStyle()"
            >
              <Filter class="w-4 h-4 flex-shrink-0" :class="statusFilter === '' ? 'text-slate-500' : 'text-white/80'" />
              <span class="truncate max-w-[100px] sm:max-w-[160px]">
                {{ getFilterLabel() }}
              </span>
              <ChevronDown class="w-4 h-4 transition-transform flex-shrink-0" :class="[{ 'rotate-180': isFilterDropdownOpen }, statusFilter === '' ? 'text-slate-400' : 'text-white/80']" />
            </button>

            <!-- Dropdown Menu -->
            <Transition name="dropdown">
              <div
                v-if="isFilterDropdownOpen"
                class="absolute top-full left-0 mt-2 min-w-[200px] bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 z-[100]"
                @click.stop
              >
                <div class="p-1.5">
                  <!-- All Option -->
                  <button
                    @click="selectStatusFilter('')"
                    :class="[
                      'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150',
                      statusFilter === ''
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    ]"
                  >
                    <span class="flex-1 text-left">All</span>
                    <span class="text-xs text-slate-400 tabular-nums">{{ allCount }}</span>
                  </button>

                  <!-- Divider -->
                  <div class="my-1.5 border-t border-slate-100"></div>

                  <!-- Not Checked In -->
                  <button
                    @click="selectStatusFilter('registered')"
                    class="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150"
                    :class="statusFilter === 'registered' ? 'bg-sky-500 text-white' : 'text-slate-700 hover:bg-slate-50'"
                  >
                    <div
                      v-if="statusFilter !== 'registered'"
                      class="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-sky-500"
                    />
                    <span class="flex-1 text-left">Not Checked In</span>
                    <span class="text-xs tabular-nums" :class="statusFilter === 'registered' ? 'text-white/70' : 'text-slate-400'">{{ pendingCount }}</span>
                  </button>

                  <!-- Checked In -->
                  <button
                    @click="selectStatusFilter('checked_in')"
                    class="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150"
                    :class="statusFilter === 'checked_in' ? 'bg-emerald-500 text-white' : 'text-slate-700 hover:bg-slate-50'"
                  >
                    <div
                      v-if="statusFilter !== 'checked_in'"
                      class="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-emerald-500"
                    />
                    <span class="flex-1 text-left">Checked In</span>
                    <span class="text-xs tabular-nums" :class="statusFilter === 'checked_in' ? 'text-white/70' : 'text-slate-400'">{{ checkedInCount }}</span>
                  </button>

                  <!-- Cancelled -->
                  <button
                    @click="selectStatusFilter('cancelled')"
                    class="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150"
                    :class="statusFilter === 'cancelled' ? 'bg-red-500 text-white' : 'text-slate-700 hover:bg-slate-50'"
                  >
                    <div
                      v-if="statusFilter !== 'cancelled'"
                      class="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-red-500"
                    />
                    <span class="flex-1 text-left">Cancelled</span>
                    <span class="text-xs tabular-nums" :class="statusFilter === 'cancelled' ? 'text-white/70' : 'text-slate-400'">{{ cancelledCount }}</span>
                  </button>
                </div>
              </div>
            </Transition>

            <!-- Click outside to close dropdown -->
            <div
              v-if="isFilterDropdownOpen"
              @click="isFilterDropdownOpen = false"
              class="fixed inset-0 z-[90]"
            ></div>
          </div>

          <!-- Divider -->
          <div class="w-px h-5 bg-slate-200 hidden sm:block"></div>

          <!-- Search Input (Desktop Only) -->
          <div class="hidden sm:block flex-1 min-w-0">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search registrations..."
                aria-label="Search registrations by name, username, or code"
                class="w-full pl-9 pr-8 py-2 bg-slate-50/50 border-0 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
              />
              <button
                v-if="searchQuery"
                @click="searchQuery = ''"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
                aria-label="Clear search"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Registration Count -->
          <div class="flex items-center gap-1 text-sm text-slate-500 tabular-nums flex-shrink-0">
            <span class="font-medium text-slate-700">{{ filteredRegistrations.length }}</span>
            <span>/</span>
            <span>{{ allCount }}</span>
          </div>

          <!-- Spacer -->
          <div class="flex-1 sm:hidden"></div>

          <!-- Refresh Button -->
          <button
            @click="loadRegistrations(true)"
            class="flex items-center justify-center p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200 flex-shrink-0"
            :disabled="loading"
            title="Refresh registrations"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
          </button>

          <!-- Live Toggle -->
          <button
            @click="liveUpdates = !liveUpdates"
            class="flex items-center justify-center gap-1.5 px-2 py-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200 flex-shrink-0"
            :class="{ 'bg-emerald-50 text-emerald-600': liveUpdates }"
            :aria-pressed="liveUpdates"
            title="Toggle live updates"
          >
            <span
              class="inline-block w-2.5 h-2.5 rounded-full"
              :class="liveUpdates ? 'bg-green-500 animate-pulse' : 'bg-slate-300'"
            ></span>
            <span class="hidden sm:inline text-sm">Live</span>
          </button>

          <!-- Last Updated Text -->
          <div v-if="liveUpdates && lastUpdatedText" class="hidden sm:block text-xs text-slate-400 flex-shrink-0">
            {{ lastUpdatedText }}
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6 sm:p-8"
    >
      <div class="flex items-center justify-center">
        <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#1e90ff]"></div>
        <span class="ml-2 sm:ml-3 text-xs sm:text-sm text-slate-600">Loading registrations...</span>
      </div>
    </div>

    <!-- Registration List -->
    <div v-else-if="filteredRegistrations.length > 0" class="space-y-2">
      <!-- Registration Card - Clean minimalist design matching GuestListItem -->
      <div
        v-for="registration in filteredRegistrations"
        :key="registration.id"
        class="bg-white/80 border border-slate-200/60 rounded-2xl hover:border-slate-300 hover:bg-white transition-all duration-200 group"
      >
        <div class="flex items-center gap-3 px-4 py-3">
          <!-- Avatar (compact) -->
          <div
            class="w-9 h-9 bg-gradient-to-br from-emerald-500 to-sky-500 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0"
          >
            {{
              getInitials(
                registration.user_details?.first_name || '',
                registration.user_details?.last_name || '',
              )
            }}
          </div>

          <!-- User Info (grows to fill space) -->
          <div class="flex-1 min-w-0">
            <!-- Name -->
            <div class="font-semibold text-slate-900 truncate">
              {{ registration.user_details?.first_name }}
              {{ registration.user_details?.last_name }}
            </div>

            <!-- Badges row -->
            <div class="flex items-center gap-1.5 mt-1 flex-wrap">
              <!-- Status badge -->
              <div
                class="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-xs font-medium"
                :class="getStatusBadgeClass(registration.status)"
              >
                <CheckCircle v-if="registration.status === 'checked_in'" class="w-3 h-3" />
                <Clock v-else-if="registration.status === 'registered'" class="w-3 h-3" />
                <X v-else class="w-3 h-3" />
                <span>{{ getStatusLabel(registration.status) }}</span>
              </div>

              <!-- Attendee count badge -->
              <div
                v-if="registration.total_attendees > 1"
                class="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium"
              >
                <Users class="w-3 h-3" />
                <span>{{ registration.total_attendees }}</span>
              </div>

              <!-- Confirmation code badge -->
              <div
                class="hidden sm:flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded-lg text-xs font-mono cursor-pointer hover:bg-slate-100 transition-colors"
                @click="copyToClipboard(registration.confirmation_code)"
                title="Click to copy"
              >
                <span>{{ registration.confirmation_code }}</span>
                <Copy class="w-3 h-3" />
              </div>
            </div>
          </div>

          <!-- Mobile: Check-in button (shown first on mobile for registered attendees) -->
          <button
            v-if="registration.status === 'registered' && canEdit"
            @click="performRowCheckin(registration)"
            class="sm:hidden px-2.5 py-1.5 text-xs font-medium flex-shrink-0 rounded-lg transition-all duration-200 text-white bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="rowChecking[registration.id] === true"
          >
            <span v-if="rowChecking[registration.id]" class="flex items-center gap-1">
              <span class="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></span>
            </span>
            <span v-else>Check In</span>
          </button>

          <!-- Mobile: Copy code button (for already checked-in or cancelled) -->
          <button
            v-else
            @click="copyToClipboard(registration.confirmation_code)"
            class="sm:hidden px-2 py-1.5 text-xs font-mono text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0"
            title="Copy code"
          >
            {{ registration.confirmation_code }}
          </button>

          <!-- Actions (desktop) -->
          <div class="hidden sm:flex items-center gap-0.5 flex-shrink-0">
            <!-- Check-in button (only for registered status) -->
            <button
              v-if="registration.status === 'registered' && canEdit"
              @click="performRowCheckin(registration)"
              title="Check in attendee"
              class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="rowChecking[registration.id] === true"
            >
              <div v-if="rowChecking[registration.id]" class="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
              <UserCheck v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Notes (if present) - separate row -->
        <div
          v-if="registration.notes"
          class="px-4 pb-3 -mt-1"
        >
          <p class="text-xs text-slate-500 italic truncate pl-12">
            "{{ registration.notes }}"
          </p>
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
        {{ searchQuery || statusFilter ? 'No registrations found' : 'No registrations yet' }}
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
      <div v-if="message" class="fixed bottom-20 lg:bottom-8 right-4 sm:right-8 left-4 sm:left-auto z-[100]">
        <div
          :class="message.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
          class="text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-lg flex items-center text-sm sm:text-base"
        >
          <CheckCircle v-if="message.type === 'success'" class="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
          <AlertCircle v-else class="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
          <span class="flex-1">{{ message.text }}</span>
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
  Copy,
  Filter,
  ChevronDown,
} from 'lucide-vue-next'
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
const isFilterDropdownOpen = ref(false)
const filterDropdownContainer = ref<HTMLElement | null>(null)
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
const checkedInCount = computed(
  () => registrations.value.filter((r) => r.status === 'checked_in').length,
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

// Filter dropdown methods
const selectStatusFilter = (filter: string) => {
  statusFilter.value = filter
  isFilterDropdownOpen.value = false
}

const getFilterLabel = (): string => {
  switch (statusFilter.value) {
    case 'registered':
      return 'Not Checked In'
    case 'checked_in':
      return 'Checked In'
    case 'cancelled':
      return 'Cancelled'
    default:
      return 'All'
  }
}

const getFilterButtonClass = (): string => {
  if (statusFilter.value === '') {
    return 'text-slate-700 bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
  }
  return 'text-white border-transparent'
}

const getFilterButtonStyle = (): Record<string, string> => {
  switch (statusFilter.value) {
    case 'registered':
      return { backgroundColor: '#0ea5e9' } // sky-500
    case 'checked_in':
      return { backgroundColor: '#10b981' } // emerald-500
    case 'cancelled':
      return { backgroundColor: '#ef4444' } // red-500
    default:
      return {}
  }
}

const getInitials = (firstName: string, lastName: string): string => {
  const first = firstName?.charAt(0)?.toUpperCase() || ''
  const last = lastName?.charAt(0)?.toUpperCase() || ''
  return `${first}${last}` || '?'
}

const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'checked_in':
      return 'bg-emerald-50 text-emerald-700'
    case 'registered':
      return 'bg-sky-50 text-sky-700'
    case 'cancelled':
      return 'bg-red-50 text-red-700'
    default:
      return 'bg-slate-50 text-slate-700'
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

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
