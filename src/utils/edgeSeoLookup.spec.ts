import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PagesContext } from '../../functions/_lib/edge'
import { lookUp } from '../../functions/_lib/seoPage'

/**
 * The edge's record lookup (functions/_lib/seoPage.ts): fresh from its own
 * cache for five minutes, stale-while-refreshing for a day after that, and
 * never a noindex out of a failure.
 *
 * Here and not under functions/, where Pages would treat the file as a route.
 * It runs on fakes because `wrangler pages dev`'s Cache API cannot be trusted
 * for this on every machine — on the one this was written on, every `match`
 * threw an internal error while `put` succeeded.
 */

const MINUTE = 60 * 1000
const API_PATH = '/api/public/events/f5bcfe78-d52e-49df-99af-9538f8cfba23/seo/'
const RECORD = { title: 'Symphony of Hearts', url: 'https://goevent.online/events/f5bcfe78' }

const parse = (body: unknown) => {
  const record = body as typeof RECORD | null
  return record && typeof record.title === 'string' ? record : null
}

/** Caches.default as an in-memory map, bodies stored as text like the real one. */
function fakeEdgeCache() {
  const entries = new Map<string, string>()
  vi.stubGlobal('caches', {
    default: {
      async match(key: Request) {
        const text = entries.get(key.url)
        return text === undefined ? undefined : new Response(text)
      },
      async put(key: Request, response: Response) {
        entries.set(key.url, await response.text())
      },
    },
  })
  return entries
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

/** A page request, collecting what it hands to waitUntil so a test can await it. */
function pageContext() {
  const pending: Promise<unknown>[] = []
  const context = {
    request: new Request('https://goevent.online/events/f5bcfe78-d52e-49df-99af-9538f8cfba23'),
    env: {
      VITE_API_BASE_URL: 'https://api.goevent.online',
      ASSETS: { fetch: async () => new Response('shell') },
    },
    params: {},
    next: async () => new Response('shell'),
    waitUntil: (promise: Promise<unknown>) => pending.push(promise),
  } satisfies PagesContext
  return { context, settle: () => Promise.all(pending) }
}

/** One lookup, with everything it started behind the response finished. */
async function lookUpSettled() {
  const { context, settle } = pageContext()
  const result = await lookUp(context, API_PATH, parse)
  await settle()
  return result
}

let api: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-19T00:00:00Z'))
  fakeEdgeCache()
  api = vi.fn(async () => json(RECORD))
  vi.stubGlobal('fetch', api)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('lookUp', () => {
  it('asks the API once, then answers from the edge while fresh', async () => {
    expect(await lookUpSettled()).toEqual({ kind: 'found', data: RECORD })
    vi.setSystemTime(Date.now() + 4 * MINUTE)
    expect(await lookUpSettled()).toEqual({ kind: 'found', data: RECORD })
    expect(api).toHaveBeenCalledTimes(1)
  })

  it('sends a named user agent, which the API needs to let it through', async () => {
    await lookUpSettled()
    const init = api.mock.calls[0]![1] as RequestInit
    expect(new Headers(init.headers).get('User-Agent')).toMatch(/^GoEvent-Edge\//)
  })

  it('serves the last good answer when the API is down, and refreshes behind it', async () => {
    await lookUpSettled()
    vi.setSystemTime(Date.now() + 6 * 60 * MINUTE)
    api.mockImplementation(async () => {
      throw new Error('timed out')
    })

    expect(await lookUpSettled()).toEqual({ kind: 'found', data: RECORD })
    expect(api).toHaveBeenCalledTimes(2)

    // Once the API is back, the refresh behind a stale answer replaces it.
    const renamed = { ...RECORD, title: 'Symphony of Hearts (moved)' }
    api.mockImplementation(async () => json(renamed))
    expect(await lookUpSettled()).toEqual({ kind: 'found', data: RECORD })
    expect(await lookUpSettled()).toEqual({ kind: 'found', data: renamed })
  })

  it('gives up on an answer more than a day past fresh', async () => {
    await lookUpSettled()
    vi.setSystemTime(Date.now() + 25 * 60 * MINUTE)
    api.mockImplementation(async () => {
      throw new Error('timed out')
    })
    expect(await lookUpSettled()).toEqual({ kind: 'unavailable' })
  })

  it('never serves a stale "missing": a failure must not noindex a page', async () => {
    api.mockImplementation(async () => json({ detail: 'Not found.' }, 404))
    expect(await lookUpSettled()).toEqual({ kind: 'missing' })

    vi.setSystemTime(Date.now() + 6 * MINUTE)
    api.mockImplementation(async () => {
      throw new Error('timed out')
    })
    expect(await lookUpSettled()).toEqual({ kind: 'unavailable' })
  })

  it("reads Django's HTML 404 as a missing endpoint, not a missing record", async () => {
    api.mockImplementation(
      async () =>
        new Response('<h1>Not Found</h1>', { status: 404, headers: { 'content-type': 'text/html' } }),
    )
    expect(await lookUpSettled()).toEqual({ kind: 'unavailable' })
  })

  it('stores nothing when the API is unavailable', async () => {
    api.mockImplementation(async () => new Response('bad gateway', { status: 502 }))
    expect(await lookUpSettled()).toEqual({ kind: 'unavailable' })
    api.mockImplementation(async () => json(RECORD))
    expect(await lookUpSettled()).toEqual({ kind: 'found', data: RECORD })
  })
})
