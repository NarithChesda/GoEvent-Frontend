/**
 * GET /services/vendors/<uuid> — a vendor storefront, served with the vendor's
 * own head: name, description, cover and schema.org LocalBusiness, from
 * `GET /api/public/vendors/<uuid>/seo/`. The same pipeline as the event page
 * (_lib/seoPage.ts); the markup is built in src/utils/vendorSeo.ts.
 *
 * A backend deployed without that endpoint answers Django's HTML 404, which
 * _lib/seoPage.ts reads as "unavailable" — so the page goes out with the
 * plain shell, exactly as it did before this Function existed, rather than
 * being noindexed.
 *
 * Routing: `public/_routes.json` sends `/services/vendors/*` here. There are
 * no storefront sub-pages; one added under this path must be excluded there.
 */
import type { PagesContext } from '../../_lib/edge'
import { serveRecordPage } from '../../_lib/seoPage'
import { renderNoIndexHead } from '../../../src/utils/eventSeo'
import { renderVendorHead, type VendorSeo } from '../../../src/utils/vendorSeo'

const text = (value: unknown) => (typeof value === 'string' ? value : '')

function parseVendorSeo(body: unknown): VendorSeo | null {
  const seo = body as Partial<VendorSeo> | null
  if (
    !seo ||
    typeof seo.name !== 'string' ||
    typeof seo.url !== 'string' ||
    typeof seo.image !== 'string'
  ) {
    return null
  }
  const services = Array.isArray(seo.services)
    ? seo.services.filter(
        (service) => typeof service?.title === 'string' && typeof service?.url === 'string',
      )
    : []
  return {
    ...seo,
    description: text(seo.description),
    city: text(seo.city),
    country: text(seo.country),
    services,
  } as VendorSeo
}

export const onRequest = (context: PagesContext): Promise<Response> =>
  serveRecordPage(context, {
    apiPath: (id) => `/api/public/vendors/${id}/seo/`,
    parse: parseVendorSeo,
    renderHead: renderVendorHead,
    noIndexHead: renderNoIndexHead(),
  })
