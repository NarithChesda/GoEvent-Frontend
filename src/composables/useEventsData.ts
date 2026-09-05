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
 * The last list each tab successfully rendered, kept for the life of the tab.
 *
 * Every view builds its own MainLayout, so switching tabs unmounts the page
 * entirely and the next `useEventsData` starts from an empty array — which is
 * why Events and Discover used to drop to a full-page skeleton on every switch
 * and hold it for a whole round trip. The list you were just looking at is
 * still correct; what it needs is a refresh, not a reload.
 *
 * So a keyed instance is seeded from here and reports `restored`, and the
 * caller's mount fetch runs `silent` — the cards stay on screen and are
 * replaced in place when the response lands. This is deliberately only the
 * *mount* path: a filter change still shows the skeleton, because there the
 * whole list genuinely is being replaced and the tap needs an answer.
 *
 * Not a reactive store. Nothing observes it — it is read once at setup and
 * written after each successful load — and a shared ref would make two mounted
 * instances fight over one array.
 */
const eventListCache = new Map<string, Event[]>()

/**
 * Drop every cached list. Called on sign-out (see App.vue), because the cache
 * outlives the session: nothing here triggers a page reload on logout, so
 * without this the next account to sign in would be seeded with — and would
 * paint — the previous one's `events:my` titles before its own fetch landed.
 */
export function resetEventListCache() {
  eventListCache.clear()
}

/**
 * Composable for managing events data across different views
 *
 * @param isAuthenticated - Reactive ref indicating if user is authenticated
 * @param cacheKey - Opts this tab into the cross-mount list cache above. Must
 *   be unique per tab: two tabs sharing a key would seed each other with a list
 *   the other's filters never asked for.
 * @returns Object containing reactive state and methods for event management
 */
export function useEventsData(isAuthenticated: Ref<boolean>, cacheKey?: string) {
  const cached = cacheKey ? eventListCache.get(cacheKey) : undefined
  const events = ref<Event[]>(cached ? [...cached] : [])
  /** Whether this instance came up already showing a list. */
  const restored = cached !== undefined && cached.length > 0
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
  /**
   * @param silent  Refresh in place without flipping `loading`. Use it when the
   *   list is already on screen and only its contents change — swapping a full
   *   page of real cards for a skeleton and back reads as a page reload, not as
   *   the one row that actually changed.
   */
  const loadEvents = async (
    view: ViewType,
    filters: EventFiltersType,
    append = false,
    silent = false
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
      if (!silent) loading.value = true
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

        // Cached only when nothing is filtered, because the cache's one job is
        // to seed the *next mount* and both tabs remount with their filters
        // cleared (`filters` is a fresh `{}`, `dateFilter` back to its
        // default). Caching a filtered result would seed the next visit with a
        // narrowed list under a filter control reading "All" — a wrong list
        // shown confidently, which is worse than the skeleton this replaces.
        // Appended pages under no filter are cached, so returning restores the
        // whole infinite-scrolled list rather than its first page.
        if (cacheKey && Object.values(filters).every((v) => v === undefined)) {
          eventListCache.set(cacheKey, events.value)
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
    restored,
    currentPage,
    hasMore,
    isLoadingMore,

    // Methods
    loadEvents,
    loadMoreEvents,
  }
}
