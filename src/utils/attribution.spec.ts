// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { captureAttribution, getAttribution } from './attribution'

/**
 * Attribution is read once, from the address bar the page loaded with, and has
 * to survive the trip through sign-in to the application's submit. These pin
 * the rules that decide which ad an application is credited to.
 */

const STORED_KEY = 'goevent_v3_goevent_attribution'

const land = (url: string, referrer = '') => {
  window.history.replaceState({}, '', url)
  Object.defineProperty(document, 'referrer', { value: referrer, configurable: true })
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  land('/')
})

describe('captureAttribution', () => {
  it('stores the campaign parameters with the landing path, never its query', () => {
    land(
      '/partners?utm_source=facebook&utm_medium=paid&utm_campaign=b2b&fb_ad_id=123&fbclid=abc&guest_name=Dara',
      'https://m.facebook.com/story.php?id=9',
    )
    captureAttribution()

    const stored = getAttribution()
    expect(stored).toMatchObject({
      utm_source: 'facebook',
      utm_medium: 'paid',
      utm_campaign: 'b2b',
      fb_ad_id: '123',
      fbclid: 'abc',
      landing_page: '/partners',
      // Another site's origin and path, not its query string.
      referrer: 'https://m.facebook.com/story.php',
    })
    expect(JSON.stringify(stored)).not.toContain('Dara')
    expect(stored?.last_touch).toBeUndefined()
  })

  it('does not count our own origin as a referrer', () => {
    land('/partners?utm_source=facebook', `${window.location.origin}/events`)
    captureAttribution()
    expect(getAttribution()?.referrer).toBeNull()
  })

  it('stores nothing for an organic visit', () => {
    land('/partners?lang=kh')
    captureAttribution()
    expect(localStorage.getItem(STORED_KEY)).toBeNull()
  })

  it('leaves an earlier campaign visit alone on an organic one', () => {
    land('/partners?utm_source=facebook')
    captureAttribution()
    land('/partners/apply')
    captureAttribution()

    expect(getAttribution()).toMatchObject({ utm_source: 'facebook', landing_page: '/partners' })
  })

  it('keeps the first touch and records a later campaign visit as last_touch', () => {
    land('/partners?utm_source=facebook&utm_campaign=first')
    captureAttribution()
    land('/partners/templates?utm_source=telegram&utm_campaign=second')
    captureAttribution()

    const stored = getAttribution()
    expect(stored).toMatchObject({ utm_source: 'facebook', utm_campaign: 'first' })
    expect(stored?.last_touch).toMatchObject({
      utm_source: 'telegram',
      utm_campaign: 'second',
      landing_page: '/partners/templates',
    })
  })

  it('truncates an overlong value rather than storing it whole', () => {
    land(`/partners?utm_campaign=${'x'.repeat(900)}`)
    captureAttribution()
    expect(getAttribution()?.utm_campaign).toHaveLength(500)
  })
})

describe('getAttribution', () => {
  const store = (value: unknown) =>
    localStorage.setItem(
      STORED_KEY,
      JSON.stringify({ value: JSON.stringify(value), timestamp: Date.now(), version: '3.0' }),
    )

  it('drops a first touch older than 90 days', () => {
    const old = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000).toISOString()
    store({ utm_source: 'facebook', landing_page: '/partners', referrer: null, first_seen_at: old })

    expect(getAttribution()).toBeNull()
    expect(localStorage.getItem(STORED_KEY)).toBeNull()
  })

  it('clears an unreadable record instead of throwing', () => {
    localStorage.setItem(
      STORED_KEY,
      JSON.stringify({ value: '{not json', timestamp: Date.now(), version: '3.0' }),
    )
    expect(getAttribution()).toBeNull()
    expect(localStorage.getItem(STORED_KEY)).toBeNull()

    store(null)
    expect(getAttribution()).toBeNull()
  })
})
