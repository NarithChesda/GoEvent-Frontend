/**
 * The geometry of the gallery designs, as plain numbers.
 *
 * Kept out of the components for the reason photo-stack/geometry.ts is: every
 * pose here is a decision someone will want to tune, and a tuning is easier to
 * reason about (and to test) as a table than as arithmetic scattered through
 * template bindings. Nothing here touches the DOM.
 */

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

// ---------------------------------------------------------------------------
// reel
// ---------------------------------------------------------------------------

/** Every reel card is this shape (width / height): a portrait print. Most
 *  event photographs are taken on a phone held upright. */
export const REEL_CARD_ASPECT = 4 / 5

export interface ReelMetrics {
  cardWidth: number
  cardHeight: number
  gap: number
  /** One card plus the gap after it: the distance between neighbouring cards. */
  pitch: number
  /** Radius of the cylinder the cards are laid on. See `reelPose`. */
  radius: number
}

/**
 * Sized from the reel's own width. The card takes a little over half of it, so
 * the photograph in the middle is big enough to look at and its neighbours
 * show a third of themselves either side — the cue that there is more, and
 * which way it goes, before anything has moved.
 */
export function reelMetrics(reelWidth: number): ReelMetrics {
  const cardWidth = clamp(reelWidth * 0.54, 132, 300)
  const gap = Math.round(clamp(reelWidth * 0.045, 10, 24))
  return {
    cardWidth,
    cardHeight: cardWidth / REEL_CARD_ASPECT,
    gap,
    pitch: cardWidth + gap,
    // Wide enough that the bow reads as a lens, not a drum: a card at the
    // reel's edge has turned under 20°, never far enough to show its side,
    // and the side cards come forward without looming over the middle one.
    radius: reelWidth * 1.7,
  }
}

/**
 * How many times the photographs are laid end to end so the loop never shows
 * its seam. One lap has to be longer than the reel plus one card, or the same
 * photograph would be on screen twice at once — entering at the right while it
 * is still leaving at the left.
 *
 * A single photograph is not a reel. It stands still in the middle.
 */
export function reelCopies(count: number, pitch: number, reelWidth: number): number {
  if (count <= 1 || pitch <= 0) return 1
  return Math.max(1, Math.ceil((reelWidth + pitch) / (count * pitch)))
}

/** `x` wrapped onto the loop, as an offset from the reel's centre in [-lap/2, lap/2). */
export function wrapCentred(x: number, lap: number): number {
  if (lap <= 0) return x
  return x - lap * Math.floor(x / lap + 0.5)
}

/**
 * Concave: the reel is the inside of a very wide cylinder, so a photograph
 * turns TOWARD the guest as it slides out to the side and comes a little
 * nearer, like a panorama you are standing in. The landing page's ring is the
 * outside of one, where a tile turns away and disappears — right for artwork
 * passing by, wrong for a photograph someone is trying to look at.
 */
const BOW = 1

export interface ReelPose {
  /** Horizontal position of the card's centre, from the reel's centre, px. */
  x: number
  /** Toward the guest, px. */
  z: number
  rotateY: number
  /** False once the card is wholly past either edge, with a card to spare. */
  visible: boolean
}

/**
 * Where a card sits for a given distance along the reel from its centre.
 * `arc` is measured along the cylinder, so cards keep their spacing on it and
 * bunch very slightly toward the edges on screen — which is what a curved
 * surface looks like, and what stops the bow reading as a squash.
 */
export function reelPose(arc: number, metrics: ReelMetrics, reelWidth: number): ReelPose {
  const theta = arc / metrics.radius
  return {
    x: metrics.radius * Math.sin(theta),
    z: BOW * metrics.radius * (1 - Math.cos(theta)),
    rotateY: -BOW * theta * (180 / Math.PI),
    visible: Math.abs(arc) < reelWidth / 2 + metrics.cardWidth,
  }
}

// ---------------------------------------------------------------------------
// prints
// ---------------------------------------------------------------------------

/**
 * Resting tilts, in degrees. Alternating sign, because the prints alternate
 * sides and each leans out toward its own edge; uneven magnitudes, because a
 * repeating ±3° is a pattern and a pile is not.
 */
const PRINT_TILTS = [-4.2, 3.4, -2.3, 4.6, -3.6, 2.2, -4.8, 3.0] as const

export interface PrintPose {
  /** Resting tilt, degrees. */
  rotate: number
  /** Sideways nudge off the print's column, % of the print's width. */
  nudge: number
  /** Which side it was thrown in from: -1 left, 1 right. */
  from: -1 | 1
}

/**
 * One print's pose, from its index alone, so a print keeps its tilt through a
 * re-render and the page is the same pile on every visit. The second term
 * breaks PRINT_TILTS' period of eight, which otherwise shows on a thirty-photo
 * gallery as the same four prints recurring.
 */
export function printPose(index: number): PrintPose {
  const base = PRINT_TILTS[index % PRINT_TILTS.length]
  const jitter = (((index * 37) % 7) - 3) * 0.3
  const onRight = index % 2 === 1
  return {
    rotate: Math.round((base + jitter) * 10) / 10,
    nudge: (((index * 53) % 5) - 2) * 1.5,
    from: onRight ? 1 : -1,
  }
}

// ---------------------------------------------------------------------------
// mosaic
// ---------------------------------------------------------------------------

/**
 * Tile heights as a share of the column's width, in a rhythm rather than at
 * each photograph's own shape. Natural shapes are only known once every image
 * has loaded, and a masonry laid out on them reshuffles its columns under the
 * guest's thumb as they arrive. A fixed rhythm lays out once, and the photo's
 * own framing (`crop_*`) decides what shows in whatever tile it lands in.
 */
export const MOSAIC_RATIOS = [1.25, 1, 1.4, 0.8, 1.2, 1.5, 1, 1.3] as const

/** The right column starts this far down (share of a column's width), so the
 *  two never line up into rows. */
export const MOSAIC_OFFSET = 0.32

export interface MosaicTile {
  index: number
  /** Height / width. */
  ratio: number
}

/**
 * Two columns, each photograph going to whichever is shorter so far. In
 * gallery order within each column, so reading down either one follows the
 * organizer's order.
 */
export function mosaicColumns(count: number): [MosaicTile[], MosaicTile[]] {
  const columns: [MosaicTile[], MosaicTile[]] = [[], []]
  const heights = [0, MOSAIC_OFFSET]
  for (let index = 0; index < count; index++) {
    const ratio = MOSAIC_RATIOS[index % MOSAIC_RATIOS.length]
    const column = heights[0] <= heights[1] ? 0 : 1
    columns[column].push({ index, ratio })
    heights[column] += ratio
  }
  return columns
}

// ---------------------------------------------------------------------------
// booth
// ---------------------------------------------------------------------------

/** Frames per photo-booth strip. Three, not four: four frames of a phone
 *  photograph at half the card's width are too small to recognise anyone in. */
export const BOOTH_FRAMES = 3

/** Each strip's tilt, degrees — laid down by hand, never square. */
const BOOTH_TILTS = [-2.2, 1.8, -1.2, 2.6, -2.8, 1.3] as const

export function boothTilt(strip: number): number {
  return BOOTH_TILTS[strip % BOOTH_TILTS.length]
}

/**
 * Seconds between two flashes, anywhere in the gallery. Kept above a third of
 * a second on purpose: WCAG 2.3.1 allows no more than three flashes in any one
 * second, and two strips entering together would otherwise fire six. The
 * booth's scheduler holds every strip to this one clock.
 */
export const BOOTH_FLASH_GAP_S = 0.36

// ---------------------------------------------------------------------------
// shared
// ---------------------------------------------------------------------------

/** `items` in runs of `size`, the last one shorter. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  const runs: T[][] = []
  for (let start = 0; start < items.length; start += size) {
    runs.push(items.slice(start, start + size))
  }
  return runs
}
