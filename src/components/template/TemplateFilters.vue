<template>
  <div class="px-3 sm:px-4 py-4 sm:py-6 border-b border-slate-200 bg-white/90">
    <!-- Unified Search Bar with Integrated Filters -->
    <div class="relative w-full">
      <!-- Search Bar Container -->
      <div class="flex items-center gap-3 sm:gap-4 w-full min-h-[132px] pl-6 sm:pl-8 pr-3 sm:pr-4 py-3 rounded-full transition-all duration-200 bg-white/50 text-slate-700 shadow-sm hover:shadow-md border border-slate-200">
        <!-- Search Icon -->
        <div class="flex-shrink-0 w-5 h-5 search-icon-gradient">
          <Search class="w-full h-full" />
        </div>

        <!-- Search Input -->
        <input
          :value="searchQuery"
          @input="handleSearchInput"
          type="text"
          placeholder="Search templates..."
          maxlength="200"
          class="flex-1 min-w-0 bg-transparent text-sm sm:text-base placeholder-slate-500 focus:outline-none focus:text-slate-900 focus:placeholder-slate-400"
        />

        <!-- Filter Pills Container -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <!-- Category Select -->
          <div class="relative inline-flex items-center">
            <label class="sr-only" for="template-category">Category</label>
            <select
              id="template-category"
              :value="selectedCategory === null ? '' : String(selectedCategory)"
              @change="onCategoryChange"
              :class="
                selectedCategory !== null
                  ? 'bg-sky-500 text-white'
                  : 'bg-white/70 hover:bg-sky-50 text-slate-700'
              "
              class="pill-select pl-3 sm:pl-4 pr-7 sm:pr-8 py-1.5 h-9 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border border-slate-200 appearance-none cursor-pointer"
            >
              <option value="">Category</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <ChevronDown
              :class="selectedCategory !== null ? 'text-white' : 'text-slate-600'"
              class="w-3.5 h-3.5 absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 pointer-events-none"
            />
          </div>

          <!-- Plan Select -->
          <div class="relative inline-flex items-center">
            <label class="sr-only" for="template-plan">Plan</label>
            <select
              id="template-plan"
              :value="selectedPlan === null ? '' : selectedPlan"
              @change="onPlanChange"
              :class="
                selectedPlan !== null
                  ? 'bg-sky-500 text-white'
                  : 'bg-white/70 hover:bg-sky-50 text-slate-700'
              "
              class="pill-select pl-3 sm:pl-4 pr-7 sm:pr-8 py-1.5 h-9 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border border-slate-200 appearance-none cursor-pointer"
            >
              <option value="">Plan</option>
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
            </select>
            <ChevronDown
              :class="selectedPlan !== null ? 'text-white' : 'text-slate-600'"
              class="w-3.5 h-3.5 absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 pointer-events-none"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, ChevronDown } from 'lucide-vue-next'
import type { Category } from '../../composables/useTemplateFiltering'

interface Props {
  searchQuery: string
  selectedCategory: number | null
  categories: Category[]
  selectedPlan: null | 'basic' | 'standard'
}

defineProps<Props>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:selectedCategory': [value: number | null]
  'update:selectedPlan': [value: null | 'basic' | 'standard']
  clearFilters: []
}>()

const handleSearchInput = (event: Event): void => {
  const target = event.target as HTMLInputElement
  emit('update:searchQuery', target.value)
}

const onCategoryChange = (event: Event): void => {
  const value = (event.target as HTMLSelectElement).value
  emit('update:selectedCategory', value === '' ? null : Number(value))
}

const onPlanChange = (event: Event): void => {
  const value = (event.target as HTMLSelectElement).value
  emit('update:selectedPlan', value === '' ? null : (value as 'basic' | 'standard'))
}
</script>

<style scoped>
/* Search Icon - Sky Blue Theme */
.search-icon-gradient {
  color: #0284c7;
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
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

/* Force white text when selected (sky-500 background) */
select.pill-select.bg-sky-500 {
  color: white !important;
  -webkit-text-fill-color: white !important;
  background-color: #0ea5e9 !important;
}

select.pill-select.bg-sky-500::-ms-value {
  color: white !important;
  background-color: transparent !important;
}

/* Force slate text when not selected */
select.pill-select.text-slate-700 {
  color: #334155 !important;
  -webkit-text-fill-color: #334155 !important;
}

select.pill-select.text-slate-700::-ms-value {
  color: #334155 !important;
  background-color: transparent !important;
}

/* Ensure proper height on all browsers */
.pill-select::-ms-expand {
  display: none;
}

/* Simple option styling - always white background with dark text */
.pill-select option {
  background-color: white !important;
  color: #0f172a !important;
  -webkit-text-fill-color: #0f172a !important;
  padding: 0.5rem 1rem;
  font-weight: 500;
}

/* Override parent styles for options */
.bg-sky-500 option {
  background-color: white !important;
  color: #0f172a !important;
  -webkit-text-fill-color: #0f172a !important;
}

</style>
