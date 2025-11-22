<template>
  <div class="px-3 sm:px-4 py-3 bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 border-b border-emerald-200/50">
    <!-- Search Bar Row -->
    <div class="mb-3 sm:mb-4">
      <div class="relative w-full">
        <div class="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 sm:w-4.5 h-4 sm:h-4.5 search-icon-gradient">
          <Search class="w-full h-full" />
        </div>
        <input
          :value="searchQuery"
          @input="handleSearchInput"
          type="text"
          placeholder="Search templates..."
          maxlength="200"
          class="w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-full transition-all duration-200 bg-white text-slate-700 placeholder-slate-500 focus:outline-none focus:text-slate-900 focus:placeholder-slate-400 shadow-sm hover:shadow-md border border-emerald-300/60"
        />
      </div>
    </div>

    <!-- Filter Pills Row -->
    <div class="flex flex-wrap items-center gap-2">
      <!-- Category Select -->
      <div class="relative inline-flex items-center">
        <label class="sr-only" for="template-category">Category</label>
        <select
          id="template-category"
          :value="selectedCategory === null ? '' : String(selectedCategory)"
          @change="onCategoryChange"
          :class="
            selectedCategory !== null
              ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] shadow-md'
              : 'bg-white/70 hover:bg-[#E6F4FF]'
          "
          class="pill-select pl-2.5 sm:pl-3 pr-7 sm:pr-8 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-medium transition-all duration-200 border border-emerald-300/60 shadow-sm hover:shadow-md appearance-none cursor-pointer text-slate-900"
        >
          <option value="">All Categories</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <ChevronDown class="w-3 h-3 text-slate-900 absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
              ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] shadow-md'
              : 'bg-white/70 hover:bg-[#E6F4FF]'
          "
          class="pill-select pl-2.5 sm:pl-3 pr-7 sm:pr-8 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-medium transition-all duration-200 border border-emerald-300/60 shadow-sm hover:shadow-md appearance-none cursor-pointer text-slate-900"
        >
          <option value="">All Plans</option>
          <option value="basic">Basic</option>
          <option value="standard">Standard</option>
        </select>
        <ChevronDown class="w-3 h-3 text-slate-900 absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
  -webkit-text-fill-color: #0f172a !important;
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
</style>
