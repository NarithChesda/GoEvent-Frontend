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
  }
  templateAssets: { standard_cover_video?: string | null } | null
  hasFeaturedPhoto: boolean
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
      editable: false,
      clickMessage: 'replay',
      isVisible: (ctx) => isBasicWeddingShowcase(ctx) && ctx.hasFeaturedPhoto,
      hiddenNoteKey: 'management.showcasePreview.transitionNotUsed',
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
