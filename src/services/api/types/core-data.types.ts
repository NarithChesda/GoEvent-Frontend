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
