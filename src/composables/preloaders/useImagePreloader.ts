import { ref, onUnmounted } from 'vue'

/**
 * Image preloading composable
 * Handles image preloading with proper cleanup and resource management
 */
export function useImagePreloader() {
  const activeImageLoads = ref<Map<string, AbortController>>(new Map())

  /**
   * Preload a single image
   */
  const preloadImage = (url: string, signal: AbortSignal): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      const cleanup = () => {
        img.onload = null
        img.onerror = null
        signal.removeEventListener('abort', onAbort)
      }

      const onAbort = () => {
        cleanup()
        reject(new Error('Image preload aborted'))
      }

      img.onload = () => {
        cleanup()
        resolve(img)
      }

      img.onerror = () => {
        cleanup()
        reject(new Error(`Failed to load image: ${url}`))
      }

      signal.addEventListener('abort', onAbort)
      img.src = url
    })
  }

  /**
   * Preload multiple images concurrently
   */
  const preloadImages = async (urls: string[], maxConcurrent = 4): Promise<HTMLImageElement[]> => {
    const results: Promise<HTMLImageElement>[] = []
    const activeLoads: Promise<HTMLImageElement>[] = []

    for (const url of urls) {
      const controller = new AbortController()
      activeImageLoads.value.set(url, controller)

      const loadPromise = preloadImage(url, controller.signal).finally(() => {
        activeImageLoads.value.delete(url)
        const index = activeLoads.indexOf(loadPromise)
        if (index > -1) {
          activeLoads.splice(index, 1)
        }
      })

      results.push(loadPromise)
      activeLoads.push(loadPromise)

      // Wait for available slot if at max concurrency
      if (activeLoads.length >= maxConcurrent) {
        await Promise.race(activeLoads)
      }
    }

    return Promise.all(results)
  }

  /**
   * Cancel all active image loads
   */
  const cancelImageLoads = () => {
    activeImageLoads.value.forEach(controller => controller.abort())
    activeImageLoads.value.clear()
  }

  // Cleanup on unmount
  onUnmounted(() => {
    cancelImageLoads()
  })

  return {
    preloadImage,
    preloadImages,
    cancelImageLoads,
    activeImageLoads
  }
}