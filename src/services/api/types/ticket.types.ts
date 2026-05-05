/**
 * Ticket-related type definitions.
 *
 * Mirrors the data shapes documented in the backend's
 * `TICKETS_FRONTEND_GUIDE.md`. The contract is hand-maintained here until the
 * backend exposes an OpenAPI schema (drf-spectacular ships with the viewset
 * rollout — see plan doc `docs/TICKETS_FEATURE_PLAN.md`).
 *
 * Money amounts are kept as **strings** (DRF `DecimalField`). Never coerce
 * to `number` before display; route through `formatCurrency` from
 * `@/utils/currency` so KHR's no-decimals rule is preserved.
 */

import type { QueryParams } from './api.types'

// ============================================================================
// Enums / unions
// ============================================================================

export type TicketCurrency = 'USD' | 'KHR'

export type TicketOrderStatus =
  | 'pending'
  | 'awaiting_review'
  | 'paid'
  | 'refund_requested'
  | 'refunded'
  | 'cancelled'
  | 'expired'

export type TicketStatus =
  | 'valid'
  | 'used'
  | 'refunded'
  | 'cancelled'
  | 'transferred'

export type TicketRefundStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed'

export type CheckoutQuestionType =
  | 'text'
  | 'long_text'
  | 'yes_no'
  | 'single_choice'
  | 'multi_choice'

export type PromoDiscountType = 'percentage' | 'fixed_amount'

// ============================================================================
// Core resources
// ============================================================================

export interface TicketType {
  id: number
  event_id: string
  name: string
  description: string
  price: string
  currency: TicketCurrency
  quantity_total: number
  quantity_sold: number
  quantity_remaining: number
  max_per_order: number
  sale_start: string | null
  sale_end: string | null
  is_active: boolean
  is_on_sale: boolean
  is_sold_out: boolean
  allow_reentry: boolean
  display_order: number
}

export interface TicketTypeBrief {
  id: number
  name: string
  currency?: TicketCurrency
  allow_reentry?: boolean
}

export interface TicketCheckoutQuestion {
  id: number
  event_id: string
  ticket_type_id: number | null
  question_text: string
  question_type: CheckoutQuestionType
  choices: string[]
  is_required: boolean
  is_active: boolean
  order: number
}

export interface TicketAnswer {
  question: {
    id: number
    question_text: string
    question_type: CheckoutQuestionType
  }
  answer_text: string
  answer_choices: string[]
}

export interface TicketAnswerSubmission {
  question_id: number
  answer_text?: string
  answer_choices?: string[]
}

export interface TicketOrderItem {
  ticket_type: TicketTypeBrief
  quantity: number
  unit_price: string
  subtotal: string
}

export interface OrderEventBrief {
  id: string
  title: string
  slug: string
  start_date: string
  end_date: string
}

export interface TicketBuyerBrief {
  id: string
  email: string
  name: string
}

export interface Ticket {
  id: string
  qr_code: string
  check_in_code: string
  ticket_type: TicketTypeBrief
  order: { confirmation_code: string }
  event?: { id: string; title: string; start_date: string }
  attendee_name: string
  attendee_email: string
  status: TicketStatus
  check_in_count: number
  checked_in_at: string | null
  last_checked_in_at?: string | null
  issued_at?: string
}

export interface TicketRefund {
  id: string
  order_code: string
  requested_by: { id: string; email: string }
  amount: string
  reason: string
  status: TicketRefundStatus
  reviewed_by: { id: string; email: string } | null
  reviewed_at: string | null
  admin_notes: string
  refund_transaction_reference: string
  completed_at: string | null
  requested_at: string
}

export interface TicketOrderDetail {
  id: string
  confirmation_code: string
  event: OrderEventBrief
  buyer: TicketBuyerBrief
  buyer_name: string
  buyer_email: string
  buyer_phone: string
  items: TicketOrderItem[]
  subtotal: string
  promo_code: string | null
  promo_discount: string
  total: string
  currency: TicketCurrency
  status: TicketOrderStatus
  is_comp: boolean
  /**
   * FK ID of the chosen `events.EventPayment` row. The display name lives in
   * the sibling `payment_method_name` field — backend serializer flattens the
   * relation rather than nesting it.
   */
  payment_method: number | null
  payment_method_name: string | null
  /**
   * URL of the uploaded receipt/screenshot.
   *
   * Backend reality vs docs: the live serializer returns the FileField as
   * `payment_proof` (the raw model field name → URL string). The
   * TICKETS_FRONTEND_GUIDE documents it as `payment_proof_url`. We keep both
   * keys here so we tolerate either; renderers should prefer
   * `payment_proof_url ?? payment_proof`. Once the backend reconciles the
   * mismatch we can drop the legacy key.
   */
  payment_proof?: string | null
  payment_proof_url?: string | null
  transaction_reference: string
  buyer_notes: string
  admin_notes: string
  confirmed_by: { id: string; email: string } | null
  confirmed_at: string | null
  proof_submitted_at: string | null
  refund_window_ends_at: string | null
  is_refundable: boolean
  tickets: Ticket[]
  answers: TicketAnswer[]
  refund: TicketRefund | null
  created_at: string
  updated_at: string
}

/** Slim shape returned from list endpoints. */
export interface TicketOrderListItem {
  confirmation_code: string
  event_title: string
  event_id?: string
  buyer_email: string
  total: string
  currency: TicketCurrency
  status: TicketOrderStatus
  ticket_count: number
  is_comp: boolean
  created_at: string
  confirmed_at: string | null
}

// ============================================================================
// Analytics
// ============================================================================

export interface TicketAnalyticsSummary {
  currency: TicketCurrency
  gross_revenue: string
  refunded_amount: string
  net_revenue: string
  paid_orders: number
  pending_orders: number
  refunded_orders: number
  comp_orders: number
  tickets_issued: number
  tickets_valid: number
  tickets_used: number
  tickets_refunded: number
  refund_rate: number
  check_in_rate: number
  capacity_total: number
  capacity_sold: number
  capacity_remaining: number
}

export interface TicketAnalyticsByTier {
  ticket_type_id: number
  name: string
  price: string
  currency: TicketCurrency
  quantity_total: number
  quantity_sold: number
  live_tickets: number
  refunded_tickets: number
  revenue: string
}

export interface TicketAnalyticsByDay {
  day: string
  orders: number
  revenue: string
}

export interface TicketAnalyticsByRefund {
  status: TicketRefundStatus
  count: number
  total: string
}

export interface TicketAnalytics {
  summary: TicketAnalyticsSummary
  by_tier: TicketAnalyticsByTier[]
  by_day: TicketAnalyticsByDay[]
  refunds: TicketAnalyticsByRefund[]
}

export interface AttendeeListItem {
  ticket_id: string
  check_in_code: string
  attendee_name: string
  attendee_email: string
  ticket_type_name: string
  status: TicketStatus
  order_code: string
  buyer_email: string
  checked_in_at: string | null
  check_in_count: number
}

// ============================================================================
// Promo codes
// ============================================================================

export interface PromoValidationItem {
  ticket_type_id: number
  quantity: number
}

export interface PromoValidationRequest {
  code: string
  items: PromoValidationItem[]
}

export interface PromoValidationSuccess {
  valid: true
  code: string
  discount_type: PromoDiscountType
  discount_value: string
  subtotal: string
  discount: string
  total_after: string
}

// ============================================================================
// Check-in
// ============================================================================

export interface CheckInRequest {
  qr_code?: string
  check_in_code?: string
}

export interface CheckInResponse {
  ok: boolean
  was_reentry: boolean
  message: string
  ticket?: Ticket
}

// ============================================================================
// Request payloads
// ============================================================================

export interface CreateTicketTypeRequest {
  name: string
  description?: string
  price: string
  currency: TicketCurrency
  quantity_total: number
  max_per_order?: number
  sale_start?: string | null
  sale_end?: string | null
  is_active?: boolean
  allow_reentry?: boolean
  display_order?: number
}

export type UpdateTicketTypeRequest = Partial<CreateTicketTypeRequest>

export interface CreateCheckoutQuestionRequest {
  question_text: string
  question_type: CheckoutQuestionType
  choices?: string[]
  ticket_type_id?: number | null
  is_required?: boolean
  is_active?: boolean
  order?: number
}

export type UpdateCheckoutQuestionRequest = Partial<CreateCheckoutQuestionRequest>

export interface BulkReorderCheckoutQuestionsRequest {
  updates: Array<{ id: number; order: number }>
}

export interface BulkReorderCheckoutQuestionsResponse {
  updated: number
}

export interface CreateTicketOrderItem {
  ticket_type_id: number
  quantity: number
}

export interface CreateTicketOrderRequest {
  items: CreateTicketOrderItem[]
  promo_code?: string
  buyer_name: string
  buyer_email: string
  buyer_phone?: string
  answers?: TicketAnswerSubmission[]
}

/**
 * Multipart payload for `POST /api/ticket-orders/{code}/submit-proof/`.
 * Build with `new FormData()`; consumers should pass to
 * `ticketOrdersService.submitProof`. Documented here for reference only —
 * TypeScript can't enforce field presence on FormData.
 *
 * Required fields:
 *   payment_method  number   PaymentMethod ID
 *   payment_proof   File     pdf | jpg | jpeg | png | gif | webp
 * Optional:
 *   transaction_reference  string
 *   buyer_notes            string
 */

export interface RefundRequestPayload {
  reason: string
}

export interface ConfirmOrderRequest {
  admin_notes?: string
}

export interface RejectOrderRequest {
  admin_notes: string
}

export interface ApproveRefundRequest {
  refund_transaction_reference?: string
  admin_notes?: string
}

export interface RejectRefundRequest {
  admin_notes: string
}

export interface CompTicketRequest {
  recipient_email: string
  items: CreateTicketOrderItem[]
  /** Optional friendly name for the comp recipient (overrides default snapshot). */
  recipient_name?: string
  admin_notes?: string
}

// ============================================================================
// Filters
// ============================================================================

export interface TicketOrderFilters extends QueryParams {
  status?: TicketOrderStatus
  page?: number
  page_size?: number
}

export interface RefundFilters extends QueryParams {
  status?: TicketRefundStatus
  page?: number
  page_size?: number
}

export interface AttendeeFilters extends QueryParams {
  status?: TicketStatus
  ticket_type_id?: number
  page?: number
  page_size?: number
}

// ============================================================================
// Notification metadata payloads
// ============================================================================

/** Common metadata fields on every ticket-related notification. */
export interface TicketNotificationMetadataBase {
  order_id?: string
  order_code?: string
  event_id?: string
  event_title?: string
  amount?: string
  currency?: TicketCurrency
}

export interface TicketRefundNotificationMetadata extends TicketNotificationMetadataBase {
  refund_id?: string
  refund_amount?: string
}

export interface TicketCheckInNotificationMetadata extends TicketNotificationMetadataBase {
  ticket_id?: string
  check_in_code?: string
  was_reentry?: boolean
}
