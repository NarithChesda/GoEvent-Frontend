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
  listingsCount: number
}

export interface Listing {
  id: string
  title: string
  tagline: string
  description: string
  coverImage: string
  category: string
  priceDisplay: string
  vendorName: string
  vendorLogo: string
  vendorVerified: boolean
  tags: string[]
  serviceArea: string
  views: number
  contactClicks: number
  isFeatured: boolean
  gallery: string[]
}

export interface ServiceCategory {
  id: string
  name: string
}

export interface SortOption {
  value: string
  label: string
}
