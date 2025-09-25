import { ref } from 'vue'

// Video configuration constants
const VIDEO_CONFIG = {
  MAX_MANAGED_VIDEOS: 10,
  MAX_CLEANUP_TIME: 5000, // 5 seconds
  CLEANUP_BATCH_SIZE: 3,
  PAUSE_DELAY: 50,
} as const

export interface VideoError extends Error {
  videoElement?: HTMLVideoElement
  src?: string
}

/**
 * Video Resource Manager Composable
 *
 * Centralized system for managing video element lifecycle to prevent memory leaks
 * and ensure optimal performance in showcase environments. Key features:
 *
 * • **Memory Management**: Tracks and limits concurrent video elements
 * • **Event Cleanup**: Automatically removes event listeners on cleanup
 * • **Security Validation**: Validates video sources against trusted domains
 * • **Error Recovery**: Handles AbortError and other video-specific errors
 * • **Resource Limits**: Enforces maximum video count with cleanup strategies
 * • **Deduplication**: Prevents duplicate videos for the same source
 */
export function useVideoResourceManager() {
  // Video resource management state
  const videoEventListeners = ref<
    Map<HTMLVideoElement, Array<{ event: string; handler: EventListener }>>
  >(new Map())
  const managedVideoElements = ref<Set<HTMLVideoElement>>(new Set())
  const videoCleanupCallbacks = ref<Set<() => void>>(new Set())

  /**
   * Validates video element for security and integrity
   */
  const validateVideoElement = (element: HTMLVideoElement): boolean => {
    if (!element || !(element instanceof HTMLVideoElement)) return false

    // Check if element is attached to document
    if (!document.contains(element)) return false

    // Validate src attribute is from trusted domain
    const src = element.src || element.getAttribute('src') || ''
    if (!src) return true // Allow empty src for cleanup

    try {
      const url = new URL(src)
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
      const allowedOrigins = [new URL(API_BASE_URL).origin, window.location.origin]

      // Allow data URLs for embedded content
      if (url.protocol === 'data:') {
        return url.href.startsWith('data:video/')
      }

      return allowedOrigins.includes(url.origin)
    } catch {
      return false
    }
  }

  /**
   * Register a video element for managed cleanup with validation
   */
  const registerVideo = (video: HTMLVideoElement, identifier?: string): void => {
    // Security validation
    if (!validateVideoElement(video)) {
      console.warn('Invalid video element, skipping registration:', identifier)
      return
    }

    if (managedVideoElements.value.has(video)) {
      return
    }

    // Check resource limits
    if (managedVideoElements.value.size >= VIDEO_CONFIG.MAX_MANAGED_VIDEOS) {
      enforceResourceLimits()
    }

    managedVideoElements.value.add(video)

    // Add default error handler to prevent uncaught exceptions
    const errorHandler = () => {
      cleanupVideo(video)
    }

    addVideoEventListener(video, 'error', errorHandler)
  }

  /**
   * Add event listener with automatic cleanup tracking
   */
  const addVideoEventListener = (
    video: HTMLVideoElement,
    event: string,
    handler: EventListener,
  ): void => {
    video.addEventListener(event, handler)

    if (!videoEventListeners.value.has(video)) {
      videoEventListeners.value.set(video, [])
    }
    videoEventListeners.value.get(video)?.push({ event, handler })
  }

  /**
   * Clean up a specific video element with timeout and error boundaries
   */
  const cleanupVideo = (video: HTMLVideoElement | null): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!video) {
        resolve()
        return
      }

      const cleanup = async () => {
        // Remove all tracked event listeners
        const listeners = videoEventListeners.value.get(video)
        if (listeners) {
          listeners.forEach(({ event, handler }) => {
            try {
              video.removeEventListener(event, handler)
            } catch (error) {
              // Silently handle listener removal errors
            }
          })
          videoEventListeners.value.delete(video)
        }

        // Cleanup video resources with enhanced error boundary
        try {
          // Handle any pending play promises to prevent AbortErrors
          if (!video.paused) {
            try {
              video.pause()
              // Small delay to let any pending promises settle
              await new Promise((resolve) => setTimeout(resolve, VIDEO_CONFIG.PAUSE_DELAY))
            } catch (pauseError) {
              // Silently handle pause errors
            }
          }

          // Clear blob URLs if present
          const currentSrc = video.currentSrc || video.src
          if (currentSrc && currentSrc.startsWith('blob:')) {
            try {
              URL.revokeObjectURL(currentSrc)
            } catch {
              // Ignore blob URL revocation errors
            }
          }

          // Clear source with error handling
          try {
            video.removeAttribute('src')
            video.srcObject = null
            video.load()
          } catch {
            // Silently handle source clearing errors
          }

          // Remove from managed set
          managedVideoElements.value.delete(video)

          resolve()
        } catch (error) {
          // Still remove from managed set even if cleanup partially failed
          managedVideoElements.value.delete(video)
          reject(error)
        }
      }

      // Apply timeout to prevent hanging cleanup
      const timeoutId = setTimeout(() => {
        managedVideoElements.value.delete(video)
        reject(new Error('Cleanup timeout'))
      }, VIDEO_CONFIG.MAX_CLEANUP_TIME)

      cleanup()
        .then(() => {
          clearTimeout(timeoutId)
          resolve()
        })
        .catch((error) => {
          clearTimeout(timeoutId)
          reject(error)
        })
    })
  }

  /**
   * Enforce resource limits by cleaning up oldest videos
   */
  const enforceResourceLimits = (): void => {
    const videos = Array.from(managedVideoElements.value)
    const excess = videos.length - VIDEO_CONFIG.MAX_MANAGED_VIDEOS + VIDEO_CONFIG.CLEANUP_BATCH_SIZE

    if (excess > 0) {
      const videosToClean = videos.slice(0, Math.min(excess, VIDEO_CONFIG.CLEANUP_BATCH_SIZE))
      videosToClean.forEach((video) => {
        cleanupVideo(video).catch((error) => {
          console.warn('Failed to cleanup video during limit enforcement:', error)
        })
      })
    }
  }

  /**
   * Clean up all managed video resources
   */
  const cleanupAllVideos = (): void => {
    // Cleanup all managed video elements
    managedVideoElements.value.forEach((video) => {
      cleanupVideo(video).catch(() => {
        // Silently handle cleanup errors
      })
    })

    // Execute custom cleanup callbacks
    videoCleanupCallbacks.value.forEach((callback) => {
      try {
        callback()
      } catch {
        // Silently handle callback errors
      }
    })

    // Clear all tracking
    videoEventListeners.value.clear()
    managedVideoElements.value.clear()
    videoCleanupCallbacks.value.clear()
  }

  /**
   * Register a custom cleanup callback
   */
  const addCleanupCallback = (callback: () => void): void => {
    videoCleanupCallbacks.value.add(callback)
  }

  /**
   * Intelligent Video Deduplication System
   *
   * Handles the complex scenario where multiple video elements exist for the same source.
   * This commonly occurs during stage transitions in the showcase when videos are
   * being handed off between different components.
   *
   * The scoring algorithm prioritizes videos based on:
   * 1. Document attachment (8 points) - videos in DOM are preferred
   * 2. Ready state (0-4 points) - more loaded videos are preferred
   * 3. Playing state (4 points) - active videos are preferred
   * 4. Visibility (2 points) - visible videos are preferred
   *
   * This ensures the most "ready" video is kept while others are safely cleaned up.
   */
  const deduplicateVideos = (sourcePattern: string): HTMLVideoElement | null => {
    // Find all videos with matching source patterns (including blob URLs)
    const allVideos = Array.from(document.querySelectorAll('video')) as HTMLVideoElement[]
    const videos = allVideos.filter((video) => {
      const src = video.src || video.currentSrc || ''
      return src.includes(sourcePattern) ||
             (src.startsWith('blob:') && video.dataset.originalSrc === sourcePattern)
    })

    if (videos.length <= 1) {
      return videos[0] || null
    }

    // Enhanced scoring algorithm for better deduplication
    const sortedVideos = videos.sort((a, b) => {
      // Priority: in document, higher readyState, not paused, has proper styling
      const scoreA =
        (document.contains(a) ? 16 : 0) +  // Increased weight for DOM attachment
        (a.readyState * 2) +  // Double weight for ready state
        (a.paused ? 0 : 8) +  // Increased weight for playing videos
        (a.style.opacity === '1' ? 2 : 0) +
        (a.style.display !== 'none' ? 2 : 0) +
        (a.offsetParent !== null ? 2 : 0)  // Is visible in layout
      const scoreB =
        (document.contains(b) ? 16 : 0) +
        (b.readyState * 2) +
        (b.paused ? 0 : 8) +
        (b.style.opacity === '1' ? 2 : 0) +
        (b.style.display !== 'none' ? 2 : 0) +
        (b.offsetParent !== null ? 2 : 0)
      return scoreB - scoreA
    })

    const keepVideo = sortedVideos[0]
    const removeVideos = sortedVideos.slice(1)

    // Enhanced cleanup for duplicate videos
    removeVideos.forEach(async (video) => {
      // Pause and wait for any pending operations
      if (!video.paused) {
        try {
          video.pause()
          // Give time for play promises to settle
          await new Promise(resolve => setTimeout(resolve, 50))
        } catch {
          // Silently handle pause errors
        }
      }

      // Clear source immediately to free resources
      const currentSrc = video.currentSrc || video.src
      if (currentSrc && currentSrc.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(currentSrc)
        } catch {
          // Ignore revoke errors
        }
      }

      // Clean up the video element
      cleanupVideo(video).catch(() => {
        // Silently handle cleanup errors
      })

      // Remove from DOM if still present
      if (video.parentNode) {
        try {
          video.parentNode.removeChild(video)
        } catch {
          // Silently handle DOM removal errors
        }
      }
    })

    return keepVideo
  }

  /**
   * Get statistics about managed video resources
   */
  const getStats = (): { managedVideos: number; totalListeners: number } => {
    const totalListeners = Array.from(videoEventListeners.value.values()).reduce(
      (sum, listeners) => sum + listeners.length,
      0,
    )

    return {
      managedVideos: managedVideoElements.value.size,
      totalListeners,
    }
  }

  /**
   * Create a safe video element with automatic registration
   */
  const createManagedVideo = (src?: string, identifier?: string): HTMLVideoElement => {
    const video = document.createElement('video')

    if (src) {
      video.src = src
    }

    // Register for cleanup management
    registerVideo(video, identifier)

    return video
  }

  return {
    // Core methods
    registerVideo,
    addVideoEventListener,
    cleanupVideo,
    cleanupAllVideos,
    addCleanupCallback,
    deduplicateVideos,
    createManagedVideo,

    // Resource management
    enforceResourceLimits,
    getStats,
    validateVideoElement,

    // State (readonly)
    managedVideoCount: () => managedVideoElements.value.size,

    // Constants
    VIDEO_CONFIG,
  }
}
