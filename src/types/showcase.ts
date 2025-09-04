/**
 * Type definitions for showcase components
 * These types ensure type safety across the refactored showcase system
 */

// Core showcase data types
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
  user: number
  comment_text: string
  created_at: string
  user_info?: {
    id: number
    username: string
    first_name: string
    last_name: string
    profile_picture: string
  }
}

export interface EventPaymentMethod {
  id: number
  event: string
  payment_method: string
  account_holder: string
  account_number: string
  qr_code?: string
  is_active: boolean
  order?: number
  payment_method_display?: string
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

// RSVP specific types
export type RSVPStatus = 'coming' | 'not_coming' | null

export interface RSVPData {
  status: RSVPStatus
  additional_guests: number
  notes?: string
  guest_names?: string[]
  created_at?: string
  updated_at?: string
}

// Component prop types
export interface BaseShowcaseProps {
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  currentFont?: string
  primaryFont?: string
  secondaryFont?: string
  eventTexts?: EventText[]
  currentLanguage?: string
}


// Error boundary types
export interface ErrorInfo {
  componentStack: string
  errorBoundary?: string
}

export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

// Performance monitoring types
export interface PerformanceMetrics {
  renderTime: number
  componentName: string
  timestamp: number
  memoryUsage?: number
}

// Animation types
export interface AnimationConfig {
  duration: number
  delay?: number
  easing: string
  threshold?: number
}

// Form validation types
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  message: string
}

export interface FormFieldConfig {
  name: string
  type: 'text' | 'email' | 'number' | 'textarea' | 'select'
  label: string
  placeholder?: string
  rules?: ValidationRule[]
  options?: Array<{ value: string; label: string }>
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
  meta?: {
    page?: number
    total?: number
    count?: number
    next?: string | null
    previous?: string | null
  }
}

export interface PaginatedResponse<T> extends ApiResponse<{ results: T[] }> {
  data: {
    results: T[]
    count: number
    next: string | null
    previous: string | null
  }
}

// Theme and styling types
export interface ThemeColors {
  primary: string
  secondary?: string
  accent: string
  background: string
  surface: string
  text: string
  textSecondary: string
}

export interface FontConfig {
  primary: string
  secondary: string
  accent: string
  decorative: string
}

// Utility types
export type RequiredProps<T, K extends keyof T> = T & Required<Pick<T, K>>
export type OptionalProps<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// Event and callback types
export type EventHandler<T = void> = () => T
export type EventHandlerWithParam<P, T = void> = (param: P) => T
export type AsyncEventHandler<T = void> = () => Promise<T>
export type AsyncEventHandlerWithParam<P, T = void> = (param: P) => Promise<T>

// Component emit types
export interface RSVPSectionEmits {
  rsvpUpdated: [RSVPData]
  signInRequired: []
  error: [string]
}

export interface PhotoGalleryEmits {
  openPhoto: [EventPhoto]
}

export interface CommentSectionEmits {
  commentSubmitted: [EventComment]
}

// Responsive breakpoint types
export type BreakpointSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export interface ResponsiveConfig<T> {
  xs?: T
  sm?: T
  md?: T
  lg?: T
  xl?: T
  '2xl'?: T
}

// Accessibility types
export interface A11yConfig {
  ariaLabel?: string
  ariaDescribedBy?: string
  role?: string
  tabIndex?: number
  keyboardShortcut?: string
}