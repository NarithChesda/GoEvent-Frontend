import { ref } from 'vue'

// Video configuration constants with mobile-specific optimizations
const VIDEO_CONFIG = {
  MAX_MANAGED_VIDEOS: 10,
  MAX_CLEANUP_TIME: 5000, // 5 seconds
  CLEANUP_BATCH_SIZE: 3,
  PAUSE_DELAY: 100, // Increased for mobile browsers
  MOBILE_MAX_VIDEOS: 5, // Lower limit for mobile devices
  MOBILE_CLEANUP_TIMEOUT: 3000, // Faster cleanup on mobile
  BLOB_CLEANUP_DELAY: 200, // Delay before blob URL revocation
  FORCE_GC_THRESHOLD: 3, // Trigger GC after cleaning this many videos
  // Messaging app specific optimizations
  MESSAGING_APP_MAX_VIDEOS: 3, // Even more restrictive for messaging apps
  MESSAGING_APP_CLEANUP_TIMEOUT: 2000, // Faster cleanup for messaging apps (2s)
  MESSAGING_APP_CLEANUP_INTERVAL: 120000, // 2 minutes for messaging apps
  MESSAGING_APP_BLOB_STALE_THRESHOLD: 120000, // 2 minutes stale threshold
} as const

// Messaging app browser detection
const isMessagingAppBrowser = (): boolean => {
  const userAgent = navigator.userAgent || ''

  // Check for various messaging app browsers
  const messagingAppPatterns = [
    /TelegramBot|Telegram/i,
    /WhatsApp/i,
    /FB_IAB|FBAN|FBAV/i, // Facebook in-app browser
    /Line/i,
    /MicroMessenger/i, // WeChat
    /Viber/i,
    /KakaoTalk/i,
    /Snapchat/i,
    /Instagram/i,
    /Twitter/i,
  ]

  return messagingAppPatterns.some(pattern => pattern.test(userAgent))
}

// Mobile detection with enhanced checks
const isMobileDevice = (): boolean => {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (window.screen?.width <= 768 && window.matchMedia('(pointer: coarse)').matches)
}

const isLowMemoryDevice = (): boolean => {
  const deviceMemory = (navigator as any).deviceMemory
  const hardwareConcurrency = navigator.hardwareConcurrency || 4

  return deviceMemory ? deviceMemory <= 4 : hardwareConcurrency <= 2
}

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
  // Enhanced video resource management state with mobile optimizations
  const videoEventListeners = ref<
    Map<HTMLVideoElement, Array<{ event: string; handler: EventListener }>>
  >(new Map())
  const managedVideoElements = ref<Set<HTMLVideoElement>>(new Set())
  const videoCleanupCallbacks = ref<Set<() => void>>(new Set())

  // Enhanced blob URL tracking with memory-conscious cleanup
  const activeBlobUrls = ref<Map<string, { url: string; createdAt: number; videoElement?: WeakRef<HTMLVideoElement> }>>(new Map())
  const pendingCleanupPromises = ref<Set<Promise<void>>>(new Set())

  // Mobile-specific state
  const isMobile = isMobileDevice()
  const isMessagingApp = isMessagingAppBrowser()
  const isLowMemory = isLowMemoryDevice()

  // Determine max videos based on environment (messaging app < mobile < desktop)
  const maxVideos = isMessagingApp
    ? VIDEO_CONFIG.MESSAGING_APP_MAX_VIDEOS
    : isMobile
      ? VIDEO_CONFIG.MOBILE_MAX_VIDEOS
      : VIDEO_CONFIG.MAX_MANAGED_VIDEOS

  // Memory pressure detection
  let lastGCTime = Date.now()
  let cleanupCounter = 0

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
   * Enhanced video registration with mobile-specific resource management
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

    // Mobile-aware resource limits
    if (managedVideoElements.value.size >= maxVideos) {
      enforceResourceLimits()
    }

    managedVideoElements.value.add(video)

    // Enhanced error handling with mobile considerations
    const errorHandler = (event: Event) => {
      const error = (event.target as HTMLVideoElement)?.error
      const errorCode = error?.code

      // Mobile browsers often throw different error types
      if (isMobile && (errorCode === MediaError.MEDIA_ERR_DECODE || errorCode === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED)) {
        // For mobile decode errors, cleanup immediately to free memory
        cleanupVideo(video)
      } else {
        // Standard error handling
        cleanupVideo(video)
      }
    }

    // Mobile-specific event listeners for better resource management
    addVideoEventListener(video, 'error', errorHandler)

    if (isMobile) {
      // Mobile browsers benefit from additional cleanup triggers
      addVideoEventListener(video, 'stalled', () => {
        // If video is stalled for too long on mobile, consider cleanup
        setTimeout(() => {
          if (video.readyState === HTMLMediaElement.HAVE_NOTHING) {
            cleanupVideo(video)
          }
        }, 10000) // 10 second stall timeout
      })

      addVideoEventListener(video, 'suspend', () => {
        // Mobile browsers may suspend videos aggressively
        // Track this for potential cleanup
      })
    }
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
   * Enhanced cleanup with mobile-specific optimizations and memory leak prevention
   */
  const cleanupVideo = (video: HTMLVideoElement | null): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!video) {
        resolve()
        return
      }

      // Create cleanup promise and track it
      const cleanupPromise = (async () => {
        try {
          // 1. Remove all tracked event listeners with enhanced cleanup
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

          // 2. Handle video playback state with mobile-aware pause delay
          if (!video.paused) {
            try {
              video.pause()
              // Longer delay for mobile browsers to settle play promises
              const pauseDelay = isMobile ? VIDEO_CONFIG.PAUSE_DELAY * 2 : VIDEO_CONFIG.PAUSE_DELAY
              await new Promise((resolve) => setTimeout(resolve, pauseDelay))
            } catch (pauseError) {
              // Mobile browsers often throw errors on pause, continue cleanup anyway
            }
          }

          // 3. Enhanced blob URL cleanup with tracking
          const currentSrc = video.currentSrc || video.src
          if (currentSrc && currentSrc.startsWith('blob:')) {
            // Clean up from our blob tracking map
            for (const [key, blobData] of activeBlobUrls.value.entries()) {
              if (blobData.url === currentSrc) {
                // Delay blob URL revocation for mobile stability
                setTimeout(() => {
                  try {
                    URL.revokeObjectURL(blobData.url)
                    activeBlobUrls.value.delete(key)
                  } catch (error) {
                    // Ignore revocation errors but still remove from tracking
                    activeBlobUrls.value.delete(key)
                  }
                }, isMobile ? VIDEO_CONFIG.BLOB_CLEANUP_DELAY : 0)
                break
              }
            }
          }

          // 4. Clear video sources with enhanced mobile handling
          try {
            // On mobile, clearing srcObject first can prevent memory leaks
            if (video.srcObject) {
              video.srcObject = null
            }
            video.removeAttribute('src')
            video.load()

            // Mobile-specific: Force video element reset
            if (isMobile) {
              video.currentTime = 0
              // Clear any cached data
              video.preload = 'none'
            }
          } catch (error) {
            // Continue cleanup even if source clearing fails
          }

          // 5. Remove from managed set
          managedVideoElements.value.delete(video)

          // 6. Mobile memory management: trigger cleanup counter
          cleanupCounter++
          if (isMobile && cleanupCounter >= VIDEO_CONFIG.FORCE_GC_THRESHOLD) {
            requestIdleCallback(() => {
              triggerMemoryCleanup()
              cleanupCounter = 0
            })
          }

        } catch (error) {
          // Ensure video is removed from managed set even if cleanup fails
          managedVideoElements.value.delete(video)
          throw error
        }
      })()

      pendingCleanupPromises.value.add(cleanupPromise)

      // Apply environment-aware timeout (messaging app < mobile < desktop)
      const timeoutMs = isMessagingApp
        ? VIDEO_CONFIG.MESSAGING_APP_CLEANUP_TIMEOUT
        : isMobile
          ? VIDEO_CONFIG.MOBILE_CLEANUP_TIMEOUT
          : VIDEO_CONFIG.MAX_CLEANUP_TIME
      const timeoutId = setTimeout(() => {
        managedVideoElements.value.delete(video)
        pendingCleanupPromises.value.delete(cleanupPromise)
        reject(new Error('Cleanup timeout'))
      }, timeoutMs)

      cleanupPromise
        .then(() => {
          clearTimeout(timeoutId)
          pendingCleanupPromises.value.delete(cleanupPromise)
          resolve()
        })
        .catch((error) => {
          clearTimeout(timeoutId)
          pendingCleanupPromises.value.delete(cleanupPromise)
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
   * Force memory cleanup for mobile browsers
   * Uses more aggressive thresholds for messaging app browsers
   */
  const triggerMemoryCleanup = (): void => {
    // Cleanup stale blob URLs with environment-specific thresholds
    const now = Date.now()
    const staleThreshold = isMessagingApp
      ? VIDEO_CONFIG.MESSAGING_APP_BLOB_STALE_THRESHOLD // 2 minutes for messaging apps
      : 5 * 60 * 1000 // 5 minutes for regular mobile/desktop

    for (const [key, blobData] of activeBlobUrls.value.entries()) {
      if (now - blobData.createdAt > staleThreshold) {
        try {
          URL.revokeObjectURL(blobData.url)
        } catch (error) {
          // Ignore revocation errors
        }
        activeBlobUrls.value.delete(key)
      }
    }

    // Mobile-specific: suggest garbage collection
    if (isMobile && typeof window !== 'undefined') {
      // Request idle callback to avoid blocking UI
      requestIdleCallback(() => {
        try {
          // Force garbage collection if available (Chrome DevTools)
          if ('gc' in window) {
            (window as any).gc()
          }
        } catch (error) {
          // Ignore GC errors
        }
      })
    }

    lastGCTime = now
  }

  /**
   * Enhanced cleanup with mobile optimizations and concurrent handling
   */
  const cleanupAllVideos = async (): Promise<void> => {
    try {
      // Wait for any pending cleanup operations to complete
      if (pendingCleanupPromises.value.size > 0) {
        await Promise.allSettled(Array.from(pendingCleanupPromises.value))
      }

      // Create cleanup promises for all managed videos
      const cleanupPromises = Array.from(managedVideoElements.value).map(video =>
        cleanupVideo(video).catch(error => {
          // Log mobile-specific cleanup issues
          if (isMobile) {
            console.warn('Mobile video cleanup failed:', error)
          }
        })
      )

      // Execute cleanup in batches to avoid overwhelming mobile browsers
      if (isMobile && cleanupPromises.length > VIDEO_CONFIG.CLEANUP_BATCH_SIZE) {
        for (let i = 0; i < cleanupPromises.length; i += VIDEO_CONFIG.CLEANUP_BATCH_SIZE) {
          const batch = cleanupPromises.slice(i, i + VIDEO_CONFIG.CLEANUP_BATCH_SIZE)
          await Promise.allSettled(batch)
          // Small delay between batches for mobile stability
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } else {
        await Promise.allSettled(cleanupPromises)
      }

      // Execute custom cleanup callbacks
      const callbackPromises = Array.from(videoCleanupCallbacks.value).map(callback =>
        new Promise<void>(resolve => {
          try {
            callback()
            resolve()
          } catch (error) {
            // Silently handle callback errors but still resolve
            resolve()
          }
        })
      )
      await Promise.allSettled(callbackPromises)

      // Clear all tracking
      videoEventListeners.value.clear()
      managedVideoElements.value.clear()
      videoCleanupCallbacks.value.clear()

      // Final cleanup of blob URLs and memory
      activeBlobUrls.value.forEach((blobData, key) => {
        try {
          URL.revokeObjectURL(blobData.url)
        } catch (error) {
          // Ignore revocation errors
        }
        activeBlobUrls.value.delete(key)
      })
      activeBlobUrls.value.clear()

      // Clear pending promises
      pendingCleanupPromises.value.clear()

      // Trigger final memory cleanup for mobile
      if (isMobile) {
        triggerMemoryCleanup()
      }

    } catch (error) {
      console.warn('Error during complete video cleanup:', error)
      // Ensure state is cleared even if cleanup fails
      videoEventListeners.value.clear()
      managedVideoElements.value.clear()
      videoCleanupCallbacks.value.clear()
      activeBlobUrls.value.clear()
      pendingCleanupPromises.value.clear()
    }
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
   * Register a blob URL for cleanup tracking
   */
  const registerBlobUrl = (originalUrl: string, blobUrl: string, video?: HTMLVideoElement): void => {
    activeBlobUrls.value.set(originalUrl, {
      url: blobUrl,
      createdAt: Date.now(),
      videoElement: video ? new WeakRef(video) : undefined
    })
  }

  /**
   * Create a safe video element with automatic registration and mobile optimizations
   */
  const createManagedVideo = (src?: string, identifier?: string): HTMLVideoElement => {
    const video = document.createElement('video')

    // Mobile-specific optimizations
    if (isMobile) {
      video.playsInline = true
      video.preload = 'none' // Start with no preload on mobile
      video.muted = true // Mobile requires muted for autoplay
    }

    if (src) {
      video.src = src

      // If it's a blob URL, register it for cleanup
      if (src.startsWith('blob:')) {
        registerBlobUrl(src, src, video)
      }
    }

    // Register for cleanup management
    registerVideo(video, identifier)

    return video
  }

  /**
   * Get memory usage statistics
   */
  const getMemoryStats = () => {
    return {
      managedVideos: managedVideoElements.value.size,
      activeBlobUrls: activeBlobUrls.value.size,
      pendingCleanups: pendingCleanupPromises.value.size,
      totalListeners: Array.from(videoEventListeners.value.values()).reduce(
        (sum, listeners) => sum + listeners.length, 0
      ),
      isMobileDevice: isMobile,
      isMessagingAppBrowser: isMessagingApp,
      isLowMemoryDevice: isLowMemory,
      maxVideoLimit: maxVideos,
      lastGCTime: new Date(lastGCTime).toISOString()
    }
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

    // Enhanced blob URL management
    registerBlobUrl,
    triggerMemoryCleanup,

    // Resource management
    enforceResourceLimits,
    getStats,
    validateVideoElement,
    getMemoryStats,

    // State (readonly)
    managedVideoCount: () => managedVideoElements.value.size,
    activeBlobCount: () => activeBlobUrls.value.size,
    pendingCleanupCount: () => pendingCleanupPromises.value.size,

    // Device capabilities
    isMobileDevice: () => isMobile,
    isMessagingAppBrowser: () => isMessagingApp,
    isLowMemoryDevice: () => isLowMemory,
    maxVideoLimit: () => maxVideos,

    // Constants
    VIDEO_CONFIG,
  }
}
