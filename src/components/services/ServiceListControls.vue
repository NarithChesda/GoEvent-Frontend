<template>
  <!--
    The listings section's heading and its two controls: which services, then in
    what order. Deliberately a separate component from the grid so it survives
    every state the list can be in — inside the grid, filtering into a category
    with no listings would take the category filter away with the grid and leave
    the visitor stuck with no way back.
  -->
  <div class="flex items-center justify-between gap-2 mb-4">
    <h2 class="min-w-0 truncate text-lg font-semibold text-slate-900">
      {{ heading }}
      <span v-if="count !== null" class="text-slate-400 font-normal text-sm ml-2">
        ({{ count }})
      </span>
    </h2>

    <!-- Both are the same short ghost button — icon plus label, no resting
         background — so they read as one pair of list controls rather than a
         filter chip and a menu. -->
    <div class="flex items-center gap-1 flex-shrink-0">
      <ServicesCategoryFilter
        :model-value="selectedCategory"
        :categories="categories"
        @update:model-value="$emit('category-change', $event)"
      />

      <div ref="sortRoot" class="relative">
        <button
          type="button"
          class="flex items-center gap-2 px-3 py-2 min-h-[40px] text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          :aria-label="t('services.sort.label')"
          @click="showSortMenu = !showSortMenu"
        >
          <ArrowUpDown class="w-4 h-4 flex-shrink-0" />
          <span class="hidden sm:inline">{{ currentSortLabel }}</span>
        </button>

        <Transition name="fade">
          <div
            v-if="showSortMenu"
            class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-[100]"
          >
            <button
              v-for="option in sortOptions"
              :key="option.value"
              type="button"
              :class="[
                'w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors',
                sortBy === option.value ? 'text-[#2ecc71] font-medium' : 'text-slate-700',
              ]"
              @click="selectSort(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ArrowUpDown } from 'lucide-vue-next'
import ServicesCategoryFilter from './ServicesCategoryFilter.vue'
import type { ServiceCategory, SortOption } from './types'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useCategoryTranslation } from '@/composables/useCategoryTranslation'

const { t } = useAppLanguage()
const { translateServiceCategory } = useCategoryTranslation()

const props = defineProps<{
  /** Result count, or null to omit it (nothing counted yet) */
  count: number | null
  categories: ServiceCategory[]
  selectedCategory: string
  sortBy: string
  sortOptions: SortOption[]
}>()

const emit = defineEmits<{
  'category-change': [categoryId: string]
  'sort-change': [sortValue: string]
}>()

const showSortMenu = ref(false)
const sortRoot = ref<HTMLElement | null>(null)

const heading = computed(() => {
  const cat = props.categories.find((c) => c.id === props.selectedCategory)
  if (!cat || cat.id === 'all') return t('services.allServices')
  return t('services.categoryServices', { category: translateServiceCategory(cat.name) })
})

const currentSortLabel = computed(
  () => props.sortOptions.find((o) => o.value === props.sortBy)?.label ?? t('services.sort.label'),
)

const selectSort = (value: string) => {
  emit('sort-change', value)
  showSortMenu.value = false
}

// Measured against this menu's own root, not a `.relative` ancestor lookup: the
// category filter beside it is also positioned, so a `closest('.relative')`
// check counted clicks on it as inside and left this menu hanging open.
const handleClickOutside = (event: MouseEvent) => {
  if (!showSortMenu.value) return
  if (sortRoot.value?.contains(event.target as Node)) return
  showSortMenu.value = false
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') showSortMenu.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
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
