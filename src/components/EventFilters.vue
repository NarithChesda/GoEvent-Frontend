<template>
  <div class="rounded-3xl mb-8 overflow-hidden transition-all duration-300 shadow-lg shadow-emerald-300/20 focus-within:shadow-xl focus-within:shadow-[#1e90ff]/30 hover:shadow-xl hover:shadow-emerald-300/30 border-2 border-emerald-100 focus-within:border-[#1e90ff] hover:border-emerald-200">
    <!-- Search Bar (Always Visible) - White Background -->
    <div class="bg-white p-6 pb-4">
      <div class="relative">
        <div class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 search-icon-gradient">
          <Search class="w-full h-full" />
        </div>
        <input
          v-model="localFilters.search"
          @input="debouncedEmitFilters"
          type="text"
          placeholder="Search by title, description, or organizer..."
          class="w-full pl-12 pr-4 py-3 rounded-xl transition-all duration-200 bg-white text-slate-700 placeholder-slate-500 focus:outline-none focus:text-slate-900 focus:placeholder-slate-400 outline-none border-none"
          style="outline: none !important; border: none !important; box-shadow: none !important;"
        />
      </div>
    </div>

    <!-- Filter Section Container - Greenish Background -->
    <div class="bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 border-t border-emerald-200/50">

      <!-- Filter Header -->
      <div
        @click="showFilters = !showFilters"
        class="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-emerald-100/70 transition-colors duration-200"
      >
        <div class="flex items-center space-x-3">
          <span
            v-if="hasActiveFilters"
            class="inline-flex items-center bg-gradient-to-r from-emerald-500/20 to-sky-500/20 backdrop-blur-sm border border-white/30 text-[#1873cc] text-xs font-medium px-3 py-1.5 rounded-full shadow-lg shadow-[#87CEEB]/30"
          >
            {{ activeFilterCount }} active
          </span>
        </div>
        <div
          class="inline-flex items-center text-slate-700 hover:text-[#1e90ff] font-medium text-sm transition-colors duration-200"
        >
          <ChevronDown
            class="w-5 h-5 transition-transform duration-200 text-[#1e90ff]"
            :class="{ 'rotate-180': showFilters }"
          />
          {{ showFilters ? 'Hide' : 'Show' }} Filters
        </div>
      </div>

      <!-- Filters Content -->
      <div
        class="filter-content px-6 transition-all duration-300 ease-in-out overflow-hidden"
        :class="showFilters ? 'max-h-[2000px] pb-6' : 'max-h-0 pb-0'"
      >
        <div class="space-y-6">
          <!-- Primary Filters -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Category Filter -->
            <div>
              <label for="category-filter" class="block text-sm font-medium text-slate-700 mb-2">Category</label>
              <div class="relative">
                <select
                  id="category-filter"
                  :value="localFilters.category || ''"
@change="(e) => {
                    const selectedValue = e.target.value
                    if (selectedValue === '') {
                      localFilters.category = undefined
                    } else {
                      localFilters.category = selectedValue
                    }
                    emitFilters()
                  }"
                  class="custom-select w-full px-4 py-3 pr-10 border-2 border-emerald-300/60 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/80 backdrop-blur-sm text-slate-700 shadow-sm appearance-none cursor-pointer hover:border-emerald-400/70 hover:shadow-md"
                  aria-label="Filter events by category"
                  aria-describedby="category-helper"
                >
                  <option value="">All Categories</option>
                  <option v-for="category in categories" :key="category.id" :value="category.name">
                    {{ category.name }}
                  </option>
                </select>
                <div
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                >
                  <ChevronDown class="w-5 h-5 text-emerald-500 transition-colors duration-200" />
                </div>
              </div>
              <div id="category-helper" class="sr-only">
                Choose a category to filter events, or leave as 'All Categories' to see all events
              </div>
            </div>

            <!-- Status Filter -->
            <div>
              <label for="status-filter" class="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <div class="relative">
                <select
                  id="status-filter"
                  v-model="localFilters.status"
                  @change="emitFilters"
                  class="custom-select w-full px-4 py-3 pr-10 border-2 border-emerald-300/60 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/80 backdrop-blur-sm text-slate-700 shadow-sm appearance-none cursor-pointer hover:border-emerald-400/70 hover:shadow-md"
                  aria-label="Filter events by status"
                  aria-describedby="status-helper"
                >
                  <option value="">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <div
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                >
                  <ChevronDown class="w-5 h-5 text-emerald-500 transition-colors duration-200" />
                </div>
              </div>
              <div id="status-helper" class="sr-only">
                Choose a status to filter events, or leave as 'All Status' to see events in any status
              </div>
            </div>
          </div>

          <!-- Quick Filter Buttons -->
          <div class="flex flex-wrap gap-3">
            <button
              @click="toggleFilter('is_virtual', true)"
              :class="
                localFilters.is_virtual === true
                  ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-white/70 text-slate-700 hover:bg-[#E6F4FF] hover:text-[#1e90ff]'
              "
              class="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border-2 border-emerald-300/60 shadow-md hover:shadow-lg hover:scale-105"
            >
              <Monitor class="w-4 h-4 mr-2" />
              Virtual Only
            </button>

            <button
              @click="toggleFilter('is_virtual', false)"
              :class="
                localFilters.is_virtual === false
                  ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-white/70 text-slate-700 hover:bg-[#E6F4FF] hover:text-[#1e90ff]'
              "
              class="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border-2 border-emerald-300/60 shadow-md hover:shadow-lg hover:scale-105"
            >
              <MapPin class="w-4 h-4 mr-2" />
              In-Person Only
            </button>

          <button
            @click="setDateFilter('today')"
            :class="
              isDateFilterActive('today')
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25'
                : 'bg-white/70 text-slate-700 hover:bg-green-50 hover:text-green-600'
            "
            class="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border-2 border-emerald-300/60 shadow-md hover:shadow-lg hover:scale-105"
          >
            <Calendar class="w-4 h-4 mr-2" />
            Today
          </button>

          <button
            @click="setDateFilter('this_week')"
            :class="
              isDateFilterActive('this_week')
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25'
                : 'bg-white/70 text-slate-700 hover:bg-green-50 hover:text-green-600'
            "
            class="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border-2 border-emerald-300/60 shadow-md hover:shadow-lg hover:scale-105"
          >
            <Calendar class="w-4 h-4 mr-2" />
            This Week
          </button>

          <button
            @click="setDateFilter('this_month')"
            :class="
              isDateFilterActive('this_month')
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25'
                : 'bg-white/70 text-slate-700 hover:bg-green-50 hover:text-green-600'
            "
            class="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border-2 border-emerald-300/60 shadow-md hover:shadow-lg hover:scale-105"
          >
            <Calendar class="w-4 h-4 mr-2" />
            This Month
          </button>
        </div>

        <!-- Advanced Filters Toggle -->
        <div>
          <button
            @click="showAdvanced = !showAdvanced"
            class="inline-flex items-center text-[#1e90ff] hover:text-[#1873cc] font-medium text-sm transition-colors duration-200"
          >
            <ChevronDown
              class="w-4 h-4 mr-1 transition-transform duration-200"
              :class="{ 'rotate-180': showAdvanced }"
            />
            {{ showAdvanced ? 'Hide' : 'Show' }} Advanced Filters
          </button>
        </div>

        <!-- Advanced Filters -->
        <div
          class="advanced-filters transition-all duration-300 ease-in-out overflow-hidden"
          :class="showAdvanced ? 'max-h-[500px] pt-4' : 'max-h-0 pt-0'"
        >
          <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-emerald-300/40"
            :class="showAdvanced ? 'pt-4' : 'pt-0'"
          >
            <!-- Date Range -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Start Date From</label>
              <input
                v-model="localFilters.start_date_after"
                @change="emitFilters"
                type="date"
                class="w-full px-4 py-3 border-2 border-emerald-300/60 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/80 backdrop-blur-sm text-slate-700 shadow-sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Start Date To</label>
              <input
                v-model="localFilters.start_date_before"
                @change="emitFilters"
                type="date"
                class="w-full px-4 py-3 border-2 border-emerald-300/60 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/80 backdrop-blur-sm text-slate-700 shadow-sm"
              />
            </div>

            <!-- Privacy Filter -->
            <div>
              <label for="privacy-filter" class="block text-sm font-medium text-slate-700 mb-2">Privacy</label>
              <div class="relative">
                <select
                  id="privacy-filter"
                  v-model="localFilters.privacy"
                  @change="emitFilters"
                  class="custom-select w-full px-4 py-3 pr-10 border-2 border-emerald-300/60 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/80 backdrop-blur-sm text-slate-700 shadow-sm appearance-none cursor-pointer hover:border-emerald-400/70 hover:shadow-md"
                  aria-label="Filter events by privacy setting"
                  aria-describedby="privacy-helper"
                >
                  <option value="">All Events</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
                <div
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                >
                  <ChevronDown class="w-5 h-5 text-emerald-500 transition-colors duration-200" />
                </div>
              </div>
              <div id="privacy-helper" class="sr-only">
                Filter events by privacy setting: public events are visible to everyone, private events have restricted access
              </div>
            </div>

            <!-- Sort By -->
            <div>
              <label for="sort-filter" class="block text-sm font-medium text-slate-700 mb-2">Sort By</label>
              <div class="relative">
                <select
                  id="sort-filter"
                  v-model="localFilters.ordering"
                  @change="emitFilters"
                  class="custom-select w-full px-4 py-3 pr-10 border-2 border-emerald-300/60 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/80 backdrop-blur-sm text-slate-700 shadow-sm appearance-none cursor-pointer hover:border-emerald-400/70 hover:shadow-md"
                  aria-label="Sort events by specific criteria"
                  aria-describedby="sort-helper"
                >
                  <option value="">Default</option>
                  <option value="start_date">Start Date (Earliest)</option>
                  <option value="-start_date">Start Date (Latest)</option>
                  <option value="title">Title (A-Z)</option>
                  <option value="-title">Title (Z-A)</option>
                  <option value="-created_at">Recently Added</option>
                  <option value="-registrations_count">Most Popular</option>
                </select>
                <div
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                >
                  <ChevronDown class="w-5 h-5 text-emerald-500 transition-colors duration-200" />
                </div>
              </div>
              <div id="sort-helper" class="sr-only">
                Choose how to sort the event list: by date, title, or popularity
              </div>
            </div>
          </div>
        </div>

        <!-- Clear Filters -->
        <div v-if="hasActiveFilters" class="flex justify-end">
          <button
            @click="clearFilters"
            class="inline-flex items-center text-slate-600 hover:text-red-600 text-sm font-medium transition-all duration-200 hover:bg-red-50 px-4 py-2.5 rounded-xl border-2 border-red-200/60 hover:border-red-300 shadow-sm hover:shadow-md"
          >
            <X class="w-4 h-4 mr-1" />
            Clear All Filters
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { Search, Monitor, MapPin, Calendar, ChevronDown, X } from 'lucide-vue-next'
import type { EventFilters, EventCategory } from '../services/api'

interface Props {
  modelValue: EventFilters
  categories: EventCategory[]
}

interface Emits {
  'update:modelValue': [filters: EventFilters]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const showFilters = ref(false)
const showAdvanced = ref(false)
const localFilters = reactive<EventFilters>({ ...props.modelValue })

const activeFilterCount = computed(() => {
  return Object.keys(localFilters).filter((key) => {
    // Exclude search from active filter count since it's always visible
    if (key === 'search') return false
    const value = localFilters[key as keyof EventFilters]
    return value !== undefined && value !== null && value !== ''
  }).length
})

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null
const debouncedEmitFilters = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    emitFilters()
  }, 300)
}

const emitFilters = () => {
  emit('update:modelValue', { ...localFilters })
}

const toggleFilter = (key: keyof EventFilters, value: boolean | string | number) => {
  if (localFilters[key] === value) {
    // If the same value is clicked, clear the filter
    delete localFilters[key]
  } else {
    // Set the new value
    ;(localFilters as Record<keyof EventFilters, unknown>)[key] = value
  }
  emitFilters()
}

const setDateFilter = (period: 'today' | 'this_week' | 'this_month') => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (period) {
    case 'today':
      localFilters.start_date_after = today.toISOString().split('T')[0]
      localFilters.start_date_before = new Date(today.getTime() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
      break
    case 'this_week':
      const startOfWeek = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000)
      const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
      localFilters.start_date_after = startOfWeek.toISOString().split('T')[0]
      localFilters.start_date_before = endOfWeek.toISOString().split('T')[0]
      break
    case 'this_month':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      localFilters.start_date_after = startOfMonth.toISOString().split('T')[0]
      localFilters.start_date_before = endOfMonth.toISOString().split('T')[0]
      break
  }
  emitFilters()
}

const isDateFilterActive = (period: 'today' | 'this_week' | 'this_month'): boolean => {
  if (!localFilters.start_date_after || !localFilters.start_date_before) return false

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (period) {
    case 'today':
      const todayStr = today.toISOString().split('T')[0]
      const tomorrowStr = new Date(today.getTime() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
      return (
        localFilters.start_date_after === todayStr && localFilters.start_date_before === tomorrowStr
      )
    case 'this_week':
      const startOfWeek = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000)
      const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
      return (
        localFilters.start_date_after === startOfWeek.toISOString().split('T')[0] &&
        localFilters.start_date_before === endOfWeek.toISOString().split('T')[0]
      )
    case 'this_month':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return (
        localFilters.start_date_after === startOfMonth.toISOString().split('T')[0] &&
        localFilters.start_date_before === endOfMonth.toISOString().split('T')[0]
      )
    default:
      return false
  }
}

const hasActiveFilters = computed(() => {
  return Object.keys(localFilters).some((key) => {
    const value = localFilters[key as keyof EventFilters]
    return value !== undefined && value !== null && value !== ''
  })
})

const clearFilters = () => {
  Object.keys(localFilters).forEach((key) => {
    delete localFilters[key as keyof EventFilters]
  })
  emitFilters()
}

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  (newFilters) => {
    Object.assign(localFilters, newFilters)
  },
  { deep: true },
)
</script>

<style scoped>
/* Smooth expand/collapse animations using max-height */
.filter-content,
.advanced-filters {
  transition:
    max-height 0.3s ease-in-out,
    padding 0.3s ease-in-out;
}

/* Search Icon Gradient */
.search-icon-gradient {
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  -webkit-mask: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='currentColor' class='w-6 h-6'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' d='m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z' /%3e%3c/svg%3e") no-repeat center;
  mask: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='currentColor' class='w-6 h-6'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' d='m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z' /%3e%3c/svg%3e") no-repeat center;
  -webkit-mask-size: contain;
  mask-size: contain;
}

.search-icon-gradient svg {
  opacity: 0;
}

/* Custom Select Dropdown Styling */
.custom-select {
  /* Enhanced focus state with emerald ring and blue border */
  @apply focus:ring-emerald-200/80;
}

/* Custom arrow icon color change on focus and hover */
.custom-select:focus + div svg,
.custom-select:hover + div svg {
  @apply text-blue-500;
}

/* Dropdown options styling - targeting the actual dropdown */
.custom-select option {
  @apply bg-white text-slate-700 py-3 px-4;
  padding: 0.75rem 1rem;
  font-weight: 500;
  border-radius: 0;
  transition: all 0.2s ease-in-out;
}

/* Default/placeholder option styling */
.custom-select option[value=""] {
  @apply text-slate-500 font-medium;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
}

/* Regular options hover and selection styling */
.custom-select option:not([value=""]) {
  @apply text-slate-700;
  background: #ffffff;
}

.custom-select option:hover,
.custom-select option:focus {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #dbeafe 100%);
  @apply text-slate-800;
  box-shadow: inset 0 1px 0 rgba(46, 204, 113, 0.1);
}

.custom-select option:checked,
.custom-select option:selected {
  background: linear-gradient(135deg, #10b981 0%, #1e90ff 100%);
  @apply text-white font-semibold;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Enhanced visual feedback for select state changes */
.custom-select:focus {
  transform: translateY(-1px);
  box-shadow:
    0 4px 12px rgba(16, 185, 129, 0.15),
    0 0 0 2px rgba(30, 144, 255, 0.2);
}

/* Subtle hover animation for the entire select container */
.custom-select:hover {
  transform: translateY(-0.5px);
  box-shadow:
    0 2px 8px rgba(16, 185, 129, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Browser-specific dropdown styling */
@supports (appearance: none) {
  .custom-select {
    /* Enhanced appearance for modern browsers */
    background-image: none;
  }
}

/* Firefox specific option styling */
@-moz-document url-prefix() {
  .custom-select option {
    background-color: #ffffff;
    color: #374151;
  }

  .custom-select option:hover {
    background-color: #d1fae5;
    color: #1f2937;
  }

  .custom-select option:checked {
    background: linear-gradient(135deg, #10b981 0%, #1e90ff 100%);
    color: white;
  }
}

/* Webkit specific dropdown styling */
@media screen and (-webkit-min-device-pixel-ratio: 0) {
  .custom-select::-webkit-scrollbar {
    width: 8px;
  }

  .custom-select::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }

  .custom-select::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #10b981, #1e90ff);
    border-radius: 4px;
  }

  .custom-select::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #059669, #1d4ed8);
  }
}

/* Enhanced spacing and visual hierarchy */
.custom-select {
  line-height: 1.5;
  letter-spacing: 0.025em;
}

/* Responsive adjustments for mobile */
@media (max-width: 640px) {
  .custom-select {
    @apply text-base;
    min-height: 3rem;
  }

  .custom-select option {
    padding: 1rem;
    font-size: 1rem;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .custom-select {
    @apply border-slate-600;
  }

  .custom-select option:selected {
    background: #000000;
    color: #ffffff;
  }
}

/* Reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .custom-select {
    transition: none;
  }

  .custom-select option {
    transition: none;
  }
}
</style>
