import { ref, computed, type Ref } from 'vue'
import type { EventTemplate } from '../services/api'

export interface Category {
  id: number
  name: string
  color: string
}

export interface TemplateFilters {
  searchQuery: string
  selectedCategoryId: number | null
}

/**
 * Composable for template filtering functionality
 */
export function useTemplateFiltering(templates: Ref<EventTemplate[]>) {
  // Filter state
  const searchQuery = ref('')
  const selectedCategoryId = ref<number | null>(null)

  // Extract categories from templates
  const categories = computed(() => {
    const categoryMap = new Map<number, Category>()

    templates.value.forEach((template) => {
      if (template.package_plan.category) {
        const cat = template.package_plan.category
        categoryMap.set(cat.id, {
          id: cat.id,
          name: cat.name,
          color: cat.color,
        })
      }
    })

    return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  })

  // Apply filters to templates
  const filteredTemplates = computed(() => {
    let filtered = templates.value

    // Filter by category
    if (selectedCategoryId.value !== null) {
      filtered = filtered.filter(
        (template) => template.package_plan.category?.id === selectedCategoryId.value,
      )
    }

    // Filter by search query
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(query) ||
          template.package_plan.name.toLowerCase().includes(query) ||
          template.package_plan.category?.name.toLowerCase().includes(query) ||
          (template.package_plan.features &&
            template.package_plan.features.some((feature) =>
              feature.toLowerCase().includes(query),
            )),
      )
    }

    return filtered
  })

  // Clear all filters
  const clearFilters = () => {
    searchQuery.value = ''
    selectedCategoryId.value = null
  }

  // Reset filters
  const resetFilters = () => {
    clearFilters()
  }

  // Set category filter (e.g., from props)
  const setCategoryFilter = (categoryId: number | null) => {
    selectedCategoryId.value = categoryId
  }

  return {
    // State
    searchQuery,
    selectedCategoryId,

    // Computed
    categories,
    filteredTemplates,

    // Actions
    clearFilters,
    resetFilters,
    setCategoryFilter,
  }
}
