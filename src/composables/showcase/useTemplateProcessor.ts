import { ref, computed } from 'vue'
import type { TemplateFont, TemplateColor, TemplateAssets } from '../useEventShowcase'

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
   * Resolves media URLs to absolute paths
   */
  const getMediaUrl = (url: string): string => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
    return url.startsWith('/') ? `${API_BASE_URL}${url}` : `${API_BASE_URL}/media/${url}`
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

    return {
      primaryColor,
      secondaryColor,
      accentColor,
      guestnameColor,
      backgroundColor,
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
