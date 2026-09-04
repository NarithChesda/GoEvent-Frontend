/**
 * Partner (vendor) wholesale credit packs.
 *
 * A partner buys N credits scoped to a set of pricing plans; confirming the
 * payment issues a promo code locked to their account carrying N redemptions
 * valid on those plans. They spend them one per event at template-activation
 * checkout.
 *
 * Source: PARTNER_CREDIT_API_DOCS.md. Everything below lives under
 * `/api/payment/` and is JWT-authenticated - **except the catalogue**
 * (`GET /credit-packs/`), which has been public since 2026-08-30 so the offer
 * page can pitch to prospects. Sending a token there still changes the answer:
 * a partner or staff member also sees packs with `is_public: false`.
 */

export type CreditPackOrderStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled'

/**
 * What a credit may be spent on, beyond its plans.
 *
 * - `any` — every template on the pack's plans, house catalogue included. This
 *   is the default and is exactly how every credit sold before this field
 *   behaved, so an absent value means `any`, never "unknown".
 * - `own_partner` — only a template the buying partner **authored themselves**
 *   and had **approved**. `applicable_plans` cannot express that: a partner
 *   template and a system template routinely share one pricing plan, so a
 *   plan-scoped pack sold at a design-your-own rate would also unlock the house
 *   catalogue and rival partners' work.
 *
 * It follows the pack -> order -> code path the way price and credit count do:
 * chosen on the pack, snapshotted onto the order at purchase, stamped onto the
 * code at issue. Editing a pack later never rewrites what a partner already
 * bought.
 *
 * The field is optional everywhere below because the backend that introduced it
 * may not be deployed yet; read a missing value as `any`.
 */
export type CreditTemplateScope = 'any' | 'own_partner'

/** One plan a pack's credits may be spent on. */
export interface CreditPackPlan {
  id: number
  name: string
  /** The event category the plan belongs to - `null` if it spans all of them. */
  category: string | null
  /** Retail price of one event on this plan. */
  price: string
}

/**
 * One buyable pack in the wholesale catalogue.
 *
 * A pack covers a **set** of plans - normally one tier repeated across event
 * categories, so "25 Basic" is spendable on a wedding, a funeral or a birthday.
 * Credits stay non-interchangeable outside that set: a Basic pack cannot buy a
 * Premium template.
 */
export interface CreditPack {
  id: string
  name: string
  description: string
  price: string
  currency: string
  credit_count: number
  /** Precomputed by the server - never divide client-side. */
  price_per_credit: string
  /** Plan ids the credits cover. Never empty; such a pack is unorderable. */
  applicable_plans: number[]
  /** Plan names, one per id above - repeats when a tier spans categories. */
  applicable_plan_names: string[]
  /** Per-plan name, category and retail price. Use where the category matters. */
  applicable_plan_details: CreditPackPlan[]
  /** The plans deduped into one line, for the narrow "For {plan}" label. */
  pricing_plan_name: string
  /**
   * Retail price of ONE event on this pack's plans - the figure wholesale is
   * measured against. Packs bundle plans of equal price, so this is that shared
   * price; where they ever disagree the server sends the lowest, making a saving
   * derived from it a floor. `null` only when the pack has no plans attached.
   */
  pricing_plan_price: string | null
  discount_type: 'percentage' | 'fixed'
  discount_type_display: string
  discount_value: string
  max_discount_amount: string | null
  /** Days the issued credits stay redeemable. `null` means they never expire. */
  validity_days: number | null
  /**
   * Whose templates this pack's credits unlock. Absent (an older backend) is
   * `any`. Say it on the buy card: `own_partner` is a materially narrower
   * product sold at a design-your-own rate, and a partner who only discovers
   * that at checkout has already paid.
   */
  template_scope?: CreditTemplateScope
  /** The server's own wording for the field above. Ours is better here - the
   * backend label is admin-facing - so this is only a fallback. */
  template_scope_display?: string
  /** A free pack still waits on a human when this is set (the trial pack). */
  requires_approval: boolean
  /** Trial packs - a second order returns 400. */
  once_per_vendor: boolean
  /**
   * The "most popular" highlight, and nothing more.
   *
   * Presentation only: it never changes price, eligibility, what a credit
   * unlocks, or where the pack sits - position is `display_order` alone. It
   * does not decide whether a pack is listed either; that is `is_public`.
   *
   * Nothing stops staff flagging several. A page built for one highlight
   * honours the first featured pack and treats the rest as ordinary, rather
   * than badging four cards at once.
   */
  is_featured: boolean
  /**
   * Whether the pack is part of the public offer. Ships **on**.
   *
   * An unauthenticated response is all-public by definition, so this is only
   * worth reading once a partner is signed in: `false` marks a bespoke or
   * negotiated rate that the public catalogue does not carry. Show it as
   * *their* rate - never as the standard offer, and never on a page a prospect
   * can read. (Suspending a pack outright is `is_active`, which hides it from
   * everyone including partners, so such a pack never reaches this type.)
   */
  is_public: boolean
  display_order: number
}

/**
 * An issued credit code. Account-locked: only the partner account that bought it
 * can redeem it, so a leaked code cannot cost them credits.
 */
export interface PartnerCreditCode {
  id: string
  code: string
  name: string
  description: string
  discount_type: 'percentage' | 'fixed'
  discount_type_display: string
  discount_value: string
  max_discount_amount: string | null
  /** Credits purchased. `null` means unlimited, which packs never are. */
  max_total_uses: number | null
  current_total_uses: number
  /** Credits left. `null` means unlimited (pay-as-you-go codes only). */
  remaining_uses: number | null
  valid_from: string
  valid_until: string | null
  is_active: boolean
  is_expired: boolean
  is_usage_limit_reached: boolean
  /** Plans a credit covers. An empty array means all plans. */
  applicable_plans: number[]
  applicable_plan_names: string[]
  /** Whose templates this batch unlocks - snapshotted at issue. Absent is `any`. */
  template_scope?: CreditTemplateScope
  template_scope_display?: string
  created_at: string
}

export interface CreditPackOrder {
  id: string
  order_reference: string
  /** Not on every serializer - match a pack by `pack_name` when it is absent. */
  pack?: string
  pack_name: string
  amount: string
  currency: string
  credit_count: number
  status: CreditPackOrderStatus
  status_display: string
  /** The scope bought, frozen at purchase - a later edit to the pack can't move it. */
  template_scope?: CreditTemplateScope
  payment_proof: string | null
  /** Populated once `status` is `confirmed` - this is the issued code. */
  promo_code_detail: PartnerCreditCode | null
  transaction_reference?: string
  vendor_notes?: string
  created_at: string
}

/** Create / upload-proof / cancel all answer with the order inside an envelope. */
export interface CreditPackOrderEnvelope {
  success: boolean
  message: string
  order: CreditPackOrder
}

/**
 * Only `pack` is required. Price, credit count, discount terms and validity are
 * all taken from the pack server-side, so never compute a total here.
 */
export interface CreateCreditPackOrderData {
  pack: string
  payment_method?: number
  transaction_reference?: string
  vendor_notes?: string
}

/** GET /my-credits/ - a custom aggregate shape, deliberately not paginated. */
export interface PartnerCreditsSummary {
  /** Already excludes expired and inactive codes - show it as the headline. */
  total_credits_remaining: number
  codes: PartnerCreditCode[]
}

/**
 * One way of funding a template activation. `standard` is always present;
 * `credit` and `partner_rate` are null for anyone who cannot use them.
 */
export interface ActivationFundingOption {
  /** What they pay if they pick this option. */
  amount_due: string
  /** `true` -> activates immediately: no proof, no admin. */
  instant: boolean
  code?: string
  credits_remaining?: number | null
  expires_at?: string | null
  discount_amount?: string
  /**
   * What this credit is good for. `own_partner` is worth naming on the option
   * row - the partner bought a narrower credit and should see which one is
   * being spent.
   */
  template_scope?: CreditTemplateScope
}

/**
 * GET /activation-options/?pricing_plan_id=&event_template_id=
 * Authenticated, not partner-gated.
 *
 * **Always send `event_template_id`.** An `own_partner` credit is matched
 * against the template being unlocked and cannot be identified without one, so
 * omitting it hides those credits entirely - the response under-reports the
 * balance rather than offering a credit checkout would then refuse. Safe, but
 * it reads to the partner as a balance that has gone missing, which is why
 * checkout runs template-first and then funding.
 */
export interface ActivationOptions {
  pricing_plan: { id: number; name: string; price: string }
  /** Echoes the template the options were resolved against; `null` if none was sent. */
  event_template_id?: number | null
  is_partner: boolean
  standard: ActivationFundingOption
  /**
   * `null` -> no credit is spendable here: hide the option.
   *
   * Two different situations collapse into this one value - the account holds
   * no credit for this plan at all, or it holds an own-designs credit that this
   * template does not qualify for. Only the second is worth explaining, and the
   * balance (`/my-credits/`) is the only place to tell them apart.
   */
  credit: ActivationFundingOption | null
  /** Present when the partner holds a pay-as-you-go code for this plan. */
  partner_rate: ActivationFundingOption | null
}
