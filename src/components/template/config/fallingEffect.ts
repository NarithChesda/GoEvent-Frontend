import { FALLING_SPEED_RANGE, resolveFallingSpeed } from '@/composables/showcase/useFallingParticles'
import type { FallingEffectConfig, FallingEffectType, PartnerTemplate } from '@/services/api'

export interface FallingEffectSettings {
  type: FallingEffectType
  color_source: 'primary' | 'accent' | 'custom'
  custom_color: string
  intensity: 'light' | 'normal' | 'heavy'
  /** Fall-speed multiplier; FALLING_SPEED_RANGE.default is the original speed. */
  speed: number
}

export interface FallingEffectFormState {
  falling_effect_enabled: boolean
  falling_effect: FallingEffectSettings
  falling_effect_custom_image: File | null
  clear_falling_effect_custom_image: boolean
}

export const defaultFallingEffectSettings = (): FallingEffectSettings => ({
  type: 'petals',
  color_source: 'primary',
  custom_color: '#FFD700',
  intensity: 'normal',
  speed: FALLING_SPEED_RANGE.default,
})

export const defaultFallingEffect = (): FallingEffectFormState => ({
  falling_effect_enabled: false,
  falling_effect: defaultFallingEffectSettings(),
  falling_effect_custom_image: null,
  clear_falling_effect_custom_image: false,
})

export function hydrateFallingEffect(template: PartnerTemplate | null): FallingEffectFormState {
  const state = defaultFallingEffect()
  const stored = template?.falling_effect
  if (!stored) return state

  state.falling_effect_enabled = true
  state.falling_effect = {
    type: stored.type,
    color_source: stored.color_source ?? 'primary',
    custom_color: stored.custom_color ?? '#FFD700',
    intensity: stored.intensity ?? 'normal',
    // Absent on every template saved before the field existed, which resolves
    // to the original speed — so loading one and saving it back can't silently
    // retime its effect.
    speed: resolveFallingSpeed(stored.speed),
  }
  return state
}

export function buildFallingEffectPayload(
  state: FallingEffectFormState,
): FallingEffectConfig | null {
  if (!state.falling_effect_enabled) return null
  const cfg: FallingEffectConfig = {
    type: state.falling_effect.type,
    color_source: state.falling_effect.color_source,
    intensity: state.falling_effect.intensity,
    speed: resolveFallingSpeed(state.falling_effect.speed),
  }
  if (state.falling_effect.color_source === 'custom') {
    cfg.custom_color = state.falling_effect.custom_color
  }
  return cfg
}
