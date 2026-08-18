import { describe, it, expect } from 'vitest'
import {
  SPARK_BLINK_SPEED_RANGE,
  SPARK_FIELD_DEFAULTS,
  SPARK_MAX_COUNT,
  SPARK_SIZE_DEFAULTS,
  resolveSparkBlinkSpeed,
  resolveSparkField,
  sparkFieldKeyOf,
} from './useSparkField'
import type { CoverGildingConfig } from '@/services/api/types/template.types'

/**
 * The legacy path is the one that matters most here: before sparks were split
 * out of the cover gilding, a template's motes were drawn whenever the gilding
 * was enabled and took their count/tint from it. Every already-published
 * template is in that state, so these cases pin down "renders exactly as it did
 * before" as much as they test the resolver.
 */
describe('resolveSparkField — legacy gilding fallback', () => {
  const gilding: CoverGildingConfig = {
    enabled: true,
    sparkCount: 24,
    colorSource: 'secondary',
    customColor: '#ABCDEF',
    intensity: 'bright',
  }

  it('takes enabled, count, tint and intensity from the gilding', () => {
    const field = resolveSparkField(null, gilding)
    expect(field.enabled).toBe(true)
    expect(field.count).toBe(24)
    expect(field.colorSource).toBe('secondary')
    expect(field.customColor).toBe('#ABCDEF')
    expect(field.intensity).toBe('bright')
  })

  it('keeps the original look for the settings the gilding never had', () => {
    const field = resolveSparkField(undefined, gilding)
    expect(field.shape).toBe('glow')
    expect(field.customImage).toBeNull()
    expect(field.blinkSpeed).toBe(SPARK_BLINK_SPEED_RANGE.default)
    expect(field.minSize).toBe(SPARK_SIZE_DEFAULTS.min)
    expect(field.maxSize).toBe(SPARK_SIZE_DEFAULTS.max)
  })

  it('stays off when the gilding is off', () => {
    expect(resolveSparkField(null, { ...gilding, enabled: false }).enabled).toBe(false)
    expect(resolveSparkField(null, null).enabled).toBe(false)
    expect(resolveSparkField(null, undefined).enabled).toBe(false)
  })

  it('falls back to the default count when the gilding names none', () => {
    const field = resolveSparkField(null, { enabled: true })
    expect(field.count).toBe(SPARK_FIELD_DEFAULTS.count)
  })
})

describe('resolveSparkField — standalone config', () => {
  it('governs alone, so sparks can run without the gilding', () => {
    const field = resolveSparkField({ enabled: true, count: 30 }, { enabled: false })
    expect(field.enabled).toBe(true)
    expect(field.count).toBe(30)
  })

  it('can switch sparks off while the gilding stays lit', () => {
    const field = resolveSparkField({ enabled: false }, { enabled: true, sparkCount: 18 })
    expect(field.enabled).toBe(false)
  })

  it('defaults to enabled when the block exists but says nothing', () => {
    expect(resolveSparkField({}, null).enabled).toBe(true)
  })

  it('clamps the count to the ceiling and floor', () => {
    expect(resolveSparkField({ count: 500 }, null).count).toBe(SPARK_MAX_COUNT)
    expect(resolveSparkField({ count: -5 }, null).count).toBe(0)
  })

  it('carries every customisation through', () => {
    const field = resolveSparkField(
      {
        count: 12,
        blink_speed: 2.5,
        min_size: 1,
        max_size: 3,
        shape: 'star',
        custom_image: '/media/spark.png',
        color_source: 'custom',
        custom_color: '#FF00AA',
        intensity: 'subtle',
      },
      null,
    )
    expect(field).toMatchObject({
      enabled: true,
      count: 12,
      blinkSpeed: 2.5,
      minSize: 1,
      maxSize: 3,
      shape: 'star',
      customImage: '/media/spark.png',
      colorSource: 'custom',
      customColor: '#FF00AA',
      intensity: 'subtle',
    })
  })

  it('rejects an inverted size range rather than rendering nothing', () => {
    const field = resolveSparkField({ min_size: 4, max_size: 1 }, null)
    expect(field.minSize).toBe(SPARK_SIZE_DEFAULTS.min)
    expect(field.maxSize).toBe(SPARK_SIZE_DEFAULTS.max)
  })

  it('accepts a range whose ends are equal — every mote one size', () => {
    const field = resolveSparkField({ min_size: 2, max_size: 2 }, null)
    expect(field.minSize).toBe(2)
    expect(field.maxSize).toBe(2)
  })
})

describe('resolveSparkBlinkSpeed', () => {
  it('defaults when absent or not a finite number', () => {
    for (const value of [undefined, null, NaN, Infinity]) {
      expect(resolveSparkBlinkSpeed(value as number | null | undefined)).toBe(
        SPARK_BLINK_SPEED_RANGE.default,
      )
    }
  })

  it('clamps to the range', () => {
    expect(resolveSparkBlinkSpeed(99)).toBe(SPARK_BLINK_SPEED_RANGE.max)
    expect(resolveSparkBlinkSpeed(0)).toBe(SPARK_BLINK_SPEED_RANGE.min)
  })
})

describe('sparkFieldKeyOf', () => {
  it('changes when a custom image is swapped', () => {
    const a = sparkFieldKeyOf({ custom_image: '/a.png' })
    const b = sparkFieldKeyOf({ custom_image: '/b.png' })
    expect(a).not.toBe(b)
  })

  it('is stable across a palette-only change, which the field handles live', () => {
    const a = sparkFieldKeyOf({ count: 10, color_source: 'accent' })
    const b = sparkFieldKeyOf({ count: 10, color_source: 'primary' })
    expect(a).toBe(b)
  })

  it('marks a legacy template distinctly from a configured one', () => {
    expect(sparkFieldKeyOf(null)).toBe('legacy')
    expect(sparkFieldKeyOf({})).not.toBe('legacy')
  })
})
