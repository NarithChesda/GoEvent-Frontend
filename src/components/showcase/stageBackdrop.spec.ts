import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CONTENT_BACKDROP_STRENGTH,
  resolveContentBackdrop,
  stageBackdropLook,
  stageBackdropVars,
} from './stageBackdrop'

describe('resolveContentBackdrop', () => {
  it('reads absent, null and unknown as the legacy card, at the default strength', () => {
    for (const layout of [
      undefined,
      null,
      {},
      { contentBackdrop: null },
      { contentBackdrop: 'mirror' },
    ]) {
      expect(resolveContentBackdrop(layout as never)).toEqual({
        mode: 'card',
        strength: DEFAULT_CONTENT_BACKDROP_STRENGTH,
      })
    }
  })

  it('keeps a known mode and pulls the strength into 0–100', () => {
    expect(
      resolveContentBackdrop({ contentBackdrop: 'frost', contentBackdropStrength: 30 }),
    ).toEqual({
      mode: 'frost',
      strength: 30,
    })
    expect(
      resolveContentBackdrop({ contentBackdrop: 'blur', contentBackdropStrength: -5 }).strength,
    ).toBe(0)
    expect(
      resolveContentBackdrop({ contentBackdrop: 'blur', contentBackdropStrength: 250 }).strength,
    ).toBe(100)
    expect(
      resolveContentBackdrop({ contentBackdrop: 'blur', contentBackdropStrength: Number.NaN })
        .strength,
    ).toBe(DEFAULT_CONTENT_BACKDROP_STRENGTH)
  })
})

describe('stageBackdropLook', () => {
  const GOLD = '#dfa54b'
  const DARK_GREEN = '#345440'

  it('blur has no film and scales its radius with the strength, capped at 24px', () => {
    expect(stageBackdropLook('blur', 0, DARK_GREEN)).toMatchObject({ blurPx: 4, film: null })
    expect(stageBackdropLook('blur', 100, DARK_GREEN)).toMatchObject({ blurPx: 24, film: null })
  })

  it('frost films toward white and smoke toward black, a fifth to seven tenths', () => {
    expect(stageBackdropLook('frost', 0, DARK_GREEN).film).toEqual({ color: 'white', alpha: 0.2 })
    expect(stageBackdropLook('frost', 100, DARK_GREEN).film).toEqual({ color: 'white', alpha: 0.7 })
    expect(stageBackdropLook('smoke', 50, GOLD).film).toEqual({ color: 'black', alpha: 0.45 })
    expect(stageBackdropLook('smoke', 100, GOLD).blurPx).toBe(24)
  })

  it('edges a light ink wherever the ground is not darkened under it', () => {
    expect(stageBackdropLook('blur', 50, GOLD).inkEdge).toBe(true)
    expect(stageBackdropLook('frost', 50, GOLD).inkEdge).toBe(true)
    expect(stageBackdropLook('smoke', 50, GOLD).inkEdge).toBe(false)
    expect(stageBackdropLook('blur', 50, DARK_GREEN).inkEdge).toBe(false)
  })
})

describe('stageBackdropVars', () => {
  it('writes the film, and a stronger one for engines without a backdrop filter', () => {
    expect(stageBackdropVars(stageBackdropLook('smoke', 50, '#dfa54b'))).toEqual({
      '--sb-blur': '16px',
      '--sb-saturate': '1.25',
      '--sb-film': 'rgba(10, 10, 14, 0.45)',
      '--sb-film-fallback': 'rgba(10, 10, 14, 0.75)',
    })
  })

  it('gives blur a clear film on screen and a light one as its fallback', () => {
    const vars = stageBackdropVars(stageBackdropLook('blur', 50, '#345440'))
    expect(vars['--sb-film']).toBe('rgba(255, 255, 255, 0)')
    expect(vars['--sb-film-fallback']).toBe('rgba(255, 255, 255, 0.3)')
  })
})
