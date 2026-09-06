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

/** The seven decision queues. Also the URL segment, so the strings are the API's. */
export type AdminQueue =
  | 'events'
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
    events: number
    templates: number
    listings: number
    partner_requests: number
    payments: number
    commissions: number
    credit_orders: number
    /** The hiring pipeline. Counts `new` applications, not open positions. */
    applications: number
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
    /** Public events that have cleared moderation — i.e. what Explore lists. */
    public_approved?: number
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

/** The organizer's own lifecycle for an event. Not a moderation state. */
export type AdminEventLifecycle = 'draft' | 'published' | 'cancelled' | 'completed'

/** What staff decided about listing the event. */
export type AdminEventModeration = 'pending' | 'approved' | 'rejected'

/**
 * `events` — public events awaiting moderation.
 *
 * **Deliberately not an `AdminReviewableRow`.** Every other queue keeps one
 * status and calls its decider `reviewed_by`; an event carries *two* statuses
 * owned by two different people, and names its decider `moderated_by`. Bending
 * it into the shared shape would have to pick one of the two to be `status`,
 * which is exactly the conflation the backend split the field to avoid.
 *
 * - `status` is the **organizer's** lifecycle: draft → published → cancelled /
 *   completed. Staff never set it.
 * - `moderation_status` is **staff's**: pending → approved / rejected. This is
 *   the one the queue decides, and the one `?status=` filters; the organizer's
 *   is filtered with `?event_status=`.
 *
 * The queue is scoped to `privacy='public'` server-side — a private event is an
 * invitation, not something GoEvent lists — so nothing here has to check it.
 *
 * There is no `admin_notes`: `moderation_note` is shown to the organizer, and
 * is the only note this queue has.
 */
export interface AdminEventRow {
  id: string
  title: string
  slug: string
  short_description: string
  organizer: AdminUserRef | null
  category_name: string | null
  start_date: string | null
  end_date: string | null
  location: string
  banner_image: string | null
  privacy: string
  status: AdminEventLifecycle
  status_display: string
  moderation_status: AdminEventModeration
  moderation_status_display: string
  /** Shown to the organizer. Write rejections for them, not as internal notes. */
  moderation_note: string
  moderated_by: AdminActor
  moderated_at: string | null
  created_at: string
  updated_at?: string
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

/** Any of the seven queue rows. */
export type AdminQueueRow =
  | AdminEventRow
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
  /** The managed catalogues (music, fonts) are writable, so they log CRUD too. */
  | 'create'
  | 'update'
  | 'delete'
  /** A career application moved between pipeline states. */
  | 'status_change'

export type AdminActionTarget =
  | 'event'
  | 'template'
  | 'listing'
  | 'partner_request'
  | 'payment'
  | 'commission'
  | 'credit_order'
  | 'user'
  /** The managed catalogues, which log full CRUD rather than decisions. */
  | 'music'
  | 'font'
  | 'icon'
  | 'pricing_plan'
  | 'team_member'
  | 'category'
  | 'application'

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

// ---------------------------------------------------------------------------
// Managed catalogues
//
// Six staff-authored lists with **full CRUD** and no review workflow — there is
// no state to guard, so there is no approve/reject and no `409`. What they get
// from living behind `/api/admin/` is the audit trail, and a usage count so
// nobody retires an asset that live content still points at.
//
// Every one of them is reachable through Django admin too. The dashboard exists
// because the work is frequent and the record matters, not because it was
// impossible before.
// ---------------------------------------------------------------------------

/** The six catalogue endpoints. Also the URL segment. */
export type AdminCatalogue =
  | 'music'
  | 'fonts'
  | 'icons'
  | 'pricing-plans'
  | 'categories'
  | 'team'

/**
 * `music` — the background tracks an organizer picks from.
 *
 * **`events_using` belongs next to the delete control**, not in a detail panel:
 * it is how many events would lose their music. `Event.selected_music` is
 * `SET_NULL`, so a delete does not fail — it silently leaves those events
 * silent. Deactivating retires the track from the picker while everything that
 * already chose it keeps playing.
 */
export interface AdminMusicRow {
  id: number
  name: string
  description: string
  audio_file: string | null
  category: string
  category_display: string
  /**
   * Supplied by the uploader — nothing on the server derives it — and the
   * showcase sizes its player from it, so the form must require it.
   */
  duration_seconds: number
  duration_display: string
  is_active: boolean
  order: number
  events_using: number
  uploaded_at: string
}

/**
 * `fonts` — the shared type library, staff view.
 *
 * Wider than `/api/core-data/custom-fonts/`, which narrows a partner to system
 * fonts plus their own: this returns **every** font including other partners',
 * because reviewing someone else's upload is the job here.
 *
 * The four metric fields are writable, unlike on the core-data endpoint. They
 * are measured from the file automatically on upload; anything sent explicitly
 * is left alone, which is how staff hand-correct a face the measurement gets
 * wrong. All four coming back `null` means the file could not be measured —
 * the upload still succeeded, but the font will render at the wrong size
 * against the rest of a template until someone fills them in.
 */
export interface AdminFontRow {
  id: number
  name: string
  font_file: string | null
  /** Server-set. A font added here is `system` with a null `created_by`. */
  source: 'system' | 'partner'
  source_display: string
  created_by: AdminUserRef | null
  is_active: boolean
  license_note: string
  size_adjust: string | null
  ascent_override: string | null
  descent_override: string | null
  line_gap_override: string | null
  templates_using: number
  created_at: string
}

/** `icons` — agenda icons, stored as inline SVG markup rather than files. */
export interface AdminIconRow {
  id: number
  name: string
  svg_code: string
  uploaded_at: string
}

/**
 * `pricing-plans` — money.
 *
 * `templates_using` has to be on screen before a price edit or a
 * deactivation: every template on the plan changes what it costs. Editing
 * `commission` moves what partners earn on **future** payments only —
 * commissions already created carry their own rate.
 */
export interface AdminPricingPlanRow {
  id: number
  name: string
  description: string
  price: string
  /** The referrer percentage. */
  commission: string
  features: string[]
  category?: number | null
  category_name?: string | null
  is_active: boolean
  is_best_seller: boolean
  templates_using: number
  created_at?: string
}

/**
 * `categories` — the one partly **user-generated** list here.
 *
 * `/api/core-data/event-categories/` lets any authenticated user create one, so
 * `created_by` is how staff tell a curated entry from something invented for a
 * single event.
 *
 * Prefer `is_active: false` to `DELETE`: `Event.category` is `SET_NULL`, so
 * deleting silently uncategorises every event using it, and `events_count`
 * says how many that would be.
 */
export interface AdminCategoryRow {
  id: number
  name: string
  description: string
  color: string
  icon: string
  created_by: AdminUserRef | null
  is_active: boolean
  events_count: number
  templates_count: number
}

/** `team` — the public About page. */
export interface AdminTeamRow {
  id: number
  name: string
  role: string
  bio: string
  profile_picture: string | null
  email: string
  linkedin_url: string
  twitter_url: string
  github_url: string
  order: number
  is_active: boolean
  created_at?: string
}

/** Any managed-catalogue row. */
export type AdminCatalogueRow =
  | AdminMusicRow
  | AdminFontRow
  | AdminIconRow
  | AdminPricingPlanRow
  | AdminCategoryRow
  | AdminTeamRow

// ---------------------------------------------------------------------------
// Career applications
// ---------------------------------------------------------------------------

/**
 * The eight states of the hiring pipeline.
 *
 * Ordered as the pipeline reads, which is presentation only: **moves are not
 * guarded**. Hiring has no fixed order — a candidate can go back to
 * `reviewing` after an interview — so there is no `409` here and no
 * forward-only rule.
 */
export type AdminApplicationStatus =
  | 'new'
  | 'reviewing'
  | 'shortlisted'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'withdrawn'

/**
 * `applications` — read-only plus one status action.
 *
 * Not an approve/reject queue, so it does not go through the decision drawer.
 * `notes` is the hiring team's private commentary and is **explicitly not
 * visible to the applicant**; `resume` is a document link. Both are personal
 * data, which is why every move here is audited.
 */
export interface AdminApplicationRow {
  id: number | string
  first_name: string
  last_name: string
  email: string
  phone?: string
  position?: number | null
  position_title: string | null
  position_department?: string | null
  resume: string | null
  cover_letter?: string
  /** Private to the hiring team. Never render this to an applicant. */
  notes: string
  status: AdminApplicationStatus
  status_display: string
  applied_at: string
  updated_at?: string
}

/**
 * The status-move envelope.
 *
 * `action_id` is **null** when the move is a no-op — the application was
 * already in that state, so nothing was written. Render that as "no change".
 */
export interface AdminApplicationMove {
  ok: boolean
  message: string
  item: AdminApplicationRow
  action_id: string | null
}

/**
 * The catalogue half of a template — everything about it except how it looks.
 *
 * Accepts only these keys plus an optional `note`. **Any other key is a `400`**,
 * the design blobs included: rejected rather than ignored, so a typo cannot
 * look like a successful save. The look is authored in the partner template
 * editor, which staff can already open for any template.
 */
export interface AdminTemplateCataloguePayload {
  name?: string
  order?: number
  package_plan?: number | null
  status?: string
  showcase_template_version?: string
  note?: string
}

/** Envelope for the catalogue edit and any other multi-field audited write. */
export interface AdminFieldsResult<T> {
  ok: boolean
  message: string
  item: T
  /** Empty on a no-op, which wrote no audit row. Render as "no change". */
  changed: string[]
  action_ids: string[]
}
