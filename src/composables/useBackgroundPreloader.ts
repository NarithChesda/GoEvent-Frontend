import { ref, computed, onUnmounted, readonly } from 'vue'
import type { EventData, EventPhoto, Host, AgendaItem } from './useEventShowcase'
import { sanitizeHtml, containsSuspiciousContent } from '../utils/sanitize'

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
  type: 'image' | 'video' | 'audio' | 'font' | 'svg' | 'api'
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
  
  // Stage-specific progress tracking - initialize with proper defaults
  // Use total: 0 initially to indicate no work assigned yet
  const stage2Progress = ref({ completed: 0, total: 0, percentage: 100 })
  const stage3Progress = ref({ completed: 0, total: 0, percentage: 100 })
  
  // Fallback timing tracking for button readiness
  const stage2StartTime = ref<Map<string, number>>(new Map())
  const FALLBACK_TIMEOUT_MS = 15000 // 15 seconds fallback timeout
  
  const preloadResults = ref<Map<string, PreloadResult>>(new Map())
  const activeRequests = ref<Map<string, AbortController>>(new Map())
  const contentQueue = ref<PreloadableContent[]>([])
  // Cache with LRU eviction strategy and size limits
  const preloadCache = ref<Map<string, any>>(new Map())
  const cacheAccessOrder = ref<string[]>([]) // Track access order for LRU
  const maxCacheSize = ref(50) // Maximum number of cached items
  const maxCacheMemory = ref(100 * 1024 * 1024) // 100MB memory limit
  let currentCacheMemory = 0
  
  // Video memory management
  const videoCacheCleanupCallbacks = ref<Map<string, () => void>>(new Map())
  
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
    
    // Safely check connection type if available
    const connection = getNetworkConnection()
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
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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

    // Skip agenda icons - let them load naturally on main content page

    return content
  }

  /**
   * Preload a single piece of content
   */
  const preloadContent = async (content: PreloadableContent): Promise<PreloadResult> => {
    const startTime = performance.now()
    
    // Check cache first
    if (config.value.enableCache && preloadCache.value.has(content.url)) {
      // Update cache access order for LRU
      updateCacheAccess(content.url)
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
          if (result instanceof HTMLVideoElement) {
            // Set up memory cleanup callback for video
            const cleanupCallback = createVideoMemoryCleanup(result, content.url)
            videoCacheCleanupCallbacks.value.set(content.id, cleanupCallback)
          }
          break
        case 'audio':
          result = await preloadAudio(content.url, abortController.signal)
          break
        case 'font':
          result = await preloadFont(content.url, abortController.signal)
          break
        case 'svg':
          result = await preloadSvg(content.url, abortController.signal)
          break
        default:
          throw new Error(`Unsupported content type: ${content.type}`)
      }

      // Cache the result with memory management
      if (config.value.enableCache) {
        setCacheItem(content.url, result)
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

      img.onerror = (event) => {
        cleanup()
        console.warn(`Image preload failed for: ${url}`, event)
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
   * Preload an SVG using a specialized approach
   * SVGs are better handled via fetch or DOM insertion rather than Image element
   */
  const preloadSvg = (url: string, signal: AbortSignal): Promise<string> => {
    return new Promise((resolve, reject) => {
      // For data URLs, we can validate and resolve immediately
      if (url.startsWith('data:image/svg+xml')) {
        try {
          // Test if the data URL is valid by creating a temporary image
          const img = new Image()
          
          const cleanup = () => {
            img.onload = null
            img.onerror = null
            signal.removeEventListener('abort', onAbort)
          }

          const onAbort = () => {
            cleanup()
            reject(new Error('SVG preload aborted'))
          }

          img.onload = () => {
            cleanup()
            // SVG loaded successfully, resolve with the URL for caching
            resolve(url)
          }

          img.onerror = () => {
            cleanup()
            // If image fails, try alternative SVG preloading method
            console.warn(`SVG data URL failed to load as image, trying alternative method: ${url.substring(0, 100)}...`)
            
            // Try to validate SVG by parsing the data URL
            try {
              const svgContent = decodeURIComponent(url.replace('data:image/svg+xml,', ''))
              if (svgContent.includes('<svg') && svgContent.includes('</svg>')) {
                resolve(url) // SVG content looks valid
              } else {
                reject(new Error(`Invalid SVG content in data URL`))
              }
            } catch (parseError) {
              reject(new Error(`Failed to parse SVG data URL: ${parseError}`))
            }
          }

          signal.addEventListener('abort', onAbort)

          // Set timeout
          setTimeout(() => {
            if (!signal.aborted) {
              cleanup()
              reject(new Error(`SVG load timeout: ${url.substring(0, 50)}...`))
            }
          }, config.value.timeoutMs)

          img.src = url
          
        } catch (error) {
          reject(new Error(`Failed to preload SVG data URL: ${error}`))
        }
      } else {
        // For external SVG URLs, use fetch
        fetch(url, { signal })
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }
            return response.text()
          })
          .then(svgContent => {
            // Basic SVG content validation
            if (svgContent.includes('<svg') && svgContent.includes('</svg>')) {
              resolve(svgContent)
            } else {
              throw new Error('Invalid SVG content received')
            }
          })
          .catch(error => {
            if (error.name === 'AbortError') {
              reject(new Error('SVG preload aborted'))
            } else {
              reject(new Error(`Failed to fetch SVG: ${error.message}`))
            }
          })
      }
    })
  }

  /**
   * Preload a video with progressive loading strategy - resolves when video has enough data to start playing
   */
  const preloadVideo = (url: string, signal: AbortSignal): Promise<HTMLVideoElement> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata' // Start with metadata, then upgrade to auto
      video.muted = true

      // Resource cleanup tracker
      const videoResources = {
        video,
        timeoutId: null as NodeJS.Timeout | null,
        progressiveTimeoutId: null as NodeJS.Timeout | null,
        isAborted: false,
        hasResolved: false
      }

      const cleanup = () => {
        if (videoResources.timeoutId) {
          clearTimeout(videoResources.timeoutId)
        }
        if (videoResources.progressiveTimeoutId) {
          clearTimeout(videoResources.progressiveTimeoutId)
        }
        
        // Clean up video element event listeners
        video.oncanplaythrough = null
        video.oncanplay = null
        video.onloadedmetadata = null
        video.onerror = null
        video.onabort = null
        video.onstalled = null
        video.onwaiting = null
        video.onprogress = null
        
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

      const resolveIfNotDone = (reason: string) => {
        if (!videoResources.hasResolved && !videoResources.isAborted) {
          videoResources.hasResolved = true
          console.log(`📺 Video resolved: ${reason} for ${url}`)
          cleanup()
          resolve(video)
        }
      }

      // PROGRESSIVE LOADING: Resolve when video can start playing (not necessarily fully loaded)
      video.oncanplay = () => {
        resolveIfNotDone('HAVE_ENOUGH_DATA (canplay)')
      }

      // Backup: If full preload completes quickly, use that
      video.oncanplaythrough = () => {
        resolveIfNotDone('HAVE_ENOUGH_DATA (canplaythrough)')
      }

      // Progressive loading: When metadata loads, switch to auto preload
      video.onloadedmetadata = () => {
        console.log(`📺 Video metadata loaded for ${url}, switching to progressive loading...`)
        // Switch to auto preload for better buffering
        video.preload = 'auto'
        
        // Set progressive timeout - resolve with metadata if taking too long
        videoResources.progressiveTimeoutId = setTimeout(() => {
          if (!videoResources.hasResolved && video.readyState >= video.HAVE_METADATA) {
            resolveIfNotDone('metadata fallback after progressive timeout')
          }
        }, 8000) // 8 second progressive timeout
      }

      video.onerror = () => {
        cleanup()
        reject(new Error(`Failed to load video: ${url}`))
      }

      signal.addEventListener('abort', onAbort)

      // Main timeout - much shorter now since we use progressive loading
      videoResources.timeoutId = setTimeout(() => {
        if (!signal.aborted && !videoResources.hasResolved) {
          cleanup()
          // Final fallback: if we have any usable data, resolve; otherwise reject
          if (video.readyState >= video.HAVE_METADATA) {
            console.log(`📺 Video ${url} main timeout but has metadata, resolving anyway`)
            resolve(video)
          } else {
            videoResources.isAborted = true
            reject(new Error(`Video load timeout: ${url}`))
          }
        }
      }, config.value.timeoutMs) // Normal timeout, not doubled

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
   * Preload a font with security validation and concurrency control
   */
  const preloadFont = (url: string, signal: AbortSignal): Promise<FontFace> => {
    return new Promise(async (resolve, reject) => {
      // Validate font URL for security
      if (!isValidFontUrl(url)) {
        reject(new Error(`Invalid or unsafe font URL: ${url}`))
        return
      }

      // Wait for available font loading slot
      while (activeFontLoads.value >= maxConcurrentFonts) {
        await new Promise(resolve => setTimeout(resolve, 100))
        if (signal.aborted) {
          reject(new Error('Font preload aborted while waiting for slot'))
          return
        }
      }

      activeFontLoads.value++

      const fontName = `preload-font-${Date.now()}`
      const fontFace = new FontFace(fontName, `url(${url})`)

      const cleanup = () => {
        activeFontLoads.value = Math.max(0, activeFontLoads.value - 1)
        signal.removeEventListener('abort', onAbort)
      }

      const onAbort = () => {
        cleanup()
        reject(new Error('Font preload aborted'))
      }

      signal.addEventListener('abort', onAbort)

      // Set timeout
      const timeout = setTimeout(() => {
        if (!signal.aborted) {
          cleanup()
          reject(new Error(`Font load timeout: ${url}`))
        }
      }, config.value.timeoutMs)

      fontFace.load()
        .then(() => {
          clearTimeout(timeout)
          cleanup()
          resolve(fontFace)
        })
        .catch((error) => {
          clearTimeout(timeout)
          cleanup()
          reject(error)
        })
    })
  }

  /**
   * Start Stage 2 preloading (Event video and music)
   */
  const startStage2Preloading = async (event: EventData, getMediaUrl: (url: string) => string) => {
    // Record start time for fallback timeout calculation
    stage2StartTime.value.set(event.id, Date.now())
    
    // Skip if user prefers reduced data usage
    if (respectDataUsage.value) {
      console.log('⚡ Stage 2: Skipping preloading due to user preferences or connection constraints')
      // Mark as completed even if skipped to prevent loading state
      stage2Progress.value = { completed: 1, total: 1, percentage: 100 }
      return
    }

    console.log('⚡ Stage 2: Starting preloading for event video and music...')
    
    const stage2Content: PreloadableContent[] = []

    // Critical priority - Event video (must be fully preloaded for immediate playback)
    if (event.event_video) {
      stage2Content.push({
        id: `event-video-${event.id}`,
        type: 'video',
        url: getMediaUrl(event.event_video),
        priority: PreloadPriority.CRITICAL,
        metadata: { type: 'event_video', stage: 2 }
      })
    }

    // High priority - Event music (plays alongside video)
    if (event.music) {
      stage2Content.push({
        id: `music-${event.id}`,
        type: 'audio',
        url: getMediaUrl(event.music),
        priority: PreloadPriority.HIGH,
        metadata: { type: 'music', stage: 2 }
      })
    }

    if (stage2Content.length === 0) {
      console.log('⚡ Stage 2: No content to preload, marking as ready')
      // No content to preload = 100% complete
      stage2Progress.value = { completed: 0, total: 0, percentage: 100 }
      return
    }

    // Process Stage 2 content with concurrency control
    await processStageContent(stage2Content, 2)
  }

  /**
   * Start Stage 3 preloading (Background video and photos)
   */
  const startStage3Preloading = async (event: EventData, getMediaUrl: (url: string) => string) => {
    // Skip if user prefers reduced data usage
    if (respectDataUsage.value) {
      console.log('⚡ Stage 3: Skipping preloading due to user preferences or connection constraints')
      return
    }

    console.log('⚡ Stage 3: Starting preloading for background video and photos...')
    
    const stage3Content: PreloadableContent[] = []

    // Critical priority - Template background video
    if (event.template_assets?.assets?.standard_background_video) {
      stage3Content.push({
        id: `bg-video-${event.id}`,
        type: 'video',
        url: getMediaUrl(event.template_assets.assets.standard_background_video),
        priority: PreloadPriority.CRITICAL,
        metadata: { type: 'background_video', stage: 3 }
      })
    }

    // High priority - First few event photos
    const photos = event.photos || event.event_photos || []
    const priorityPhotos = photos.slice(0, 6)
    priorityPhotos.forEach((photo: EventPhoto, index: number) => {
      stage3Content.push({
        id: `photo-${photo.id}`,
        type: 'image',
        url: getMediaUrl(photo.image),
        priority: index < 3 ? PreloadPriority.HIGH : PreloadPriority.MEDIUM,
        metadata: { type: 'event_photo', order: photo.order, stage: 3 }
      })
    })

    // Medium priority - Event logos
    if (event.logo_one) {
      stage3Content.push({
        id: `logo-one-${event.id}`,
        type: 'image',
        url: getMediaUrl(event.logo_one),
        priority: PreloadPriority.MEDIUM_HIGH,
        metadata: { type: 'logo', stage: 3 }
      })
    }

    if (event.logo_two) {
      stage3Content.push({
        id: `logo-two-${event.id}`,
        type: 'image',
        url: getMediaUrl(event.logo_two),
        priority: PreloadPriority.MEDIUM_HIGH,
        metadata: { type: 'logo', stage: 3 }
      })
    }

    if (stage3Content.length === 0) {
      console.log('⚡ Stage 3: No content to preload, marking as ready')
      // No content to preload = 100% complete
      stage3Progress.value = { completed: 0, total: 0, percentage: 100 }
      return
    }

    // Process Stage 3 content with concurrency control
    await processStageContent(stage3Content, 3)
  }

  /**
   * Start background preloading (backwards compatibility - now triggers Stage 2)
   */
  const startPreloading = async (event: EventData, getMediaUrl: (url: string) => string) => {
    console.log('⚡ Starting sequential preloading: Stage 2 first...')
    await startStage2Preloading(event, getMediaUrl)
  }

  /**
   * Process stage-specific content with concurrency control and progress tracking
   */
  const processStageContent = async (stageContent: PreloadableContent[], stageNumber: number) => {
    if (stageContent.length === 0) return

    // Sort by priority (lower number = higher priority)
    stageContent.sort((a, b) => a.priority - b.priority)

    // Initialize stage progress - handle empty content gracefully
    const stageProgressRef = stageNumber === 2 ? stage2Progress : stage3Progress
    if (stageContent.length === 0) {
      stageProgressRef.value = { completed: 0, total: 0, percentage: 100 }
      console.log(`⚡ Stage ${stageNumber}: No content to process, marking as complete`)
      return
    }
    
    stageProgressRef.value = { completed: 0, total: stageContent.length, percentage: 0 }

    console.log(`⚡ Stage ${stageNumber}: Processing ${stageContent.length} items...`)
    console.log(`⚡ Stage ${stageNumber}: Initial progress:`, stageProgressRef.value)
    
    const running = new Set<Promise<PreloadResult>>()
    let processed = 0

    for (const content of stageContent) {
      // Wait if we're at max concurrency
      while (running.size >= config.value.maxConcurrentLoads) {
        await Promise.race(running)
      }

      const task = preloadContent(content).then(result => {
        preloadResults.value.set(result.id, result)
        processed++
        
        // Update stage progress with proper calculation
        const newPercentage = stageContent.length > 0 ? Math.round((processed / stageContent.length) * 100) : 100
        stageProgressRef.value.completed = processed
        stageProgressRef.value.percentage = newPercentage
        
        console.log(`⚡ Stage ${stageNumber}: Progress update: ${processed}/${stageContent.length} (${newPercentage}%)`)
        
        if (result.success) {
          console.log(`✅ Stage ${stageNumber}: Preloaded ${content.type} ${content.id} (${processed}/${stageContent.length})`)
        } else {
          console.warn(`❌ Stage ${stageNumber}: Failed to preload ${content.type} ${content.id}`, result.error)
        }

        return result
      }).finally(() => {
        running.delete(task)
      })

      running.add(task)
    }

    // Wait for all tasks to complete
    await Promise.all(running)
    console.log(`⚡ Stage ${stageNumber}: Completed ${processed} items with final progress:`, stageProgressRef.value)
  }

  /**
   * Process the preload queue with concurrency control (backwards compatibility)
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
   * Creates a memory cleanup callback for video elements
   */
  const createVideoMemoryCleanup = (video: HTMLVideoElement, url: string) => {
    return () => {
      try {
        // Clear video source and data to free memory
        video.src = ''
        video.load() // Reset video element state
        console.log(`🛡️ Video memory cleanup completed for: ${url}`)
      } catch (error) {
        console.warn(`⚠️ Video cleanup warning for ${url}:`, error)
      }
    }
  }

  /**
   * Clear video cache memory after playback starts
   */
  const clearVideoCache = (eventId: string) => {
    const videoContentId = `event-video-${eventId}`
    const bgVideoContentId = `bg-video-${eventId}`
    
    // Execute cleanup callbacks
    const videoCleanup = videoCacheCleanupCallbacks.value.get(videoContentId)
    const bgVideoCleanup = videoCacheCleanupCallbacks.value.get(bgVideoContentId)
    
    if (videoCleanup) {
      videoCleanup()
      videoCacheCleanupCallbacks.value.delete(videoContentId)
    }
    
    if (bgVideoCleanup) {
      bgVideoCleanup()
      videoCacheCleanupCallbacks.value.delete(bgVideoContentId)
    }
    
    console.log(`🛡️ Video cache cleared for event: ${eventId}`)
  }

  /**
   * Clear preload cache with proper memory cleanup
   */
  const clearCache = () => {
    // Execute all video cleanup callbacks
    videoCacheCleanupCallbacks.value.forEach((cleanup, id) => {
      try {
        cleanup()
      } catch (error) {
        console.warn(`⚠️ Cleanup warning for ${id}:`, error)
      }
    })
    videoCacheCleanupCallbacks.value.clear()
    
    preloadCache.value.clear()
    cacheAccessOrder.value = []
    currentCacheMemory = 0
    stage2StartTime.value.clear()
    console.log('⚡ Preload cache cleared with memory tracking reset')
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
   * Check if critical Stage 2 content (event video) is ready for immediate playbook
   * Includes fallback mechanism if preloading fails or times out
   */
  const isStage2Ready = (eventId: string, eventVideoUrl: string | null): boolean => {
    if (!eventVideoUrl) {
      console.log(`⚡ Stage 2 Ready: No video URL, ready to proceed for event ${eventId}`)
      return true // No video means ready to proceed
    }
    
    const result = preloadResults.value.get(`event-video-${eventId}`)
    if (result?.success === true) {
      console.log(`⚡ Stage 2 Ready: Video preloaded successfully for event ${eventId}`)
      return true
    }
    
    // Check if stage 2 progress shows completion
    if (stage2Progress.value.percentage >= 100) {
      console.log(`⚡ Stage 2 Ready: Progress shows 100% completion for event ${eventId}`)
      return true
    }
    
    // FALLBACK MECHANISM: If preloading failed or is taking too long, 
    // enable button after reasonable timeout
    const startTime = stage2StartTime.value.get(eventId)
    if (startTime) {
      const elapsed = Date.now() - startTime
      if (elapsed > FALLBACK_TIMEOUT_MS) {
        console.warn(`⚠️ Stage 2 fallback: Enabling button after ${elapsed}ms timeout for event ${eventId}`)
        console.warn(`📊 Preload result:`, result)
        console.warn(`📊 Stage 2 progress:`, stage2Progress.value)
        return true // Allow user to proceed even if preload failed
      }
    }
    
    console.log(`⚡ Stage 2 Not Ready: Still waiting for preload completion for event ${eventId}`)
    console.log(`📊 Current result:`, result)
    console.log(`📊 Current progress:`, stage2Progress.value)
    console.log(`📊 Start time:`, startTime, 'Elapsed:', startTime ? Date.now() - startTime : 'N/A')
    
    return false
  }

  /**
   * Check if Stage 3 content is preloaded
   */
  const isStage3Ready = (eventId: string, standardBackgroundVideoUrl: string | null): boolean => {
    if (!standardBackgroundVideoUrl) return true // No background video means ready
    
    const result = preloadResults.value.get(`bg-video-${eventId}`)
    return result?.success === true
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

  // Cache management functions
  /**
   * Estimates memory usage of cached item
   */
  const estimateMemoryUsage = (item: any): number => {
    if (item instanceof HTMLImageElement) {
      // Rough estimation: width * height * 4 bytes per pixel
      return (item.naturalWidth || 100) * (item.naturalHeight || 100) * 4
    }
    if (item instanceof HTMLVideoElement) {
      // Rough estimation for video metadata
      return 10 * 1024 // 10KB for metadata
    }
    if (item instanceof HTMLAudioElement) {
      return 5 * 1024 // 5KB for audio metadata
    }
    if (item instanceof FontFace) {
      return 50 * 1024 // 50KB average font size
    }
    return 1024 // Default 1KB
  }

  /**
   * Sets cache item with LRU eviction
   */
  const setCacheItem = (url: string, item: any) => {
    const itemSize = estimateMemoryUsage(item)
    
    // Check if adding this item would exceed memory limits
    while (currentCacheMemory + itemSize > maxCacheMemory.value && cacheAccessOrder.value.length > 0) {
      evictLeastRecentlyUsed()
    }

    // Check if adding this item would exceed count limits
    while (preloadCache.value.size >= maxCacheSize.value && cacheAccessOrder.value.length > 0) {
      evictLeastRecentlyUsed()
    }

    // Add to cache
    preloadCache.value.set(url, item)
    currentCacheMemory += itemSize
    
    // Update access order
    updateCacheAccess(url)
  }

  /**
   * Updates cache access order for LRU tracking
   */
  const updateCacheAccess = (url: string) => {
    // Remove from current position
    const currentIndex = cacheAccessOrder.value.indexOf(url)
    if (currentIndex > -1) {
      cacheAccessOrder.value.splice(currentIndex, 1)
    }
    
    // Add to end (most recently used)
    cacheAccessOrder.value.push(url)
  }

  /**
   * Evicts least recently used cache item
   */
  const evictLeastRecentlyUsed = () => {
    if (cacheAccessOrder.value.length === 0) return

    const lruUrl = cacheAccessOrder.value.shift()
    if (lruUrl && preloadCache.value.has(lruUrl)) {
      const item = preloadCache.value.get(lruUrl)
      const itemSize = estimateMemoryUsage(item)
      
      preloadCache.value.delete(lruUrl)
      currentCacheMemory = Math.max(0, currentCacheMemory - itemSize)
      
      console.log(`⚡ Evicted LRU cache item: ${lruUrl} (${itemSize} bytes)`)
    }
  }

  // Font loading concurrency control
  const activeFontLoads = ref(0)
  const maxConcurrentFonts = 3

  // Security helper functions
  /**
   * Creates a properly formatted SVG data URL
   */
  const createSvgDataUrl = (svgCode: string): string | null => {
    const sanitizedSvg = sanitizeSvgContent(svgCode)
    if (!sanitizedSvg) {
      return null
    }

    try {
      // Ensure the SVG has proper namespace and structure
      const processedSvg = ensureSvgStructure(sanitizedSvg)
      
      // Create data URL with proper encoding
      // Option 1: Use base64 encoding (more reliable for complex SVGs)
      const base64Svg = btoa(unescape(encodeURIComponent(processedSvg)))
      return `data:image/svg+xml;base64,${base64Svg}`
      
      // Option 2: Use URL encoding (commented out as fallback)
      // return `data:image/svg+xml,${encodeURIComponent(processedSvg).replace(/'/g, '%27')}`
      
    } catch (error) {
      console.warn('Failed to create SVG data URL:', error)
      return null
    }
  }

  /**
   * Ensures SVG has proper structure and namespace
   */
  const ensureSvgStructure = (svgContent: string): string => {
    let processedSvg = svgContent.trim()
    
    // Add XML namespace if missing
    if (!processedSvg.includes('xmlns="http://www.w3.org/2000/svg"')) {
      processedSvg = processedSvg.replace(
        /<svg([^>]*)>/i, 
        '<svg$1 xmlns="http://www.w3.org/2000/svg">'
      )
    }
    
    // Ensure viewBox exists for better scaling (if width/height are present)
    if (!processedSvg.includes('viewBox=') && 
        (processedSvg.includes('width=') || processedSvg.includes('height='))) {
      const widthMatch = processedSvg.match(/width=["']([^"']*)["']/i)
      const heightMatch = processedSvg.match(/height=["']([^"']*)["']/i)
      
      if (widthMatch && heightMatch) {
        const width = parseFloat(widthMatch[1]) || 100
        const height = parseFloat(heightMatch[1]) || 100
        processedSvg = processedSvg.replace(
          /<svg([^>]*)>/i, 
          `<svg$1 viewBox="0 0 ${width} ${height}">`
        )
      }
    }
    
    return processedSvg
  }

  /**
   * Sanitizes SVG content to prevent XSS attacks
   */
  const sanitizeSvgContent = (svgCode: string): string | null => {
    if (!svgCode || typeof svgCode !== 'string') {
      return null
    }

    // Check for suspicious content first
    if (containsSuspiciousContent(svgCode)) {
      console.warn('Suspicious SVG content detected and blocked')
      return null
    }

    // Allow only safe SVG elements and attributes
    const sanitized = sanitizeHtml(svgCode, {
      customConfig: {
        ALLOWED_TAGS: [
          'svg', 'path', 'circle', 'rect', 'line', 'ellipse', 'polygon', 'polyline', 
          'g', 'defs', 'use', 'text', 'tspan', 'clipPath', 'mask', 'pattern', 
          'linearGradient', 'radialGradient', 'stop', 'symbol', 'marker'
        ],
        ALLOWED_ATTR: [
          'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 
          'width', 'height', 'viewBox', 'fill', 'stroke', 'stroke-width', 
          'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin',
          'transform', 'id', 'class', 'opacity', 'fill-opacity', 'stroke-opacity',
          'xmlns', 'xmlns:xlink', 'version', 'points', 'font-family', 'font-size',
          'text-anchor', 'dominant-baseline', 'dx', 'dy', 'rotate',
          'gradientUnits', 'gradientTransform', 'offset', 'stop-color', 'stop-opacity'
        ],
        FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'link', 'style', 'foreignObject'],
        FORBID_ATTR: [
          'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 'onmousemove',
          'href', 'xlink:href', 'javascript', 'vbscript', 'data'
        ]
      }
    })

    return sanitized.trim() || null
  }

  /**
   * Validates font URLs for security
   */
  const isValidFontUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') {
      return false
    }

    try {
      const urlObj = new URL(url)
      
      // Allow only specific protocols
      if (!['https:', 'data:'].includes(urlObj.protocol)) {
        return false
      }

      // For data URLs, ensure they're font types
      if (urlObj.protocol === 'data:') {
        const validDataTypes = [
          'data:font/woff',
          'data:font/woff2', 
          'data:font/truetype',
          'data:font/opentype',
          'data:application/font-woff',
          'data:application/font-woff2'
        ]
        return validDataTypes.some(type => url.startsWith(type))
      }

      // For HTTPS URLs, basic domain validation
      // In production, you might want to maintain a whitelist of trusted domains
      const hostname = urlObj.hostname.toLowerCase()
      
      // Block obviously malicious or suspicious domains
      const suspiciousDomains = ['localhost', '127.0.0.1', '0.0.0.0']
      if (suspiciousDomains.includes(hostname)) {
        return false
      }

      // Ensure file extension is font-related
      const validExtensions = ['.woff', '.woff2', '.ttf', '.otf', '.eot']
      const hasValidExtension = validExtensions.some(ext => 
        urlObj.pathname.toLowerCase().endsWith(ext)
      )

      return hasValidExtension

    } catch (error) {
      // Invalid URL
      return false
    }
  }

  /**
   * Safely gets network connection info without type casting
   */
  const getNetworkConnection = (): NetworkInformation | null => {
    if (typeof navigator === 'undefined') {
      return null
    }

    // Check if the connection property exists without type casting
    if ('connection' in navigator && navigator.connection) {
      return navigator.connection as NetworkInformation
    }

    // Check for vendor prefixed versions
    const prefixed = ['mozConnection', 'webkitConnection'] as const
    for (const prop of prefixed) {
      if (prop in navigator && (navigator as any)[prop]) {
        return (navigator as any)[prop] as NetworkInformation
      }
    }

    return null
  }

  // TypeScript interface for network connection
  interface NetworkInformation {
    effectiveType?: '2g' | '3g' | '4g' | 'slow-2g'
    saveData?: boolean
  }

  // Comprehensive cleanup on unmount
  onUnmounted(() => {
    console.log('⚡ Background preloader unmounting - cleaning up all resources')
    
    // Cancel all active preloading
    cancelPreloading()
    
    // Clear cache and memory tracking
    clearCache()
    
    // Reset font loading counter
    activeFontLoads.value = 0
    
    // Clear all remaining references
    preloadResults.value.clear()
    contentQueue.value = []
    
    console.log('⚡ Background preloader cleanup complete')
  })

  return {
    // State
    isPreloading: readonly(isPreloading),
    preloadProgress: readonly(preloadProgress),
    stage2Progress: readonly(stage2Progress),
    stage3Progress: readonly(stage3Progress),
    isComplete: readonly(isComplete),
    successfulLoads: readonly(successfulLoads),
    failedLoads: readonly(failedLoads),
    respectDataUsage: readonly(respectDataUsage),

    // Methods
    startPreloading,
    startStage2Preloading,
    startStage3Preloading,
    cancelPreloading,
    clearCache,
    clearVideoCache, // New: video-specific memory cleanup
    updateConfig,
    isContentPreloaded,
    isStage2Ready,
    isStage3Ready,
    getStats,

    // Types for external use
    PreloadPriority
  }
}