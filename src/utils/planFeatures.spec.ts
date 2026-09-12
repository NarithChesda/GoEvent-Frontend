import { describe, it, expect } from 'vitest'

import { parsePlanFeature, planFeatureTitle } from './planFeatures'

describe('parsePlanFeature', () => {
  it('splits a line on the spaced em dash', () => {
    expect(parsePlanFeature('Guest links — one per guest, with their name on it')).toEqual({
      title: 'Guest links',
      description: 'one per guest, with their name on it',
    })
  })

  it('accepts a spaced en dash too', () => {
    expect(parsePlanFeature('Seating – drag guests onto tables')).toEqual({
      title: 'Seating',
      description: 'drag guests onto tables',
    })
  })

  it('splits on the first separator only, so a dash in the description survives', () => {
    expect(
      parsePlanFeature('Analytics — replies, plus-ones — and who has not answered'),
    ).toEqual({
      title: 'Analytics',
      description: 'replies, plus-ones — and who has not answered',
    })
  })

  it('parses Khmer lines', () => {
    expect(parsePlanFeature('ពីរភាសាក្នុងកាតតែមួយ — ខ្មែរ និងអង់គ្លេស')).toEqual({
      title: 'ពីរភាសាក្នុងកាតតែមួយ',
      description: 'ខ្មែរ និងអង់គ្លេស',
    })
  })

  // Every feature written before the convention existed is one of these, and
  // all seven render surfaces must keep showing them unchanged.
  it('treats a line with no separator as a title alone', () => {
    expect(parsePlanFeature('Unlimited Time Live')).toEqual({
      title: 'Unlimited Time Live',
      description: '',
    })
  })

  it('does not split an unspaced dash, which is punctuation inside the title', () => {
    expect(parsePlanFeature('Up-to 30 Basic Pre-Templates')).toEqual({
      title: 'Up-to 30 Basic Pre-Templates',
      description: '',
    })
  })

  it('never returns an empty title for a line that opens with a dash', () => {
    expect(parsePlanFeature('— 20 Photos')).toEqual({
      title: '— 20 Photos',
      description: '',
    })
  })

  it('trims surrounding whitespace', () => {
    expect(parsePlanFeature('  Photos   —   up to 20  ')).toEqual({
      title: 'Photos',
      description: 'up to 20',
    })
  })

  it('survives an empty line', () => {
    expect(parsePlanFeature('')).toEqual({ title: '', description: '' })
  })
})

describe('planFeatureTitle', () => {
  it('returns the half the compact template cards draw', () => {
    expect(planFeatureTitle('Guest links — one per guest')).toBe('Guest links')
    expect(planFeatureTitle('Attendee Management')).toBe('Attendee Management')
  })
})
