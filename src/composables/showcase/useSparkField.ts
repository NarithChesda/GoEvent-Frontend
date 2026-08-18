import type {
  CoverGildingConfig,
  SparkColorSource,
  SparkFieldConfig,
  SparkShape,
} from '@/services/api/types/template.types'

/**
 * The drifting, blinking spark field — resolution, bounds and shape geometry.
 *
 * Sparks used to be a fifth layer of `CoverGildingConfig`, which meant they only
 * existed when the cover's band lighting was switched on. That was never right:
 * the field is mounted by CoverStage for the life of the showcase and drifts on
 * through the transition into the main content, exactly like the falling
 * particles beside it, so it is a decoration in its own right. This module is
 * the standalone home the effect gets in exchange — the same role
 * `useFallingParticles` plays for petals.
 *
 * Everything here is pure: the field itself is CSS-animated (see
 * CoverSparks.vue), so unlike the falling particles there is no imperative
 * spawn loop to own.
 */

/**
 * Bounds for `blink_speed`, the pulse-rate multiplier.
 *
 * `default: 1` is the 12-second cycle the field shipped with, so a template that
 * never sets the field renders exactly as before. The floor is where the pulse
 * stops reading as a blink and becomes a slow fade; the ceiling is where it
 * starts to strobe, which no invitation should do and a slider shouldn't offer.
 */
export const SPARK_BLINK_SPEED_RANGE = { min: 0.25, max: 4, default: 1, step: 0.05 } as const

/**
 * Bounds for `min_size` / `max_size`, as a % of the stage width.
 *
 * The defaults are the reference artwork's 5px–21px on its 1080-wide plate,
 * which is what the field has always drawn. Percent-of-stage rather than px for
 * the reason every other showcase measurement is: the stage is
 * `min(100vw, 56.25vh)`, so a px size tuned on a desktop lands twice as heavy on
 * a phone.
 */
export const SPARK_SIZE_RANGE = { min: 0.1, max: 8, step: 0.02 } as const
export const SPARK_SIZE_DEFAULTS = { min: 0.46, max: 1.94 } as const

/** Hard ceiling on motes — past this the field reads as noise and costs frames. */
export const SPARK_MAX_COUNT = 60

/** Every spark field setting populated — what CoverSparks.vue renders from. */
export interface ResolvedSparkField {
  enabled: boolean
  count: number
  blinkSpeed: number
  minSize: number
  maxSize: number
  shape: SparkShape
  customImage: string | null
  colorSource: SparkColorSource
  customColor: string | null
  intensity: 'subtle' | 'normal' | 'bright'
}

export const SPARK_FIELD_DEFAULTS: ResolvedSparkField = {
  enabled: false,
  count: 18,
  blinkSpeed: SPARK_BLINK_SPEED_RANGE.default,
  minSize: SPARK_SIZE_DEFAULTS.min,
  maxSize: SPARK_SIZE_DEFAULTS.max,
  shape: 'glow',
  customImage: null,
  colorSource: 'accent',
  customColor: null,
  intensity: 'normal',
}

/**
 * Built-in mote geometry, as an SVG path on a 24×24 box.
 *
 * `glow` is deliberately absent: it is the original blurred radial gradient with
 * no edge to trace, so the renderer draws it as a background rather than as a
 * path. Everything here is a shape with real geometry, for covers that want a
 * sharper glint than a blur can give.
 */
export const SPARK_SHAPE_PATHS: Record<Exclude<SparkShape, 'glow'>, string> = {
  // Four-pointed sparkle with concave sides — the classic "twinkle".
  sparkle: 'M12 0C12 6.6 5.4 12 0 12c6.6 0 12 5.4 12 12 0-6.6 5.4-12 12-12-6.6 0-12-5.4-12-12z',
  // Five-pointed star.
  star: 'M12 0l3.7 7.5L24 8.7l-6 5.8 1.4 8.5L12 18.8 4.6 23l1.4-8.5-6-5.8 8.3-1.2z',
  diamond: 'M12 0l6 12-6 12-6-12z',
  // Thin four-armed cross — a lens-flare glint rather than a star.
  cross: 'M11 0h2v9.6l9.6-.6v2l-9.6-.6V24h-2v-13.6l-9.6.6v-2l9.6.6z',
  dot: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
}

/** Clamp a value into a range, falling back when it isn't a finite number. */
function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

/** Clamp an author-supplied blink speed; absent/junk → default. */
export function resolveSparkBlinkSpeed(speed: number | null | undefined): number {
  return clampNumber(
    speed,
    SPARK_BLINK_SPEED_RANGE.min,
    SPARK_BLINK_SPEED_RANGE.max,
    SPARK_BLINK_SPEED_RANGE.default,
  )
}

/**
 * The spark field config with every field populated, resolved from the standalone
 * `sparks` config and falling back to the legacy gilding fields.
 *
 * The fallback is what keeps every already-saved template rendering exactly as
 * it does today: before the split, sparks were drawn when `coverGilding.enabled`
 * was true and took their count and tint from that object. A template with no
 * `sparks` block still gets precisely that. The moment a template writes a
 * `sparks` block it governs alone — including `enabled`, so a template can now
 * run sparks with no band lighting, and band lighting with no sparks.
 *
 * @param sparks  the standalone config, or null/undefined for legacy templates
 * @param gilding the cover gilding config, read only for the legacy fallback
 */
export function resolveSparkField(
  sparks: SparkFieldConfig | null | undefined,
  gilding?: CoverGildingConfig | null,
): ResolvedSparkField {
  // Legacy path: no standalone config, so the gilding's fields still drive it.
  if (!sparks) {
    return {
      ...SPARK_FIELD_DEFAULTS,
      enabled: gilding?.enabled ?? false,
      count: clampNumber(
        gilding?.sparkCount,
        0,
        SPARK_MAX_COUNT,
        SPARK_FIELD_DEFAULTS.count,
      ),
      colorSource: gilding?.colorSource ?? SPARK_FIELD_DEFAULTS.colorSource,
      customColor: gilding?.customColor ?? null,
      intensity: gilding?.intensity ?? SPARK_FIELD_DEFAULTS.intensity,
    }
  }

  // A pair that doesn't describe a range isn't a stylistic choice, it's
  // inverted — fall back to the default pair rather than rendering nothing.
  const minSize = clampNumber(
    sparks.min_size,
    SPARK_SIZE_RANGE.min,
    SPARK_SIZE_RANGE.max,
    SPARK_SIZE_DEFAULTS.min,
  )
  const maxSize = clampNumber(
    sparks.max_size,
    SPARK_SIZE_RANGE.min,
    SPARK_SIZE_RANGE.max,
    SPARK_SIZE_DEFAULTS.max,
  )
  const validRange = maxSize >= minSize

  return {
    enabled: sparks.enabled ?? true,
    count: clampNumber(sparks.count, 0, SPARK_MAX_COUNT, SPARK_FIELD_DEFAULTS.count),
    blinkSpeed: resolveSparkBlinkSpeed(sparks.blink_speed),
    minSize: validRange ? minSize : SPARK_SIZE_DEFAULTS.min,
    maxSize: validRange ? maxSize : SPARK_SIZE_DEFAULTS.max,
    shape: sparks.shape ?? SPARK_FIELD_DEFAULTS.shape,
    customImage: sparks.custom_image ?? null,
    colorSource: sparks.color_source ?? SPARK_FIELD_DEFAULTS.colorSource,
    customColor: sparks.custom_color ?? null,
    intensity: sparks.intensity ?? SPARK_FIELD_DEFAULTS.intensity,
  }
}

/**
 * Remount key for a `<CoverSparks>` instance.
 *
 * The field derives its per-mote geometry from a deterministic hash seeded off
 * the index, so a config change does reach it reactively — but the CUSTOM IMAGE
 * is the exception: swapping the `<img>` src mid-blink leaves motes mid-cycle
 * showing the old asset until each one recycles. Keying the component on the
 * whole config makes the field rebuild cleanly.
 *
 * Inert on the public showcase (a guest's template can't change mid-session) and
 * load-bearing in the partner template studio, where editing the effect and
 * watching it is the entire point. Mirrors `fallingEffectKeyOf`.
 */
export function sparkFieldKeyOf(config: SparkFieldConfig | null | undefined): string {
  if (!config) return 'legacy'
  return [
    config.enabled ?? '',
    config.count ?? '',
    config.blink_speed ?? '',
    config.min_size ?? '',
    config.max_size ?? '',
    config.shape ?? '',
    config.custom_image ?? '',
    config.intensity ?? '',
  ].join('|')
}
