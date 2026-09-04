import type {
  StageMode,
  StageModesConfig,
  TransitionStageMode,
} from '@/services/api/types/template.types'

export type { StageMode, StageModesConfig, TransitionStageMode }

/**
 * The three modes, with every "unset" resolved. What the showcase actually
 * renders from — nothing downstream of `resolveStageModes` sees an absent key.
 */
export interface ResolvedStageModes {
  cover: StageMode
  transition: TransitionStageMode
  background: StageMode
}

/** Only the assets the fallback inference reads. */
export interface StageModeAssets {
  standard_cover_video?: string | null
  standard_background_video?: string | null
}

export interface StageModesInput {
  /** The template's explicit declaration. Each key may be absent. */
  stageModes?: StageModesConfig | null
  /** The template's asset bag — the flat `template_assets.assets` object. */
  assets?: StageModeAssets | null
}

/**
 * What the showcase renders when a template says nothing.
 *
 * The point of `stage_modes` is that a template *declares* how each of its three
 * stages presents itself. Until every template carries the field, "says nothing"
 * has to keep meaning something, and the closest honest guess is the uploaded
 * files: a template that shipped a cover film meant its cover to be a film.
 *
 * - **cover**: `standard_cover_video` present → `video`, else `animation`.
 * - **transition**: follows the cover. A template built around film played one
 *   in the middle too; a template built from artwork ran the Save the Date card.
 *   The inference never yields `none` — that is a declaration only, so a
 *   template that says nothing keeps whichever middle beat it already had.
 * - **background**: a `standard_background_video` means `video`, and so does a
 *   video cover — VideoContainer used to hide every artwork backdrop layer
 *   whenever `standard_cover_video` was set, leaving the showcase wrapper's own
 *   colour behind the invitation. `video` with no video file reproduces that
 *   exactly, which is why this mode deliberately does not fall back to the
 *   artwork ladder.
 *
 * The transition and background rules read the **resolved** cover mode, not the
 * raw asset, so a template that declares only `cover` gets the middle beat and
 * backdrop that go with the cover it asked for rather than the ones its leftover
 * files imply.
 *
 * `transition: 'none'` is the one value with no asset behind it: the cover
 * hands straight over to the invitation, whatever the event's photographs say.
 * It is why "does this design have a middle beat?" is now a question the
 * template answers rather than one the event's featured photo answers by
 * accident — see TransitionStageMode.
 *
 * Nothing here reads the event's category. The animated middle beat used to be
 * hard-limited to weddings, which is exactly the coupling this config exists to
 * remove: what a stage renders is the template's decision, and a category is not
 * a design.
 */
export function resolveStageModes(input: StageModesInput): ResolvedStageModes {
  const declared = input.stageModes
  const assets = input.assets

  const cover: StageMode =
    declared?.cover ?? (assets?.standard_cover_video ? 'video' : 'animation')

  const transition: TransitionStageMode = declared?.transition ?? cover

  const background: StageMode =
    declared?.background ??
    (assets?.standard_background_video || cover === 'video' ? 'video' : 'animation')

  return { cover, transition, background }
}

/**
 * The shape `resolveStageModesForEvent` needs off an event. Structural on
 * purpose, so the live showcase, the preview frames and the preview tab can all
 * satisfy it from whatever they already hold without importing each other's
 * types.
 */
export interface StageModesEvent {
  template_assets?: {
    stage_modes?: StageModesConfig | null
    assets?: StageModeAssets | null
  } | null
}

/** `resolveStageModes` for callers holding a whole event. */
export function resolveStageModesForEvent(
  event: StageModesEvent | null | undefined,
): ResolvedStageModes {
  return resolveStageModes({
    stageModes: event?.template_assets?.stage_modes,
    assets: event?.template_assets?.assets,
  })
}
