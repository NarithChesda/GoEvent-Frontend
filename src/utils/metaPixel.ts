/**
 * The Meta pixel, loaded only where it is allowed to see the page.
 *
 * It exists for the partner Facebook campaign, whose conversion is an
 * application at `/partners/apply`. The backend sends each application to Meta
 * as a server-side `Lead` (Conversions API); `trackServerEvent` fires the
 * browser's identical twin, and Meta counts the pair once.
 *
 * **Never paste Meta's snippet into `index.html`.** Loaded site-wide, the pixel
 * would:
 * - send guests' names to Meta — it reports full page URLs, and invitation URLs
 *   carry `guest_name` (`/events/:id/showcase?guest_name=...`);
 * - fire from every Design Studio preview iframe, each of which boots the whole
 *   app (see previewFrameContext.ts);
 * - fill the partner audiences with wedding guests.
 *
 * So it loads on demand, reports `PageView` only on an allowlist of marketing
 * routes, and has both of its automatic behaviours off: `disablePushState`
 * (otherwise it sends a PageView on *every* in-app route change once loaded,
 * showcase included) and `autoConfig` (otherwise it reports button clicks and
 * page metadata everywhere). After that it sends only what this module tells it
 * to, and with no `VITE_META_PIXEL_ID` it does nothing at all.
 *
 * Backend contract: PARTNER_ACCESS_REQUEST_API_DOCS.md, "Lead tracking" (backend
 * repo).
 */
import type { RouteLocationNormalized } from 'vue-router'
import { isPreviewFrameDocument } from '@/utils/previewFrameContext'

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void
  queue: unknown[]
  push: Fbq
  loaded: boolean
  version: string
  disablePushState?: boolean
}

declare global {
  interface Window {
    fbq?: Fbq
    _fbq?: Fbq
  }
}

const PIXEL_ID = (import.meta.env.VITE_META_PIXEL_ID as string | undefined)?.trim() || undefined

/**
 * The routes the pixel may report. Everything else, above all the invitation
 * showcase, it never hears about. A route belongs here only if its URL cannot
 * carry anyone's data: the pixel sends the whole address, query string included.
 */
const TRACKED_ROUTES = new Set(['home', 'about', 'partners', 'partner-templates', 'partner-apply'])

/**
 * Sign-in and sign-up are part of the funnel (the apply form sends anyone
 * without an account through them), but their `?redirect=` can hold any path in
 * the app — a collaborator invitation token (`/invitation/:token`), an event.
 * They are reported only on the funnel's own round trip, or with no redirect.
 */
const AUTH_ROUTES = new Set(['signin', 'signup'])

function isReportable(to: RouteLocationNormalized): boolean {
  if (typeof to.name !== 'string') return false
  if (TRACKED_ROUTES.has(to.name)) return true
  if (!AUTH_ROUTES.has(to.name)) return false

  const redirect = to.query.redirect
  return (
    redirect === undefined || (typeof redirect === 'string' && redirect.startsWith('/partners'))
  )
}

let initialised = false

/** Meta's base snippet, as a module. */
function installPixel(): void {
  if (window.fbq) return
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args)
    else fbq.queue.push(args)
  } as Fbq
  fbq.push = fbq
  fbq.loaded = true
  fbq.version = '2.0'
  fbq.queue = []
  // Read by the library when it loads, so it must be set before.
  fbq.disablePushState = true
  window.fbq = fbq
  window._fbq = fbq

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(script)
}

function ensurePixel(): boolean {
  if (!PIXEL_ID || isPreviewFrameDocument()) return false
  if (!initialised) {
    installPixel()
    window.fbq!('set', 'autoConfig', false, PIXEL_ID) // must precede init
    window.fbq!('init', PIXEL_ID)
    initialised = true
  }
  return true
}

/** For `router.afterEach`. A no-op off the allowlist and when no pixel id is set. */
export function trackPageView(to: RouteLocationNormalized): void {
  try {
    if (isReportable(to) && ensurePixel()) window.fbq!('track', 'PageView')
  } catch {
    // Tracking must never break navigation.
  }
}

/** The `meta_event` the backend returns with a created partner request. */
export interface MetaBrowserEvent {
  event_name: string
  event_id: string
  custom_data: Record<string, string>
}

/**
 * Fire the browser twin of an event the server has already sent, exactly as the
 * server described it. Same `eventID`, so Meta counts the pair once — which is
 * why neither the id nor `custom_data` is ever built here: any difference
 * between the two copies makes Meta's data inconsistent.
 *
 * Works off the allowlist too (the `/credits` drawer): it reports only this
 * event, on a page that carries no guest data. `null`/absent — the backend
 * before lead tracking was deployed — fires nothing.
 */
export function trackServerEvent(event: MetaBrowserEvent | undefined | null): void {
  if (!event) return
  try {
    if (ensurePixel()) {
      window.fbq!('track', event.event_name, event.custom_data, { eventID: event.event_id })
    }
  } catch {
    // Never let the pixel turn a saved application into an error.
  }
}

/**
 * The pixel's first-party cookies, for the API to forward to Meta.
 *
 * They go in the request body because the API is on another origin and
 * authenticates with a bearer token, so these cookies never ride along with an
 * API call. A missing `_fbc` (ad blocker, or the landing route was off the
 * allowlist) is fine: the backend rebuilds it from the stored `fbclid`.
 */
export function getMetaBrowserIds(): { fbp?: string; fbc?: string } {
  try {
    const read = (name: string) =>
      document.cookie
        .split('; ')
        .find((part) => part.startsWith(`${name}=`))
        ?.slice(name.length + 1)
    return { fbp: read('_fbp'), fbc: read('_fbc') }
  } catch {
    return {}
  }
}
