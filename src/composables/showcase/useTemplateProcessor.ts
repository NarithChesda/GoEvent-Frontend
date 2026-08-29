import { ref, computed } from 'vue'
import type { TemplateFont, TemplateColor, TemplateAssets } from '../useEventShowcase'
import { isImageKitEnabled } from '../useImageKitConfig'
import { isResolvedMediaUrl } from '@/utils/mediaUrl'

// Regex patterns defined at module level for better performance
const MEDIA_PATH_REGEX = /\/media\/(.+)$/
const IMAGEKIT_URL_REGEX = /(https:\/\/ik\.imagekit\.io\/[^/]+)(\/.*)/

/**
 * Options for image optimization via ImageKit transformations
 */
export interface ImageOptimizationOptions {
  /** Target width in CSS pixels (will be multiplied by retina factor) */
  width?: number
  /** Target height in CSS pixels (will be multiplied by retina factor) */
  height?: number
  /** Retina multiplier (default: 2). Set to 'auto' to use window.devicePixelRatio */
  retina?: number | 'auto'
  /** Image quality (1-100). Defaults to ImageKit's auto quality */
  quality?: number
  /** Output format. 'auto' lets ImageKit choose the best format */
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png'
  /**
   * Add `c-at_max`, so a master smaller than the requested width comes back at
   * its own size instead of being enlarged. Enlarging costs bytes for zero
   * detail, which matters for every photo uploaded before the master bounds
   * were raised (see IMAGE_COMPRESSION in constants/media.ts).
   */
  noUpscale?: boolean
}

/**
 * Width rungs, in **device pixels**, offered to the browser in a responsive
 * `srcset`. The browser multiplies the CSS width in `sizes` by the device
 * pixel ratio and picks the smallest rung that covers it, which is a better
 * answer than any fixed retina multiplier we can guess at: a 3x phone stops
 * being under-served and a 1x desktop stops paying for pixels it cannot show.
 *
 * Capped at 2560 on purpose. The stored master is 3000px on its long edge, and
 * the showcase card is 85vw — so 2560 covers every viewport up to ~3000px
 * wide at 1x and every phone at 3x, without offering a rung the CDN would have
 * to invent detail for.
 */
export const RESPONSIVE_WIDTH_LADDER = [480, 640, 828, 1080, 1280, 1600, 2000, 2560] as const

/**
 * Delivery settings for event photographs, shared by the gallery grid and the
 * lightbox so both address one set of URLs. That shared cache key is the point:
 * a rung the grid has already fetched opens the lightbox instantly, and the
 * lightbox's larger rung is still warm when the viewer scrolls back past the
 * grid. Split the quality between the two surfaces and neither ever hits.
 *
 * `f-auto` is passed explicitly rather than left to the ImageKit dashboard —
 * it is the single biggest lever here, since AVIF/WebP at q82 is both smaller
 * and sharper than the default JPEG. q82 is visually transparent for
 * photographs in those formats, including full-screen.
 *
 * `noUpscale` matters most for photos uploaded while the master was capped at
 * 1080px tall: measured on a real asset, asking for w-4000 without it returned
 * 202KB of invented pixels against 57KB with it.
 */
export const PHOTO_DELIVERY = {
  format: 'auto',
  quality: 82,
  noUpscale: true,
} as const satisfies ImageOptimizationOptions

/**
 * Template Processing Composable
 *
 * Handles all template-related processing including:
 * - Font type mapping and language-specific processing
 * - Color extraction and computed properties
 * - Template asset URL resolution
 * - Cache management for processed templates
 * - Fallback handling for missing template data
 */
export function useTemplateProcessor() {
  // Font processing cache - optimized for language-specific font lookups
  // This cache stores processed font mappings by language to avoid recomputation
  const languageFontsCache = ref<Map<string, Record<string, TemplateFont | null>>>(new Map())
  const fontProcessingVersion = ref(0) // Increment to invalidate cache

  /**
   * Extracts font name from template font object
   */
  const getFontName = (font: TemplateFont | null): string => {
    if (!font) return ''
    return font.font?.name || font.font_name || ''
  }

  /**
   * Extracts font file URL from template font object
   */
  const getFontFile = (font: TemplateFont | null): string => {
    if (!font) return ''
    return font.font?.font_file || font.font_file || ''
  }

  /**
   * Resolves media URLs to absolute paths.
   *
   * `blob:`/`data:` URLs are already complete and are returned as-is — the live
   * template preview feeds unsaved uploads in as object URLs, and prefixing the
   * API base onto one produced `.../media/blob:http://...`, i.e. a broken image
   * everywhere a just-picked file was meant to appear.
   */
  const getMediaUrl = (url: string): string => {
    if (!url) return ''
    if (isResolvedMediaUrl(url)) {
      return url
    }
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
    return url.startsWith('/') ? `${API_BASE_URL}${url}` : `${API_BASE_URL}/media/${url}`
  }

  /**
   * Gets an optimized media URL with ImageKit transformations for resizing
   *
   * This function automatically converts GoEvent media URLs to ImageKit URLs
   * and applies responsive sizing transformations with retina display support.
   *
   * @param url - Original media URL (relative or absolute)
   *              Supports formats: /media/..., http://localhost:8000/media/...,
   *              https://api.goevent.online/media/...
   * @param options - Sizing and optimization options
   * @returns Optimized ImageKit URL with transformations, or original URL if not applicable
   *
   * @example
   * // Basic usage with width
   * getOptimizedMediaUrl('/media/event/photo.jpg', { width: 800 })
   * // Returns: https://ik.imagekit.io/goevent/tr:w-1600/media/event/photo.jpg
   *
   * @example
   * // Full viewport image with auto retina detection
   * getOptimizedMediaUrl(imageUrl, {
   *   width: window.innerWidth,
   *   height: window.innerHeight,
   *   retina: 'auto'
   * })
   */
  const getOptimizedMediaUrl = (
    url: string,
    options: ImageOptimizationOptions = {}
  ): string => {
    if (!url) return ''

    try {
      // First resolve to absolute URL
      let absoluteUrl = getMediaUrl(url)

      // Local, not-yet-uploaded media (the template preview's object URLs).
      // There is nothing on the CDN to transform, and a base64 `data:` payload
      // can even contain a literal "/media/" that the path regex below would
      // happily mistake for a media path.
      if (absoluteUrl.startsWith('blob:') || absoluteUrl.startsWith('data:')) {
        return absoluteUrl
      }

      // Check if ImageKit is enabled
      if (!isImageKitEnabled()) {
        // ImageKit disabled - return the resolved URL without transformations
        if (import.meta.env.DEV) {
          console.debug('[ImageKit] Disabled - using original URL')
        }
        return absoluteUrl
      }

      // Extract the media path from various URL formats and convert to ImageKit
      // Handles: /media/..., http://localhost:8000/media/..., https://api.goevent.online/media/...
      const mediaPathMatch = absoluteUrl.match(MEDIA_PATH_REGEX)
      if (mediaPathMatch) {
        // Convert to ImageKit URL
        absoluteUrl = `https://ik.imagekit.io/goevent/media/${mediaPathMatch[1]}`
      } else if (import.meta.env.DEV && !absoluteUrl.includes('ik.imagekit.io')) {
        // Only log in dev mode for non-ImageKit URLs that don't have /media/ path
        console.debug(`[ImageKit] URL does not contain /media/ path: ${absoluteUrl.substring(0, 100)}`)
      }

      // Only transform ImageKit URLs
      if (!absoluteUrl.includes('ik.imagekit.io')) {
        return absoluteUrl
      }

      // Calculate retina multiplier
      const retinaMultiplier =
        options.retina === 'auto'
          ? Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 2, 3)
          : (options.retina ?? 2)

      // Build transformation parameters
      const parts: string[] = []

      if (options.width) {
        parts.push(`w-${Math.round(options.width * retinaMultiplier)}`)
      }
      if (options.height) {
        parts.push(`h-${Math.round(options.height * retinaMultiplier)}`)
      }
      if (options.noUpscale) {
        parts.push('c-at_max')
      }
      if (options.quality) {
        parts.push(`q-${options.quality}`)
      }
      if (options.format) {
        parts.push(`f-${options.format}`)
      }

      // No transformations specified, return as-is
      if (parts.length === 0) return absoluteUrl

      const transform = `tr:${parts.join(',')}`

      // Insert transformation after ImageKit base path
      // URL format: https://ik.imagekit.io/{imagekit_id}/path/to/image.ext
      // Transformed: https://ik.imagekit.io/{imagekit_id}/tr:w-240,h-126/path/to/image.ext
      const match = absoluteUrl.match(IMAGEKIT_URL_REGEX)

      if (match) {
        return `${match[1]}/${transform}${match[2]}`
      }

      // Regex didn't match expected ImageKit URL structure
      if (import.meta.env.DEV) {
        console.warn(`[ImageKit] Could not parse ImageKit URL structure: ${absoluteUrl.substring(0, 100)}`)
      }
      return absoluteUrl
    } catch (error) {
      // Log error in dev mode and return fallback
      if (import.meta.env.DEV) {
        console.error('[ImageKit] Error optimizing media URL:', error, url)
      }
      // Return basic resolved URL as fallback
      return getMediaUrl(url)
    }
  }

  /**
   * Build a responsive `srcset` for a media URL: the same image at each rung of
   * RESPONSIVE_WIDTH_LADDER, tagged with its real pixel width.
   *
   * Pair it with a `sizes` attribute carrying the element's rendered CSS width.
   * The browser then does the arithmetic we used to hard-code — width x DPR,
   * against its own connection and cache — and picks one candidate. That is why
   * the rungs are passed with `retina: 1`: the `w` descriptor must be the
   * image's actual pixel width or the browser's selection is wrong.
   *
   * Returns '' when there is nothing to choose between: ImageKit disabled, a
   * blob:/data: URL, or a host we do not proxy all collapse to one identical
   * URL, and a srcset of identical URLs under different `w` descriptors tells
   * the browser a lie it will act on. Callers fall back to plain `src`.
   */
  const getOptimizedMediaSrcset = (
    url: string,
    options: Omit<ImageOptimizationOptions, 'width' | 'height' | 'retina'> = {},
    widths: readonly number[] = RESPONSIVE_WIDTH_LADDER,
  ): string => {
    if (!url) return ''

    const candidates = widths.map((width) => ({
      width,
      src: getOptimizedMediaUrl(url, { ...options, width, retina: 1 }),
    }))

    if (new Set(candidates.map((candidate) => candidate.src)).size <= 1) return ''

    return candidates.map(({ src, width }) => `${src} ${width}w`).join(', ')
  }

  /**
   * Processes template fonts from various formats into normalized array
   */
  const normalizeTemplateFonts = (fonts: any): TemplateFont[] => {
    if (!fonts) return []

    if (!Array.isArray(fonts)) {
      // Handle object format {language: font} -> array format
      return Object.entries(fonts).map(([lang, font]) => ({
        ...(font as TemplateFont),
        language: lang,
      }))
    }

    return fonts as TemplateFont[]
  }

  /**
   * Processes template colors from various formats
   */
  const normalizeTemplateColors = (colors: any): TemplateColor[] => {
    if (!colors || !Array.isArray(colors)) return []
    return colors as TemplateColor[]
  }

  /**
   * Computed property that processes template fonts for a specific language
   * Uses intelligent caching to avoid repeated processing of font mappings
   * Maps fonts by type (primary, secondary, accent, decorative) with fallbacks
   */
  const getLanguageFonts = (fonts: TemplateFont[], currentLanguage: string) => {
    const cacheKey = `${currentLanguage}-v${fontProcessingVersion.value}`

    // Return cached result if available
    if (languageFontsCache.value.has(cacheKey)) {
      return languageFontsCache.value.get(cacheKey)
    }

    // Process fonts for current language
    const langFonts = fonts.filter((f) => f.language === currentLanguage)

    const fontTypeMap = {
      primary: null as TemplateFont | null,
      secondary: null as TemplateFont | null,
      accent: null as TemplateFont | null,
      decorative: null as TemplateFont | null,
    }

    // First pass: Use font_type field if available
    for (const font of langFonts) {
      if (font.font_type) {
        const type = font.font_type.toLowerCase() as keyof typeof fontTypeMap
        if (type in fontTypeMap) {
          fontTypeMap[type] = font
        }
      }
    }

    // Second pass: Backward compatibility with name-based detection
    const remainingFonts = langFonts.filter((font) => {
      return !font.font_type || !Object.values(fontTypeMap).includes(font)
    })

    // Font type priority patterns
    const sortPatterns = [
      { pattern: 'primary', priority: 1 },
      { pattern: 'secondary', priority: 2 },
      { pattern: 'accent', priority: 3 },
      { pattern: 'decorative', priority: 4 },
    ]

    const sortedFonts = remainingFonts.sort((a, b) => {
      const aName = (a.font_name || '').toLowerCase()
      const bName = (b.font_name || '').toLowerCase()

      const aPriority = sortPatterns.find((p) => aName.includes(p.pattern))?.priority ?? 999
      const bPriority = sortPatterns.find((p) => bName.includes(p.pattern))?.priority ?? 999

      return aPriority !== bPriority ? aPriority - bPriority : (a.id || 0) - (b.id || 0)
    })

    // Fill in missing font types from sorted fonts
    let fontIndex = 0
    if (!fontTypeMap.primary && sortedFonts[fontIndex]) {
      fontTypeMap.primary = sortedFonts[fontIndex++]
    }
    if (!fontTypeMap.secondary && sortedFonts[fontIndex]) {
      fontTypeMap.secondary = sortedFonts[fontIndex++]
    }
    if (!fontTypeMap.accent && sortedFonts[fontIndex]) {
      fontTypeMap.accent = sortedFonts[fontIndex++]
    }
    if (!fontTypeMap.decorative && sortedFonts[fontIndex]) {
      fontTypeMap.decorative = sortedFonts[fontIndex++]
    }

    // Ensure fallbacks for essential font types
    fontTypeMap.secondary = fontTypeMap.secondary || fontTypeMap.primary
    fontTypeMap.accent = fontTypeMap.accent || fontTypeMap.primary
    fontTypeMap.decorative = fontTypeMap.decorative || fontTypeMap.secondary || fontTypeMap.primary

    // Cache result
    languageFontsCache.value.set(cacheKey, fontTypeMap)
    return fontTypeMap as Record<string, TemplateFont | null>
  }

  /**
   * Creates font CSS declarations with fallbacks
   */
  const createFontDeclaration = (
    font: TemplateFont | null,
    fallbackStack: string,
    fontsLoaded: boolean,
  ): string => {
    if (!font || !fontsLoaded) return fallbackStack

    const customName = getFontName(font)
    if (customName) {
      return `"${customName}", ${fallbackStack}`
    }

    return fallbackStack
  }

  /**
   * Extracts template colors with proper fallbacks
   * Uses name-based extraction for all colors to prevent index conflicts
   */
  const extractTemplateColors = (templateColors: TemplateColor[]) => {
    // Extract primary color by name first, fallback to index 0
    const primaryColorObj = templateColors?.find(
      (color) => color.name?.toLowerCase() === 'primary'
    )
    const primaryColor =
      primaryColorObj?.hex_color_code ||
      primaryColorObj?.hex_code ||
      templateColors?.[0]?.hex_color_code ||
      templateColors?.[0]?.hex_code ||
      '#3B82F6'

    // Extract secondary color by name first, fallback to index 1
    const secondaryColorObj = templateColors?.find(
      (color) => color.name?.toLowerCase() === 'secondary'
    )
    const secondaryColor =
      secondaryColorObj?.hex_color_code ||
      secondaryColorObj?.hex_code ||
      templateColors?.[1]?.hex_color_code ||
      templateColors?.[1]?.hex_code ||
      null

    // Extract accent color by name first, fallback to index 2, then primary
    const accentColorObj = templateColors?.find(
      (color) => color.name?.toLowerCase() === 'accent'
    )
    const accentColor =
      accentColorObj?.hex_color_code ||
      accentColorObj?.hex_code ||
      templateColors?.[2]?.hex_color_code ||
      templateColors?.[2]?.hex_code ||
      primaryColor

    // Extract guestname color by name
    const guestnameColorObj = templateColors?.find(
      (color) => color.name?.toLowerCase() === 'guestname'
    )
    const guestnameColor = guestnameColorObj?.hex_color_code || guestnameColorObj?.hex_code || null

    // Extract background color by name with fallback chain
    let backgroundColor: string | null = null
    if (templateColors) {
      // First, try to find a color named "background"
      const backgroundColorObj = templateColors.find(
        (color) => color.name?.toLowerCase() === 'background'
      )
      if (backgroundColorObj) {
        backgroundColor = backgroundColorObj.hex_color_code || backgroundColorObj.hex_code || null
      } else {
        // Second, try to find a color named "primary"
        const primaryColorObj = templateColors.find(
          (color) => color.name?.toLowerCase() === 'primary'
        )
        if (primaryColorObj) {
          backgroundColor = primaryColorObj.hex_color_code || primaryColorObj.hex_code || null
        }
      }
    }
    // Final fallback to primaryColor
    if (!backgroundColor) {
      backgroundColor = primaryColor
    }

    // Extract template color by name
    const templateColorObj = templateColors?.find(
      (color) => color.name?.toLowerCase() === 'template'
    )
    const templateColor = templateColorObj?.hex_color_code || templateColorObj?.hex_code || null

    // Extract blur-effect color by name, fallback to white
    const blurEffectColorObj = templateColors?.find(
      (color) => color.name?.toLowerCase() === 'blur-effect'
    )
    const blurEffectColor = blurEffectColorObj?.hex_color_code || blurEffectColorObj?.hex_code || '#ffffff'

    return {
      primaryColor,
      secondaryColor,
      accentColor,
      guestnameColor,
      backgroundColor,
      templateColor,
      blurEffectColor,
    }
  }

  /**
   * Extracts template assets with URL resolution
   */
  const extractTemplateAssets = (templateAssets?: TemplateAssets) => {
    if (!templateAssets?.assets) return null

    const assets = templateAssets.assets

    return {
      openEnvelopeButton: assets.open_envelope_button
        ? getMediaUrl(assets.open_envelope_button)
        : null,
      basicDecorationPhoto: assets.basic_decoration_photo
        ? getMediaUrl(assets.basic_decoration_photo)
        : null,
      basicBackgroundPhoto: assets.basic_background_photo
        ? getMediaUrl(assets.basic_background_photo)
        : null,
      standardCoverVideo: assets.standard_cover_video
        ? getMediaUrl(assets.standard_cover_video)
        : null,
      standardBackgroundVideo: assets.standard_background_video
        ? getMediaUrl(assets.standard_background_video)
        : null,
    }
  }

  /**
   * Processes SVG icons with template color replacement
   * Used for agenda items and other UI elements
   */
  const processSVGWithColors = (
    svgCode: string,
    colors: { primary: string; secondary?: string; accent: string },
  ): string => {
    if (!svgCode) return ''

    // Replace common color placeholders with template colors
    let processedSVG = svgCode
      .replace(/fill="currentColor"/g, `fill="${colors.primary}"`)
      .replace(/stroke="currentColor"/g, `stroke="${colors.primary}"`)
      .replace(/fill="#000"/g, `fill="${colors.primary}"`)
      .replace(/fill="#000000"/g, `fill="${colors.primary}"`)
      .replace(/stroke="#000"/g, `stroke="${colors.primary}"`)
      .replace(/stroke="#000000"/g, `stroke="${colors.primary}"`)

    // Replace accent colors if secondary color is available
    if (colors.secondary) {
      processedSVG = processedSVG
        .replace(/fill="#666"/g, `fill="${colors.secondary}"`)
        .replace(/fill="#666666"/g, `fill="${colors.secondary}"`)
        .replace(/stroke="#666"/g, `stroke="${colors.secondary}"`)
        .replace(/stroke="#666666"/g, `stroke="${colors.secondary}"`)
    }

    return processedSVG
  }

  /**
   * Invalidate font processing cache (useful when language changes)
   */
  const invalidateFontCache = (): void => {
    fontProcessingVersion.value++
    languageFontsCache.value.clear()
  }

  /**
   * Get template processing statistics
   */
  const getProcessingStats = () => {
    return {
      cacheSize: languageFontsCache.value.size,
      cacheVersion: fontProcessingVersion.value,
    }
  }

  /**
   * Clear all processing caches
   */
  const clearCaches = (): void => {
    languageFontsCache.value.clear()
  }

  return {
    // Font processing
    getFontName,
    getFontFile,
    getLanguageFonts,
    createFontDeclaration,
    normalizeTemplateFonts,

    // Color processing
    normalizeTemplateColors,
    extractTemplateColors,

    // Asset processing
    extractTemplateAssets,
    getMediaUrl,
    getOptimizedMediaUrl,
    getOptimizedMediaSrcset,

    // SVG processing
    processSVGWithColors,

    // Cache management
    invalidateFontCache,
    getProcessingStats,
    clearCaches,

    // State (readonly)
    fontProcessingVersion: computed(() => fontProcessingVersion.value),
  }
}
