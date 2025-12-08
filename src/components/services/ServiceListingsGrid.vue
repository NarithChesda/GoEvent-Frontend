<template>
  <div class="mb-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-slate-900">
        {{ categoryName }} Services
        <span class="text-slate-400 font-normal text-sm ml-2">({{ listings.length }})</span>
      </h2>

      <!-- Filter Controls -->
      <div class="flex items-center gap-2">
        <!-- Sort Dropdown -->
        <div class="relative">
          <button
            @click="showSortMenu = !showSortMenu"
            class="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowUpDown class="w-4 h-4" />
            <span class="hidden sm:inline">{{ currentSortLabel }}</span>
          </button>
          <Transition name="fade">
            <div
              v-if="showSortMenu"
              class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50"
            >
              <button
                v-for="option in sortOptions"
                :key="option.value"
                @click="selectSort(option.value)"
                :class="[
                  'w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors',
                  sortBy === option.value ? 'text-[#2ecc71] font-medium' : 'text-slate-700'
                ]"
              >
                {{ option.label }}
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Listings Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <ServiceCard
        v-for="listing in listings"
        :key="listing.id"
        :listing="listing"
        @click="$emit('listing-click', listing)"
      />
    </div>

    <!-- Load More Button -->
    <div v-if="hasMore" class="flex justify-center mt-8">
      <button
        @click="$emit('load-more')"
        class="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors flex items-center gap-2"
      >
        <span>Load More Services</span>
        <ChevronDown class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ArrowUpDown, ChevronDown } from 'lucide-vue-next'
import ServiceCard from './ServiceCard.vue'
import type { Listing, ServiceCategory, SortOption } from './types'

const props = withDefaults(
  defineProps<{
    listings: Listing[]
    categories: ServiceCategory[]
    selectedCategory: string
    sortBy: string
    sortOptions: SortOption[]
    hasMore?: boolean
  }>(),
  {
    hasMore: true,
  }
)

const emit = defineEmits<{
  'listing-click': [listing: Listing]
  'load-more': []
  'category-change': [categoryId: string]
  'sort-change': [sortValue: string]
}>()

const showSortMenu = ref(false)

const categoryName = computed(() => {
  const cat = props.categories.find(c => c.id === props.selectedCategory)
  return cat?.id === 'all' ? 'All' : cat?.name || 'All'
})

const currentSortLabel = computed(() => {
  return props.sortOptions.find(o => o.value === props.sortBy)?.label || 'Sort'
})

const selectSort = (value: string) => {
  emit('sort-change', value)
  showSortMenu.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (showSortMenu.value && !target.closest('.relative')) {
    showSortMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
