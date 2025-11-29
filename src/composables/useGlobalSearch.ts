import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { eventsService, type Event } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

export interface SearchResult {
  id: string
  title: string
  date: string
  category: string | null
  location: string | null
  isVirtual: boolean
  type: 'my-event' | 'discover' | 'service'
  canManage: boolean
}

export interface SearchResults {
  myEvents: SearchResult[]
  discover: SearchResult[]
  services: SearchResult[]
}

export type SearchContext = 'events' | 'explore' | 'services' | 'other'

// Shared state (singleton pattern)
const isOpen = ref(false)
const query = ref('')
const isLoading = ref(false)
const results = ref<SearchResults>({
  myEvents: [],
  discover: [],
  services: []
})
const selectedIndex = ref(-1)
const error = ref<string | null>(null)
const currentContext = ref<SearchContext>('other')

// Track if keyboard listener is registered
let keyboardListenerRegistered = false
let debounceTimer: ReturnType<typeof setTimeout> | null = null

export function useGlobalSearch() {
  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()

  // Determine search context based on current route
  const getSearchContext = (): SearchContext => {
    const path = route.path
    if (path === '/events' || path.startsWith('/events/')) {
      return 'events'
    } else if (path === '/explore' || path.startsWith('/explore/')) {
      return 'explore'
    } else if (path === '/services' || path.startsWith('/services/')) {
      return 'services'
    }
    return 'other'
  }

  // Computed
  const isAuthenticated = computed(() => authStore.isAuthenticated)

  const allResults = computed(() => {
    const context = currentContext.value
    const all: SearchResult[] = []

    // Context-aware results
    if (context === 'events') {
      // On Events tab: only show My Events
      if (isAuthenticated.value) {
        all.push(...results.value.myEvents)
      }
    } else if (context === 'explore') {
      // On Discover tab: only show Discover results
      all.push(...results.value.discover)
    } else if (context === 'services') {
      // On Services tab: only show Services (future)
      all.push(...results.value.services)
    } else {
      // On other pages: show all categories
      if (isAuthenticated.value) {
        all.push(...results.value.myEvents)
      }
      all.push(...results.value.discover)
      all.push(...results.value.services)
    }

    return all
  })

  const hasResults = computed(() => allResults.value.length > 0)
  const hasQuery = computed(() => query.value.trim().length > 0)

  // Transform event to search result
  const transformEvent = (event: Event, type: 'my-event' | 'discover'): SearchResult => {
    const eventWithCategory = event as Event & {
      category?: { name?: string } | null
      category_name?: string
    }

    let categoryName: string | null = null
    if (eventWithCategory.category_name) {
      categoryName = eventWithCategory.category_name
    } else if (eventWithCategory.category && typeof eventWithCategory.category === 'object') {
      const category = eventWithCategory.category as { name?: string }
      categoryName = category.name || null
    }

    return {
      id: event.id,
      title: event.title,
      date: event.start_date,
      category: categoryName,
      location: event.location,
      isVirtual: event.is_virtual,
      type,
      canManage: event.can_edit === true || (authStore.user?.id !== undefined && event.organizer === authStore.user.id)
    }
  }

  // Search function
  const search = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      results.value = { myEvents: [], discover: [], services: [] }
      return
    }

    isLoading.value = true
    error.value = null

    const context = currentContext.value
    // Show more results when context-specific (10 instead of 5)
    const resultLimit = context === 'other' ? 5 : 10

    try {
      // Parallel API calls based on context
      const promises: Promise<unknown>[] = []

      // My Events (only if authenticated and relevant context)
      // Includes: organized, collaborated, and registered events
      if (isAuthenticated.value && (context === 'events' || context === 'other')) {
        promises.push(
          Promise.all([
            eventsService.getMyEvents({ search: searchQuery }),
            eventsService.getMyRegisteredEvents({ search: searchQuery })
          ]).then(([myEventsResponse, registeredResponse]) => {
            let allMyEvents: Event[] = []

            // Add organized and collaborated events
            if (myEventsResponse.success && myEventsResponse.data) {
              const organized = myEventsResponse.data.organized || []
              const collaborated = myEventsResponse.data.collaborated || []
              allMyEvents = [...organized, ...collaborated]
            }

            // Add registered events
            if (registeredResponse.success && registeredResponse.data) {
              const registered = Array.isArray(registeredResponse.data) ? registeredResponse.data : []
              allMyEvents = [...allMyEvents, ...registered]
            }

            // Deduplicate by id
            const uniqueEvents = allMyEvents.filter(
              (event, index, self) => self.findIndex(e => e.id === event.id) === index
            )

            // Client-side filtering as fallback (in case backend doesn't support search)
            const searchLower = searchQuery.toLowerCase()
            const filteredEvents = uniqueEvents.filter(event => {
              const titleMatch = event.title?.toLowerCase().includes(searchLower)
              const descMatch = event.description?.toLowerCase().includes(searchLower)
              const shortDescMatch = event.short_description?.toLowerCase().includes(searchLower)
              const locationMatch = event.location?.toLowerCase().includes(searchLower)
              const slugMatch = event.slug?.toLowerCase().includes(searchLower)
              // Check host names if available
              const hostsMatch = event.hosts?.some(host =>
                host.name?.toLowerCase().includes(searchLower)
              )
              return titleMatch || descMatch || shortDescMatch || locationMatch || slugMatch || hostsMatch
            })

            results.value.myEvents = filteredEvents.slice(0, resultLimit).map(e => transformEvent(e, 'my-event'))
          }).catch(() => {
            results.value.myEvents = []
          })
        )
      } else {
        results.value.myEvents = []
      }

      // Discover (public events - only if relevant context)
      // Explicitly filter by privacy: 'public' to ensure only public events are returned
      if (context === 'explore' || context === 'other') {
        promises.push(
          eventsService.getEvents({ search: searchQuery, page: 1, privacy: 'public' }).then(response => {
            if (response.success && response.data) {
              const events = response.data.results || []
              results.value.discover = events.slice(0, resultLimit).map(e => transformEvent(e, 'discover'))
            }
          }).catch(() => {
            results.value.discover = []
          })
        )
      } else {
        results.value.discover = []
      }

      // Services - placeholder for future
      results.value.services = []

      await Promise.all(promises)
    } catch (err) {
      error.value = 'Failed to search. Please try again.'
      if (import.meta.env.DEV) {
        console.error('Search error:', err)
      }
    } finally {
      isLoading.value = false
    }
  }

  // Debounced search
  const debouncedSearch = (searchQuery: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(() => {
      search(searchQuery)
    }, 300)
  }

  // Watch query changes
  watch(query, (newQuery) => {
    selectedIndex.value = -1
    debouncedSearch(newQuery)
  })

  // Open/close
  const open = () => {
    // Set context when opening
    currentContext.value = getSearchContext()
    isOpen.value = true
    query.value = ''
    results.value = { myEvents: [], discover: [], services: [] }
    selectedIndex.value = -1
  }

  const close = () => {
    isOpen.value = false
    query.value = ''
    results.value = { myEvents: [], discover: [], services: [] }
    selectedIndex.value = -1
  }

  // Keyboard navigation
  const navigateUp = () => {
    if (selectedIndex.value > 0) {
      selectedIndex.value--
    } else if (selectedIndex.value === -1 && allResults.value.length > 0) {
      selectedIndex.value = allResults.value.length - 1
    }
  }

  const navigateDown = () => {
    if (selectedIndex.value < allResults.value.length - 1) {
      selectedIndex.value++
    }
  }

  const selectCurrent = () => {
    if (selectedIndex.value >= 0 && selectedIndex.value < allResults.value.length) {
      const result = allResults.value[selectedIndex.value]
      navigateToResult(result)
    }
  }

  // Navigate to result
  const navigateToResult = (result: SearchResult) => {
    close()

    if (result.type === 'my-event') {
      router.push(`/events/${result.id}/manage`)
    } else if (result.type === 'discover') {
      // Navigate to explore with the event
      router.push(`/explore?event=${result.id}`)
    } else if (result.type === 'service') {
      // Future: navigate to service
      router.push('/services')
    }
  }

  // Global keyboard shortcut handler
  const handleKeyDown = (event: KeyboardEvent) => {
    // Cmd/Ctrl + K to open
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault()
      if (isOpen.value) {
        close()
      } else {
        open()
      }
    }
  }

  // Register global keyboard shortcut (only once)
  onMounted(() => {
    if (!keyboardListenerRegistered) {
      document.addEventListener('keydown', handleKeyDown)
      keyboardListenerRegistered = true
    }
  })

  onUnmounted(() => {
    // Don't remove the listener - it stays active as long as any component using this composable is mounted
    // This is intentional since we want Cmd+K to work globally
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
  })

  return {
    // State (shared refs)
    isOpen,
    query,
    isLoading,
    results,
    selectedIndex,
    error,
    currentContext,

    // Computed
    isAuthenticated,
    allResults,
    hasResults,
    hasQuery,

    // Methods
    open,
    close,
    navigateUp,
    navigateDown,
    selectCurrent,
    navigateToResult
  }
}
