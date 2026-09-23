import { resolveStageModes } from '@/composables/showcase/useStageModes'
import type {
  PartnerTemplate,
  StageMode,
  StageModesConfig,
  TransitionStageMode,
} from '@/services/api'

/**
 * Which shape each of the three stages takes: built from artwork, or a film.
 *
 * Deliberately free of the package plan. The plan prices the template; it does
 * not decide how the template renders, so every option is offered on every plan
 * and a basic template can put a film on its middle stage.
 */
export interface StageModesFormState {
  stage_mode_cover: StageMode
  stage_mode_transition: TransitionStageMode
  stage_mode_background: StageMode
}

export const defaultStageModes = (): StageModesFormState => ({
  stage_mode_cover: 'animation',
  stage_mode_transition: 'animation',
  stage_mode_background: 'animation',
})

/**
 * Anything this template hasn't declared is seeded from the same fallback the
 * showcase resolves it with, so the pickers open on what the template already
 * renders rather than on a guess — and each key is independent, so a template
 * may have declared only its middle beat.
 */
export function hydrateStageModes(template: PartnerTemplate | null): StageModesFormState {
  if (!template) return defaultStageModes()
  const inferred = resolveStageModes({ assets: template })
  return {
    stage_mode_cover: template.stage_modes?.cover ?? inferred.cover,
    stage_mode_transition: template.stage_modes?.transition ?? inferred.transition,
    stage_mode_background: template.stage_modes?.background ?? inferred.background,
  }
}

/**
 * All three stages, always. There is no "leave it to the system" option — the
 * pickers were seeded from what the template already renders, so persisting
 * every one of them states the current behaviour rather than changing it, and
 * from then on the template says what it is instead of being read out of its
 * uploaded files.
 */
export const buildStageModesPayload = (state: StageModesFormState): StageModesConfig => ({
  cover: state.stage_mode_cover,
  transition: state.stage_mode_transition,
  background: state.stage_mode_background,
})
