import { computed, type ComputedRef } from 'vue'
import type {
  CoverDateFormat,
  CoverDecorationRelief,
  CoverDetailElementId,
  CoverDetailsConfig,
  CoverElementBox,
  CoverElementBoxes,
  CoverElementColorSource,
  CoverElementId,
  CoverGildingConfig,
  CoverHostArrangement,
  CoverHostSeparator,
  CoverHostSubline,
  CoverRowElementId,
  CoverStageLayout,
  CoverTextId,
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
 * The names-and-details composition as the reference card sets it: the names
 * stacked under an ampersand, the date in the accent colour, the venue in small
 * spaced capitals. Every knob starts here, so switching a block on is the whole
 * setup.
 */
export const COVER_DETAILS_DEFAULTS: Required<CoverDetailsConfig> = {
  hostCount: null,
  hostArrangement: 'stacked',
  hostSubline: 'surname',
  capitals: true,
  separator: 'ampersand',
  separatorScale: 1,
  separatorColorSource: 'accent',
  separatorCustomColor: null,
  dateFormat: 'numeric',
  showTime: true,
}

/** The most hosts a template can cap the block at. `null` still means all. */
export const COVER_HOST_COUNT_MAX = 8

export const COVER_SEPARATOR_SCALE_RANGE = { min: 0.4, max: 2.5 } as const

const COVER_HOST_SEPARATORS: readonly CoverHostSeparator[] = [
  'ampersand',
  'word',
  'heart',
  'rings',
  'knot',
  'bloom',
  'none',
]
const COVER_HOST_ARRANGEMENTS: readonly CoverHostArrangement[] = ['stacked', 'inline']
const COVER_HOST_SUBLINES: readonly CoverHostSubline[] = ['none', 'surname', 'title']
const COVER_DATE_FORMATS: readonly CoverDateFormat[] = ['numeric', 'long', 'text']
const COVER_COLOR_SOURCES: readonly CoverElementColorSource[] = [
  'primary',
  'secondary',
  'accent',
  'guestname',
  'custom',
]

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
  showCoverLogo: true,
  showCoverInviteText: true,
  showCoverGuestName: true,
  showCoverHosts: false,
  showCoverDate: false,
  showCoverLocation: false,
  coverDetails: COVER_DETAILS_DEFAULTS,
  coverText: {},
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
  stackLayout: 'pile',
  coverGilding: COVER_GILDING_DEFAULTS,
  contentWidth: 'standard',
  layoutMode: 'rows',
  coverElements: {},
  guestFrame: GUEST_FRAME_DEFAULTS,
}

/** The original stack, top to bottom — the order the row model stacks them in. */
export const COVER_ROW_ELEMENT_IDS: readonly CoverRowElementId[] = ['header', 'logo', 'invite', 'guest']

/** The names-and-details composition, top to bottom as the reference card reads. */
export const COVER_DETAIL_ELEMENT_IDS: readonly CoverDetailElementId[] = ['hosts', 'date', 'location']

/** Render order, which is also z-order: later blocks sit above earlier ones. */
export const COVER_ELEMENT_IDS: readonly CoverElementId[] = [
  ...COVER_ROW_ELEMENT_IDS,
  ...COVER_DETAIL_ELEMENT_IDS,
]

export const isCoverDetailElement = (id: CoverElementId): id is CoverDetailElementId =>
  (COVER_DETAIL_ELEMENT_IDS as readonly CoverElementId[]).includes(id)

/**
 * The blocks a partner can move in each layout mode.
 *
 * The detail blocks are placed by box in both modes — they never stacked, so
 * there is no row geometry for them to follow — while the original four only
 * leave their rows in `free` mode. The drag overlay and the editor pane both
 * read this, so neither can offer a handle the renderer would ignore.
 */
export function placeableCoverElementIds(
  mode: CoverStageLayout['layoutMode'],
): readonly CoverElementId[] {
  return mode === 'free' ? COVER_ELEMENT_IDS : COVER_DETAIL_ELEMENT_IDS
}

/**
 * Where the detail blocks sit until a partner moves them: the reference card's
 * composition — names centred a little above the middle, the date under them,
 * the venue below that — measured off the card and re-set on the 9:16 stage.
 *
 * Re-set, not copied. The card is ~5:7 and the stage 9:16, and the type here is
 * sized off the stage's WIDTH, so on the taller stage the same text is a smaller
 * share of the height — copying the card's percentages opened every gap by a
 * quarter and the three stopped reading as one group. The offsets from centre
 * are the card's, scaled by that ratio.
 *
 * It lands where the logo, invite text and guest name sit in the row model,
 * deliberately: this composition replaces those, and a cover drawn for one is
 * drawn with the space for it. The header row is left clear above the names,
 * because it is what carries a card's opening line ("You are invited to the
 * wedding of").
 */
export const COVER_DETAIL_ELEMENT_DEFAULTS: Record<CoverDetailElementId, ResolvedCoverElementBox> = {
  hosts: { x: 50, y: 46, width: 84, height: 20, fontScale: 1 },
  date: { x: 50, y: 60.5, width: 84, height: 6, fontScale: 1 },
  location: { x: 50, y: 69, width: 84, height: 10, fontScale: 1 },
}

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

/**
 * The slot each block renders in when it hasn't picked one — the fallback
 * expression of its own `--cover-block-font`. `logo` draws no text; it is here
 * only so the record is total.
 *
 * The names and the date are display type, so primary; the venue is the one
 * line of reading text in the composition, so secondary.
 */
export const COVER_ELEMENT_DEFAULT_FONT_SLOTS: Record<CoverElementId, CoverFontSlot> = {
  header: 'primary',
  logo: 'primary',
  invite: 'secondary',
  guest: 'primary',
  hosts: 'primary',
  date: 'primary',
  location: 'secondary',
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
 *
 * The detail blocks never stacked, so theirs is the reference placement
 * (`COVER_DETAIL_ELEMENT_DEFAULTS`) — which is also what "reset this block"
 * puts them back to.
 */
export function rowsToCoverElements(layout: Required<CoverStageLayout>): ResolvedCoverElements {
  const containerHeight = layout.innerContainerHeight
  const headerVisible = layout.showCoverHeaderText

  // Same absorption rule the row model applies: a hidden header row gives its
  // height to the logo row rather than leaving a gap.
  const heights: Record<CoverRowElementId, number> = {
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
  const widths: Record<CoverRowElementId, number> = {
    header: 100,
    logo: 100,
    invite: 100,
    guest: layout.guestNameMaxWidthPercent,
  }

  const boxes = {} as ResolvedCoverElements
  let cursor = layout.contentTopPosition

  for (const id of COVER_DETAIL_ELEMENT_IDS) boxes[id] = { ...COVER_DETAIL_ELEMENT_DEFAULTS[id] }

  for (const id of COVER_ROW_ELEMENT_IDS) {
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

/** Every detail field populated — what CoverDetailBlocks renders from. */
export type ResolvedCoverDetails = Required<CoverDetailsConfig>

const oneOf = <T extends string>(allowed: readonly T[], value: unknown, fallback: T): T =>
  (allowed as readonly unknown[]).includes(value) ? (value as T) : fallback

/**
 * The details config with every field filled in and checked.
 *
 * Enums are checked against their lists rather than trusted, for the reason the
 * stage modes are: this blob is written by one build and read by every later
 * one, and a value this build doesn't know must fall back to the reference card
 * rather than render as nothing. A host cap that isn't a whole number from 1 up
 * means "every host" — 0 cannot mean "show none", which is what the switch is
 * for.
 */
export function resolveCoverDetails(layout: Required<CoverStageLayout>): ResolvedCoverDetails {
  const config = layout.coverDetails ?? {}
  const d = COVER_DETAILS_DEFAULTS

  const count = config.hostCount
  const hostCount =
    typeof count === 'number' && Number.isFinite(count) && count >= 1
      ? Math.min(COVER_HOST_COUNT_MAX, Math.round(count))
      : null

  const scale = config.separatorScale
  const separatorScale =
    typeof scale === 'number' && Number.isFinite(scale)
      ? Math.min(COVER_SEPARATOR_SCALE_RANGE.max, Math.max(COVER_SEPARATOR_SCALE_RANGE.min, scale))
      : d.separatorScale

  return {
    hostCount,
    hostArrangement: oneOf(COVER_HOST_ARRANGEMENTS, config.hostArrangement, d.hostArrangement),
    hostSubline: oneOf(COVER_HOST_SUBLINES, config.hostSubline, d.hostSubline),
    capitals: config.capitals ?? d.capitals,
    separator: oneOf(COVER_HOST_SEPARATORS, config.separator, d.separator),
    separatorScale,
    separatorColorSource: oneOf(COVER_COLOR_SOURCES, config.separatorColorSource, d.separatorColorSource),
    separatorCustomColor: config.separatorCustomColor ?? d.separatorCustomColor,
    dateFormat: oneOf(COVER_DATE_FORMATS, config.dateFormat, d.dateFormat),
    showTime: config.showTime ?? d.showTime,
  }
}

// ---------------------------------------------------------------------------
// Text styles — the font slot and size of every run of text on the cover, set
// per text and applied in both layout modes (`coverText`).
// ---------------------------------------------------------------------------

/** Every styleable text, in the order the editor lists them (top of the cover down). */
export const COVER_TEXT_IDS: readonly CoverTextId[] = [
  'header',
  'invite',
  'guest',
  'hostNames',
  'hostSubline',
  'date',
  'location',
]

/** The block each text is drawn inside. */
export const COVER_TEXT_BLOCK: Record<CoverTextId, CoverElementId> = {
  header: 'header',
  invite: 'invite',
  guest: 'guest',
  hostNames: 'hosts',
  hostSubline: 'hosts',
  date: 'date',
  location: 'location',
}

/**
 * The text a block's own font variables carry — the one its box's size handle
 * (the preview toolbar's A−/A+) reaches. `logo` has none. The small line under
 * the host names is not a block's main text: it is styled on its own and read
 * by the names block directly.
 */
export const COVER_BLOCK_TEXT: Record<CoverElementId, CoverTextId | null> = {
  header: 'header',
  logo: null,
  invite: 'invite',
  guest: 'guest',
  hosts: 'hostNames',
  date: 'date',
  location: 'location',
}

/** The slot a text is set in when nothing picked one. */
export const COVER_TEXT_DEFAULT_FONT_SLOTS: Record<CoverTextId, CoverFontSlot> = {
  header: 'primary',
  invite: 'secondary',
  guest: 'primary',
  hostNames: 'primary',
  // The caption under a display name is reading type, like the venue.
  hostSubline: 'secondary',
  date: 'primary',
  location: 'secondary',
}

/** The size range the editor offers, as a multiplier. */
export const COVER_TEXT_SCALE_RANGE = { min: 0.4, max: 2.5 } as const

/** A text's type, resolved. `fontType` stays optional: unset is a real state. */
export interface ResolvedCoverTextStyle {
  fontType: CoverFontSlot | undefined
  fontScale: number
}

export type ResolvedCoverTextStyles = Record<CoverTextId, ResolvedCoverTextStyle>

const COVER_FONT_SLOTS = Object.keys(COVER_FONT_SLOT_VARS) as CoverFontSlot[]

/**
 * Every text's font slot and size.
 *
 * `coverText` wins. Where it says nothing, a block placed by its box falls back
 * to the `fontType` / `fontScale` that box carried — which is where a text's
 * type lived before this map existed, and only ever rendered for a block whose
 * box applied (every block in `free` mode, the detail blocks in both). A row
 * block in `rows` mode therefore reads nothing from its box, exactly as before:
 * a style left on it by an earlier free session never rendered, and switching
 * this map on must not make it start.
 *
 * Scales are clamped to what the editor has ever written (0.1 is the old
 * number field's floor), and a slot this build doesn't publish a variable for
 * is dropped rather than rendered as no font at all.
 */
export function resolveCoverTextStyles(layout: Required<CoverStageLayout>): ResolvedCoverTextStyles {
  const explicit = layout.coverText ?? {}
  const boxes = layout.coverElements ?? {}
  const boxApplies = new Set(placeableCoverElementIds(layout.layoutMode))
  const resolved = {} as ResolvedCoverTextStyles

  for (const id of COVER_TEXT_IDS) {
    const block = COVER_TEXT_BLOCK[id]
    const legacy =
      COVER_BLOCK_TEXT[block] === id && boxApplies.has(block) ? boxes[block] : undefined
    const style = explicit[id]

    const slot = style?.fontType ?? legacy?.fontType
    const scale = style?.fontScale ?? legacy?.fontScale
    resolved[id] = {
      fontType: slot && COVER_FONT_SLOTS.includes(slot) ? slot : undefined,
      fontScale:
        typeof scale === 'number' && Number.isFinite(scale)
          ? Math.min(COVER_TEXT_SCALE_RANGE.max, Math.max(0.1, scale))
          : 1,
    }
  }

  return resolved
}

/**
 * The variables one text's type is published under — the same two every cover
 * rule already reads, `--cover-font-scale` and `--cover-block-font`. The font is
 * only set when a slot was picked, so an unset text keeps its rule's fallback
 * (see coverElementStyle for why that matters).
 */
export function coverTextVars(style: ResolvedCoverTextStyle): Record<string, string> {
  const vars: Record<string, string> = { '--cover-font-scale': `${style.fontScale}` }
  if (style.fontType) vars['--cover-block-font'] = `var(${COVER_FONT_SLOT_VARS[style.fontType]})`
  return vars
}

/**
 * The value a palette slot's colour takes, as a CSS expression: a reference to
 * the stage-level variable (so a palette edit follows with no work here), or the
 * custom hex. The fallback is what `custom` with no hex yet draws.
 */
export function coverColorSourceValue(
  source: CoverElementColorSource,
  customColor: string | null | undefined,
  fallback: string,
): string {
  if (source === 'custom') return customColor || fallback
  return `var(${COVER_COLOR_SLOT_VARS[source]}, ${fallback})`
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
export function coverElementStyle(
  box: ResolvedCoverElementBox,
  text?: ResolvedCoverTextStyle,
): Record<string, string> {
  return {
    left: `${round(box.x - box.width / 2)}%`,
    top: `${round(box.y - box.height / 2)}%`,
    width: `${box.width}%`,
    height: `${box.height}%`,
    ...coverBlockTypeVars(box, text),
  }
}

/**
 * A block's type and colour, as the variables its rules read — everything
 * `coverElementStyle` sets except where the block sits. Split out for the one
 * reader that draws a cover block's look somewhere else: the `simple` host
 * design, when it is set to match the cover's host names.
 *
 * The type is the block's main text's resolved style when there is one (see
 * resolveCoverTextStyles), else what the box itself carries. Read by the
 * text-scaling clamps in cover-stage-styles.css / GuestNameFrame.
 *
 * The font is only set when something opted in. Leaving the variable undefined
 * is what makes "unset" mean "render exactly as before": the consumers spell
 * their old value as the var()'s fallback, so an absent variable is not a
 * missing style but the original one. Same for the colour.
 */
export function coverBlockTypeVars(
  box: ResolvedCoverElementBox,
  text?: ResolvedCoverTextStyle,
): Record<string, string> {
  const vars = coverTextVars(text ?? { fontType: box.fontType, fontScale: box.fontScale })
  if (box.colorSource === 'custom') {
    if (box.customColor) vars['--cover-block-color'] = box.customColor
  } else if (box.colorSource) {
    vars['--cover-block-color'] = `var(${COVER_COLOR_SLOT_VARS[box.colorSource]})`
  }
  return vars
}

/** The template's fonts and colours, as `coverSlotVars` needs them. */
export interface CoverSlotSources {
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  accentFont?: string
  decorativeFont?: string
  primaryColor: string
  secondaryColor?: string | null
  accentColor?: string
  guestnameColor?: string | null
}

/**
 * The template's font and colour slots, published as CSS variables for a
 * block's rules to reference by name (`COVER_FONT_SLOT_VARS`,
 * `COVER_COLOR_SLOT_VARS`).
 *
 * Every entry falls back the way the showcase itself already falls back
 * (accent → primary, decorative → accent, and so on), so a text pointed at a
 * slot this template doesn't fill renders in something sensible rather than in
 * the browser default. One table for both places that publish them — the cover
 * overlay, and the `simple` host design when it matches the cover's names — so
 * the same slot can never resolve to two different faces.
 */
export function coverSlotVars(sources: CoverSlotSources): Record<string, string> {
  const body = sources.primaryFont || sources.currentFont
  const accentFont = sources.accentFont || body
  return {
    [COVER_FONT_SLOT_VARS.primary]: body,
    [COVER_FONT_SLOT_VARS.secondary]: sources.secondaryFont || body,
    [COVER_FONT_SLOT_VARS.accent]: accentFont,
    [COVER_FONT_SLOT_VARS.decorative]: sources.decorativeFont || accentFont,
    [COVER_COLOR_SLOT_VARS.primary]: sources.primaryColor,
    [COVER_COLOR_SLOT_VARS.secondary]: sources.secondaryColor || sources.primaryColor,
    [COVER_COLOR_SLOT_VARS.accent]: sources.accentColor || sources.primaryColor,
    [COVER_COLOR_SLOT_VARS.guestname]: sources.guestnameColor || sources.primaryColor,
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
      showCoverLogo: config.showCoverLogo ?? COVER_STAGE_LAYOUT_DEFAULTS.showCoverLogo,
      showCoverInviteText:
        config.showCoverInviteText ?? COVER_STAGE_LAYOUT_DEFAULTS.showCoverInviteText,
      showCoverGuestName:
        config.showCoverGuestName ?? COVER_STAGE_LAYOUT_DEFAULTS.showCoverGuestName,
      showCoverHosts: config.showCoverHosts ?? COVER_STAGE_LAYOUT_DEFAULTS.showCoverHosts,
      showCoverDate: config.showCoverDate ?? COVER_STAGE_LAYOUT_DEFAULTS.showCoverDate,
      showCoverLocation:
        config.showCoverLocation ?? COVER_STAGE_LAYOUT_DEFAULTS.showCoverLocation,
      coverDetails: config.coverDetails ?? COVER_STAGE_LAYOUT_DEFAULTS.coverDetails,
      coverText: config.coverText ?? COVER_STAGE_LAYOUT_DEFAULTS.coverText,
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
      stackLayout: config.stackLayout ?? COVER_STAGE_LAYOUT_DEFAULTS.stackLayout,
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

  /** How the names, date and venue draw, every field populated. */
  const coverDetails = computed<ResolvedCoverDetails>(() => resolveCoverDetails(layout.value))

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
  /** Every text's font slot and size, in both layout modes. */
  const textStyles = computed<ResolvedCoverTextStyles>(() => resolveCoverTextStyles(layout.value))

  /**
   * Ready-to-bind inline styles for the free blocks, keyed the same way. The
   * type comes from the block's main text (textStyles), not its box — the two
   * agree wherever the text has no style of its own, since that is where the
   * text style falls back to the box.
   */
  const elementStyles = computed<Record<CoverElementId, Record<string, string>>>(() => {
    const styles = {} as Record<CoverElementId, Record<string, string>>
    for (const id of COVER_ELEMENT_IDS) {
      const text = COVER_BLOCK_TEXT[id]
      styles[id] = coverElementStyle(elements.value[id], text ? textStyles.value[text] : undefined)
    }
    return styles
  })

  /**
   * The font slot each block renders in: the one it picked in free placement,
   * else its default. The font itself never needs this — it reaches the block
   * by CSS variable reference (see coverElementStyle) — but a slot's metallic
   * finish is a class, and a class cannot be resolved through a variable.
   *
   * Rows mode ignores `fontType` on the four row blocks exactly as the styles
   * do: those never set `--cover-block-font`, so they render in their default
   * slot. The detail blocks are placed by box in both modes, so their pick
   * always holds.
   */
  const elementFontSlots = computed<Record<CoverElementId, CoverFontSlot>>(() => {
    const slots = { ...COVER_ELEMENT_DEFAULT_FONT_SLOTS }
    for (const id of COVER_ELEMENT_IDS) {
      const text = COVER_BLOCK_TEXT[id]
      const picked = text ? textStyles.value[text].fontType : undefined
      if (picked) slots[id] = picked
    }
    return slots
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
   *
   * showCoverLogo and showCoverInviteText deliberately change nothing here, nor
   * in rowsToCoverElements: those rows keep their height and render empty, so a
   * block switched off never moves the blocks around it.
   */
  const rowStyles = computed<
    Record<'eventTitle' | 'logo' | 'inviteText' | 'guestName', { height: string } & Record<string, string>>
  >(() => {
    const headerVisible = layout.value.showCoverHeaderText
    const eventTitleHeight = headerVisible ? layout.value.eventTitleHeight : 0
    const logoHeight = headerVisible
      ? layout.value.logoHeight
      : layout.value.logoHeight + layout.value.eventTitleHeight

    // Each row carries its text's type as well as its height: text styles apply
    // in rows mode too, and the row is the element a block's variables go on.
    const text = textStyles.value
    return {
      eventTitle: { height: `${eventTitleHeight}%`, ...coverTextVars(text.header) },
      logo: { height: `${logoHeight}%` },
      inviteText: { height: `${layout.value.inviteTextHeight}%`, ...coverTextVars(text.invite) },
      guestName: { height: `${layout.value.guestNameHeight}%`, ...coverTextVars(text.guest) },
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
    elementFontSlots,
    guestFrame,
    coverGilding,
    coverDetails,
    textStyles,
    containerStyle,
    rowStyles,
    swipeArrowStyle,
    decorationZIndexes,
    DEFAULTS: COVER_STAGE_LAYOUT_DEFAULTS,
  }
}
