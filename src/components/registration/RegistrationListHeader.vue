<template>
  <!-- Search and Filter Bar - Clean Minimalist Design -->
  <div class="sticky top-0 z-20">
    <div class="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-sm">
      <!-- Search Row (Mobile Only - appears first on mobile) -->
      <div class="p-3 pb-0 sm:hidden">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            :value="searchQuery"
            @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
            type="text"
            placeholder="Search registrations..."
            aria-label="Search registrations by name, username, or code"
            class="w-full pl-9 pr-8 py-2 bg-slate-50/50 border-0 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
          />
          <button
            v-if="searchQuery"
            @click="$emit('clear-search')"
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
            @click="$emit('toggle-filter-dropdown')"
            class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border"
            :class="filterButtonClass"
            :style="filterButtonStyle"
          >
            <Filter class="w-4 h-4 flex-shrink-0" :class="statusFilter === '' ? 'text-slate-500' : 'text-white/80'" />
            <span class="truncate max-w-[100px] sm:max-w-[160px]">
              {{ filterLabel }}
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
                  @click="$emit('select-status', '')"
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
                  @click="$emit('select-status', 'registered')"
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
                  @click="$emit('select-status', 'checked_in')"
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
                  @click="$emit('select-status', 'cancelled')"
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
            @click="$emit('close-filter-dropdown')"
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
              :value="searchQuery"
              @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
              type="text"
              placeholder="Search registrations..."
              aria-label="Search registrations by name, username, or code"
              class="w-full pl-9 pr-8 py-2 bg-slate-50/50 border-0 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
            />
            <button
              v-if="searchQuery"
              @click="$emit('clear-search')"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
              aria-label="Clear search"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Registration Count -->
        <div class="flex items-center gap-1 text-sm text-slate-500 tabular-nums flex-shrink-0">
          <span class="font-medium text-slate-700">{{ filteredCount }}</span>
          <span>/</span>
          <span>{{ allCount }}</span>
        </div>

        <!-- Spacer -->
        <div class="flex-1 sm:hidden"></div>

        <!-- Refresh Button -->
        <button
          @click="$emit('refresh')"
          class="flex items-center justify-center p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200 flex-shrink-0"
          :disabled="loading"
          title="Refresh registrations"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>

        <!-- Live Toggle -->
        <button
          @click="$emit('toggle-live')"
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

        <!-- Check-in Button -->
        <button
          v-if="canEdit"
          @click="$emit('open-checkin')"
          class="flex items-center gap-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2 px-3 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-green-500/25 hover:shadow-green-600/30 text-sm flex-shrink-0"
        >
          <UserCheck class="w-4 h-4" />
          <span class="hidden sm:inline">Check-in</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Search,
  X,
  Filter,
  ChevronDown,
  RefreshCw,
  UserCheck,
} from 'lucide-vue-next'
import type { RegistrationStatus } from '../../composables/registration'

// Props
const props = defineProps<{
  searchQuery: string
  statusFilter: RegistrationStatus
  isFilterDropdownOpen: boolean
  loading: boolean
  liveUpdates: boolean
  lastUpdated: Date | null
  filteredCount: number
  allCount: number
  checkedInCount: number
  pendingCount: number
  cancelledCount: number
  canEdit: boolean
}>()

// Emits
defineEmits<{
  'update:searchQuery': [value: string]
  'clear-search': []
  'toggle-filter-dropdown': []
  'close-filter-dropdown': []
  'select-status': [status: RegistrationStatus]
  'refresh': []
  'toggle-live': []
  'open-checkin': []
}>()

// Computed
const filterLabel = computed(() => {
  switch (props.statusFilter) {
    case 'registered':
      return 'Not Checked In'
    case 'checked_in':
      return 'Checked In'
    case 'cancelled':
      return 'Cancelled'
    default:
      return 'All'
  }
})

const filterButtonClass = computed(() => {
  if (props.statusFilter === '') {
    return 'text-slate-700 bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
  }
  return 'text-white border-transparent'
})

const filterButtonStyle = computed(() => {
  switch (props.statusFilter) {
    case 'registered':
      return { backgroundColor: '#0ea5e9' } // sky-500
    case 'checked_in':
      return { backgroundColor: '#10b981' } // emerald-500
    case 'cancelled':
      return { backgroundColor: '#ef4444' } // red-500
    default:
      return {}
  }
})

const lastUpdatedText = computed(() =>
  props.lastUpdated
    ? props.lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '',
)
</script>

<style scoped>
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
