/**
 * Where this browser came from, kept across sign-in so a partner application can
 * say which ad brought it.
 *
 * The partner campaign's ads land on `/partners` with the campaign in the query
 * string, but the application is filed from `/partners/apply` — often after a
 * trip through `/signin`, Google or Telegram, and sometimes days later. Router
 * navigation drops the query string on the first click, so the parameters are
 * read **once, from the address bar the page loaded with**, and kept in
 * localStorage until `usePartnerRequest.submit` posts them as `attribution`.
 *
 * First touch wins: someone who clicked the ad on Monday and came back through
 * Google on Thursday was still brought by the ad. The latest campaign visit is
 * kept alongside as `last_touch`, so either reading is possible later.
 *
 * Never cleared after a successful application — it describes the browser, not
 * the application, and the 90-day expiry is the cleanup.
 *
 * Backend contract: PARTNER_ACCESS_REQUEST_API_DOCS.md, "Lead tracking" (backend
 * repo). The server drops or truncates anything malformed, so nothing here is
 * validated beyond what the browser itself needs.
 */
import { secureStorage } from '@/utils/secureStorage'

const STORAGE_KEY = 'goevent_attribution'

/** Meta's own click cookie lasts 90 days; an older first touch no longer counts. */
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000

/** Longest value kept per parameter — well past any real campaign name. */
const MAX_VALUE_LENGTH = 500

const PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'fbclid',
  'fb_campaign_id',
  'fb_adset_id',
  'fb_ad_id',
  'fb_placement',
] as const

type Param = (typeof PARAMS)[number]

export type AttributionTouch = Partial<Record<Param, string>> & {
  /** Path only: query strings can carry guest names. */
  landing_page: string
  referrer: string | null
  first_seen_at: string
}

export type Attribution = AttributionTouch & { last_touch?: AttributionTouch }

/** Another site's origin and path, never its query string, and never our own origin. */
function externalReferrer(): string | null {
  if (!document.referrer) return null
  try {
    const url = new URL(document.referrer)
    return url.origin === window.location.origin ? null : url.origin + url.pathname
  } catch {
    return null
  }
}

/**
 * Record this page load's campaign parameters, if it has any.
 *
 * Run once at boot, before the router is installed — it starts the initial
 * navigation on install, and a redirect there could rewrite the address bar
 * before this reads it.
 */
export function captureAttribution(): void {
  try {
    const query = new URLSearchParams(window.location.search)
    const params: Partial<Record<Param, string>> = {}
    for (const key of PARAMS) {
      const value = query.get(key)
      if (value) params[key] = value.slice(0, MAX_VALUE_LENGTH)
    }
    // An organic visit leaves any earlier record alone.
    if (!Object.keys(params).length) return

    const touch: AttributionTouch = {
      ...params,
      landing_page: window.location.pathname,
      referrer: externalReferrer(),
      first_seen_at: new Date().toISOString(),
    }

    const existing = getAttribution()
    const next: Attribution = existing ? { ...existing, last_touch: touch } : touch
    secureStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Private mode or a full quota. Attribution is best-effort; never break boot.
  }
}

/**
 * The stored attribution, or `null` when there is none, it has expired, or it
 * cannot be read. Never throws: it is read inside the application's submit, and
 * a tracking fault must not become a failed application.
 */
export function getAttribution(): Attribution | null {
  try {
    const raw = secureStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Attribution
    const age = Date.now() - Date.parse(parsed.first_seen_at)
    if (Number.isNaN(age) || age > MAX_AGE_MS) {
      secureStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    try {
      secureStorage.removeItem(STORAGE_KEY)
    } catch {
      // Storage unavailable; there is nothing to clean up.
    }
    return null
  }
}
