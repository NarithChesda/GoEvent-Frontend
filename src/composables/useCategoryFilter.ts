/**
 * useCategoryFilter.ts
 *
 * Composable for category filter functionality.
 * Handles category loading, selection, and menu state.
 *
 * @module composables/useCategoryFilter
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { eventCategoriesService, type EventCategory } from '@/services/api'

/**
 * Composable for category filter state and functionality
 */
export function useCategoryFilter() {
  const categories = ref<EventCategory[]>([])
  const categoryFilter = ref('')
  const showCategoryMenu = ref(false)
  const loadingCategories = ref(false)

  const loadCategories = async () => {
    loadingCategories.value = true
    try {
      const response = await eventCategoriesService.getCategories()
      if (response.success && response.data) {
        categories.value = response.data.results || []
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to load categories:', error)
      }
    } finally {
      loadingCategories.value = false
    }
  }

  const toggleCategoryMenu = () => {
    showCategoryMenu.value = !showCategoryMenu.value
  }

  const selectCategory = (name: string) => {
    categoryFilter.value = name
    showCategoryMenu.value = false
  }

  const closeCategoryMenu = () => {
    showCategoryMenu.value = false
  }

  // Handle click outside to close menu
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (
      showCategoryMenu.value &&
      !target.closest('.category-filter-container')
    ) {
      showCategoryMenu.value = false
    }
  }

  onMounted(() => {
    document.addEventListener('click', handleClickOutside)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })

  return {
    // State
    categories,
    categoryFilter,
    showCategoryMenu,
    loadingCategories,

    // Methods
    loadCategories,
    toggleCategoryMenu,
    selectCategory,
    closeCategoryMenu,
  }
}
