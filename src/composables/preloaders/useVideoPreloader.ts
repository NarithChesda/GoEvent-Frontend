import { ref, onUnmounted } from 'vue'

/**
 * Video preloading composable
 * Handles video preloading with proper resource cleanup and memory management
 */
export function useVideoPreloader() {
  const activeVideoLoads = ref<Map<string, { controller: AbortController, timeoutId: number | null }>>(new Map())

  /**
   * Preload a video with enough data to play immediately
   */
  const preloadVideo = (url: string, signal: AbortSignal, timeoutMs = 30000): Promise<HTMLVideoElement> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'auto' // Load enough data to play immediately
      video.muted = true

      // Resource cleanup tracker
      const videoResources = {
        video,
        timeoutId: null as number | null,
        isAborted: false
      }

      const cleanup = () => {
        if (videoResources.timeoutId) {
          clearTimeout(videoResources.timeoutId)
        }
        
        // Clean up video element event listeners
        video.oncanplaythrough = null
        video.onloadedmetadata = null
        video.onerror = null
        video.onabort = null
        video.onstalled = null
        video.onwaiting = null
        
        signal.removeEventListener('abort', onAbort)
        
        // Clean up video resources if aborted
        if (videoResources.isAborted) {
          video.src = ''
          video.load() // Reset video element
        }
      }

      const onAbort = () => {
        videoResources.isAborted = true
        cleanup()
        reject(new Error('Video preload aborted'))
      }

      // Wait for enough data to play through without buffering
      video.oncanplaythrough = () => {
        cleanup()
        resolve(video)
      }

      // Fallback to metadata if canplaythrough takes too long
      video.onloadedmetadata = () => {
        console.log(`📺 Video metadata loaded for ${url}, waiting for canplaythrough...`)
      }

      video.onerror = () => {
        cleanup()
        reject(new Error(`Failed to load video: ${url}`))
      }

      signal.addEventListener('abort', onAbort)

      // Extended timeout for full video preloading
      videoResources.timeoutId = setTimeout(() => {
        if (!signal.aborted) {
          cleanup()
          // If we have metadata but not full preload, still resolve
          if (video.readyState >= video.HAVE_METADATA) {
            console.log(`📺 Video ${url} timeout but has metadata, resolving anyway`)
            resolve(video)
          } else {
            videoResources.isAborted = true
            reject(new Error(`Video load timeout: ${url}`))
          }
        }
      }, timeoutMs * 2) // Double timeout for full video loading

      video.src = url
    })
  }

  /**
   * Preload multiple videos with concurrency control
   */
  const preloadVideos = async (urls: string[], maxConcurrent = 2): Promise<HTMLVideoElement[]> => {
    const results: Promise<HTMLVideoElement>[] = []
    const activeLoads: Promise<HTMLVideoElement>[] = []

    for (const url of urls) {
      const controller = new AbortController()
      activeVideoLoads.value.set(url, { controller, timeoutId: null })

      const loadPromise = preloadVideo(url, controller.signal).finally(() => {
        activeVideoLoads.value.delete(url)
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
   * Cancel all active video loads
   */
  const cancelVideoLoads = () => {
    activeVideoLoads.value.forEach(({ controller, timeoutId }) => {
      controller.abort()
      if (timeoutId) clearTimeout(timeoutId)
    })
    activeVideoLoads.value.clear()
  }

  // Cleanup on unmount
  onUnmounted(() => {
    cancelVideoLoads()
  })

  return {
    preloadVideo,
    preloadVideos,
    cancelVideoLoads,
    activeVideoLoads
  }
}