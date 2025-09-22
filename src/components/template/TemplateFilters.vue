<template>
  <div
    class="p-4 sm:p-8 border-b border-slate-200/20 space-y-4 sm:space-y-6 bg-white/50 backdrop-blur-sm flex-shrink-0"
  >
    <!-- Category Filter -->
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-xs sm:text-sm font-medium text-slate-700 mr-1 sm:mr-2 flex-shrink-0">
        Categories:
      </span>
      <button
        @click="handleCategorySelect(null)"
        :class="[
          'px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 flex-shrink-0',
          selectedCategory === null
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
            : 'bg-white/70 text-slate-600 hover:bg-white hover:shadow-md',
        ]"
        type="button"
      >
        All
      </button>
      <button
        v-for="category in categories"
        :key="category.id"
        @click="handleCategorySelect(category.id)"
        :class="[
          'px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1 flex-shrink-0',
          selectedCategory === category.id
            ? 'text-white shadow-lg'
            : 'bg-white/70 text-slate-600 hover:bg-white hover:shadow-md',
        ]"
        :style="selectedCategory === category.id ? { backgroundColor: category.color } : {}"
        type="button"
      >
        <span class="truncate">{{ category.name }}</span>
      </button>
    </div>

    <!-- Search -->
    <div class="relative w-full sm:max-w-md">
      <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        :value="searchQuery"
        @input="handleSearchInput"
        type="text"
        placeholder="Search templates..."
        class="w-full pl-10 pr-4 py-2 sm:py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm"
      />
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
}

defineProps<Props>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:selectedCategory': [value: number | null]
  clearFilters: []
}>()

const handleSearchInput = (event: Event): void => {
  const target = event.target as HTMLInputElement
  emit('update:searchQuery', target.value)
}

const handleCategorySelect = (categoryId: number | null): void => {
  emit('update:selectedCategory', categoryId)
}
</script>
