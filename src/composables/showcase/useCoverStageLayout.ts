import { computed, type ComputedRef } from 'vue'
import type {
  CoverElementBox,
  CoverElementBoxes,
  CoverElementId,
  CoverStageLayout,
} from '@/services/api/types/template.types'

/**
 * Default values matching current hard-coded values in CoverContentOverlay.vue
 * These serve as fallbacks when backend doesn't provide values
 */
export const COVER_STAGE_LAYOUT_DEFAULTS: Required<CoverStageLayout> = {
  contentTopPosition: 23.5,
  innerContainerHeight: 53,
  eventTitleHeight: 18.75,
  logoHeight: 48,
  inviteTextHeight: 8.75,
  guestNameHeight: 16,
  guestNameMaxWidthPercent: 60,
  showWelcomeHeaderText: true,
  showCoverHeaderText: true,
  showHostNameUnderLogo: true,
  hostClipScale: 60,
  hostClipOffsetX: 50,
  hostClipOffsetY: 50,
  swipeArrowBottom: 5,
  leftDecorationZIndex: 24,
  rightDecorationZIndex: 24,
  topDecorationZIndex: 25,
  bottomDecorationZIndex: 25,
  showcaseAnimationType: 'decoration',
  contentWidth: 'standard',
  layoutMode: 'rows',
  coverElements: {},
}

/** Render order, which is also z-order: later blocks sit above earlier ones. */
export const COVER_ELEMENT_IDS: readonly CoverElementId[] = ['header', 'logo', 'invite', 'guest']

/** Every block resolved to a concrete box — no optional fields left. */
export type ResolvedCoverElements = Record<CoverElementId, Required<CoverElementBox>>

const round = (value: number): number => Math.round(value * 10) / 10

/**
 * The boxes the row model would produce for this layout.
 *
 * This is what makes `free` mode adoptable rather than a blank canvas: turning
 * it on seeds every block with the geometry it already had, so nothing moves
 * until the partner actually drags something. It's also the per-block fallback
 * for a `coverElements` map that only names some of the four, and the "reset
 * this block" target in the editor.
 *
 * The arithmetic mirrors `rowStyles` below exactly: the container spans
 * `contentTopPosition` → `+ innerContainerHeight` (vh), and each row takes its
 * percentage of that container, stacked from the top.
 */
export function rowsToCoverElements(layout: Required<CoverStageLayout>): ResolvedCoverElements {
  const containerHeight = layout.innerContainerHeight
  const headerVisible = layout.showCoverHeaderText

  // Same absorption rule the row model applies: a hidden header row gives its
  // height to the logo row rather than leaving a gap.
  const heights: Record<CoverElementId, number> = {
    header: (headerVisible ? layout.eventTitleHeight : 0) / 100 * containerHeight,
    logo:
      (headerVisible ? layout.logoHeight : layout.logoHeight + layout.eventTitleHeight) /
      100 *
      containerHeight,
    invite: (layout.inviteTextHeight / 100) * containerHeight,
    guest: (layout.guestNameHeight / 100) * containerHeight,
  }

  // Full-bleed rows, except the guest frame, which the row model already capped
  // at a percentage of its row.
  const widths: Record<CoverElementId, number> = {
    header: 100,
    logo: 100,
    invite: 100,
    guest: layout.guestNameMaxWidthPercent,
  }

  const boxes = {} as ResolvedCoverElements
  let cursor = layout.contentTopPosition

  for (const id of COVER_ELEMENT_IDS) {
    const height = heights[id]
    // A hidden header contributes no height and doesn't advance the stack, but
    // it still needs a usable box: the moment someone re-enables the header in
    // free mode, a zero-height block would be invisible and undraggable.
    const boxHeight = height > 0 ? height : (layout.eventTitleHeight / 100) * containerHeight
    boxes[id] = {
      x: 50,
      y: round(cursor + boxHeight / 2),
      width: widths[id],
      height: round(boxHeight),
      fontScale: 1,
    }
    cursor += height
  }

  return boxes
}

/**
 * The row-derived seed overlaid with whatever the template actually specifies.
 * Per-field, not per-block: a box that only carries `y` still gets a sane width.
 */
export function resolveCoverElements(layout: Required<CoverStageLayout>): ResolvedCoverElements {
  const seeded = rowsToCoverElements(layout)
  const overrides: CoverElementBoxes = layout.coverElements ?? {}

  for (const id of COVER_ELEMENT_IDS) {
    const override = overrides[id]
    if (!override) continue
    seeded[id] = {
      x: override.x ?? seeded[id].x,
      y: override.y ?? seeded[id].y,
      width: override.width ?? seeded[id].width,
      height: override.height ?? seeded[id].height,
      fontScale: override.fontScale ?? 1,
    }
  }

  return seeded
}

/**
 * The inline style that places one free block.
 *
 * The stored anchor is the box's centre, but this resolves it to a top-left
 * corner rather than pairing `left: x%` with `translate(-50%, -50%)`. The two
 * are arithmetically identical (a translate percentage resolves against the
 * element's own size, which is exactly `width`/`height` percent of the stage) —
 * but the cover's entrance animation keyframes set `transform` themselves, and
 * an animation with `fill-mode: forwards` would win and leave every free-placed
 * block offset by half its own size, permanently.
 */
export function coverElementStyle(box: Required<CoverElementBox>): Record<string, string> {
  return {
    left: `${round(box.x - box.width / 2)}%`,
    top: `${round(box.y - box.height / 2)}%`,
    width: `${box.width}%`,
    height: `${box.height}%`,
    // Read by the text-scaling clamps in cover-stage-styles.css / GuestNameFrame.
    '--cover-font-scale': `${box.fontScale}`,
  }
}

/**
 * Composable for managing cover stage layout configuration
 * Provides backward compatibility with legacy contentTopPosition prop
 *
 * @param layoutConfig - Computed ref to the cover_stage_layout from backend
 * @param legacyTopPosition - Optional computed ref to legacy cover_content_top_position for backward compatibility
 */
export function useCoverStageLayout(
  layoutConfig: ComputedRef<CoverStageLayout | undefined>,
  legacyTopPosition?: ComputedRef<number | undefined>
) {
  /**
   * Resolved layout with all values populated (using defaults where needed)
   */
  const layout = computed<Required<CoverStageLayout>>(() => {
    const config = layoutConfig.value || {}

    return {
      // Use new field, fallback to legacy prop, then default
      contentTopPosition:
        config.contentTopPosition ??
        legacyTopPosition?.value ??
        COVER_STAGE_LAYOUT_DEFAULTS.contentTopPosition,

      innerContainerHeight:
        config.innerContainerHeight ?? COVER_STAGE_LAYOUT_DEFAULTS.innerContainerHeight,
      eventTitleHeight: config.eventTitleHeight ?? COVER_STAGE_LAYOUT_DEFAULTS.eventTitleHeight,
      logoHeight: config.logoHeight ?? COVER_STAGE_LAYOUT_DEFAULTS.logoHeight,
      inviteTextHeight: config.inviteTextHeight ?? COVER_STAGE_LAYOUT_DEFAULTS.inviteTextHeight,
      guestNameHeight: config.guestNameHeight ?? COVER_STAGE_LAYOUT_DEFAULTS.guestNameHeight,
      guestNameMaxWidthPercent:
        config.guestNameMaxWidthPercent ?? COVER_STAGE_LAYOUT_DEFAULTS.guestNameMaxWidthPercent,
      showWelcomeHeaderText:
        config.showWelcomeHeaderText ?? COVER_STAGE_LAYOUT_DEFAULTS.showWelcomeHeaderText,
      showCoverHeaderText:
        config.showCoverHeaderText ?? COVER_STAGE_LAYOUT_DEFAULTS.showCoverHeaderText,
      showHostNameUnderLogo:
        config.showHostNameUnderLogo ?? COVER_STAGE_LAYOUT_DEFAULTS.showHostNameUnderLogo,
      hostClipScale:
        config.hostClipScale ?? COVER_STAGE_LAYOUT_DEFAULTS.hostClipScale,
      hostClipOffsetX:
        config.hostClipOffsetX ?? COVER_STAGE_LAYOUT_DEFAULTS.hostClipOffsetX,
      hostClipOffsetY:
        config.hostClipOffsetY ?? COVER_STAGE_LAYOUT_DEFAULTS.hostClipOffsetY,
      swipeArrowBottom: config.swipeArrowBottom ?? COVER_STAGE_LAYOUT_DEFAULTS.swipeArrowBottom,
      leftDecorationZIndex:
        config.leftDecorationZIndex ?? COVER_STAGE_LAYOUT_DEFAULTS.leftDecorationZIndex,
      rightDecorationZIndex:
        config.rightDecorationZIndex ?? COVER_STAGE_LAYOUT_DEFAULTS.rightDecorationZIndex,
      topDecorationZIndex:
        config.topDecorationZIndex ?? COVER_STAGE_LAYOUT_DEFAULTS.topDecorationZIndex,
      bottomDecorationZIndex:
        config.bottomDecorationZIndex ?? COVER_STAGE_LAYOUT_DEFAULTS.bottomDecorationZIndex,
      showcaseAnimationType:
        config.showcaseAnimationType ?? COVER_STAGE_LAYOUT_DEFAULTS.showcaseAnimationType,
      contentWidth: config.contentWidth ?? COVER_STAGE_LAYOUT_DEFAULTS.contentWidth,
      layoutMode: config.layoutMode ?? COVER_STAGE_LAYOUT_DEFAULTS.layoutMode,
      coverElements: config.coverElements ?? COVER_STAGE_LAYOUT_DEFAULTS.coverElements,
    }
  })

  /** `rows` unless the template explicitly opted into free placement. */
  const layoutMode = computed(() => layout.value.layoutMode)
  const isFreeLayout = computed(() => layoutMode.value === 'free')

  /**
   * Every block's box, resolved whatever the mode. Always computed — in `rows`
   * mode nothing renders from it, but the template editor still needs the
   * row-derived geometry to seed its handles from.
   */
  const elements = computed<ResolvedCoverElements>(() => resolveCoverElements(layout.value))

  /** Ready-to-bind inline styles for the free blocks, keyed the same way. */
  const elementStyles = computed<Record<CoverElementId, Record<string, string>>>(() => {
    const styles = {} as Record<CoverElementId, Record<string, string>>
    for (const id of COVER_ELEMENT_IDS) styles[id] = coverElementStyle(elements.value[id])
    return styles
  })

  /**
   * Pre-computed style for inner container positioning
   */
  const containerStyle = computed(() => ({
    top: `${layout.value.contentTopPosition}vh`,
    height: `${layout.value.innerContainerHeight}vh`,
  }))

  /**
   * Pre-computed styles for content rows.
   * When showCoverHeaderText is false, the event title row collapses and its
   * height is absorbed by the logo row so sample_logo_1 / sample_logo_2
   * occupy the combined space.
   */
  const rowStyles = computed(() => {
    const headerVisible = layout.value.showCoverHeaderText
    const eventTitleHeight = headerVisible ? layout.value.eventTitleHeight : 0
    const logoHeight = headerVisible
      ? layout.value.logoHeight
      : layout.value.logoHeight + layout.value.eventTitleHeight

    return {
      eventTitle: { height: `${eventTitleHeight}%` },
      logo: { height: `${logoHeight}%` },
      inviteText: { height: `${layout.value.inviteTextHeight}%` },
      guestName: { height: `${layout.value.guestNameHeight}%` },
    }
  })

  /**
   * Pre-computed style for swipe arrow positioning
   */
  const swipeArrowStyle = computed(() => ({
    bottom: `${layout.value.swipeArrowBottom}vh`,
  }))

  /**
   * Pre-computed z-indexes for decoration images
   */
  const decorationZIndexes = computed(() => ({
    left: layout.value.leftDecorationZIndex,
    right: layout.value.rightDecorationZIndex,
    top: layout.value.topDecorationZIndex,
    bottom: layout.value.bottomDecorationZIndex,
  }))

  return {
    layout,
    layoutMode,
    isFreeLayout,
    elements,
    elementStyles,
    containerStyle,
    rowStyles,
    swipeArrowStyle,
    decorationZIndexes,
    DEFAULTS: COVER_STAGE_LAYOUT_DEFAULTS,
  }
}
