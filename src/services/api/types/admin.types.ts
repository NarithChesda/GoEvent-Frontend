/**
 * Staff dashboard types — `/api/admin/`.
 *
 * See ADMIN_DASHBOARD_API_DOCS.md in the backend repo. Two things shape almost
 * everything here:
 *
 * 1. **Six queues, one contract.** Every queue takes the same `approve`/`reject`
 *    pair with the same body and answers the same envelope, which is why
 *    `AdminDecision<T>` is generic and there is one service rather than six.
 * 2. **Money is a string** (Django `Decimal`). Nothing here narrows one to
 *    `number` — parse at the point of display, never by letting JS coerce a
 *    total.
 *
 * Row shapes are transcribed from the docs. Where the docs name a field but not
 * its type — the `reviewed_by` / `confirmed_by` / `processed_by` family, which
 * the sample payloads only ever show as `null` — the field is typed
 * `AdminActor` and read through `describeActor()`, so an expanded object and a
 * bare email string both render.
 */

/** The six decision queues. Also the URL segment, so the strings are the API's. */
export type AdminQueue =
  | 'templates'
  | 'listings'
  | 'partner-requests'
  | 'payments'
  | 'commissions'
  | 'credit-orders'

/** A user as the admin API embeds one. */
export interface AdminUserRef {
  id: number
  email: string
  username: string
  full_name: string
}

/**
 * Whoever decided a row. The docs show these as `null` in every sample, so the
 * populated shape is unverified — accept both and render through
 * `describeActor()` rather than assuming one.
 */
export type AdminActor = AdminUserRef | string | null

/** `GET /api/admin/summary/` — the sidebar badges. Counts only. */
export interface AdminSummary {
  queues: {
    templates: number
    listings: number
    partner_requests: number
    payments: number
    commissions: number
    credit_orders: number
  }
  total_pending: number
}

/** One day of a metrics series. Days with no activity are absent — zero-fill. */
export interface AdminMetricsDay {
  day: string
  /** Present on the revenue series only, and a `Decimal` string. */
  amount?: string
  count: number
}

/** `GET /api/admin/metrics/?days=` — the landing page. */
export interface AdminMetrics {
  window_days: number
  since: string
  revenue: {
    all_time: string
    window: string
    window_payment_count: number
    series: AdminMetricsDay[]
  }
  events: {
    total: number
    window: number
    series: AdminMetricsDay[]
  }
  users: {
    total: number
    window: number
    partners: number
    staff: number
  }
  templates: {
    approved: number
    partner_built: number
  }
  listings: {
    approved: number
  }
  commissions: {
    unpaid: string
  }
}

/**
 * The envelope every `approve`/`reject` answers with.
 *
 * `item` is the refreshed row — render it for that one row without a second
 * fetch. The *list* still needs refetching, because its composition changed.
 */
export interface AdminDecision<T> {
  ok: boolean
  message: string
  item: T
  /** The `AdminActionLog` row this decision wrote. */
  action_id: string
}

/** Fields shared by every queue row. */
interface AdminReviewableRow {
  status: string
  status_display: string
  /** Internal. Never render this where the applicant can see it. */
  admin_notes: string
  reviewed_by: AdminActor
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

/**
 * `templates` — partner designs awaiting review.
 *
 * The design blobs (`cover_stage_layout`, the `*_design` fields, `stage_modes`)
 * are deliberately excluded from this serializer; a reviewer decides from the
 * preview image and opens the partner template editor to see the real thing.
 */
export interface AdminTemplateRow extends AdminReviewableRow {
  id: number
  name: string
  template_type: 'partner' | 'system'
  created_by: AdminUserRef | null
  preview_image: string | null
  package_plan_name: string | null
  package_plan_price: string | null
  colors_count: number
  fonts_count: number
}

/** `listings` — vendor marketplace listings awaiting review. */
export interface AdminListingRow extends AdminReviewableRow {
  id: number
  title: string
  slug: string
  short_tagline: string
  description: string
  vendor_name: string
  vendor_user: AdminActor
  category_name: string | null
  price_min: string | null
  price_max: string | null
  price_display_text: string
  currency: string
  service_area: string
}

export type AdminPartnerRequestVolume = '1_5' | '6_20' | '21_50' | '50_plus'

/**
 * `partner-requests` — applications for the `is_partner` flag.
 *
 * The only queue whose reject takes an extra field (`can_reapply`), and the only
 * route to a partner account outside Django admin.
 */
export interface AdminPartnerRequestRow extends AdminReviewableRow {
  id: string
  user: AdminUserRef
  business_name: string
  contact_phone: string
  contact_telegram: string
  expected_monthly_events: AdminPartnerRequestVolume | ''
  expected_monthly_events_display: string
  message: string
  /** Shown verbatim to the applicant. */
  review_note: string
  reapply_allowed: string | null
  can_reapply: boolean
}

/** `payments` — template activation payments awaiting confirmation. */
export interface AdminPaymentRow extends AdminReviewableRow {
  id: string
  payment_reference: string
  /** Absolute URL of the screenshot the reviewer is checking. */
  payment_proof: string | null
  amount: string
  original_price: string | null
  discount_amount: string | null
  promo_discount: string | null
  currency: string
  transaction_reference: string
  user_notes: string
  user?: AdminActor
  event_id: string | null
  event_title: string | null
  template_name: string | null
  pricing_plan_name: string | null
  payment_method_name: string | null
  is_upgrade?: boolean
  confirmed_by: AdminActor
  confirmed_at: string | null
}

/** `commissions` — referrer payout claims. Opens on `requested`. */
export interface AdminCommissionRow extends AdminReviewableRow {
  id: string
  commission_reference: string
  referrer?: AdminActor
  event_title: string | null
  commission_rate: string
  commission_amount: string
  payment_amount: string
  requested_at: string | null
  requested_notes: string
  claimed_at: string | null
  rejected_at: string | null
  rejection_reason?: string
  processed_by: AdminActor
}

/** `any` is the DB default, and an absent value means exactly that. */
export type AdminTemplateScope = 'any' | 'own_partner'

/**
 * `credit-orders` — partner wholesale credit purchases.
 *
 * Approving **mints** a credit code and is not idempotent: a second confirm is a
 * `409`, never a second code. Never auto-retry it.
 */
export interface AdminCreditOrderRow extends AdminReviewableRow {
  id: string
  order_reference: string
  partner?: AdminActor
  pack_name?: string
  amount: string
  currency: string
  credit_count: number
  template_scope?: AdminTemplateScope
  transaction_reference: string
  payment_proof: string | null
  /** Present once the order is confirmed — the code the partner will ask for. */
  issued_code?: string | null
}

/** Any of the six queue rows. */
export type AdminQueueRow =
  | AdminTemplateRow
  | AdminListingRow
  | AdminPartnerRequestRow
  | AdminPaymentRow
  | AdminCommissionRow
  | AdminCreditOrderRow

/** `users` list row. */
export interface AdminUserRow {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  full_name?: string
  phone_number: string
  profile_picture: string | null
  is_active: boolean
  is_verified: boolean
  is_partner: boolean
  is_staff: boolean
  date_joined: string
  last_login: string | null
}

/** `GET /api/admin/users/{id}/` adds these. */
export interface AdminUserDetail extends AdminUserRow {
  bio: string
  telegram_link: string
  payment_link: string
  events_count: number
  payments_count: number
  confirmed_payments_count: number
}

/**
 * The three flags staff may change.
 *
 * `is_staff` and `is_superuser` are **not** among them — the API answers `400`
 * for either, because holding `is_staff` is what grants access to this whole
 * dashboard and granting it stays a superuser act in Django admin. Do not add a
 * staff toggle to the UI.
 */
export interface AdminUserFlagsPayload {
  is_partner?: boolean
  is_verified?: boolean
  is_active?: boolean
  note?: string
}

/** The flags envelope. A no-op is a `200` with an empty `changed`. */
export interface AdminFlagsResult {
  ok: boolean
  message: string
  item: AdminUserDetail
  changed: string[]
  action_ids: string[]
}

export type AdminActionKind =
  | 'approve'
  | 'reject'
  | 'confirm'
  | 'claim'
  | 'cancel'
  | 'flag_change'

export type AdminActionTarget =
  | 'template'
  | 'listing'
  | 'partner_request'
  | 'payment'
  | 'commission'
  | 'credit_order'
  | 'user'

/**
 * One audit row. Read-only everywhere, Django admin included.
 *
 * `target_id` is a **string** for every target — the models mix integer and
 * UUID primary keys — and `target_label` is captured at decision time, so it
 * survives the target being deleted. Render the label, never resolve the id.
 */
export interface AdminActionRow {
  id: string
  actor_email: string
  action: AdminActionKind
  action_display: string
  target_type: AdminActionTarget
  target_type_display: string
  target_id: string
  target_label: string
  note: string
  payload: Record<string, unknown>
  created_at: string
}
