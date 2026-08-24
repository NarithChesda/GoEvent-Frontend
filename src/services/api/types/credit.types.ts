/**
 * Partner (vendor) wholesale credit packs.
 *
 * A partner buys N credits scoped to a set of pricing plans; confirming the
 * payment issues a promo code locked to their account carrying N redemptions
 * valid on those plans. They spend them one per event at template-activation
 * checkout.
 *
 * Source: PARTNER_CREDIT_API_DOCS.md. Everything below lives under
 * `/api/payment/` and is JWT-authenticated.
 */

export type CreditPackOrderStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled'

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
  /** A free pack still waits on a human when this is set (the trial pack). */
  requires_approval: boolean
  /** Trial packs - a second order returns 400. */
  once_per_vendor: boolean
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
}

/** GET /activation-options/?pricing_plan_id= - authenticated, not partner-gated. */
export interface ActivationOptions {
  pricing_plan: { id: number; name: string; price: string }
  is_partner: boolean
  standard: ActivationFundingOption
  /** `null` -> no credit for this plan (or not a partner): hide the option. */
  credit: ActivationFundingOption | null
  /** Present when the partner holds a pay-as-you-go code for this plan. */
  partner_rate: ActivationFundingOption | null
}
