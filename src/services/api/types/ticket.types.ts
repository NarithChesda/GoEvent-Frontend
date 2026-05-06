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

export type CheckInSource =
  | 'qr'
  | 'manual'
  | 'attendee_search'
  | 'order'
  | 'batch_sync'

export type CheckInOutcome =
  | 'entry'
  | 'reentry'
  | 'rejected'
  | 'undone'
  | 'replayed'

export type DoorPaymentType = 'cash' | 'card_offline' | 'other'

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
  location?: string | null
  is_virtual?: boolean
  banner_image?: string | null
  timezone?: string | null
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
  /**
   * Flat event UUID. Per TICKETS_CHECKIN_API_DOCS.md the check-in response
   * always populates this for the cross-event guard. Older list/detail
   * payloads may still omit it — treat as optional.
   */
  event_id?: string
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
  /**
   * The detail endpoint has shipped two different shapes over time:
   *   - Slim list-serializer fallback: `event` is a flat UUID string (FK PK),
   *     accompanied by flat `event_id`, `event_title`, `event_slug`,
   *     `event_start_date`, `event_end_date`, `event_location`.
   *   - Documented detail serializer: `event` is a nested `OrderEventBrief`
   *     and the flat companions are dropped.
   *
   * Both have been observed in the wild on the dev instance, so every flat
   * companion is optional. Consumers should resolve the event id/title via
   * the nested object first, then fall back to the flat fields. See
   * `MyTicketOrderView.vue`.
   */
  event: string | OrderEventBrief
  event_id?: string
  event_title?: string
  event_slug?: string
  event_start_date?: string
  event_end_date?: string
  event_location?: string | null
  /**
   * Now nullable per the door check-in release: walk-up door sales create
   * orders without a registered buyer account. The display name/email fall
   * back to the snapshot fields below.
   */
  buyer: TicketBuyerBrief | null
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
  /** True for orders created via POST /api/events/{id}/door-sales/. */
  is_door_sale?: boolean
  /**
   * Out-of-band payment classification for door sales. Empty string for
   * orders created before the door-sale release or via online checkout.
   */
  door_payment_type?: DoorPaymentType | ''
  /**
   * FK ID of the chosen `events.EventPayment` row. The display name lives in
   * the sibling `payment_method_name` field — backend serializer flattens the
   * relation rather than nesting it.
   */
  payment_method: number | null
  payment_method_name: string | null
  /** Absolute URL of the uploaded receipt/screenshot, populated after submit-proof. */
  payment_proof: string | null
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
  is_door_sale?: boolean
  door_payment_type?: DoorPaymentType | ''
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
// Check-in — single scan, undo, group, batch sync, audit log
// ============================================================================

/**
 * Single-scan check-in request. Provide exactly one of `qr_code` or
 * `check_in_code`. `idempotency_key` is strongly recommended on every real
 * scan — replays return the cached outcome with `replayed: true` instead of
 * double-counting on a flaky retry.
 */
export interface CheckInRequest {
  qr_code?: string
  check_in_code?: string
  idempotency_key?: string
  device_id?: string
  source?: CheckInSource
  /**
   * Per-gate scoping. If set, tickets in tiers other than these are rejected
   * with `wrong_tier: true`. Server-enforced; the rejected scan is recorded
   * in the audit log but the ticket is not mutated.
   */
  allowed_tier_ids?: number[]
}

/**
 * Common check-in response envelope. Single endpoints return this directly;
 * batch + group endpoints wrap this shape (plus a couple of identifiers) in
 * `results[]`. HTTP is `200` for both `ok: true` and the rejection branches —
 * `ok` is the source of truth, not the status code.
 */
export interface CheckInResponse {
  ok: boolean
  was_reentry: boolean
  message: string
  /**
   * Advisory flag. True when the ticket was scanned from a different
   * `device_id` within the last 30 seconds. Independent of `ok` — show as a
   * warning even on a successful entry.
   */
  suspicious: boolean
  /** True when the response came from the idempotency cache (no mutation). */
  replayed: boolean
  /** True when the rejection was specifically a tier-scope mismatch. */
  wrong_tier: boolean
  /** UUID of the audit row written for this scan. */
  audit_id: string
  ticket?: Ticket
}

// ---------------------------------------------------------------- undo

export interface UndoCheckInRequest {
  reason?: string
  idempotency_key?: string
  device_id?: string
}

export interface UndoCheckInResponse {
  ok: boolean
  message: string
  replayed: boolean
  audit_id: string
  ticket: Ticket
}

// --------------------------------------------------- group / order check-in

export interface OrderCheckInRequest {
  /**
   * If omitted, every valid ticket on the order is processed. If provided,
   * only the listed UUIDs are touched.
   */
  ticket_ids?: string[]
  /**
   * One key for the whole batch — backend expands to per-ticket sub-keys via
   * UUID5 so retries are safe end-to-end.
   */
  idempotency_key?: string
  device_id?: string
  allowed_tier_ids?: number[]
}

export interface CheckInBatchSummary {
  total: number
  entered: number
  reentered: number
  rejected: number
  replayed: number
}

export interface OrderCheckInResultItem extends CheckInResponse {
  /** Sub-key derived from the request idempotency_key for this ticket. */
  idempotency_key?: string
  ticket_id: string
  check_in_code: string
}

export interface OrderCheckInResponse {
  order_code: string
  summary: CheckInBatchSummary
  results: OrderCheckInResultItem[]
}

// --------------------------------------------------------- offline batch sync

export interface BatchScanItem {
  qr_code?: string
  check_in_code?: string
  /** Required per-scan key. Without it, network retries will double-count. */
  idempotency_key: string
  /**
   * Client-claimed scan time (ISO 8601). Stored on the audit row so reports
   * reflect actual door-time. Anything older than 7 days is rejected per-row.
   */
  scanned_at: string
  device_id?: string
  source?: CheckInSource
  allowed_tier_ids?: number[]
}

export interface BatchSyncRequest {
  /** Maximum 200 scans per batch. */
  scans: BatchScanItem[]
}

export interface BatchSyncResultItem extends CheckInResponse {
  idempotency_key: string
}

export interface BatchSyncResponse {
  summary: CheckInBatchSummary
  /** Results preserve input order; key by `idempotency_key` for reconciliation. */
  results: BatchSyncResultItem[]
}

// -------------------------------------------------------------- audit log

export interface CheckInLogEntry {
  id: string
  ticket_id: string
  check_in_code: string
  attendee_name: string
  ticket_type: number
  ticket_type_name: string
  scanned_by: number
  scanned_by_email: string
  device_id: string | null
  /** Client-claimed time of the scan. Drives report timestamps. */
  scanned_at: string
  /** Server-side persistence time. Drives ordering + dedupe. */
  server_recorded_at: string
  source: CheckInSource
  outcome: CheckInOutcome
  rejection_reason: string
  notes: string
  idempotency_key: string
}

export interface CheckInLogFilters extends QueryParams {
  ticket?: string
  staff?: number
  outcome?: CheckInOutcome
  source?: CheckInSource
  device_id?: string
  /** ISO 8601 lower bound (inclusive). */
  since?: string
  /** ISO 8601 upper bound (inclusive). */
  until?: string
  page?: number
  page_size?: number
}

// -------------------------------------------------------- walk-up door sales

export interface DoorSaleRequest {
  items: CreateTicketOrderItem[]
  /** Defaults to `cash` server-side. */
  door_payment_type?: DoorPaymentType
  buyer_name?: string
  buyer_email?: string
  buyer_phone?: string
  transaction_reference?: string
  admin_notes?: string
  /**
   * When true the issued tickets are checked in immediately via the
   * audit-logged service. Failures here do NOT roll back the sale.
   */
  auto_check_in?: boolean
  device_id?: string
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
  /**
   * Case-insensitive contains match across `attendee_name`, `attendee_email`,
   * `buyer_name`, `buyer_email`, `confirmation_code`, and `check_in_code`.
   * Composes with `status` and `ticket_type_id`.
   */
  search?: string
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
