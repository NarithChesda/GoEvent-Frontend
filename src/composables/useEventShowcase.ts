// Imports - Vue Core
import { ref, computed, nextTick, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

// Imports - Services & API
import { eventsService, type EventPaymentMethod } from '../services/api'
import type {
  AmbientCreaturesConfig,
  CoverStageLayout,
  FallingEffectConfig,
  EventDetailsDesignConfig,
  HostInfoDesignConfig,
  InfoCardDesignConfig,
  SaveTheDateDesignConfig,
  SparkFieldConfig,
  StageModesConfig,
} from '../services/api/types/template.types'
import type { StoredMusicStartStage } from '../services/api/types/event.types'

// Imports - Composables
import { usePerformance, ResourceManager } from '../utils/performance'
import { useFontManager } from './showcase/useFontManager'
import { useVideoResourceManager } from './showcase/useVideoResourceManager'
import { useShowcaseStages, normalizeMusicStartStage } from './showcase/useShowcaseStages'
import { useShowcaseRedirect } from './showcase/useShowcaseRedirect'
import { useTemplateProcessor } from './showcase/useTemplateProcessor'

// Imports - Utilities
import { updateMetaTags, getBestEventImage, createEventDescription } from '../utils/metaUtils'
import { translateRSVP, type SupportedLanguage } from '../utils/translations'

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
  /**
   * This row's size trim, multiplied onto the library face's own normalization
   * when the `@font-face` is injected. See `src/utils/fontMetrics.ts`.
   */
  size_scale?: number | string | null
  font?: {
    name: string
    font_file: string
    /** Metric normalization for the face itself — a property of the typeface. */
    size_adjust?: number | string | null
    ascent_override?: number | string | null
    descent_override?: number | string | null
    line_gap_override?: number | string | null
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
    /**
     * Standard mode's middle stage, when the organizer has no `event_video` of
     * their own — see eventVideoUrl below. Backend field pending:
     * docs/backend-api-requirements/standard-transition-video.md.
     */
    standard_transition_video?: string
    standard_background_video?: string
    top_decoration?: string
    bottom_decoration?: string
    left_decoration?: string
    right_decoration?: string
    cover_top_decoration?: string
    cover_bottom_decoration?: string
    cover_left_decoration?: string
    cover_right_decoration?: string
    sample_logo_1?: string | null
    sample_logo_2?: string | null
    header_text_image?: string | null
    // The guest-name title frame pieces live in here, NOT at the top level of
    // TemplateAssets (where they're also declared, below, but never read) — the
    // templateAssets computed spreads this sub-object and hands the result to
    // CoverContentOverlay, which is what actually renders them.
    guest_title_frame_left?: string | null
    guest_title_frame_mid?: string | null
    guest_title_frame_right?: string | null
  }
  colors?: TemplateColor[]
  fonts?: TemplateFont[]
  /** @deprecated Use cover_stage_layout.contentTopPosition instead */
  cover_content_top_position?: number
  /** Comprehensive cover stage layout configuration */
  cover_stage_layout?: CoverStageLayout
  /** Falling particle effect configuration */
  falling_effect?: FallingEffectConfig | null
  /** Ambient creature (butterfly/dove/firefly…) effect for the cover stage. */
  ambient_creatures?: AmbientCreaturesConfig | null
  /**
   * Drifting spark field, spanning every stage. Absent falls back to the legacy
   * `cover_stage_layout.coverGilding` spark fields — see resolveSparkField.
   */
  sparks?: SparkFieldConfig | null
  /**
   * Which showcase presentation layer this template renders: 'v1' (classic
   * cover/transition/main-content) or 'v2' ("Storybook Romance" scroll-story).
   * Not yet sent by the backend — see
   * docs/backend-api-requirements/showcase-template-version.md. Absent/null
   * is handled as "unset" by callers, which fall back to their own default.
   */
  showcase_template_version?: 'v1' | 'v2' | null
  /** Date + location block design (panel | calendar). Defaults to `panel`. */
  event_details_design?: EventDetailsDesignConfig | null
  /** Host info block design (standard | simple). Defaults to `standard`. */
  host_info_design?: HostInfoDesignConfig | null
  /** Info card (venue/map/countdown/RSVP) design (glass | engraved). Defaults to `glass`. */
  info_card_design?: InfoCardDesignConfig | null
  /**
   * Transition-stage Save the Date composition. Absent falls back per stage —
   * `script` on the decoration transition, `engraved` on the door — so every
   * already-published template renders unchanged.
   */
  save_the_date_design?: SaveTheDateDesignConfig | null
  /**
   * Which stages animate and which play a film. Absent falls back to the
   * legacy asset/category inference that read a package plan out of the
   * uploaded videos — see resolveStageModes.
   */
  stage_modes?: StageModesConfig | null
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
  /**
   * Organizer-chosen crop rectangle, in percentages of the source image, used
   * when the photo is displayed full-screen (the transition stage's featured
   * photo). All four absent = the whole image = a plain centre crop.
   * See src/utils/photoCrop.ts.
   */
  crop_x?: number | null
  crop_y?: number | null
  crop_width?: number | null
  crop_height?: number | null
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
  music_start_time?: number | null
  music_end_time?: number | null
  music_start_stage?: StoredMusicStartStage | null
  google_map_embed_link?: string
  youtube_embed_link?: string
  registration_required?: boolean
  rsvp_enabled?: boolean
  comments_enabled?: boolean
  countdown_enabled?: boolean
  payment_lock?: boolean
  privacy?: 'public' | 'private'
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
export interface UseEventShowcaseOptions {
  /** Explicit event id, bypassing route-param resolution. Used when embedding
   *  the showcase data pipeline outside the `/events/:id/showcase` route (e.g.
   *  the manage-page live preview tab).
   *
   *  A getter is accepted for previews whose event can change without this
   *  composable being recreated — the public design catalogue swaps the sample
   *  invitation when the design on screen belongs to another category. The id is
   *  read per call, so the request-deduplication keys follow the swap instead of
   *  matching a load that is still in flight for the previous event. */
  eventId?: string | (() => string | undefined)
  /** Skip the document.title / <meta> / JSON-LD mutation loadShowcase() performs.
   *  Default false (unchanged behavior) — set true when embedding in a page that
   *  owns its own document head (e.g. the manage page). */
  skipMetaTags?: boolean
  /** When there's no real guest link (no `guest_name` query param / meta),
   *  fall back to a translated "Honored Guest" placeholder instead of an
   *  empty guestName — used by the manage-page live preview, which has no
   *  guest context to carry a real name, so the invite text + guest name
   *  cover rows (gated on `guestName` being truthy) still render. */
  useDefaultGuestName?: boolean
  /**
   * Answer showcase requests from here instead of the events endpoint.
   *
   * For previews that resolve their own event — the public design catalogue
   * draws each design through a real event of that design's category, and falls
   * back to a bundled sample when nothing is published for it (see
   * `loadTemplatePreviewShowcase`). The contract is the endpoint's own: one call
   * returns ONE language's content, so the initial load, the silent refresh and
   * the in-place language switch below all keep working unchanged.
   */
  dataSource?: (language: string) => Promise<ShowcaseData>
}

export function useEventShowcase(options?: UseEventShowcaseOptions) {
  const route = useRoute()

  const resolveEventId = (): string | undefined => {
    const explicit = typeof options?.eventId === 'function' ? options.eventId() : options?.eventId
    return explicit || (route.params.id as string | undefined)
  }

  // ============================
  // External Composables
  // ============================

  const { deduplicateRequest, cleanup: cleanupPerformance } = usePerformance()

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
  /**
   * The guest this showcase was actually opened for, or '' when nobody.
   *
   * This — never `guestName` below — is what identifies a guest to the backend.
   * The two differ only under `useDefaultGuestName`, and confusing them there is
   * not cosmetic: the showcase endpoint echoes whatever `guest_name` it is sent
   * straight back as `meta.guest_name`, so sending the placeholder made the
   * server hand it back as if it were a real guest. From then on the branch
   * below was unreachable, and the preview's guest name stayed frozen in
   * whichever language the frame first loaded in (Khmer, per `urlLang`) however
   * many times the language was switched.
   */
  const resolvedGuestName = computed(() => {
    const guestNameFromQuery = route.query.guest_name
    const guestNameStr = Array.isArray(guestNameFromQuery)
      ? guestNameFromQuery[0]
      : guestNameFromQuery
    return meta.value.guest_name || guestNameStr || ''
  })

  /**
   * The guest name to DISPLAY, which for a preview with no guest link is a
   * translated "Honored Guest" placeholder that follows the language on screen.
   */
  const guestName = computed(() => {
    if (resolvedGuestName.value) return resolvedGuestName.value
    if (options?.useDefaultGuestName) {
      return translateRSVP('default_guest_name', currentLanguage.value as SupportedLanguage)
    }
    return ''
  })

  // Guest shortcode (`g=...`) — write-only credential for commenting on private
  // events. Captured once from the URL on showcase load and stashed in
  // sessionStorage so it survives intra-session navigation. Treated like a
  // short-lived bearer token: never written to localStorage, cookies, or logs.
  const guestShortcode = computed<string | null>(() => {
    const eventId = resolveEventId() || event.value?.id
    if (!eventId) return null

    const fromQuery = route.query.g
    const queryShortcode = Array.isArray(fromQuery) ? fromQuery[0] : fromQuery
    const storageKey = `guest:${eventId}`

    if (queryShortcode) {
      try {
        // The real name, not the placeholder — this is stored alongside a
        // credential, so it has to be who the guest is, not what is on screen.
        const guestNameStr = resolvedGuestName.value || ''
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({ shortcode: queryShortcode, guestName: guestNameStr }),
        )
      } catch {
        // sessionStorage may be unavailable (privacy mode) — non-fatal.
      }
      return queryShortcode
    }

    try {
      const stored = sessionStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored) as { shortcode?: string }
        return parsed.shortcode || null
      }
    } catch {
      // ignore
    }
    return null
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


  const eventTexts = computed(() => event.value?.event_texts || [])
  const hosts = computed(() => event.value?.hosts || [])
  const agendaItems = computed(() => event.value?.agenda_items || [])

  const eventPhotos = computed(() => {
    const photos = event.value?.photos || event.value?.event_photos || []
    if (photos.length === 0) return []
    return [...photos].sort((a, b) => (a.order || 0) - (b.order || 0))
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

  const blurEffectColor = computed(() => extractedColors.value.blurEffectColor)

  const isEventPast = computed(() => {
    if (!event.value?.end_date) return false
    return new Date(event.value.end_date) < new Date()
  })

  /**
   * The video that plays as the middle beat of the standard flow — cover →
   * this → background video + main content.
   *
   * The organizer's own upload wins, because that stage was built for exactly
   * that: a film made for this one event, played with its own sound. The
   * template's `standard_transition_video` is the fallback for every event that
   * never uploads one — a general-purpose standard template previously had no
   * way to ship a transition of its own, so those events skipped the beat
   * entirely and cut from cover straight to main content.
   *
   * Still named eventVideoUrl (rather than something stage-shaped) because that
   * is the prop name the whole video pipeline uses — CoverStage, VideoContainer,
   * useCoverStageVideo and the preview's Event Video frame all speak it, and
   * none of them care where the URL came from.
   */
  const eventVideoUrl = computed(() => {
    const source =
      event.value?.event_video || event.value?.template_assets?.assets?.standard_transition_video
    return source ? templateProcessor.getMediaUrl(source) : null
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

  const musicStartTime = computed(() => event.value?.music_start_time || 0)
  const musicEndTime = computed(() => event.value?.music_end_time ?? undefined)
  /** Null/absent is meaningful — the stage gate reads it as "keep the old
   *  per-flow timing", so it is passed through rather than defaulted here.
   *  Normalized because the column may still hold the withdrawn `cover`. */
  const musicStartStage = computed(() => normalizeMusicStartStage(event.value?.music_start_stage))

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

  /**
   * One showcase response, from whichever source this instance was given.
   *
   * The three callers below (initial load, silent refresh, language switch) all
   * go through here so a `dataSource` preview follows exactly the same merge
   * and font paths as a real event — see UseEventShowcaseOptions.dataSource.
   */
  const fetchShowcase = async (
    eventId: string,
    params: { lang?: string; guest_name?: string },
    failureMessage: string,
  ): Promise<ShowcaseData> => {
    if (options?.dataSource) {
      return await options.dataSource(params.lang || currentLanguage.value)
    }

    const showcaseResponse = await eventsService.getEventShowcase(eventId, params)

    if (!showcaseResponse.success || !showcaseResponse.data) {
      throw new Error(showcaseResponse.message || failureMessage)
    }

    return showcaseResponse.data as ShowcaseData
  }

  const loadShowcase = async (forceLanguage?: string) => {
    const eventId = resolveEventId()
    if (!eventId) {
      error.value = 'Invalid event ID'
      return
    }

    const language = forceLanguage || (route.query.lang as string) || currentLanguage.value
    const guest = resolvedGuestName.value || ''
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

        if (resolvedGuestName.value) {
          params.guest_name = resolvedGuestName.value as string
        }

        return await fetchShowcase(eventId, params, 'Failed to load event invitation')
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

      // Update meta tags for social sharing (skipped when embedded in a page
      // that owns its own document head, e.g. the manage-page preview tab)
      if (!options?.skipMetaTags) {
        updateEventMetaTags(data.event)
      }

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

      // A template try-on that arrived before there was anything to overlay it
      // onto (see pendingStagedPreview). Replayed last so its own font load
      // supersedes the real template's above, and early enough that the
      // preview frame's `loadShowcase().then(loadPreviewTemplateFallback)`
      // chain sees template_assets already filled and stands down.
      if (pendingStagedPreview) {
        setStagedTemplatePreview(pendingStagedPreview)
      }

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
   * Silently refetches the showcase data in place — no `loading` toggle, no
   * stage re-initialization, no font/meta work — so the rendered showcase
   * updates without unmounting anything (no spinner flash, no re-run of the
   * mount-driven entry animations, no background video reload). Used by the
   * manage-page preview after a parent-side editor save; the same-language
   * event_texts merge mirrors updateLanguageContent's, since the API only
   * returns texts for the requested language.
   */
  const refreshShowcaseData = async () => {
    const eventId = resolveEventId()
    if (!eventId) return

    const guest = resolvedGuestName.value || ''
    const requestKey = `showcase-refresh-${eventId}-${currentLanguage.value}-${guest}`

    try {
      const params: { lang?: string; guest_name?: string } = {
        lang: currentLanguage.value,
      }
      if (resolvedGuestName.value) {
        params.guest_name = resolvedGuestName.value as string
      }

      const data: ShowcaseData = await deduplicateRequest<ShowcaseData>(requestKey, async (): Promise<ShowcaseData> => {
        return await fetchShowcase(eventId, params, 'Failed to refresh event content')
      })

      if (showcaseData.value) {
        const existingTexts = showcaseData.value.event.event_texts || []
        const newTexts = data.event.event_texts || []
        const textsFromOtherLanguages = existingTexts.filter(
          (text) => text.language !== currentLanguage.value,
        )
        showcaseData.value = {
          ...data,
          event: {
            ...data.event,
            event_texts: [...textsFromOtherLanguages, ...newTexts],
          },
        }
      } else {
        showcaseData.value = data
      }

      // Re-overlay a committed (applied but not yet paid for) template that the
      // server just answered without — see committedPreviewTemplate.
      if (committedPreviewTemplate && !showcaseData.value.event.template_assets) {
        applyPreviewTemplateFallback(committedPreviewTemplate, { force: true })
      }
    } catch (err: unknown) {
      // A failed background refresh keeps showing the current (stale) data —
      // never blank an already-rendered showcase over it.
      console.warn('Silent showcase refresh failed:', err)
    }
  }

  /**
   * Merges a handful of just-saved event fields into the loaded showcase data,
   * without a refetch.
   *
   * Preview-only (the manage page's live preview frames, over the bridge's
   * `patch-event`). A full `refreshShowcaseData()` replaces every field at once
   * and re-runs the font pass, which the host sees as the preview blinking; when
   * a save's entire effect is a value the frame already binds — a replaced logo,
   * say — copying that value in is enough, and Vue re-renders just the bound
   * node. The parent decides which fields qualify (previewRefreshScope.ts).
   *
   * A patch arriving before the initial load has nothing to merge into, and
   * needs nothing: the save is already server-side, so the load in flight
   * returns it anyway.
   */
  const applyEventFieldPatch = (fields: Record<string, unknown>) => {
    if (!showcaseData.value) return
    showcaseData.value = {
      ...showcaseData.value,
      event: { ...showcaseData.value.event, ...fields },
    }
  }

  /**
   * Preview-only escape hatch. The showcase endpoint nulls `event.template_assets`
   * server-side until payment is confirmed (see `get_template_assets` in the
   * backend showcase serializer), so an event with a selected-but-unpaid
   * template otherwise renders with no template look at all. The manage-page
   * live preview tab wants owners to see their pending template before paying,
   * so it separately fetches the public, no-auth `public_template_assets`
   * endpoint (keyed by template id, not event/payment) and feeds the result in
   * here. Only ever called from the preview frame — the real public showcase
   * never calls this, so the payment gate stays intact for guests.
   */
  const applyPreviewTemplateFallback = (templateData: TemplateAssets, options?: { force?: boolean }) => {
    if (!showcaseData.value) return
    if (showcaseData.value.event.template_assets && !options?.force) return // already has real (paid) data

    showcaseData.value = {
      ...showcaseData.value,
      event: {
        ...showcaseData.value.event,
        template_assets: templateData,
        // templateColors/templateFonts read these top-level fields before
        // falling back to template_assets.colors/fonts, so a forced preview
        // must overwrite them too or colors/fonts would stay stuck on
        // whichever template they came from.
        ...(options?.force ? { template_colors: templateData.colors, template_fonts: templateData.fonts } : {}),
      },
    }

    // Colors apply from data alone, but fonts need their files fetched, and
    // loadShowcase() already did its one-and-only loadCustomFonts() pass —
    // with an EMPTY list, because template_assets was still nulled at that
    // point. That left fontsLoaded=true with no @font-face rules injected, so
    // primaryFont/secondaryFont now resolve to `"<TemplateFont>", <fallback>`
    // naming a family the browser never downloaded, and every string silently
    // renders in the fallback instead. Load this template's fonts now.
    void loadFontsForCurrentLanguage()
  }

  /**
   * Fetches + registers the custom fonts for whatever template data is
   * currently in `showcaseData`, for the active language. Safe to call any
   * time template fonts change outside the initial load.
   */
  const loadFontsForCurrentLanguage = async () => {
    // getLanguageFonts is memoized per language, and it was populated while
    // the font list was still empty — without this, the fresh fonts are never
    // seen no matter how many times they're loaded.
    templateProcessor.invalidateFontCache()
    await nextTick()

    const langFonts = templateFonts.value.filter((f) => f.language === currentLanguage.value)
    if (langFonts.length === 0) return

    try {
      await fontManager.loadCustomFonts(langFonts, {
        display: 'swap',
        timeout: fontManager.FONT_CONFIG.DEFAULT_TIMEOUT,
        retryAttempts: fontManager.FONT_CONFIG.DEFAULT_MAX_RETRIES,
      })
      await nextTick()
    } catch (fontError) {
      console.warn('Preview template font loading failed, using fallback fonts:', fontError)
    }
  }

  /**
   * Live, non-destructive template try-on: overlays another template's
   * assets/colors/fonts onto the currently loaded showcase without touching
   * the backend, even when the event already has a real active template.
   * The real (pre-try-on) fields are snapshotted the first time this is
   * called so `clearStagedTemplatePreview` below can restore them locally —
   * cancelling a try-on never needs to touch the network.
   */
  let stagedPreviewSnapshot: {
    template_assets: EventData['template_assets']
    template_colors: EventData['template_colors']
    template_fonts: EventData['template_fonts']
  } | null = null

  /**
   * A try-on pushed in before this instance had any showcase data to overlay it
   * onto. The preview tab posts a staged template into a frame the moment the
   * iframe's `load` event fires, and that event doesn't wait on the frame's own
   * showcase request — so on a fast API the push can land first, and
   * applyPreviewTemplateFallback would drop it on the floor (it bails without
   * `showcaseData`), leaving that frame showing the applied template forever.
   * Held here instead and replayed by loadShowcase once there's data.
   */
  let pendingStagedPreview: TemplateAssets | null = null

  const setStagedTemplatePreview = (templateData: TemplateAssets) => {
    if (!showcaseData.value) {
      pendingStagedPreview = templateData
      return
    }
    pendingStagedPreview = null
    if (!stagedPreviewSnapshot) {
      stagedPreviewSnapshot = {
        template_assets: showcaseData.value.event.template_assets,
        template_colors: showcaseData.value.event.template_colors,
        template_fonts: showcaseData.value.event.template_fonts,
      }
    }
    applyPreviewTemplateFallback(templateData, { force: true })
  }

  /**
   * Cancels a live try-on locally (no request) by restoring whatever the real
   * template fields were before the first `setStagedTemplatePreview` call.
   * A no-op if nothing is currently staged — e.g. the modal closed without
   * ever picking a template.
   */
  const clearStagedTemplatePreview = () => {
    // Cancelling also cancels a try-on still waiting on the initial load —
    // otherwise it would be applied after the user already backed out of it.
    pendingStagedPreview = null
    if (!stagedPreviewSnapshot || !showcaseData.value) return
    const snapshot = stagedPreviewSnapshot
    stagedPreviewSnapshot = null
    showcaseData.value = {
      ...showcaseData.value,
      event: {
        ...showcaseData.value.event,
        template_assets: snapshot.template_assets,
        template_colors: snapshot.template_colors,
        template_fonts: snapshot.template_fonts,
      },
    }
    void loadFontsForCurrentLanguage()
  }

  /**
   * The template look a committed try-on left in place, so `refreshShowcaseData`
   * can put it back.
   *
   * A just-applied template is almost always still unpaid, and the showcase
   * endpoint nulls `template_assets` until payment confirms — so every silent
   * refresh (i.e. every content save) hands back an event with no template at
   * all. The frame's own id-keyed fallback can't recover it either: that id is
   * baked into the frame's URL, which deliberately never changes on an applied
   * template (changing an iframe's `src` reloads it), so it still names the
   * PREVIOUS template. Without this the preview snapped back to the old
   * template's assets and colours on the first save after switching, and only a
   * full page reload brought the new one back.
   */
  let committedPreviewTemplate: TemplateAssets | null = null

  /**
   * A staged try-on was just confirmed for real (the event's template was
   * actually persisted server-side) — the currently staged fields already
   * ARE the new real state, so this only forgets the revert snapshot without
   * touching `showcaseData`. Without this, browsing-and-cancelling a later
   * try-on in the same frame session would incorrectly revert past the
   * just-applied template back to whatever was staged/real before it.
   */
  const commitStagedTemplatePreview = () => {
    stagedPreviewSnapshot = null
    committedPreviewTemplate = showcaseData.value?.event.template_assets ?? null
  }

  /**
   * Updates language content without triggering full loading state
   * This prevents the background video from reloading during language changes
   */
  const updateLanguageContent = async (newLanguage: string) => {
    const eventId = resolveEventId()
    if (!eventId) {
      error.value = 'Invalid event ID'
      return
    }

    if (currentLanguage.value === newLanguage) return

    const guest = resolvedGuestName.value || ''
    const requestKey = `language-content-${eventId}-${newLanguage}-${guest}`

    try {
      contentLoading.value = true
      error.value = null

      const params: { lang?: string; guest_name?: string } = {
        lang: newLanguage,
      }

      if (resolvedGuestName.value) {
        params.guest_name = resolvedGuestName.value as string
      }

      const data: ShowcaseData = await deduplicateRequest<ShowcaseData>(requestKey, async (): Promise<ShowcaseData> => {
        return await fetchShowcase(eventId, params, 'Failed to load event content')
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
            // The same `|| existing` fallback the two lines below carry. This is
            // a per-language content fetch; a response that answers without the
            // list would otherwise blank it, and every preview watching this
            // frame drops its language switcher (see postShowcaseLanguagesToParent).
            available_languages:
              data.event.available_languages || showcaseData.value.event.available_languages,
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
    guestShortcode,
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
    blurEffectColor,
    currentFont: primaryFont, // Deprecated: use primaryFont instead
    primaryFont,
    secondaryFont,
    accentFont,
    decorativeFont,
    isEventPast,
    eventVideoUrl,
    backgroundVideoUrl,
    eventMusicUrl,
    musicStartTime,
    musicEndTime,
    musicStartStage,
    availableLanguages,
    isEnvelopeButtonReady,

    // Methods
    loadShowcase,
    refreshShowcaseData,
    applyEventFieldPatch,
    applyPreviewTemplateFallback,
    setStagedTemplatePreview,
    clearStagedTemplatePreview,
    commitStagedTemplatePreview,
    updateLanguageContent,
    loadCustomFonts: fontManager.loadCustomFonts,
    openEnvelope: stageManager.openEnvelope,
    onVideoCanPlay: stageManager.onVideoCanPlay,
    onEventVideoEnded: stageManager.onEventVideoEnded,
    onEventVideoError: stageManager.onEventVideoError,
    onTransitionComplete: stageManager.onTransitionComplete,
    isTransitionStage: stageManager.isTransitionStage,
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
    armMusic: stageManager.armMusic,
    cueMusic: stageManager.cueMusic,
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
