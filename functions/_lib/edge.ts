/**
 * Shared by the Pages Functions in this directory. Not a route: Pages builds
 * routes only from modules that export an `onRequest*` handler, which this one
 * does not (checked against `wrangler pages dev`).
 *
 * The Workers runtime types (`@cloudflare/workers-types`) are not installed —
 * the two Functions use a handful of runtime APIs, so the ones they touch are
 * described here instead of pulling in a package that clashes with the DOM lib
 * the rest of the repo type-checks against.
 */

export interface Env {
  /** The static site: `dist/`, with `_redirects` and `_headers` applied. */
  ASSETS: { fetch(input: Request | URL | string): Promise<Response> }
  /**
   * The same variable the app is built with. Pages hands a project's dashboard
   * variables to its Functions at runtime too, so preview deployments that
   * point at another API are followed here as well.
   */
  VITE_API_BASE_URL?: string
}

export interface PagesContext {
  request: Request
  env: Env
  params: Record<string, string | string[] | undefined>
  /** The static site's answer for this request — `_redirects` included. */
  next(): Promise<Response>
}

const DEFAULT_API_ORIGIN = 'https://api.goevent.online'

/**
 * The API's origin. Tolerates the `/api` suffix some older docs put on
 * `VITE_API_BASE_URL`, since every path below is written from the origin.
 */
export function apiOrigin(env: Env): string {
  const configured = (env.VITE_API_BASE_URL || DEFAULT_API_ORIGIN).trim()
  return configured.replace(/\/+$/, '').replace(/\/api$/, '')
}

/**
 * A subrequest cached at Cloudflare's edge, per response status. `cf` is a
 * Workers extension to RequestInit; the DOM/WebWorker libs don't know it.
 */
export function edgeCachedInit(
  cacheTtlByStatus: Record<string, number>,
  timeoutMs: number,
  headers: Record<string, string> = {},
): RequestInit {
  return {
    headers,
    signal: AbortSignal.timeout(timeoutMs),
    cf: { cacheEverything: true, cacheTtlByStatus },
  } as RequestInit
}
