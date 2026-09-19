import { describe, expect, it } from 'vitest'
import {
  EDGE_META_ATTR,
  buildEventJsonLd,
  renderEventHead,
  renderNoIndexHead,
  serializeJsonLd,
  type EventSeo,
} from './eventSeo'

const ID = 'f5bcfe78-d52e-49df-99af-9538f8cfba23'
const LINE_SEPARATOR = String.fromCharCode(0x2028)
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029)
const URL_ = `https://goevent.online/events/${ID}`

/** The example response from SEO_API_DOCS.md. */
const ticketed = (): EventSeo => ({
  id: ID,
  url: URL_,
  title: 'All3rgy: Symphony of Hearts Charity Concert',
  description: 'Plain text, no HTML, at most 160 characters…',
  image: 'https://ik.imagekit.io/goevent/tr:w-1200,h-630,f-jpg/media/event_banners/cover.webp',
  start_date: '2026-10-10T19:00:00+07:00',
  end_date: '2026-10-10T23:00:00+07:00',
  is_online: false,
  location: 'Factory Phnom Penh, 1159 National Road 2, Phnom Penh',
  organizer_name: 'Phnom Penh Jazz Club',
  event_type: 'ticketed',
  ticket: { price_min: '10.00', currency: 'USD', available: true, url: URL_ },
  updated_at: '2026-09-18T03:00:00+00:00',
})

/** Parses the JSON-LD back out of rendered head markup. */
const jsonLdOf = (head: string) => {
  const match = head.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)
  if (!match) throw new Error('no JSON-LD in head')
  return JSON.parse(match[1])
}

describe('buildEventJsonLd', () => {
  it('maps a ticketed event as SEO_API_DOCS.md suggests', () => {
    expect(buildEventJsonLd(ticketed())).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: 'All3rgy: Symphony of Hearts Charity Concert',
      description: 'Plain text, no HTML, at most 160 characters…',
      url: URL_,
      image: [
        'https://ik.imagekit.io/goevent/tr:w-1200,h-630,f-jpg/media/event_banners/cover.webp',
      ],
      startDate: '2026-10-10T19:00:00+07:00',
      endDate: '2026-10-10T23:00:00+07:00',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: 'Factory Phnom Penh, 1159 National Road 2, Phnom Penh',
        address: 'Factory Phnom Penh, 1159 National Road 2, Phnom Penh',
      },
      organizer: { '@type': 'Organization', name: 'Phnom Penh Jazz Club' },
      offers: {
        '@type': 'Offer',
        price: '10.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: URL_,
      },
    })
  })

  it('marks a sold-out event SoldOut', () => {
    const seo = ticketed()
    seo.ticket = { ...seo.ticket!, available: false }
    expect(buildEventJsonLd(seo).offers).toMatchObject({
      availability: 'https://schema.org/SoldOut',
    })
  })

  it('claims free only for a free event, and never offers without tickets', () => {
    const free = { ...ticketed(), event_type: 'free' as const, ticket: null }
    const ld = buildEventJsonLd(free)
    expect(ld.isAccessibleForFree).toBe(true)
    expect(ld).not.toHaveProperty('offers')
  })

  it('claims nothing about the price of a curated event', () => {
    const curated = { ...ticketed(), event_type: null, ticket: null, organizer_name: '' }
    const ld = buildEventJsonLd(curated)
    expect(ld).not.toHaveProperty('isAccessibleForFree')
    expect(ld).not.toHaveProperty('offers')
    expect(ld).not.toHaveProperty('organizer')
  })

  it('offers a fundraiser that sells tickets, without calling it free', () => {
    const ld = buildEventJsonLd({ ...ticketed(), event_type: 'fundraising' })
    expect(ld).toHaveProperty('offers')
    expect(ld).not.toHaveProperty('isAccessibleForFree')
  })

  it('locates a virtual event at its own page', () => {
    const ld = buildEventJsonLd({ ...ticketed(), is_online: true })
    expect(ld.eventAttendanceMode).toBe('https://schema.org/OnlineEventAttendanceMode')
    expect(ld.location).toEqual({ '@type': 'VirtualLocation', url: URL_ })
  })

  it('omits what the response leaves empty', () => {
    const ld = buildEventJsonLd({ ...ticketed(), location: '', description: '', end_date: null })
    expect(ld).not.toHaveProperty('location')
    expect(ld).not.toHaveProperty('description')
    expect(ld).not.toHaveProperty('endDate')
  })
})

describe('serializeJsonLd', () => {
  it('cannot close the script element it is written into', () => {
    const out = serializeJsonLd({ name: '</script><script>alert(1)</script>' })
    expect(out).not.toContain('<')
    expect(out).not.toContain('>')
    expect(JSON.parse(out)).toEqual({ name: '</script><script>alert(1)</script>' })
  })

  it('round-trips ampersands and line separators', () => {
    const value = { name: `Tom & Jerry${LINE_SEPARATOR}${PARAGRAPH_SEPARATOR}` }
    const out = serializeJsonLd(value)
    expect(out).not.toContain('&')
    expect(out).not.toContain(LINE_SEPARATOR)
    expect(out).not.toContain(PARAGRAPH_SEPARATOR)
    expect(JSON.parse(out)).toEqual(value)
  })
})

describe('renderEventHead', () => {
  it('writes the canonical, the card and the JSON-LD, every tag marked', () => {
    const head = renderEventHead(ticketed())
    expect(head).toContain(
      '<title data-edge-meta>All3rgy: Symphony of Hearts Charity Concert - GoEvent</title>',
    )
    expect(head).toContain(`<link rel="canonical" href="${URL_}" data-edge-meta>`)
    expect(head).toContain(`<meta property="og:url" content="${URL_}" data-edge-meta>`)
    expect(head).toContain('<meta property="og:image:type" content="image/jpeg" data-edge-meta>')
    expect(head).toContain('<meta property="og:image:width" content="1200" data-edge-meta>')
    expect(head).toContain('<meta property="og:locale" content="en_US" data-edge-meta>')

    for (const line of head.split('\n')) expect(line).toContain(EDGE_META_ATTR)
    expect(jsonLdOf(head)['@type']).toBe('Event')
  })

  it('escapes every value, and keeps the JSON-LD intact', () => {
    const hostile = {
      ...ticketed(),
      title: 'A "quoted" <b>title</b> & more</title><script>alert(1)</script>',
      description: '"><img src=x onerror=alert(1)>',
    }
    const head = renderEventHead(hostile)

    expect(head).not.toContain('<b>')
    expect(head).not.toContain('<img')
    expect(head).not.toContain('<script>alert')
    expect(head).toContain('content="&quot;&gt;&lt;img src=x onerror=alert(1)&gt;"')
    expect(head.match(/<\/title>/g)).toHaveLength(1)
    expect(head.match(/<\/script>/g)).toHaveLength(1)
    expect(jsonLdOf(head).name).toBe(hostile.title)
  })

  it('leaves description tags out when there is no description', () => {
    const head = renderEventHead({ ...ticketed(), description: '' })
    expect(head).not.toContain('name="description"')
    expect(head).not.toContain('og:description')
    expect(head).not.toContain('twitter:description')
  })

  it('declares the default card as a 1200x630 PNG', () => {
    const head = renderEventHead({ ...ticketed(), image: 'https://goevent.online/og/default.png' })
    expect(head).toContain('<meta property="og:image:type" content="image/png" data-edge-meta>')
    expect(head).toContain('<meta property="og:image:height" content="630" data-edge-meta>')
  })

  it('claims no size for an image the backend passed through untouched', () => {
    const head = renderEventHead({ ...ticketed(), image: 'https://cdn.example.com/banner.webp' })
    expect(head).not.toContain('og:image:width')
    expect(head).not.toContain('og:image:type')
  })

  it('reads a Khmer title as a Khmer card', () => {
    const head = renderEventHead({ ...ticketed(), title: 'ពិធីមង្គលការ' })
    expect(head).toContain('<meta property="og:locale" content="km_KH" data-edge-meta>')
  })
})

describe('renderNoIndexHead', () => {
  it('is one marked robots tag', () => {
    expect(renderNoIndexHead()).toBe('<meta name="robots" content="noindex" data-edge-meta>')
  })
})
