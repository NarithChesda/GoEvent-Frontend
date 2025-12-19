/**
 * Core data type definitions (icons, team members, categories)
 */

export interface AgendaIcon {
  id: number
  name: string
  svg_code: string
}

export interface TeamMember {
  id: number
  name: string
  role: string
  bio: string
  profile_picture: string | null
  email: string
  linkedin_url: string
  twitter_url: string
  github_url: string
  order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserDetails {
  username: string
  first_name?: string
  last_name?: string
  profile_picture?: string
}

/**
 * Background music from the admin-managed music library
 */
export interface BackgroundMusic {
  id: number
  name: string
  description?: string
  audio_file: string
  duration_seconds: number
  duration_display: string
  category: BackgroundMusicCategory
  category_display: string
  is_active: boolean
  order: number
  uploaded_at?: string
  updated_at?: string
}

export type BackgroundMusicCategory =
  | 'wedding'
  | 'corporate'
  | 'party'
  | 'ambient'
  | 'classical'
  | 'jazz'
  | 'pop'
  | 'traditional'

export interface BackgroundMusicCategoryInfo {
  value: BackgroundMusicCategory
  label: string
  count: number
}

export interface BackgroundMusicFilters {
  category?: BackgroundMusicCategory
  is_active?: boolean
  search?: string
  ordering?: 'order' | 'name' | 'category' | 'uploaded_at' | '-uploaded_at'
  limit?: number
  offset?: number
}

/**
 * Infinite scroll pagination response for background music
 */
export interface BackgroundMusicPaginatedResponse {
  count: number
  limit: number
  offset: number
  has_more: boolean
  next: string | null
  previous: string | null
  results: BackgroundMusic[]
}
