<template>
  <section class="py-12 sm:py-16 md:py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="text-center mb-8 sm:mb-12">
        <div
          class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-[#B0E0E6] text-[#1873cc] mb-4 sm:mb-6"
        >
          <Briefcase class="h-3 w-3 sm:h-4 sm:w-4" />
          Open Positions
        </div>
        <h2
          class="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-5 leading-tight tracking-tight px-4"
        >
          Find Your Perfect
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]">
            Role
          </span>
        </h2>
      </div>

      <!-- Search Bar -->
      <div class="relative mb-6 max-w-2xl mx-auto">
        <input
          type="text"
          placeholder="Search positions..."
          class="w-full px-5 py-4 pl-12 rounded-xl border-2 border-slate-200 focus:border-[#1e90ff] focus:ring-2 focus:ring-[#1e90ff]/20 transition-all text-base"
          :value="filters.search"
          @input="handleSearchInput"
        />
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
      </div>

      <!-- Filter Button (Mobile) -->
      <div class="lg:hidden mb-6 flex items-center gap-4">
        <button
          @click="showMobileFilters = true"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl hover:border-[#1e90ff] transition-colors"
        >
          <SlidersHorizontal class="w-5 h-5" />
          <span class="font-semibold">Filters</span>
          <span v-if="activeFiltersCount > 0" class="bg-[#1e90ff] text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {{ activeFiltersCount }}
          </span>
        </button>

        <button
          @click="handleSort"
          class="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl hover:border-[#1e90ff] transition-colors"
        >
          <ArrowUpDown class="w-5 h-5" />
        </button>
      </div>

      <!-- Main Layout: Sidebar + Content -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Desktop Filters Sidebar -->
        <aside class="hidden lg:block lg:col-span-1">
          <div class="sticky top-24 space-y-6 bg-white rounded-xl border border-slate-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-slate-900">Filters</h3>
              <button
                v-if="activeFiltersCount > 0"
                @click="clearFilters"
                class="text-[#1e90ff] hover:text-[#1873cc] text-sm font-medium"
              >
                Clear All
              </button>
            </div>

            <!-- Department Filter -->
            <div class="space-y-2">
              <h4 class="font-semibold text-sm text-slate-700">Department</h4>
              <div class="space-y-2 max-h-48 overflow-y-auto">
                <label
                  v-for="dept in departments"
                  :key="dept.id"
                  class="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    :checked="filters.department?.includes(dept.id)"
                    @change="toggleFilter('department', dept.id)"
                    class="w-4 h-4 text-[#1e90ff] rounded focus:ring-2 focus:ring-[#1e90ff]"
                  />
                  <span class="text-sm text-slate-700 flex-1">{{ dept.name }}</span>
                  <span class="text-xs text-slate-500">{{ dept.positions_count }}</span>
                </label>
              </div>
            </div>

            <!-- Employment Type Filter -->
            <div class="space-y-2 pt-4 border-t">
              <h4 class="font-semibold text-sm text-slate-700">Employment Type</h4>
              <div class="space-y-2">
                <label v-for="type in employmentTypes" :key="type.value" class="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                  <input
                    type="checkbox"
                    :checked="filters.employment_type?.includes(type.value)"
                    @change="toggleFilter('employment_type', type.value)"
                    class="w-4 h-4 text-[#1e90ff] rounded focus:ring-2 focus:ring-[#1e90ff]"
                  />
                  <span class="text-sm text-slate-700">{{ type.label }}</span>
                </label>
              </div>
            </div>

            <!-- Location Type Filter -->
            <div class="space-y-2 pt-4 border-t">
              <h4 class="font-semibold text-sm text-slate-700">Location</h4>
              <div class="space-y-2">
                <label v-for="type in locationTypes" :key="type.value" class="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                  <input
                    type="checkbox"
                    :checked="filters.location_type?.includes(type.value)"
                    @change="toggleFilter('location_type', type.value)"
                    class="w-4 h-4 text-[#1e90ff] rounded focus:ring-2 focus:ring-[#1e90ff]"
                  />
                  <span class="text-sm text-slate-700">{{ type.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </aside>

        <!-- Positions Grid -->
        <div class="lg:col-span-3">
          <!-- Results Count -->
          <div class="mb-6 text-sm text-slate-600">
            <span class="font-semibold text-slate-900">{{ positions.length }}</span> positions found
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="flex items-center justify-center py-12">
            <Loader class="w-8 h-8 animate-spin text-[#1e90ff]" />
          </div>

          <!-- Positions Grid -->
          <div v-else-if="positions.length > 0" class="space-y-4">
            <PositionCard
              v-for="position in positions"
              :key="position.id"
              :position="position"
              @view="$emit('view', $event)"
            />
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-12">
            <div class="text-slate-400 mb-4">
              <Search class="w-16 h-16 mx-auto" />
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-2">No positions found</h3>
            <p class="text-slate-600 mb-6">Try adjusting your filters or search terms</p>
            <button
              @click="clearFilters"
              class="text-[#1e90ff] hover:text-[#1873cc] font-semibold"
            >
              Clear all filters
            </button>
          </div>

          <!-- Load More Button -->
          <div v-if="hasMore && !loading" class="text-center mt-8">
            <button
              @click="$emit('load-more')"
              class="bg-white hover:bg-slate-50 text-[#1e90ff] font-semibold px-8 py-4 rounded-xl border-2 border-[#1e90ff] hover:border-[#1873cc] hover:text-[#1873cc] transition-all shadow-md hover:shadow-lg"
            >
              Load More Positions
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Filters Modal (simplified) -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showMobileFilters"
          class="fixed inset-0 bg-black/50 z-50 lg:hidden"
          @click="showMobileFilters = false"
        >
          <div
            class="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
            @click.stop
          >
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold">Filters</h3>
              <button @click="showMobileFilters = false">
                <X class="w-6 h-6" />
              </button>
            </div>

            <!-- Mobile filter content (similar to desktop but adapted) -->
            <div class="space-y-6">
              <!-- Department -->
              <div>
                <h4 class="font-semibold text-slate-900 mb-3">Department</h4>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="dept in departments"
                    :key="dept.id"
                    @click="toggleFilter('department', dept.id)"
                    class="px-3 py-2 rounded-full text-sm font-medium transition-colors"
                    :class="
                      filters.department?.includes(dept.id)
                        ? 'bg-[#1e90ff] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    "
                  >
                    {{ dept.name }} ({{ dept.positions_count }})
                  </button>
                </div>
              </div>

              <!-- Employment Type -->
              <div>
                <h4 class="font-semibold text-slate-900 mb-3">Employment Type</h4>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="type in employmentTypes"
                    :key="type.value"
                    @click="toggleFilter('employment_type', type.value)"
                    class="px-3 py-2 rounded-full text-sm font-medium transition-colors"
                    :class="
                      filters.employment_type?.includes(type.value)
                        ? 'bg-[#1e90ff] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    "
                  >
                    {{ type.label }}
                  </button>
                </div>
              </div>

              <!-- Location Type -->
              <div>
                <h4 class="font-semibold text-slate-900 mb-3">Location</h4>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="type in locationTypes"
                    :key="type.value"
                    @click="toggleFilter('location_type', type.value)"
                    class="px-3 py-2 rounded-full text-sm font-medium transition-colors"
                    :class="
                      filters.location_type?.includes(type.value)
                        ? 'bg-[#1e90ff] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    "
                  >
                    {{ type.label }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Apply Button -->
            <button
              @click="showMobileFilters = false"
              class="w-full mt-6 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white font-bold py-4 rounded-xl"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Briefcase, Search, SlidersHorizontal, ArrowUpDown, Loader, X } from 'lucide-vue-next'
import PositionCard from './PositionCard.vue'
import type { CareerPosition, CareerDepartment, PositionFilters } from '@/services/api'

interface Props {
  positions: CareerPosition[]
  departments: CareerDepartment[]
  filters: PositionFilters
  loading?: boolean
  hasMore?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:filters': [filters: Partial<PositionFilters>]
  search: [query: string]
  'load-more': []
  view: [positionId: number]
}>()

const showMobileFilters = ref(false)
const searchTimeout = ref<number | null>(null)

const employmentTypes = [
  { value: 'full_time', label: 'Full-Time' },
  { value: 'part_time', label: 'Part-Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
]

const locationTypes = [
  { value: 'onsite', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
]

const activeFiltersCount = computed(() => {
  let count = 0
  if (props.filters.department && props.filters.department.length > 0) count += props.filters.department.length
  if (props.filters.employment_type && props.filters.employment_type.length > 0) count += props.filters.employment_type.length
  if (props.filters.location_type && props.filters.location_type.length > 0) count += props.filters.location_type.length
  return count
})

const toggleFilter = (filterType: keyof PositionFilters, value: number | string) => {
  const currentValues = (props.filters[filterType] as any[]) || []
  const newValues = currentValues.includes(value)
    ? currentValues.filter((v) => v !== value)
    : [...currentValues, value]

  emit('update:filters', { [filterType]: newValues })
}

const clearFilters = () => {
  emit('update:filters', {
    department: [],
    employment_type: [],
    location_type: [],
    search: '',
  })
}

const handleSearchInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const query = target.value

  // Debounce search
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  searchTimeout.value = window.setTimeout(() => {
    emit('search', query)
  }, 300)
}

const handleSort = () => {
  const currentOrdering = props.filters.ordering || '-created_at'
  const newOrdering = currentOrdering === '-created_at' ? 'created_at' : '-created_at'
  emit('update:filters', { ordering: newOrdering })
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
