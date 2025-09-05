import { ref, computed, nextTick } from 'vue'
import type { TemplateFont, FontLoadConfig, FontLoadResult, FontLoadStats, FontCacheEntry } from '../useEventShowcase'

// Font configuration constants
const FONT_CONFIG = {
  DEFAULT_TIMEOUT: 5000,
  DEFAULT_MAX_RETRIES: 2,
  DEFAULT_DISPLAY: 'swap' as const,
  CACHE_EXPIRY_TIME: 30 * 60 * 1000, // 30 minutes
  MAX_CACHE_SIZE: 50,
  FONT_READY_WAIT_TIME: 1000,
  FONT_APPLY_DELAY: 50,
  RETRY_BASE_DELAY: 500,
  MAX_FONT_NAME_LENGTH: 100
} as const

/**
 * Font Management Composable
 * 
 * Handles all font-related functionality including:
 * - Font loading with caching and retry logic
 * - Font validation and security checks
 * - Memory management for font cache
 * - Language-specific font processing
 * - Progressive font enhancement
 */
export function useFontManager() {
  // Font loading state
  const fontsLoaded = ref(false)
  const fontsLoadedCount = ref(0)
  const fontLoadStats = ref<FontLoadStats>({
    totalFonts: 0,
    loadedFonts: 0,
    failedFonts: 0,
    averageLoadTime: 0,
    cacheHitRate: 0
  })

  // Enhanced font cache with memory management
  const globalFontCache = ref<Map<string, FontCacheEntry>>(new Map())
  const fontLoadingPromises = ref<Map<string, Promise<FontLoadResult>>>(new Map())
  
  /**
   * Creates fallback font stacks based on language and font type
   */
  const getFallbackFontStack = (
    fontType: 'serif' | 'sans-serif' | 'decorative' = 'sans-serif',
    language: string = 'en'
  ) => {
    const lang = language.toLowerCase()
    
    const languageFallbacks: Record<string, string> = {
      'km': fontType === 'serif' 
        ? '"Noto Serif Khmer", "Khmer Serif", serif' 
        : '"Noto Sans Khmer", "Khmer Sans", sans-serif',
      'kh': fontType === 'serif' 
        ? '"Noto Serif Khmer", "Khmer Serif", serif' 
        : '"Noto Sans Khmer", "Khmer Sans", sans-serif',
      'en': fontType === 'serif'
        ? '"Inter", "Georgia", "Times New Roman", serif'
        : '"Inter", "Helvetica Neue", "Arial", sans-serif',
      'default': fontType === 'serif'
        ? '"Inter", "Georgia", serif'
        : '"Inter", "Helvetica Neue", sans-serif'
    }
    
    return languageFallbacks[lang] || languageFallbacks['default']
  }

  /**
   * Validates font URLs for security
   */
  const isValidFontUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') return false

    try {
      const urlObj = new URL(url)
      
      const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development'
      const hostname = urlObj.hostname.toLowerCase()
      const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(hostname)
      
      // Protocol validation
      const allowedProtocols = ['https:', 'data:']
      if (isDevelopment && isLocalhost) {
        allowedProtocols.push('http:')
      }
      
      if (!allowedProtocols.includes(urlObj.protocol)) return false

      // Data URL validation
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

      // Extension validation
      const validExtensions = ['.woff', '.woff2', '.ttf', '.otf', '.eot']
      return validExtensions.some(ext => 
        urlObj.pathname.toLowerCase().endsWith(ext)
      )

    } catch {
      return false
    }
  }

  /**
   * Sanitizes font names to prevent injection attacks
   */
  const sanitizeFontName = (fontName: string): string => {
    if (!fontName || typeof fontName !== 'string') return ''
    
    return fontName
      .replace(/[<>"'&\\]/g, '')
      .replace(/[^a-zA-Z0-9\s\-_]/g, '')
      .trim()
      .substring(0, FONT_CONFIG.MAX_FONT_NAME_LENGTH)
  }

  /**
   * Manages font cache memory with LRU eviction
   */
  const manageFontCacheMemory = () => {
    const cache = globalFontCache.value
    const now = Date.now()
    
    // Remove expired entries
    for (const [key, entry] of cache.entries()) {
      if (now - entry.loadedAt > FONT_CONFIG.CACHE_EXPIRY_TIME) {
        try {
          document.fonts.delete(entry.fontFace)
        } catch (error) {
          console.warn('Failed to remove expired font from document:', error)
        }
        cache.delete(key)
      }
    }
    
    // If still over limit, remove oldest entries
    if (cache.size > FONT_CONFIG.MAX_CACHE_SIZE) {
      const sortedEntries = Array.from(cache.entries())
        .sort((a, b) => a[1].loadedAt - b[1].loadedAt)
      
      const toRemove = sortedEntries.slice(0, cache.size - FONT_CONFIG.MAX_CACHE_SIZE)
      for (const [key, entry] of toRemove) {
        try {
          document.fonts.delete(entry.fontFace)
        } catch (error) {
          console.warn('Failed to remove old font from document:', error)
        }
        cache.delete(key)
      }
    }
  }

  /**
   * Custom error class for font loading
   */
  const FontLoadError = class extends Error {
    fontName?: string
    url?: string
    attempt?: number
    
    constructor(message: string, details?: { fontName?: string; url?: string; attempt?: number }) {
      super(message)
      this.name = 'FontLoadError'
      this.fontName = details?.fontName
      this.url = details?.url
      this.attempt = details?.attempt
    }
  }

  /**
   * Loads custom fonts with progressive enhancement
   */
  const loadCustomFonts = async (
    fonts: TemplateFont[], 
    config: FontLoadConfig = {}
  ): Promise<FontLoadResult[]> => {
    fontsLoaded.value = false
    fontsLoadedCount.value = 0
    
    // Reset stats
    fontLoadStats.value = {
      totalFonts: 0,
      loadedFonts: 0,
      failedFonts: 0,
      averageLoadTime: 0,
      cacheHitRate: 0
    }
    
    if (fonts.length === 0) {
      fontsLoaded.value = true
      await nextTick()
      return []
    }
    
    fontLoadStats.value.totalFonts = fonts.length
    
    // Cleanup cache memory before loading
    manageFontCacheMemory()
    
    // Load fonts with progressive enhancement
    const loadPromises = fonts.map(font => loadSingleFont(font, config))
    const results = await Promise.allSettled(loadPromises)
    
    // Process results
    const successfulLoads: FontLoadResult[] = []
    let totalLoadTime = 0
    let cacheHits = 0
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        successfulLoads.push(result.value)
        totalLoadTime += result.value.loadTime
        if (result.value.fromCache) {
          cacheHits++
        }
        fontLoadStats.value.loadedFonts++
      } else {
        fontLoadStats.value.failedFonts++
        console.warn(`Failed to load font ${fonts[index].font_name}:`, 
          result.status === 'rejected' ? result.reason : result.value.error)
      }
    })
    
    // Update statistics
    fontLoadStats.value.averageLoadTime = successfulLoads.length > 0 
      ? totalLoadTime / successfulLoads.length 
      : 0
    fontLoadStats.value.cacheHitRate = fonts.length > 0 
      ? (cacheHits / fonts.length) * 100 
      : 0
    
    fontsLoadedCount.value = fontLoadStats.value.loadedFonts
    fontsLoaded.value = true
    
    await nextTick()
    return successfulLoads
  }

  /**
   * Loads a single font with caching and retry logic
   */
  const loadSingleFont = async (
    font: TemplateFont, 
    config: FontLoadConfig = {}
  ): Promise<FontLoadResult> => {
    const startTime = performance.now()
    const fontName = sanitizeFontName(font.font?.name || font.font_name || '')
    const fontFile = font.font?.font_file || font.font_file || ''
    const timeout = config.timeout || FONT_CONFIG.DEFAULT_TIMEOUT
    const maxRetries = config.retryAttempts || FONT_CONFIG.DEFAULT_MAX_RETRIES
    const display = config.display || FONT_CONFIG.DEFAULT_DISPLAY
    
    const result: FontLoadResult = {
      success: false,
      fontName,
      url: '',
      loadTime: 0,
      fromCache: false
    }
    
    // Early validation
    if (!fontFile || !fontName) {
      result.error = 'Missing font file or name'
      return result
    }

    const getMediaUrl = (url: string): string => {
      if (!url) return ''
      if (url.startsWith('http://') || url.startsWith('https://')) return url
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
      return url.startsWith('/') ? `${API_BASE_URL}${url}` : `${API_BASE_URL}/media/${url}`
    }

    const fullUrl = getMediaUrl(fontFile)
    result.url = fullUrl
    
    // Check for existing loading promise
    const cacheKey = `${fontName}-${fullUrl}`
    if (fontLoadingPromises.value.has(cacheKey)) {
      return await fontLoadingPromises.value.get(cacheKey)!
    }
    
    // Check cache first
    const cachedEntry = globalFontCache.value.get(cacheKey)
    if (cachedEntry?.isLoaded && (Date.now() - cachedEntry.loadedAt < FONT_CONFIG.CACHE_EXPIRY_TIME)) {
      result.success = true
      result.fromCache = true
      result.loadTime = performance.now() - startTime
      return result
    }
    
    // Create loading promise with retry logic
    const loadPromise = executeLoadWithRetry(font, fontName, fullUrl, timeout, maxRetries, display, result, startTime)
    
    // Cache the loading promise to prevent duplicates
    fontLoadingPromises.value.set(cacheKey, loadPromise)
    
    try {
      return await loadPromise
    } finally {
      fontLoadingPromises.value.delete(cacheKey)
    }
  }

  /**
   * Executes font loading with retry logic
   */
  const executeLoadWithRetry = async (
    font: TemplateFont,
    fontName: string,
    fullUrl: string,
    timeout: number,
    maxRetries: number,
    display: string,
    result: FontLoadResult,
    startTime: number
  ): Promise<FontLoadResult> => {
    let lastError = ''
    const cacheKey = `${fontName}-${fullUrl}`
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Validate font URL
        if (!isValidFontUrl(fullUrl)) {
          throw new FontLoadError(`Invalid or untrusted font URL: ${fullUrl}`, { fontName, url: fullUrl })
        }

        // Create and load font face
        const fontFace = new FontFace(
          fontName, 
          `url(${fullUrl})`,
          {
            display: display as FontDisplay,
            ...(font.font_type?.includes('variable') && {
              variationSettings: 'normal'
            })
          }
        )
        
        // Load with timeout
        const loadedFont = await Promise.race([
          fontFace.load(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new FontLoadError('Font load timeout', { fontName, url: fullUrl })), timeout)
          )
        ])
        
        // Add to document
        document.fonts.add(loadedFont)
        
        // Wait for font to be ready
        await Promise.race([
          document.fonts.ready,
          new Promise(resolve => setTimeout(resolve, FONT_CONFIG.FONT_READY_WAIT_TIME))
        ])
        
        // Small delay to ensure browser has applied the font
        await new Promise(resolve => setTimeout(resolve, FONT_CONFIG.FONT_APPLY_DELAY))
        
        // Cache successful load
        const cacheEntry: FontCacheEntry = {
          fontFace: loadedFont,
          loadedAt: Date.now(),
          url: fullUrl,
          fontName,
          isLoaded: true,
          loadAttempts: attempt + 1
        }
        globalFontCache.value.set(cacheKey, cacheEntry)
        
        // Update result and return success
        result.success = true
        result.loadTime = performance.now() - startTime
        return result
        
      } catch (error) {
        const fontError = error as InstanceType<typeof FontLoadError>
        lastError = fontError.message || 'Unknown error'
        
        if (attempt < maxRetries) {
          // Exponential backoff for retries
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, attempt) * FONT_CONFIG.RETRY_BASE_DELAY)
          )
        }
      }
    }
    
    // All attempts failed - cache the failure
    const failedEntry: FontCacheEntry = {
      fontFace: new FontFace(fontName, 'url()'), // Dummy font face for failed loads
      loadedAt: Date.now(),
      url: fullUrl,
      fontName,
      isLoaded: false,
      loadAttempts: maxRetries + 1,
      lastError
    }
    globalFontCache.value.set(cacheKey, failedEntry)
    
    result.error = `Failed after ${maxRetries + 1} attempts: ${lastError}`
    result.loadTime = performance.now() - startTime
    
    return result
  }

  /**
   * Cleanup font resources
   */
  const cleanup = () => {
    fontLoadingPromises.value.clear()
    
    // Cleanup global font cache (keep recently used)
    const now = Date.now()
    for (const [key, entry] of globalFontCache.value.entries()) {
      if (now - entry.loadedAt > FONT_CONFIG.CACHE_EXPIRY_TIME || !entry.isLoaded) {
        try {
          document.fonts.delete(entry.fontFace)
        } catch {
          // Ignore cleanup errors
        }
        globalFontCache.value.delete(key)
      }
    }
  }

  return {
    // State
    fontsLoaded,
    fontsLoadedCount,
    fontLoadStats,
    
    // Methods  
    loadCustomFonts,
    getFallbackFontStack,
    isValidFontUrl,
    sanitizeFontName,
    manageFontCacheMemory,
    cleanup,
    
    // Constants
    FONT_CONFIG
  }
}