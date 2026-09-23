import type { StackLayoutType } from '@/services/api/types/template.types'

/**
 * Where each photograph sits in each photo-stack layout, as data — so the
 * shapes can be tested, and the layout components only have to draw them.
 * Every table is indexed by how many photographs the event actually has, since
 * a layout has to hold together with fewer than it was designed for.
 */

// --- Pile --------------------------------------------------------------------

/**
 * One print's placement. `x`/`y` are percentages of the print's OWN width and
 * height (they feed `translate()`, whose percentages resolve against the element
 * itself), so a pose holds its shape at any stage size. `r` is degrees.
 */
export interface PrintPose {
  x: number
  y: number
  r: number
}

/**
 * Resting on the pile. Irregular on purpose — a pile of prints squared off by a
 * machine reads as a UI list — but tight enough that each new print covers the
 * one below almost entirely, which is what makes it a montage rather than a
 * collage. A shorter stack takes the LAST n, so whichever print ends on top
 * lies nearly square and centred: it is the one the pull-back starts from.
 */
const PILE_POSES: readonly PrintPose[] = [
  { x: -2.5, y: 1.5, r: -5 },
  { x: 3, y: -1, r: 4 },
  { x: -1.5, y: -2, r: -2.5 },
  { x: 2, y: 1.5, r: 3.5 },
  { x: 0, y: 0, r: -1 },
]

/**
 * The spread the pile opens into once the camera pulls back, per print count,
 * with the camera's final scale. Every print has to show its photograph's upper
 * half — where faces sit in almost every event photo — so the later prints (on
 * top) take the centre and the lower edges, and the earlier ones the corners.
 * `scale` shrinks as the spread widens so the whole table stays inside the
 * frame with room for the Save the Date beneath it.
 */
const PILE_SPREADS: Readonly<Record<number, { poses: readonly PrintPose[]; scale: number }>> = {
  1: { poses: [{ x: 0, y: 0, r: -1.5 }], scale: 0.8 },
  2: {
    poses: [
      { x: -36, y: -6, r: -5 },
      { x: 36, y: 8, r: 4 },
    ],
    scale: 0.66,
  },
  3: {
    poses: [
      { x: -50, y: -24, r: -6 },
      { x: 52, y: -20, r: 5 },
      { x: 0, y: 34, r: -1.5 },
    ],
    scale: 0.6,
  },
  4: {
    poses: [
      { x: -47, y: -34, r: -6 },
      { x: 49, y: -32, r: 5 },
      { x: -45, y: 34, r: 4 },
      { x: 47, y: 36, r: -4 },
    ],
    scale: 0.56,
  },
  5: {
    poses: [
      { x: -62, y: -34, r: -7 },
      { x: 62, y: -36, r: 6 },
      { x: -58, y: 36, r: 5 },
      { x: 60, y: 34, r: -6 },
      { x: 0, y: 1, r: -1.5 },
    ],
    scale: 0.56,
  },
}

export const PILE_CAPACITY = PILE_POSES.length

export interface PileLayout {
  /** Each print's resting place on the pile, first to last. */
  pile: PrintPose[]
  /** Where each print starts its drop from: up toward the camera and swung out. */
  drop: PrintPose[]
  /** Each print's place once the pile has spread. */
  spread: PrintPose[]
  /** The camera's scale once it has pulled back. */
  spreadScale: number
}

const clampCount = (count: number, max: number) => Math.max(1, Math.min(max, Math.floor(count)))

/**
 * Every pose the pile needs for `count` prints.
 *
 * The drop alternates sides, so consecutive prints swing in from opposite
 * hands. It is a small displacement rather than a flight across the frame: the
 * CSS pairs it with a 1.14 scale, so the print reads as falling toward the
 * table from above the camera rather than sliding in from off screen.
 */
export function pileLayout(count: number): PileLayout {
  const n = clampCount(count, PILE_CAPACITY)
  const pile = PILE_POSES.slice(-n).map((pose) => ({ ...pose }))
  const drop = pile.map((rest, k) => {
    const side = k % 2 === 0 ? -1 : 1
    return { x: rest.x + side * 8, y: rest.y - 7, r: rest.r + side * 7 }
  })
  const spread = PILE_SPREADS[n]
  return { pile, drop, spread: spread.poses.map((pose) => ({ ...pose })), spreadScale: spread.scale }
}

// --- Split -------------------------------------------------------------------

/**
 * One panel of the split layout: a box in percentages of the STAGE, cut on a
 * slant by a `clip-path` polygon in percentages of the box, and faded into the
 * band the Save the Date is written in.
 *
 * `from` is the same polygon collapsed onto the panel's outer edge, with the
 * points in the same order — clip-path interpolates point by point, so that is
 * what makes the reveal a wipe toward the seam rather than a morph.
 */
export interface SplitPanel {
  left: number
  top: number
  width: number
  height: number
  clip: string
  from: string
  /** Which way the panel fades into the band: its foot (`down`) or its head (`up`). */
  fade: 'down' | 'up'
}

export interface SplitLayout {
  panels: SplitPanel[]
  /** Where the band — and the copy in it — is centred, as a % of stage height. */
  bandY: number
}

/**
 * The seams lean the same way in both halves — top right to bottom left — like
 * a printed card cut by one hand, with a ~2% gutter showing the table between.
 * The halves are offset: the top-left panel starts below the stage edge and the
 * bottom-right one stops short of it, which is what keeps four rectangles from
 * reading as a grid.
 */
const TL: SplitPanel = {
  left: 0,
  top: 5,
  width: 54,
  height: 44,
  clip: 'polygon(0% 0%, 100% 0%, 89% 100%, 0% 100%)',
  from: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
  fade: 'down',
}
const TR: SplitPanel = {
  left: 50,
  top: 0,
  width: 50,
  height: 47,
  clip: 'polygon(13% 0%, 100% 0%, 100% 100%, 0% 100%)',
  from: 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)',
  fade: 'down',
}
const BL: SplitPanel = {
  left: 0,
  top: 53,
  width: 53,
  height: 47,
  clip: 'polygon(0% 0%, 100% 0%, 88% 100%, 0% 100%)',
  from: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
  fade: 'up',
}
const BR: SplitPanel = {
  left: 49.5,
  top: 51,
  width: 50.5,
  height: 44,
  clip: 'polygon(12% 0%, 100% 0%, 100% 100%, 0% 100%)',
  from: 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)',
  fade: 'up',
}
const FULL = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
const TOP_FULL: SplitPanel = {
  left: 0,
  top: 0,
  width: 100,
  height: 49,
  clip: FULL,
  from: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
  fade: 'down',
}
const BOTTOM_FULL: SplitPanel = {
  left: 0,
  top: 53,
  width: 100,
  height: 47,
  clip: FULL,
  from: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
  fade: 'up',
}

const SPLIT_LAYOUTS: Readonly<Record<number, SplitLayout>> = {
  1: { panels: [{ ...TOP_FULL, height: 62 }], bandY: 72 },
  2: { panels: [TOP_FULL, BOTTOM_FULL], bandY: 51 },
  3: { panels: [TL, TR, BOTTOM_FULL], bandY: 51 },
  4: { panels: [TL, TR, BL, BR], bandY: 51 },
}

export const SPLIT_CAPACITY = 4

export function splitLayout(count: number): SplitLayout {
  const layout = SPLIT_LAYOUTS[clampCount(count, SPLIT_CAPACITY)]
  return { panels: layout.panels.map((panel) => ({ ...panel })), bandY: layout.bandY }
}

// --- Mosaic ------------------------------------------------------------------

/** One tile: which column (or the full width), and its span as % of the height. */
export interface MosaicTile {
  column: 'left' | 'right' | 'full'
  top: number
  height: number
}

type Column = readonly (readonly [top: number, height: number])[]

/**
 * Two staggered columns: no row boundary lines up across the gutter, which is
 * what makes it a mosaic rather than a grid. Tiles are listed column by column
 * and dealt in zigzag reading order (left, right, left, …), so the photographs
 * surface alternately either side of the centre rather than filling one column
 * and then the other.
 */
const MOSAIC_COLUMNS: Readonly<Record<number, { left: Column; right: Column }>> = {
  2: { left: [[0, 100]], right: [[0, 100]] },
  3: { left: [[0, 100]], right: [[0, 48], [48, 52]] },
  4: { left: [[0, 42], [42, 58]], right: [[0, 58], [58, 42]] },
  5: { left: [[0, 42], [42, 58]], right: [[0, 30], [30, 34], [64, 36]] },
  6: { left: [[0, 27], [27, 43], [70, 30]], right: [[0, 33], [33, 33], [66, 34]] },
}

export const MOSAIC_CAPACITY = 6

export function mosaicTiles(count: number): MosaicTile[] {
  const n = clampCount(count, MOSAIC_CAPACITY)
  if (n === 1) return [{ column: 'full', top: 0, height: 100 }]
  const { left, right } = MOSAIC_COLUMNS[n]
  const tiles: MosaicTile[] = []
  for (let row = 0; row < Math.max(left.length, right.length); row++) {
    if (left[row]) tiles.push({ column: 'left', top: left[row][0], height: left[row][1] })
    if (right[row]) tiles.push({ column: 'right', top: right[row][0], height: right[row][1] })
  }
  return tiles
}

// --- Film strip / photo booth -------------------------------------------------

export const FILM_CAPACITY = 4
export const BOOTH_CAPACITY = 3

/**
 * The film strip's height in stage widths for `count` frames: a 4.5% leader top
 * and bottom, 0.255w-tall 4:3 frames, 3% between them. The strip and the copy
 * under it are centred as one block, so the layout needs this number in CSS.
 */
export const filmStripHeight = (count: number): number => {
  const n = clampCount(count, FILM_CAPACITY)
  return 0.09 + n * 0.255 + (n - 1) * 0.03
}

// --- Frame shapes ------------------------------------------------------------

/**
 * The phone every frame is measured on — the same 390×844 the framing editor
 * and the preview frame use. On it `--sk-w` is the full 390 (56.25vh would be
 * 475), so a stage width is a stage width.
 */
const STAGE_W = 390
const STAGE_H = 844

/** The print's window, the booth's frames and the film's frames — fixed. */
const FIXED_FRAME_ASPECT = { pile: 4 / 5, booth: 3 / 2, film: 4 / 3 } as const

/** The mosaic's gutter: `--mo-gap`, 0.022 of the stage width. */
const MOSAIC_GAP = 0.022 * STAGE_W

/**
 * A mosaic tile's inside, where its photograph is. The card fills the stage;
 * the grid is inset half a gutter, and every tile gives up half a gutter on
 * each side (see StackMosaic.vue).
 */
const mosaicTileAspect = (tile: MosaicTile): number => {
  const gridW = STAGE_W - MOSAIC_GAP
  const gridH = STAGE_H - MOSAIC_GAP
  const width = gridW * (tile.column === 'full' ? 1 : 0.5) - MOSAIC_GAP
  const height = gridH * (tile.height / 100) - MOSAIC_GAP
  return width / height
}

/**
 * The shape (width ÷ height) of the frame the `index`th of `count` photographs
 * lands in, in a layout. The framing editor frames each photograph in exactly
 * this, so what the organizer sees is what the stack draws.
 *
 * A split panel is measured as its box: the slant takes a sliver off one
 * corner, which is not a shape anyone can frame for. Two layouts change a
 * photograph's frame with the count (a sixth photograph re-cuts every mosaic
 * column), which is fine — a region shows in full in any frame, so the next
 * photograph only changes how much is shown around it.
 */
export function stackFrameAspect(
  layout: StackLayoutType,
  count: number,
  index: number,
): number {
  if (layout === 'split') {
    const panels = splitLayout(count).panels
    const panel = panels[Math.min(Math.max(0, index), panels.length - 1)]
    return (panel.width * STAGE_W) / (panel.height * STAGE_H)
  }
  if (layout === 'mosaic') {
    const tiles = mosaicTiles(count)
    return mosaicTileAspect(tiles[Math.min(Math.max(0, index), tiles.length - 1)])
  }
  return FIXED_FRAME_ASPECT[layout]
}
