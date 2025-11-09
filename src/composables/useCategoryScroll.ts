/**
 * useCategoryScroll.ts
 *
 * Composable for managing horizontal scrolling in category containers.
 * Handles scroll ref management, overflow detection, and smooth scrolling behavior.
 *
 * @module composables/useCategoryScroll
 */

import { ref, onUnmounted, type Ref } from 'vue'

/**
 * Composable for category scroll management
 *
 * @returns Object containing scroll state, ref setter, and scroll methods
 */
export function useCategoryScroll() {
  const categoryScrollRefs = ref<Record<string | number, HTMLElement>>({})
  const categoryOverflowState = ref<Record<string | number, boolean>>({})

  /**
   * Set reference to a category scroll container
   * Also triggers overflow check after a delay
   *
   * @param categoryId - Unique identifier for the category
   * @param el - HTML element or unknown type from Vue ref callback
   */
  const setCategoryScrollRef = (categoryId: string | number, el: unknown) => {
    if (el && el instanceof HTMLElement) {
      categoryScrollRefs.value[categoryId] = el

      // Check if content overflows after a short delay to allow rendering
      setTimeout(() => {
        checkCategoryOverflow(categoryId)
      }, 100)
    }
  }

  /**
   * Check if category container content overflows
   * Updates overflow state for showing/hiding navigation arrows
   *
   * @param categoryId - Unique identifier for the category
   */
  const checkCategoryOverflow = (categoryId: string | number) => {
    try {
      const container = categoryScrollRefs.value[categoryId]
      if (!container) return

      // Check if scrollWidth is greater than clientWidth (content overflows)
      categoryOverflowState.value[categoryId] = container.scrollWidth > container.clientWidth
    } catch (error) {
      // Silently handle errors to prevent UI disruption
      if (import.meta.env.DEV) {
        console.warn(`Failed to check overflow for category ${categoryId}:`, error)
      }
    }
  }

  /**
   * Check if a category has overflow (content exceeds container width)
   *
   * @param categoryId - Unique identifier for the category
   * @returns True if category has overflow, false otherwise
   */
  const categoryHasOverflow = (categoryId: string | number): boolean => {
    return categoryOverflowState.value[categoryId] || false
  }

  /**
   * Scroll a category container left or right
   * Scrolls 80% of container width with smooth behavior
   *
   * @param categoryId - Unique identifier for the category
   * @param direction - Direction to scroll ('left' or 'right')
   */
  const scrollCategory = (categoryId: string | number, direction: 'left' | 'right') => {
    const container = categoryScrollRefs.value[categoryId]
    if (!container) return

    const scrollAmount = container.clientWidth * 0.8 // Scroll 80% of container width
    const currentScroll = container.scrollLeft
    const targetScroll = direction === 'left'
      ? currentScroll - scrollAmount
      : currentScroll + scrollAmount

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    })
  }

  /**
   * Recalculate overflow for all categories
   * Useful when window is resized
   */
  const recheckAllOverflows = () => {
    Object.keys(categoryScrollRefs.value).forEach(categoryId => {
      checkCategoryOverflow(categoryId)
    })
  }

  /**
   * Handle window resize events
   * Recalculates overflow for all categories
   */
  const handleResize = () => {
    recheckAllOverflows()
  }

  // Set up resize listener
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize)

    // Clean up on unmount
    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
    })
  }

  return {
    // Refs
    categoryScrollRefs,
    categoryOverflowState,

    // Methods
    setCategoryScrollRef,
    checkCategoryOverflow,
    categoryHasOverflow,
    scrollCategory,
    recheckAllOverflows,
  }
}
