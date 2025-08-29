import { ref, computed, onUnmounted, readonly } from 'vue'
import type { EventData, EventPhoto, Host, AgendaItem } from './useEventShowcase'
import type { EventPaymentMethod } from '../services/api'

/**
 * Priority levels for content preloading
 * Higher priority = loaded first
 */
export enum PreloadPriority {
  CRITICAL = 1,    // Essential content like event video, background video
  HIGH = 2,        // Music (audio plays during showcase)
  MEDIUM_HIGH = 3, // Logos (visual branding elements)
  MEDIUM = 4,      // Photos, hosts, secondary content
  LOW = 5          // Optional content like payment methods, agenda icons
}

/**
 * Preloadable content types
 */
export interface PreloadableContent {
  id: string
  type: 'image' | 'video' | 'audio' | 'font' | 'api'
  url: string
  priority: PreloadPriority
  metadata?: Record<string, any>
}

/**
 * Preload task result
 */
export interface PreloadResult {
  id: string
  success: boolean
  error?: Error
  loadTime: number
  cached?: boolean
}

/**
 * Preload progress information
 */
export interface PreloadProgress {
  total: number
  completed: number
  failed: number
  percentage: number
  currentPriority: PreloadPriority | null
}

/**
 * Configuration for the preloader
 */
export interface PreloaderConfig {
  maxConcurrentLoads: number
  timeoutMs: number
  retryAttempts: number
  enableCache: boolean
  respectUserPreferences: boolean
}

/**
 * Background preloader composable for event showcase content
 * Provides intelligent preloading with priority-based loading strategies
 */
export function useBackgroundPreloader() {
  // State
  const isPreloading = ref(false)
  const preloadProgress = ref<PreloadProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    percentage: 0,
    currentPriority: null
  })
  
  const preloadResults = ref<Map<string, PreloadResult>>(new Map())
  const activeRequests = ref<Map<string, AbortController>>(new Map())
  const contentQueue = ref<PreloadableContent[]>([])
  const preloadCache = ref<Map<string, any>>(new Map())
  
  // Configuration with sensible defaults
  const config = ref<PreloaderConfig>({
    maxConcurrentLoads: 4,
    timeoutMs: 15000,
    retryAttempts: 2,
    enableCache: true,
    respectUserPreferences: true
  })

  // Check if user prefers reduced data usage
  const respectDataUsage = computed(() => {
    if (!config.value.respectUserPreferences) return false
    
    // Check connection type if available
    const connection = (navigator as any).connection
    if (connection) {
      // Skip preloading on slow connections
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        return true
      }
      // Reduce preloading on limited data plans
      if (connection.saveData) {
        return true
      }
    }
    
    // Check if user prefers reduced motion (might indicate performance concerns)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return true
    }
    
    return false
  })

  // Computed properties
  const isComplete = computed(() => 
    preloadProgress.value.total > 0 && 
    preloadProgress.value.completed + preloadProgress.value.failed === preloadProgress.value.total
  )

  const successfulLoads = computed(() => preloadProgress.value.completed)
  const failedLoads = computed(() => preloadProgress.value.failed)

  /**
   * Generate preloadable content from event data
   */
  const generatePreloadContent = (event: EventData, getMediaUrl: (url: string) => string): PreloadableContent[] => {
    const content: PreloadableContent[] = []

    // Critical priority - Event video and main background
    if (event.event_video) {
      content.push({
        id: `event-video-${event.id}`,
        type: 'video',
        url: getMediaUrl(event.event_video),
        priority: PreloadPriority.CRITICAL,
        metadata: { type: 'event_video' }
      })
    }

    // Template background video
    if (event.template_assets?.assets?.standard_background_video) {
      content.push({
        id: `bg-video-${event.id}`,
        type: 'video',
        url: getMediaUrl(event.template_assets.assets.standard_background_video),
        priority: PreloadPriority.CRITICAL,
        metadata: { type: 'background_video' }
      })
    }

    // High priority - Event photos (first few)
    const photos = event.photos || event.event_photos || []
    const priorityPhotos = photos.slice(0, 6) // First 6 photos
    priorityPhotos.forEach((photo: EventPhoto, index: number) => {
      content.push({
        id: `photo-${photo.id}`,
        type: 'image',
        url: getMediaUrl(photo.image),
        priority: index < 3 ? PreloadPriority.MEDIUM : PreloadPriority.MEDIUM,
        metadata: { type: 'event_photo', order: photo.order }
      })
    })

    // Medium priority - Host profile images
    const hosts = event.hosts || []
    hosts.forEach((host: Host) => {
      if (host.profile_image) {
        content.push({
          id: `host-${host.id}`,
          type: 'image',
          url: getMediaUrl(host.profile_image),
          priority: PreloadPriority.MEDIUM,
          metadata: { type: 'host_image' }
        })
      }
    })

    // Medium priority - Remaining photos
    const remainingPhotos = photos.slice(6)
    remainingPhotos.forEach((photo: EventPhoto) => {
      content.push({
        id: `photo-${photo.id}`,
        type: 'image',
        url: getMediaUrl(photo.image),
        priority: PreloadPriority.MEDIUM,
        metadata: { type: 'event_photo', order: photo.order }
      })
    })

    // Medium-High priority - Event logos (visual branding elements)
    if (event.logo_one) {
      content.push({
        id: `logo-one-${event.id}`,
        type: 'image',
        url: getMediaUrl(event.logo_one),
        priority: PreloadPriority.MEDIUM_HIGH,
        metadata: { type: 'logo' }
      })
    }

    if (event.logo_two) {
      content.push({
        id: `logo-two-${event.id}`,
        type: 'image',
        url: getMediaUrl(event.logo_two),
        priority: PreloadPriority.MEDIUM_HIGH,
        metadata: { type: 'logo' }
      })
    }

    if (event.banner_image) {
      content.push({
        id: `banner-${event.id}`,
        type: 'image',
        url: getMediaUrl(event.banner_image),
        priority: PreloadPriority.MEDIUM,
        metadata: { type: 'banner' }
      })
    }

    // High priority - Event music (plays during showcase)
    if (event.music) {
      content.push({
        id: `music-${event.id}`,
        type: 'audio',
        url: getMediaUrl(event.music),
        priority: PreloadPriority.HIGH,
        metadata: { type: 'music' }
      })
    }

    // Low priority - Agenda item icons
    const agendaItems = event.agenda_items || []
    agendaItems.forEach((item: AgendaItem) => {
      // Agenda icons are typically SVG and small, but still preload for smoother experience
      if (item.icon?.svg_code) {
        // SVG content would be handled differently - this is just a placeholder
        content.push({
          id: `agenda-icon-${item.id}`,
          type: 'image',
          url: `data:image/svg+xml,${encodeURIComponent(item.icon.svg_code)}`,
          priority: PreloadPriority.LOW,
          metadata: { type: 'agenda_icon' }
        })
      }
    })

    return content
  }

  /**
   * Preload a single piece of content
   */
  const preloadContent = async (content: PreloadableContent): Promise<PreloadResult> => {
    const startTime = performance.now()
    
    // Check cache first
    if (config.value.enableCache && preloadCache.value.has(content.url)) {
      return {
        id: content.id,
        success: true,
        loadTime: 0,
        cached: true
      }
    }

    const abortController = new AbortController()
    activeRequests.value.set(content.id, abortController)

    try {
      let result: any

      switch (content.type) {
        case 'image':
          result = await preloadImage(content.url, abortController.signal)
          break
        case 'video':
          result = await preloadVideo(content.url, abortController.signal)
          break
        case 'audio':
          result = await preloadAudio(content.url, abortController.signal)
          break
        case 'font':
          result = await preloadFont(content.url, abortController.signal)
          break
        default:
          throw new Error(`Unsupported content type: ${content.type}`)
      }

      // Cache the result
      if (config.value.enableCache) {
        preloadCache.value.set(content.url, result)
      }

      const loadTime = performance.now() - startTime
      return {
        id: content.id,
        success: true,
        loadTime
      }

    } catch (error: any) {
      const loadTime = performance.now() - startTime
      return {
        id: content.id,
        success: false,
        error: error as Error,
        loadTime
      }
    } finally {
      activeRequests.value.delete(content.id)
    }
  }

  /**
   * Preload an image
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
        reject(new Error('Preload aborted'))
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

      // Set timeout
      setTimeout(() => {
        if (!signal.aborted) {
          cleanup()
          reject(new Error(`Image load timeout: ${url}`))
        }
      }, config.value.timeoutMs)

      img.src = url
    })
  }

  /**
   * Preload a video
   */
  const preloadVideo = (url: string, signal: AbortSignal): Promise<HTMLVideoElement> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata' // Only load metadata, not full video
      video.muted = true

      const cleanup = () => {
        video.onloadedmetadata = null
        video.onerror = null
        signal.removeEventListener('abort', onAbort)
      }

      const onAbort = () => {
        cleanup()
        reject(new Error('Video preload aborted'))
      }

      video.onloadedmetadata = () => {
        cleanup()
        resolve(video)
      }

      video.onerror = () => {
        cleanup()
        reject(new Error(`Failed to load video metadata: ${url}`))
      }

      signal.addEventListener('abort', onAbort)

      // Set timeout
      setTimeout(() => {
        if (!signal.aborted) {
          cleanup()
          reject(new Error(`Video load timeout: ${url}`))
        }
      }, config.value.timeoutMs)

      video.src = url
    })
  }

  /**
   * Preload an audio file
   */
  const preloadAudio = (url: string, signal: AbortSignal): Promise<HTMLAudioElement> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio()
      audio.preload = 'metadata'

      const cleanup = () => {
        audio.onloadedmetadata = null
        audio.onerror = null
        signal.removeEventListener('abort', onAbort)
      }

      const onAbort = () => {
        cleanup()
        reject(new Error('Audio preload aborted'))
      }

      audio.onloadedmetadata = () => {
        cleanup()
        resolve(audio)
      }

      audio.onerror = () => {
        cleanup()
        reject(new Error(`Failed to load audio: ${url}`))
      }

      signal.addEventListener('abort', onAbort)

      // Set timeout
      setTimeout(() => {
        if (!signal.aborted) {
          cleanup()
          reject(new Error(`Audio load timeout: ${url}`))
        }
      }, config.value.timeoutMs)

      audio.src = url
    })
  }

  /**
   * Preload a font
   */
  const preloadFont = (url: string, signal: AbortSignal): Promise<FontFace> => {
    return new Promise((resolve, reject) => {
      const fontName = `preload-font-${Date.now()}`
      const fontFace = new FontFace(fontName, `url(${url})`)

      const onAbort = () => {
        reject(new Error('Font preload aborted'))
      }

      signal.addEventListener('abort', onAbort)

      // Set timeout
      const timeout = setTimeout(() => {
        if (!signal.aborted) {
          signal.removeEventListener('abort', onAbort)
          reject(new Error(`Font load timeout: ${url}`))
        }
      }, config.value.timeoutMs)

      fontFace.load()
        .then(() => {
          clearTimeout(timeout)
          signal.removeEventListener('abort', onAbort)
          resolve(fontFace)
        })
        .catch((error) => {
          clearTimeout(timeout)
          signal.removeEventListener('abort', onAbort)
          reject(error)
        })
    })
  }

  /**
   * Start background preloading
   */
  const startPreloading = async (event: EventData, getMediaUrl: (url: string) => string) => {
    // Skip if user prefers reduced data usage
    if (respectDataUsage.value) {
      console.log('⚡ Skipping preloading due to user preferences or connection constraints')
      return
    }

    if (isPreloading.value) {
      console.log('⚡ Preloading already in progress')
      return
    }

    console.log('⚡ Starting background preloading...')
    
    isPreloading.value = true
    preloadResults.value.clear()

    // Generate content to preload
    const content = generatePreloadContent(event, getMediaUrl)
    
    if (content.length === 0) {
      console.log('⚡ No content to preload')
      isPreloading.value = false
      return
    }

    // Sort by priority (lower number = higher priority)
    content.sort((a, b) => a.priority - b.priority)
    contentQueue.value = content

    // Initialize progress
    preloadProgress.value = {
      total: content.length,
      completed: 0,
      failed: 0,
      percentage: 0,
      currentPriority: null
    }

    console.log(`⚡ Queued ${content.length} items for preloading`)

    // Process queue with concurrency control
    await processPreloadQueue()

    isPreloading.value = false
    console.log(`⚡ Preloading complete: ${preloadProgress.value.completed} successful, ${preloadProgress.value.failed} failed`)
  }

  /**
   * Process the preload queue with concurrency control
   */
  const processPreloadQueue = async () => {
    const running = new Set<Promise<PreloadResult>>()

    while (contentQueue.value.length > 0 || running.size > 0) {
      // Start new tasks up to concurrency limit
      while (contentQueue.value.length > 0 && running.size < config.value.maxConcurrentLoads) {
        const content = contentQueue.value.shift()!
        preloadProgress.value.currentPriority = content.priority

        const task = preloadContent(content).then(result => {
          preloadResults.value.set(result.id, result)
          
          if (result.success) {
            preloadProgress.value.completed++
          } else {
            preloadProgress.value.failed++
            console.warn(`⚡ Failed to preload ${content.type}: ${content.url}`, result.error)
          }
          
          preloadProgress.value.percentage = Math.round(
            ((preloadProgress.value.completed + preloadProgress.value.failed) / preloadProgress.value.total) * 100
          )

          return result
        })

        running.add(task)
        task.finally(() => running.delete(task))
      }

      // Wait for at least one task to complete
      if (running.size > 0) {
        await Promise.race(running)
      }
    }

    preloadProgress.value.currentPriority = null
  }

  /**
   * Cancel all active preloading
   */
  const cancelPreloading = () => {
    console.log('⚡ Cancelling background preloading')
    
    // Abort all active requests
    activeRequests.value.forEach((controller) => {
      controller.abort()
    })
    
    activeRequests.value.clear()
    contentQueue.value = []
    isPreloading.value = false
  }

  /**
   * Clear preload cache
   */
  const clearCache = () => {
    preloadCache.value.clear()
    console.log('⚡ Preload cache cleared')
  }

  /**
   * Update preloader configuration
   */
  const updateConfig = (newConfig: Partial<PreloaderConfig>) => {
    config.value = { ...config.value, ...newConfig }
  }

  /**
   * Check if specific content is preloaded
   */
  const isContentPreloaded = (url: string): boolean => {
    return preloadCache.value.has(url)
  }

  /**
   * Get preload statistics
   */
  const getStats = () => {
    const results = Array.from(preloadResults.value.values())
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    
    return {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      averageLoadTime: successful.length > 0 
        ? successful.reduce((sum, r) => sum + r.loadTime, 0) / successful.length 
        : 0,
      cacheHits: results.filter(r => r.cached).length,
      errors: failed.map(r => ({ id: r.id, error: r.error?.message }))
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    cancelPreloading()
    clearCache()
  })

  return {
    // State
    isPreloading: readonly(isPreloading),
    preloadProgress: readonly(preloadProgress),
    isComplete: readonly(isComplete),
    successfulLoads: readonly(successfulLoads),
    failedLoads: readonly(failedLoads),
    respectDataUsage: readonly(respectDataUsage),

    // Methods
    startPreloading,
    cancelPreloading,
    clearCache,
    updateConfig,
    isContentPreloaded,
    getStats,

    // Types for external use
    PreloadPriority
  }
}