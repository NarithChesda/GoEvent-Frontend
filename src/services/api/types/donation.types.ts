/**
 * Donation/Fundraising type definitions
 * Based on FUNDRAISING_DONATION_API_DOCS.md
 */

import type { QueryParams } from './api.types'

/**
 * Donation status enum
 */
export type DonationStatus = 'pending' | 'verified' | 'rejected'

/**
 * Donation type enum
 */
export type DonationType = 'cash' | 'item'

/**
 * Currency type for donations
 */
export type DonationCurrency = 'USD' | 'KHR'

/**
 * User info embedded in donation responses
 */
export interface DonationUserInfo {
  id: number
  email: string
  username: string
  first_name?: string
  last_name?: string
  profile_picture?: string
}

/**
 * Payment method info embedded in donation responses
 */
export interface DonationPaymentMethodInfo {
  id: number
  name: string
  payment_type: string
  payment_method: string
}

/**
 * Item category info embedded in donation responses
 */
export interface DonationItemCategoryInfo {
  id: number
  name: string
  unit: string
  target_quantity?: number
}

/**
 * Donation Item Category - for organizing in-kind donations
 */
export interface DonationItemCategory {
  id: number
  event: string
  name: string
  unit: string
  target_quantity?: number
  description?: string
  display_order: number
  is_active: boolean
  total_quantity: number
  donation_count: number
  progress_percentage: number | null
  created_at: string
  updated_at: string
}

/**
 * Request to create/update donation item category
 */
export interface CreateDonationItemCategoryRequest {
  name: string
  unit: string
  target_quantity?: number
  description?: string
  display_order?: number
  is_active?: boolean
}

/**
 * Category summary response
 */
export interface DonationCategorySummary {
  categories: Array<{
    id: number
    name: string
    unit: string
    target_quantity: number | null
    total_quantity: number
    donation_count: number
    progress_percentage: number | null
  }>
  totals: {
    total_items_donated: number
    total_item_donors: number
    category_count: number
  }
}

/**
 * Event Donation - cash or item donation
 */
export interface EventDonation {
  id: number
  event: string
  user?: number
  user_info?: DonationUserInfo
  payment_method?: number
  payment_method_info?: DonationPaymentMethodInfo
  donor_name: string
  donor_email?: string
  donor_phone?: string
  donation_type: DonationType
  amount?: string | null
  currency: DonationCurrency
  item_category?: number | null
  item_category_info?: DonationItemCategoryInfo | null
  item_name?: string
  item_description?: string
  item_quantity?: number | null
  item_unit?: string
  estimated_value?: string | null
  message?: string
  receipt_image?: string
  is_anonymous: boolean
  status: DonationStatus
  verified_by?: number
  verified_by_info?: DonationUserInfo
  verified_at?: string
  rejection_reason?: string
  display_name: string
  donation_display: string
  can_be_edited: boolean
  created_at: string
  updated_at: string
}

/**
 * Request to create a cash donation
 */
export interface CreateCashDonationRequest {
  donation_type: 'cash'
  amount: number
  currency?: DonationCurrency
  donor_name?: string
  donor_email?: string
  donor_phone?: string
  payment_method?: number
  message?: string
  is_anonymous?: boolean
}

/**
 * Request to create an item donation
 */
export interface CreateItemDonationRequest {
  donation_type: 'item'
  item_category?: number
  item_name?: string
  item_description?: string
  item_quantity?: number
  item_unit?: string
  estimated_value?: number
  donor_name?: string
  donor_email?: string
  donor_phone?: string
  message?: string
  is_anonymous?: boolean
}

/**
 * Request to create any donation
 */
export type CreateDonationRequest = CreateCashDonationRequest | CreateItemDonationRequest

/**
 * Request to update a pending donation
 */
export interface UpdateDonationRequest {
  donor_name?: string
  donor_email?: string
  donor_phone?: string
  amount?: number
  item_category?: number
  item_name?: string
  item_description?: string
  item_quantity?: number
  item_unit?: string
  estimated_value?: number
  message?: string
  is_anonymous?: boolean
}

/**
 * Request to verify/reject a donation
 */
export interface VerifyDonationRequest {
  action: 'verify' | 'reject'
  rejection_reason?: string
}

/**
 * Response from verify/reject action
 */
export interface VerifyDonationResponse {
  message: string
  donation: EventDonation
}

/**
 * Fundraising progress response
 */
export interface FundraisingProgress {
  goal: string | null
  currency: DonationCurrency
  total_raised: string
  total_donors: number
  percentage: number
  recent_donations: Array<{
    id: number
    display_name: string
    donation_type: DonationType
    amount: string | null
    currency: DonationCurrency
    item_category: number | null
    item_category_info: DonationItemCategoryInfo | null
    item_name: string
    item_quantity: number | null
    item_unit: string
    estimated_value: string | null
    message: string
    is_anonymous: boolean
    donation_display: string
    verified_at: string
    created_at: string
  }>
}

/**
 * Query filters for donations
 */
export interface DonationFilters extends QueryParams {
  status?: DonationStatus
  donation_type?: DonationType
  item_category?: number
  currency?: DonationCurrency
  is_anonymous?: boolean
  search?: string
  ordering?: string
}

/**
 * Event fundraising settings (part of Event model)
 */
export interface EventFundraisingSettings {
  is_fundraising: boolean
  fundraising_goal?: string | null
  fundraising_currency: DonationCurrency
  show_donation_progress: boolean
  show_donor_list: boolean
}
