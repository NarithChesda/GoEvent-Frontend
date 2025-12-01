import { ref, onMounted, onUnmounted, readonly } from 'vue'

/**
 * Reactive Window Dimensions Composable
 *
 * Provides reactive window width and height that update on resize.
 * Includes debouncing to prevent excessive recalculations.
 *
 * @example
 * const { width, height, devicePixelRatio } = useWindowDimensions()
 *
 * const optimizedUrl = computed(() =>
 *   getOptimizedMediaUrl(url, { width: width.value, height: height.value })
 * )
 */
export function useWindowDimensions() {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : 0)
  const height = ref(typeof window !== 'undefined' ? window.innerHeight : 0)
  const devicePixelRatio = ref(typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 3) : 2)

  let resizeTimeout: ReturnType<typeof setTimeout> | null = null

  const handleResize = () => {
    // Debounce resize events to prevent excessive updates
    if (resizeTimeout) {
      clearTimeout(resizeTimeout)
    }

    resizeTimeout = setTimeout(() => {
      width.value = window.innerWidth
      height.value = window.innerHeight
      devicePixelRatio.value = Math.min(window.devicePixelRatio, 3)
    }, 100) // 100ms debounce
  }

  onMounted(() => {
    // Ensure initial values are set
    width.value = window.innerWidth
    height.value = window.innerHeight
    devicePixelRatio.value = Math.min(window.devicePixelRatio, 3)

    window.addEventListener('resize', handleResize, { passive: true })
    window.addEventListener('orientationchange', handleResize, { passive: true })
  })

  onUnmounted(() => {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout)
    }
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('orientationchange', handleResize)
  })

  return {
    width: readonly(width),
    height: readonly(height),
    devicePixelRatio: readonly(devicePixelRatio),
  }
}
