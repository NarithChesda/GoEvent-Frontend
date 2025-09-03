import { ref, computed, watch } from 'vue'
import type { TemplateFont, TemplateColor } from '../useEventShowcase'
import { useLRUCache } from '../cache/useLRUCache'

/**
 * Template processing composable
 * Handles template colors, fonts, and asset processing with performance optimizations
 */
export function useTemplateProcessor(
  templateColors: any,
  templateFonts: any,
  currentLanguage: any
) {
  // Performance caches
  const languageFontsCache = useLRUCache<any>(20, 10) // 20 items, 10MB
  const fontProcessingVersion = ref(0)

  // Watch for changes that should invalidate font cache
  watch([templateFonts, currentLanguage], () => {
    fontProcessingVersion.value++
    languageFontsCache.clear()
  })

  /**
   * Dynamic font fallback system based on language and context
   */
  const getFallbackFontStack = (fontType: 'serif' | 'sans-serif' | 'decorative' = 'sans-serif') => {
    const language = currentLanguage.value?.toLowerCase() || 'en'
    
    // Language-specific optimized fallbacks
    const languageFallbacks = {
      'km': fontType === 'serif' 
        ? '"Noto Serif Khmer", "Khmer Serif", serif' 
        : '"Noto Sans Khmer", "Khmer Sans", sans-serif',
      'en': fontType === 'serif'
        ? '"Inter", "Georgia", "Times New Roman", serif'
        : '"Inter", "Helvetica Neue", "Arial", sans-serif',
      'default': fontType === 'serif'
        ? '"Inter", "Georgia", serif'
        : '"Inter", "Helvetica Neue", sans-serif'
    }
    
    return languageFallbacks[language] || languageFallbacks.default
  }

  /**
   * Optimized language fonts processing with caching
   */
  const getLanguageFonts = computed(() => {
    const cacheKey = `${currentLanguage.value}-v${fontProcessingVersion.value}`
    
    // Check cache first - huge performance improvement for repeated access
    const cached = languageFontsCache.get(cacheKey)
    if (cached) {
      return cached
    }
    
    // Expensive computation - only run when cache miss
    const fonts = templateFonts.value || []
    const langFonts = fonts.filter((f: TemplateFont) => f.language === currentLanguage.value)
    
    // Create font type mapping
    const fontTypeMap = {
      primary: null as TemplateFont | null,
      secondary: null as TemplateFont | null,
      accent: null as TemplateFont | null,
      decorative: null as TemplateFont | null
    }
    
    // First pass: Use new font_type field if available (most efficient)
    for (const font of langFonts) {
      if (font.font_type) {
        const type = font.font_type.toLowerCase() as keyof typeof fontTypeMap
        if (type in fontTypeMap) {
          fontTypeMap[type] = font
        }
      }
    }
    
    // Second pass: Backward compatibility with name-based detection
    const remainingFonts = langFonts.filter((font: TemplateFont) => {
      return !font.font_type || !Object.values(fontTypeMap).includes(font)
    })
    
    // Optimized sorting with pre-compiled patterns
    const sortPatterns = [
      { pattern: 'primary', priority: 1 },
      { pattern: 'secondary', priority: 2 },
      { pattern: 'accent', priority: 3 },
      { pattern: 'decorative', priority: 4 }
    ]
    
    const sortedFonts = remainingFonts.sort((a: TemplateFont, b: TemplateFont) => {
      const aName = (a.font_name || '').toLowerCase()
      const bName = (b.font_name || '').toLowerCase()
      
      const aPriority = sortPatterns.find(p => aName.includes(p.pattern))?.priority ?? 999
      const bPriority = sortPatterns.find(p => bName.includes(p.pattern))?.priority ?? 999
      
      return aPriority !== bPriority ? aPriority - bPriority : ((a.id || 0) - (b.id || 0))
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
    
    // Cache the result for subsequent accesses
    languageFontsCache.set(cacheKey, fontTypeMap)
    
    return fontTypeMap
  })

  /**
   * Helper function to get font name with backward compatibility
   */
  const getFontName = (font: TemplateFont | null): string => {
    if (!font) return ''
    
    // New format: nested font object
    if (font.font?.font_file) {
      return font.font.name || ''
    }
    // Legacy format: direct font_file
    return font.font_name || ''
  }

  /**
   * Helper function to get font file path
   */
  const getFontFile = (font: TemplateFont | null): string => {
    if (!font) return ''
    
    // New format: nested font object
    if (font.font?.font_file) {
      return font.font.font_file
    }
    // Fallback to legacy font_file
    return font.font_file || ''
  }

  // Template color processing
  const primaryColor = computed(() => {
    const colors = templateColors.value || []
    const color = colors[0]
    return color?.hex_color_code || color?.hex_code || '#3B82F6'
  })

  const secondaryColor = computed(() => {
    const colors = templateColors.value || []
    const color = colors[1]
    return color?.hex_color_code || color?.hex_code || null
  })

  const accentColor = computed(() => {
    const colors = templateColors.value || []
    const color = colors[2]
    return color?.hex_color_code || color?.hex_code || primaryColor.value
  })

  // Font computeds with intelligent fallbacks
  const primaryFont = computed(() => {
    const font = getLanguageFonts.value.primary
    const customName = getFontName(font)
    
    if (customName) {
      return `"${customName}", ${getFallbackFontStack('sans-serif')}`
    }
    
    return getFallbackFontStack('sans-serif')
  })

  const secondaryFont = computed(() => {
    const font = getLanguageFonts.value.secondary
    const customName = getFontName(font)
    
    if (customName) {
      return `"${customName}", ${getFallbackFontStack('sans-serif')}`
    }
    
    return primaryFont.value
  })

  const accentFont = computed(() => {
    const font = getLanguageFonts.value.accent
    const customName = getFontName(font)
    
    if (customName) {
      return `"${customName}", ${getFallbackFontStack('decorative')}`
    }
    
    return primaryFont.value
  })

  const decorativeFont = computed(() => {
    const font = getLanguageFonts.value.decorative
    const customName = getFontName(font)
    
    if (customName) {
      return `"${customName}", ${getFallbackFontStack('decorative')}`
    }
    
    return accentFont.value
  })

  return {
    // Font processing
    getLanguageFonts,
    getFontName,
    getFontFile,
    getFallbackFontStack,
    
    // Template colors
    primaryColor,
    secondaryColor,
    accentColor,
    
    // Template fonts
    primaryFont,
    secondaryFont,
    accentFont,
    decorativeFont,
    
    // Cache management
    clearCache: () => languageFontsCache.clear(),
    getCacheStats: () => languageFontsCache.stats()
  }
}