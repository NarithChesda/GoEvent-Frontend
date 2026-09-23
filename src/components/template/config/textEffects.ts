import {
  DEFAULT_TEXT_EFFECT_ANIMATION,
  DEFAULT_TEXT_EFFECT_METAL,
  TEXT_EFFECT_SLOTS,
  resolveTextEffect,
} from '@/composables/showcase/useTextEffects'
import type {
  PartnerTemplate,
  TextEffectAnimation,
  TextEffectFinish,
  TextEffectMetal,
  TextEffectSlot,
  TextEffectsConfig,
} from '@/services/api'

/** A slot's finish as the form holds it: `none` is a slot with no finish. */
export type TextEffectFinishChoice = TextEffectFinish | 'none'

export interface TextEffectFormState {
  finish: TextEffectFinishChoice
  metal: TextEffectMetal
  animation: TextEffectAnimation
}

export interface TextEffectsFormState {
  /** Metallic lettering per V1 font slot. Every slot is always present here. */
  text_effects: Record<TextEffectSlot, TextEffectFormState>
}

export const defaultTextEffectMap = (): Record<TextEffectSlot, TextEffectFormState> =>
  Object.fromEntries(
    TEXT_EFFECT_SLOTS.map((slot) => [
      slot,
      { finish: 'none', metal: DEFAULT_TEXT_EFFECT_METAL, animation: DEFAULT_TEXT_EFFECT_ANIMATION },
    ]),
  ) as Record<TextEffectSlot, TextEffectFormState>

export const defaultTextEffects = (): TextEffectsFormState => ({
  text_effects: defaultTextEffectMap(),
})

/**
 * Resolved through the showcase's own resolver, so an unknown stored value
 * opens as exactly what guests see: no finish, or gold.
 */
export function hydrateTextEffects(template: PartnerTemplate | null): TextEffectsFormState {
  const map = defaultTextEffectMap()
  for (const slot of TEXT_EFFECT_SLOTS) {
    const effect = resolveTextEffect(template?.text_effects?.[slot])
    if (effect) map[slot] = { ...effect }
  }
  return { text_effects: map }
}

/**
 * Only the slots that carry a finish, or `null` when none does — the same value
 * a template saved before this field existed has, so turning every finish off
 * returns the template to exactly that state rather than to a map of nulls.
 */
export function buildTextEffectsPayload(state: TextEffectsFormState): TextEffectsConfig | null {
  const config: TextEffectsConfig = {}
  for (const slot of TEXT_EFFECT_SLOTS) {
    const { finish, metal, animation } = state.text_effects[slot]
    if (finish !== 'none') config[slot] = { finish, metal, animation }
  }
  return Object.keys(config).length ? config : null
}
