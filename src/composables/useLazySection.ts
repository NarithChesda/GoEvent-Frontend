import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export interface LazyLoadOptions {
  rootMargin?: string
  threshold?: number
  onVisible?: () => void
}

/**
 * Composable for lazy loading sections using Intersection Observer
 * Optimizes performance by only rendering/loading heavy components when they're about to be visible
 */
export function useLazySection(options: LazyLoadOptions = {}) {
  const {
    rootMargin = '200px', // Load 200px before element becomes visible
    threshold = 0.01,
    onVisible
  } = options

  const isVisible = ref(false)
  const sectionRef: Ref<HTMLElement | null> = ref(null)
  let observer: IntersectionObserver | null = null

  const observe = () => {
    if (!sectionRef.value || isVisible.value) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible.value) {
            isVisible.value = true
            onVisible?.()

            // Once visible, we can disconnect the observer to save resources
            if (observer) {
              observer.disconnect()
              observer = null
            }
          }
        })
      },
      {
        rootMargin,
        threshold
      }
    )

    observer.observe(sectionRef.value)
  }

  onMounted(() => {
    // Small delay to ensure DOM is ready
    setTimeout(observe, 100)
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  })

  return {
    isVisible,
    sectionRef
  }
}
