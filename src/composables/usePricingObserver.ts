import { ref, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/**
 * Composable to track visibility of the pricing section on the home page
 * Uses IntersectionObserver to detect when the pricing section is in view
 */
export function usePricingObserver() {
  const route = useRoute()
  const router = useRouter()
  const isPricingSectionVisible = ref(false)
  let observer: IntersectionObserver | null = null
  let routerUnwatch: (() => void) | null = null

  /**
   * Setup the IntersectionObserver for the pricing section
   */
  const setupObserver = () => {
    // Clean up existing observer before creating a new one
    cleanupObserver()

    // Only observe on the home page
    if (route.path !== '/home') {
      isPricingSectionVisible.value = false
      return
    }

    const pricingSection = document.getElementById('pricing')
    if (!pricingSection) {
      isPricingSectionVisible.value = false
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Consider section visible if at least 30% is in view
          isPricingSectionVisible.value = entry.isIntersecting && entry.intersectionRatio > 0.3
        })
      },
      {
        threshold: [0, 0.3, 0.5, 1],
        rootMargin: '-100px 0px -100px 0px'
      }
    )

    observer.observe(pricingSection)
  }

  /**
   * Clean up the observer
   */
  const cleanupObserver = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  /**
   * Initialize the observer and watch for route changes
   */
  const initialize = () => {
    // Clean up existing router watcher before creating new one
    if (routerUnwatch) {
      routerUnwatch()
      routerUnwatch = null
    }

    setupObserver()

    // Re-setup observer when route changes
    routerUnwatch = router.afterEach(() => {
      setupObserver()
    })
  }

  /**
   * Cleanup function to be called on unmount
   */
  const cleanup = () => {
    cleanupObserver()
    if (routerUnwatch) {
      routerUnwatch()
      routerUnwatch = null
    }
  }

  // Cleanup on unmount
  onUnmounted(cleanup)

  return {
    isPricingSectionVisible,
    initialize,
    cleanup
  }
}
