import { ref, computed, nextTick, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { eventsService, type EventPaymentMethod } from '../services/api'
import { useBackgroundPreloader } from './useBackgroundPreloader'
import { updateMetaTags, getBestEventImage, createEventDescription } from '../utils/metaUtils'
import { usePerformance, ResourceManager } from '../utils/performance'
import { sanitizeHtml, containsSuspiciousContent } from '../utils/sanitize'

// Interfaces
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
  // New font type fields for backward compatibility
  font_type?: string // 'primary', 'secondary', 'accent', 'decorative'
  font_type_display?: string // 'Primary', 'Secondary', 'Accent', 'Decorative'
  font?: {
    name: string
    font_file: string
  }
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

export interface EventComment {
  id: number
  event_id: string
  guest_name: string
  message: string
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
  // Category fields for proper payment method translation
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

export function useEventShowcase() {
  const route = useRoute()

  // Initialize background preloader
  const {
    isPreloading,
    preloadProgress,
    stage2Progress,
    stage3Progress,
    startPreloading,
    startStage2Preloading,
    startStage3Preloading,
    cancelPreloading,
    clearVideoCache,
    isContentPreloaded,
    isStage2Ready,
    isStage3Ready,
    getStats
  } = useBackgroundPreloader()

  // Performance utilities with automatic cleanup
  const {
    deduplicateRequest,
    addTimeout,
    addCleanup,
    cleanup: cleanupPerformance
  } = usePerformance()

  // Resource manager for comprehensive cleanup
  const resourceManager = new ResourceManager()

  // State
  const loading = ref(false)
  const error = ref<string | null>(null)
  const showcaseData = ref<ShowcaseData | null>(null)
  // Default language to 'kh' but check URL params first
  const urlLang = route.query.lang as string || 'kh'
  const currentLanguage = ref(urlLang)
  const isEnvelopeOpened = ref(false)
  const isPlayingEventVideo = ref(false)
  const videoLoading = ref(false)
  const eventVideoRef = ref<HTMLVideoElement | null>(null)
  const fontsLoaded = ref(false)
  const fontsLoadedCount = ref(0)
  const isPhotoModalOpen = ref(false)
  const currentModalPhoto = ref<EventPhoto | null>(null)
  const isMusicPlaying = ref(false)
  const audioRef = ref<HTMLAudioElement | null>(null)
  const coverStageReady = ref(false)

  // Computed properties
  const event = computed(() => showcaseData.value?.event || {} as EventData)
  const meta = computed(() => showcaseData.value?.meta || {})
  const guestName = computed(() => meta.value.guest_name || route.query.guest_name || '')
  const templateAssets = computed(() => event.value?.template_assets?.assets || null)
  
  const templateColors = computed(() => {
    // Support both API response formats for colors
    const colors = event.value?.template_colors || event.value?.template_assets?.colors || []
    return colors
  })
  
  const templateFonts = computed(() => {
    // Support both array format and object format from API
    const fonts = event.value?.template_fonts || event.value?.template_assets?.fonts
    
    // If fonts is an object (language-keyed), convert to array
    if (fonts && !Array.isArray(fonts)) {
      return Object.entries(fonts).map(([lang, font]) => ({
        ...(font as TemplateFont),
        language: lang
      }))
    }
    
    const fontList = fonts || [] as TemplateFont[]
    return fontList
  })
  
  // Memoized font processing with caching for performance
  const languageFontsCache = ref<Map<string, any>>(new Map())
  const fontProcessingVersion = ref(0) // Version counter for cache invalidation

  // Watch for changes that should invalidate font cache
  watch([templateFonts, currentLanguage], () => {
    fontProcessingVersion.value++
    languageFontsCache.value.clear()
  })

  const getLanguageFonts = computed(() => {
    const cacheKey = `${currentLanguage.value}-v${fontProcessingVersion.value}`
    
    // Check cache first - huge performance improvement for repeated access
    if (languageFontsCache.value.has(cacheKey)) {
      return languageFontsCache.value.get(cacheKey)
    }
    
    // Expensive computation - only run when cache miss
    const langFonts = templateFonts.value.filter(f => f.language === currentLanguage.value)
    
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
    
    // Second pass: Backward compatibility with name-based detection for missing types
    const remainingFonts = langFonts.filter(font => {
      return !font.font_type || !Object.values(fontTypeMap).includes(font)
    })
    
    // Optimized sorting with pre-compiled patterns
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
    
    // Cache the result for subsequent accesses
    languageFontsCache.value.set(cacheKey, fontTypeMap)
    
    return fontTypeMap
  })
  
  // Dynamic font fallback system based on language and context
  const getFallbackFontStack = (fontType: 'serif' | 'sans-serif' | 'decorative' = 'sans-serif') => {
    const language = currentLanguage.value.toLowerCase()
    
    // Language-specific optimized fallbacks
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

  // Optimized font computeds with intelligent caching and fallbacks
  const primaryFont = computed(() => {
    const font = getLanguageFonts.value.primary
    const customName = getFontName(font)
    
    if (customName && fontsLoaded.value) {
      return `"${customName}", ${getFallbackFontStack('sans-serif')}`
    }
    
    return getFallbackFontStack('sans-serif')
  })
  
  const secondaryFont = computed(() => {
    const font = getLanguageFonts.value.secondary
    const customName = getFontName(font)
    
    if (customName && fontsLoaded.value) {
      return `"${customName}", ${getFallbackFontStack('sans-serif')}`
    }
    
    return primaryFont.value
  })
  
  const accentFont = computed(() => {
    const font = getLanguageFonts.value.accent
    const customName = getFontName(font)
    
    if (customName && fontsLoaded.value) {
      return `"${customName}", ${getFallbackFontStack('decorative')}`
    }
    
    return primaryFont.value
  })
  
  const decorativeFont = computed(() => {
    const font = getLanguageFonts.value.decorative
    const customName = getFontName(font)
    
    if (customName && fontsLoaded.value) {
      return `"${customName}", ${getFallbackFontStack('decorative')}`
    }
    
    return accentFont.value
  })
  
  // Helper function to get font name with backward compatibility
  const getFontName = (font: TemplateFont | null): string => {
    if (!font) return ''
    // New nested structure takes precedence
    if (font.font?.name) {
      return font.font.name
    }
    // Fallback to legacy font_name
    return font.font_name || ''
  }
  
  // Helper function to get font file with backward compatibility
  const getFontFile = (font: TemplateFont | null): string => {
    if (!font) return ''
    // New nested structure takes precedence
    if (font.font?.font_file) {
      return font.font.font_file
    }
    // Fallback to legacy font_file
    return font.font_file || ''
  }
  const eventTexts = computed(() => event.value?.event_texts || [] as EventText[])
  const hosts = computed(() => event.value?.hosts || [] as Host[])
  const agendaItems = computed(() => event.value?.agenda_items || [] as AgendaItem[])
  // Cached photo sorting for performance
  const photosCache = ref<{ version: number, sorted: EventPhoto[] }>({ version: -1, sorted: [] })
  const photosCacheVersion = 0

  const eventPhotos = computed(() => {
    // Use photos field from API response (new format) or event_photos (legacy)
    const photos = event.value?.photos || event.value?.event_photos || []
    if (photos.length === 0) return []
    
    // Create a simple version hash based on photo count and first photo ID
    const currentVersion = photos.length + (photos[0]?.id || 0) + (photos[0]?.order || 0)
    
    // Check if cache is still valid
    if (photosCache.value.version === currentVersion && photosCache.value.sorted.length === photos.length) {
      return photosCache.value.sorted
    }
    
    // Sort and cache the result
    const sorted = [...photos].sort((a, b) => (a.order || 0) - (b.order || 0))
    photosCache.value = { version: currentVersion, sorted }
    
    return sorted
  })

  // Memoized payment methods computation
  const paymentMethods = computed(() => {
    // Use payment_methods field from API response
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
  
  // Deprecated: Use primaryFont and secondaryFont instead - kept for backward compatibility
  const currentFont = computed(() => primaryFont.value)
  
  const isEventPast = computed(() => {
    if (!event.value?.end_date) return false
    return new Date(event.value.end_date) < new Date()
  })

  // Event video URL - comes from the event data, not the template
  const eventVideoUrl = computed(() => {
    // Use the event's own video
    if (event.value?.event_video) {
      return getMediaUrl(event.value.event_video)
    }
    return null
  })

  // Event music URL - comes from the event data
  const eventMusicUrl = computed(() => {
    if (event.value?.music) {
      return getMediaUrl(event.value.music)
    }
    return null
  })

  // Envelope button readiness - separates cover stage assets from Stage 2 preloading
  const isEnvelopeButtonReady = computed(() => {
    if (!event.value?.id) return false // Need event ID to check preload status
    
    // Button readiness only depends on Stage 2 preloading, not cover stage assets
    return isStage2Ready(event.value.id, eventVideoUrl.value)
  })

  // Methods
  const loadShowcase = async (forceLanguage?: string) => {
    const eventId = route.params.id as string
    if (!eventId) {
      error.value = 'Invalid event ID'
      return
    }

    // Create a unique key for request deduplication
    const language = forceLanguage || route.query.lang as string || currentLanguage.value
    const guest = guestName.value || ''
    const requestKey = `showcase-${eventId}-${language}-${guest}`

    try {
      // Use request deduplication to prevent multiple concurrent calls
      const data = await deduplicateRequest(requestKey, async () => {
        loading.value = true
        error.value = null

        // If forceLanguage is provided, use it. Otherwise check URL, then fall back to current
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

        console.log('🚀 Loading showcase with params:', params)

        // Fetch the showcase data
        const showcaseResponse = await eventsService.getEventShowcase(eventId, params)

        if (!showcaseResponse.success || !showcaseResponse.data) {
          throw new Error(showcaseResponse.message || 'Failed to load event invitation')
        }

        return showcaseResponse.data
      })

      // Update state with loaded data
      showcaseData.value = data
      
      // Set current language from meta
      if (data.meta?.language) {
        currentLanguage.value = data.meta.language
      }

      // Update meta tags for social sharing
      updateEventMetaTags(data.event)

      // Load custom fonts asynchronously with better error handling
      loadCustomFonts().catch(err => {
        console.warn('Font loading failed, using fallback fonts:', err)
      })
      
    } catch (err: unknown) {
      console.error('Error loading showcase:', err)
      error.value = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 
                   (err as Error)?.message || 
                   'Failed to load event invitation'
    } finally {
      loading.value = false
    }
  }

  // Helper function to update meta tags for social sharing
  const updateEventMetaTags = (event: Record<string, unknown>) => {
    if (!event) return

    const eventImage = getBestEventImage(event)
    const eventDescription = createEventDescription(event)
    const eventTitle = `${event.title as string} - GoEvent`
    
    // Format date for structured data
    const startDate = event.start_date ? new Date(event.start_date as string).toISOString() : undefined
    
    // Get organizer name
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

    console.log('🏷️ Updating meta tags for event:', event.title as string)
    console.log('📊 Meta data:', metaData)
    
    updateMetaTags(metaData)
  }

  const loadCustomFonts = async () => {
    // Reset font loading state
    fontsLoaded.value = false
    fontsLoadedCount.value = 0
    
    // Load fonts for current language only
    const langFonts = templateFonts.value.filter(f => f.language === currentLanguage.value)
    
    console.log(`🎨 Loading fonts for language: ${currentLanguage.value}`)
    console.log('Available fonts:', langFonts)
    
    // If no fonts available, gracefully fallback to system fonts
    if (langFonts.length === 0) {
      console.log('🔤 No template fonts found for language, using system font fallbacks')
      fontsLoaded.value = true
      // Force DOM update to apply fallback fonts
      await nextTick()
      return
    }
    
    // Load actual template fonts in parallel
    const loadPromises = langFonts.map(font => loadSingleFont(font))
    await Promise.all(loadPromises)
    
    fontsLoaded.value = true
    console.log('🎉 All template fonts loaded successfully!')
    
    // Force DOM update to apply new fonts
    await nextTick()
  }
  
  const loadSingleFont = async (font: TemplateFont) => {
    const fontName = getFontName(font)
    const fontFile = getFontFile(font)
    
    console.log(`📝 Font: "${fontName}", File: "${fontFile}", Type: ${font.font_type || 'legacy'}`)
    
    if (fontFile && fontName) {
      const fullUrl = getMediaUrl(fontFile)
      console.log(`🔗 Attempting to load font from: ${fullUrl}`)
      
      try {
        // Validate font URL for security before loading
        if (!isValidFontUrl(fullUrl)) {
          console.warn(`⚠️ Invalid or unsafe font URL blocked: ${fullUrl}`)
          return
        }

        // Always try to load the font, don't rely on document.fonts.check
        const fontFace = new FontFace(fontName, `url(${fullUrl})`)
        const loadedFont = await fontFace.load()
        document.fonts.add(loadedFont)
        
        // Force font to be ready by triggering a document.fonts.ready check
        await document.fonts.ready
        
        console.log(`✅ Successfully loaded font: ${fontName} (${font.font_type || 'legacy'}) for language: ${currentLanguage.value}`)
        
        // Update loaded count to trigger Vue reactivity
        fontsLoadedCount.value++
        
        // Small delay to ensure browser has applied the font
        await new Promise(resolve => setTimeout(resolve, 100))
        
        return true
      } catch (err) {
        console.error(`❌ Failed to load font: ${fontName}`, err)
        console.error(`Font URL: ${fullUrl}`)
        return false
      }
    } else {
      console.warn(`⚠️  Skipping font - missing data: name="${fontName}", file="${fontFile}"`)
      return false
    }
  }

  const initializeAudio = () => {
    if (eventMusicUrl.value && !audioRef.value) {
      audioRef.value = new Audio(eventMusicUrl.value)
      audioRef.value.loop = true
      audioRef.value.volume = 0.35
      
      // Add cleanup for audio resource
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
    } catch (err) {
      console.error('Failed to play music:', err)
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

  const openEnvelope = async () => {
    isEnvelopeOpened.value = true
    
    // If we have an event video, play it
    if (eventVideoUrl.value) {
      isPlayingEventVideo.value = true
      
      // Initialize and auto-play music at Stage 2 (alongside video)
      initializeAudio()
      if (eventMusicUrl.value) {
        playMusic()
      }

      // Start Stage 3 preloading immediately when Stage 2 begins
      if (event.value?.id) {
        startStage3Preloading(event.value, getMediaUrl).catch(error => {
          console.warn('⚡ Stage 3 preloading failed:', error)
        })
      }
      
      await nextTick()
      if (eventVideoRef.value) {
        // Ensure video plays with sound
        eventVideoRef.value.muted = false
        eventVideoRef.value.play().then(() => {
          // Video started playing successfully - clear cache memory after a short delay
          setTimeout(() => {
            if (event.value?.id) {
              clearVideoCache(event.value.id)
            }
          }, 3000) // Wait 3 seconds to ensure stable playback
        }).catch(err => {
          console.error('Failed to play event video:', err)
          // Try playing muted if unmuted fails
          if (eventVideoRef.value) {
            eventVideoRef.value.muted = true
            eventVideoRef.value.play().then(() => {
              // Even muted playback counts - clean up cache
              setTimeout(() => {
                if (event.value?.id) {
                  clearVideoCache(event.value.id)
                }
              }, 3000)
            })
          }
        })
      }
    } else {
      // No event video, wait a moment then go to info screen
      setTimeout(() => {
        isPlayingEventVideo.value = false
        // Initialize and auto-play music when going directly to main content
        initializeAudio()
        if (eventMusicUrl.value) {
          playMusic()
        }
      }, 1000)
      
      // Start Stage 3 preloading even without video
      if (event.value?.id) {
        startStage3Preloading(event.value, getMediaUrl).catch(error => {
          console.warn('⚡ Stage 3 preloading failed:', error)
        })
      }
    }
  }

  const onVideoCanPlay = () => {
    videoLoading.value = false
    
    // Clear video cache memory when video starts playing successfully
    // This frees up memory from preloaded video data that's no longer needed
    if (event.value?.id) {
      setTimeout(() => {
        clearVideoCache(event.value.id)
      }, 2000) // Wait 2 seconds after video can play to ensure stable playback
    }
  }

  const onEventVideoEnded = () => {
    // Video finished, show the info screen with background video
    // Music should already be playing from Stage 2
    isPlayingEventVideo.value = false
  }

  const onEventVideoError = (error: Event) => {
    console.error('Event video error:', error)
    // If video fails to load, skip to info screen but ensure music starts
    isPlayingEventVideo.value = false
    
    // Ensure music is initialized and playing even if video fails
    if (!audioRef.value) {
      initializeAudio()
      if (eventMusicUrl.value) {
        playMusic()
      }
    }
  }

  const getMediaUrl = (url: string): string => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
    return url.startsWith('/') ? `${API_BASE_URL}${url}` : `${API_BASE_URL}/media/${url}`
  }

  const openGoogleMap = () => {
    if (event.value?.google_map_embed_link) {
      // Convert embed link to regular Google Maps link
      let mapUrl = event.value.google_map_embed_link
      
      // If it's an embed link, convert it to a regular maps link
      if (mapUrl.includes('/embed?')) {
        mapUrl = mapUrl.replace('/embed?', '/search?')
        mapUrl = mapUrl.replace('https://www.google.com/maps', 'https://maps.google.com')
      }
      
      // Open in new tab/window
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

  // Old Stage 3 preloading implementation removed - now handled by useBackgroundPreloader composable

  // Background preloading integration with 3-stage flow - cover stage separate from Stage 2
  const handleCoverStageReady = () => {
    console.log('🎭 Cover stage ready - assets loaded for display')
    
    coverStageReady.value = true
    console.log('🎭 coverStageReady set to true')
    
    // Cover stage readiness is separate from Stage 2 preloading
    // Stage 2 preloading should already be started by event data watcher
    console.log('🎭 Cover stage complete. Stage 2 preloading runs independently.')
  }

  // Watch for event data changes to trigger Stage 2 preloading immediately (no cover stage dependency)
  watch(event, (newEvent) => {
    if (newEvent?.id) {
      console.log('🎭 Event data loaded, starting Stage 2 preloading immediately...')
      startStage2Preloading(newEvent, getMediaUrl).catch(error => {
        console.warn('⚡ Stage 2 preloading failed:', error)
        // The preloader handles error states internally, no need to manually set progress
      })
    }
  })

  // Comprehensive cleanup for the composable
  onUnmounted(() => {
    // Cancel background preloading
    cancelPreloading()
    
    // Clean up audio resources
    if (audioRef.value) {
      audioRef.value.pause()
      audioRef.value.src = ''
      audioRef.value = null
    }
    
    // Clean up video resources
    if (eventVideoRef.value) {
      eventVideoRef.value.pause()
      eventVideoRef.value.src = ''
      eventVideoRef.value = null
    }
    
    // Clean up performance utilities
    cleanupPerformance()
    
    // Clean up resource manager
    resourceManager.destroy()
    
    // Clear performance caches
    photosCache.value = { version: -1, sorted: [] }
    
    // Clear reactive state
    showcaseData.value = null
    error.value = null
    currentModalPhoto.value = null
  })

  /**
   * Security helper function to validate font URLs
   */
  const isValidFontUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') {
      return false
    }

    try {
      const urlObj = new URL(url)
      
      // Check if we're in development mode
      const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development'
      const hostname = urlObj.hostname.toLowerCase()
      const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(hostname)
      
      // Protocol validation - allow HTTP only for localhost in development
      const allowedProtocols = ['https:', 'data:']
      if (isDevelopment && isLocalhost) {
        allowedProtocols.push('http:')
      }
      
      if (!allowedProtocols.includes(urlObj.protocol)) {
        console.warn(`❌ Protocol ${urlObj.protocol} not allowed for URL: ${url}`)
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

      // Domain validation - only block malicious domains
      // In development, allow localhost; in production, block all local addresses
      const suspiciousDomains = isDevelopment 
        ? ['0.0.0.0'] // Only block obviously malicious in dev
        : ['localhost', '127.0.0.1', '0.0.0.0', '::1'] // Block all local addresses in production
        
      if (suspiciousDomains.includes(hostname)) {
        console.warn(`❌ Suspicious domain blocked: ${hostname}`)
        return false
      }

      // Ensure file extension is font-related
      const validExtensions = ['.woff', '.woff2', '.ttf', '.otf', '.eot']
      const hasValidExtension = validExtensions.some(ext => 
        urlObj.pathname.toLowerCase().endsWith(ext)
      )

      if (!hasValidExtension) {
        console.warn(`❌ Invalid font extension for URL: ${url}`)
        return false
      }

      // Log successful validation for debugging
      console.log(`✅ Font URL validated successfully: ${url}`)
      return true

    } catch (error) {
      console.warn(`❌ Invalid URL format: ${url}`, error)
      return false
    }
  }

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
    currentFont, // Deprecated: use primaryFont/secondaryFont
    primaryFont,
    secondaryFont,
    accentFont,
    decorativeFont,
    isEventPast,
    eventVideoUrl,
    eventMusicUrl,
    availableLanguages,
    isEnvelopeButtonReady, // New: envelope button readiness

    // Preloading state
    isPreloading,
    preloadProgress,
    stage2Progress,
    stage3Progress,

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

    // Preloading methods
    cancelPreloading,
    clearVideoCache,
    isContentPreloaded,
    isStage2Ready,
    isStage3Ready,
    getStats: getStats, // Preload statistics
    startStage2Preloading,
    startStage3Preloading
  }
}