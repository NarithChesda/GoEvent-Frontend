// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PRERENDERED_ROUTES, SHELL_PATH } from '../../build/prerenderMeta'
import router from './index'

/**
 * Cloudflare Pages answers only the paths it knows. A client route is served
 * with a 200 when a file answers it (`/`, the prerendered pages) or a
 * `_redirects` rewrite to the app shell does; everything else gets
 * dist/404.html — the app still boots there, so a person sees the page, but
 * crawlers and link scrapers see a 404. Nothing at runtime would ever surface
 * a route that was added to the router and forgotten in public/_redirects, so
 * this does.
 */

// From the project root, where vitest runs: under jsdom `import.meta.url` is
// not a file URL.
const readFromRoot = (...parts: string[]) => readFileSync(resolve(process.cwd(), ...parts), 'utf8')
const readPublic = (name: string) => readFromRoot('public', name)

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

const rules = readPublic('_redirects')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'))
  .map((line) => line.split(/\s+/) as [string, string, string?])

const rewrites = rules.filter(([, , status]) => status === '200')

const spaRewrites = rewrites
  .filter(([, target]) => target === SHELL_PATH)
  .map(([source]) => toPattern(source))

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
    expect(served, `add "${routePath}  ${SHELL_PATH}  200" to public/_redirects`).toBe(true)
  })

  it('rewrites to the app shell, never to the homepage', () => {
    // `/` is index.html, which carries the homepage's canonical and text.
    for (const [source, target] of rewrites) {
      expect(target, `${source} rewrites to ${target}`).toBe(SHELL_PATH)
    }
  })

  it('has the edge Functions build on the same shell', () => {
    const edge = readFromRoot('functions', '_lib', 'edge.ts')
    expect(edge).toContain(`export const SHELL_PATH = '${SHELL_PATH}'`)
  })

  it('retires /home with a permanent redirect to the homepage', () => {
    expect(rules).toContainEqual(['/home', '/', '301'])
    expect(clientPaths).not.toContain('/home')
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

  it('sends vendor storefronts to their Function', () => {
    const { include } = JSON.parse(readPublic('_routes.json')) as { include: string[] }
    expect(include).toContain('/services/vendors/*')
    expect(clientPaths).toContain('/services/vendors/:id')
  })
})

describe('prerendered pages (build/prerenderMeta.ts)', () => {
  const titled = PRERENDERED_ROUTES.filter((route) => route.documentTitle)

  it.each(titled.map((route) => [route.path, route.documentTitle] as const))(
    'titles %s the way the router does',
    (routePath, documentTitle) => {
      // Otherwise the tab title changes as the app boots, and Google reads the
      // rendered one.
      const record = router.resolve(routePath).matched.at(-1)
      expect(record?.meta.title).toBe(documentTitle)
    },
  )

  it('only canonicalises a page elsewhere when that page is prerendered too', () => {
    for (const route of PRERENDERED_ROUTES) {
      if (route.canonicalPath) expect(servedByFile).toContain(route.canonicalPath)
    }
  })
})
