/**
 * Career API type definitions
 * Includes types for departments, positions, applications, benefits, testimonials, and settings
 */

import type { QueryParams } from './api.types'

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Employment type options
 */
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance'

/**
 * Experience level options
 */
export type ExperienceLevel = 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'director'

/**
 * Location type options
 */
export type LocationType = 'onsite' | 'remote' | 'hybrid'

/**
 * Application status options
 */
export type ApplicationStatus =
  | 'new'
  | 'reviewing'
  | 'shortlisted'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'withdrawn'

// ============================================================================
// CAREER DEPARTMENTS
// ============================================================================

/**
 * Career department
 */
export interface CareerDepartment {
  id: number
  name: string
  description: string
  icon: string
  order: number
  is_active: boolean
  created_at: string
  updated_at: string
  positions_count: number
}

/**
 * Create/update department request
 */
export interface CreateDepartmentRequest {
  name: string
  description: string
  icon: string
  order?: number
  is_active?: boolean
}

/**
 * Department filter options
 */
export interface DepartmentFilters extends QueryParams {
  search?: string
  ordering?: 'order' | 'name' | 'created_at' | '-created_at'
}

// ============================================================================
// CAREER POSITIONS
// ============================================================================

/**
 * Career position
 */
export interface CareerPosition {
  id: number
  slug: string
  title: string
  department: CareerDepartment
  employment_type: EmploymentType
  employment_type_display: string
  experience_level: ExperienceLevel
  experience_level_display: string
  location_type: LocationType
  location_type_display: string
  location: string
  short_description: string
  description?: string
  responsibilities?: string
  requirements?: string
  nice_to_have?: string
  salary_range_min?: string
  salary_range_max?: string
  salary_currency?: string
  benefits?: string
  application_deadline?: string
  external_application_url?: string
  contact_email?: string
  featured: boolean
  is_active: boolean
  order?: number
  views_count: number
  created_at: string
  updated_at: string
  created_by?: number
  created_by_name?: string
  applications_count: number
}

/**
 * Create/update position request
 */
export interface CreatePositionRequest {
  title: string
  department_id: number
  employment_type: EmploymentType
  experience_level: ExperienceLevel
  location_type: LocationType
  location: string
  short_description: string
  description?: string
  responsibilities?: string
  requirements?: string
  nice_to_have?: string
  salary_range_min?: string
  salary_range_max?: string
  salary_currency?: string
  benefits?: string
  application_deadline?: string
  external_application_url?: string
  contact_email?: string
  featured?: boolean
  is_active?: boolean
  order?: number
}

/**
 * Position filter options
 */
export interface PositionFilters extends QueryParams {
  department?: number
  employment_type?: EmploymentType
  experience_level?: ExperienceLevel
  location_type?: LocationType
  featured?: boolean
  is_active?: boolean
  search?: string
  ordering?: 'order' | 'created_at' | 'title' | 'views_count' | '-created_at' | '-views_count' | string
}

// ============================================================================
// CAREER APPLICATIONS
// ============================================================================

/**
 * Career application
 */
export interface CareerApplication {
  id: number
  position: number
  position_title: string
  position_department: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string
  cover_letter: string
  resume: string
  portfolio_url?: string
  linkedin_url?: string
  current_location: string
  willing_to_relocate: boolean
  available_start_date?: string
  salary_expectation?: string
  status: ApplicationStatus
  status_display: string
  notes?: string
  applied_at: string
  updated_at: string
  reviewed_by?: number | null
  reviewed_by_name?: string | null
}

/**
 * Submit application request (uses FormData)
 */
export interface SubmitApplicationData {
  position: number
  first_name: string
  last_name: string
  email: string
  phone: string
  cover_letter: string
  resume: File
  portfolio_url?: string
  linkedin_url?: string
  current_location: string
  willing_to_relocate: boolean
  available_start_date?: string
  salary_expectation?: string
}

/**
 * Application submission response
 */
export interface ApplicationResponse {
  message: string
  application: CareerApplication
}

/**
 * Update application status request
 */
export interface UpdateApplicationStatusRequest {
  status: ApplicationStatus
  notes?: string
}

/**
 * Application filter options
 */
export interface ApplicationFilters extends QueryParams {
  position?: number
  status?: ApplicationStatus
  search?: string
  ordering?: 'applied_at' | 'updated_at' | 'status' | '-applied_at' | '-updated_at' | string
}

// ============================================================================
// CAREER BENEFITS
// ============================================================================

/**
 * Career benefit
 */
export interface CareerBenefit {
  id: number
  title: string
  description: string
  icon: string
  image?: string | null
  order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Create/update benefit request (uses FormData for image upload)
 */
export interface CreateBenefitData {
  title: string
  description: string
  icon: string
  image?: File
  order?: number
  is_active?: boolean
}

/**
 * Benefit filter options
 */
export interface BenefitFilters extends QueryParams {
  ordering?: 'order' | 'created_at' | '-created_at'
}

// ============================================================================
// CAREER TESTIMONIALS
// ============================================================================

/**
 * Career testimonial
 */
export interface CareerTestimonial {
  id: number
  employee_name: string
  job_title: string
  department: number
  department_name: string
  photo?: string | null
  quote: string
  rating: number
  order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Create/update testimonial request (uses FormData for photo upload)
 */
export interface CreateTestimonialData {
  employee_name: string
  job_title: string
  department_id: number
  photo?: File
  quote: string
  rating: number
  order?: number
  is_active?: boolean
}

/**
 * Testimonial filter options
 */
export interface TestimonialFilters extends QueryParams {
  department?: number
  is_active?: boolean
  ordering?: 'order' | 'created_at' | 'rating' | '-created_at' | '-rating' | string
}

// ============================================================================
// CAREER PAGE SETTINGS
// ============================================================================

/**
 * Career page settings (singleton)
 */
export interface CareerPageSettings {
  id: number
  hero_title: string
  hero_subtitle: string
  hero_image?: string | null
  hero_video_url?: string | null
  about_title: string
  about_content: string
  cta_text: string
  cta_button_text: string
  career_email: string
  career_phone?: string | null
  meta_title: string
  meta_description: string
  linkedin_url?: string | null
  facebook_url?: string | null
  twitter_url?: string | null
  instagram_url?: string | null
  show_stats: boolean
  stat_employees_count?: number
  stat_offices_count?: number
  stat_countries_count?: number
  updated_at: string
}

/**
 * Update settings request (uses FormData for image upload)
 */
export interface UpdateSettingsData {
  hero_title?: string
  hero_subtitle?: string
  hero_image?: File
  hero_video_url?: string
  about_title?: string
  about_content?: string
  cta_text?: string
  cta_button_text?: string
  career_email?: string
  career_phone?: string
  meta_title?: string
  meta_description?: string
  linkedin_url?: string
  facebook_url?: string
  twitter_url?: string
  instagram_url?: string
  show_stats?: boolean
  stat_employees_count?: number
  stat_offices_count?: number
  stat_countries_count?: number
}
