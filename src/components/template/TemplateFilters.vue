<template>
  <div class="p-3 sm:p-4 lg:p-5 border-b border-slate-200/30 bg-white/60 backdrop-blur-sm">
    <div class="flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-center lg:gap-3">
      <!-- Search -->
      <div class="relative flex-1 min-w-[220px]">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          :value="searchQuery"
          @input="handleSearchInput"
          type="text"
          placeholder="Search templates"
          class="w-full pl-10 pr-3 px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
        />
      </div>

      <!-- Category Select -->
      <div class="w-full lg:w-56">
        <label class="sr-only" for="template-category">Category</label>
        <select
          id="template-category"
          :value="selectedCategory === null ? '' : String(selectedCategory)"
          @change="onCategoryChange"
          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
        >
          <option value="">All categories</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>

      <!-- Plan Segmented -->
      <div class="shrink-0">
        <div class="inline-flex justify-between gap-1 bg-white/70 border border-slate-200 rounded-lg p-1">
          <button
            type="button"
            :class="[
              'px-3 py-1.5 rounded-md text-xs font-medium',
              selectedPlan === null ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-white',
            ]"
            @click="handlePlanSelect(null)"
          >
            All
          </button>
          <button
            type="button"
            :class="[
              'px-3 py-1.5 rounded-md text-xs font-medium',
              selectedPlan === 'basic' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-white',
            ]"
            @click="handlePlanSelect('basic')"
          >
            Basic
          </button>
          <button
            type="button"
            :class="[
              'px-3 py-1.5 rounded-md text-xs font-medium',
              selectedPlan === 'standard' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-white',
            ]"
            @click="handlePlanSelect('standard')"
          >
            Std
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search } from 'lucide-vue-next'
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

const handleCategorySelect = (categoryId: number | null): void => {
  emit('update:selectedCategory', categoryId)
}

const handlePlanSelect = (plan: null | 'basic' | 'standard'): void => {
  emit('update:selectedPlan', plan)
}

const onCategoryChange = (event: Event): void => {
  const value = (event.target as HTMLSelectElement).value
  emit('update:selectedCategory', value === '' ? null : Number(value))
}
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
