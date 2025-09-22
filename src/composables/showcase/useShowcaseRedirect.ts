import { ref, computed, nextTick } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import type { ShowcaseStage } from './useShowcaseStages'

/**
 * Showcase Redirect Management Composable
 *
 * Handles intelligent redirect behavior for showcase pages, including:
 * - Return visitor detection and stage skipping
 * - Auth redirect handling with stage preservation
 * - Deep linking to specific sections (RSVP, comments)
 * - Video state preservation during redirects
 * - Secure localStorage management for user preferences
 */
export function useShowcaseRedirect(route: RouteLocationNormalizedLoaded) {
  // Video state preservation for auth redirects
  const videoStatePreserved = ref(false)

  /**
   * Generates a secure localStorage key for tracking main content view status
   * Sanitizes the eventId to prevent any potential injection attacks
   */
  const getMainContentSeenKey = (eventId: string): string => {
    // Sanitize eventId to prevent injection and limit length for security
    const sanitizedId = eventId.replace(/[^a-zA-Z0-9\-_]/g, '').substring(0, 50)
    return `showcase_main_content_seen_${sanitizedId}`
  }

  /**
   * Checks if user has seen the main content stage for this event
   */
  const hasSeenMainContent = computed(() => {
    const eventId = route.params.id as string
    if (!eventId) return false

    try {
      const key = getMainContentSeenKey(eventId)
      const seen = localStorage.getItem(key)
      return seen === 'true'
    } catch {
      // localStorage might be disabled
      return false
    }
  })

  /**
   * Marks that the user has seen the main content stage
   * This persists across browser sessions
   */
  const markMainContentSeen = (): void => {
    const eventId = route.params.id as string
    if (!eventId) return

    try {
      const key = getMainContentSeenKey(eventId)
      localStorage.setItem(key, 'true')
    } catch (error) {
      console.warn('Failed to mark main content as seen:', error)
    }
  }

  /**
   * Gets redirect indicators from current route and URL
   */
  const getRedirectIndicators = () => {
    const hash = route.hash || (typeof window !== 'undefined' ? window.location.hash : '')
    const scrollTo = route.query.scrollTo as string
    const redirect = route.query.redirect as string

    // Check for language change flag (with expiry check)
    let hasLanguageChange = false
    if (typeof window !== 'undefined') {
      const langChangeFlag = sessionStorage.getItem('language_change')
      const langChangeTime = sessionStorage.getItem('language_change_time')

      if (langChangeFlag === 'true' && langChangeTime) {
        const changeTime = parseInt(langChangeTime, 10)
        const now = Date.now()
        // Flag expires after 30 seconds
        if (now - changeTime < 30000) {
          hasLanguageChange = true
        } else {
          // Clear expired flag
          sessionStorage.removeItem('language_change')
          sessionStorage.removeItem('language_change_time')
        }
      }
    }

    return {
      hasRsvpHash: hash === '#rsvp',
      hasCommentHash: hash === '#comment-section',
      hasScrollToRsvp: scrollTo === 'rsvp',
      hasScrollToComment: scrollTo === 'comment-section',
      hasRedirectFlag: redirect === 'true',
      hasLanguageChange,
      hasAny:
        hash === '#rsvp' ||
        hash === '#comment-section' ||
        scrollTo === 'rsvp' ||
        scrollTo === 'comment-section' ||
        redirect === 'true' ||
        hasLanguageChange ||
        // Fallback: check if redirect was recently initiated
        (typeof window !== 'undefined' && sessionStorage.getItem('pending_redirect') === 'true'),
    }
  }

  /**
   * Intelligent stage determination for returning users with redirect context
   *
   * This computed determines if we should skip intro animations and go directly
   * to main content. The logic ensures:
   *
   * 1. First-time visitors ALWAYS see the full experience (cover → video → main)
   * 2. Returning users with redirect indicators (from login, deep links) skip to main content
   * 3. Users without redirect context see the full experience regardless of previous visits
   *
   * This provides optimal UX: newcomers get the full immersion, returning users
   * get quick access to the content they're looking for.
   */
  const shouldSkipToMainContent = computed(() => {
    const redirectIndicators = getRedirectIndicators()

    // Only skip to main content if user has seen it before AND has redirect indicators
    // This ensures first-time visitors always see the cover stage
    return hasSeenMainContent.value && redirectIndicators.hasAny
  })

  /**
   * Checks if current navigation is a page refresh/direct access
   */
  const isPageRefresh = (): boolean => {
    if (typeof window === 'undefined') return true // SSR default

    const redirectIndicators = getRedirectIndicators()
    return !redirectIndicators.hasAny
  }

  /**
   * Initializes the showcase stage based on redirect state
   * Returns the appropriate initial stage
   */
  const getInitialStage = async (): Promise<ShowcaseStage> => {
    // Wait for route to be fully loaded
    await nextTick()

    // Check redirect indicators first to handle language changes
    const redirectIndicators = getRedirectIndicators()

    // If user has redirect indicators (including language changes) and has seen main content before, skip to main content
    if (redirectIndicators.hasAny && hasSeenMainContent.value) {
      return 'main_content'
    }

    // If user refreshes page or accesses directly without redirect indicators, start with cover stage
    return 'cover'
  }

  /**
   * Sets video state preservation flag to prevent video loading issues during auth redirects
   */
  const preserveVideoState = (): void => {
    videoStatePreserved.value = true
  }

  /**
   * Clears video state preservation flag after successful video restoration
   */
  const clearVideoStatePreservation = (): void => {
    videoStatePreserved.value = false
  }

  /**
   * Enhanced login redirect handler with video state preservation
   * This maintains the redirect state after authentication and preserves video loading
   */
  const handleLoginRedirectWithStage = (setStage: (stage: ShowcaseStage) => void): void => {
    const redirectIndicators = getRedirectIndicators()

    if (redirectIndicators.hasAny && hasSeenMainContent.value) {
      // Preserve video state before stage change to prevent loading issues
      preserveVideoState()

      // Set pending redirect flag for state persistence
      try {
        sessionStorage.setItem('pending_redirect', 'true')
      } catch {
        // Handle sessionStorage errors silently
      }

      // Only skip stages if user has seen main content before
      // Set stage to main content for immediate display
      setStage('main_content')

      // Scroll to target section after content renders
      setTimeout(() => {
        const ALLOWED_SCROLL_TARGETS = ['rsvp', 'comment-section'] as const
        const hash = route.hash || (typeof window !== 'undefined' ? window.location.hash : '')
        const scrollTo = route.query.scrollTo as string

        const targetId =
          ALLOWED_SCROLL_TARGETS.find((target) => hash === `#${target}` || scrollTo === target) ||
          null

        if (targetId) {
          const targetElement = document.getElementById(targetId)
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }

        // Clear video state preservation after successful redirect
        setTimeout(() => {
          clearVideoStatePreservation()
        }, 1000)

        // Clear pending redirect flag after successful redirect
        try {
          sessionStorage.removeItem('pending_redirect')
        } catch {
          // Handle sessionStorage errors silently
        }
      }, 500)
    }
  }

  /**
   * Scroll to a specific section with validation
   */
  const scrollToSection = (sectionId: string): void => {
    const ALLOWED_SCROLL_TARGETS = [
      'rsvp',
      'comment-section',
      'gallery',
      'agenda',
      'hosts',
    ] as const

    if (!ALLOWED_SCROLL_TARGETS.includes(sectionId as any)) {
      console.warn('Invalid scroll target:', sectionId)
      return
    }

    const targetElement = document.getElementById(sectionId)
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })

      // Add temporary highlight effect
      targetElement.classList.add('highlight-section')
      setTimeout(() => {
        targetElement.classList.remove('highlight-section')
      }, 2000)
    }
  }

  /**
   * Handle deep link navigation after stage initialization
   */
  const handleDeepLinkNavigation = (): void => {
    const redirectIndicators = getRedirectIndicators()

    setTimeout(() => {
      if (redirectIndicators.hasRsvpHash || redirectIndicators.hasScrollToRsvp) {
        scrollToSection('rsvp')
      } else if (redirectIndicators.hasCommentHash || redirectIndicators.hasScrollToComment) {
        scrollToSection('comment-section')
      }
    }, 1000) // Wait for content to render
  }

  /**
   * Clear all redirect-related storage and state
   */
  const clearRedirectState = (): void => {
    try {
      sessionStorage.removeItem('pending_redirect')
      // Also clear language change flags
      sessionStorage.removeItem('language_change')
      sessionStorage.removeItem('language_change_time')
    } catch {
      // Handle sessionStorage errors silently
    }

    videoStatePreserved.value = false
  }

  /**
   * Clears language change flags after they've been processed
   */
  const clearLanguageChangeFlags = (): void => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('language_change')
        sessionStorage.removeItem('language_change_time')
      } catch {
        // Handle sessionStorage errors silently
      }
    }
  }

  /**
   * Check if user should see a welcome back message
   */
  const shouldShowWelcomeBack = computed(() => {
    return hasSeenMainContent.value && !isPageRefresh()
  })

  return {
    // State
    videoStatePreserved,
    hasSeenMainContent,
    shouldSkipToMainContent,
    shouldShowWelcomeBack,

    // Methods
    getMainContentSeenKey,
    markMainContentSeen,
    getRedirectIndicators,
    isPageRefresh,
    getInitialStage,
    preserveVideoState,
    clearVideoStatePreservation,
    handleLoginRedirectWithStage,
    scrollToSection,
    handleDeepLinkNavigation,
    clearRedirectState,
    clearLanguageChangeFlags,
  }
}
