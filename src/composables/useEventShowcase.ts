// Imports - Vue Core
import { ref, computed, nextTick, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

// Imports - Services & API
import { eventsService, type EventPaymentMethod } from '../services/api'
import type { CoverStageLayout } from '../services/api/types/template.types'

// Imports - Composables
import { usePerformance, ResourceManager } from '../utils/performance'
import { useFontManager } from './showcase/useFontManager'
import { useVideoResourceManager } from './showcase/useVideoResourceManager'
import { useShowcaseStages } from './showcase/useShowcaseStages'
import { useShowcaseRedirect } from './showcase/useShowcaseRedirect'
import { useTemplateProcessor } from './showcase/useTemplateProcessor'

// Imports - Utilities
import { updateMetaTags, getBestEventImage, createEventDescription } from '../utils/metaUtils'

// Configuration constants moved to specialized composables

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
    top_decoration?: string
    bottom_decoration?: string
    left_decoration?: string
    right_decoration?: string
    cover_top_decoration?: string
    cover_bottom_decoration?: string
    cover_left_decoration?: string
    cover_right_decoration?: string
  }
  colors?: TemplateColor[]
  fonts?: TemplateFont[]
  /** @deprecated Use cover_stage_layout.contentTopPosition instead */
  cover_content_top_position?: number
  /** Comprehensive cover stage layout configuration */
  cover_stage_layout?: CoverStageLayout
  display_liquid_glass_background?: boolean
  guest_title_frame_left?: string | null
  guest_title_frame_mid?: string | null
  guest_title_frame_right?: string | null
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

export interface DressCode {
  id: number
  event: string
  dress_code_type: string
  dress_code_type_display: string
  time_period: string
  time_period_display: string
  gender: string
  gender_display: string
  title: string
  description: string
  color: string
  image: string | null
  order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserDetails {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  profile_picture?: string
  bio?: string
  is_verified: boolean
  is_partner: boolean
  phone_number?: string
  payment_link?: string
  telegram_link?: string
  logo?: string
  telegram_id?: string
  telegram_auth_date?: string
  created_at: string
  updated_at: string
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
  rsvp_enabled?: boolean
  comments_enabled?: boolean
  countdown_enabled?: boolean
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
  organizer?: number
  organizer_details?: UserDetails
  referrer?: number | null
  referrer_details?: UserDetails | null
  template_assets?: TemplateAssets
  template_colors?: TemplateColor[]
  template_fonts?: TemplateFont[]
  event_texts?: EventText[]
  hosts?: Host[]
  agenda_items?: AgendaItem[]
  event_photos?: EventPhoto[]
  photos?: EventPhoto[]
  payment_methods?: EventPaymentMethod[]
  dress_codes?: DressCode[]
  available_languages?: Array<{ id: number; language: string; language_display: string }>
  top_decoration?: string | null
  bottom_decoration?: string | null
  left_decoration?: string | null
  right_decoration?: string | null
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

// Enhanced error handling types
export interface FontLoadError extends Error {
  fontName?: string
  url?: string
  attempt?: number
}

export interface VideoError extends Error {
  videoElement?: HTMLVideoElement
  src?: string
}

export interface ShowcaseError extends Error {
  eventId?: string
  language?: string
  code?: 'LOAD_FAILED' | 'INVALID_EVENT' | 'NETWORK_ERROR' | 'PERMISSION_DENIED'
}

// ============================
// Main Composable
// ============================
export function useEventShowcase() {
  const route = useRoute()

  // ============================
  // External Composables
  // ============================

  const { deduplicateRequest, addCleanup, cleanup: cleanupPerformance } = usePerformance()

  const resourceManager = new ResourceManager()

  // Network condition detection for adaptive loading
  const getNetworkCondition = (): 'fast' | 'slow' | 'unknown' => {
    if ('connection' in navigator) {
      const conn = (navigator as any).connection
      if (conn?.effectiveType === '4g' && (conn?.downlink > 5 || !conn?.downlink)) {
        return 'fast'
      } else if (conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g') {
        return 'slow'
      }
    }
    return 'unknown'
  }

  // Specialized composables for different concerns
  const fontManager = useFontManager()
  const videoManager = useVideoResourceManager()
  const stageManager = useShowcaseStages()
  const redirectManager = useShowcaseRedirect(route)
  const templateProcessor = useTemplateProcessor()

  // ============================
  // State Management
  // ============================
  // Core state
  const loading = ref(false)
  const contentLoading = ref(false)
  const error = ref<string | null>(null)
  const showcaseData = ref<ShowcaseData | null>(null)

  // Language state
  const urlLang = (route.query.lang as string) || 'kh'
  const currentLanguage = ref(urlLang)

  // Photo modal state
  const isPhotoModalOpen = ref(false)
  const currentModalPhoto = ref<EventPhoto | null>(null)

  // Delegate redirect state management to specialized composable
  // All redirect logic is now handled by redirectManager

  // ============================
  // Computed Properties
  // ============================
  const event = computed(() => showcaseData.value?.event || ({} as EventData))
  const meta = computed(() => showcaseData.value?.meta || {})
  const guestName = computed(() => {
    const guestNameFromQuery = route.query.guest_name
    const guestNameStr = Array.isArray(guestNameFromQuery)
      ? guestNameFromQuery[0]
      : guestNameFromQuery
    return meta.value.guest_name || guestNameStr || ''
  })
  const templateAssets = computed(() => {
    const assets = event.value?.template_assets?.assets || null
    const displayLiquidGlass = event.value?.template_assets?.display_liquid_glass_background

    // If assets exist, spread them and add display_liquid_glass_background
    // Note: guest_title_frame_* fields are already inside assets, so they're included in the spread
    if (assets) {
      return {
        ...assets,
        display_liquid_glass_background: displayLiquidGlass
      }
    }

    // If no assets but we have display_liquid_glass_background, return just that
    if (displayLiquidGlass !== undefined) {
      return {
        display_liquid_glass_background: displayLiquidGlass
      }
    }

    return null
  })

  const templateColors = computed(() => {
    return templateProcessor.normalizeTemplateColors(
      event.value?.template_colors || event.value?.template_assets?.colors || [],
    )
  })

  const templateFonts = computed(() => {
    return templateProcessor.normalizeTemplateFonts(
      event.value?.template_fonts || event.value?.template_assets?.fonts || [],
    )
  })

  // Font processing delegated to template processor
  const getLanguageFonts = computed(() => {
    return templateProcessor.getLanguageFonts(templateFonts.value, currentLanguage.value)
  })

  // Font computed properties using template processor and font manager
  const primaryFont = computed(() => {
    const langFonts = getLanguageFonts.value
    if (!langFonts) return fontManager.getFallbackFontStack('sans-serif', currentLanguage.value)

    const font = langFonts.primary
    const customName = templateProcessor.getFontName(font)

    if (customName && fontManager.fontsLoaded.value) {
      return `"${customName}", ${fontManager.getFallbackFontStack('sans-serif', currentLanguage.value)}`
    }

    return fontManager.getFallbackFontStack('sans-serif', currentLanguage.value)
  })

  const secondaryFont = computed(() => {
    const langFonts = getLanguageFonts.value
    if (!langFonts) return primaryFont.value

    const font = langFonts.secondary
    const customName = templateProcessor.getFontName(font)

    if (customName && fontManager.fontsLoaded.value) {
      return `"${customName}", ${fontManager.getFallbackFontStack('sans-serif', currentLanguage.value)}`
    }

    return primaryFont.value
  })

  const accentFont = computed(() => {
    const langFonts = getLanguageFonts.value
    if (!langFonts) return primaryFont.value

    const font = langFonts.accent
    const customName = templateProcessor.getFontName(font)

    if (customName && fontManager.fontsLoaded.value) {
      return `"${customName}", ${fontManager.getFallbackFontStack('decorative', currentLanguage.value)}`
    }

    return primaryFont.value
  })

  const decorativeFont = computed(() => {
    const langFonts = getLanguageFonts.value
    if (!langFonts) return accentFont.value

    const font = langFonts.decorative
    const customName = templateProcessor.getFontName(font)

    if (customName && fontManager.fontsLoaded.value) {
      return `"${customName}", ${fontManager.getFallbackFontStack('decorative', currentLanguage.value)}`
    }

    return accentFont.value
  })

  // Deprecated: Use primaryFont instead
  const currentFont = computed(() => primaryFont.value)

  const eventTexts = computed(() => event.value?.event_texts || [])
  const hosts = computed(() => event.value?.hosts || [])
  const agendaItems = computed(() => event.value?.agenda_items || [])

  // Photo sorting with cache
  const photosCache = ref<{ version: number; sorted: EventPhoto[] }>({ version: -1, sorted: [] })

  const eventPhotos = computed(() => {
    const photos = event.value?.photos || event.value?.event_photos || []
    if (photos.length === 0) return []

    const currentVersion = photos.length + (photos[0]?.id || 0) + (photos[0]?.order || 0)

    if (
      photosCache.value.version === currentVersion &&
      photosCache.value.sorted.length === photos.length
    ) {
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
      .filter((method) => method.is_active)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  })

  const dressCodes = computed(() => {
    const codes = event.value?.dress_codes || []
    if (codes.length === 0) return []

    return codes
      .filter((code) => code.is_active)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  })

  const availableLanguages = computed(() => event.value?.available_languages || [])

  // Extract all colors once and cache the result
  const extractedColors = computed(() =>
    templateProcessor.extractTemplateColors(templateColors.value)
  )

  const primaryColor = computed(() => extractedColors.value.primaryColor)

  const secondaryColor = computed(() => extractedColors.value.secondaryColor)

  const accentColor = computed(() => extractedColors.value.accentColor)

  const guestnameColor = computed(() => extractedColors.value.guestnameColor)

  const backgroundColor = computed(() => extractedColors.value.backgroundColor)

  const templateColor = computed(() => extractedColors.value.templateColor)

  const isEventPast = computed(() => {
    if (!event.value?.end_date) return false
    return new Date(event.value.end_date) < new Date()
  })

  const eventVideoUrl = computed(() => {
    if (event.value?.event_video) {
      return templateProcessor.getMediaUrl(event.value.event_video)
    }
    return null
  })

  const backgroundVideoUrl = computed(() => {
    if (event.value?.template_assets?.assets?.standard_background_video) {
      return templateProcessor.getMediaUrl(
        event.value.template_assets.assets.standard_background_video,
      )
    }
    return null
  })

  const eventMusicUrl = computed(() => {
    if (event.value?.music) {
      return templateProcessor.getMediaUrl(event.value.music)
    }
    return null
  })

  const isEnvelopeButtonReady = computed(() => true)

  // Video resource management delegated to specialized composable
  // All video cleanup and lifecycle management handled by videoManager

  // ============================
  // Security & Validation Utilities
  // ============================
  // Helper function for sanitizing video IDs (reserved for future use)
  // const sanitizeVideoId = (id: string): string => {
  //   if (!id || typeof id !== 'string') return ''
  //   // Remove any potentially dangerous characters
  //   return id.replace(/[<>"'&\\]/g, '').replace(/[^a-zA-Z0-9\-_]/g, '').substring(0, 50)
  // }

  const validateVideoElement = (element: HTMLVideoElement): boolean => {
    if (!element || !(element instanceof HTMLVideoElement)) return false

    // Check if element is attached to document
    if (!document.contains(element)) return false

    // Validate src attribute is from trusted domain
    const src = element.src || element.getAttribute('src') || ''
    if (!src) return true // Allow empty src for cleanup

    try {
      const url = new URL(src)
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
      const allowedOrigins = [new URL(API_BASE_URL).origin, window.location.origin]

      // Allow data URLs for embedded content
      if (url.protocol === 'data:') {
        return url.href.startsWith('data:video/')
      }

      return allowedOrigins.includes(url.origin)
    } catch {
      return false
    }
  }

  // Helper function for creating safe video queries (reserved for future use)
  // const createSafeVideoQuery = (videoType: 'cover' | 'event' | 'background', eventId?: string): string => {
  //   const sanitizedEventId = eventId ? sanitizeVideoId(eventId) : ''
  //
  //   switch (videoType) {
  //     case 'cover':
  //       return `video[data-video-type="cover"]${sanitizedEventId ? `[data-event-id="${sanitizedEventId}"]` : ''}`
  //     case 'event':
  //       return `video[data-video-type="event"]${sanitizedEventId ? `[data-event-id="${sanitizedEventId}"]` : ''}`
  //     case 'background':
  //       return `video[data-video-type="background"]${sanitizedEventId ? `[data-event-id="${sanitizedEventId}"]` : ''}`
  //     default:
  //       return 'video[data-video-type]'
  //   }
  // }

  // Helper functions delegated to specialized composables
  // All helper functions now provided by specialized composables

  // All font loading functionality moved to useFontManager

  // ============================
  // Core Methods
  // ============================
  const loadShowcase = async (forceLanguage?: string) => {
    const eventId = route.params.id as string
    if (!eventId) {
      error.value = 'Invalid event ID'
      return
    }

    const language = forceLanguage || (route.query.lang as string) || currentLanguage.value
    const guest = guestName.value || ''
    const networkCondition = getNetworkCondition()
    const requestKey = `showcase-${eventId}-${language}-${guest}`

    try {
      const data: ShowcaseData = await deduplicateRequest<ShowcaseData>(requestKey, async (): Promise<ShowcaseData> => {
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
          lang: currentLanguage.value,
        }

        if (guestName.value) {
          params.guest_name = guestName.value as string
        }

        const showcaseResponse = await eventsService.getEventShowcase(eventId, params)

        if (!showcaseResponse.success || !showcaseResponse.data) {
          throw new Error(showcaseResponse.message || 'Failed to load event invitation')
        }

        return showcaseResponse.data as ShowcaseData
      })

      showcaseData.value = data

      if (data.meta?.language) {
        currentLanguage.value = data.meta.language
      }

      // Adaptive resource loading based on network conditions
      if (networkCondition === 'slow' && data.event.event_photos) {
        // For slow connections, limit photos to improve performance
        if (data.event.event_photos.length > 5) {
          console.info('Limiting photos for slow connection')
          data.event.event_photos = data.event.event_photos.slice(0, 5)
        }
      }

      // Update meta tags for social sharing
      updateEventMetaTags(data.event)

      // Initialize showcase stage based on redirect state
      const initialStage = await redirectManager.getInitialStage()
      stageManager.currentShowcaseStage.value = initialStage

      // Load custom fonts asynchronously with progressive enhancement
      const langFonts = templateFonts.value.filter((f) => f.language === currentLanguage.value)

      // Adjust font loading strategy based on network
      const fontLoadConfig = {
        display: 'swap' as const,
        timeout: networkCondition === 'slow'
          ? fontManager.FONT_CONFIG.DEFAULT_TIMEOUT * 2
          : fontManager.FONT_CONFIG.DEFAULT_TIMEOUT,
        retryAttempts: networkCondition === 'slow'
          ? 1
          : fontManager.FONT_CONFIG.DEFAULT_MAX_RETRIES,
      }

      fontManager
        .loadCustomFonts(langFonts, fontLoadConfig)
        .catch((fontError) => {
          // Log font loading issues but don't block the main showcase
          console.warn('Font loading failed, falling back to system fonts:', fontError)
        })

      // Clear language change flags after successful showcase load
      setTimeout(() => {
        redirectManager.clearLanguageChangeFlags()
      }, 1000) // Wait for stage initialization to complete
    } catch (err: unknown) {
      // Improved error handling with proper type safety
      const showcaseError = createShowcaseError(err, {
        eventId,
        language: currentLanguage.value,
        code: 'LOAD_FAILED',
      })

      error.value = showcaseError.message
      console.warn('Failed to load showcase:', showcaseError)
    } finally {
      loading.value = false
    }
  }

  /**
   * Updates language content without triggering full loading state
   * This prevents the background video from reloading during language changes
   */
  const updateLanguageContent = async (newLanguage: string) => {
    const eventId = route.params.id as string
    if (!eventId) {
      error.value = 'Invalid event ID'
      return
    }

    if (currentLanguage.value === newLanguage) return

    const guest = guestName.value || ''
    const requestKey = `language-content-${eventId}-${newLanguage}-${guest}`

    try {
      contentLoading.value = true
      error.value = null

      const params: { lang?: string; guest_name?: string } = {
        lang: newLanguage,
      }

      if (guestName.value) {
        params.guest_name = guestName.value as string
      }

      const data: ShowcaseData = await deduplicateRequest<ShowcaseData>(requestKey, async (): Promise<ShowcaseData> => {
        const showcaseResponse = await eventsService.getEventShowcase(eventId, params)

        if (!showcaseResponse.success || !showcaseResponse.data) {
          throw new Error(showcaseResponse.message || 'Failed to load event content')
        }

        return showcaseResponse.data as ShowcaseData
      })

      // Update only the content-related parts of showcaseData
      // IMPORTANT: We must update template_fonts and template_assets to get new language fonts
      if (showcaseData.value) {
        // Merge event_texts: keep existing texts for other languages, add/update texts for new language
        // This ensures fallback content remains available when switching between languages
        const existingTexts = showcaseData.value.event.event_texts || []
        const newTexts = data.event.event_texts || []

        // Remove texts for the new language from existing (will be replaced with new ones)
        const textsFromOtherLanguages = existingTexts.filter(
          (text) => text.language !== newLanguage,
        )

        // Combine: texts from other languages + new texts for current language
        const mergedEventTexts = [...textsFromOtherLanguages, ...newTexts]

        showcaseData.value = {
          ...showcaseData.value,
          event: {
            ...showcaseData.value.event,
            event_texts: mergedEventTexts,
            hosts: data.event.hosts,
            agenda_items: data.event.agenda_items,
            available_languages: data.event.available_languages,
            // Update template fonts for the new language
            template_fonts: data.event.template_fonts || showcaseData.value.event.template_fonts,
            template_assets: data.event.template_assets || showcaseData.value.event.template_assets,
          },
          meta: {
            ...showcaseData.value.meta,
            language: data.meta?.language || newLanguage,
          },
        }
      } else {
        // Fallback to full data update if showcaseData doesn't exist
        showcaseData.value = data
      }

      // Invalidate template processor font cache AFTER updating font data
      // This ensures the cache is cleared after we have the new language fonts
      templateProcessor.invalidateFontCache()

      // Update current language AFTER invalidating cache
      // This prevents caching empty results before font data is updated
      currentLanguage.value = newLanguage

      // Wait for next tick to ensure reactive updates have propagated
      await nextTick()

      // Load custom fonts for the new language and await completion
      const langFonts = templateFonts.value.filter((f) => f.language === newLanguage)

      try {
        await fontManager.loadCustomFonts(langFonts, {
          display: 'swap',
          timeout: fontManager.FONT_CONFIG.DEFAULT_TIMEOUT,
          retryAttempts: fontManager.FONT_CONFIG.DEFAULT_MAX_RETRIES,
        })

        // Force a DOM update to apply the new fonts
        await nextTick()
      } catch (fontError) {
        // Log font loading issues but don't block the content update
        console.warn(
          'Font loading failed during language change, falling back to system fonts:',
          fontError,
        )
      }

      // Clear language change flags after successful content update
      setTimeout(() => {
        redirectManager.clearLanguageChangeFlags()
      }, 500) // Shorter timeout since we're not doing full stage initialization
    } catch (err: unknown) {
      // Enhanced error handling with proper type safety
      const showcaseError = createShowcaseError(err, {
        eventId,
        language: newLanguage,
        code: 'LOAD_FAILED',
      })

      error.value = showcaseError.message
      console.warn('Failed to update language content:', showcaseError)

      // Revert language on error
      currentLanguage.value = showcaseData.value?.meta?.language || urlLang
    } finally {
      contentLoading.value = false
    }
  }

  /**
   * Creates a properly typed ShowcaseError with context
   */
  const createShowcaseError = (
    originalError: unknown,
    context: { eventId?: string; language?: string; code?: ShowcaseError['code'] },
  ): ShowcaseError => {
    // Handle API response errors
    interface ApiErrorResponse {
      response?: {
        data?: {
          detail?: string
          message?: string
        }
        status?: number
      }
    }

    const apiError = originalError as ApiErrorResponse
    const apiMessage = apiError?.response?.data?.detail || apiError?.response?.data?.message

    // Handle standard errors
    const standardError = originalError as Error
    const message = apiMessage || standardError?.message || 'Failed to load event invitation'

    // Create enhanced error with context
    const showcaseError = new Error(message) as ShowcaseError
    showcaseError.name = 'ShowcaseError'
    showcaseError.eventId = context.eventId
    showcaseError.language = context.language
    showcaseError.code = context.code || 'LOAD_FAILED'

    return showcaseError
  }

  // ============================
  // Meta Tags Management
  // ============================
  /**
   * Updates meta tags with proper type safety for event data
   */
  const updateEventMetaTags = (event: EventData) => {
    if (!event?.id) return

    const eventImage = getBestEventImage(event as unknown as Record<string, unknown>)
    const eventDescription = createEventDescription(event as unknown as Record<string, unknown>)
    const eventTitle = `${event.title} - GoEvent`

    const startDate = event.start_date ? new Date(event.start_date).toISOString() : undefined

    // Type-safe organizer details extraction
    interface OrganizerDetails {
      first_name?: string
      last_name?: string
      username?: string
    }

    const organizerDetails = (event as EventData & { organizer_details?: OrganizerDetails })
      .organizer_details
    const organizerName = organizerDetails
      ? `${organizerDetails.first_name || ''} ${organizerDetails.last_name || ''}`.trim() ||
        organizerDetails.username ||
        'GoEvent'
      : 'GoEvent'

    const metaData = {
      title: eventTitle,
      description: eventDescription,
      image: eventImage,
      url: `${window.location.origin}/events/${event.id}/showcase`,
      siteName: 'GoEvent',
      type: 'website',
      locale: currentLanguage.value === 'kh' ? 'kh_KH' : 'en_US',
      author: organizerName,
      publishedTime: startDate,
      location: event.location || undefined,
    }

    updateMetaTags(metaData)
  }

  // Font loading system delegated to specialized composable
  // All font loading, caching, and validation handled by fontManager

  // ============================
  // Media management delegated to stage manager
  // Audio and video lifecycle handled by stageManager

  // Stage flow management delegated to specialized composable
  // All stage transitions and audio/video lifecycle handled by stageManager

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

    // Check if we're in the main content stage (background video is playing)
    const isInMainContentStage = stageManager.currentShowcaseStage.value === 'main_content'

    if (isInMainContentStage) {
      // Use lightweight content update to avoid reloading background video
      await updateLanguageContent(newLanguage)
    } else {
      // Use full showcase reload for other stages
      // Always mark main content as seen and set language change flag for consistent behavior
      // This ensures language changes always redirect to main content regardless of login status
      redirectManager.markMainContentSeen()

      // Set a session flag to indicate this is a language change
      try {
        sessionStorage.setItem('language_change', 'true')
        // Also set a timestamp to clear this flag after a reasonable time
        sessionStorage.setItem('language_change_time', Date.now().toString())
      } catch {
        // Ignore sessionStorage errors
      }

      await loadShowcase(newLanguage)
    }
  }

  // Stage management delegated to stageManager

  // ============================
  // Watchers
  // ============================
  // Note: Template processor cache clearing is handled proactively in updateLanguageContent
  // to ensure proper font switching when language changes

  // ============================
  // Lifecycle Hooks
  // ============================
  onUnmounted(async () => {
    try {
      // Enhanced cleanup with proper async handling for mobile optimization

      // 1. Cleanup video resources using specialized video manager (priority)
      await videoManager.cleanupAllVideos()

      // 2. Cleanup stage manager with enhanced video cleanup
      await stageManager.cleanup()

      // 3. Cleanup performance manager
      cleanupPerformance()
      resourceManager.destroy()

      // 4. Cleanup font resources using font manager
      fontManager.cleanup()

      // 5. Clear template processor caches
      templateProcessor.clearCaches()

      // 6. Reset local state
      photosCache.value = { version: -1, sorted: [] }
      showcaseData.value = null
      error.value = null
      currentModalPhoto.value = null

      // 7. Force memory cleanup on mobile devices
      if (videoManager.isMobileDevice()) {
        // Trigger final garbage collection hint
        videoManager.triggerMemoryCleanup()
      }

    } catch (cleanupError) {
      console.warn('Error during showcase cleanup:', cleanupError)
      // Ensure critical state is reset even if cleanup fails
      showcaseData.value = null
      error.value = null
      currentModalPhoto.value = null
    }
  })

  // ============================
  // Return Public API
  // ============================
  return {
    // State (maintained for backward compatibility)
    loading,
    contentLoading,
    error,
    showcaseData,
    currentLanguage,
    isPhotoModalOpen,
    currentModalPhoto,

    // State from stage manager
    isEnvelopeOpened: stageManager.isEnvelopeOpened,
    isPlayingEventVideo: stageManager.isPlayingEventVideo,
    videoLoading: stageManager.videoLoading,
    eventVideoRef: stageManager.eventVideoRef,
    isMusicPlaying: stageManager.isMusicPlaying,
    audioRef: stageManager.audioRef,
    coverStageReady: stageManager.coverStageReady,
    currentShowcaseStage: stageManager.currentShowcaseStage,

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
    dressCodes,
    primaryColor,
    secondaryColor,
    accentColor,
    backgroundColor,
    guestnameColor,
    templateColor,
    currentFont: primaryFont, // Deprecated: use primaryFont instead
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
    updateLanguageContent,
    loadCustomFonts: fontManager.loadCustomFonts,
    openEnvelope: stageManager.openEnvelope,
    onVideoCanPlay: stageManager.onVideoCanPlay,
    onEventVideoEnded: stageManager.onEventVideoEnded,
    onEventVideoError: stageManager.onEventVideoError,
    getMediaUrl: templateProcessor.getMediaUrl,
    openGoogleMap,
    openPhotoModal,
    closePhotoModal,
    navigateToPhoto,
    changeLanguage,
    initializeAudio: stageManager.initializeAudio,
    playMusic: stageManager.playMusic,
    pauseMusic: stageManager.pauseMusic,
    toggleMusic: stageManager.toggleMusic,
    handleCoverStageReady: stageManager.handleCoverStageReady,
    setStage: stageManager.setStage,

    // Font manager state
    fontsLoaded: fontManager.fontsLoaded,
    fontsLoadedCount: fontManager.fontsLoadedCount,
    fontLoadStats: fontManager.fontLoadStats,

    // Redirect State Management
    initializeShowcaseStage: async () => {
      const initialStage = await redirectManager.getInitialStage()
      stageManager.currentShowcaseStage.value = initialStage
    },
    handleLoginRedirectWithStage: redirectManager.handleLoginRedirectWithStage,
    hasSeenMainContent: redirectManager.hasSeenMainContent,
    shouldSkipToMainContent: redirectManager.shouldSkipToMainContent,
    markMainContentSeen: redirectManager.markMainContentSeen,
    getMainContentSeenKey: redirectManager.getMainContentSeenKey,
    getRedirectIndicators: redirectManager.getRedirectIndicators,
    isPageRefresh: redirectManager.isPageRefresh,
    clearLanguageChangeFlags: redirectManager.clearLanguageChangeFlags,

    // Video State Preservation
    videoStatePreserved: redirectManager.videoStatePreserved,
    preserveVideoState: redirectManager.preserveVideoState,
    clearVideoStatePreservation: redirectManager.clearVideoStatePreservation,

    // Video Resource Manager with enhanced capabilities
    videoResourceManager: videoManager,

    // Memory management utilities
    getVideoMemoryStats: () => videoManager.getMemoryStats(),
    forceVideoCleanup: () => videoManager.cleanupAllVideos(),
    triggerGarbageCollection: () => videoManager.triggerMemoryCleanup(),
  }
}
