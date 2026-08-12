// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { buildEventCoverDataUri, resolveCoverTheme } from './eventCoverPlaceholder'
import eventCategories from '@/i18n/locales/en/categories.json'

/**
 * The canonical event categories the backend ships, read straight from the
 * locale file so a category added there without a cover theme fails this suite
 * instead of silently rendering the generic calendar.
 */
const CANONICAL_CATEGORIES = Object.values(eventCategories.event)

const decode = (dataUri: string) =>
  decodeURIComponent(dataUri.replace('data:image/svg+xml,', ''))

describe('resolveCoverTheme', () => {
  it('gives every canonical category its own theme', () => {
    const generic = resolveCoverTheme(null)

    for (const name of CANONICAL_CATEGORIES) {
      expect(resolveCoverTheme(name), `no theme for "${name}"`).not.toBe(generic)
    }
  })

  it('never dresses a funeral in celebratory art', () => {
    const funeral = resolveCoverTheme('Funeral')

    expect(funeral.quiet).toBe(true)
    expect(funeral).not.toBe(resolveCoverTheme('Birthday'))
    expect(funeral).not.toBe(resolveCoverTheme('Seasonal/Holiday'))
    // "Funeral" must win the keyword net outright, never lose to a party token
    expect(resolveCoverTheme('Funeral Reception & Celebration of Life')).toBe(funeral)
  })

  it('matches on the normalized slug, not a loose substring', () => {
    // The old map matched "Business & Tech" against a `business` key and drew a
    // stock portrait of a stranger — the whole reason this module exists.
    expect(resolveCoverTheme('Business & Tech')).toBe(resolveCoverTheme('business_tech'))
    expect(resolveCoverTheme('Arts & Culture')).not.toBe(resolveCoverTheme('Wedding'))
  })

  it('falls back to neutral art for unknown categories', () => {
    const generic = resolveCoverTheme(null)

    expect(resolveCoverTheme('Something Unheard Of')).toBe(generic)
    expect(resolveCoverTheme('')).toBe(generic)
    expect(resolveCoverTheme(undefined)).toBe(generic)
  })
})

describe('buildEventCoverDataUri', () => {
  it('emits a well-formed SVG data URI', () => {
    const uri = buildEventCoverDataUri('Wedding', 'evt-1')

    expect(uri.startsWith('data:image/svg+xml,')).toBe(true)
    // Raw angle brackets and hashes break the URI in some browsers
    expect(uri).not.toMatch(/[<>#]/)

    const svg = decode(uri)
    const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml')
    expect(parsed.querySelector('parsererror')).toBeNull()
    expect(parsed.documentElement.getAttribute('viewBox')).toBe('0 0 800 500')
  })

  it('is stable for one event and varies between categories', () => {
    expect(buildEventCoverDataUri('Wedding', 'evt-1')).toBe(
      buildEventCoverDataUri('Wedding', 'evt-1'),
    )
    expect(buildEventCoverDataUri('Wedding', 'evt-1')).not.toBe(
      buildEventCoverDataUri('Music', 'evt-1'),
    )
  })

  it('varies the composition across events in the same category', () => {
    const covers = new Set(
      ['a1', 'b2', 'c3', 'd4', 'e5', 'f6', 'g7', 'h8'].map((seed) =>
        buildEventCoverDataUri('Business & Tech', seed),
      ),
    )

    // A column of same-category cards must not read as identical tiles
    expect(covers.size).toBeGreaterThan(1)
  })

  it('still produces art when the event has no category at all', () => {
    const uri = buildEventCoverDataUri(null, '')
    expect(uri.startsWith('data:image/svg+xml,')).toBe(true)
    expect(decode(uri)).toContain('<svg')
  })
})
