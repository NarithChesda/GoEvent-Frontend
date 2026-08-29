import { describe, it, expect } from 'vitest'
import {
  resolveFontMetrics,
  isIdentityFontMetrics,
  fontMetricDescriptorCss,
  fontMetricDescriptorDict,
  fontMetricSignature,
  DEFAULT_SIZE_ADJUST,
  FONT_SIZE_ADJUST_RANGE,
  FONT_SIZE_SCALE_RANGE,
  FONT_METRIC_OVERRIDE_RANGE,
} from './fontMetrics'

describe('resolveFontMetrics', () => {
  it('is the identity when the font carries no calibration', () => {
    const metrics = resolveFontMetrics(null, undefined)
    expect(metrics.sizeAdjust).toBe(DEFAULT_SIZE_ADJUST)
    expect(isIdentityFontMetrics(metrics)).toBe(true)
  })

  // The load-bearing guarantee: a template saved before these fields existed, or
  // one whose backend dropped them, must render byte-identically to before.
  it('emits nothing for an uncalibrated font', () => {
    expect(fontMetricDescriptorCss(resolveFontMetrics(null, null))).toBe('')
    expect(fontMetricDescriptorDict(resolveFontMetrics(null, null))).toEqual({})
  })

  it('multiplies the library normalization by the template scale', () => {
    expect(resolveFontMetrics({ size_adjust: 0.9 }, 1.1).sizeAdjust).toBeCloseTo(0.99, 10)
  })

  // DRF hands DecimalFields back as strings; reading them as numbers is not
  // optional, and getting it wrong would silently collapse the font to 0.
  it('accepts decimals sent as strings', () => {
    expect(resolveFontMetrics({ size_adjust: '0.88' }, '1.25').sizeAdjust).toBeCloseTo(1.1, 10)
  })

  it('treats an unparseable value as unset rather than as zero', () => {
    expect(resolveFontMetrics({ size_adjust: 'not-a-number' }, null).sizeAdjust).toBe(1)
    expect(resolveFontMetrics({ size_adjust: null }, '').sizeAdjust).toBe(1)
  })

  it('clamps the product, so two in-range factors cannot combine into nonsense', () => {
    const huge = resolveFontMetrics({ size_adjust: 99 }, 99)
    expect(huge.sizeAdjust).toBe(FONT_SIZE_ADJUST_RANGE.max * FONT_SIZE_SCALE_RANGE.max)

    const tiny = resolveFontMetrics({ size_adjust: 0.001 }, 0.001)
    expect(tiny.sizeAdjust).toBe(FONT_SIZE_ADJUST_RANGE.min * FONT_SIZE_SCALE_RANGE.min)
  })

  it('clamps the vertical overrides independently', () => {
    const metrics = resolveFontMetrics({ ascent_override: 9, descent_override: -1 }, 1)
    expect(metrics.ascentOverride).toBe(FONT_METRIC_OVERRIDE_RANGE.max)
    expect(metrics.descentOverride).toBe(FONT_METRIC_OVERRIDE_RANGE.min)
  })

  it('leaves an unset vertical override null so the font keeps its own metrics', () => {
    const metrics = resolveFontMetrics({ size_adjust: 1.2 }, 1)
    expect(metrics.ascentOverride).toBeNull()
    expect(metrics.descentOverride).toBeNull()
    expect(metrics.lineGapOverride).toBeNull()
  })
})

describe('descriptor emission', () => {
  it('writes fractions as CSS percentages', () => {
    const css = fontMetricDescriptorCss(
      resolveFontMetrics({ size_adjust: 0.88, ascent_override: 1.05 }, 1),
    )
    expect(css).toContain('size-adjust: 88%;')
    expect(css).toContain('ascent-override: 105%;')
  })

  it('omits size-adjust when the product lands exactly on 1', () => {
    const css = fontMetricDescriptorCss(resolveFontMetrics({ size_adjust: 1 }, 1))
    expect(css).not.toContain('size-adjust')
  })

  // The CSS rule and the FontFace object register under one family name, so a
  // descriptor present in only one of them would leave two differently-sized
  // faces competing for that name.
  it('gives the CSS and FontFace forms the same values', () => {
    const metrics = resolveFontMetrics(
      { size_adjust: 0.9, ascent_override: 1.1, descent_override: 0.3, line_gap_override: 0 },
      1,
    )
    const dict = fontMetricDescriptorDict(metrics)
    const css = fontMetricDescriptorCss(metrics)

    expect(dict).toEqual({
      sizeAdjust: '90%',
      ascentOverride: '110%',
      descentOverride: '30%',
      lineGapOverride: '0%',
    })
    for (const value of Object.values(dict)) expect(css).toContain(value)
  })
})

describe('fontMetricSignature', () => {
  // Family and URL are both unchanged while a partner drags the size slider, so
  // without the signature in the cache key the preview would freeze at the first
  // size tried.
  it('distinguishes two scales of the same face', () => {
    const a = fontMetricSignature(resolveFontMetrics({ size_adjust: 1 }, 1))
    const b = fontMetricSignature(resolveFontMetrics({ size_adjust: 1 }, 1.1))
    expect(a).not.toBe(b)
  })

  it('is stable for equivalent inputs, so an unchanged font still hits cache', () => {
    const a = fontMetricSignature(resolveFontMetrics({ size_adjust: '0.9' }, '1.1'))
    const b = fontMetricSignature(resolveFontMetrics({ size_adjust: 0.9 }, 1.1))
    expect(a).toBe(b)
  })
})
