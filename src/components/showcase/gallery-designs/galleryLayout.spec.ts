import { describe, expect, it } from 'vitest'
import {
  chunk,
  mosaicColumns,
  printPose,
  reelCopies,
  reelMetrics,
  reelPose,
  wrapCentred,
} from './galleryLayout'

describe('reel', () => {
  const width = 360
  const metrics = reelMetrics(width)

  it('shows its neighbours either side of the middle card', () => {
    // More than half the reel, less than all of it: the cards beside it peek in.
    expect(metrics.cardWidth).toBeGreaterThan(width / 2)
    expect(metrics.cardWidth + 2 * metrics.gap).toBeLessThan(width)
  })

  it('lays the photos end to end until a lap outruns the screen', () => {
    // A lap shorter than the reel plus a card would show one photo twice at once.
    for (const count of [2, 3, 5, 12, 30]) {
      const copies = reelCopies(count, metrics.pitch, width)
      expect(copies * count * metrics.pitch).toBeGreaterThanOrEqual(width + metrics.pitch)
      // …and never more laps than it needs.
      expect((copies - 1) * count * metrics.pitch).toBeLessThan(width + metrics.pitch)
    }
    expect(reelCopies(30, metrics.pitch, width)).toBe(1)
  })

  it('does not loop a single photograph', () => {
    expect(reelCopies(1, metrics.pitch, width)).toBe(1)
  })

  it('wraps a position onto the loop, centred on the reel', () => {
    expect(wrapCentred(0, 1000)).toBe(0)
    expect(wrapCentred(499, 1000)).toBe(499)
    expect(wrapCentred(500, 1000)).toBe(-500)
    expect(wrapCentred(-1700, 1000)).toBe(300)
    expect(wrapCentred(2250, 1000)).toBe(250)
  })

  it('bows symmetrically, turning the side cards toward the guest', () => {
    const left = reelPose(-150, metrics, width)
    const right = reelPose(150, metrics, width)
    expect(left.x).toBeCloseTo(-right.x)
    expect(left.rotateY).toBeCloseTo(-right.rotateY)
    // Concave: both sides come nearer than the middle, which does not move.
    expect(right.z).toBeGreaterThan(0)
    expect(reelPose(0, metrics, width)).toMatchObject({ x: 0, z: 0 })
    // Never far enough to show a card's side.
    const edge = reelPose(width / 2, metrics, width)
    expect(Math.abs(edge.rotateY)).toBeLessThan(25)
  })

  it('retires a card once it is past the edge with a card to spare', () => {
    expect(reelPose(width / 2 + metrics.cardWidth / 2, metrics, width).visible).toBe(true)
    expect(reelPose(width / 2 + metrics.cardWidth + 1, metrics, width).visible).toBe(false)
    expect(reelPose(-(width / 2 + metrics.cardWidth + 1), metrics, width).visible).toBe(false)
  })
})

describe('prints', () => {
  it('poses a print from its index alone', () => {
    expect(printPose(7)).toEqual(printPose(7))
  })

  it('keeps every print within a hand-tossed tilt', () => {
    for (let index = 0; index < 30; index++) {
      const { rotate, nudge } = printPose(index)
      expect(Math.abs(rotate)).toBeLessThanOrEqual(6)
      expect(Math.abs(nudge)).toBeLessThanOrEqual(3)
    }
  })

  it('throws each print in from its own side', () => {
    expect(printPose(0).from).toBe(-1)
    expect(printPose(1).from).toBe(1)
  })
})

describe('mosaic', () => {
  it('places every photograph exactly once, in order down each column', () => {
    const [left, right] = mosaicColumns(23)
    const placed = [...left, ...right].map((tile) => tile.index).sort((a, b) => a - b)
    expect(placed).toEqual(Array.from({ length: 23 }, (_, index) => index))
    for (const column of [left, right]) {
      const order = column.map((tile) => tile.index)
      expect(order).toEqual([...order].sort((a, b) => a - b))
    }
  })

  it('keeps the two columns within a tile of each other', () => {
    for (const count of [10, 17, 30]) {
      const [left, right] = mosaicColumns(count)
      const height = (column: typeof left) => column.reduce((sum, tile) => sum + tile.ratio, 0)
      expect(Math.abs(height(left) - height(right))).toBeLessThanOrEqual(1.5)
    }
  })

  it('starts the first photograph in the left column', () => {
    expect(mosaicColumns(1)[0]).toHaveLength(1)
  })
})

describe('chunk', () => {
  it('runs the items in threes, the last one shorter', () => {
    expect(chunk([1, 2, 3, 4, 5, 6, 7], 3)).toEqual([[1, 2, 3], [4, 5, 6], [7]])
    expect(chunk([], 3)).toEqual([])
  })
})
