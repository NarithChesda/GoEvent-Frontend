import { describe, expect, it } from 'vitest'
import { parseHex, relativeLuminance } from './glassTone'
import { wishSurface } from './wishSurface'

const contrast = (a: string, b: string) => {
  const [hi, lo] = [a, b].map((c) => relativeLuminance(parseHex(c)!)).sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Which channel dominates: a deep card must keep its ground's hue. */
const dominant = (hex: string) => {
  const [r, g, b] = parseHex(hex)!
  return r >= g && r >= b ? 'r' : g >= b ? 'g' : 'b'
}

// Palettes of real templates (primary on its declared base).
const GOLD_ON_GREEN = { ink: '#e59a24', ground: '#3b5439' }
const GOLD_ON_MAROON = { ink: '#e4bc67', ground: '#71151b' }
const GOLD_ON_NAVY = { ink: '#ecb45b', ground: '#001432' }
const MAROON_ON_WHITE = { ink: '#7d0022', ground: '#ffffff' }
const GOLD_ON_CREAM = { ink: '#d6912a', ground: '#fff4e3' }
const PINK_NO_GROUND = { ink: '#e84689', ground: null }

describe('wishSurface', () => {
  it('draws a dark-based template’s card in its own colour, deepened', () => {
    const green = wishSurface(GOLD_ON_GREEN)
    expect(green.tone).toBe('deep')
    expect(dominant(green.surface)).toBe('g')
    expect(relativeLuminance(parseHex(green.surface)!)).toBeLessThan(
      relativeLuminance(parseHex(GOLD_ON_GREEN.ground)!),
    )

    expect(wishSurface(GOLD_ON_MAROON).tone).toBe('deep')
    expect(dominant(wishSurface(GOLD_ON_MAROON).surface)).toBe('r')
    expect(wishSurface(GOLD_ON_NAVY).tone).toBe('deep')
    expect(dominant(wishSurface(GOLD_ON_NAVY).surface)).toBe('b')
  })

  /** The template's gold already reads on its own deepened ground. */
  it('keeps the primary untouched when it already reads', () => {
    expect(wishSurface(GOLD_ON_GREEN).ink).toBe('#e59a24')
    expect(wishSurface(MAROON_ON_WHITE).ink).toBe('#7d0022')
  })

  it('draws a light-based template’s card as a pale tint of the secondary', () => {
    const card = wishSurface({ ...MAROON_ON_WHITE, tint: '#c9a46b' })
    expect(card.tone).toBe('light')
    expect(relativeLuminance(parseHex(card.surface)!)).toBeGreaterThan(0.8)
    expect(card.surface).not.toBe('#fdfaf4')
  })

  /** Gold on parchment: the ink is light but the ground is too (glassTone.ts). */
  it('is light for gold on cream, and prints the gold as a darker gold', () => {
    const card = wishSurface(GOLD_ON_CREAM)
    expect(card.tone).toBe('light')
    expect(card.ink).not.toBe('#d6912a')
    expect(dominant(card.ink)).toBe('r')
  })

  it('is light when the template declares no base', () => {
    expect(wishSurface(PINK_NO_GROUND).tone).toBe('light')
  })

  /** Navy ink on a navy base: the template's text lives somewhere lighter. */
  it('is light when the ink does not read on its dark ground', () => {
    expect(wishSurface({ ink: '#1f2a44', ground: '#14203a' }).tone).toBe('light')
  })

  it('always reads at small-text contrast, text and secondary lines alike', () => {
    for (const palette of [
      GOLD_ON_GREEN,
      GOLD_ON_MAROON,
      GOLD_ON_NAVY,
      MAROON_ON_WHITE,
      GOLD_ON_CREAM,
      PINK_NO_GROUND,
      { ink: '#f3e3b5', ground: '#2f1b0d' },
      { ink: '#ffffff', ground: null },
    ]) {
      const card = wishSurface(palette)
      expect(contrast(card.ink, card.surface)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(card.muted, card.surface)).toBeGreaterThanOrEqual(4.5)
    }
  })
})
