import { ref, onUnmounted } from 'vue'
import { containsSuspiciousContent } from '../../utils/sanitize'

/**
 * Font preloading composable with security validation and concurrency control
 */
export function useFontPreloader() {
  const activeFontLoads = ref(0)
  const maxConcurrentFonts = 3
  const fontCache = ref<Map<string, FontFace>>(new Map())

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
      return false
    }
  }

  /**
   * Preload a font with security validation and concurrency control
   */
  const preloadFont = (url: string, signal: AbortSignal): Promise<FontFace> => {
    return new Promise(async (resolve, reject) => {
      // Check cache first
      if (fontCache.value.has(url)) {
        resolve(fontCache.value.get(url)!)
        return
      }

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
      }, 15000)

      fontFace.load()
        .then(() => {
          clearTimeout(timeout)
          cleanup()
          
          // Cache successful loads
          fontCache.value.set(url, fontFace)
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
   * Preload multiple fonts with concurrency control
   */
  const preloadFonts = async (urls: string[]): Promise<FontFace[]> => {
    const results: Promise<FontFace>[] = []

    for (const url of urls) {
      const controller = new AbortController()
      results.push(preloadFont(url, controller.signal))
    }

    return Promise.all(results)
  }

  /**
   * Clear font cache
   */
  const clearFontCache = () => {
    fontCache.value.clear()
  }

  /**
   * Get font loading statistics
   */
  const getFontStats = () => ({
    activeFontLoads: activeFontLoads.value,
    cacheSize: fontCache.value.size,
    maxConcurrent: maxConcurrentFonts
  })

  // Cleanup on unmount
  onUnmounted(() => {
    clearFontCache()
    activeFontLoads.value = 0
  })

  return {
    preloadFont,
    preloadFonts,
    clearFontCache,
    getFontStats,
    isValidFontUrl,
    fontCache: fontCache.value
  }
}