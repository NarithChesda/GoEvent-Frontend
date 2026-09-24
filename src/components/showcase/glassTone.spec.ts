import { describe, expect, it } from 'vitest'
import { FROST_INK_CEILING, relativeLuminance, resolveGlassTone } from './glassTone'

describe('resolveGlassTone', () => {
  it('clears the glass for gold inks, which white cannot make legible', () => {
    expect(resolveGlassTone('#dfa54b')).toBe('clear') // AM004
    expect(resolveGlassTone('#f7d676')).toBe('clear') // AM003
    expect(resolveGlassTone('#C9A45C')).toBe('clear')
  })

  it('keeps the frost for inks a white ground can carry', () => {
    expect(resolveGlassTone('#345440')).toBe('frost') // deep green
    expect(resolveGlassTone('#e84689')).toBe('frost') // TSVT001 pink
    expect(resolveGlassTone('#000')).toBe('frost')
  })

  it('reads shorthand hex', () => {
    expect(resolveGlassTone('#fff')).toBe('clear')
    expect(resolveGlassTone('#000000')).toBe('frost')
  })

  it('falls back to the frost it always drew for an ink it cannot read', () => {
    expect(resolveGlassTone(undefined)).toBe('frost')
    expect(resolveGlassTone('')).toBe('frost')
    expect(resolveGlassTone('rgb(10, 10, 10)')).toBe('frost')
    expect(resolveGlassTone('gold')).toBe('frost')
  })
})

describe('FROST_INK_CEILING', () => {
  it('is where an ink meets 3:1 against pure white', () => {
    const white = relativeLuminance([255, 255, 255])
    expect((white + 0.05) / (FROST_INK_CEILING + 0.05)).toBeCloseTo(3, 1)
  })
})
