import { describe, expect, it } from 'vitest'
import {
  countdownParts,
  countdownPhoto,
  countdownPhotoPayload,
  countdownStripsPhotoId,
  formatCount,
  responseSupportsCountdownPhoto,
  stripesShapeMask,
  msToNextMinute,
  paperOnInk,
  PAPER_DARK,
  PAPER_LIGHT,
  replyCardColors,
  resolveCountdownRsvpDesign,
  resolveMapStyle,
} from './countdownRsvp'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

describe('resolveCountdownRsvpDesign', () => {
  it('keeps the pair in the info card when nothing is stored', () => {
    expect(resolveCountdownRsvpDesign(undefined)).toBeNull()
    expect(resolveCountdownRsvpDesign(null)).toBeNull()
  })

  it('reads a stored pair as stored', () => {
    expect(resolveCountdownRsvpDesign({ countdown: 'orbit', rsvp: 'envelope' })).toEqual({
      countdown: 'orbit',
      rsvp: 'envelope',
    })
  })

  /** The partner chose the section, so a newer design degrades, never vanishes. */
  it('reads a design this build does not know as the first of its kind', () => {
    expect(
      resolveCountdownRsvpDesign({ countdown: 'hourglass', rsvp: 'scroll' } as never),
    ).toEqual({ countdown: 'strips', rsvp: 'card' })
    expect(resolveCountdownRsvpDesign({} as never)).toEqual({ countdown: 'strips', rsvp: 'card' })
  })
})

describe('resolveMapStyle', () => {
  it('is the window for anything absent or unknown', () => {
    expect(resolveMapStyle(undefined)).toBe('window')
    expect(resolveMapStyle(null)).toBe('window')
    expect(resolveMapStyle('hexagon')).toBe('window')
    expect(resolveMapStyle('atlas')).toBe('atlas')
  })
})

describe('countdownParts', () => {
  const now = Date.UTC(2026, 8, 24, 10, 0, 0)

  it('splits the time left into days, hours and minutes, floored', () => {
    const target = now + 42 * DAY + 7 * HOUR + 12 * MINUTE + 59_000
    expect(countdownParts(target, now)).toEqual({ days: 42, hours: 7, minutes: 12, passed: false })
  })

  it('does not cap the days at 99, as the card count did', () => {
    expect(countdownParts(now + 130 * DAY, now).days).toBe(130)
  })

  it('is passed at and after the start', () => {
    expect(countdownParts(now, now).passed).toBe(true)
    expect(countdownParts(now - HOUR, now)).toEqual({ days: 0, hours: 0, minutes: 0, passed: true })
    expect(countdownParts(Number.NaN, now).passed).toBe(true)
  })

  it('still counts inside the last minute', () => {
    expect(countdownParts(now + 30_000, now)).toEqual({ days: 0, hours: 0, minutes: 0, passed: false })
  })
})

describe('msToNextMinute', () => {
  it('lands on the next whole minute', () => {
    expect(msToNextMinute(Date.UTC(2026, 0, 1, 0, 0, 45))).toBe(15_000)
    expect(msToNextMinute(Date.UTC(2026, 0, 1, 0, 1, 0))).toBe(MINUTE)
  })
})

describe('formatCount', () => {
  it('pads to two digits and writes Khmer numerals for Khmer', () => {
    expect(formatCount(7, 'en')).toBe('07')
    expect(formatCount(130, 'en')).toBe('130')
    expect(formatCount(7, 'kh')).toBe('០៧')
  })
})

describe('countdownPhoto', () => {
  const photo = (id: number, extra: Record<string, unknown> = {}) => ({
    id,
    image: `/p/${id}.jpg`,
    is_featured: false,
    ...extra,
  })

  it('prefers the featured photograph, then the first one', () => {
    expect(countdownPhoto([photo(1), photo(2, { is_featured: true })])?.id).toBe(2)
    expect(countdownPhoto([photo(1), photo(2)])?.id).toBe(1)
  })

  it('takes the photo marked for the countdown over the featured one', () => {
    const photos = [photo(1, { is_featured: true }), photo(2, { is_countdown_photo: true })]
    expect(countdownPhoto(photos)?.id).toBe(2)
  })

  it('is null with no usable photograph', () => {
    expect(countdownPhoto([])).toBeNull()
    expect(countdownPhoto(undefined)).toBeNull()
    expect(countdownPhoto([photo(1, { image: '' })])).toBeNull()
  })
})

describe('countdownStripsPhotoId', () => {
  const photos = [
    { id: 1, image: '/1.jpg', is_featured: true },
    { id: 2, image: '/2.jpg', is_countdown_photo: true },
  ]
  const strips = { countdown: 'strips', rsvp: 'card' } as const

  it('takes the marked photo out of the gallery while the strips draw it', () => {
    expect(countdownStripsPhotoId(photos, strips, true)).toBe(2)
  })

  /** Shown nowhere else in those cases: taking it out would lose it. */
  it('leaves it in the gallery on any other design, or with the countdown off', () => {
    expect(countdownStripsPhotoId(photos, { countdown: 'flip', rsvp: 'card' }, true)).toBeNull()
    expect(countdownStripsPhotoId(photos, null, true)).toBeNull()
    expect(countdownStripsPhotoId(photos, strips, false)).toBeNull()
  })

  it('never takes the featured fallback out — it is the event photo in general', () => {
    const unmarked = [{ id: 1, image: '/1.jpg', is_featured: true }]
    expect(countdownStripsPhotoId(unmarked, strips, true)).toBeNull()
  })
})

describe('countdown photo payload', () => {
  it('sets and clears the flag, and knows a server that drops it', () => {
    expect(countdownPhotoPayload(true)).toEqual({ is_countdown_photo: true })
    expect(countdownPhotoPayload(false)).toEqual({ is_countdown_photo: false })
    expect(responseSupportsCountdownPhoto({ is_countdown_photo: false })).toBe(true)
    expect(responseSupportsCountdownPhoto({})).toBe(false)
    expect(responseSupportsCountdownPhoto(null)).toBe(false)
  })
})

describe('stripesShapeMask', () => {
  const rectsOf = (url: string) =>
    [...decodeURIComponent(url).matchAll(/<rect x="([\d.]+)" y="0" width="([\d.]+)"/g)].map((m) => [
      Number(m[1]),
      Number(m[2]),
    ])

  it('draws three equal columns filling the frame, the gaps between them clear', () => {
    const mask = stripesShapeMask(0.02)
    expect(mask.bounds).toEqual({ x: 0, y: 0, width: 1, height: 1 })
    const rects = rectsOf(mask.url)
    expect(rects).toHaveLength(3)
    const [[x0, w], [x1], [x2]] = rects
    expect(x0).toBe(0)
    expect(x1 - (x0 + w)).toBeCloseTo(20, 1) // 2% of the 1000-unit frame
    expect(x2 + w).toBeCloseTo(1000, 1) // the last column meets the far edge
  })

  it('keeps an absurd gap from eating the columns', () => {
    const [[, w]] = rectsOf(stripesShapeMask(5).url)
    expect(w).toBeGreaterThanOrEqual(200) // the gap is capped at a fifth of the frame
  })
})

describe('paperOnInk', () => {
  it('keeps a declared background that reads on the ink', () => {
    expect(paperOnInk('#1f2a44', '#f5efe4')).toBe('#f5efe4')
  })

  /** The template processor fills a missing background with the primary itself. */
  it('never returns the ink as its own paper', () => {
    expect(paperOnInk('#1f2a44', '#1f2a44')).toBe(PAPER_LIGHT)
    expect(paperOnInk('#f3e3b5', '#f3e3b5')).toBe(PAPER_DARK)
  })
})

describe('replyCardColors', () => {
  it('prints in the template ink when it reads on the stock', () => {
    const colors = replyCardColors('#3b1f2b', '#3b1f2b')
    expect(colors.ink).toBe('#3b1f2b')
    expect(colors.paper).not.toBe(PAPER_LIGHT) // leaned toward the template's tone
  })

  /** Gold on white measures about 2:1 — not text at the form's sizes. */
  it('falls back to deep brown-black for a pale ink', () => {
    expect(replyCardColors('#dfa54b', '#fff8ec').ink).toBe(PAPER_DARK)
  })

  it('uses plain stock when the tone cannot be read', () => {
    expect(replyCardColors('#222222', 'rgb(1, 2, 3)').paper).toBe(PAPER_LIGHT)
  })
})
