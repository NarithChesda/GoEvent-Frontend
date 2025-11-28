/**
 * Payment-related type definitions
 * Shared across payment components and composables
 */

export interface Payment {
  readonly id: string
  readonly payment_reference: string
  readonly user_email: string
  readonly event: string
  readonly event_title: string
  readonly template_name: string | null
  readonly plan_name: string
  readonly payment_method_name: string
  readonly amount: string
  readonly original_price: string
  readonly discount_amount: string
  readonly currency: string
  readonly status: PaymentStatus
  readonly status_display: string
  readonly transaction_reference: string
  readonly created_at: string
  readonly is_confirmed: boolean
  readonly is_upgrade: boolean
  readonly payment_proof?: string
  readonly user_notes?: string
  readonly updated_at?: string
}

export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled' | 'refunded'

export interface PaymentMethod {
  readonly id: number
  readonly name: string
  readonly payment_type: string
  readonly payment_type_display: string
  readonly bank_name: string
  readonly account_number: string
  readonly account_name: string
  readonly qr_code_image: string | null
  readonly payment_link: string
  readonly currency: string
  readonly is_active: boolean
}

export interface PaymentFormData {
  transaction_reference: string
  user_notes: string
  payment_proof: File | null
}

export interface UpdateFormData {
  transaction_reference: string
  user_notes: string
  payment_proof: File | null
}
