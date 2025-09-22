<template>
  <BaseCard variant="base" size="md" class="overflow-hidden">
    <!-- Always visible: Status Filter -->
    <div class="p-4">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center space-x-3">
          <div class="w-2 h-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] rounded-full"></div>
          <h3 class="text-sm font-semibold text-slate-700">Filter Commissions</h3>
        </div>
        <button
          @click="toggleAdvancedFilters"
          class="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-[#1e90ff] transition-all duration-300 bg-slate-50 hover:bg-[#E6F4FF] px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#87CEEB]"
        >
          <span>{{ showAdvancedFilters ? 'Less' : 'More' }} filters</span>
          <ChevronDown
            :class="['w-4 h-4 transition-transform duration-300', showAdvancedFilters && 'rotate-180']"
          />
        </button>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="status in statusFilters"
          :key="status.value"
          @click="$emit('selectStatus', status.value)"
          :class="[
            'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-sm',
            selectedStatus === status.value
              ? status.activeClass
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm',
          ]"
        >
          <div class="flex items-center space-x-2">
            <div :class="status.dotClass" class="w-2 h-2 rounded-full"></div>
            <span>{{ status.label }}</span>
            <span v-if="status.count > 0" class="ml-1 text-xs opacity-75 bg-slate-100 px-1.5 py-0.5 rounded-full"
              >{{ status.count }}</span
            >
          </div>
        </button>
      </div>
    </div>

    <!-- Progressive disclosure: Advanced filters -->
    <div v-if="showAdvancedFilters" class="border-t border-slate-200 p-4 bg-gradient-to-br from-slate-50 to-slate-100/50">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Search -->
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-2">Search Commissions</label>
          <div class="relative">
            <input
              :value="searchQuery"
              @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
              type="text"
              placeholder="Event title, reference, or payment ID..."
              class="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent text-sm bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300"
            />
            <Search
              class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400"
            />
            <button
              v-if="searchQuery"
              @click="$emit('update:searchQuery', '')"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 hover:text-slate-600"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Date Range -->
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-2">Date Range</label>
          <div class="flex items-center space-x-2">
            <input
              :value="startDate"
              @input="$emit('update:startDate', ($event.target as HTMLInputElement).value)"
              type="date"
              class="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent text-sm bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300"
            />
            <span class="text-slate-400 text-sm font-medium">to</span>
            <input
              :value="endDate"
              @input="$emit('update:endDate', ($event.target as HTMLInputElement).value)"
              type="date"
              class="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent text-sm bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300"
            />
          </div>
        </div>
      </div>

      <!-- Filter summary and clear -->
      <div
        v-if="hasActiveFilters"
        class="mt-4 flex items-center justify-between pt-3 border-t border-slate-200"
      >
        <div class="flex items-center space-x-2 text-xs text-slate-600">
          <Filter class="w-3.5 h-3.5" />
          <span
            >{{ activeFiltersCount }} filter{{ activeFiltersCount > 1 ? 's' : '' }} applied</span
          >
        </div>
        <button
          @click="clearAllFilters"
          class="text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          Clear all filters
        </button>
      </div>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, ChevronDown, Filter, X } from 'lucide-vue-next'
import BaseCard from '../../BaseCard.vue'

interface StatusFilter {
  value: 'all' | 'pending' | 'requested' | 'claimed' | 'rejected' | 'cancelled'
  label: string
  count: number
  activeClass: string
  dotClass: string
}

interface Props {
  statusFilters: StatusFilter[]
  selectedStatus: string
  startDate: string
  endDate: string
  searchQuery: string
}

interface Emits {
  (e: 'selectStatus', status: StatusFilter['value']): void
  (e: 'update:startDate', value: string): void
  (e: 'update:endDate', value: string): void
  (e: 'update:searchQuery', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Progressive disclosure state
const showAdvancedFilters = ref(false)

// Computed properties for filter state
const hasActiveFilters = computed(() => {
  return (
    props.selectedStatus !== 'all' ||
    props.searchQuery.trim() !== '' ||
    props.startDate !== '' ||
    props.endDate !== ''
  )
})

const activeFiltersCount = computed(() => {
  let count = 0
  if (props.selectedStatus !== 'all') count++
  if (props.searchQuery.trim() !== '') count++
  if (props.startDate !== '') count++
  if (props.endDate !== '') count++
  return count
})

// Methods
function toggleAdvancedFilters() {
  showAdvancedFilters.value = !showAdvancedFilters.value
}

function clearAllFilters() {
  emit('selectStatus', 'all')
  emit('update:searchQuery', '')
  emit('update:startDate', '')
  emit('update:endDate', '')
}
</script>
