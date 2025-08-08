import { ref, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { eventsService, mediaService } from '../services/api'

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
  const currentLanguage = ref('en')
  const isEnvelopeOpened = ref(false)
  const isPlayingEventVideo = ref(false)
  const videoLoading = ref(false)
  const eventVideoRef = ref<HTMLVideoElement | null>(null)
  const showAllPhotos = ref(false)
  const isPhotoModalOpen = ref(false)
  const currentModalPhoto = ref<EventPhoto | null>(null)

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
  
  const templateFonts = computed(() => event.value?.template_fonts || event.value?.template_assets?.fonts || [] as TemplateFont[])
  const eventTexts = computed(() => event.value?.event_texts || [] as EventText[])
  const hosts = computed(() => event.value?.hosts || [] as Host[])
  const agendaItems = computed(() => event.value?.agenda_items || [] as AgendaItem[])
  const eventPhotos = computed(() => {
    // Use photos field from API response (new format) or event_photos (legacy)
    const photos = event.value?.photos || event.value?.event_photos || []
    return photos.sort((a, b) => a.order - b.order)
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
  
  const currentFont = computed(() => {
    const font = templateFonts.value.find(f => f.language === currentLanguage.value)
    return font?.font_name || 'inherit'
  })
  
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

  // Methods
  const loadShowcase = async () => {
    const eventId = route.params.id as string
    if (!eventId) {
      error.value = 'Invalid event ID'
      return
    }

    loading.value = true
    error.value = null

    try {
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

        // Load custom fonts
        loadCustomFonts()
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

  const loadCustomFonts = () => {
    templateFonts.value.forEach((font: TemplateFont) => {
      if (font.font_file) {
        const fontFace = new FontFace(font.font_name, `url(${getMediaUrl(font.font_file)})`)
        fontFace.load().then(loadedFont => {
          document.fonts.add(loadedFont)
        }).catch(err => {
          console.error('Failed to load font:', font.font_name, err)
        })
      }
    })
  }

  const openEnvelope = async () => {
    isEnvelopeOpened.value = true
    
    // If we have an event video, play it
    if (eventVideoUrl.value) {
      isPlayingEventVideo.value = true
      
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
      }, 1000)
    }
  }

  const onVideoCanPlay = () => {
    videoLoading.value = false
  }

  const onEventVideoEnded = () => {
    // Video finished, show the info screen with background video
    isPlayingEventVideo.value = false
  }

  const onEventVideoError = (error: Event) => {
    console.error('Event video error:', error)
    // If video fails to load, skip to info screen
    isPlayingEventVideo.value = false
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
    
    currentLanguage.value = newLanguage
    await loadShowcase()
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
    primaryColor,
    secondaryColor,
    accentColor,
    currentFont,
    isEventPast,
    eventVideoUrl,
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
    changeLanguage
  }
}