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
  /** The two commerce catalogues. A write here moves money. */
  | 'promo_code'
  | 'credit_pack'

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

/**
 * The eight catalogue endpoints. Also the URL segment.
 *
 * The last two are commerce rather than assets, and they are the reason this
 * union is worth reading carefully: deleting a font loses a file somebody can
 * re-upload, while deleting a promo code or a credit pack destroys a customer's
 * record. Both refuse the dangerous delete server-side (see their row types),
 * which is the one place a catalogue's uniform verbs are not uniform.
 */
export type AdminCatalogue =
  | 'music'
  | 'fonts'
  | 'icons'
  | 'pricing-plans'
  | 'categories'
  | 'team'
  | 'credit-packs'
  | 'promo-codes'

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

// ---------------------------------------------------------------------------
// The commerce catalogues
//
// Promo codes and credit packs are managed catalogues by shape — full CRUD, no
// pending state, every write audited — and unlike the six above them, a mistake
// here moves money. Two consequences run through every type below:
//
// 1. **An empty `applicable_plans` means EVERY plan**, so a $50 credit pack
//    with no plans mints a code that unlocks a $600 template. The pack endpoint
//    refuses to save one; the promo endpoint refuses it only for
//    `partner_credit`, where a marketing code covering everything is a
//    legitimate thing to write.
// 2. **The dangerous deletes are refused, not warned about.** Everywhere else
//    in this API a delete succeeds quietly and orphans content through a
//    `SET_NULL`; here a redeemed code or an ordered pack is a `400`, because
//    what would be destroyed is a customer's record and nothing can put it
//    back. `is_active: false` is the answer in every such case, and the row
//    types carry the counts that say which case you are in.
// ---------------------------------------------------------------------------

/** Percentage or a flat amount off. Shared by both types below. */
export type AdminDiscountType = 'percentage' | 'fixed'

/**
 * What a code *is*, which the discount fields alone cannot tell you.
 *
 * - `marketing` — a public discount. Anyone holding the string can spend it.
 * - `partner_credit` — one partner's prepaid balance, account-locked to
 *   `owner_partner`. Minted by a confirmed credit pack order, so it is money
 *   somebody has already paid.
 *
 * Read it together with `owner_partner_detail`, `template_scope` and
 * `credit_order_reference`: those four are the whole difference, and a
 * partner-credit code looks unremarkable without them.
 */
export type AdminPromoKind = 'marketing' | 'partner_credit'

/**
 * `credit-packs` — the wholesale catalogue partners buy from.
 *
 * **Genuinely new capability, not a re-skin.** `/api/payment/credit-packs/` is
 * read-only for every audience, so before this endpoint a pack could only be
 * created or priced in Django admin. Unlike that public catalogue this lists
 * *every* pack, the withdrawn and the `is_public: false` bespoke ones included
 * — editing those is the job.
 *
 * A pack is a promo-code template plus a price: confirming an order stamps
 * these terms onto a freshly minted code. So editing one reaches **future
 * orders only** — every order copied price, credit count and each discount term
 * at purchase time, and nothing here rewrites what a partner already bought.
 */
export interface AdminCreditPackRow {
  id: string
  name: string
  description: string
  price: string
  currency: string
  /** Redemptions the issued code will allow. */
  credit_count: number
  /** Derived server-side. Null when `credit_count` is 0; never divide here. */
  price_per_credit: string | null
  /**
   * Plan ids a credit may be spent on. **Never empty** — a create or update
   * that would leave it so is a `400`, because an empty list on the issued code
   * means every plan. Bundle plans of comparable price: a credit zeroes
   * whichever one it lands on, so mixing an $85 plan with a $600 plan hands
   * away the difference.
   */
  applicable_plans: number[]
  applicable_plan_names: string[]
  discount_type: AdminDiscountType
  discount_type_display: string
  discount_value: string
  max_discount_amount: string | null
  /** Days the issued code stays redeemable. `null` = never expires. */
  validity_days: number | null
  template_scope: AdminTemplateScope
  template_scope_display: string
  is_active: boolean
  /** On the public offer page. `false` marks a bespoke or negotiated rate. */
  is_public: boolean
  /** The "most popular" highlight, and nothing else. Never prices or reorders. */
  is_featured: boolean
  requires_approval: boolean
  once_per_vendor: boolean
  display_order: number
  /**
   * Any order at all. **Non-zero makes `DELETE` a `400`**: the order's FK is
   * `SET_NULL`, so a delete would succeed quietly and leave those orders unable
   * to say what they were sold as.
   */
  orders_count: number
  /**
   * Orders that were confirmed — i.e. how many partners have seen this pack
   * advertised at the current number. Worth showing before a price edit, which
   * is a conversation rather than a PATCH.
   */
  confirmed_orders_count: number
  created_at: string
  updated_at: string
}

/**
 * `promo-codes` — every code on the platform, marketing and partner credit
 * alike.
 *
 * Wider than `/api/payment/promo-codes/`, which predates partner credits and
 * shows only the marketing fields — so a code that reads as an unremarkable
 * discount there can be somebody's paid-for balance.
 *
 * `code` is **optional on create**: omit it and the server generates one.
 * Supplied codes are uppercased, and a duplicate is a `400` on the uppercased
 * value.
 */
export interface AdminPromoCodeRow {
  id: string
  code: string
  /** Internal name. The `code` is what appears in a support conversation. */
  name: string
  description: string
  discount_type: AdminDiscountType
  discount_type_display: string
  discount_value: string
  max_discount_amount: string | null
  minimum_purchase_amount: string
  /** `null` = unlimited. On a credit code this is the credits purchased. */
  max_total_uses: number | null
  max_uses_per_user: number
  /**
   * **Read-only.** Written by redemption; editing it would hand out or destroy
   * uses with no `PromoCodeUsage` row to explain either. Non-zero also makes
   * `DELETE` a `400` — the usages cascade, and they are what per-user caps and
   * `first_purchase_only` are counted from.
   */
  current_total_uses: number
  /** `null` = unlimited. */
  remaining_uses: number | null
  is_usage_limit_reached: boolean
  valid_from: string
  valid_until: string | null
  is_active: boolean
  is_expired: boolean
  is_not_yet_valid: boolean
  first_purchase_only: boolean
  /** Empty means **every plan**, which is legitimate here and never on a pack. */
  applicable_plans: number[]
  applicable_plan_names: string[]
  /** Ticket-side restrictions. Not editable in the dashboard — Django admin. */
  applicable_events: string[]
  applicable_ticket_types: number[]
  kind: AdminPromoKind
  kind_display: string
  /** Only this account may redeem. Required when `kind` is `partner_credit`. */
  owner_partner: number | null
  owner_partner_detail: AdminUserRef | null
  template_scope: AdminTemplateScope
  template_scope_display: string
  /**
   * Set when a confirmed credit pack order minted this code. Its presence
   * **locks `kind` and `owner_partner`** (changing either is a `400`) and makes
   * `DELETE` a `400`: the order's FK is `SET_NULL` and only an unconfirmed
   * order can mint, so a confirmed one can never issue a replacement — the
   * partner's paid-for credits would simply be gone.
   */
  credit_order_reference: string | null
  created_by: AdminUserRef | null
  created_at: string
  updated_at: string
}

/**
 * One redemption — `GET /api/admin/promo-codes/{id}/usages/`.
 *
 * `current_total_uses` is a number; this is the answer to the question that
 * actually gets asked, which is whether a code leaked and where it went. A row
 * points at exactly one of `payment` or `ticket_order` — a database constraint
 * enforces it — so one of the two references is always null.
 */
export interface AdminPromoCodeUsageRow {
  id: number | string
  user: AdminUserRef | null
  discount_applied: string
  payment: string | null
  payment_reference: string | null
  ticket_order: string | null
  ticket_order_reference: string | null
  created_at: string
}

/** Any managed-catalogue row. */
export type AdminCatalogueRow =
  | AdminMusicRow
  | AdminFontRow
  | AdminIconRow
  | AdminPricingPlanRow
  | AdminCategoryRow
  | AdminTeamRow
  | AdminCreditPackRow
  | AdminPromoCodeRow

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
