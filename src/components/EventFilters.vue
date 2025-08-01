<template>
  <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl mb-8">
    <!-- Filter Header -->
    <div class="flex items-center justify-between p-6 pb-4">
      <div class="flex items-center space-x-3">
        <div class="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
          <Search class="w-3 h-3 text-white" />
        </div>
        <h3 class="text-lg font-semibold text-slate-900">Search & Filter Events</h3>
        <span v-if="hasActiveFilters" class="inline-flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {{ activeFilterCount }} active
        </span>
      </div>
      <button
        @click="showFilters = !showFilters"
        class="inline-flex items-center text-slate-600 hover:text-blue-600 font-medium text-sm transition-colors duration-200"
      >
        <ChevronDown 
          class="w-5 h-5 transition-transform duration-200"
          :class="{ 'rotate-180': showFilters }"
        />
        {{ showFilters ? 'Hide' : 'Show' }} Filters
      </button>
    </div>

    <!-- Filters Content -->
    <Transition name="slide-down">
      <div v-if="showFilters" class="px-6 pb-6">
        <div class="space-y-6">
          <!-- Search and Primary Filters -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Search -->
            <div class="lg:col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-2">Search Events</label>
              <div class="relative">
                <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  v-model="localFilters.search"
                  @input="debouncedEmitFilters"
                  type="text"
                  placeholder="Search by title, description, or organizer..."
                  class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                />
              </div>
            </div>

            <!-- Category Filter -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Category</label>
              <select
                v-model="localFilters.category"
                @change="emitFilters"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
              >
                <option value="">All Categories</option>
                <option 
                  v-for="category in categories" 
                  :key="category.id" 
                  :value="category.id"
                >
                  {{ category.name }}
                </option>
              </select>
            </div>

            <!-- Status Filter -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                v-model="localFilters.status"
                @change="emitFilters"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
              >
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <!-- Quick Filter Buttons -->
          <div class="flex flex-wrap gap-3">
            <button
              @click="toggleFilter('is_virtual', true)"
              :class="localFilters.is_virtual === true 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25' 
                : 'bg-white/70 text-slate-700 hover:bg-blue-50 hover:text-blue-600'"
              class="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border border-blue-200"
            >
              <Monitor class="w-4 h-4 mr-2" />
              Virtual Only
            </button>

            <button
              @click="toggleFilter('is_virtual', false)"
              :class="localFilters.is_virtual === false 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25' 
                : 'bg-white/70 text-slate-700 hover:bg-blue-50 hover:text-blue-600'"
              class="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border border-blue-200"
            >
              <MapPin class="w-4 h-4 mr-2" />
              In-Person Only
            </button>

            <button
              @click="setDateFilter('today')"
              :class="isDateFilterActive('today') 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25' 
                : 'bg-white/70 text-slate-700 hover:bg-green-50 hover:text-green-600'"
              class="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border border-green-200"
            >
              <Calendar class="w-4 h-4 mr-2" />
              Today
            </button>

            <button
              @click="setDateFilter('this_week')"
              :class="isDateFilterActive('this_week') 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25' 
                : 'bg-white/70 text-slate-700 hover:bg-green-50 hover:text-green-600'"
              class="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border border-green-200"
            >
              <Calendar class="w-4 h-4 mr-2" />
              This Week
            </button>

            <button
              @click="setDateFilter('this_month')"
              :class="isDateFilterActive('this_month') 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25' 
                : 'bg-white/70 text-slate-700 hover:bg-green-50 hover:text-green-600'"
              class="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border border-green-200"
            >
              <Calendar class="w-4 h-4 mr-2" />
              This Month
            </button>
          </div>

          <!-- Advanced Filters Toggle -->
          <div>
            <button
              @click="showAdvanced = !showAdvanced"
              class="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors duration-200"
            >
              <ChevronDown 
                class="w-4 h-4 mr-1 transition-transform duration-200"
                :class="{ 'rotate-180': showAdvanced }"
              />
              {{ showAdvanced ? 'Hide' : 'Show' }} Advanced Filters
            </button>
          </div>

          <!-- Advanced Filters -->
          <Transition name="slide-down">
            <div v-if="showAdvanced" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <!-- Date Range -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Start Date From</label>
                <input
                  v-model="localFilters.start_date_after"
                  @change="emitFilters"
                  type="date"
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Start Date To</label>
                <input
                  v-model="localFilters.start_date_before"
                  @change="emitFilters"
                  type="date"
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                />
              </div>

              <!-- Privacy Filter -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Privacy</label>
                <select
                  v-model="localFilters.privacy"
                  @change="emitFilters"
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                >
                  <option value="">All Events</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <!-- Sort By -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Sort By</label>
                <select
                  v-model="localFilters.ordering"
                  @change="emitFilters"
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                >
                  <option value="">Default</option>
                  <option value="start_date">Start Date (Earliest)</option>
                  <option value="-start_date">Start Date (Latest)</option>
                  <option value="title">Title (A-Z)</option>
                  <option value="-title">Title (Z-A)</option>
                  <option value="-created_at">Recently Added</option>
                  <option value="-registrations_count">Most Popular</option>
                </select>
              </div>
            </div>
          </Transition>

          <!-- Clear Filters -->
          <div v-if="hasActiveFilters" class="flex justify-end">
            <button
              @click="clearFilters"
              class="inline-flex items-center text-slate-600 hover:text-red-600 text-sm font-medium transition-colors duration-200 hover:bg-red-50 px-3 py-2 rounded-lg"
            >
              <X class="w-4 h-4 mr-1" />
              Clear All Filters
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { 
  Search, 
  Monitor, 
  MapPin, 
  Calendar, 
  ChevronDown, 
  X 
} from 'lucide-vue-next'
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

const showFilters = ref(true)
const showAdvanced = ref(false)
const localFilters = reactive<EventFilters>({ ...props.modelValue })

const activeFilterCount = computed(() => {
  return Object.keys(localFilters).filter(key => {
    const value = localFilters[key as keyof EventFilters]
    return value !== undefined && value !== null && value !== ''
  }).length
})

// Debounced search
let searchTimeout: number | null = null
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
    ;(localFilters as any)[key] = value
  }
  emitFilters()
}

const setDateFilter = (period: 'today' | 'this_week' | 'this_month') => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (period) {
    case 'today':
      localFilters.start_date_after = today.toISOString().split('T')[0]
      localFilters.start_date_before = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
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
      const tomorrowStr = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      return localFilters.start_date_after === todayStr && localFilters.start_date_before === tomorrowStr
    case 'this_week':
      const startOfWeek = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000)
      const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
      return localFilters.start_date_after === startOfWeek.toISOString().split('T')[0] && 
             localFilters.start_date_before === endOfWeek.toISOString().split('T')[0]
    case 'this_month':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return localFilters.start_date_after === startOfMonth.toISOString().split('T')[0] && 
             localFilters.start_date_before === endOfMonth.toISOString().split('T')[0]
    default:
      return false
  }
}

const hasActiveFilters = computed(() => {
  return Object.keys(localFilters).some(key => {
    const value = localFilters[key as keyof EventFilters]
    return value !== undefined && value !== null && value !== ''
  })
})

const clearFilters = () => {
  Object.keys(localFilters).forEach(key => {
    delete localFilters[key as keyof EventFilters]
  })
  emitFilters()
}

// Watch for external changes to modelValue
watch(() => props.modelValue, (newFilters) => {
  Object.assign(localFilters, newFilters)
}, { deep: true })
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  height: 0;
  opacity: 0;
  transform: translateY(-10px);
}
</style>