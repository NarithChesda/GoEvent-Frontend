import { ref, computed, onUnmounted, readonly } from 'vue'
import type { EventData, EventPhoto, Host } from './useEventShowcase'
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
  // Configuration
  const FALLBACK_TIMEOUT_MS = 15000
  const MAX_CACHE_SIZE = 50
  const MAX_CACHE_MEMORY = 100 * 1024 * 1024 // 100MB
  const MAX_CONCURRENT_FONTS = 3
  
  const config = ref<PreloaderConfig>({
    maxConcurrentLoads: 4,
    timeoutMs: 15000,
    retryAttempts: 2,
    enableCache: true,
    respectUserPreferences: true
  })
  
  // Reactive State
  const isPreloading = ref(false)
  const preloadProgress = ref<PreloadProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    percentage: 0,
    currentPriority: null
  })
  
  const stage2Progress = ref({ completed: 0, total: 0, percentage: 100 })
  const stage3Progress = ref({ completed: 0, total: 0, percentage: 100 })
  const stage2StartTime = ref<Map<string, number>>(new Map())
  
  const preloadResults = ref<Map<string, PreloadResult>>(new Map())
  const activeRequests = ref<Map<string, AbortController>>(new Map())
  const contentQueue = ref<PreloadableContent[]>([])
  const preloadCache = ref<Map<string, any>>(new Map())
  const cacheAccessOrder = ref<string[]>([])
  const videoCacheCleanupCallbacks = ref<Map<string, () => void>>(new Map())
  const activeFontLoads = ref(0)
  
  let currentCacheMemory = 0

  // Computed Properties
  const respectDataUsage = computed(() => {
    if (!config.value.respectUserPreferences) return false
    
    const connection = getNetworkConnection()
    if (connection) {
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        return true
      }
      if (connection.saveData) {
        return true
      }
    }
    
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return true
    }
    
    return false
  })

  const isComplete = computed(() => 
    preloadProgress.value.total > 0 && 
    preloadProgress.value.completed + preloadProgress.value.failed === preloadProgress.value.total
  )

  const successfulLoads = computed(() => preloadProgress.value.completed)
  const failedLoads = computed(() => preloadProgress.value.failed)

  // Content Generation
  const generatePreloadContent = (event: EventData, getMediaUrl: (url: string) => string): PreloadableContent[] => {
    const content: PreloadableContent[] = []
    const photos = event.photos || event.event_photos || []

    // Critical priority - Videos
    if (event.event_video) {
      content.push({
        id: `event-video-${event.id}`,
        type: 'video',
        url: getMediaUrl(event.event_video),
        priority: PreloadPriority.CRITICAL,
        metadata: { type: 'event_video' }
      })
    }

    if (event.template_assets?.assets?.standard_background_video) {
      content.push({
        id: `bg-video-${event.id}`,
        type: 'video',
        url: getMediaUrl(event.template_assets.assets.standard_background_video),
        priority: PreloadPriority.CRITICAL,
        metadata: { type: 'background_video' }
      })
    }

    // High priority - Music
    if (event.music) {
      content.push({
        id: `music-${event.id}`,
        type: 'audio',
        url: getMediaUrl(event.music),
        priority: PreloadPriority.HIGH,
        metadata: { type: 'music' }
      })
    }

    // Medium-High priority - Logos
    const logoItems = [
      { url: event.logo_one, id: 'logo-one' },
      { url: event.logo_two, id: 'logo-two' }
    ]
    
    logoItems.forEach(({ url, id }) => {
      if (url) {
        content.push({
          id: `${id}-${event.id}`,
          type: 'image',
          url: getMediaUrl(url),
          priority: PreloadPriority.MEDIUM_HIGH,
          metadata: { type: 'logo' }
        })
      }
    })

    // Medium priority - Photos and other images
    photos.forEach((photo: EventPhoto, index: number) => {
      content.push({
        id: `photo-${photo.id}`,
        type: 'image',
        url: getMediaUrl(photo.image),
        priority: index < 3 ? PreloadPriority.HIGH : PreloadPriority.MEDIUM,
        metadata: { type: 'event_photo', order: photo.order }
      })
    })

    // Host images
    event.hosts?.forEach((host: Host) => {
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

    // Banner image
    if (event.banner_image) {
      content.push({
        id: `banner-${event.id}`,
        type: 'image',
        url: getMediaUrl(event.banner_image),
        priority: PreloadPriority.MEDIUM,
        metadata: { type: 'banner' }
      })
    }

    return content
  }

  // Core Preloading Methods
  const preloadContent = async (content: PreloadableContent): Promise<PreloadResult> => {
    const startTime = performance.now()
    
    // Check cache first
    if (config.value.enableCache && preloadCache.value.has(content.url)) {
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
      const result = await loadContentByType(content, abortController.signal)
      
      if (config.value.enableCache) {
        setCacheItem(content.url, result)
      }

      return {
        id: content.id,
        success: true,
        loadTime: performance.now() - startTime
      }
    } catch (error: any) {
      return {
        id: content.id,
        success: false,
        error: error as Error,
        loadTime: performance.now() - startTime
      }
    } finally {
      activeRequests.value.delete(content.id)
    }
  }
  
  const loadContentByType = async (content: PreloadableContent, signal: AbortSignal): Promise<any> => {
    switch (content.type) {
      case 'image':
        return await preloadImage(content.url, signal)
      case 'video': {
        const result = await preloadVideo(content.url, signal)
        if (result instanceof HTMLVideoElement) {
          const cleanup = createVideoMemoryCleanup(result, content.url)
          videoCacheCleanupCallbacks.value.set(content.id, cleanup)
        }
        return result
      }
      case 'audio':
        return await preloadAudio(content.url, signal)
      case 'font':
        return await preloadFont(content.url, signal)
      case 'svg':
        return await preloadSvg(content.url, signal)
      default:
        throw new Error(`Unsupported content type: ${content.type}`)
    }
  }

  // Individual Content Preloaders
  const preloadImage = (url: string, signal: AbortSignal): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      let timeoutId: number | null = null
      
      const cleanup = () => {
        img.onload = null
        img.onerror = null
        signal.removeEventListener('abort', onAbort)
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
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

      timeoutId = setTimeout(() => {
        if (!signal.aborted) {
          cleanup()
          reject(new Error(`Image load timeout: ${url}`))
        }
      }, config.value.timeoutMs)

      img.src = url
    })
  }

  const preloadSvg = (url: string, signal: AbortSignal): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (url.startsWith('data:image/svg+xml')) {
        validateSvgDataUrl(url, signal, resolve, reject)
      } else {
        fetchExternalSvg(url, signal, resolve, reject)
      }
    })
  }
  
  const validateSvgDataUrl = (
    url: string, 
    signal: AbortSignal, 
    resolve: (value: string) => void, 
    reject: (reason?: any) => void
  ) => {
    const img = new Image()
    let timeoutId: number | null = null
    
    const cleanup = () => {
      img.onload = null
      img.onerror = null
      signal.removeEventListener('abort', onAbort)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }

    const onAbort = () => {
      cleanup()
      reject(new Error('SVG preload aborted'))
    }

    img.onload = () => {
      cleanup()
      resolve(url)
    }

    img.onerror = () => {
      cleanup()
      try {
        const svgContent = decodeURIComponent(url.replace('data:image/svg+xml,', ''))
        if (svgContent.includes('<svg') && svgContent.includes('</svg>')) {
          resolve(url)
        } else {
          reject(new Error('Invalid SVG content in data URL'))
        }
      } catch (parseError) {
        reject(new Error(`Failed to parse SVG data URL: ${parseError}`))
      }
    }

    signal.addEventListener('abort', onAbort)
    
    timeoutId = setTimeout(() => {
      if (!signal.aborted) {
        cleanup()
        reject(new Error('SVG load timeout'))
      }
    }, config.value.timeoutMs)

    img.src = url
  }
  
  const fetchExternalSvg = (
    url: string, 
    signal: AbortSignal, 
    resolve: (value: string) => void, 
    reject: (reason?: any) => void
  ) => {
    fetch(url, { signal })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return response.text()
      })
      .then(svgContent => {
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

  const preloadVideo = (url: string, signal: AbortSignal): Promise<HTMLVideoElement> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.muted = true

      let hasResolved = false
      let timeoutId: number | null = null
      let progressiveTimeoutId: number | null = null

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId)
        if (progressiveTimeoutId) clearTimeout(progressiveTimeoutId)
        
        video.oncanplaythrough = null
        video.oncanplay = null
        video.onloadedmetadata = null
        video.onerror = null
        signal.removeEventListener('abort', onAbort)
      }

      const onAbort = () => {
        cleanup()
        video.src = ''
        video.load()
        reject(new Error('Video preload aborted'))
      }

      const resolveIfNotDone = () => {
        if (!hasResolved) {
          hasResolved = true
          cleanup()
          resolve(video)
        }
      }

      video.oncanplay = resolveIfNotDone
      video.oncanplaythrough = resolveIfNotDone
      
      video.onloadedmetadata = () => {
        video.preload = 'auto'
        progressiveTimeoutId = setTimeout(() => {
          if (!hasResolved && video.readyState >= video.HAVE_METADATA) {
            resolveIfNotDone()
          }
        }, 8000)
      }

      video.onerror = () => {
        cleanup()
        reject(new Error(`Failed to load video: ${url}`))
      }

      signal.addEventListener('abort', onAbort)

      timeoutId = setTimeout(() => {
        if (!signal.aborted && !hasResolved) {
          if (video.readyState >= video.HAVE_METADATA) {
            resolveIfNotDone()
          } else {
            cleanup()
            reject(new Error(`Video load timeout: ${url}`))
          }
        }
      }, config.value.timeoutMs)

      video.src = url
    })
  }

  const preloadAudio = (url: string, signal: AbortSignal): Promise<HTMLAudioElement> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio()
      audio.preload = 'metadata'
      let timeoutId: number | null = null

      const cleanup = () => {
        audio.onloadedmetadata = null
        audio.onerror = null
        signal.removeEventListener('abort', onAbort)
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
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

      timeoutId = setTimeout(() => {
        if (!signal.aborted) {
          cleanup()
          reject(new Error(`Audio load timeout: ${url}`))
        }
      }, config.value.timeoutMs)

      audio.src = url
    })
  }

  const preloadFont = async (url: string, signal: AbortSignal): Promise<FontFace> => {
    if (!isValidFontUrl(url)) {
      throw new Error(`Invalid or unsafe font URL: ${url}`)
    }

    // Wait for available font loading slot
    while (activeFontLoads.value >= MAX_CONCURRENT_FONTS) {
      await new Promise(resolve => setTimeout(resolve, 100))
      if (signal.aborted) {
        throw new Error('Font preload aborted while waiting for slot')
      }
    }

    activeFontLoads.value++

    return new Promise((resolve, reject) => {
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

      const timeout = setTimeout(() => {
        if (!signal.aborted) {
          cleanup()
          reject(new Error(`Font load timeout: ${url}`))
        }
      }, config.value.timeoutMs) as unknown as number

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

  // Stage-Specific Methods
  const startStage2Preloading = async (event: EventData, getMediaUrl: (url: string) => string) => {
    stage2StartTime.value.set(event.id, Date.now())
    
    if (respectDataUsage.value) {
      stage2Progress.value = { completed: 1, total: 1, percentage: 100 }
      return
    }
    
    const stage2Content: PreloadableContent[] = []

    if (event.event_video) {
      stage2Content.push({
        id: `event-video-${event.id}`,
        type: 'video',
        url: getMediaUrl(event.event_video),
        priority: PreloadPriority.CRITICAL,
        metadata: { type: 'event_video', stage: 2 }
      })
    }

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
      stage2Progress.value = { completed: 0, total: 0, percentage: 100 }
      return
    }

    await processStageContent(stage2Content, 2)
  }

  const startStage3Preloading = async (event: EventData, getMediaUrl: (url: string) => string) => {
    if (respectDataUsage.value) {
      return
    }
    
    const stage3Content: PreloadableContent[] = []
    const photos = event.photos || event.event_photos || []

    if (event.template_assets?.assets?.standard_background_video) {
      stage3Content.push({
        id: `bg-video-${event.id}`,
        type: 'video',
        url: getMediaUrl(event.template_assets.assets.standard_background_video),
        priority: PreloadPriority.CRITICAL,
        metadata: { type: 'background_video', stage: 3 }
      })
    }

    // First 6 photos with priority handling
    photos.slice(0, 6).forEach((photo: EventPhoto, index: number) => {
      stage3Content.push({
        id: `photo-${photo.id}`,
        type: 'image',
        url: getMediaUrl(photo.image),
        priority: index < 3 ? PreloadPriority.HIGH : PreloadPriority.MEDIUM,
        metadata: { type: 'event_photo', order: photo.order, stage: 3 }
      })
    })

    // Event logos
    const logoItems = [
      { url: event.logo_one, id: 'logo-one' },
      { url: event.logo_two, id: 'logo-two' }
    ]
    
    logoItems.forEach(({ url, id }) => {
      if (url) {
        stage3Content.push({
          id: `${id}-${event.id}`,
          type: 'image',
          url: getMediaUrl(url),
          priority: PreloadPriority.MEDIUM_HIGH,
          metadata: { type: 'logo', stage: 3 }
        })
      }
    })

    if (stage3Content.length === 0) {
      stage3Progress.value = { completed: 0, total: 0, percentage: 100 }
      return
    }

    await processStageContent(stage3Content, 3)
  }

  const startPreloading = async (event: EventData, getMediaUrl: (url: string) => string) => {
    await startStage2Preloading(event, getMediaUrl)
  }

  const processStageContent = async (stageContent: PreloadableContent[], stageNumber: number) => {
    if (stageContent.length === 0) return

    // Sort by priority (lower number = higher priority)
    stageContent.sort((a, b) => a.priority - b.priority)

    const stageProgressRef = stageNumber === 2 ? stage2Progress : stage3Progress
    stageProgressRef.value = { completed: 0, total: stageContent.length, percentage: 0 }
    
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
        
        const newPercentage = Math.round((processed / stageContent.length) * 100)
        stageProgressRef.value.completed = processed
        stageProgressRef.value.percentage = newPercentage

        return result
      }).finally(() => {
        running.delete(task)
      })

      running.add(task)
    }

    // Wait for all tasks to complete
    await Promise.all(running)
  }

  const processPreloadQueue = async () => {
    const running = new Set<Promise<PreloadResult>>()

    while (contentQueue.value.length > 0 || running.size > 0) {
      while (contentQueue.value.length > 0 && running.size < config.value.maxConcurrentLoads) {
        const content = contentQueue.value.shift()!
        preloadProgress.value.currentPriority = content.priority

        const task = preloadContent(content).then(result => {
          preloadResults.value.set(result.id, result)
          
          if (result.success) {
            preloadProgress.value.completed++
          } else {
            preloadProgress.value.failed++
          }
          
          preloadProgress.value.percentage = Math.round(
            ((preloadProgress.value.completed + preloadProgress.value.failed) / preloadProgress.value.total) * 100
          )

          return result
        })

        running.add(task)
        task.finally(() => running.delete(task))
      }

      if (running.size > 0) {
        await Promise.race(running)
      }
    }

    preloadProgress.value.currentPriority = null
  }

  // Utility Methods
  const cancelPreloading = () => {
    activeRequests.value.forEach((controller) => {
      controller.abort()
    })
    
    activeRequests.value.clear()
    contentQueue.value = []
    isPreloading.value = false
  }

  const createVideoMemoryCleanup = (video: HTMLVideoElement, url: string) => {
    return () => {
      try {
        video.src = ''
        video.load()
      } catch (error) {
        console.warn(`Video cleanup warning for ${url}:`, error)
      }
    }
  }

  const clearVideoCache = (eventId: string) => {
    const videoIds = [`event-video-${eventId}`, `bg-video-${eventId}`]
    
    videoIds.forEach(id => {
      const cleanup = videoCacheCleanupCallbacks.value.get(id)
      if (cleanup) {
        cleanup()
        videoCacheCleanupCallbacks.value.delete(id)
      }
    })
  }

  const clearCache = () => {
    videoCacheCleanupCallbacks.value.forEach((cleanup, id) => {
      try {
        cleanup()
      } catch (error) {
        console.warn(`Cleanup warning for ${id}:`, error)
      }
    })
    videoCacheCleanupCallbacks.value.clear()
    
    preloadCache.value.clear()
    cacheAccessOrder.value = []
    currentCacheMemory = 0
    stage2StartTime.value.clear()
  }

  const updateConfig = (newConfig: Partial<PreloaderConfig>) => {
    config.value = { ...config.value, ...newConfig }
  }

  const isContentPreloaded = (url: string): boolean => {
    return preloadCache.value.has(url)
  }

  const isStage2Ready = (eventId: string, eventVideoUrl: string | null): boolean => {
    if (!eventVideoUrl) {
      return true
    }
    
    const result = preloadResults.value.get(`event-video-${eventId}`)
    if (result?.success === true) {
      return true
    }
    
    if (stage2Progress.value.percentage >= 100) {
      return true
    }
    
    // Fallback mechanism: enable button after timeout
    const startTime = stage2StartTime.value.get(eventId)
    if (startTime) {
      const elapsed = Date.now() - startTime
      if (elapsed > FALLBACK_TIMEOUT_MS) {
        return true
      }
    }
    
    return false
  }

  const isStage3Ready = (eventId: string, standardBackgroundVideoUrl: string | null): boolean => {
    if (!standardBackgroundVideoUrl) return true
    
    const result = preloadResults.value.get(`bg-video-${eventId}`)
    return result?.success === true
  }

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

  // Cache Management
  const estimateMemoryUsage = (item: any): number => {
    if (item instanceof HTMLImageElement) {
      return (item.naturalWidth || 100) * (item.naturalHeight || 100) * 4
    }
    if (item instanceof HTMLVideoElement) {
      return 10 * 1024
    }
    if (item instanceof HTMLAudioElement) {
      return 5 * 1024
    }
    if (item instanceof FontFace) {
      return 50 * 1024
    }
    return 1024
  }

  const setCacheItem = (url: string, item: any) => {
    const itemSize = estimateMemoryUsage(item)
    
    // Check memory and size limits
    while ((currentCacheMemory + itemSize > MAX_CACHE_MEMORY || 
            preloadCache.value.size >= MAX_CACHE_SIZE) && 
           cacheAccessOrder.value.length > 0) {
      evictLeastRecentlyUsed()
    }

    preloadCache.value.set(url, item)
    currentCacheMemory += itemSize
    updateCacheAccess(url)
  }

  const updateCacheAccess = (url: string) => {
    const currentIndex = cacheAccessOrder.value.indexOf(url)
    if (currentIndex > -1) {
      cacheAccessOrder.value.splice(currentIndex, 1)
    }
    cacheAccessOrder.value.push(url)
  }

  const evictLeastRecentlyUsed = () => {
    if (cacheAccessOrder.value.length === 0) return

    const lruUrl = cacheAccessOrder.value.shift()
    if (lruUrl && preloadCache.value.has(lruUrl)) {
      const item = preloadCache.value.get(lruUrl)
      const itemSize = estimateMemoryUsage(item)
      
      preloadCache.value.delete(lruUrl)
      currentCacheMemory = Math.max(0, currentCacheMemory - itemSize)
    }
  }

  // SVG Utilities
  const createSvgDataUrl = (svgCode: string): string | null => {
    const sanitizedSvg = sanitizeSvgContent(svgCode)
    if (!sanitizedSvg) {
      return null
    }

    try {
      const processedSvg = ensureSvgStructure(sanitizedSvg)
      const base64Svg = btoa(unescape(encodeURIComponent(processedSvg)))
      return `data:image/svg+xml;base64,${base64Svg}`
    } catch (error) {
      console.warn('Failed to create SVG data URL:', error)
      return null
    }
  }

  const ensureSvgStructure = (svgContent: string): string => {
    let processedSvg = svgContent.trim()
    
    if (!processedSvg.includes('xmlns="http://www.w3.org/2000/svg"')) {
      processedSvg = processedSvg.replace(
        /<svg([^>]*)>/i, 
        '<svg$1 xmlns="http://www.w3.org/2000/svg">'
      )
    }
    
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

  const sanitizeSvgContent = (svgCode: string): string | null => {
    if (!svgCode || typeof svgCode !== 'string') {
      return null
    }

    if (containsSuspiciousContent(svgCode)) {
      console.warn('Suspicious SVG content detected and blocked')
      return null
    }

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

  const isValidFontUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') {
      return false
    }

    try {
      const urlObj = new URL(url)
      
      if (!['https:', 'data:'].includes(urlObj.protocol)) {
        return false
      }

      if (urlObj.protocol === 'data:') {
        const validDataTypes = [
          'data:font/woff', 'data:font/woff2', 'data:font/truetype',
          'data:font/opentype', 'data:application/font-woff', 'data:application/font-woff2'
        ]
        return validDataTypes.some(type => url.startsWith(type))
      }

      const hostname = urlObj.hostname.toLowerCase()
      const suspiciousDomains = ['localhost', '127.0.0.1', '0.0.0.0']
      if (suspiciousDomains.includes(hostname)) {
        return false
      }

      const validExtensions = ['.woff', '.woff2', '.ttf', '.otf', '.eot']
      return validExtensions.some(ext => 
        urlObj.pathname.toLowerCase().endsWith(ext)
      )
    } catch (error) {
      return false
    }
  }

  // Network Utilities
  const getNetworkConnection = (): NetworkInformation | null => {
    if (typeof navigator === 'undefined') {
      return null
    }

    if ('connection' in navigator && navigator.connection) {
      return navigator.connection as NetworkInformation
    }

    const prefixed = ['mozConnection', 'webkitConnection'] as const
    for (const prop of prefixed) {
      if (prop in navigator && (navigator as any)[prop]) {
        return (navigator as any)[prop] as NetworkInformation
      }
    }

    return null
  }

  interface NetworkInformation {
    effectiveType?: '2g' | '3g' | '4g' | 'slow-2g'
    saveData?: boolean
  }

  // Lifecycle
  onUnmounted(() => {
    cancelPreloading()
    clearCache()
    activeFontLoads.value = 0
    preloadResults.value.clear()
    contentQueue.value = []
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