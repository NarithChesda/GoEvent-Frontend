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
  font: EventTemplateFont
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
}

export interface BrowseTemplatesResponse {
  message: string
  templates: EventTemplate[]
}
