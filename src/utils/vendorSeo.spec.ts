import { describe, expect, it } from 'vitest'
import { EDGE_META_ATTR } from './eventSeo'
import { buildVendorJsonLd, renderVendorHead, type VendorSeo } from './vendorSeo'

const ID = '80455238-ac44-4793-ad14-bce9bf65d41c'
const URL_ = `https://goevent.online/services/vendors/${ID}`

/** The example response from SEO_API_DOCS.md. */
const vendor = (): VendorSeo => ({
  id: ID,
  url: URL_,
  name: 'Angkor Lens Studio',
  description: 'Plain text, at most 160 characters…',
  image: 'https://ik.imagekit.io/goevent/tr:w-1200,h-630,f-jpg/media/vendor_covers/cover.webp',
  city: 'Phnom Penh',
  country: 'Cambodia',
  services: [
    {
      id: '0b7f',
      title: 'Full Khmer Wedding Day Coverage',
      category: 'Photography',
      url: 'https://goevent.online/services/0b7f',
    },
  ],
  updated_at: '2026-09-18T03:00:00+00:00',
})

describe('buildVendorJsonLd', () => {
  it('maps a vendor as SEO_API_DOCS.md suggests', () => {
    expect(buildVendorJsonLd(vendor())).toEqual({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Angkor Lens Studio',
      url: URL_,
      image: 'https://ik.imagekit.io/goevent/tr:w-1200,h-630,f-jpg/media/vendor_covers/cover.webp',
      description: 'Plain text, at most 160 characters…',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Phnom Penh',
        addressCountry: 'Cambodia',
      },
      makesOffer: [
        {
          '@type': 'Offer',
          url: 'https://goevent.online/services/0b7f',
          itemOffered: {
            '@type': 'Service',
            name: 'Full Khmer Wedding Day Coverage',
            category: 'Photography',
          },
        },
      ],
    })
  })

  it('omits what the response leaves empty', () => {
    const ld = buildVendorJsonLd({
      ...vendor(),
      description: '',
      city: '',
      country: '',
      services: [],
    })
    expect(ld).not.toHaveProperty('description')
    expect(ld).not.toHaveProperty('address')
    expect(ld).not.toHaveProperty('makesOffer')
  })

  it('writes only the half of an address it has', () => {
    const ld = buildVendorJsonLd({ ...vendor(), city: '' })
    expect(ld.address).toEqual({ '@type': 'PostalAddress', addressCountry: 'Cambodia' })
  })

  it('names a service with no category without inventing one', () => {
    const seo = vendor()
    seo.services = [{ ...seo.services[0]!, category: null }]
    const [offer] = buildVendorJsonLd(seo).makesOffer as Array<{ itemOffered: object }>
    expect(offer!.itemOffered).toEqual({
      '@type': 'Service',
      name: 'Full Khmer Wedding Day Coverage',
    })
  })
})

describe('renderVendorHead', () => {
  it('titles the tab, canonicalises the page and marks every tag', () => {
    const head = renderVendorHead(vendor())
    expect(head).toContain(`<title ${EDGE_META_ATTR}>Angkor Lens Studio - GoEvent Services</title>`)
    expect(head).toContain(`<link rel="canonical" href="${URL_}" ${EDGE_META_ATTR}>`)
    expect(head).toContain('"@type":"LocalBusiness"')
    for (const line of head.split('\n')) expect(line).toContain(EDGE_META_ATTR)
  })

  it('escapes a name that carries markup', () => {
    const head = renderVendorHead({ ...vendor(), name: 'Tom & "Jerry" <Studio>' })
    expect(head).toContain('content="Tom &amp; &quot;Jerry&quot; &lt;Studio&gt;"')
    expect(head).not.toContain('<Studio>')
  })
})
