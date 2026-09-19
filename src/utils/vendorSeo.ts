/**
 * A vendor storefront's <head>, as the Cloudflare edge writes it
 * (functions/services/vendors/[id].ts), from
 * `GET /api/public/vendors/<uuid>/seo/`.
 *
 * The same arrangement as eventSeo.ts, whose card markup it reuses, and under
 * the same constraint: no imports but that one pure module, no DOM, no Vue —
 * the Pages Function bundles it and type-checks it against the Workers runtime.
 */
import { ogLocaleOf, renderEdgeHead } from './eventSeo'

/** SEO_API_DOCS.md in the backend repo. A 404 for any vendor not in the public directory. */
export interface VendorSeo {
  id: string
  /** The canonical URL. */
  url: string
  name: string
  /** Plain text, at most 160 characters, possibly empty. */
  description: string
  /** Always absolute: the cover, else the logo padded onto white, else the default card. */
  image: string
  /** As the vendor entered them; either may be empty. */
  city: string
  country: string
  /** Approved listings only. */
  services: Array<{
    id: string
    title: string
    category: string | null
    url: string
  }>
  updated_at: string
}

/** The storefront's tab title. The edge writes it; VendorStorefrontView restates it. */
export const vendorDocumentTitle = (name: string) => `${name} - GoEvent Services`

/**
 * schema.org LocalBusiness, as SEO_API_DOCS.md suggests. Empty fields are left
 * out, and the street address, phone and email are never in the response.
 */
export function buildVendorJsonLd(seo: VendorSeo): Record<string, unknown> {
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: seo.name,
    url: seo.url,
    image: seo.image,
  }

  if (seo.description) ld.description = seo.description

  if (seo.city || seo.country) {
    ld.address = {
      '@type': 'PostalAddress',
      ...(seo.city ? { addressLocality: seo.city } : {}),
      ...(seo.country ? { addressCountry: seo.country } : {}),
    }
  }

  if (seo.services.length > 0) {
    ld.makesOffer = seo.services.map((service) => ({
      '@type': 'Offer',
      url: service.url,
      itemOffered: {
        '@type': 'Service',
        name: service.title,
        ...(service.category ? { category: service.category } : {}),
      },
    }))
  }

  return ld
}

export const renderVendorHead = (seo: VendorSeo): string =>
  renderEdgeHead({
    documentTitle: vendorDocumentTitle(seo.name),
    title: seo.name,
    description: seo.description,
    url: seo.url,
    image: seo.image,
    locale: ogLocaleOf(seo.name),
    jsonLd: buildVendorJsonLd(seo),
  })
