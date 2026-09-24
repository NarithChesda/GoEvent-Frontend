import { describe, expect, it } from 'vitest'

import {
  buildCalendarDesignModel,
  cardInkFor,
  inkOn,
  paperToneOf,
  resolveCalendarCardColor,
  resolveCalendarCardRadius,
  resolveCalendarStyle,
} from './calendarModel'

const LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const modelFor = (date: Date, language = 'en') =>
  buildCalendarDesignModel({
    date,
    language,
    heading: 'Heading',
    weekdayLabels: LABELS,
    weekday: 'Weekday',
    month: 'Month',
    year: '2025',
  })

describe('buildCalendarDesignModel', () => {
  // 12 December 2025 is a Friday; December 2025 starts on a Monday.
  const model = modelFor(new Date(2025, 11, 12))

  it('lays the month out as whole weeks, padded at both ends', () => {
    expect(model.weeks.every((week) => week.length === 7)).toBe(true)
    expect(model.weeks[0][0]).toBeNull()
    expect(model.weeks[0][1]?.day).toBe(1)
    expect(model.monthDays).toHaveLength(31)
    const flat = model.weeks.flat()
    expect(flat.filter(Boolean)).toHaveLength(31)
    expect(flat.find((cell) => cell?.isEvent)?.day).toBe(12)
  })

  it("gives the event's own Sunday-to-Saturday week", () => {
    expect(model.week.map((d) => d.day)).toEqual([7, 8, 9, 10, 11, 12, 13])
    expect(model.week[5].isEvent).toBe(true)
  })

  it('fills a week that crosses a month end with the real neighbouring days', () => {
    // 1 January 2026 is a Thursday: the week runs from 28 December.
    const week = modelFor(new Date(2026, 0, 1)).week
    expect(week.map((d) => d.day)).toEqual([28, 29, 30, 31, 1, 2, 3])
    expect(week.map((d) => d.inMonth)).toEqual([false, false, false, false, true, true, true])
    expect(week.filter((d) => d.isEvent).map((d) => d.day)).toEqual([1])
  })

  it('turns the page back across a month for the desk calendar', () => {
    expect(modelFor(new Date(2026, 2, 1)).previousDayLabel).toBe('28')
    expect(model.previousDayLabel).toBe('11')
  })

  it('prints every number in Khmer numerals in Khmer', () => {
    const kh = modelFor(new Date(2025, 11, 12), 'kh')
    expect(kh.dayLabel).toBe('១២')
    expect(kh.monthDays[0].label).toBe('១')
  })
})

describe('resolveCalendarStyle', () => {
  it('keeps a known style and reads anything else as classic', () => {
    expect(resolveCalendarStyle('dial')).toBe('dial')
    expect(resolveCalendarStyle(undefined)).toBe('classic')
    expect(resolveCalendarStyle(null)).toBe('classic')
    expect(resolveCalendarStyle('lunar')).toBe('classic')
  })
})

describe('the card calendar', () => {
  it('is printed on white unless the template names another paper', () => {
    expect(resolveCalendarCardColor(undefined)).toBe('#FFFFFF')
    expect(resolveCalendarCardColor(null)).toBe('#FFFFFF')
    expect(resolveCalendarCardColor('#fdf2f4')).toBe('#fdf2f4')
    // A half-typed hex renders white rather than an invalid background.
    expect(resolveCalendarCardColor('#fdf2')).toBe('#FFFFFF')
  })

  it("keeps the template's ink when it reads on the paper, and swaps it when it doesn't", () => {
    // Dark brown on white is well over 3:1 — the template's own ink stays.
    expect(cardInkFor('#6b4f3a', '#FFFFFF')).toBe('#6b4f3a')
    // Gold on white is about 2:1, so the card prints in near-black instead.
    expect(cardInkFor('#dfa54b', '#FFFFFF')).toBe('#1f1a17')
    // And on a deep card the gold reads, so it is kept.
    expect(cardInkFor('#dfa54b', '#1a1512')).toBe('#dfa54b')
  })

  it('draws a deeper shadow under dark paper', () => {
    expect(paperToneOf('#FFFFFF')).toBe('light')
    expect(paperToneOf('#1a1512')).toBe('dark')
  })

  it('reads a stored radius as a whole px inside the editor range, absent as square', () => {
    expect(resolveCalendarCardRadius(undefined)).toBe(0)
    expect(resolveCalendarCardRadius(17.6)).toBe(18)
    expect(resolveCalendarCardRadius(-4)).toBe(0)
    expect(resolveCalendarCardRadius(99)).toBe(40)
    expect(resolveCalendarCardRadius('12')).toBe(0)
  })
})

describe('inkOn', () => {
  it('writes white on a deep marker and near-black on a pale one', () => {
    expect(inkOn('#b3261e')).toBe('#ffffff')
    expect(inkOn('#f1d48a')).toBe('#1f1a17')
    expect(inkOn('#fff')).toBe('#1f1a17')
  })

  it('falls back to white for a colour it cannot read', () => {
    expect(inkOn('var(--x)')).toBe('#ffffff')
    expect(inkOn(null)).toBe('#ffffff')
  })
})
