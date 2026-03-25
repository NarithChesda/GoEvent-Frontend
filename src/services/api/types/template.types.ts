/**
 * Event template type definitions
 */

export interface EventTemplateFont {
  id: number
  name: string
  font_file: string
}

export interface EventTemplateLanguageFont {
  id: number
  language: string
  language_display: string
  font: EventTemplateFont | null
  font_type: string
  font_type_display: string
}

export interface EventTemplateColor {
  id: number
  hex_color_code: string
  name: string
}

export interface EventTemplatePackagePlan {
  id: number
  name: string
  price: string
  commission: string
  features: string[]
  category?: {
    id: number
    name: string
    color: string
  }
}

export interface EventTemplate {
  id: number
  name: string
  package_plan: EventTemplatePackagePlan
  preview_image: string
  youtube_preview_url?: string
  template_colors: EventTemplateColor[]
  template_fonts: EventTemplateLanguageFont[]
  open_envelope_button?: string
  basic_decoration_photo?: string
  basic_background_photo?: string
  standard_cover_video?: string
  standard_background_video?: string
  created_at?: string
  updated_at?: string
}

export interface TemplateAssets {
  open_envelope_button?: string
  basic_decoration_photo?: string
  basic_background_photo?: string
  standard_cover_video?: string
  standard_background_video?: string
  ambient_creatures?: AmbientCreaturesConfig | null
  [key: string]: unknown
}

/**
 * Cover stage layout configuration
 * All values are optional with sensible defaults applied in components
 */
export interface CoverStageLayout {
  // Container positioning (vh units)
  contentTopPosition?: number       // default: 23.5
  innerContainerHeight?: number     // default: 53

  // Row heights (% of inner container)
  eventTitleHeight?: number         // default: 18.75
  logoHeight?: number               // default: 48
  inviteTextHeight?: number         // default: 8.75
  guestNameHeight?: number          // default: 16

  // Swipe arrow positioning (vh units)
  swipeArrowBottom?: number         // default: 5

  // Decoration z-indexes
  leftDecorationZIndex?: number     // default: 24
  rightDecorationZIndex?: number    // default: 24
  topDecorationZIndex?: number      // default: 25
  bottomDecorationZIndex?: number   // default: 25

  // Animation settings
  showcaseAnimationType?: 'decoration' | 'door'  // default: 'decoration'
}

/**
 * Built-in falling particle effect types.
 * Each maps to a predefined SVG shape in the particle registry.
 */
export type FallingEffectType = 'petals' | 'confetti' | 'snowflakes' | 'stars' | 'leaves' | 'none'

/**
 * Configuration for the falling particle effect on the showcase main stage.
 *
 * Supports two rendering modes:
 * 1. **Built-in SVG shapes** — set `type` to a preset (petals, confetti, etc.)
 * 2. **Custom image** — set `custom_image` to a URL of a transparent PNG/SVG
 *    uploaded via the template. When `custom_image` is set, `type` is ignored
 *    for rendering but still useful for labeling/categorization.
 *
 * Recommended custom image specs:
 * - Format: PNG with transparency or SVG
 * - Size: 64×64 px to 128×128 px
 * - File size: under 20 KB for performance
 */
export interface FallingEffectConfig {
  /** Which built-in particle shape to use (ignored when custom_image is set) */
  type: FallingEffectType
  /** URL to a custom particle image — overrides the built-in SVG shape */
  custom_image?: string | null
  /** Where to source the particle color (only applies to built-in SVG shapes) */
  color_source?: 'primary' | 'accent' | 'custom'
  /** Hex color when color_source is 'custom' */
  custom_color?: string | null
  /** Controls spawn rate and max particles on screen */
  intensity?: 'light' | 'normal' | 'heavy'
}

/**
 * Ambient creature types available for the cover stage effect.
 * Each maps to a pure SVG creature with animated wings/glow.
 */
export type AmbientCreatureEffectType = 'butterfly' | 'dove' | 'firefly' | 'dragonfly'

/**
 * A single creature entry in the ambient creatures configuration.
 * Defines which creature type to include, its relative spawn weight,
 * and optional size overrides.
 */
export interface AmbientCreatureEntry {
  /** Which creature SVG to render */
  type: AmbientCreatureEffectType
  /** Relative spawn weight (1–10). Higher = more of this type in the mix. Default: 1 */
  weight?: number
  /** Minimum creature size in pixels. Overrides built-in default when set. */
  min_size?: number | null
  /** Maximum creature size in pixels. Overrides built-in default when set. */
  max_size?: number | null
}

/**
 * Configuration for ambient creature animations on the cover stage.
 *
 * Controls which creature types appear, their proportions, sizes, count,
 * speed, and color. The `creatures` array defines a weighted spawn pool —
 * each entry's `weight` determines how frequently that type is chosen.
 *
 * Example: `{ creatures: [{ type: "butterfly", weight: 2 }, { type: "firefly", weight: 3 }], count: 6 }`
 * creates a pool of ~2 butterflies and ~3 fireflies out of 6 total.
 */
export interface AmbientCreaturesConfig {
  /** Which creature types to include and their configuration. At least one entry required. */
  creatures: AmbientCreatureEntry[]
  /** Total number of creatures to spawn on screen (1–15). Default: 6 */
  count?: number
  /** Global flight speed preset. Default: 'normal' */
  speed?: 'slow' | 'normal' | 'fast'
  /** Which template color to use for SVG creature fill. Default: 'accent' */
  color_source?: 'primary' | 'accent' | 'custom'
  /** Hex color when color_source is 'custom' */
  custom_color?: string | null
}

export interface PackagePlan {
  id: number
  name: string
  description: string
  price: string
  commission: string
  features: string[]
  is_active: boolean
  category?: {
    id: number
    name: string
    color: string
  }
}

export interface BrowseTemplatesResponse {
  message: string
  templates: EventTemplate[]
}

// Partner Template types
export type PartnerTemplateStatus = 'draft' | 'pending_review' | 'approved' | 'rejected'

export interface PartnerTemplate {
  id: number
  name: string
  package_plan: EventTemplatePackagePlan | null
  template_type: 'partner'
  status: PartnerTemplateStatus
  status_display: string
  created_by: number
  created_by_name: string
  admin_notes: string
  reviewed_by: number | null
  reviewed_at: string | null
  preview_image: string | null
  youtube_preview_url: string | null
  template_colors: EventTemplateColor[]
  template_fonts: EventTemplateLanguageFont[]
  cover_stage_layout: CoverStageLayout | null
  falling_effect: FallingEffectConfig | null
  ambient_creatures: AmbientCreaturesConfig | null
  display_liquid_glass_background: boolean
  open_envelope_button: string | null
  basic_decoration_photo: string | null
  basic_background_photo: string | null
  top_decoration: string | null
  bottom_decoration: string | null
  left_decoration: string | null
  right_decoration: string | null
  cover_top_decoration: string | null
  cover_bottom_decoration: string | null
  cover_left_decoration: string | null
  cover_right_decoration: string | null
  guest_title_frame_left: string | null
  guest_title_frame_mid: string | null
  guest_title_frame_right: string | null
  standard_cover_video: string | null
  standard_background_video: string | null
  created_at: string
  updated_at: string
}

export interface PartnerTemplateCreatePayload {
  name: string
  package_plan_id?: number | null
  preview_image?: File
  youtube_preview_url?: string
  basic_background_photo?: File
  basic_decoration_photo?: File
  top_decoration?: File
  bottom_decoration?: File
  left_decoration?: File
  right_decoration?: File
  cover_top_decoration?: File
  cover_bottom_decoration?: File
  cover_left_decoration?: File
  cover_right_decoration?: File
  guest_title_frame_left?: File
  guest_title_frame_mid?: File
  guest_title_frame_right?: File
  standard_cover_video?: File
  standard_background_video?: File
  display_liquid_glass_background?: boolean
  open_envelope_button?: File
  cover_stage_layout?: CoverStageLayout
  falling_effect?: FallingEffectConfig
  /** Custom particle image file (uploaded as part of template creation) */
  falling_effect_custom_image?: File
  ambient_creatures?: AmbientCreaturesConfig
}

// Custom fonts (available via core-data endpoint)
export interface CustomFont {
  id: number
  name: string
  font_file: string
  created_at: string
  updated_at: string
}

// Template Color CRUD payloads
export interface CreateTemplateColorPayload {
  hex_color_code: string
  name: string
}

export type UpdateTemplateColorPayload = Partial<CreateTemplateColorPayload>

// Template Font types
export type TemplateFontType = 'primary' | 'secondary' | 'accent' | 'decorative'
export type TemplateLanguageCode = 'en' | 'kh' | 'fr' | 'ja' | 'ko' | 'zh-cn' | 'th' | 'vn'

// Nested font payload (font is an integer ID in create/update)
export interface CreateTemplateFontPayload {
  language: TemplateLanguageCode
  font: number
  font_type: TemplateFontType
}

export type UpdateTemplateFontPayload = Partial<CreateTemplateFontPayload>

// Label maps for display
export const FONT_TYPE_LABELS: Record<TemplateFontType, string> = {
  primary: 'Primary',
  secondary: 'Secondary',
  accent: 'Accent',
  decorative: 'Decorative',
}

export const LANGUAGE_CODE_LABELS: Record<TemplateLanguageCode, string> = {
  en: 'English',
  kh: 'Khmer',
  fr: 'French',
  ja: 'Japanese',
  ko: 'Korean',
  'zh-cn': 'Chinese (Simplified)',
  th: 'Thai',
  vn: 'Vietnamese',
}

export interface SubmitForReviewResponse {
  message: string
  template: PartnerTemplate
}
