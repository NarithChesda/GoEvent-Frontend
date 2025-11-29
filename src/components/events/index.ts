/**
 * Event Components Index
 *
 * Centralized exports for all event-related shared components.
 */

export { default as MobileTopBar } from './MobileTopBar.vue'
export { default as EventCard } from './EventCard.vue'
export { default as EventTimeline } from './EventTimeline.vue'
export { default as TimeFilterToggle } from './TimeFilterToggle.vue'
export { default as CategoryFilter } from './CategoryFilter.vue'
export { default as EventsEmptyState } from './EventsEmptyState.vue'
export { default as EventsLoadingSkeleton } from './EventsLoadingSkeleton.vue'

// Re-export filter option type
export type { FilterOption } from './TimeFilterToggle.vue'
