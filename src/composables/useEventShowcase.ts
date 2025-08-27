import { ref, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { eventsService, mediaService, type EventPaymentMethod } from '../services/api'

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
  const showAllPhotos = ref(false)
  const fontsLoaded = ref(false)
  const fontsLoadedCount = ref(0)
  const isPhotoModalOpen = ref(false)
  const currentModalPhoto = ref<EventPhoto | null>(null)
  const isMusicPlaying = ref(false)
  const audioRef = ref<HTMLAudioElement | null>(null)

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
      return Object.entries(fonts).map(([lang, font]: [string, any]) => ({
        ...font,
        language: lang
      }))
    }
    
    const fontList = fonts || [] as TemplateFont[]
    
    // TEST: If no fonts available, inject Tom Template 3 fonts for testing
    if (fontList.length === 0) {
      console.log('🧪 No template fonts in API, using Tom Template 3 test fonts')
      return [
        {
          id: 5,
          language: 'kh',
          font_type: 'primary',
          font: {
            id: 3,
            name: 'KhmerOSMoulPali',
            font_file: '/media/fonts/KhmerOSMoulpali.ttf'
          }
        },
        {
          id: 6,
          language: 'en',
          font_type: 'primary',
          font: {
            id: 4,
            name: 'BrushScript',
            font_file: '/media/fonts/Brush_Script.ttf'
          }
        },
        {
          id: 11,
          language: 'en',
          font_type: 'secondary',
          font: {
            id: 8,
            name: 'Poppins-Regular',
            font_file: '/media/fonts/Poppins-Regular.ttf'
          }
        }
      ] as TemplateFont[]
    }
    
    return fontList
  })
  
  // Get fonts for current language with comprehensive font type support
  const getLanguageFonts = computed(() => {
    const langFonts = templateFonts.value.filter(f => f.language === currentLanguage.value)
    
    // Create font type mapping
    const fontTypeMap = {
      primary: null as TemplateFont | null,
      secondary: null as TemplateFont | null,
      accent: null as TemplateFont | null,
      decorative: null as TemplateFont | null
    }
    
    // First pass: Use new font_type field if available
    langFonts.forEach(font => {
      if (font.font_type) {
        const type = font.font_type.toLowerCase() as keyof typeof fontTypeMap
        if (type in fontTypeMap) {
          fontTypeMap[type] = font
        }
      }
    })
    
    // Second pass: Backward compatibility with name-based detection for missing types
    const remainingFonts = langFonts.filter(font => {
      // Skip fonts already assigned by font_type
      return !font.font_type || !Object.values(fontTypeMap).includes(font)
    })
    
    // Sort remaining fonts for backward compatibility
    const sortedFonts = [...remainingFonts].sort((a, b) => {
      const aName = (a.font_name || '').toLowerCase()
      const bName = (b.font_name || '').toLowerCase()
      
      // Check for explicit naming patterns
      if (aName.includes('primary')) return -1
      if (bName.includes('primary')) return 1
      if (aName.includes('secondary')) return 1
      if (bName.includes('secondary')) return -1
      if (aName.includes('accent')) return 1
      if (bName.includes('accent')) return -1
      if (aName.includes('decorative')) return 1
      if (bName.includes('decorative')) return -1
      
      // Fallback to ID or original order
      return (a.id || 0) - (b.id || 0)
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
    
    return fontTypeMap
  })
  
  // Primary font for headings and important text
  const primaryFont = computed(() => {
    // Include fontsLoaded in dependency to trigger reactivity
    fontsLoaded.value // This makes the computed reactive to font loading
    const font = getLanguageFonts.value.primary
    return getFontName(font) || '"Inter", "Helvetica Neue", "Arial", sans-serif'
  })
  
  // Secondary font for body text and descriptions
  const secondaryFont = computed(() => {
    // Include fontsLoaded in dependency to trigger reactivity
    fontsLoaded.value // This makes the computed reactive to font loading
    const font = getLanguageFonts.value.secondary
    return getFontName(font) || primaryFont.value
  })
  
  // Accent font for special highlights
  const accentFont = computed(() => {
    fontsLoaded.value // Reactive to font loading
    const font = getLanguageFonts.value.accent
    return getFontName(font) || primaryFont.value
  })
  
  // Decorative font for artistic elements
  const decorativeFont = computed(() => {
    fontsLoaded.value // Reactive to font loading
    const font = getLanguageFonts.value.decorative
    return getFontName(font) || primaryFont.value
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
  const eventPhotos = computed(() => {
    // Use photos field from API response (new format) or event_photos (legacy)
    const photos = event.value?.photos || event.value?.event_photos || []
    return photos.sort((a, b) => a.order - b.order)
  })

  const paymentMethods = computed(() => {
    // Use payment_methods field from API response
    const methods = event.value?.payment_methods || []
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
  
  // Deprecated: Use primaryFont and secondaryFont instead
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

  // Methods
  const loadShowcase = async (forceLanguage?: string) => {
    const eventId = route.params.id as string
    if (!eventId) {
      error.value = 'Invalid event ID'
      return
    }

    loading.value = true
    error.value = null

    try {
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

      // Fetch the showcase data
      const showcaseResponse = await eventsService.getEventShowcase(eventId, params)

      if (showcaseResponse.success && showcaseResponse.data) {
        showcaseData.value = showcaseResponse.data
        
        // Photos are now included in the showcase API response
        // The API returns photos in the 'photos' field
        
        // Set current language from meta
        if (showcaseResponse.data.meta?.language) {
          currentLanguage.value = showcaseResponse.data.meta.language
        }

        // Load custom fonts asynchronously
        loadCustomFonts().catch(err => {
          console.error('Font loading failed:', err)
        })
      } else {
        error.value = showcaseResponse.message || 'Failed to load event invitation'
      }
    } catch (err: unknown) {
      console.error('Error loading showcase:', err)
      error.value = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to load event invitation'
    } finally {
      loading.value = false
    }
  }

  const loadCustomFonts = async () => {
    // Reset font loading state
    fontsLoaded.value = false
    fontsLoadedCount.value = 0
    
    // Load fonts for current language only
    const langFonts = templateFonts.value.filter(f => f.language === currentLanguage.value)
    
    console.log(`🎨 Loading fonts for language: ${currentLanguage.value}`)
    console.log('Available fonts:', langFonts)
    
    // TEST: If no fonts available, inject Tom Template 3 fonts for testing
    if (langFonts.length === 0) {
      console.log('🧪 No template fonts found, injecting Tom Template 3 fonts for testing...')
      const testFonts = [
        {
          id: 5,
          language: 'kh',
          font_type: 'primary',
          font: {
            id: 3,
            name: 'KhmerOSMoulPali',
            font_file: '/media/fonts/KhmerOSMoulpali.ttf'
          }
        },
        {
          id: 6,
          language: 'en',
          font_type: 'primary',
          font: {
            id: 4,
            name: 'BrushScript',
            font_file: '/media/fonts/Brush_Script.ttf'
          }
        },
        {
          id: 11,
          language: 'en',
          font_type: 'secondary',
          font: {
            id: 8,
            name: 'Poppins-Regular',
            font_file: '/media/fonts/Poppins-Regular.ttf'
          }
        }
      ]
      
      // Filter for current language
      const testLangFonts = testFonts.filter(f => f.language === currentLanguage.value)
      
      // Load fonts in parallel
      const loadPromises = testLangFonts.map(font => loadSingleFont(font))
      await Promise.all(loadPromises)
      
      fontsLoaded.value = true
      console.log('🎉 All test fonts loaded successfully!')
      
      // Force DOM update to apply new fonts
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
  
  const loadSingleFont = async (font: any) => {
    const fontName = getFontName(font)
    const fontFile = getFontFile(font)
    
    console.log(`📝 Font: "${fontName}", File: "${fontFile}", Type: ${font.font_type || 'legacy'}`)
    
    if (fontFile && fontName) {
      const fullUrl = getMediaUrl(fontFile)
      console.log(`🔗 Attempting to load font from: ${fullUrl}`)
      
      try {
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
      
      await nextTick()
      if (eventVideoRef.value) {
        // Ensure video plays with sound
        eventVideoRef.value.muted = false
        eventVideoRef.value.play().catch(err => {
          console.error('Failed to play event video:', err)
          // Try playing muted if unmuted fails
          if (eventVideoRef.value) {
            eventVideoRef.value.muted = true
            eventVideoRef.value.play()
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
    }
  }

  const onVideoCanPlay = () => {
    videoLoading.value = false
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
    showAllPhotos,
    isPhotoModalOpen,
    currentModalPhoto,
    isMusicPlaying,
    audioRef,

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
    getLanguageFonts, // Expose font type mapping
    isEventPast,
    eventVideoUrl,
    eventMusicUrl,
    availableLanguages,

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
    fontsLoaded,
    fontsLoadedCount
  }
}