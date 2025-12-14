/**
 * Services API Type Definitions
 * Types for vendor profiles, service categories, and service listings
 */

import type { QueryParams } from './api.types'

/**
 * Vendor Profile Status
 */
export type VendorVerificationStatus = 'unverified' | 'verified' | 'pending'

/**
 * Service Listing Status
 */
export type ServiceListingStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'suspended'

/**
 * Full Vendor Profile
 * Includes all details for vendor profile management
 */
export interface VendorProfile {
  id: string // UUID
  user: number
  user_email: string
  business_name: string
  slug: string
  description: string
  short_tagline: string
  logo: string | null
  cover_image: string | null
  phone: string
  email: string
  website: string
  telegram_username: string
  address: string
  city: string
  country: string
  verification_status: VendorVerificationStatus
  verified_at: string | null
  is_featured: boolean // Read-only, admin-controlled
  featured_until: string | null // Read-only, ISO date string
  listings_count: number
  created_at: string
  updated_at: string
}

/**
 * Brief Vendor Profile
 * Used in listing views and browse endpoints
 */
export interface VendorProfileBrief {
  id: string
  business_name: string
  slug: string
  short_tagline: string
  logo: string | null
  city: string
  country: string
  phone?: string
  website?: string
  telegram_username: string
  verification_status: VendorVerificationStatus
  is_featured: boolean // Read-only
  listings_count: number
}

/**
 * Service Category
 * Hierarchical categories for service listings
 */
export interface ServiceCategory {
  id: number
  name: string
  description: string
  icon: string // FontAwesome class like 'fa-camera'
  icon_image: string | null
  color: string // Hex color
  order: number
  is_active: boolean
  parent: number | null
  subcategories: ServiceCategory[]
  listings_count: number
}

/**
 * Service Media
 * Photos/images for service listings
 */
export interface ServiceMedia {
  id: number
  image: string // URL
  caption: string
  order: number
  is_cover: boolean
  created_at: string
}

/**
 * Full Service Listing
 * Complete service listing details
 */
export interface ServiceListing {
  id: string // UUID
  vendor: string // UUID
  vendor_details: VendorProfileBrief
  category: number
  category_details: ServiceCategory
  title: string
  slug: string
  description: string
  short_tagline: string
  price_min: string // Decimal string
  price_max: string // Decimal string
  price_display_text: string
  currency: string
  service_area: string
  tags: string // Comma-separated
  tags_list: string[]
  status: ServiceListingStatus
  admin_notes: string
  is_featured: boolean
  media: ServiceMedia[]
  cover_image_url: string | null
  views_count: number
  contact_clicks_count: number
  created_at: string
  updated_at: string
}

/**
 * Brief Service Listing
 * Used in browse/list views
 */
export interface ServiceListingBrief {
  id: string
  title: string
  slug: string
  short_tagline: string
  price_display_text: string
  price_min: string
  price_max: string
  currency: string
  vendor_name: string
  vendor_slug: string
  category_name: string
  cover_image_url: string | null
  is_featured: boolean
  views_count: number
  created_at: string
}

/**
 * Service Listing Analytics
 * Detailed analytics for listing owners
 */
export interface ServiceListingAnalytics {
  total_views: number
  total_contact_clicks: number
  conversion_rate: number
  views_by_period: Array<{
    period: string
    count: number
  }>
  contact_clicks_by_period: Array<{
    period: string
    count: number
  }>
  views_by_source: Record<string, number>
  contact_clicks_by_type: Record<string, number>
  trends: {
    view_change_percent: number
    period_days: number
  }
}

/**
 * Create Vendor Profile Data
 */
export interface CreateVendorProfileData {
  business_name: string
  slug?: string
  description?: string
  short_tagline?: string
  phone?: string
  email?: string
  website?: string
  telegram_username?: string
  address?: string
  city?: string
  country?: string
}

/**
 * Update Vendor Profile Data
 * Partial update - all fields optional
 */
export interface UpdateVendorProfileData {
  business_name?: string
  slug?: string
  description?: string
  short_tagline?: string
  phone?: string
  email?: string
  website?: string
  telegram_username?: string
  address?: string
  city?: string
  country?: string
}

/**
 * Create Service Listing Data
 */
export interface CreateServiceListingData {
  category: number
  title: string
  slug?: string
  description?: string
  short_tagline?: string
  price_min?: string | number
  price_max?: string | number
  price_display_text?: string
  currency?: string
  service_area?: string
  tags?: string // Comma-separated or string array will be converted
}

/**
 * Update Service Listing Data
 * Partial update - all fields optional
 */
export interface UpdateServiceListingData {
  category?: number
  title?: string
  slug?: string
  description?: string
  short_tagline?: string
  price_min?: string | number
  price_max?: string | number
  price_display_text?: string
  currency?: string
  service_area?: string
  tags?: string
  status?: ServiceListingStatus
  is_featured?: boolean
}

/**
 * Vendor Profile Filters
 */
export interface VendorFilters extends QueryParams {
  search?: string
  city?: string
  country?: string
  is_featured?: boolean
  page?: number
  page_size?: number
}

/**
 * Service Listing Filters
 */
export interface ListingFilters extends QueryParams {
  search?: string
  category?: number
  price_min?: number
  price_max?: number
  vendor?: string // UUID
  is_featured?: boolean
  ordering?: string // e.g., 'created_at', '-views_count', 'price_min'
  page?: number
  page_size?: number
}

/**
 * Listing Analytics Parameters
 */
export interface ListingAnalyticsParams extends QueryParams {
  period?: 'daily' | 'weekly' | 'monthly'
  days?: number // Number of days to include in analytics
}

/**
 * Track View Data
 */
export interface TrackViewData {
  source: string // e.g., 'browse', 'search', 'category', 'direct'
}

/**
 * Track Contact Click Data
 */
export interface TrackContactData {
  contact_type: string // e.g., 'phone', 'email', 'telegram', 'website'
}

/**
 * Upload Media Data
 */
export interface UploadServiceMediaData {
  caption?: string
  is_cover?: boolean
}

/**
 * Bulk Reorder Media Data
 */
export interface BulkReorderServiceMediaData {
  updates: Array<{
    id: number
    order: number
  }>
}
