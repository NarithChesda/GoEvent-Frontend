import { isImageKitEnabled } from '@/composables/useImageKitConfig'

/**
 * Media URL resolution and ImageKit sizing.
 *
 * This consolidates six near-identical copies of the same two steps that had
 * drifted apart across EventCard, EventAboutSection, EventHeroSection,
 * PublicEventView, InvitationView and usePublicEventData — some applied an
 * ImageKit transform, some served the full-size original, and one applied a
 * transform while ignoring the ImageKit toggle entirely.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const PRODUCTION_MEDIA_PREFIX = 'https://api.goevent.online/media/'
const IMAGEKIT_MEDIA_PREFIX = 'https://ik.imagekit.io/goevent/media/'
const IMAGEKIT_URL_PATTERN = /(https:\/\/ik\.imagekit\.io\/[^/]+)(\/.*)/

/**
 * URLs that already resolve exactly as written and must never have an API base
 * prefixed onto them: absolute http(s), plus the in-memory forms — `blob:`
 * (URL.createObjectURL) and `data:` — that stand in for a file the user has
 * picked but not uploaded yet.
 *
 * The blob/data cases are load-bearing for the live template preview, which
 * previews unsaved uploads straight from object URLs (see
 * partnerTemplateAssets.ts). Without this check a `blob:http://host/uuid`
 * failed both `startsWith('http')` and `startsWith('/')` and came back as
 * `http://api-host/media/blob:http://host/uuid` — a URL that 404s, which is why
 * a just-uploaded background rendered as a broken image instead of the picture.
 */
export function isResolvedMediaUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://') || isInMemoryMediaUrl(url)
}

/**
 * The in-memory half of the above: a file the user has picked but not uploaded,
 * standing in for a media URL. Worth telling apart from a resolved remote URL
 * wherever code does more with media than point an element at it — anything
 * that fetches, HEADs, size-checks or re-blobs a URL has nothing to gain from
 * doing it to bytes the page is already holding (see useCoverStageVideo).
 */
export function isInMemoryMediaUrl(url: string): boolean {
  return url.startsWith('blob:') || url.startsWith('data:')
}

/**
 * Turn a media path from the API into an absolute URL. Absolute URLs (including
 * fallback images from other hosts) and in-memory blob/data URLs pass through
 * untouched.
 */
export function resolveMediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined

  if (isResolvedMediaUrl(path)) {
    return path
  }

  return path.startsWith('/') ? `${API_BASE_URL}${path}` : `${API_BASE_URL}/media/${path}`
}

/**
 * Rewrite a media URL to the ImageKit proxy host, without any transform.
 * Returns the URL unchanged when ImageKit is disabled or the URL isn't served
 * from our production media host (local dev, fallback images on other hosts).
 */
export function toImageKitProxy(url: string): string {
  if (!isImageKitEnabled()) return url

  return url.includes('api.goevent.online/media/')
    ? url.replace(PRODUCTION_MEDIA_PREFIX, IMAGEKIT_MEDIA_PREFIX)
    : url
}

/**
 * Route a resolved URL through the ImageKit proxy with a sizing transform.
 *
 * Returns the URL unchanged when ImageKit is disabled, when the URL isn't
 * served from our media host, or when the pattern doesn't match — every caller
 * can treat this as best-effort optimisation.
 */
export function imagekitUrl(
  url: string | undefined,
  transform: string,
): string | undefined {
  if (!url || !isImageKitEnabled()) return url

  const proxied = toImageKitProxy(url)
  if (!proxied.includes('ik.imagekit.io')) return proxied

  const match = proxied.match(IMAGEKIT_URL_PATTERN)
  return match ? `${match[1]}/tr:${transform}${match[2]}` : proxied
}

/**
 * Rendered widths for the event banner, by surface — roughly 2x the CSS width
 * each surface displays at, for retina.
 *
 * Capped at 1200 because that is the stored master's width (see BANNER_IMAGE in
 * constants/media.ts). Asking ImageKit for more than the source has does not
 * add detail. `page` and `hero` are both at the cap today; they stay separate
 * so the full-bleed hero can grow on its own if the master ever does.
 */
export const BANNER_WIDTHS = {
  /** Event grid card (~320px rendered) */
  card: 640,
  /** Banner inside a content column — public event page, invitation card */
  page: 1200,
  /** Full-bleed hero */
  hero: 1200,
} as const

export type BannerWidth = (typeof BANNER_WIDTHS)[keyof typeof BANNER_WIDTHS]

/**
 * Resolve an event banner to a display-sized URL.
 *
 * Width-only on purpose: ImageKit's default `maintain_ratio` crops to exactly
 * the requested box when both dimensions are given, so any width/height pair
 * that doesn't match the master's ratio silently re-crops the frame the host
 * chose (this is what `w-528,h-336` was doing to every event card). Constraining
 * width alone preserves whatever ratio the stored master has, including banners
 * uploaded before the crop step existed.
 */
export function getBannerUrl(
  banner: string | null | undefined,
  width: number = BANNER_WIDTHS.page,
): string | undefined {
  return imagekitUrl(resolveMediaUrl(banner), `w-${width}`)
}
