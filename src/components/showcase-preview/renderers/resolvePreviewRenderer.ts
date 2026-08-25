import type { Component } from 'vue'
import V1PreviewFrame from './V1PreviewFrame.vue'
import type { ParentToFrameType } from '../bridge/previewBridge'

/**
 * What a frame's visibility predicate gets to look at. Structural on purpose —
 * both the tab (its own useEventShowcase instance) and future callers satisfy
 * it without importing the composable's full types.
 */
export interface PreviewFrameContext {
  event: {
    category_details?: { name?: string } | null
    category_name?: string | null
    /** The organizer's own middle-stage film — first choice for the
     *  standard-mode Event Video frame (see standardMiddleStageVideo). */
    event_video?: string | null
  }
  templateAssets: {
    standard_cover_video?: string | null
    /** Standard mode's fallback middle-stage film, when the event has no video. */
    standard_transition_video?: string | null
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
   *  sense when the stage is applicable-but-currently-unused (e.g. basic
   *  wedding with no featured photo yet) — not when the template never had
   *  this stage to begin with (e.g. non-wedding categories, V2 templates). If
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
 * V1's transition stage only exists for basic-mode wedding templates with a
 * featured photo — the same condition EventShowcaseRefactored.vue uses to
 * route guests through TransitionStage.
 */
export function isBasicWeddingShowcase(ctx: PreviewFrameContext): boolean {
  if (!ctx.templateAssets) return false
  const isBasicMode = !ctx.templateAssets.standard_cover_video
  const categoryName = (
    ctx.event.category_details?.name || ctx.event.category_name || ''
  ).toLowerCase()
  return isBasicMode && categoryName === 'wedding'
}

/**
 * "Standard mode" is CoverStage's own definition — the template ships a
 * `standard_cover_video`. Standard templates have no transition stage at all:
 * the middle beat of the guest flow is the organizer's own event video playing
 * full screen (cover → event video → background video + main content, see
 * openEnvelopeWithVideoSync in EventShowcaseRefactored.vue). Unlike the
 * transition stage this isn't wedding-only — every category on a standard
 * template gets it.
 */
export function isStandardShowcase(ctx: PreviewFrameContext): boolean {
  return !!ctx.templateAssets?.standard_cover_video
}

/**
 * What the standard flow's middle stage would actually play, resolved the same
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
      isVisible: (ctx) => isBasicWeddingShowcase(ctx) && (ctx.hasFeaturedPhoto || !!ctx.canEdit),
      isApplicable: isBasicWeddingShowcase,
      hiddenNoteKey: 'management.showcasePreview.transitionNotUsed',
    },
    {
      // Standard mode's counterpart to the transition stage. Mutually
      // exclusive with it by construction — `standard_cover_video` is exactly
      // what makes a template standard rather than basic — so the two never
      // both show, and neither shows a hidden-note for the other's templates.
      id: 'event_video',
      labelKey: 'management.showcasePreview.eventVideoLabel',
      // Nothing on this stage is inline-editable (it's one full-bleed video),
      // and staying non-editable keeps InertIframe's click shield, which is
      // what turns a click into the `replay` command below.
      editable: false,
      clickMessage: 'replay',
      isVisible: (ctx) => isStandardShowcase(ctx) && !!standardMiddleStageVideo(ctx),
      isApplicable: isStandardShowcase,
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
