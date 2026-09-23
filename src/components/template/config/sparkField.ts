import {
  SPARK_BLINK_SPEED_RANGE,
  SPARK_FIELD_DEFAULTS,
  SPARK_SIZE_DEFAULTS,
  resolveSparkBlinkSpeed,
} from '@/composables/showcase/useSparkField'
import type { ResolvedCoverGilding } from '@/composables/showcase/useCoverStageLayout'
import type { PartnerTemplate, SparkColorSource, SparkFieldConfig, SparkShape } from '@/services/api'

export interface SparkFieldSettings {
  count: number
  /** Blink-rate multiplier; SPARK_BLINK_SPEED_RANGE.default is the original rate. */
  blink_speed: number
  /** Mote size range as a % of the stage width. */
  min_size: number
  max_size: number
  shape: SparkShape
  color_source: SparkColorSource
  custom_color: string
  intensity: 'subtle' | 'normal' | 'bright'
}

export interface SparkFieldFormState {
  sparks_enabled: boolean
  sparks: SparkFieldSettings
  spark_custom_image: File | null
  clear_spark_custom_image: boolean
}

export const defaultSparkSettings = (): SparkFieldSettings => ({
  count: SPARK_FIELD_DEFAULTS.count,
  blink_speed: SPARK_BLINK_SPEED_RANGE.default,
  min_size: SPARK_SIZE_DEFAULTS.min,
  max_size: SPARK_SIZE_DEFAULTS.max,
  shape: 'glow',
  color_source: 'accent',
  custom_color: '#E0B269',
  intensity: 'normal',
})

export const defaultSparkField = (): SparkFieldFormState => ({
  sparks_enabled: false,
  sparks: defaultSparkSettings(),
  spark_custom_image: null,
  clear_spark_custom_image: false,
})

/**
 * A template saved before sparks were split out of the gilding has no `sparks`
 * block, so it is seeded from the legacy gilding fields instead — the same
 * fallback the renderer applies. That way opening such a template shows what it
 * actually renders, and saving it writes those values forward rather than
 * silently resetting them.
 *
 * The gilding is a parameter rather than something read back off the form,
 * which is what the old inline version did: this hydration silently depended on
 * the cover layout having been hydrated into `form` first, and nothing said so.
 * Passing it makes the ordering a signature rather than a trap.
 */
export function hydrateSparkField(
  template: PartnerTemplate | null,
  gilding: ResolvedCoverGilding,
): SparkFieldFormState {
  const state = defaultSparkField()
  const stored = template?.sparks

  if (stored) {
    state.sparks_enabled = stored.enabled ?? true
    state.sparks = {
      count: stored.count ?? SPARK_FIELD_DEFAULTS.count,
      blink_speed: resolveSparkBlinkSpeed(stored.blink_speed),
      min_size: stored.min_size ?? SPARK_SIZE_DEFAULTS.min,
      max_size: stored.max_size ?? SPARK_SIZE_DEFAULTS.max,
      shape: stored.shape ?? 'glow',
      color_source: stored.color_source ?? 'accent',
      custom_color: stored.custom_color ?? '#E0B269',
      intensity: stored.intensity ?? 'normal',
    }
    return state
  }

  if (!template) return state

  state.sparks_enabled = gilding.enabled && gilding.sparkCount > 0
  state.sparks.count = gilding.sparkCount
  state.sparks.color_source = gilding.colorSource
  state.sparks.custom_color = gilding.customColor ?? '#E0B269'
  state.sparks.intensity = gilding.intensity
  return state
}

/**
 * Min/max the right way round. The two are separate number inputs, so a partner
 * mid-edit can legitimately have them inverted for a keystroke; swapping beats
 * both rejecting the save and storing a range the renderer will discard.
 */
function normalizedSparkSizes(state: SparkFieldFormState): { min: number; max: number } {
  const a = state.sparks.min_size
  const b = state.sparks.max_size
  return a <= b ? { min: a, max: b } : { min: b, max: a }
}

/**
 * Always sends a block — including a disabled one, as `{ enabled: false }`
 * rather than `null`.
 *
 * `null` would mean "no standalone config", which the renderer reads as the
 * legacy instruction to fall back to the gilding's spark fields. For a template
 * that already has band lighting on, that would turn the sparks the partner just
 * switched off straight back on. An explicit `enabled: false` is the only way to
 * say off and be believed. The rest of the settings ride along so toggling the
 * effect back on restores what was there rather than a fresh default.
 */
export function buildSparksPayload(state: SparkFieldFormState): SparkFieldConfig {
  const size = normalizedSparkSizes(state)
  return {
    enabled: state.sparks_enabled,
    count: state.sparks.count,
    blink_speed: resolveSparkBlinkSpeed(state.sparks.blink_speed),
    min_size: size.min,
    max_size: size.max,
    shape: state.sparks.shape,
    color_source: state.sparks.color_source,
    custom_color: state.sparks.color_source === 'custom' ? state.sparks.custom_color : null,
    intensity: state.sparks.intensity,
  }
}
