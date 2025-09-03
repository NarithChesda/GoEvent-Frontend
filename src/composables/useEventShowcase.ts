// Imports - Vue Core
import { ref, computed, nextTick, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

// Imports - Services & API
import { eventsService, type EventPaymentMethod } from '../services/api'

// Imports - Composables
import { usePerformance, ResourceManager } from '../utils/performance'

// Imports - Utilities
import { updateMetaTags, getBestEventImage, createEventDescription } from '../utils/metaUtils'

// ============================
// Type Definitions
// ============================
export interface Host {
  id: number
  name: string
  title?: string
  bio?: string
  profile_image?: string
  order?: number
  parent_a_name?: string
  parent_b_name?: string
}

export interface AgendaItemIcon {
  id: number
  name: string
  svg_code: string
}

export interface AgendaItem {
  id: number
  title: string
  description?: string
  color?: string
  date?: string
  start_time_text?: string
  end_time_text?: string
  order?: number
  icon?: AgendaItemIcon
}

export interface EventText {
  id: number
  text_type: string
  language: string
  title?: string
  content: string
  order?: number
}

export interface TemplateColor {
  id?: number
  hex_color_code?: string
  hex_code?: string
  name?: string
}

export interface TemplateFont {
  id?: number
  language: string
  font_name: string
  font_file?: string
  font_type?: string
  font_type_display?: string
  font?: {
    name: string
    font_file: string
  }
}

export interface FontLoadConfig {
  timeout?: number
  retryAttempts?: number
  fallbackFonts?: string[]
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional'
}

export interface FontCacheEntry {
  fontFace: FontFace
  loadedAt: number
  url: string
  fontName: string
  isLoaded: boolean
  loadAttempts: number
  lastError?: string
}

export interface FontLoadResult {
  success: boolean
  fontName: string
  url: string
  loadTime: number
  fromCache: boolean
  error?: string
}

export interface FontLoadStats {
  totalFonts: number
  loadedFonts: number
  failedFonts: number
  averageLoadTime: number
  cacheHitRate: number
}

export interface TemplateAssets {
  template?: {
    id: number
    name: string
    preview_image?: string
  }
  assets?: {
    open_envelope_button?: string
    basic_decoration_photo?: string
    basic_background_photo?: string
    standard_cover_video?: string
    standard_background_video?: string
  }
  colors?: TemplateColor[]
  fonts?: TemplateFont[]
}

export interface EventPhoto {
  id: number
  event: string
  image: string
  caption: string
  order: number
  is_featured: boolean
  created_at: string
}

export interface EventData {
  id: string
  title: string
  description?: string
  short_description?: string
  start_date: string
  end_date: string
  location?: string
  virtual_link?: string
  is_virtual?: boolean
  banner_image?: string
  logo_one?: string
  logo_two?: string
  event_video?: string
  music?: string
  google_map_embed_link?: string
  youtube_embed_link?: string
  registration_required?: boolean
  category?: number | null
  category_name?: string | null
  category_color?: string | null
  category_details?: {
    id: number
    name: string
    description: string
    color: string
    icon: string
  }
  template_assets?: TemplateAssets
  template_colors?: TemplateColor[]
  template_fonts?: TemplateFont[]
  event_texts?: EventText[]
  hosts?: Host[]
  agenda_items?: AgendaItem[]
  event_photos?: EventPhoto[]
  photos?: EventPhoto[]
  payment_methods?: EventPaymentMethod[]
  available_languages?: Array<{ id: number; language: string; language_display: string }>
}

export interface ShowcaseData {
  event: EventData
  meta: {
    language?: string
    guest_name?: string
    available_languages?: Array<{ code: string; display: string }>
    template_enabled?: boolean
  }
}

// ============================
// Main Composable
// ============================
export function useEventShowcase() {
  const route = useRoute()

  // ============================
  // External Composables
  // ============================

  const {
    deduplicateRequest,
    addCleanup,
    cleanup: cleanupPerformance
  } = usePerformance()

  const resourceManager = new ResourceManager()

  // ============================
  // State Management
  // ============================
  // Core state
  const loading = ref(false)
  const error = ref<string | null>(null)
  const showcaseData = ref<ShowcaseData | null>(null)
  
  // Language state
  const urlLang = route.query.lang as string || 'kh'
  const currentLanguage = ref(urlLang)
  
  // UI state
  const isEnvelopeOpened = ref(false)
  const isPlayingEventVideo = ref(false)
  const videoLoading = ref(false)
  const coverStageReady = ref(false)
  
  // Media state
  const eventVideoRef = ref<HTMLVideoElement | null>(null)
  const audioRef = ref<HTMLAudioElement | null>(null)
  const isMusicPlaying = ref(false)
  
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
  const fontLoadingPromises = ref<Map<string, Promise<FontLoadResult>>>(new Map())
  
  // Enhanced font cache with memory management
  const globalFontCache = ref<Map<string, FontCacheEntry>>(new Map())
  const maxCacheSize = 50 // Maximum cached font entries
  const cacheExpiryTime = 30 * 60 * 1000 // 30 minutes
  
  // Photo modal state
  const isPhotoModalOpen = ref(false)
  const currentModalPhoto = ref<EventPhoto | null>(null)

  // ============================
  // Computed Properties
  // ============================
  const event = computed(() => showcaseData.value?.event || {} as EventData)
  const meta = computed(() => showcaseData.value?.meta || {})
  const guestName = computed(() => {
    const guestNameFromQuery = route.query.guest_name
    const guestNameStr = Array.isArray(guestNameFromQuery) ? guestNameFromQuery[0] : guestNameFromQuery
    return meta.value.guest_name || guestNameStr || ''
  })
  const templateAssets = computed(() => event.value?.template_assets?.assets || null)
  
  const templateColors = computed(() => {
    const colors = event.value?.template_colors || event.value?.template_assets?.colors || []
    return colors
  })
  
  const templateFonts = computed(() => {
    const fonts = event.value?.template_fonts || event.value?.template_assets?.fonts
    
    if (fonts && !Array.isArray(fonts)) {
      return Object.entries(fonts).map(([lang, font]) => ({
        ...(font as TemplateFont),
        language: lang
      }))
    }
    
    const fontList = fonts || [] as TemplateFont[]
    return fontList
  })
  
  // Font processing cache
  const languageFontsCache = ref<Map<string, Record<string, TemplateFont | null>>>(new Map())
  const fontProcessingVersion = ref(0)

  const getLanguageFonts = computed(() => {
    const cacheKey = `${currentLanguage.value}-v${fontProcessingVersion.value}`
    
    // Return cached result if available
    if (languageFontsCache.value.has(cacheKey)) {
      return languageFontsCache.value.get(cacheKey)
    }
    
    // Process fonts for current language
    const langFonts = templateFonts.value.filter(f => f.language === currentLanguage.value)
    
    const fontTypeMap = {
      primary: null as TemplateFont | null,
      secondary: null as TemplateFont | null,
      accent: null as TemplateFont | null,
      decorative: null as TemplateFont | null
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
    const remainingFonts = langFonts.filter(font => {
      return !font.font_type || !Object.values(fontTypeMap).includes(font)
    })
    
    // Font type priority patterns
    const sortPatterns = [
      { pattern: 'primary', priority: 1 },
      { pattern: 'secondary', priority: 2 },
      { pattern: 'accent', priority: 3 },
      { pattern: 'decorative', priority: 4 }
    ]
    
    const sortedFonts = remainingFonts.sort((a, b) => {
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
    
    // Cache result
    languageFontsCache.value.set(cacheKey, fontTypeMap)
    return fontTypeMap as Record<string, TemplateFont | null>
  })
  
  // Font computed properties with null checks
  const primaryFont = computed(() => {
    const langFonts = getLanguageFonts.value
    if (!langFonts) return getFallbackFontStack('sans-serif')
    
    const font = langFonts.primary
    const customName = getFontName(font)
    
    if (customName && fontsLoaded.value) {
      return `"${customName}", ${getFallbackFontStack('sans-serif')}`
    }
    
    return getFallbackFontStack('sans-serif')
  })
  
  const secondaryFont = computed(() => {
    const langFonts = getLanguageFonts.value
    if (!langFonts) return primaryFont.value
    
    const font = langFonts.secondary
    const customName = getFontName(font)
    
    if (customName && fontsLoaded.value) {
      return `"${customName}", ${getFallbackFontStack('sans-serif')}`
    }
    
    return primaryFont.value
  })
  
  const accentFont = computed(() => {
    const langFonts = getLanguageFonts.value
    if (!langFonts) return primaryFont.value
    
    const font = langFonts.accent
    const customName = getFontName(font)
    
    if (customName && fontsLoaded.value) {
      return `"${customName}", ${getFallbackFontStack('decorative')}`
    }
    
    return primaryFont.value
  })
  
  const decorativeFont = computed(() => {
    const langFonts = getLanguageFonts.value
    if (!langFonts) return accentFont.value
    
    const font = langFonts.decorative
    const customName = getFontName(font)
    
    if (customName && fontsLoaded.value) {
      return `"${customName}", ${getFallbackFontStack('decorative')}`
    }
    
    return accentFont.value
  })

  // Deprecated: Use primaryFont instead
  const currentFont = computed(() => primaryFont.value)
  
  const eventTexts = computed(() => event.value?.event_texts || [] as EventText[])
  const hosts = computed(() => event.value?.hosts || [] as Host[])
  const agendaItems = computed(() => event.value?.agenda_items || [] as AgendaItem[])
  
  // Photo sorting with cache
  const photosCache = ref<{ version: number, sorted: EventPhoto[] }>({ version: -1, sorted: [] })
  
  const eventPhotos = computed(() => {
    const photos = event.value?.photos || event.value?.event_photos || []
    if (photos.length === 0) return []
    
    const currentVersion = photos.length + (photos[0]?.id || 0) + (photos[0]?.order || 0)
    
    if (photosCache.value.version === currentVersion && photosCache.value.sorted.length === photos.length) {
      return photosCache.value.sorted
    }
    
    const sorted = [...photos].sort((a, b) => (a.order || 0) - (b.order || 0))
    photosCache.value = { version: currentVersion, sorted }
    
    return sorted
  })

  const paymentMethods = computed(() => {
    const methods = event.value?.payment_methods || []
    if (methods.length === 0) return []
    
    return methods
      .filter(method => method.is_active)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  })

  const availableLanguages = computed(() => event.value?.available_languages || [])
  
  const primaryColor = computed(() => {
    const color = templateColors.value[0]
    return color?.hex_color_code || color?.hex_code || '#3B82F6'
  })
  
  const secondaryColor = computed(() => {
    const color = templateColors.value[1]
    return color?.hex_color_code || color?.hex_code || null
  })
  
  const accentColor = computed(() => {
    const color = templateColors.value[2]
    return color?.hex_color_code || color?.hex_code || primaryColor.value
  })
  
  const isEventPast = computed(() => {
    if (!event.value?.end_date) return false
    return new Date(event.value.end_date) < new Date()
  })

  const eventVideoUrl = computed(() => {
    if (event.value?.event_video) {
      return getMediaUrl(event.value.event_video)
    }
    return null
  })

  const backgroundVideoUrl = computed(() => {
    if (event.value?.template_assets?.assets?.standard_background_video) {
      return getMediaUrl(event.value.template_assets.assets.standard_background_video)
    }
    return null
  })

  const eventMusicUrl = computed(() => {
    if (event.value?.music) {
      return getMediaUrl(event.value.music)
    }
    return null
  })

  const isEnvelopeButtonReady = computed(() => true)

  // ============================
  // Helper Functions
  // ============================
  const getFallbackFontStack = (fontType: 'serif' | 'sans-serif' | 'decorative' = 'sans-serif') => {
    const language = currentLanguage.value.toLowerCase()
    
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
    
    return languageFallbacks[language] || languageFallbacks['default']
  }
  
  const getFontName = (font: TemplateFont | null): string => {
    if (!font) return ''
    return font.font?.name || font.font_name || ''
  }
  
  const getFontFile = (font: TemplateFont | null): string => {
    if (!font) return ''
    return font.font?.font_file || font.font_file || ''
  }
  
  const getMediaUrl = (url: string): string => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
    return url.startsWith('/') ? `${API_BASE_URL}${url}` : `${API_BASE_URL}/media/${url}`
  }

  const isValidFontUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') {
      return false
    }

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
      
      if (!allowedProtocols.includes(urlObj.protocol)) {
        return false
      }

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

      // Domain validation
      const suspiciousDomains = isDevelopment 
        ? ['0.0.0.0']
        : ['localhost', '127.0.0.1', '0.0.0.0', '::1']
        
      if (suspiciousDomains.includes(hostname)) {
        return false
      }

      // Extension validation
      const validExtensions = ['.woff', '.woff2', '.ttf', '.otf', '.eot']
      const hasValidExtension = validExtensions.some(ext => 
        urlObj.pathname.toLowerCase().endsWith(ext)
      )

      return hasValidExtension

    } catch {
      return false
    }
  }

  const sanitizeFontName = (fontName: string): string => {
    if (!fontName || typeof fontName !== 'string') {
      return ''
    }
    
    // Remove potentially dangerous characters
    return fontName
      .replace(/[<>"'&\\]/g, '')
      .replace(/[^a-zA-Z0-9\s\-_]/g, '')
      .trim()
      .substring(0, 100) // Limit length
  }

  const manageFontCacheMemory = () => {
    const cache = globalFontCache.value
    const now = Date.now()
    
    // Remove expired entries
    for (const [key, entry] of cache.entries()) {
      if (now - entry.loadedAt > cacheExpiryTime) {
        try {
          document.fonts.delete(entry.fontFace)
        } catch {
          // Ignore cleanup errors
        }
        cache.delete(key)
      }
    }
    
    // If still over limit, remove oldest entries
    if (cache.size > maxCacheSize) {
      const sortedEntries = Array.from(cache.entries())
        .sort((a, b) => a[1].loadedAt - b[1].loadedAt)
      
      const toRemove = sortedEntries.slice(0, cache.size - maxCacheSize)
      for (const [key, entry] of toRemove) {
        try {
          document.fonts.delete(entry.fontFace)
        } catch {
          // Ignore cleanup errors
        }
        cache.delete(key)
      }
    }
  }

  // ============================
  // Core Methods
  // ============================
  const loadShowcase = async (forceLanguage?: string) => {
    const eventId = route.params.id as string
    if (!eventId) {
      error.value = 'Invalid event ID'
      return
    }

    const language = forceLanguage || route.query.lang as string || currentLanguage.value
    const guest = guestName.value || ''
    const requestKey = `showcase-${eventId}-${language}-${guest}`

    try {
      const data = await deduplicateRequest(requestKey, async () => {
        loading.value = true
        error.value = null

        if (forceLanguage) {
          currentLanguage.value = forceLanguage
        } else {
          const urlLanguage = route.query.lang as string
          if (urlLanguage) {
            currentLanguage.value = urlLanguage
          }
        }
        
        const params: { lang?: string; guest_name?: string } = {
          lang: currentLanguage.value
        }
        
        if (guestName.value) {
          params.guest_name = guestName.value as string
        }

        const showcaseResponse = await eventsService.getEventShowcase(eventId, params)

        if (!showcaseResponse.success || !showcaseResponse.data) {
          throw new Error(showcaseResponse.message || 'Failed to load event invitation')
        }

        return showcaseResponse.data
      })

      showcaseData.value = data
      
      if (data.meta?.language) {
        currentLanguage.value = data.meta.language
      }

      // Update meta tags for social sharing
      updateEventMetaTags(data.event)

      // Load custom fonts asynchronously with progressive enhancement
      loadCustomFonts({ 
        display: 'swap',
        timeout: 5000,
        retryAttempts: 2
      }).catch(() => {
        // Silently fall back to system fonts
      })
      
    } catch (err: unknown) {
      error.value = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 
                   (err as Error)?.message || 
                   'Failed to load event invitation'
    } finally {
      loading.value = false
    }
  }

  // ============================
  // Meta Tags Management
  // ============================
  const updateEventMetaTags = (event: Record<string, unknown>) => {
    if (!event) return

    const eventImage = getBestEventImage(event)
    const eventDescription = createEventDescription(event)
    const eventTitle = `${event.title as string} - GoEvent`
    
    const startDate = event.start_date ? new Date(event.start_date as string).toISOString() : undefined
    
    const organizerDetails = event.organizer_details as { first_name?: string; last_name?: string; username?: string } | undefined
    const organizerName = organizerDetails
      ? `${organizerDetails.first_name || ''} ${organizerDetails.last_name || ''}`.trim() || organizerDetails.username || 'GoEvent'
      : 'GoEvent'

    const metaData = {
      title: eventTitle,
      description: eventDescription,
      image: eventImage,
      url: `${window.location.origin}/events/${event.id as string}/showcase`,
      siteName: 'GoEvent',
      type: 'website',
      locale: currentLanguage.value === 'kh' ? 'kh_KH' : 'en_US',
      author: organizerName,
      publishedTime: startDate,
      location: (event.location as string) || undefined
    }

    updateMetaTags(metaData)
  }

  // ============================
  // Enhanced Font Loading System
  // ============================
  const loadCustomFonts = async (config?: FontLoadConfig) => {
    const finalConfig = config || {}
    const startTime = performance.now()
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
    
    const langFonts = templateFonts.value.filter(f => f.language === currentLanguage.value)
    
    if (langFonts.length === 0) {
      fontsLoaded.value = true
      await nextTick()
      return []
    }
    
    fontLoadStats.value.totalFonts = langFonts.length
    
    // Cleanup cache memory before loading
    manageFontCacheMemory()
    
    // Load fonts with progressive enhancement
    const loadPromises = langFonts.map(font => loadSingleFontEnhanced(font, finalConfig))
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
        console.warn(`Failed to load font ${langFonts[index].font_name}:`, 
          result.status === 'rejected' ? result.reason : result.value.error)
      }
    })
    
    // Update statistics
    fontLoadStats.value.averageLoadTime = successfulLoads.length > 0 
      ? totalLoadTime / successfulLoads.length 
      : 0
    fontLoadStats.value.cacheHitRate = langFonts.length > 0 
      ? (cacheHits / langFonts.length) * 100 
      : 0
    
    fontsLoadedCount.value = fontLoadStats.value.loadedFonts
    fontsLoaded.value = true
    
    const totalTime = performance.now() - startTime
    console.debug(`Font loading completed in ${totalTime.toFixed(2)}ms:`, fontLoadStats.value)
    
    await nextTick()
    return successfulLoads
  }
  
  const loadSingleFontEnhanced = async (
    font: TemplateFont, 
    config: FontLoadConfig = {}
  ): Promise<FontLoadResult> => {
    const startTime = performance.now()
    const fontName = sanitizeFontName(getFontName(font))
    const fontFile = getFontFile(font)
    const timeout = config.timeout || 5000 // 5 second default timeout
    const maxRetries = config.retryAttempts || 2
    const display = config.display || 'swap'
    
    const result: FontLoadResult = {
      success: false,
      fontName,
      url: '',
      loadTime: 0,
      fromCache: false
    }
    
    if (!fontFile || !fontName) {
      result.error = 'Missing font file or name'
      return result
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
    if (cachedEntry && cachedEntry.isLoaded && 
        (Date.now() - cachedEntry.loadedAt < cacheExpiryTime)) {
      result.success = true
      result.fromCache = true
      result.loadTime = performance.now() - startTime
      return result
    }
    
    const loadPromise = (async (): Promise<FontLoadResult> => {
      let lastError = ''
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (!isValidFontUrl(fullUrl)) {
            throw new Error('Invalid or untrusted font URL')
          }

          // Create FontFace with progressive enhancement
          const fontFace = new FontFace(
            fontName, 
            `url(${fullUrl})`,
            {
              display,
              // Add font-variation-settings if needed
              ...(font.font_type?.includes('variable') && {
                variationSettings: 'normal'
              })
            }
          )
          
          // Load with timeout
          const loadedFont = await Promise.race([
            fontFace.load(),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Font load timeout')), timeout)
            )
          ])
          
          // Add to document fonts
          document.fonts.add(loadedFont)
          
          // Wait for font to be ready with timeout
          await Promise.race([
            document.fonts.ready,
            new Promise(resolve => setTimeout(resolve, 1000)) // Max 1s wait
          ])
          
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
          
          result.success = true
          result.loadTime = performance.now() - startTime
          
          // Small delay to ensure browser has applied the font
          await new Promise(resolve => setTimeout(resolve, 50))
          
          return result
          
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Unknown error'
          
          if (attempt < maxRetries) {
            // Exponential backoff for retries
            await new Promise(resolve => 
              setTimeout(resolve, Math.pow(2, attempt) * 500)
            )
          }
        }
      }
      
      // All attempts failed
      result.error = `Failed after ${maxRetries + 1} attempts: ${lastError}`
      result.loadTime = performance.now() - startTime
      
      // Cache failed attempt to prevent repeated requests
      const failedEntry: FontCacheEntry = {
        fontFace: new FontFace(fontName, 'url()'), // Dummy font face
        loadedAt: Date.now(),
        url: fullUrl,
        fontName,
        isLoaded: false,
        loadAttempts: maxRetries + 1,
        lastError
      }
      
      globalFontCache.value.set(cacheKey, failedEntry)
      
      return result
    })()
    
    fontLoadingPromises.value.set(cacheKey, loadPromise)
    
    try {
      const finalResult = await loadPromise
      return finalResult
    } finally {
      fontLoadingPromises.value.delete(cacheKey)
    }
  }

  // ============================
  // Media Management
  // ============================
  const initializeAudio = () => {
    if (eventMusicUrl.value && !audioRef.value) {
      audioRef.value = new Audio(eventMusicUrl.value)
      audioRef.value.loop = true
      audioRef.value.volume = 0.35
      
      addCleanup(() => {
        if (audioRef.value) {
          audioRef.value.pause()
          audioRef.value.src = ''
          audioRef.value = null
        }
      })
    }
  }

  const playMusic = async () => {
    if (!audioRef.value || !eventMusicUrl.value) return

    try {
      await audioRef.value.play()
      isMusicPlaying.value = true
    } catch {
      isMusicPlaying.value = false
    }
  }

  const pauseMusic = () => {
    if (audioRef.value) {
      audioRef.value.pause()
      isMusicPlaying.value = false
    }
  }

  const toggleMusic = () => {
    if (isMusicPlaying.value) {
      pauseMusic()
    } else {
      playMusic()
    }
  }

  // ============================
  // Stage Flow Management
  // ============================
  const openEnvelope = async () => {
    isEnvelopeOpened.value = true
    
    if (eventVideoUrl.value) {
      isPlayingEventVideo.value = true
      
      initializeAudio()
      if (eventMusicUrl.value) {
        playMusic()
      }
      
      await nextTick()
      if (eventVideoRef.value) {
        eventVideoRef.value.muted = false
        eventVideoRef.value.play().catch(() => {
          // Try playing muted if unmuted fails
          if (eventVideoRef.value) {
            eventVideoRef.value.muted = true
            eventVideoRef.value.play()
          }
        })
      }
    } else {
      setTimeout(() => {
        isPlayingEventVideo.value = false
        initializeAudio()
        if (eventMusicUrl.value) {
          playMusic()
        }
      }, 1000)
    }
  }

  const onVideoCanPlay = () => {
    videoLoading.value = false
  }

  const onEventVideoEnded = () => {
    isPlayingEventVideo.value = false
  }

  const onEventVideoError = () => {
    isPlayingEventVideo.value = false
    
    if (!audioRef.value) {
      initializeAudio()
      if (eventMusicUrl.value) {
        playMusic()
      }
    }
  }

  // ============================
  // User Interactions
  // ============================
  const openGoogleMap = () => {
    if (event.value?.google_map_embed_link) {
      let mapUrl = event.value.google_map_embed_link
      
      if (mapUrl.includes('/embed?')) {
        mapUrl = mapUrl.replace('/embed?', '/search?')
        mapUrl = mapUrl.replace('https://www.google.com/maps', 'https://maps.google.com')
      }
      
      window.open(mapUrl, '_blank')
    }
  }

  const openPhotoModal = (photo: EventPhoto) => {
    currentModalPhoto.value = photo
    isPhotoModalOpen.value = true
  }

  const closePhotoModal = () => {
    isPhotoModalOpen.value = false
    currentModalPhoto.value = null
  }

  const navigateToPhoto = (photo: EventPhoto) => {
    currentModalPhoto.value = photo
  }

  const changeLanguage = async (newLanguage: string) => {
    if (currentLanguage.value === newLanguage) return
    
    await loadShowcase(newLanguage)
  }

  // ============================
  // Stage Management
  // ============================
  const handleCoverStageReady = () => {
    coverStageReady.value = true
  }

  // ============================
  // Watchers
  // ============================
  watch([templateFonts, currentLanguage], () => {
    fontProcessingVersion.value++
    languageFontsCache.value.clear()
  })

  // ============================
  // Lifecycle Hooks
  // ============================
  onUnmounted(() => {
    if (audioRef.value) {
      audioRef.value.pause()
      audioRef.value.src = ''
      audioRef.value = null
    }
    
    if (eventVideoRef.value) {
      eventVideoRef.value.pause()
      eventVideoRef.value.src = ''
      eventVideoRef.value = null
    }
    
    cleanupPerformance()
    resourceManager.destroy()
    
    // Clean up font resources
    fontLoadingPromises.value.clear()
    
    // Cleanup global font cache (keep recently used)
    const now = Date.now()
    for (const [key, entry] of globalFontCache.value.entries()) {
      if (now - entry.loadedAt > cacheExpiryTime || !entry.isLoaded) {
        try {
          document.fonts.delete(entry.fontFace)
        } catch {
          // Ignore cleanup errors
        }
        globalFontCache.value.delete(key)
      }
    }
    
    photosCache.value = { version: -1, sorted: [] }
    showcaseData.value = null
    error.value = null
    currentModalPhoto.value = null
  })

  // ============================
  // Return Public API
  // ============================
  return {
    // State
    loading,
    error,
    showcaseData,
    currentLanguage,
    isEnvelopeOpened,
    isPlayingEventVideo,
    videoLoading,
    eventVideoRef,
    isPhotoModalOpen,
    currentModalPhoto,
    isMusicPlaying,
    audioRef,
    coverStageReady,

    // Computed
    event,
    meta,
    guestName,
    templateAssets,
    templateColors,
    templateFonts,
    eventTexts,
    hosts,
    agendaItems,
    eventPhotos,
    paymentMethods,
    primaryColor,
    secondaryColor,
    accentColor,
    currentFont, // Deprecated: use primaryFont instead
    primaryFont,
    secondaryFont,
    accentFont,
    decorativeFont,
    isEventPast,
    eventVideoUrl,
    backgroundVideoUrl,
    eventMusicUrl,
    availableLanguages,
    isEnvelopeButtonReady,

    // Methods
    loadShowcase,
    loadCustomFonts,
    openEnvelope,
    onVideoCanPlay,
    onEventVideoEnded,
    onEventVideoError,
    getMediaUrl,
    openGoogleMap,
    openPhotoModal,
    closePhotoModal,
    navigateToPhoto,
    changeLanguage,
    initializeAudio,
    playMusic,
    pauseMusic,
    toggleMusic,
    handleCoverStageReady,
    fontsLoaded,
    fontsLoadedCount,
    fontLoadStats
  }
}