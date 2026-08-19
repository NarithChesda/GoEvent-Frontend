/**
 * Service Types
 *
 * Type definitions for the services module.
 */

export interface Vendor {
  id: string
  name: string
  logo: string
  tagline: string
  description: string
  city: string
  country: string
  email: string
  phone: string
  website: string
  telegramUsername: string
  listingsCount: number
  /**
   * The vendor's own uploaded banner. Set whenever they have one, and it wins
   * over every other backdrop: it is the one image they deliberately framed to
   * represent themselves, rather than a service photo pressed into service.
   */
  coverImage?: string
  /**
   * Ordered backdrop candidates for the featured-vendor spotlight — the cover
   * image when there is one, otherwise stand-ins pulled from the vendor's own
   * listing covers after the fact (the browse payload carries no photos of its
   * own). Stays empty for vendors with neither, and the spotlight falls back
   * to brand art.
   */
  heroImages?: string[]
}

export type PriceType = 'fixed' | 'range' | 'quote'
export type PriceUnit = '' | 'per_event' | 'per_hour' | 'per_day' | 'per_person' | 'per_item'
export type Currency = 'USD' | 'KHR' | 'EUR'

export interface Listing {
  id: string
  title: string
  tagline: string
  description: string
  coverImage: string
  category: string

  // Pricing - raw fields for editing
  priceType: PriceType
  priceMin: number | null
  priceMax: number | null
  currency: Currency
  priceUnit: PriceUnit
  priceDisplay: string // Computed display string

  // Vendor info (auto-filled from vendor profile)
  vendorId: string
  vendorName: string
  vendorLogo: string
  vendorVerified: boolean

  // Service details
  tags: string[]
  serviceArea: string
  gallery: string[]

  // Contact information
  telegramUsername: string
  phone: string
  website: string

  // Stats (server-generated)
  views: number
  contactClicks: number
  isFeatured: boolean

  // Timestamps
  createdAt?: string
  updatedAt?: string
}

export interface ServiceCategory {
  id: string
  name: string
}

export interface SortOption {
  value: string
  label: string
}
