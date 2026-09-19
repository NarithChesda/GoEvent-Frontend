/**
 * GET /sitemap.xml — the backend's sitemap, served from this domain.
 *
 * Django builds it (every public event, approved listing and verified vendor,
 * plus the static pages) at `api.goevent.online/sitemap.xml`, with every <loc>
 * already on goevent.online. Google accepts a sitemap on another host when the
 * site's robots.txt names it, but a sitemap on the site's own host is simpler
 * everywhere else — Search Console submits it under the goevent.online property
 * like any other, and robots.txt names a URL on the same domain it describes.
 *
 * Cached at the edge for an hour. An upstream failure is a 503, which Google
 * treats as "come back later", never as an empty sitemap.
 */
import { apiOrigin, edgeCachedInit, type PagesContext } from './_lib/edge'

const TIMEOUT_MS = 10_000

export const onRequest = async ({ request, env }: PagesContext): Promise<Response> => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } })
  }

  let upstream: Response
  try {
    upstream = await fetch(
      `${apiOrigin(env)}/sitemap.xml`,
      edgeCachedInit({ '200-299': 3600, '404': 60, '500-599': 0 }, TIMEOUT_MS, {
        Accept: 'application/xml',
      }),
    )
  } catch {
    upstream = new Response(null, { status: 504 })
  }

  if (!upstream.ok) {
    return new Response('Sitemap temporarily unavailable.\n', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'Retry-After': '3600',
        'X-Robots-Tag': 'noindex',
      },
    })
  }

  return new Response(request.method === 'HEAD' ? null : upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      // A sitemap is read by crawlers, never a search result of its own.
      'X-Robots-Tag': 'noindex',
    },
  })
}
