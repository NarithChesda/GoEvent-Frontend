/**
 * Applying to become a shop partner.
 *
 * `is_partner` is a flag an admin sets, and every `/api/payment/` credit
 * endpoint checks it. Until now there was no way for an account to ask for it —
 * the credits page simply told visitors to contact the team, which is a dead end
 * inside the product. These types back the request that replaces that sentence.
 *
 * Deliberately separate from `credit.types.ts`: everything there is partner-only
 * by definition and answers `403` without the flag, whereas these two endpoints
 * exist precisely for accounts that do not have it.
 *
 * Backend spec: docs/backend-api-requirements/partner-access-request.md
 */

export type PartnerRequestStatus = 'pending' | 'approved' | 'rejected'

/**
 * Roughly how much wholesale the applicant expects to need.
 *
 * Buckets rather than a number: it is a sizing hint for whoever reviews the
 * request, not a commitment, and asking for a figure nobody can honestly give
 * costs conversions. Always optional.
 */
export type PartnerRequestVolume = '1_5' | '6_20' | '21_50' | '50_plus'

/**
 * One application. An account has at most one that matters — the latest — so the
 * read endpoint returns a single object rather than a list.
 */
export interface PartnerRequest {
  id: string
  status: PartnerRequestStatus
  /** The server's own wording; prefer it over our own status labels. */
  status_display?: string
  business_name: string
  contact_phone: string
  contact_telegram?: string
  expected_monthly_events?: PartnerRequestVolume | null
  message?: string
  /**
   * What the reviewer told the applicant. Only meaningful on a rejection, and
   * only present when the reviewer wrote one — a rejection with no note must
   * still render, so never assume this is set.
   */
  review_note?: string | null
  /**
   * Whether a fresh application is allowed. The backend owns this decision (a
   * rejection may be final, or may invite a retry after a cooling-off period),
   * so the UI never infers it from `status`.
   */
  can_reapply: boolean
  created_at: string
  reviewed_at?: string | null
}

/** Create answers with the request inside an envelope, like the order endpoints. */
export interface PartnerRequestEnvelope {
  success: boolean
  message: string
  request: PartnerRequest
}

/** Only `business_name` and `contact_phone` are required. */
export interface CreatePartnerRequestData {
  business_name: string
  contact_phone: string
  contact_telegram?: string
  expected_monthly_events?: PartnerRequestVolume
  message?: string
}
