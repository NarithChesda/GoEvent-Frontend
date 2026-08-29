import { ref, nextTick } from 'vue'
import type {
  TemplateFont,
  FontLoadConfig,
  FontLoadResult,
  FontLoadStats,
  FontCacheEntry,
} from '../useEventShowcase'
import {
  resolveFontMetrics,
  fontMetricDescriptorCss,
  fontMetricDescriptorDict,
  fontMetricSignature,
  type ResolvedFontMetrics,
} from '@/utils/fontMetrics'

/**
 * The `@font-face` rules currently in the document, keyed by family + URL.
 *
 * Module scope, not composable scope, because the `<style>` tag they render into
 * is a document-level singleton — two composable instances writing to it from
 * separate registries would each believe they owned its whole contents and
 * clobber the other's rules.
 *
 * Keyed WITHOUT the metrics so that re-injecting a face at a new size replaces
 * its rule rather than appending a second one. The old code appended to
 * `textContent` unconditionally, which grew the sheet without bound and, once
 * sizes became adjustable, would have left every superseded size in the document.
 */
const fontFaceRules = new Map<string, string>()

/**
 * The `FontFace` objects registered on `document.fonts`, same key as above.
 *
 * `document.fonts.add()` appends rather than replaces, so without this a size
 * change would leave two faces under one family name with different `sizeAdjust`
 * and no defined answer about which one paints.
 */
const documentFontFaces = new Map<string, FontFace>()

const fontFaceKey = (fontName: string, fontUrl: string): string => `${fontName}|${fontUrl}`

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
  MAX_FONT_NAME_LENGTH: 100,
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
    cacheHitRate: 0,
  })

  // Enhanced font cache with memory management
  const globalFontCache = ref<Map<string, FontCacheEntry>>(new Map())
  const fontLoadingPromises = ref<Map<string, Promise<FontLoadResult>>>(new Map())

  /**
   * Creates fallback font stacks based on language and font type
   */
  const getFallbackFontStack = (
    fontType: 'serif' | 'sans-serif' | 'decorative' = 'sans-serif',
    language: string = 'en',
  ) => {
    const lang = language.toLowerCase()

    const languageFallbacks: Record<string, string> = {
      km:
        fontType === 'serif'
          ? '"Noto Serif Khmer", "Khmer Serif", serif'
          : '"Noto Sans Khmer", "Khmer Sans", sans-serif',
      kh:
        fontType === 'serif'
          ? '"Noto Serif Khmer", "Khmer Serif", serif'
          : '"Noto Sans Khmer", "Khmer Sans", sans-serif',
      en:
        fontType === 'serif'
          ? '"Inter", "Georgia", "Times New Roman", serif'
          : '"Inter", "Helvetica Neue", "Arial", sans-serif',
      default:
        fontType === 'serif'
          ? '"Inter", "Georgia", serif'
          : '"Inter", "Helvetica Neue", sans-serif',
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
          'data:application/font-woff2',
        ]
        return validDataTypes.some((type) => url.startsWith(type))
      }

      // Extension validation
      const validExtensions = ['.woff', '.woff2', '.ttf', '.otf', '.eot']
      return validExtensions.some((ext) => urlObj.pathname.toLowerCase().endsWith(ext))
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
      const sortedEntries = Array.from(cache.entries()).sort(
        (a, b) => a[1].loadedAt - b[1].loadedAt,
      )

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
    config: FontLoadConfig = {},
  ): Promise<FontLoadResult[]> => {
    fontsLoaded.value = false
    fontsLoadedCount.value = 0

    // Reset stats
    fontLoadStats.value = {
      totalFonts: 0,
      loadedFonts: 0,
      failedFonts: 0,
      averageLoadTime: 0,
      cacheHitRate: 0,
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
    const loadPromises = fonts.map((font) => loadSingleFont(font, config))
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
        console.warn(
          `Failed to load font ${fonts[index].font_name}:`,
          result.status === 'rejected' ? result.reason : result.value.error,
        )
      }
    })

    // Update statistics
    fontLoadStats.value.averageLoadTime =
      successfulLoads.length > 0 ? totalLoadTime / successfulLoads.length : 0
    fontLoadStats.value.cacheHitRate = fonts.length > 0 ? (cacheHits / fonts.length) * 100 : 0

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
    config: FontLoadConfig = {},
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
      fromCache: false,
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

    // The library face's own normalization, trimmed by this template row's scale.
    const metrics = resolveFontMetrics(font.font, font.size_scale)

    // The metric signature is part of the key on purpose: family and URL are both
    // unchanged when a partner drags the size slider, so without it the second
    // render is served from cache, the new descriptors are never injected, and the
    // live preview stays frozen at the first size tried.
    const cacheKey = `${fontName}-${fullUrl}-${fontMetricSignature(metrics)}`
    if (fontLoadingPromises.value.has(cacheKey)) {
      return await fontLoadingPromises.value.get(cacheKey)!
    }

    // Check cache first
    const cachedEntry = globalFontCache.value.get(cacheKey)
    if (
      cachedEntry?.isLoaded &&
      Date.now() - cachedEntry.loadedAt < FONT_CONFIG.CACHE_EXPIRY_TIME
    ) {
      // A cache hit still has to re-assert the document state, because the cache
      // is keyed by metrics and the document is not. Dragging the size slider
      // 1.0 -> 0.9 -> 1.0 returns to a cached entry while the sheet and the
      // registered FontFace are both still the 0.9 ones, so skipping this would
      // strand the type at a size the partner has already moved away from.
      injectFontFaceCSS(fontName, fullUrl, metrics)
      adoptFontFace(fontName, fullUrl, cachedEntry.fontFace)

      result.success = true
      result.fromCache = true
      result.loadTime = performance.now() - startTime
      return result
    }

    // Create loading promise with retry logic
    const loadPromise = executeLoadWithRetry(
      fontName,
      fullUrl,
      metrics,
      cacheKey,
      timeout,
      maxRetries,
      display,
      result,
      startTime,
    )

    // Cache the loading promise to prevent duplicates
    fontLoadingPromises.value.set(cacheKey, loadPromise)

    try {
      return await loadPromise
    } finally {
      fontLoadingPromises.value.delete(cacheKey)
    }
  }

  /**
   * Gets the proper font format string based on file extension
   */
  const getFontFormat = (url: string): string => {
    const extension = url.toLowerCase().split('.').pop()?.split('?')[0]

    switch (extension) {
      case 'woff2':
        return 'woff2'
      case 'woff':
        return 'woff'
      case 'ttf':
        return 'truetype'
      case 'otf':
        return 'opentype'
      default:
        return 'woff2' // Default to woff2 for best compatibility
    }
  }

  /**
   * Injects font using CSS @font-face rule
   * This is more reliable across browsers, especially Safari
   *
   * `metrics` carries the size/vertical normalization for this face (see
   * `@/utils/fontMetrics`). It is emitted as `@font-face` descriptors, which
   * resize the glyphs INSIDE the em box — `font-size` still computes to the same
   * pixel value and no line box moves, so none of the showcase's hard-coded sizes
   * need to know this happened.
   */
  const injectFontFaceCSS = (
    fontName: string,
    fontUrl: string,
    metrics: ResolvedFontMetrics,
  ): void => {
    const fontFormat = getFontFormat(fontUrl)
    const descriptors = fontMetricDescriptorCss(metrics)

    // Check if style tag already exists
    let styleTag = document.getElementById('custom-fonts-css') as HTMLStyleElement
    if (!styleTag) {
      styleTag = document.createElement('style')
      styleTag.id = 'custom-fonts-css'
      document.head.appendChild(styleTag)
    }

    // Add @font-face rule with proper format
    const fontFaceRule = `
      @font-face {
        font-family: "${fontName}";
        src: url("${fontUrl}") format("${fontFormat}");
        font-display: swap;
        font-weight: 100 900;
        font-style: normal;${descriptors ? `\n        ${descriptors}` : ''}
      }
    `

    // Rewrite the sheet from the registry rather than appending, so a face
    // re-injected at a different size supersedes its old rule. Only when the rule
    // actually changed: replacing textContent re-parses every rule in the sheet,
    // and there is no reason to pay that when re-loading an unchanged font.
    const key = fontFaceKey(fontName, fontUrl)
    if (fontFaceRules.get(key) !== fontFaceRule) {
      fontFaceRules.set(key, fontFaceRule)
      styleTag.textContent = Array.from(fontFaceRules.values()).join('')
    }

    // Safari/WebKit fix: Force font to load by creating invisible element
    // Safari only downloads fonts when they're actually used on the page
    forceFontLoadInSafari(fontName)
  }

  /**
   * Makes `fontFace` the one registered under its family+URL on `document.fonts`.
   *
   * `document.fonts.add()` appends rather than replaces, so re-loading a face at a
   * new size would otherwise stack a second, differently-scaled face under the
   * same family name — with no defined answer about which one paints. Evicting the
   * previous registration is what keeps one name meaning one size.
   */
  const adoptFontFace = (fontName: string, fontUrl: string, fontFace: FontFace): void => {
    const faceKey = fontFaceKey(fontName, fontUrl)
    const superseded = documentFontFaces.get(faceKey)
    if (superseded === fontFace) return

    if (superseded) {
      try {
        document.fonts.delete(superseded)
      } catch {
        // A face the document already dropped — nothing to undo.
      }
    }
    document.fonts.add(fontFace)
    documentFontFaces.set(faceKey, fontFace)
  }

  /**
   * Forces Safari to actually download and render the font
   * Safari/WebKit only fetches fonts when they're actively used in the DOM
   */
  const forceFontLoadInSafari = (fontName: string): void => {
    // Create or get the font loader container
    let fontLoader = document.getElementById('font-loader-safari') as HTMLDivElement
    if (!fontLoader) {
      fontLoader = document.createElement('div')
      fontLoader.id = 'font-loader-safari'
      fontLoader.style.cssText = `
        position: absolute;
        left: -9999px;
        top: -9999px;
        visibility: hidden;
        pointer-events: none;
        width: 1px;
        height: 1px;
        overflow: hidden;
        opacity: 0;
      `
      document.body.appendChild(fontLoader)
    }

    // Create a span with the font applied
    const fontSpan = document.createElement('span')
    fontSpan.style.fontFamily = `"${fontName}"`
    fontSpan.textContent = 'Font Loader'
    fontSpan.setAttribute('aria-hidden', 'true')

    // Add to DOM to trigger font download
    fontLoader.appendChild(fontSpan)

    // Force browser to compute styles (triggers font download). The read itself
    // is the point — `void` keeps the deliberate side effect while making it
    // explicit that the value is discarded.
    void window.getComputedStyle(fontSpan).fontFamily

    // Clean up after a delay (font should be loaded by then)
    setTimeout(() => {
      if (fontSpan.parentNode) {
        fontSpan.parentNode.removeChild(fontSpan)
      }
    }, 2000)
  }

  /**
   * Executes font loading with retry logic
   * Uses CSS @font-face injection for better cross-browser compatibility
   */
  const executeLoadWithRetry = async (
    fontName: string,
    fullUrl: string,
    metrics: ResolvedFontMetrics,
    cacheKey: string,
    timeout: number,
    maxRetries: number,
    display: string,
    result: FontLoadResult,
    startTime: number,
  ): Promise<FontLoadResult> => {
    let lastError = ''

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Validate font URL
        if (!isValidFontUrl(fullUrl)) {
          throw new FontLoadError(`Invalid or untrusted font URL: ${fullUrl}`, {
            fontName,
            url: fullUrl,
          })
        }

        // Use CSS @font-face injection for all browsers
        // This is more reliable than FontFace API, especially on Safari
        injectFontFaceCSS(fontName, fullUrl, metrics)

        // Also use FontFace API for loading detection.
        //
        // It carries the SAME metric descriptors as the CSS rule above. Both
        // register under one family name, so a face adjusted in only one of them
        // would leave the browser holding two different sizes for that name with
        // no defined answer about which paints.
        const fontFace = new FontFace(fontName, `url("${fullUrl}")`, {
          display: display as FontDisplay,
          weight: '100 900',
          style: 'normal',
          ...fontMetricDescriptorDict(metrics),
        } as FontFaceDescriptors)

        // Load with timeout
        const loadedFont = await Promise.race([
          fontFace.load(),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new FontLoadError('Font load timeout', { fontName, url: fullUrl })),
              timeout,
            ),
          ),
        ])

        // Add to document fonts for detection
        adoptFontFace(fontName, fullUrl, loadedFont)

        // Wait for fonts to be ready
        await Promise.race([
          document.fonts.ready,
          new Promise((resolve) => setTimeout(resolve, FONT_CONFIG.FONT_READY_WAIT_TIME)),
        ])

        // Small delay to ensure font is applied
        await new Promise((resolve) => setTimeout(resolve, FONT_CONFIG.FONT_APPLY_DELAY))

        // Cache successful load
        const cacheEntry: FontCacheEntry = {
          fontFace: loadedFont,
          loadedAt: Date.now(),
          url: fullUrl,
          fontName,
          isLoaded: true,
          loadAttempts: attempt + 1,
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
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * FONT_CONFIG.RETRY_BASE_DELAY),
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
      lastError,
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

    // Remove custom fonts stylesheet, and forget the rules that were in it.
    //
    // Clearing the registry is load-bearing, not tidiness: `injectFontFaceCSS`
    // skips rewriting the sheet when a rule matches what it already recorded, so a
    // registry surviving the tag's removal would make the next mount decide every
    // rule was already present and leave the fresh, empty tag unpopulated.
    const styleTag = document.getElementById('custom-fonts-css')
    if (styleTag) {
      styleTag.remove()
    }
    fontFaceRules.clear()
    documentFontFaces.clear()

    // Remove Safari font loader
    const fontLoader = document.getElementById('font-loader-safari')
    if (fontLoader) {
      fontLoader.remove()
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
    FONT_CONFIG,
  }
}
