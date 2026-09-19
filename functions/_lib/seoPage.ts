/**
 * A public page served with its record's own <head>: the event page
 * (functions/events/[id].ts) and the vendor storefront
 * (functions/services/vendors/[id].ts). Each takes the app shell, asks the
 * backend's SEO endpoint about the record in its URL, and rewrites the shell's
 * generic card with what the answer says — then hands the page to the browser
 * to boot exactly as before. Every visitor gets the same HTML; there is no
 * user-agent sniffing.
 *
 *   - 200 → the default card's tags are replaced with the record's own, plus
 *           a canonical URL and schema.org JSON-LD.
 *   - 404 (JSON) → the record exists only for someone signed in, or not at
 *           all. The shell is served as-is plus `noindex`: the page still
 *           works for whoever may see it.
 *   - anything else (5xx, timeout, bad JSON, an HTML 404 from a backend
 *           without the endpoint) → the untouched shell. A failure must never
 *           noindex a live page.
 *
 * Not a route: Pages builds routes only from modules that export an
 * `onRequest*` handler.
 */
import {
  EDGE_USER_AGENT,
  SHELL_PATH,
  apiOrigin,
  type Env,
  type PagesContext,
} from './edge'

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

/** How long a visitor may wait on the API before the page goes out without it. */
const LOOKUP_TIMEOUT_MS = 1500

/** A refresh runs after the response has gone, so it can afford to wait longer. */
const REFRESH_TIMEOUT_MS = 10_000

/**
 * How long an answer is used without asking again. The backend drops its own
 * cache the moment a record is saved, so this is the whole delay between an
 * edit and the page's head showing it.
 */
const FRESH_MS = 5 * 60 * 1000

/**
 * How long the last good answer outlives that, to be served while a fresh one
 * is fetched behind the response. A burst — a crawler sweep, a link going
 * viral — used to push some lookups past LOOKUP_TIMEOUT_MS, and each of those
 * pages went out titled "GoEvent". Now only a record nobody has asked about
 * for a day waits on the API at all.
 */
const STALE_MS = 24 * 60 * 60 * 1000

/** The default card's tags in the shell (build/prerenderMeta.ts) that a record's head replaces. */
const DEFAULT_CARD_SELECTORS = [
  'title',
  'meta[name="description"]',
  'meta[property^="og:"]',
  'meta[name^="twitter:"]',
]

export type Lookup<T> = { kind: 'found'; data: T } | { kind: 'missing' } | { kind: 'unavailable' }

/** What is kept at the edge. Only answers — an unavailable API stores nothing. */
interface Stored<T> {
  storedAt: number
  kind: 'found' | 'missing'
  data?: T
}

/**
 * Reads the API's body into a record, or null when it is not one. Anything
 * that fails here is treated as an unavailable API, never as a missing record.
 */
export type ParseRecord<T> = (body: unknown) => T | null

async function fetchLive<T>(
  env: Env,
  apiPath: string,
  parse: ParseRecord<T>,
  timeoutMs: number,
): Promise<Lookup<T>> {
  try {
    const response = await fetch(`${apiOrigin(env)}${apiPath}`, {
      headers: { Accept: 'application/json', 'User-Agent': EDGE_USER_AGENT },
      signal: AbortSignal.timeout(timeoutMs),
    })
    // Only the view's own 404 means "not indexable", and DRF answers in JSON.
    // Django's HTML 404 means the endpoint itself is missing — a backend
    // deployed without it, or a misconfigured VITE_API_BASE_URL — and reading
    // that as "private" would noindex every such page on the site at once.
    if (response.status === 404) {
      const isJson = (response.headers.get('content-type') || '').includes('application/json')
      return isJson ? { kind: 'missing' } : { kind: 'unavailable' }
    }
    if (!response.ok) return { kind: 'unavailable' }

    const data = parse(await response.json())
    return data ? { kind: 'found', data } : { kind: 'unavailable' }
  } catch {
    // Timeout, network failure, or a body that isn't JSON.
    return { kind: 'unavailable' }
  }
}

/**
 * Where an answer is kept: the zone's own edge cache, under a path no page
 * uses. Per data centre, like any Cloudflare cache — so "stale" is always
 * "stale here", and a cold data centre simply asks the API.
 */
const storeKey = (request: Request, apiPath: string) =>
  new Request(`${new URL(request.url).origin}/__edge-seo${apiPath}`)

async function readStored<T>(key: Request): Promise<Stored<T> | null> {
  try {
    const hit = await caches.default.match(key)
    if (!hit) return null
    const stored = (await hit.json()) as Stored<T>
    if (typeof stored?.storedAt !== 'number') return null
    if (stored.kind === 'found' && stored.data) return stored
    if (stored.kind === 'missing') return stored
    return null
  } catch {
    // No Cache API here (a local runtime without one), or a corrupt entry.
    return null
  }
}

async function store<T>(key: Request, lookup: Lookup<T>): Promise<void> {
  if (lookup.kind === 'unavailable') return
  const stored: Stored<T> = {
    storedAt: Date.now(),
    kind: lookup.kind,
    ...(lookup.kind === 'found' ? { data: lookup.data } : {}),
  }
  try {
    await caches.default.put(
      key,
      new Response(JSON.stringify(stored), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `max-age=${Math.round((FRESH_MS + STALE_MS) / 1000)}`,
        },
      }),
    )
  } catch {
    // Not storing only costs the next visitor a live lookup.
  }
}

/**
 * The record behind `apiPath`: from the edge while it is fresh; from the edge
 * while it is merely stale, with a refresh started behind the response; else
 * from the API, within LOOKUP_TIMEOUT_MS.
 *
 * Only a record that was *found* is ever served stale. A stale "missing" is
 * asked about again, so a page that has just been published is never held
 * under `noindex` by an old answer — and an API that fails then leaves the
 * page untouched rather than noindexed, the same as it always has.
 */
export async function lookUp<T>(
  context: PagesContext,
  apiPath: string,
  parse: ParseRecord<T>,
): Promise<Lookup<T>> {
  const key = storeKey(context.request, apiPath)
  const stored = await readStored<T>(key)
  const age = stored ? Date.now() - stored.storedAt : Infinity

  if (stored && age < FRESH_MS) {
    return stored.kind === 'found' ? { kind: 'found', data: stored.data as T } : { kind: 'missing' }
  }

  if (stored?.kind === 'found' && age < FRESH_MS + STALE_MS) {
    context.waitUntil(
      fetchLive(context.env, apiPath, parse, REFRESH_TIMEOUT_MS).then((live) => store(key, live)),
    )
    return { kind: 'found', data: stored.data as T }
  }

  const live = await fetchLive(context.env, apiPath, parse, LOOKUP_TIMEOUT_MS)
  context.waitUntil(store(key, live))
  return live
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

function noIndex(shell: Response, noIndexHead: string): Response {
  const response = withHead(shell, noIndexHead, false)
  response.headers.set('X-Robots-Tag', 'noindex')
  return response
}

export interface RecordPage<T> {
  /** The SEO endpoint for the record with this id, from the API's origin. */
  apiPath(id: string): string
  parse: ParseRecord<T>
  /** The record's head, every value escaped (src/utils/eventSeo.ts). */
  renderHead(record: T): string
  /** The robots tag for a URL that must stay out of the index. */
  noIndexHead: string
}

/** The whole `onRequest` for `/<something>/<uuid>`, whose uuid is `params.id`. */
export async function serveRecordPage<T>(
  context: PagesContext,
  page: RecordPage<T>,
): Promise<Response> {
  const { request, env, params } = context
  if (request.method !== 'GET' && request.method !== 'HEAD') return context.next()

  try {
    // Asked for by name, so the shell never depends on how `_redirects`
    // happens to resolve this path — and it comes back with the `_headers`
    // rules for HTML (security headers, no-store) already applied.
    const shell = await env.ASSETS.fetch(
      new Request(new URL(SHELL_PATH, request.url), { method: request.method }),
    )
    if (!shell.ok) return shell

    const id = typeof params.id === 'string' ? params.id : ''
    if (!UUID.test(id)) return noIndex(shell, page.noIndexHead)

    const lookup = await lookUp(context, page.apiPath(id), page.parse)
    if (lookup.kind === 'found') return withHead(shell, page.renderHead(lookup.data), true)
    if (lookup.kind === 'missing') return noIndex(shell, page.noIndexHead)
    return shell
  } catch {
    // Whatever went wrong here, the page itself must still load.
    return context.next()
  }
}
