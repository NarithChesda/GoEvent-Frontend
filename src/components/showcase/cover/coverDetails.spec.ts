import { describe, it, expect } from 'vitest'
import {
  coverHostLines,
  eventClock,
  findCoverText,
  formatCoverDate,
  formatCoverTime,
  hostCountScale,
  hostJoinerWord,
  selectCoverHosts,
  takesCapitals,
} from './coverDetails'

const hosts = [
  { id: 1, name: 'Richard Jones', title: 'Groom' },
  { id: 2, name: 'Amanda Wilson', title: 'Bride' },
  { id: 3, name: '  ', title: '' },
  { id: 4, name: 'Mary Anne Smith' },
]

describe('selectCoverHosts', () => {
  it('draws every named host, in the order the event gives them', () => {
    expect(selectCoverHosts(hosts, null).map((h) => h.id)).toEqual([1, 2, 4])
  })

  it('caps at the template count', () => {
    expect(selectCoverHosts(hosts, 2).map((h) => h.id)).toEqual([1, 2])
    expect(selectCoverHosts(hosts, 1).map((h) => h.id)).toEqual([1])
  })

  it('copes with no hosts at all', () => {
    expect(selectCoverHosts(undefined, null)).toEqual([])
  })
})

describe('coverHostLines', () => {
  it('splits at the last space for the surname line, keeping a double given name', () => {
    expect(coverHostLines(hosts[0], 'surname')).toEqual({ name: 'Richard', subline: 'Jones' })
    expect(coverHostLines(hosts[3], 'surname')).toEqual({ name: 'Mary Anne', subline: 'Smith' })
  })

  it('leaves a one-word name whole', () => {
    expect(coverHostLines({ id: 9, name: 'Cher' }, 'surname')).toEqual({ name: 'Cher', subline: null })
  })

  // Khmer puts the family name first, so the Western split would set the given
  // name in the small line.
  it('never splits a name written in Khmer', () => {
    expect(coverHostLines({ id: 9, name: 'ចាន់ សុភា' }, 'surname')).toEqual({
      name: 'ចាន់ សុភា',
      subline: null,
    })
  })

  it('uses the title under the full name', () => {
    expect(coverHostLines(hosts[0], 'title')).toEqual({ name: 'Richard Jones', subline: 'Groom' })
    expect(coverHostLines(hosts[3], 'title')).toEqual({ name: 'Mary Anne Smith', subline: null })
  })

  it('draws the name alone for none', () => {
    expect(coverHostLines(hosts[0], 'none')).toEqual({ name: 'Richard Jones', subline: null })
  })
})

describe('takesCapitals', () => {
  it('only ever applies to Latin text', () => {
    expect(takesCapitals(true, 'Richard')).toBe(true)
    expect(takesCapitals(true, 'សុភា')).toBe(false)
    expect(takesCapitals(false, 'Richard')).toBe(false)
  })
})

describe('hostCountScale', () => {
  it('keeps the reference two names at full size and steps down after', () => {
    expect(hostCountScale(1, 'stacked')).toBe(1)
    expect(hostCountScale(2, 'stacked')).toBe(1)
    expect(hostCountScale(3, 'stacked')).toBeLessThan(1)
    expect(hostCountScale(5, 'stacked')).toBeLessThan(hostCountScale(3, 'stacked'))
  })

  it('steps down sooner on one line, where every name widens the same line', () => {
    expect(hostCountScale(2, 'inline')).toBeLessThan(hostCountScale(2, 'stacked'))
  })
})

describe('hostJoinerWord', () => {
  it('follows the showcase language, falling back to English', () => {
    expect(hostJoinerWord('en')).toBe('and')
    expect(hostJoinerWord('kh')).toBe('និង')
    expect(hostJoinerWord('fr')).toBe('and')
  })
})

describe('eventClock', () => {
  // 02:00Z is 09:00 in Phnom Penh, and 21:00 the day BEFORE in New York — the
  // case where reading the device clock would print the wrong day.
  it('reads the wall clock of the event zone, not the device', () => {
    expect(eventClock('2026-12-12T02:00:00Z', 'Asia/Phnom_Penh')).toEqual({
      year: 2026,
      month: 11,
      day: 12,
      hour: 9,
      minute: 0,
    })
    expect(eventClock('2026-12-12T02:00:00Z', 'America/New_York')).toMatchObject({
      day: 11,
      hour: 21,
    })
  })

  it('falls back to the device clock for an unknown zone', () => {
    const clock = eventClock('2026-12-12T02:00:00Z', 'Not/A_Zone')
    const local = new Date('2026-12-12T02:00:00Z')
    expect(clock).toMatchObject({ day: local.getDate(), hour: local.getHours() })
  })

  it('is null for a missing or unreadable date', () => {
    expect(eventClock(null)).toBeNull()
    expect(eventClock('not a date')).toBeNull()
  })
})

describe('formatCoverDate', () => {
  const clock = { year: 2025, month: 9, day: 20, hour: 10, minute: 0 }

  it('sets the reference card numerals, in Khmer digits on a Khmer showcase', () => {
    expect(formatCoverDate(clock, 'numeric', 'en')).toBe('20.10.2025')
    expect(formatCoverDate(clock, 'numeric', 'kh')).toBe('២០.១០.២០២៥')
  })

  it('spells the long date out in the language', () => {
    expect(formatCoverDate(clock, 'long', 'en')).toContain('October')
    expect(formatCoverDate(clock, 'long', 'kh')).toContain('តុលា')
  })
})

describe('formatCoverTime', () => {
  it('drops empty minutes, and keeps real ones', () => {
    expect(formatCoverTime({ year: 0, month: 0, day: 1, hour: 10, minute: 0 }, 'en')).toBe('10 AM')
    expect(formatCoverTime({ year: 0, month: 0, day: 1, hour: 17, minute: 30 }, 'en')).toBe('5:30 PM')
    expect(formatCoverTime({ year: 0, month: 0, day: 1, hour: 0, minute: 0 }, 'en')).toBe('12 AM')
  })

  it('writes Khmer in Khmer digits', () => {
    expect(formatCoverTime({ year: 0, month: 0, day: 1, hour: 17, minute: 0 }, 'kh')).toBe('ម៉ោង ១៧:០០')
  })
})

describe('findCoverText', () => {
  const texts = [
    { text_type: 'location_text', language: 'en', content: '  Sofitel\nPhnom Penh  ' },
    { text_type: 'location_text', language: 'kh', content: 'សូហ្វីតែល' },
    { text_type: 'time_text', language: 'en', content: '   ' },
  ]

  it('picks the showcase language', () => {
    expect(findCoverText(texts, 'location_text', 'kh')).toBe('សូហ្វីតែល')
    expect(findCoverText(texts, 'location_text', 'en')).toBe('Sofitel\nPhnom Penh')
  })

  it('treats a blank text as none, so the derived value can stand in', () => {
    expect(findCoverText(texts, 'time_text', 'en')).toBeNull()
    expect(findCoverText(texts, 'date_text', 'en')).toBeNull()
  })
})
