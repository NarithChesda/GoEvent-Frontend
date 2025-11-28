/**
 * useEventsData.ts
 *
 * Composable for managing event data fetching across different views (Events, Explore).
 * Events tab includes organized, collaborated, and registered events.
 * Handles pagination, filtering, authentication checks, and data transformation.
 *
 * @module composables/useEventsData
 */

import { ref, type Ref } from 'vue'
import {
  eventsService,
  type Event,
  type EventFilters as EventFiltersType,
  type ApiResponse,
  type PaginatedResponse,
} from '../services/api'

export type ViewType = 'all' | 'my' | 'registered'

/**
 * Client-side filter helper for My Events tab
 * Applies search, category, date range, virtual/in-person, and sorting filters
 */
const applyClientSideFilters = (events: Event[], filterValues: EventFiltersType): Event[] => {
  let filteredEvents = [...events]

  // Apply search filter
  if (filterValues.search) {
    const searchTerm = filterValues.search.toLowerCase()
    filteredEvents = filteredEvents.filter(event =>
      event.title?.toLowerCase().includes(searchTerm) ||
      event.description?.toLowerCase().includes(searchTerm) ||
      event.location?.toLowerCase().includes(searchTerm) ||
      event.category_name?.toLowerCase().includes(searchTerm) ||
      event.organizer_name?.toLowerCase().includes(searchTerm) ||
      event.short_description?.toLowerCase().includes(searchTerm)
    )
  }

  // Apply category filter
  if (filterValues.category) {
    filteredEvents = filteredEvents.filter(event => {
      // Category can be filtered by ID (number) or name (string)
      if (typeof filterValues.category === 'number') {
        return event.category === filterValues.category
      } else {
        return event.category_name === filterValues.category
      }
    })
  }

  // Apply date range filters
  if (filterValues.start_date_after) {
    const afterDate = new Date(filterValues.start_date_after)
    filteredEvents = filteredEvents.filter(event => {
      if (!event.start_date) return false
      const eventDate = new Date(event.start_date)
      return eventDate >= afterDate
    })
  }

  if (filterValues.start_date_before) {
    const beforeDate = new Date(filterValues.start_date_before)
    filteredEvents = filteredEvents.filter(event => {
      if (!event.start_date) return false
      const eventDate = new Date(event.start_date)
      return eventDate < beforeDate
    })
  }

  // Apply virtual/in-person filter
  if (filterValues.is_virtual !== undefined) {
    filteredEvents = filteredEvents.filter(event => event.is_virtual === filterValues.is_virtual)
  }

  // Apply sorting
  if (filterValues.ordering) {
    const ordering = filterValues.ordering
    filteredEvents.sort((a, b) => {
      let comparison = 0

      if (ordering === 'start_date' || ordering === '-start_date') {
        const dateA = new Date(a.start_date || 0).getTime()
        const dateB = new Date(b.start_date || 0).getTime()
        comparison = dateA - dateB
      } else if (ordering === 'title' || ordering === '-title') {
        comparison = (a.title || '').localeCompare(b.title || '')
      } else if (ordering === 'created_at' || ordering === '-created_at') {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        comparison = dateA - dateB
      } else if (ordering === 'registrations_count' || ordering === '-registrations_count') {
        comparison = (a.registrations_count || 0) - (b.registrations_count || 0)
      }

      // Reverse if ordering starts with '-'
      return ordering.startsWith('-') ? -comparison : comparison
    })
  }

  return filteredEvents
}

/**
 * Loads user's own events (organized + collaborated + registered)
 * Applies client-side filtering and deduplication
 */
const loadMyEvents = async (
  filters: EventFiltersType
): Promise<ApiResponse<PaginatedResponse<Event>>> => {
  // Fetch both my events and registered events in parallel
  const [myEventsResponse, registeredResponse] = await Promise.all([
    eventsService.getMyEvents(filters),
    eventsService.getMyRegisteredEvents(filters),
  ])

  if (myEventsResponse.success && myEventsResponse.data) {
    const organized = myEventsResponse.data.organized || []
    const collaborated = myEventsResponse.data.collaborated || []
    const registered = registeredResponse.success && registeredResponse.data ? registeredResponse.data : []

    // Deduplicate events (user might be organizer, collaborator, and/or registered)
    const eventMap = new Map<string, Event>()
    // Add organized events first (highest priority) - user can always edit their own events
    organized.forEach(event => eventMap.set(event.id, { ...event, can_edit: true }))
    // Add collaborated events if not already present - collaborators can edit
    collaborated.forEach(event => {
      if (!eventMap.has(event.id)) {
        eventMap.set(event.id, { ...event, can_edit: true })
      }
    })
    // Add registered events if not already present (avoid duplicates when user registers for own event)
    // Registered events keep their original can_edit value (usually false/undefined)
    registered.forEach(event => {
      if (!eventMap.has(event.id)) {
        eventMap.set(event.id, event)
      }
    })
    let allMyEvents = Array.from(eventMap.values())

    // Apply client-side filtering
    allMyEvents = applyClientSideFilters(allMyEvents, filters)

    // Return mock paginated response (no pagination for my events)
    return {
      success: true,
      data: {
        count: allMyEvents.length,
        next: null,
        previous: null,
        results: allMyEvents,
      },
    }
  }

  return {
    success: false,
    message: myEventsResponse.message || 'Failed to load events',
  }
}

/**
 * Loads public events with server-side pagination
 */
const loadPublicEvents = async (
  filters: EventFiltersType,
  page: number
): Promise<ApiResponse<PaginatedResponse<Event>>> => {
  const publicEventParams = {
    ...filters,
    page,
    // Only set defaults if user hasn't specified these filters
    privacy: filters.privacy || 'public',
    status: filters.status || 'published',
    // Order by category name first (alphabetically), then by start_date (newest first)
    ordering: filters.ordering || 'category__name,-start_date',
  }

  return await eventsService.getEvents(publicEventParams)
}

/**
 * Composable for managing events data across different views
 *
 * @param isAuthenticated - Reactive ref indicating if user is authenticated
 * @returns Object containing reactive state and methods for event management
 */
export function useEventsData(isAuthenticated: Ref<boolean>) {
  const events = ref<Event[]>([])
  const loading = ref(false)
  const currentPage = ref(1)
  const hasMore = ref(true)
  const isLoadingMore = ref(false)

  /**
   * Load events based on current view type
   *
   * @param view - Type of view ('all', 'my')
   * @param filters - Event filters to apply
   * @param append - Whether to append to existing events (pagination) or replace
   * @returns Object with success status, optional error message, and hasMore flag
   */
  const loadEvents = async (
    view: ViewType,
    filters: EventFiltersType,
    append = false
  ): Promise<{ success: boolean; message?: string; hasMore: boolean }> => {
    // Don't load if unauthenticated and trying to view 'my' tab
    if (!isAuthenticated.value && view === 'my') {
      events.value = []
      loading.value = false
      return { success: true, hasMore: false }
    }

    // Set loading state
    if (append) {
      isLoadingMore.value = true
    } else {
      loading.value = true
      currentPage.value = 1
      hasMore.value = true
    }

    try {
      let response: ApiResponse<PaginatedResponse<Event>>

      // Route to appropriate loader based on view type
      if (view === 'my') {
        response = await loadMyEvents(filters)
      } else {
        // Public events with pagination
        const page = append ? currentPage.value : 1
        response = await loadPublicEvents(filters, page)
      }

      if (response.success && response.data) {
        const newEvents = response.data.results || []

        if (append) {
          events.value = [...events.value, ...newEvents]
        } else {
          events.value = newEvents
        }

        // Update pagination state
        hasMore.value = !!response.data.next

        return { success: true, hasMore: hasMore.value }
      } else {
        if (!append) {
          events.value = []
        }
        return {
          success: false,
          message: response.message || 'Failed to load events',
          hasMore: false
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error loading events:', error)
      }
      if (!append) {
        events.value = []
      }
      return {
        success: false,
        message: 'An error occurred while loading events',
        hasMore: false
      }
    } finally {
      loading.value = false
      isLoadingMore.value = false
    }
  }

  /**
   * Load next page of events (only for public events view)
   *
   * @param view - Type of view
   * @param filters - Event filters to apply
   * @returns Result of loadEvents call
   */
  const loadMoreEvents = async (
    view: ViewType,
    filters: EventFiltersType
  ): Promise<{ success: boolean; message?: string; hasMore: boolean }> => {
    // Only load more if not already loading and there are more pages
    if (isLoadingMore.value || !hasMore.value || loading.value) {
      return { success: false, hasMore: hasMore.value }
    }

    // Only apply infinite scroll to public events view
    if (view !== 'all') {
      return { success: false, hasMore: false }
    }

    // Increment page and load more events
    currentPage.value++
    return await loadEvents(view, filters, true)
  }

  return {
    // State
    events,
    loading,
    currentPage,
    hasMore,
    isLoadingMore,

    // Methods
    loadEvents,
    loadMoreEvents,
  }
}
