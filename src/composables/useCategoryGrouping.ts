/**
 * useCategoryGrouping.ts
 *
 * Composable for grouping events by category with customizable sorting.
 * Optimizes category grouping computation by only processing the active view.
 *
 * @module composables/useCategoryGrouping
 */

import { computed, type Ref } from 'vue'
import type { Event, EventCategory } from '../services/api'
import type { ViewType } from './useEventsData'

interface CategoryGroup {
  category: EventCategory | null
  events: Event[]
}

/**
 * Group events by category with sorting options
 *
 * @param events - Array of events to group
 * @param categories - Array of available categories for lookup
 * @param sortByField - Field to sort events by ('start_date' or 'created_at')
 * @param sortCategoriesByTimestamp - Whether to sort categories by latest event timestamp
 * @returns Array of category groups with sorted events
 */
export function groupEventsByCategory(
  events: Event[],
  categories: EventCategory[],
  sortByField: 'start_date' | 'created_at' = 'start_date',
  sortCategoriesByTimestamp = false
): CategoryGroup[] {
  // Create a map to group events by category
  const categoryMap = new Map<number | string, CategoryGroup>()

  events.forEach(event => {
    const categoryId = event.category || 'uncategorized'

    if (!categoryMap.has(categoryId)) {
      // Find the full category details from the categories list
      const categoryDetails = event.category
        ? categories.find(cat => cat.id === event.category)
        : null

      categoryMap.set(categoryId, {
        category: categoryDetails || null,
        events: []
      })
    }

    categoryMap.get(categoryId)!.events.push(event)
  })

  // Convert map to array, sort categories, and sort events within each category
  return Array.from(categoryMap.values())
    .map(categoryGroup => {
      // Sort events within each category by the specified field (newest first)
      const sortedEvents = [...categoryGroup.events].sort((a, b) => {
        const dateA = new Date((sortByField === 'start_date' ? a.start_date : a.created_at) || 0).getTime()
        const dateB = new Date((sortByField === 'start_date' ? b.start_date : b.created_at) || 0).getTime()
        return dateB - dateA // Descending order (newest first)
      })

      return {
        category: categoryGroup.category,
        events: sortedEvents
      }
    })
    .sort((a, b) => {
      if (sortCategoriesByTimestamp) {
        // Sort categories by the latest event timestamp (newest first)
        const latestA = a.events.length > 0
          ? new Date((sortByField === 'start_date' ? a.events[0].start_date : a.events[0].created_at) || 0).getTime()
          : 0
        const latestB = b.events.length > 0
          ? new Date((sortByField === 'start_date' ? b.events[0].start_date : b.events[0].created_at) || 0).getTime()
          : 0
        return latestB - latestA // Descending order (newest first)
      } else {
        // Sort categories alphabetically
        const nameA = a.category?.name || 'Uncategorized'
        const nameB = b.category?.name || 'Uncategorized'
        // Put uncategorized at the end
        if (nameA === 'Uncategorized') return 1
        if (nameB === 'Uncategorized') return -1
        return nameA.localeCompare(nameB)
      }
    })
}

/**
 * Composable for optimized category grouping
 * Only processes events for the active view to improve performance
 *
 * @param currentView - Reactive ref for current view type
 * @param events - Reactive ref for events array
 * @param categories - Reactive ref for categories array
 * @returns Computed property for categorized events based on current view
 */
export function useCategoryGrouping(
  currentView: Ref<ViewType>,
  events: Ref<Event[]>,
  categories: Ref<EventCategory[]>
) {
  /**
   * Single optimized computed property for category grouping
   * Only processes the active view's events
   */
  const categorizedEvents = computed<CategoryGroup[]>(() => {
    const safeEvents = events.value || []

    switch (currentView.value) {
      case 'all':
        // Public events: sort by start_date, alphabetically by category
        return groupEventsByCategory(safeEvents, categories.value, 'start_date', false)

      case 'my':
        // My events: sort by created_at, categories by latest event timestamp
        return groupEventsByCategory(safeEvents, categories.value, 'created_at', true)

      case 'registered':
        // Registered events: sort by created_at, alphabetically by category
        return groupEventsByCategory(safeEvents, categories.value, 'created_at', false)

      default:
        return []
    }
  })

  /**
   * Get the view prefix for category IDs
   */
  const getViewPrefix = computed<string>(() => {
    switch (currentView.value) {
      case 'my':
        return 'my-'
      case 'registered':
        return 'registered-'
      default:
        return ''
    }
  })

  return {
    categorizedEvents,
    getViewPrefix,
  }
}
