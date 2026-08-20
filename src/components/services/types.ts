/**
 * Service Types
 *
 * Type definitions for the services module.
 */

import type { Component } from 'vue'

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

/**
 * One way to reach a vendor, resolved into everything a button needs.
 *
 * Shared because the same channels are offered in four places — the listing's
 * sidebar card and mobile pill, and the storefront's inline row and mobile
 * pill — and the ordering rule ("most important first; the first one carries
 * the label, the rest are icons") only holds if they agree on the shape.
 */
export interface ContactChannel {
  /** Analytics key, also the Vue list key: 'telegram' | 'phone' | … */
  key: string
  href: string
  /** Opens in a new tab, and so needs `rel="noopener noreferrer"` */
  external: boolean
  label: string
  icon: Component
  /** Background/text classes — Telegram blue, slate-900, or a quiet fill */
  classes: string
}
