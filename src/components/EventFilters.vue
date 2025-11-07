<template>
  <div class="rounded-2xl sm:rounded-3xl mb-6 sm:mb-8 overflow-hidden transition-all duration-300 shadow-md sm:shadow-lg shadow-emerald-300/20 focus-within:shadow-lg sm:focus-within:shadow-xl focus-within:shadow-[#1e90ff]/30 hover:shadow-lg sm:hover:shadow-xl hover:shadow-emerald-300/30 border sm:border-2 border-emerald-100 focus-within:border-[#1e90ff] hover:border-emerald-200">
    <!-- Search Bar (Always Visible) - White Background -->
    <div class="bg-white p-3 sm:p-5 md:p-6 pb-2 sm:pb-3 md:pb-4">
      <div class="relative">
        <div class="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 search-icon-gradient">
          <Search class="w-full h-full" />
        </div>
        <input
          v-model="localFilters.search"
          @input="debouncedEmitFilters"
          type="text"
          placeholder="Search events..."
          maxlength="200"
          class="w-full pl-9 sm:pl-11 md:pl-12 pr-3 sm:pr-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl transition-all duration-200 bg-white text-slate-700 placeholder-slate-500 focus:outline-none focus:text-slate-900 focus:placeholder-slate-400 outline-none border-none"
          style="outline: none !important; border: none !important; box-shadow: none !important;"
        />
      </div>
    </div>

    <!-- Filter Section Container - Greenish Background -->
    <div class="bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 border-t border-emerald-200/50">

      <!-- Filter Header with Quick Filter Pills -->
      <div class="px-3 sm:px-5 md:px-6 py-2.5 sm:py-3.5 md:py-4">
        <!-- Quick Filter Pills (Always Visible) -->
        <div class="flex flex-wrap items-center gap-2 mb-3">
          <!-- Clear All Filters Button (shows when filters are active) -->
          <button
            v-if="hasActiveFilters"
            @click="clearFilters"
            class="inline-flex items-center justify-center px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-white border-2 border-red-500 text-red-500 hover:bg-red-50 hover:border-red-600 hover:text-red-600 transition-all duration-200 shadow-sm hover:shadow-md"
            aria-label="Clear all filters"
            title="Clear all filters"
          >
            <X class="w-3 h-3 mr-1" />
            <span class="text-[10px] sm:text-xs font-medium">Clear</span>
          </button>

          <!-- Category Pill Dropdown -->
          <div class="relative inline-flex items-center">
            <select
              id="category-pill-filter"
              :value="localFilters.category || ''"
              @change="(e) => {
                const target = e.target as HTMLSelectElement
                const selectedValue = target?.value
                if (selectedValue === '') {
                  localFilters.category = undefined
                } else {
                  localFilters.category = selectedValue
                }
                emitFilters()
              }"
              :class="
                localFilters.category
                  ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] shadow-md'
                  : 'bg-white/70 hover:bg-[#E6F4FF]'
              "
              class="pill-select pl-2.5 sm:pl-3 pr-7 sm:pr-8 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-medium transition-all duration-200 border border-emerald-300/60 shadow-sm hover:shadow-md appearance-none cursor-pointer text-slate-900"
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              <option v-for="category in categories" :key="category.id" :value="category.name">
                {{ category.name }}
              </option>
            </select>
            <div class="absolute right-2 sm:right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <ChevronDown class="w-3 h-3 text-slate-900" />
            </div>
          </div>

          <!-- Sort By Pill Dropdown -->
          <div class="relative inline-flex items-center">
            <select
              id="sort-pill-filter"
              :value="localFilters.ordering || ''"
              @change="handleSortChange"
              :class="
                localFilters.ordering
                  ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] shadow-md'
                  : 'bg-white/70 hover:bg-[#E6F4FF]'
              "
              class="pill-select pl-2.5 sm:pl-3 pr-7 sm:pr-8 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-medium transition-all duration-200 border border-emerald-300/60 shadow-sm hover:shadow-md appearance-none cursor-pointer text-slate-900"
              aria-label="Sort events"
            >
              <option value="">Sort By</option>
              <option value="start_date">Earliest</option>
              <option value="-start_date">Latest</option>
              <option value="title">A-Z</option>
              <option value="-title">Z-A</option>
              <option value="-created_at">Recent</option>
              <option value="-registrations_count">Popular</option>
            </select>
            <div class="absolute right-2 sm:right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <ChevronDown class="w-3 h-3 text-slate-900" />
            </div>
          </div>

          <!-- Start Date Pill -->
          <div class="relative inline-flex items-center">
            <button
              @click="openDatePicker"
              :class="
                localFilters.start_date_after
                  ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-md'
                  : 'bg-white/70 text-slate-700 hover:bg-[#E6F4FF] hover:text-[#1e90ff]'
              "
              class="inline-flex items-center px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all duration-200 border border-emerald-300/60 shadow-sm hover:shadow-md"
              :title="localFilters.start_date_after ? `From: ${formatDate(localFilters.start_date_after)}` : 'Filter by start date'"
            >
              <CalendarDays class="w-3 h-3 mr-1" />
              {{ localFilters.start_date_after ? formatDate(localFilters.start_date_after) : 'From Date' }}
            </button>
            <input
              ref="datePickerInput"
              v-model="localFilters.start_date_after"
              @change="emitFilters"
              type="date"
              class="absolute opacity-0 pointer-events-none"
              aria-label="Filter by start date"
            />
          </div>

          <button
            @click="toggleFilter('is_virtual', true)"
            :class="
              localFilters.is_virtual === true
                ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-md'
                : 'bg-white/70 text-slate-700 hover:bg-[#E6F4FF] hover:text-[#1e90ff]'
            "
            class="inline-flex items-center px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all duration-200 border border-emerald-300/60 shadow-sm hover:shadow-md"
          >
            <Monitor class="w-3 h-3 mr-1" />
            Virtual
          </button>

          <button
            @click="toggleFilter('is_virtual', false)"
            :class="
              localFilters.is_virtual === false
                ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-md'
                : 'bg-white/70 text-slate-700 hover:bg-[#E6F4FF] hover:text-[#1e90ff]'
            "
            class="inline-flex items-center px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all duration-200 border border-emerald-300/60 shadow-sm hover:shadow-md"
          >
            <MapPin class="w-3 h-3 mr-1" />
            In-Person
          </button>

          <button
            @click="setDateFilter('today')"
            :class="
              isDateFilterActive('today')
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                : 'bg-white/70 text-slate-700 hover:bg-green-50 hover:text-green-600'
            "
            class="inline-flex items-center px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all duration-200 border border-emerald-300/60 shadow-sm hover:shadow-md"
          >
            <Calendar class="w-3 h-3 mr-1" />
            Today
          </button>

          <button
            @click="setDateFilter('this_week')"
            :class="
              isDateFilterActive('this_week')
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                : 'bg-white/70 text-slate-700 hover:bg-green-50 hover:text-green-600'
            "
            class="inline-flex items-center px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all duration-200 border border-emerald-300/60 shadow-sm hover:shadow-md"
          >
            <Calendar class="w-3 h-3 mr-1" />
            Week
          </button>

          <button
            @click="setDateFilter('this_month')"
            :class="
              isDateFilterActive('this_month')
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                : 'bg-white/70 text-slate-700 hover:bg-green-50 hover:text-green-600'
            "
            class="inline-flex items-center px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all duration-200 border border-emerald-300/60 shadow-sm hover:shadow-md"
          >
            <Calendar class="w-3 h-3 mr-1" />
            Month
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch, ref, onUnmounted } from 'vue'
import { Search, Monitor, MapPin, Calendar, ChevronDown, X, CalendarDays } from 'lucide-vue-next'
import type { EventFilters, EventCategory } from '../services/api'
import { sanitizePlainText } from '@/utils/sanitize'

interface Props {
  modelValue: EventFilters
  categories: EventCategory[]
}

interface Emits {
  'update:modelValue': [filters: EventFilters]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localFilters = reactive<EventFilters>({ ...props.modelValue })
const datePickerInput = ref<HTMLInputElement | null>(null)

// Open the native date picker
const openDatePicker = () => {
  datePickerInput.value?.showPicker?.()
}

// Format date for display (DD/MM/YY)
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  return `${day}/${month}/${year}`
}

// Handle sort change
const handleSortChange = (e: Event) => {
  const target = e.target as HTMLSelectElement
  const selectedValue = target.value
  if (selectedValue === '') {
    localFilters.ordering = undefined
  } else {
    localFilters.ordering = selectedValue
  }
  emitFilters()
}

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null
const debouncedEmitFilters = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    // Sanitize search input before emitting
    if (localFilters.search) {
      localFilters.search = sanitizePlainText(localFilters.search, 200)
    }
    emitFilters()
  }, 300)
}

// Cleanup timeout on component unmount to prevent memory leaks
onUnmounted(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
    searchTimeout = null
  }
})

const emitFilters = () => {
  emit('update:modelValue', { ...localFilters })
}

// Type-safe toggle filter function
const toggleFilter = <K extends keyof EventFilters>(
  key: K,
  value: NonNullable<EventFilters[K]>
) => {
  if (localFilters[key] === value) {
    // If the same value is clicked, clear the filter
    localFilters[key] = undefined as EventFilters[K]
  } else {
    // Set the new value
    localFilters[key] = value as EventFilters[K]
  }
  emitFilters()
}

// Helper to create date at start of day in local timezone
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Helper to get date range for a period
const getDateRangeForPeriod = (period: 'today' | 'this_week' | 'this_month') => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (period) {
    case 'today': {
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return {
        start: getLocalDateString(today),
        end: getLocalDateString(tomorrow)
      }
    }
    case 'this_week': {
      // Week starts on Monday (1), Sunday is 0
      const dayOfWeek = today.getDay()
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() + daysToMonday)

      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 7)

      return {
        start: getLocalDateString(startOfWeek),
        end: getLocalDateString(endOfWeek)
      }
    }
    case 'this_month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      return {
        start: getLocalDateString(startOfMonth),
        end: getLocalDateString(endOfMonth)
      }
    }
  }
}

const setDateFilter = (period: 'today' | 'this_week' | 'this_month') => {
  const range = getDateRangeForPeriod(period)
  localFilters.start_date_after = range.start
  localFilters.start_date_before = range.end
  emitFilters()
}

const isDateFilterActive = (period: 'today' | 'this_week' | 'this_month'): boolean => {
  if (!localFilters.start_date_after || !localFilters.start_date_before) return false

  const range = getDateRangeForPeriod(period)
  return (
    localFilters.start_date_after === range.start &&
    localFilters.start_date_before === range.end
  )
}

// Improved reactivity tracking for hasActiveFilters computed
const hasActiveFilters = computed(() => {
  // Explicitly access all filter properties to ensure reactivity
  return !!(
    localFilters.search ||
    localFilters.category ||
    localFilters.organizer ||
    localFilters.start_date_after ||
    localFilters.start_date_before ||
    localFilters.is_virtual !== undefined ||
    localFilters.status ||
    localFilters.privacy ||
    localFilters.ordering ||
    localFilters.is_registered !== undefined
  )
})

const clearFilters = () => {
  Object.keys(localFilters).forEach((key) => {
    delete localFilters[key as keyof EventFilters]
  })
  emitFilters()
}

// Watch for external changes to modelValue with loop prevention
watch(
  () => props.modelValue,
  (newFilters) => {
    // Check if values are actually different to prevent infinite loops
    const currentKeys = new Set(Object.keys(localFilters))
    const newKeys = new Set(Object.keys(newFilters))

    let isDifferent = currentKeys.size !== newKeys.size

    if (!isDifferent) {
      for (const key of newKeys) {
        if (localFilters[key as keyof EventFilters] !== newFilters[key as keyof EventFilters]) {
          isDifferent = true
          break
        }
      }
    }

    if (isDifferent) {
      // Clear old filters first
      Object.keys(localFilters).forEach((key) => {
        delete localFilters[key as keyof EventFilters]
      })
      // Then assign new filters
      Object.assign(localFilters, newFilters)
    }
  },
  { deep: true }
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

/* Pill Select Dropdown Styling */
.pill-select {
  min-width: fit-content;
  text-align: left;
  line-height: 1;
  vertical-align: middle;
  display: inline-block;
  color: #0f172a !important;
  -webkit-text-fill-color: #0f172a !important;
}

/* Ensure proper height on all browsers */
.pill-select::-ms-expand {
  display: none;
}

/* Simple option styling - always white background with dark text */
.pill-select option {
  @apply bg-white text-slate-900;
  padding: 0.5rem 1rem;
  font-weight: 500;
  color: #0f172a !important;
}

/* Safari-specific adjustments */
@supports (-webkit-appearance: none) {
  .pill-select {
    -webkit-appearance: none;
    appearance: none;
    background-position: right 0.5rem center;
    background-size: 0;
  }
}

/* Date Pill Button Styling - now simplified since we use a button */

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
  background: linear-gradient(135deg, #2ecc71 0%, #1e90ff 100%);
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
    background: linear-gradient(135deg, #2ecc71 0%, #1e90ff 100%);
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
