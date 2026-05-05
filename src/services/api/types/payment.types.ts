/**
 * Payment method type definitions
 */

export interface EventPaymentMethod {
  id: number
  name: string
  /**
   * Discriminator for what the method is intended to receive.
   * `ticket_sales` was added in events migration 0048 — `TicketOrder.payment_method`
   * requires this value (see TICKETS_API_DOCS Backend Decisions #2). Existing
   * `donation`/`gift`/`sponsorship` values keep their meaning.
   */
  payment_type: 'donation' | 'gift' | 'sponsorship' | 'ticket_sales'
  payment_method: 'bank_transfer' | 'qr_code' | 'payment_url'
  currency?: string
  is_active: boolean
  description?: string
  order: number
  // Bank transfer fields
  bank_name?: string
  account_name?: string
  account_number?: string
  // QR code fields
  qr_code_image?: string
  // Payment URL fields
  payment_url?: string
  created_at?: string
  updated_at?: string
}

export interface CreatePaymentMethodRequest {
  name: string
  payment_type: 'donation' | 'gift' | 'sponsorship' | 'ticket_sales'
  payment_method: 'bank_transfer' | 'qr_code' | 'payment_url'
  currency?: string
  is_active?: boolean
  description?: string
  order?: number
  // Bank transfer fields
  bank_name?: string
  account_name?: string
  account_number?: string
  // Payment URL fields
  payment_url?: string
}

export interface BulkReorderPaymentMethodsRequest {
  updates: { id: number; order: number }[]
}
