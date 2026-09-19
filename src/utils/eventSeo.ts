/**
 * An event page's <head>, as the Cloudflare edge writes it.
 *
 * `functions/events/[id].ts` serves `/events/<uuid>` with the event's own
 * title, description, preview image and schema.org Event data in the HTML
 * itself — what Google indexes and what a link scraper (which never runs this
 * app) turns into a card. This module is the part of that shared with the app
 * booting on top of it: the markup, the attribute that marks it, and the title
 * format, so the edge and the SPA can never disagree about any of them.
 *
 * It must stay free of imports, the DOM and Vue. The Pages Function bundles it
 * with esbuild and type-checks it against the Workers runtime's globals
 * (functions/tsconfig.json), where `document` does not exist. DOM-side helpers
 * live in metaUtils.ts.
 */

/**
 * `GET /api/public/events/<uuid>/seo/` — SEO_API_DOCS.md in the backend repo.
 * Public, unauthenticated, and a 404 for any event that is not public,
 * published and approved.
 */
export interface EventSeo {
  id: string
  /** The canonical URL — for `<link rel="canonical">`, `og:url` and JSON-LD. */
  url: string
  title: string
  /** Plain text, at most 160 characters, possibly empty. Still text: escape it. */
  description: string
  /** Always absolute. A 1200x630 ImageKit JPEG, or the default card. */
  image: string
  /** ISO 8601 in the event's own timezone. */
  start_date: string | null
  end_date: string | null
  is_online: boolean
  /** Free text, and may be empty. */
  location: string
  /** Empty for curated events that list no host. */
  organizer_name: string
  /** `null` for curated events: their price is unknown, so never claim "free". */
  event_type: 'ticketed' | 'fundraising' | 'free' | null
  /** `null` unless the event sells tickets on GoEvent. */
  ticket: {
    price_min: string
    currency: string
    /** At least one tier is on sale right now. */
    available: boolean
    url: string
  } | null
  updated_at: string
}

/**
 * Marks every <head> element the edge wrote. They describe the URL the document
 * was served for, so the app takes them down once the visitor navigates
 * somewhere else — see `clearEdgeMeta` in metaUtils.ts — and leaves the edge's
 * `<title>` alone on the first render (see the router's beforeEach).
 */
export const EDGE_META_ATTR = 'data-edge-meta'

/** The tab title of an event page. The edge writes it; PublicEventView restates it. */
export const eventDocumentTitle = (title: string) => `${title} - GoEvent`

const SCHEMA = 'https://schema.org/'

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// U+2028 and U+2029, built from char codes: written literally they are line
// terminators, invisible in an editor and fatal inside a regex literal.
const LINE_SEPARATOR = String.fromCharCode(0x2028)
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029)

/**
 * JSON for an inline `<script>`. JSON.stringify alone is not safe there: a
 * title containing `</script>` would close the element and carry the rest of
 * itself into the document as markup. Escaping `<`, `>` and `&` as JSON
 * unicode escapes keeps the value identical to a JSON parser and inert to an
 * HTML one; U+2028/2029 are escaped for engines that still read JSON-LD as JS.
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replaceAll(LINE_SEPARATOR, '\\u2028')
    .replaceAll(PARAGRAPH_SEPARATOR, '\\u2029')
}

/**
 * schema.org Event, mapped as SEO_API_DOCS.md suggests. Every field the
 * response can leave empty is omitted rather than written empty, and nothing
 * is claimed that the response does not say — no `offers` without tickets on
 * GoEvent, no `isAccessibleForFree` unless the event is actually free.
 */
export function buildEventJsonLd(seo: EventSeo): Record<string, unknown> {
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: seo.title,
    url: seo.url,
    image: [seo.image],
    eventAttendanceMode: `${SCHEMA}${seo.is_online ? 'Online' : 'Offline'}EventAttendanceMode`,
  }

  if (seo.description) ld.description = seo.description
  if (seo.start_date) ld.startDate = seo.start_date
  if (seo.end_date) ld.endDate = seo.end_date

  // The meeting link is never in the response, so a virtual event's location
  // is the page itself. A venue is one free-text string: it is both the
  // place's name and its address.
  if (seo.is_online) {
    ld.location = { '@type': 'VirtualLocation', url: seo.url }
  } else if (seo.location) {
    ld.location = { '@type': 'Place', name: seo.location, address: seo.location }
  }

  if (seo.organizer_name) {
    ld.organizer = { '@type': 'Organization', name: seo.organizer_name }
  }

  if (seo.ticket) {
    ld.offers = {
      '@type': 'Offer',
      price: seo.ticket.price_min,
      priceCurrency: seo.ticket.currency,
      availability: `${SCHEMA}${seo.ticket.available ? 'InStock' : 'SoldOut'}`,
      url: seo.ticket.url,
    }
  }

  if (seo.event_type === 'free') ld.isAccessibleForFree = true

  return ld
}

/** Khmer script anywhere in the title means the card is read in Khmer. */
const KHMER_SCRIPT = new RegExp(`[${String.fromCharCode(0x1780)}-${String.fromCharCode(0x17ff)}]`)
const ogLocale = (seo: EventSeo) => (KHMER_SCRIPT.test(seo.title) ? 'km_KH' : 'en_US')

/**
 * The backend guarantees 1200x630 for the two images it builds — the ImageKit
 * transform of a banner and the default card — but passes an already-absolute
 * banner URL through untouched, and that one's size is unknown. Declaring
 * dimensions only when they are true keeps a scraper from laying the card out
 * for a shape it isn't.
 */
function ogImageFacts(image: string): { type?: string; sized: boolean } {
  const isTransform = image.includes('tr:w-1200,h-630')
  const isDefault = /\/og\/default\.png$/.test(image)
  let type: string | undefined
  if (/\.png(?:$|\?)/i.test(image)) type = 'image/png'
  else if (image.includes('f-jpg') || /\.jpe?g(?:$|\?)/i.test(image)) type = 'image/jpeg'
  return { type, sized: isTransform || isDefault }
}

/**
 * Everything an event page's head says about the event, as markup to append
 * to <head> after the default card's tags have been removed (the edge does
 * both). Every value is escaped here; nothing in it may be inserted raw.
 */
export function renderEventHead(seo: EventSeo): string {
  const mark = EDGE_META_ATTR
  const title = escapeHtml(seo.title)
  const description = escapeHtml(seo.description)
  const url = escapeHtml(seo.url)
  const image = escapeHtml(seo.image)
  const { type: imageType, sized } = ogImageFacts(seo.image)

  const tags = [
    `<title ${mark}>${escapeHtml(eventDocumentTitle(seo.title))}</title>`,
    description && `<meta name="description" content="${description}" ${mark}>`,
    `<link rel="canonical" href="${url}" ${mark}>`,
    `<meta property="og:type" content="website" ${mark}>`,
    `<meta property="og:title" content="${title}" ${mark}>`,
    description && `<meta property="og:description" content="${description}" ${mark}>`,
    `<meta property="og:url" content="${url}" ${mark}>`,
    `<meta property="og:site_name" content="GoEvent" ${mark}>`,
    `<meta property="og:locale" content="${ogLocale(seo)}" ${mark}>`,
    `<meta property="og:image" content="${image}" ${mark}>`,
    `<meta property="og:image:alt" content="${title}" ${mark}>`,
    imageType && `<meta property="og:image:type" content="${imageType}" ${mark}>`,
    sized && `<meta property="og:image:width" content="1200" ${mark}>`,
    sized && `<meta property="og:image:height" content="630" ${mark}>`,
    `<meta name="twitter:card" content="summary_large_image" ${mark}>`,
    `<meta name="twitter:title" content="${title}" ${mark}>`,
    description && `<meta name="twitter:description" content="${description}" ${mark}>`,
    `<meta name="twitter:image" content="${image}" ${mark}>`,
    `<meta name="twitter:image:alt" content="${title}" ${mark}>`,
    `<meta name="twitter:site" content="@GoEvent" ${mark}>`,
    `<script type="application/ld+json" ${mark}>${serializeJsonLd(buildEventJsonLd(seo))}</script>`,
  ]

  return tags.filter(Boolean).join('\n')
}

/**
 * For an event URL Google should not index: private, draft, unapproved,
 * cancelled, a template-preview sample, or no event at all. The page still
 * works for whoever may see it — only the index is told to stay away.
 */
export const renderNoIndexHead = () => `<meta name="robots" content="noindex" ${EDGE_META_ATTR}>`
