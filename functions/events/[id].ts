/**
 * GET /events/<uuid> — the public event page, served with the event's own head.
 *
 * This is an SPA: every URL used to receive the same index.html, whose head
 * says "GoEvent". Google indexed every event under that title, and a link to an
 * event shared in Messenger or Telegram — whose scrapers never run JavaScript —
 * showed the generic card. So this Function takes the app shell and rewrites
 * its head at the edge with what `GET /api/public/events/<uuid>/seo/` says,
 * then hands the page to the browser to boot exactly as before. The markup is
 * built in src/utils/eventSeo.ts, which the app shares.
 *
 * Every visitor gets the same HTML — crawler or person, no user-agent sniffing.
 * The API response is cached at the edge for five minutes, so the lookup costs
 * one round trip per event per five minutes, and it is abandoned after
 * LOOKUP_TIMEOUT_MS: a slow API delays nobody by more than that, it only
 * leaves one render with the generic head.
 *
 *   - 200 → the default card's tags are replaced with the event's own, plus a
 *           canonical URL and schema.org Event JSON-LD.
 *   - 404 → the event exists only for someone signed in (private, draft,
 *           unapproved) or not at all. The shell is served as-is, plus
 *           `noindex` — the page still works for whoever may see it.
 *   - anything else (5xx, timeout, bad JSON, an HTML 404 from a backend
 *           without the endpoint) → the untouched shell. A failure must never
 *           noindex a live event.
 *
 * Routing: `public/_routes.json` sends `/events/*` here, but excludes the event
 * sub-pages (showcase, manage, …) by name so they never pay for an invocation.
 * A new `/events/:id/<page>` route should be added to that exclude list.
 */
import { renderEventHead, renderNoIndexHead, type EventSeo } from '../../src/utils/eventSeo'
import { apiOrigin, edgeCachedInit, type Env, type PagesContext } from '../_lib/edge'

// HTMLRewriter is a Workers runtime global; only what is used is described.
interface RewrittenElement {
  remove(): void
  append(content: string, options?: { html?: boolean }): void
}
interface HTMLRewriterInstance {
  on(selector: string, handlers: { element(element: RewrittenElement): void }): HTMLRewriterInstance
  transform(response: Response): Response
}
declare const HTMLRewriter: { new (): HTMLRewriterInstance }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const LOOKUP_TIMEOUT_MS = 1500

/** The default card's tags in index.html (build/prerenderMeta.ts) that an event's head replaces. */
const DEFAULT_CARD_SELECTORS = [
  'title',
  'meta[name="description"]',
  'meta[property^="og:"]',
  'meta[name^="twitter:"]',
]

type Lookup = { kind: 'found'; seo: EventSeo } | { kind: 'missing' } | { kind: 'unavailable' }

async function lookUpEvent(env: Env, id: string): Promise<Lookup> {
  try {
    const response = await fetch(
      `${apiOrigin(env)}/api/public/events/${id}/seo/`,
      // A 404 is cached as long as a 200: publishing an event reaches the page
      // within five minutes either way. Errors are never cached.
      edgeCachedInit({ '200-299': 300, '404': 300, '500-599': 0 }, LOOKUP_TIMEOUT_MS, {
        Accept: 'application/json',
      }),
    )
    // Only the view's own 404 means "not indexable", and DRF answers in JSON.
    // Django's HTML 404 means the endpoint itself is missing — a backend
    // deployed without it, or a misconfigured VITE_API_BASE_URL — and reading
    // that as "private" would noindex every event on the site at once.
    if (response.status === 404) {
      const isJson = (response.headers.get('content-type') || '').includes('application/json')
      return isJson ? { kind: 'missing' } : { kind: 'unavailable' }
    }
    if (!response.ok) return { kind: 'unavailable' }

    const seo = (await response.json()) as Partial<EventSeo> | null
    if (
      !seo ||
      typeof seo.title !== 'string' ||
      typeof seo.url !== 'string' ||
      typeof seo.image !== 'string'
    ) {
      return { kind: 'unavailable' }
    }
    return {
      kind: 'found',
      seo: {
        ...seo,
        description: typeof seo.description === 'string' ? seo.description : '',
      } as EventSeo,
    }
  } catch {
    // Timeout, network failure, or a body that isn't JSON.
    return { kind: 'unavailable' }
  }
}

/**
 * The shell with `head` appended to <head>. With `replaceDefaults`, the
 * default card's own tags go first, so a scraper finds one og:title, not two.
 */
function withHead(shell: Response, head: string, replaceDefaults: boolean): Response {
  let rewriter = new HTMLRewriter()
  if (replaceDefaults) {
    for (const selector of DEFAULT_CARD_SELECTORS) {
      rewriter = rewriter.on(selector, { element: (element) => element.remove() })
    }
  }
  rewriter = rewriter.on('head', {
    element: (element) => element.append(head, { html: true }),
  })

  // Re-wrapped so the headers are mutable. The transformed response's own
  // headers, not the shell's: those still carry the shell's Content-Length.
  const transformed = rewriter.transform(shell)
  const response = new Response(transformed.body, transformed)
  // The shell's ETag describes the shell, not this page.
  response.headers.delete('etag')
  return response
}

function noIndex(shell: Response): Response {
  const response = withHead(shell, renderNoIndexHead(), false)
  response.headers.set('X-Robots-Tag', 'noindex')
  return response
}

export const onRequest = async (context: PagesContext): Promise<Response> => {
  const { request, env, params } = context
  if (request.method !== 'GET' && request.method !== 'HEAD') return context.next()

  try {
    // `/` is index.html. Asked for by name, so the shell never depends on how
    // `_redirects` happens to resolve this path — and it comes back with the
    // `_headers` rules for HTML (security headers, no-store) already applied.
    const shell = await env.ASSETS.fetch(
      new Request(new URL('/', request.url), { method: request.method }),
    )
    if (!shell.ok) return shell

    const id = typeof params.id === 'string' ? params.id : ''
    if (!UUID.test(id)) return noIndex(shell)

    const lookup = await lookUpEvent(env, id)
    if (lookup.kind === 'found') return withHead(shell, renderEventHead(lookup.seo), true)
    if (lookup.kind === 'missing') return noIndex(shell)
    return shell
  } catch {
    // Whatever went wrong here, the page itself must still load.
    return context.next()
  }
}
