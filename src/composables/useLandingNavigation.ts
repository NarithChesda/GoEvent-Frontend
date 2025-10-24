import { nextTick, onUnmounted } from 'vue'
import {
  NavigationFailureType,
  isNavigationFailure,
  useRouter,
} from 'vue-router'
import type { Router } from 'vue-router'

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

const scrollElementIntoView = (id: string) => {
  const element = document.getElementById(id)
  if (!element) {
    return false
  }

  element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  return true
}

const ensureNavigation = async (router: Router, hash?: string) => {
  const targetHash = hash ?? ''
  const current = router.currentRoute.value

  if (current.name !== 'home' || current.hash !== targetHash) {
    try {
      // Explicitly set hash to empty string or the target hash
      await router.push({ name: 'home', hash: targetHash || undefined })
    } catch (error) {
      if (
        !isNavigationFailure(error) ||
        error.type !== NavigationFailureType.duplicated
      ) {
        throw error
      }
    }
    await nextTick()
  }
}

export const useLandingNavigation = () => {
  const router = useRouter()
  let pendingScrollAbortController: AbortController | null = null

  const cancelPendingScroll = () => {
    if (pendingScrollAbortController) {
      pendingScrollAbortController.abort()
      pendingScrollAbortController = null
    }
  }

  const navigateHome = async () => {
    cancelPendingScroll()

    // Force navigation to home without any hash
    const current = router.currentRoute.value
    if (current.name !== 'home' || current.hash) {
      try {
        // Push to /home explicitly without hash to clear any existing hash
        await router.push('/home')
      } catch (error) {
        if (
          !isNavigationFailure(error) ||
          error.type !== NavigationFailureType.duplicated
        ) {
          throw error
        }
      }
      await nextTick()
    }

    // Try to scroll to hero section with retries for mobile
    const attemptScrollToHero = async (retries = 5): Promise<void> => {
      if (scrollElementIntoView('hero')) {
        return
      }

      if (retries <= 0) {
        // Fallback to top of page if hero not found
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }

      await wait(50)
      await attemptScrollToHero(retries - 1)
    }

    await attemptScrollToHero()
  }

  const scrollToPricing = async () => {
    cancelPendingScroll()
    const abortController = new AbortController()
    pendingScrollAbortController = abortController

    await ensureNavigation(router, '#pricing')

    const attemptScroll = async (retries = 10): Promise<void> => {
      if (abortController.signal.aborted) {
        return
      }

      if (scrollElementIntoView('pricing')) {
        pendingScrollAbortController = null
        return
      }

      if (retries <= 0) {
        pendingScrollAbortController = null
        return
      }

      await wait(75)
      await attemptScroll(retries - 1)
    }

    await attemptScroll()
  }

  onUnmounted(() => {
    cancelPendingScroll()
  })

  return {
    navigateHome,
    scrollToPricing,
    cancelPendingScroll,
  }
}
