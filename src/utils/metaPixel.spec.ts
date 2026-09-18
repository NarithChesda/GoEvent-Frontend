// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'

/**
 * The pixel reports whole URLs, so what matters most here is where it stays
 * silent: off the allowlist, in preview frames, with no pixel id, and on a
 * sign-in page whose redirect could carry someone else's data.
 *
 * jsdom never executes the injected fbevents.js, so every call stays in the
 * stub's own queue, which is what these read.
 */

type PixelModule = typeof import('./metaPixel')

const route = (name: string, query: Record<string, string> = {}) =>
  ({ name, query }) as unknown as RouteLocationNormalized

const queue = () => (window.fbq?.queue ?? []) as unknown[][]

async function loadPixel(pixelId = '1234567890'): Promise<PixelModule> {
  vi.stubEnv('VITE_META_PIXEL_ID', pixelId)
  vi.resetModules()
  return import('./metaPixel')
}

beforeEach(() => {
  window.history.replaceState({}, '', '/partners')
})

afterEach(() => {
  vi.unstubAllEnvs()
  delete window.fbq
  delete window._fbq
  document.head.querySelectorAll('script').forEach((script) => script.remove())
})

describe('trackPageView', () => {
  it('loads the pixel with its automatic behaviours off, then reports the page', async () => {
    const { trackPageView } = await loadPixel()
    trackPageView(route('partners'))

    expect(window.fbq?.disablePushState).toBe(true)
    expect(queue()).toEqual([
      ['set', 'autoConfig', false, '1234567890'],
      ['init', '1234567890'],
      ['track', 'PageView'],
    ])
    expect(document.head.querySelector('script')?.getAttribute('src')).toBe(
      'https://connect.facebook.net/en_US/fbevents.js',
    )
  })

  it('initialises once across several pages', async () => {
    const { trackPageView } = await loadPixel()
    trackPageView(route('partners'))
    trackPageView(route('partner-apply'))

    expect(queue().filter(([method]) => method === 'init')).toHaveLength(1)
    expect(queue().filter(([, event]) => event === 'PageView')).toHaveLength(2)
    expect(document.head.querySelectorAll('script')).toHaveLength(1)
  })

  it('never hears about a route off the allowlist', async () => {
    const { trackPageView } = await loadPixel()
    trackPageView(route('event-showcase', { guest_name: 'Dara' }))
    trackPageView(route('event-manage'))
    trackPageView(route('credits'))

    expect(window.fbq).toBeUndefined()
    expect(document.head.querySelector('script')).toBeNull()
  })

  it('reports sign-in only when its redirect is absent or the partner funnel', async () => {
    const { trackPageView } = await loadPixel()
    trackPageView(route('signin', { redirect: '/invitation/secret-token' }))
    trackPageView(route('signup', { redirect: '/events/abc/manage' }))
    expect(window.fbq).toBeUndefined()

    trackPageView(route('signin', { redirect: '/partners/apply' }))
    trackPageView(route('signup'))
    expect(queue().filter(([, event]) => event === 'PageView')).toHaveLength(2)
  })

  it('does nothing without a pixel id', async () => {
    const { trackPageView, trackServerEvent } = await loadPixel('')
    trackPageView(route('partners'))
    trackServerEvent({ event_name: 'Lead', event_id: 'abc', custom_data: {} })

    expect(window.fbq).toBeUndefined()
  })

  it('does nothing inside a preview frame', async () => {
    window.history.replaceState({}, '', '/events/abc/showcase-preview-frame')
    const { trackPageView } = await loadPixel()
    trackPageView(route('partners'))

    expect(window.fbq).toBeUndefined()
  })
})

describe('trackServerEvent', () => {
  it("fires the server's event verbatim, with its id for deduplication", async () => {
    const { trackServerEvent } = await loadPixel()
    trackServerEvent({
      event_name: 'Lead',
      event_id: '9c1e-uuid',
      custom_data: { content_name: 'partner_application', content_category: 'print_shop' },
    })

    expect(queue().at(-1)).toEqual([
      'track',
      'Lead',
      { content_name: 'partner_application', content_category: 'print_shop' },
      { eventID: '9c1e-uuid' },
    ])
  })

  it('fires nothing when the backend sent no event', async () => {
    const { trackServerEvent } = await loadPixel()
    trackServerEvent(undefined)
    trackServerEvent(null)

    expect(window.fbq).toBeUndefined()
  })
})

describe('getMetaBrowserIds', () => {
  afterEach(() => {
    document.cookie = '_fbp=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
    document.cookie = '_fbc=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
  })

  it("reads the pixel's cookies", async () => {
    document.cookie = '_fbp=fb.1.1726640000000.1234567890; path=/'
    document.cookie = '_fbc=fb.1.1726640000000.IwAR; path=/'
    const { getMetaBrowserIds } = await loadPixel()

    expect(getMetaBrowserIds()).toEqual({
      fbp: 'fb.1.1726640000000.1234567890',
      fbc: 'fb.1.1726640000000.IwAR',
    })
  })

  it('leaves out a cookie that is not there', async () => {
    const { getMetaBrowserIds } = await loadPixel()
    expect(getMetaBrowserIds()).toEqual({ fbp: undefined, fbc: undefined })
  })
})
