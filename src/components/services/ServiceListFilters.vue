<template>
  <!--
    The listings' two controls — which services, then in what order. Extracted
    from ServiceListControls because there are two copies of this pair on a
    scrolled page: the one in the list heading, and the one the top bar absorbs
    once that heading scrolls under it. Both have to be the same button at the
    same size, so they are literally the same component.
  -->
  <div class="flex items-center gap-1">
    <ServicesCategoryFilter
      :model-value="selectedCategory"
      :categories="categories"
      @update:model-value="emit('category-change', $event)"
    />

    <div ref="sortRoot" class="relative">
      <!-- Same short ghost button as the category trigger, tinted the same brand
           green once it is actually doing something — the two read as one pair
           of list controls rather than a filter chip and a menu. -->
      <button
        type="button"
        :class="triggerClass"
        :aria-label="t('services.sort.label')"
        aria-haspopup="menu"
        :aria-expanded="showSortMenu"
        @click="showSortMenu = !showSortMenu"
      >
        <ArrowUpDown class="w-4 h-4 flex-shrink-0" />
        <span class="hidden sm:inline">{{ currentSortLabel }}</span>
      </button>

      <Transition name="fade">
        <div
          v-if="showSortMenu"
          role="menu"
          class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-[100]"
        >
          <button
            v-for="option in sortOptions"
            :key="option.value"
            type="button"
            role="menuitemradio"
            :aria-checked="sortBy === option.value"
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ArrowUpDown } from 'lucide-vue-next'
import ServicesCategoryFilter from './ServicesCategoryFilter.vue'
import type { ServiceCategory, SortOption } from './types'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { t } = useAppLanguage()

/** What the list falls back to, and so what the trigger reads as "not sorted yet". */
const DEFAULT_SORT = 'featured'

const props = defineProps<{
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

const isSorted = computed(() => props.sortBy !== DEFAULT_SORT)

/**
 * At rest the button names what it does — "Sort" — rather than reading out the
 * default order ("Featured First"), which looked like a choice the visitor had
 * made. It only carries a value once there is one to carry.
 */
const currentSortLabel = computed(() =>
  isSorted.value
    ? (props.sortOptions.find((o) => o.value === props.sortBy)?.label ?? t('services.sort.button'))
    : t('services.sort.button'),
)

const triggerClass = computed(() => [
  // min-h keeps the touch target at 40px (design standard §17); matched to the
  // category trigger term for term so the pair stays one shape.
  'flex items-center gap-2 px-3 py-2 min-h-[40px] rounded-lg text-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200',
  isSorted.value
    ? 'text-[#2ecc71] font-medium hover:bg-[#2ecc71]/10'
    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
])

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
