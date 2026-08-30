import type { Component } from 'vue'
import V1PreviewFrame from './V1PreviewFrame.vue'
import type { ParentToFrameType } from '../bridge/previewBridge'
import {
  resolveStageModes,
  type ResolvedStageModes,
  type StageModesConfig,
} from '@/composables/showcase/useStageModes'

/**
 * What a frame's visibility predicate gets to look at. Structural on purpose —
 * both the tab (its own useEventShowcase instance) and future callers satisfy
 * it without importing the composable's full types.
 */
export interface PreviewFrameContext {
  event: {
    /** The organizer's own middle-stage film — first choice for the Event
     *  Video frame (see standardMiddleStageVideo). */
    event_video?: string | null
  }
  templateAssets: {
    standard_cover_video?: string | null
    /** Standard mode's fallback middle-stage film, when the event has no video. */
    standard_transition_video?: string | null
    standard_background_video?: string | null
    /** The template's per-stage modes. Absent = the legacy inference. */
    stage_modes?: StageModesConfig | null
  } | null
  hasFeaturedPhoto: boolean
  /** Whether the viewing user can edit the event. Lets frames that are
   *  otherwise hidden on an "unused" state (e.g. transition with no featured
   *  photo yet) stay visible in edit mode so that state can be fixed from
   *  the preview itself. */
  canEdit?: boolean
}

export interface PreviewFrameDescriptor {
  /** Becomes the frame route's ?stage= param; renderer-defined vocabulary. */
  id: string
  /** i18n key for the label above the frame. */
  labelKey: string
  /** Whether this frame supports edit mode (?editable=1 when the user can edit). */
  editable: boolean
  /** Bridge command posted into the frame when its inert shield is clicked. */
  clickMessage?: ParentToFrameType
  /** Frames that only apply to some events (e.g. V1's transition stage). */
  isVisible?: (ctx: PreviewFrameContext) => boolean
  /** i18n key for the note shown in place of a hidden frame. */
  hiddenNoteKey?: string
  /** Whether this frame conceptually applies to the template at all,
   *  independent of transient state (featured photo, edit mode) that
   *  `isVisible` also factors in. Gates `hiddenNoteKey`: the note only makes
   *  sense when the stage is applicable-but-currently-unused (e.g. an
   *  animated middle beat with no featured photo yet) — not when the template
   *  never had this stage to begin with (e.g. a filmed beat, V2 templates). If
   *  omitted, defaults to `isVisible`'s own applicability (no separate gate). */
  isApplicable?: (ctx: PreviewFrameContext) => boolean
}

export interface PreviewRendererDescriptor {
  id: string
  frames: PreviewFrameDescriptor[]
  /** Renders ONE frame inside the iframe route, given the forced stage id. */
  FrameComponent: Component
}

/**
 * The frame list's view of the guest flow: the same three stage modes the live
 * showcase renders from, resolved from the same function so a frame can never
 * disagree with the stage it is previewing.
 *
 * A template with no `stage_modes` still resolves through the asset
 * fallback, so the frames it showed before this existed are the frames it
 * shows now.
 */
export function previewStageModes(ctx: PreviewFrameContext): ResolvedStageModes {
  return resolveStageModes({
    stageModes: ctx.templateAssets?.stage_modes,
    assets: ctx.templateAssets,
  })
}

/**
 * The middle beat is the Save the Date card over the featured photograph. Was
 * `isBasicWeddingShowcase` — the stage used to be reachable only by a template
 * with no cover film, on a wedding event.
 */
export function hasAnimatedTransition(ctx: PreviewFrameContext): boolean {
  if (!ctx.templateAssets) return false
  return previewStageModes(ctx).transition === 'animation'
}

/**
 * The middle beat is a film playing full screen — the organizer's own
 * `event_video`, or the template's `standard_transition_video` (see
 * standardMiddleStageVideo). Was `isStandardShowcase`, which asked whether a
 * `standard_cover_video` had been uploaded; that made the beat an accident of
 * the cover rather than a choice, and tied it to a package plan.
 */
export function hasVideoTransition(ctx: PreviewFrameContext): boolean {
  if (!ctx.templateAssets) return false
  return previewStageModes(ctx).transition === 'video'
}

/**
 * What a filmed middle stage would actually play, resolved the same
 * way the showcase resolves it (see eventVideoUrl in useEventShowcase.ts): the
 * organizer's own upload first, then the template's own transition film. Either
 * one is enough for the stage to exist — a template that ships a transition
 * gives every one of its events that beat, whether or not they film anything.
 */
export function standardMiddleStageVideo(ctx: PreviewFrameContext): string | null {
  return ctx.event.event_video || ctx.templateAssets?.standard_transition_video || null
}

const V1_RENDERER: PreviewRendererDescriptor = {
  id: 'v1',
  FrameComponent: V1PreviewFrame,
  frames: [
    {
      id: 'cover',
      labelKey: 'management.showcasePreview.coverLabel',
      editable: true,
    },
    {
      id: 'transition',
      labelKey: 'management.showcasePreview.transitionLabel',
      // Editable so the featured-photo affordance can post edit intents even
      // though the stage itself has no inline-text/EditableRegion fields.
      editable: true,
      clickMessage: 'replay',
      // Stays visible in edit mode even without a featured photo yet, so one
      // can be set from here instead of the frame just disappearing.
      isVisible: (ctx) => hasAnimatedTransition(ctx) && (ctx.hasFeaturedPhoto || !!ctx.canEdit),
      isApplicable: hasAnimatedTransition,
      hiddenNoteKey: 'management.showcasePreview.transitionNotUsed',
    },
    {
      // The other shape the middle beat can take. Mutually exclusive with
      // the transition frame by construction — one `transition` mode, two
      // values — so the two never both show, and neither shows a hidden-note
      // for the other's templates.
      id: 'event_video',
      labelKey: 'management.showcasePreview.eventVideoLabel',
      // Nothing on this stage is inline-editable (it's one full-bleed video),
      // and staying non-editable keeps InertIframe's click shield, which is
      // what turns a click into the `replay` command below.
      editable: false,
      clickMessage: 'replay',
      isVisible: (ctx) => hasVideoTransition(ctx) && !!standardMiddleStageVideo(ctx),
      isApplicable: hasVideoTransition,
      hiddenNoteKey: 'management.showcasePreview.eventVideoNotSet',
    },
    {
      id: 'main',
      labelKey: 'management.showcasePreview.mainContentLabel',
      editable: true,
    },
  ],
}

/**
 * The registry. One entry per showcase rendering model — V1's
 * cover/transition/main today; a V2 scroll-story renderer will register its
 * own frame list here once the V2 preview approach lands. Mirrors how
 * resolveV2Variant picks category variants on the public V2 showcase. When
 * the backend template-version field ships, this must resolve from the same
 * shared version logic as the public showcase route so both flip together
 * (see docs/backend-api-requirements/showcase-template-version.md).
 */
export function resolvePreviewRenderer(ctx: PreviewFrameContext): PreviewRendererDescriptor {
  void ctx // v1-only until the V2 preview renderer registers here
  return V1_RENDERER
}
