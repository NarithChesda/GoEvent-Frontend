/**
 * Dress Code Type Definitions
 */

// Dress code type choices
export type DressCodeType =
  | 'white_tie'
  | 'black_tie'
  | 'black_tie_optional'
  | 'formal'
  | 'cocktail'
  | 'semi_formal'
  | 'business_formal'
  | 'business_casual'
  | 'smart_casual'
  | 'casual'
  | 'beach_formal'
  | 'beach_casual'
  | 'festive'
  | 'traditional'
  | 'themed'
  | 'custom'

// Time period choices
export type TimePeriod = 'all_day' | 'morning' | 'afternoon' | 'evening' | 'night'

// Gender choices
export type Gender = 'all' | 'male' | 'female'

// Main dress code interface
export interface EventDressCode {
  id: number
  event: string // UUID
  dress_code_type: DressCodeType
  dress_code_type_display: string
  time_period: TimePeriod
  time_period_display: string
  gender: Gender
  gender_display: string
  title?: string
  description?: string
  color?: string
  image?: string // URL
  order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Request type for creating a dress code
export interface CreateDressCodeRequest {
  dress_code_type: DressCodeType
  time_period: TimePeriod
  gender: Gender
  title?: string
  description?: string
  color?: string
  order?: number
  is_active?: boolean
  image?: File
}

// Request type for updating a dress code
export interface UpdateDressCodeRequest {
  dress_code_type?: DressCodeType
  time_period?: TimePeriod
  gender?: Gender
  title?: string
  description?: string
  color?: string
  order?: number
  is_active?: boolean
  image?: File | null // null to remove the image
}

// Bulk reorder request
export interface BulkReorderDressCodesRequest {
  updates: { id: number; order: number }[]
}

// Dress code filters for listing
export interface DressCodeFilters {
  dress_code_type?: DressCodeType
  time_period?: TimePeriod
  gender?: Gender
  is_active?: boolean
  search?: string
  ordering?: string
}

// Display name mappings (for frontend use)
export const DRESS_CODE_TYPE_LABELS: Record<DressCodeType, string> = {
  white_tie: 'White Tie',
  black_tie: 'Black Tie',
  black_tie_optional: 'Black Tie Optional',
  formal: 'Formal / Evening Wear',
  cocktail: 'Cocktail Attire',
  semi_formal: 'Semi-Formal',
  business_formal: 'Business Formal',
  business_casual: 'Business Casual',
  smart_casual: 'Smart Casual',
  casual: 'Casual',
  beach_formal: 'Beach Formal',
  beach_casual: 'Beach Casual',
  festive: 'Festive Attire',
  traditional: 'Traditional Attire',
  themed: 'Themed / Costume',
  custom: 'Custom',
}

export const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  all_day: 'All Day',
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
}

export const GENDER_LABELS: Record<Gender, string> = {
  all: 'All Genders',
  male: 'Male',
  female: 'Female',
}
