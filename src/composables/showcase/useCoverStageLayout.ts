import { computed, type ComputedRef } from 'vue'
import type {
  CoverDecorationRelief,
  CoverElementBox,
  CoverElementBoxes,
  CoverElementColorSource,
  CoverElementId,
  CoverGildingConfig,
  CoverStageLayout,
  GuestFrameConfig,
  GuestFrameCornerId,
  GuestFrameCorners,
  CoverFontSlot,
} from '@/services/api/types/template.types'

/** Corner positions in render order (also their DOM order). */
export const GUEST_FRAME_CORNER_IDS: readonly GuestFrameCornerId[] = [
  'topLeft',
  'topRight',
  'bottomLeft',
  'bottomRight',
]

/**
 * A closed four-corner frame built from two side-oriented uploads.
 *
 * Partners draw corner art already oriented for its side, so the top row uses
 * both images unflipped and the bottom row is the same pair mirrored vertically.
 * That gives a complete frame the moment two files are attached, and a partner
 * who uploads only one can point every corner at it by flipping.
 */
export const GUEST_FRAME_CORNER_DEFAULTS: Required<GuestFrameCorners> = {
  topLeft: { source: 'left' },
  topRight: { source: 'right' },
  bottomLeft: { source: 'left', flipY: true },
  bottomRight: { source: 'right', flipY: true },
}

export const GUEST_FRAME_DEFAULTS: Required<GuestFrameConfig> = {
  style: 'split',
  scale: 1,
  corners: GUEST_FRAME_CORNER_DEFAULTS,
  cornerSize: 28,
  cornerInset: 0,
}

/**
 * Cover gilding off, but with every knob already carrying the reference
 * artwork's own value — so enabling it is a single boolean rather than a setup
 * exercise. The band edges are that artwork's 24px/74px on its 1080-wide plate.
 */
export const COVER_GILDING_DEFAULTS: Required<CoverGildingConfig> = {
  enabled: false,
  bandOuter: 2.2,
  bandInner: 6.9,
  intensity: 'normal',
  decorationRelief: 'soft',
  cornerFlares: true,
  sparkCount: 18,
  colorSource: 'accent',
  customColor: null,
}

/**
 * Hard ceiling on the LEGACY gilding spark count.
 *
 * Sparks are configured standalone now (`template_assets.sparks`, see
 * useSparkField) and carry their own SPARK_MAX_COUNT. This one only still
 * governs the value templates saved before that split, which the renderer reads
 * as its fallback — so it stays at the number those templates were authored
 * against rather than tracking the new ceiling.
 */
export const COVER_GILDING_MAX_SPARKS = 40

/**
 * The `filter` value that lifts a cover decoration off the plate behind it, per
 * relief level. Two `drop-shadow` passes, in the order the reference artwork
 * stacks them: a zero-blur offset that reads as the ornament's own thickness,
 * then a far blurred one that reads as height above the surface.
 *
 * Offsets are fractions of the STAGE WIDTH, not fixed pixels, for the reason
 * every other showcase measurement is: the stage is `min(100vw, 56.25vh)`, so a
 * px value tuned on a desktop-sized stage lands roughly twice as heavy on a
 * phone. Written out rather than read from a custom property so the value is
 * self-contained — it lands on images inside two different components, neither
 * of which would otherwise need the stage width. The source pixel on the
 * reference's 1080-wide plate is in each comment.
 *
 * The shadow falls straight down rather than down-and-right. The band's own
 * bevel puts the light 22 degrees off vertical (its 158deg gradient), which is
 * near enough to overhead that a horizontal offset would read as an error
 * against artwork whose left and right pieces are usually mirror images.
 */
const STAGE_W = 'min(100vw, 56.25vh)'

/**
 * The custom property the resolved relief filter is published under, on the
 * cover overlay's root — the nearest ancestor shared by the two components that
 * render decoration artwork (CoverDecorations and DoorPanel).
 */
export const COVER_DECORATION_RELIEF_VAR = '--cover-decoration-relief'

export const COVER_DECORATION_RELIEF_FILTERS: Record<CoverDecorationRelief, string> = {
  none: 'none',
  // Half the reference's weight, and warm-grey rather than near-black: `soft` is
  // the level that has to survive being laid over a pale cover as well as a dark
  // one, where the full stack turns into a bruise under every ornament.
  soft:
    `drop-shadow(0 calc(${STAGE_W} * 0.0028) 0 rgba(74, 52, 26, 0.42))` + // 3px
    ` drop-shadow(0 calc(${STAGE_W} * 0.0056) calc(${STAGE_W} * 0.0158) rgba(0, 0, 0, 0.38))`, // 6px / 17px
  // The reference's own values.
  raised:
    `drop-shadow(0 calc(${STAGE_W} * 0.0028) 0 rgba(74, 32, 8, 0.5))` + // 3px
    ` drop-shadow(0 calc(${STAGE_W} * 0.0093) calc(${STAGE_W} * 0.0278) rgba(0, 0, 0, 0.72))`, // 10px / 30px
}

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
  coverGilding: COVER_GILDING_DEFAULTS,
  contentWidth: 'standard',
  layoutMode: 'rows',
  coverElements: {},
  guestFrame: GUEST_FRAME_DEFAULTS,
}

/** Render order, which is also z-order: later blocks sit above earlier ones. */
export const COVER_ELEMENT_IDS: readonly CoverElementId[] = ['header', 'logo', 'invite', 'guest']

/**
 * One block with its GEOMETRY fully resolved.
 *
 * The type slots stay optional on purpose. Geometry always has an answer — the
 * row model supplies one for every block — but "which font slot" and "which
 * palette colour" have a meaningful *unset* state: keep rendering whatever this
 * block rendered before free placement existed. Seeding them with today's
 * effective values instead would look identical at first and then quietly
 * diverge, because the guest name's font is not simply "primary" (an English
 * name overrides it to Great Vibes) and the invite colour carries its own
 * fallback chain. Leaving them undefined keeps those rules where they live.
 */
export type ResolvedCoverElementBox = Required<
  Pick<CoverElementBox, 'x' | 'y' | 'width' | 'height' | 'fontScale'>
> &
  Pick<CoverElementBox, 'fontType' | 'colorSource' | 'customColor'>

/** Every block resolved, keyed by id. */
export type ResolvedCoverElements = Record<CoverElementId, ResolvedCoverElementBox>

/** The template's palette slots resolved to real hex values. */
export type CoverTextPalette = Partial<
  Record<Exclude<CoverElementColorSource, 'custom'>, string | null>
>

/**
 * The stage-level CSS variables every font/colour slot is published under.
 *
 * A block's own `--cover-block-font` / `--cover-block-color` is set to a
 * `var()` REFERENCE into these rather than to a resolved value, which is what
 * keeps the whole feature free of prop threading: the four font families and
 * four palette entries are declared once on the cover overlay's root (the only
 * place that has all of them), and the blocks — three component layers down,
 * behind DoorPanel — pick them up by inheritance. It also means a language
 * switch re-resolves the font with no work here at all: the variable's value
 * changes, every block that references it follows.
 */
export const COVER_FONT_SLOT_VARS: Record<CoverFontSlot, string> = {
  primary: '--tpl-font-primary',
  secondary: '--tpl-font-secondary',
  accent: '--tpl-font-accent',
  decorative: '--tpl-font-decorative',
}

export const COVER_COLOR_SLOT_VARS: Record<
  Exclude<CoverElementColorSource, 'custom'>,
  string
> = {
  primary: '--tpl-color-primary',
  secondary: '--tpl-color-secondary',
  accent: '--tpl-color-accent',
  guestname: '--tpl-color-guestname',
}

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
      // Passed through rather than defaulted: undefined is the real answer for
      // a block that hasn't picked a slot, and the renderer keys its "leave
      // this exactly as it was" branch off that.
      fontType: override.fontType,
      colorSource: override.colorSource,
      customColor: override.customColor,
    }
  }

  return seeded
}

/** Every guest-frame field populated — what the frame components render from. */
export type ResolvedGuestFrame = Required<Omit<GuestFrameConfig, 'corners'>> & {
  corners: Required<GuestFrameCorners>
}

/**
 * The guest frame config with every field filled in.
 *
 * Resolved per-field and per-corner rather than "config or defaults", for the
 * same reason `resolveCoverElements` is: a template that names only the style
 * still needs sane corner sources, and one that overrides a single corner must
 * keep the default frame around it instead of blanking the other three.
 */
export function resolveGuestFrame(layout: Required<CoverStageLayout>): ResolvedGuestFrame {
  const config = layout.guestFrame ?? {}
  const corners = {} as Required<GuestFrameCorners>

  for (const id of GUEST_FRAME_CORNER_IDS) {
    const override = config.corners?.[id]
    const fallback = GUEST_FRAME_CORNER_DEFAULTS[id]
    corners[id] = {
      source: override?.source ?? fallback.source,
      flipX: override?.flipX ?? fallback.flipX ?? false,
      flipY: override?.flipY ?? fallback.flipY ?? false,
    }
  }

  return {
    style: config.style ?? GUEST_FRAME_DEFAULTS.style,
    scale: config.scale ?? GUEST_FRAME_DEFAULTS.scale,
    cornerSize: config.cornerSize ?? GUEST_FRAME_DEFAULTS.cornerSize,
    cornerInset: config.cornerInset ?? GUEST_FRAME_DEFAULTS.cornerInset,
    corners,
  }
}

/** Every gilding field populated — what CoverGilding.vue renders from. */
export type ResolvedCoverGilding = Required<CoverGildingConfig>

/**
 * The gilding config with every field filled in, and the two geometry fields
 * sanity-checked against each other.
 *
 * The band is an annulus, so `bandInner` larger than `bandOuter` isn't a
 * stylistic choice, it's an inverted ring — the clip path would light the
 * artwork's middle and leave its border flat, which is the opposite of the
 * effect. A pair that doesn't describe a ring falls back to the default pair
 * rather than rendering the inversion.
 */
export function resolveCoverGilding(layout: Required<CoverStageLayout>): ResolvedCoverGilding {
  const config = layout.coverGilding ?? {}

  const outer = config.bandOuter ?? COVER_GILDING_DEFAULTS.bandOuter
  const inner = config.bandInner ?? COVER_GILDING_DEFAULTS.bandInner
  const validBand = Number.isFinite(outer) && Number.isFinite(inner) && inner > outer && outer >= 0

  return {
    enabled: config.enabled ?? COVER_GILDING_DEFAULTS.enabled,
    bandOuter: validBand ? outer : COVER_GILDING_DEFAULTS.bandOuter,
    bandInner: validBand ? inner : COVER_GILDING_DEFAULTS.bandInner,
    intensity: config.intensity ?? COVER_GILDING_DEFAULTS.intensity,
    decorationRelief: config.decorationRelief ?? COVER_GILDING_DEFAULTS.decorationRelief,
    cornerFlares: config.cornerFlares ?? COVER_GILDING_DEFAULTS.cornerFlares,
    sparkCount: clampSparkCount(config.sparkCount),
    colorSource: config.colorSource ?? COVER_GILDING_DEFAULTS.colorSource,
    customColor: config.customColor ?? COVER_GILDING_DEFAULTS.customColor,
  }
}

function clampSparkCount(value: number | undefined): number {
  if (value == null || !Number.isFinite(value)) return COVER_GILDING_DEFAULTS.sparkCount
  return Math.max(0, Math.min(COVER_GILDING_MAX_SPARKS, Math.round(value)))
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
export function coverElementStyle(box: ResolvedCoverElementBox): Record<string, string> {
  const style: Record<string, string> = {
    left: `${round(box.x - box.width / 2)}%`,
    top: `${round(box.y - box.height / 2)}%`,
    width: `${box.width}%`,
    height: `${box.height}%`,
    // Read by the text-scaling clamps in cover-stage-styles.css / GuestNameFrame.
    '--cover-font-scale': `${box.fontScale}`,
  }

  // Only set when the block actually opted in. Leaving the variable undefined
  // is what makes "unset" mean "render exactly as before": the consumers spell
  // their old value as the var()'s fallback, so an absent variable is not a
  // missing style but the original one.
  if (box.fontType) {
    style['--cover-block-font'] = `var(${COVER_FONT_SLOT_VARS[box.fontType]})`
  }
  if (box.colorSource === 'custom') {
    if (box.customColor) style['--cover-block-color'] = box.customColor
  } else if (box.colorSource) {
    style['--cover-block-color'] = `var(${COVER_COLOR_SLOT_VARS[box.colorSource]})`
  }

  return style
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
      coverGilding: config.coverGilding ?? COVER_STAGE_LAYOUT_DEFAULTS.coverGilding,
      contentWidth: config.contentWidth ?? COVER_STAGE_LAYOUT_DEFAULTS.contentWidth,
      layoutMode: config.layoutMode ?? COVER_STAGE_LAYOUT_DEFAULTS.layoutMode,
      coverElements: config.coverElements ?? COVER_STAGE_LAYOUT_DEFAULTS.coverElements,
      guestFrame: config.guestFrame ?? COVER_STAGE_LAYOUT_DEFAULTS.guestFrame,
    }
  })

  /** The guest name's frame artwork config, every field populated. */
  const guestFrame = computed<ResolvedGuestFrame>(() => resolveGuestFrame(layout.value))

  /** The cover's printed-gold lighting, every field populated. */
  const coverGilding = computed<ResolvedCoverGilding>(() => resolveCoverGilding(layout.value))

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
    guestFrame,
    coverGilding,
    containerStyle,
    rowStyles,
    swipeArrowStyle,
    decorationZIndexes,
    DEFAULTS: COVER_STAGE_LAYOUT_DEFAULTS,
  }
}
