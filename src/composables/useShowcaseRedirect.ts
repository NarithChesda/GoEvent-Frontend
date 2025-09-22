// Vue 3 Composition API
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

// ============================
// Type Definitions
// ============================
export type ShowcaseStage = 'cover' | 'event_video' | 'main_content'

export interface ShowcaseRedirectState {
  eventId: string
  hasSeenMainContent: boolean
  lastVisitStage: ShowcaseStage
  timestamp: number
}

export interface RedirectTrigger {
  source: 'language_change' | 'login' | 'rsvp' | 'comment' | 'manual'
  targetStage?: ShowcaseStage
  hash?: string
}

// ============================
// Storage Keys and Configuration
// ============================
const STORAGE_KEY = 'goevent_showcase_redirect_state'
const STATE_EXPIRY_TIME = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
const MAX_STORED_EVENTS = 10 // Maximum number of events to track

// ============================
// Main Composable
// ============================
export function useShowcaseRedirect() {
  const route = useRoute()

  // ============================
  // Reactive State
  // ============================
  const redirectState = ref<Map<string, ShowcaseRedirectState>>(new Map())
  const currentEventId = computed(() => route.params.id as string)
  const isInitialized = ref(false)

  // ============================
  // Storage Management
  // ============================

  /**
   * Load redirect states from localStorage with validation and cleanup
   */
  const loadRedirectStates = (): Map<string, ShowcaseRedirectState> => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (!storedData) return new Map()

      const parsedData = JSON.parse(storedData)
      const stateMap = new Map<string, ShowcaseRedirectState>()
      const currentTime = Date.now()

      // Validate and cleanup expired entries
      Object.entries(parsedData).forEach(([eventId, state]) => {
        const typedState = state as ShowcaseRedirectState

        // Validate structure and expiry
        if (
          typeof typedState === 'object' &&
          typedState.eventId &&
          typedState.timestamp &&
          currentTime - typedState.timestamp < STATE_EXPIRY_TIME
        ) {
          stateMap.set(eventId, typedState)
        }
      })

      // Limit stored entries to prevent localStorage bloat
      if (stateMap.size > MAX_STORED_EVENTS) {
        const sortedEntries = Array.from(stateMap.entries())
          .sort((a, b) => b[1].timestamp - a[1].timestamp)
          .slice(0, MAX_STORED_EVENTS)

        stateMap.clear()
        sortedEntries.forEach(([eventId, state]) => {
          stateMap.set(eventId, state)
        })
      }

      return stateMap
    } catch (error) {
      console.warn('Failed to load showcase redirect states:', error)
      return new Map()
    }
  }

  /**
   * Save redirect states to localStorage with error handling
   */
  const saveRedirectStates = (states: Map<string, ShowcaseRedirectState>): void => {
    try {
      const serializedData = Object.fromEntries(states)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializedData))
    } catch (error) {
      console.warn('Failed to save showcase redirect states:', error)
      // If localStorage is full or unavailable, cleanup old entries and retry
      try {
        localStorage.removeItem(STORAGE_KEY)
        const currentEventState = states.get(currentEventId.value)
        if (currentEventState) {
          const minimalState = new Map([[currentEventId.value, currentEventState]])
          localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(minimalState)))
        }
      } catch (retryError) {
        console.warn('Failed to save minimal redirect state:', retryError)
      }
    }
  }

  // ============================
  // State Management Methods
  // ============================

  /**
   * Initialize redirect state management
   */
  const initializeRedirectState = (): void => {
    if (isInitialized.value) return

    redirectState.value = loadRedirectStates()
    isInitialized.value = true
  }

  /**
   * Get redirect state for a specific event
   */
  const getEventRedirectState = (eventId?: string): ShowcaseRedirectState | null => {
    const targetEventId = eventId || currentEventId.value
    if (!targetEventId) return null

    return redirectState.value.get(targetEventId) || null
  }

  /**
   * Update redirect state for current event
   */
  const updateEventRedirectState = (
    updates: Partial<ShowcaseRedirectState>,
    eventId?: string,
  ): void => {
    const targetEventId = eventId || currentEventId.value
    if (!targetEventId) return

    const currentState = redirectState.value.get(targetEventId)
    const newState: ShowcaseRedirectState = {
      eventId: targetEventId,
      hasSeenMainContent: false,
      lastVisitStage: 'cover',
      timestamp: Date.now(),
      ...currentState,
      ...updates,
    }

    redirectState.value.set(targetEventId, newState)
    saveRedirectStates(redirectState.value)
  }

  /**
   * Mark that user has seen the main content stage
   */
  const markMainContentSeen = (eventId?: string): void => {
    updateEventRedirectState(
      {
        hasSeenMainContent: true,
        lastVisitStage: 'main_content',
        timestamp: Date.now(),
      },
      eventId,
    )
  }

  /**
   * Clear redirect state for a specific event
   */
  const clearEventRedirectState = (eventId?: string): void => {
    const targetEventId = eventId || currentEventId.value
    if (!targetEventId) return

    redirectState.value.delete(targetEventId)
    saveRedirectStates(redirectState.value)
  }

  /**
   * Clear all expired redirect states
   */
  const cleanupExpiredStates = (): void => {
    const currentTime = Date.now()
    let hasChanges = false

    redirectState.value.forEach((state, eventId) => {
      if (currentTime - state.timestamp >= STATE_EXPIRY_TIME) {
        redirectState.value.delete(eventId)
        hasChanges = true
      }
    })

    if (hasChanges) {
      saveRedirectStates(redirectState.value)
    }
  }

  // ============================
  // Redirect Logic Methods
  // ============================

  /**
   * Determine if user should skip to main content stage
   */
  const shouldSkipToMainContent = (trigger?: RedirectTrigger): boolean => {
    const currentState = getEventRedirectState()

    // First time visiting - always start from cover
    if (!currentState || !currentState.hasSeenMainContent) {
      return false
    }

    // User has seen main content before
    if (trigger) {
      // Specific triggers that should skip to main content
      const skipTriggers: RedirectTrigger['source'][] = [
        'language_change',
        'login',
        'rsvp',
        'comment',
      ]

      if (skipTriggers.includes(trigger.source)) {
        return true
      }

      // Manual trigger with specific target stage
      if (trigger.source === 'manual' && trigger.targetStage === 'main_content') {
        return true
      }
    }

    // Check URL hash for redirect indicators
    const hash = window.location.hash
    if (hash && (hash.includes('#rsvp') || hash.includes('#comment-section'))) {
      return true
    }

    // Check query parameters for redirect indicators
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('scrollTo') || urlParams.get('redirect') === 'main') {
      return true
    }

    return false
  }

  /**
   * Determine the initial stage based on redirect state
   */
  const getInitialStage = (trigger?: RedirectTrigger): ShowcaseStage => {
    if (shouldSkipToMainContent(trigger)) {
      return 'main_content'
    }

    // Default to cover stage for first-time visitors
    return 'cover'
  }

  /**
   * Handle redirect triggers (language change, login, etc.)
   */
  const handleRedirectTrigger = (trigger: RedirectTrigger): ShowcaseStage => {
    const initialStage = getInitialStage(trigger)

    // Update state with latest visit information
    updateEventRedirectState({
      lastVisitStage: initialStage,
      timestamp: Date.now(),
    })

    return initialStage
  }

  // ============================
  // Utility Methods
  // ============================

  /**
   * Check if current event has redirect state
   */
  const hasRedirectState = computed((): boolean => {
    return redirectState.value.has(currentEventId.value)
  })

  /**
   * Check if current event user has seen main content
   */
  const hasSeenMainContent = computed((): boolean => {
    const state = getEventRedirectState()
    return state?.hasSeenMainContent || false
  })

  /**
   * Get last visit stage for current event
   */
  const lastVisitStage = computed((): ShowcaseStage => {
    const state = getEventRedirectState()
    return state?.lastVisitStage || 'cover'
  })

  /**
   * Get debug information for current event redirect state
   */
  const getDebugInfo = () => {
    const state = getEventRedirectState()
    return {
      eventId: currentEventId.value,
      hasRedirectState: hasRedirectState.value,
      hasSeenMainContent: hasSeenMainContent.value,
      lastVisitStage: lastVisitStage.value,
      fullState: state,
      totalStoredStates: redirectState.value.size,
      shouldSkipToMain: shouldSkipToMainContent(),
    }
  }

  // ============================
  // Initialization
  // ============================

  // Auto-initialize and cleanup on first use
  initializeRedirectState()
  cleanupExpiredStates()

  // ============================
  // Return Public API
  // ============================
  return {
    // State
    isInitialized,
    hasRedirectState,
    hasSeenMainContent,
    lastVisitStage,

    // Methods
    initializeRedirectState,
    getEventRedirectState,
    updateEventRedirectState,
    markMainContentSeen,
    clearEventRedirectState,
    cleanupExpiredStates,

    // Redirect Logic
    shouldSkipToMainContent,
    getInitialStage,
    handleRedirectTrigger,

    // Utilities
    getDebugInfo,
  }
}
