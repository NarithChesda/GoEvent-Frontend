import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PAPER_RADIUS,
  inkOnPaper,
  MARKER_FALLBACK,
  PAPER_DARK,
  PAPER_LIGHT,
  PAPER_SHADOW,
  paperOnInk,
  resolveMarkerColor,
  stationeryPaper,
} from './stationery'

const colors = { primary: '#4a2336', secondary: '#8a6a55', accent: '#b8893a' }

describe('resolveMarkerColor', () => {
  it('spends the slot the template chose', () => {
    expect(resolveMarkerColor({ ...colors, source: 'accent' })).toBe('#b8893a')
    expect(resolveMarkerColor({ ...colors, source: 'primary' })).toBe('#4a2336')
    expect(resolveMarkerColor({ ...colors, source: 'secondary' })).toBe('#8a6a55')
    expect(resolveMarkerColor({ ...colors, source: 'custom', custom: '#123456' })).toBe('#123456')
  })

  it('is the accent when nothing was chosen, and never nothing', () => {
    expect(resolveMarkerColor({ ...colors })).toBe('#b8893a')
    expect(resolveMarkerColor({ source: 'custom' })).toBe(MARKER_FALLBACK)
    expect(resolveMarkerColor({ primary: '#222222', source: 'secondary' })).toBe('#222222')
  })
})

describe('stationeryPaper', () => {
  /** The partner chose that card's stock and corner: every paper object follows it. */
  it('is the calendar card itself when the date is drawn as one', () => {
    const paper = stationeryPaper({
      tone: '#f6ede3',
      calendarCard: { color: '#FDF2F4', radius: 14 },
    })
    expect(paper).toMatchObject({ paper: '#fdf2f4', radius: 14, tone: 'light' })
    expect(paper.shadow).toBe(PAPER_SHADOW.light)
  })

  it('takes the deeper lift for a dark card stock', () => {
    const paper = stationeryPaper({ calendarCard: { color: '#2b1c24', radius: 6 } })
    expect(paper.tone).toBe('dark')
    expect(paper.shadow).toBe(PAPER_SHADOW.dark)
  })

  it('is the shared warm white, leaning toward the tone, for every other date design', () => {
    const paper = stationeryPaper({ tone: '#3b1f2b' })
    expect(paper.paper).not.toBe(PAPER_LIGHT)
    expect(paper.radius).toBe(DEFAULT_PAPER_RADIUS)
    expect(stationeryPaper({ tone: 'rgb(1, 2, 3)' }).paper).toBe(PAPER_LIGHT)
  })
})

describe('inkOnPaper', () => {
  it('keeps the template ink while it reads on the paper', () => {
    expect(inkOnPaper('#3b1f2b', '#fdfaf4')).toBe('#3b1f2b')
  })

  /** Gold on white measures about 2:1 — not text at the form's sizes. */
  it('prints a pale ink on light paper in deep brown-black', () => {
    expect(inkOnPaper('#dfa54b', '#ffffff')).toBe(PAPER_DARK)
  })

  it('prints a dark ink on the partner’s dark card in warm white', () => {
    expect(inkOnPaper('#4a2336', '#2b1c24')).toBe(PAPER_LIGHT)
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
