import { computed, type ComputedRef } from 'vue'
import type { CoverStageLayout } from '@/services/api/types/template.types'

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
  swipeArrowBottom: 5,
  leftDecorationZIndex: 24,
  rightDecorationZIndex: 24,
  topDecorationZIndex: 25,
  bottomDecorationZIndex: 25,
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
      swipeArrowBottom: config.swipeArrowBottom ?? COVER_STAGE_LAYOUT_DEFAULTS.swipeArrowBottom,
      leftDecorationZIndex:
        config.leftDecorationZIndex ?? COVER_STAGE_LAYOUT_DEFAULTS.leftDecorationZIndex,
      rightDecorationZIndex:
        config.rightDecorationZIndex ?? COVER_STAGE_LAYOUT_DEFAULTS.rightDecorationZIndex,
      topDecorationZIndex:
        config.topDecorationZIndex ?? COVER_STAGE_LAYOUT_DEFAULTS.topDecorationZIndex,
      bottomDecorationZIndex:
        config.bottomDecorationZIndex ?? COVER_STAGE_LAYOUT_DEFAULTS.bottomDecorationZIndex,
    }
  })

  /**
   * Pre-computed style for inner container positioning
   */
  const containerStyle = computed(() => ({
    top: `${layout.value.contentTopPosition}vh`,
    height: `${layout.value.innerContainerHeight}vh`,
  }))

  /**
   * Pre-computed styles for content rows
   */
  const rowStyles = computed(() => ({
    eventTitle: { height: `${layout.value.eventTitleHeight}%` },
    logo: { height: `${layout.value.logoHeight}%` },
    inviteText: { height: `${layout.value.inviteTextHeight}%` },
    guestName: { height: `${layout.value.guestNameHeight}%` },
  }))

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
    containerStyle,
    rowStyles,
    swipeArrowStyle,
    decorationZIndexes,
    DEFAULTS: COVER_STAGE_LAYOUT_DEFAULTS,
  }
}
