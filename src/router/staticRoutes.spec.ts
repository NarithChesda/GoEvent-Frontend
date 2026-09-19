// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PRERENDERED_ROUTES } from '../../build/prerenderMeta'
import router from './index'

/**
 * Cloudflare Pages answers only the paths it knows. A client route is served
 * with a 200 when a file answers it (`/`, the prerendered cards) or a
 * `_redirects` rewrite to `/` does; everything else gets dist/404.html — the
 * app still boots there, so a person sees the page, but crawlers and link
 * scrapers see a 404. Nothing at runtime would ever surface a route that was
 * added to the router and forgotten in public/_redirects, so this does.
 */

// From the project root, where vitest runs: under jsdom `import.meta.url` is
// not a file URL.
const readPublic = (name: string) => readFileSync(resolve(process.cwd(), 'public', name), 'utf8')

/** A Pages `_redirects` source pattern as a RegExp: `:name` is one segment, `*` anything. */
const toPattern = (source: string) =>
  new RegExp(
    '^' +
      source
        .split(/(\*|:[A-Za-z_]\w*)/)
        .map((part) => {
          if (part === '*') return '.*'
          if (part.startsWith(':')) return '[^/]+'
          return part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        })
        .join('') +
      '$',
  )

const spaRewrites = readPublic('_redirects')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'))
  .map((line) => line.split(/\s+/))
  .filter(([, target, status]) => target === '/' && status === '200')
  .map(([source]) => toPattern(source!))

const servedByFile = new Set(['/', ...PRERENDERED_ROUTES.map((route) => route.path)])

/** A concrete URL for a router path: every param filled with a sample segment. */
const sampleUrl = (routePath: string) => routePath.replace(/:[A-Za-z_]\w*(\([^)]*\))?[?*+]?/g, 'x')

const clientPaths = router
  .getRoutes()
  .map((route) => route.path)
  .filter((routePath) => !routePath.includes(':pathMatch'))

describe('static routing (public/_redirects, public/_routes.json)', () => {
  it('reads the router and the rewrites at all', () => {
    expect(clientPaths.length).toBeGreaterThan(20)
    expect(spaRewrites.length).toBeGreaterThan(10)
  })

  it.each(clientPaths)('serves %s with a 200', (routePath) => {
    const url = sampleUrl(routePath)
    const served = servedByFile.has(url) || spaRewrites.some((pattern) => pattern.test(url))
    expect(served, `add "${routePath}  /  200" to public/_redirects`).toBe(true)
  })

  it('keeps every event sub-page out of the event-page Function', () => {
    const { exclude } = JSON.parse(readPublic('_routes.json')) as { exclude: string[] }
    const subPages = clientPaths
      .map((routePath) => routePath.match(/^\/events\/:id\/([^/]+)$/)?.[1])
      .filter((page): page is string => Boolean(page))

    expect(subPages.length).toBeGreaterThan(0)
    for (const page of subPages) {
      expect(exclude, `add "/events/*/${page}" to exclude in public/_routes.json`).toContain(
        `/events/*/${page}`,
      )
    }
  })
})
