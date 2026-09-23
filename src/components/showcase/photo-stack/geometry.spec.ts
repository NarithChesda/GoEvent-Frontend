import { describe, expect, it } from 'vitest'
import {
  FILM_CAPACITY,
  MOSAIC_CAPACITY,
  PILE_CAPACITY,
  SPLIT_CAPACITY,
  filmStripHeight,
  mosaicTiles,
  pileLayout,
  splitLayout,
} from './geometry'

const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1)

describe('pileLayout', () => {
  it.each(range(PILE_CAPACITY))('gives every one of %i prints a pile, drop and spread pose', (n) => {
    const layout = pileLayout(n)
    expect(layout.pile).toHaveLength(n)
    expect(layout.drop).toHaveLength(n)
    expect(layout.spread).toHaveLength(n)
    expect(layout.spreadScale).toBeGreaterThan(0)
    expect(layout.spreadScale).toBeLessThanOrEqual(1)
  })

  it('lays the top print of the pile nearly square, whatever the count', () => {
    for (const n of range(PILE_CAPACITY)) {
      expect(Math.abs(pileLayout(n).pile[n - 1].r)).toBeLessThanOrEqual(1)
    }
  })

  it('never asks for a layout it does not have', () => {
    expect(pileLayout(0).pile).toHaveLength(1)
    expect(pileLayout(12).pile).toHaveLength(PILE_CAPACITY)
  })
})

describe('splitLayout', () => {
  it.each(range(SPLIT_CAPACITY))('has one panel per photo, inside the stage (%i)', (n) => {
    const { panels, bandY } = splitLayout(n)
    expect(panels).toHaveLength(n)
    for (const panel of panels) {
      expect(panel.left).toBeGreaterThanOrEqual(0)
      expect(panel.top).toBeGreaterThanOrEqual(0)
      expect(panel.left + panel.width).toBeLessThanOrEqual(100)
      expect(panel.top + panel.height).toBeLessThanOrEqual(100)
    }
    expect(bandY).toBeGreaterThan(0)
    expect(bandY).toBeLessThan(100)
  })

  it('wipes point for point: every collapsed polygon has as many points as its final one', () => {
    const points = (polygon: string) => polygon.split(',').length
    for (const n of range(SPLIT_CAPACITY)) {
      for (const panel of splitLayout(n).panels) expect(points(panel.from)).toBe(points(panel.clip))
    }
  })

  it('keeps the top photos above the band and the bottom ones below it', () => {
    const { panels, bandY } = splitLayout(4)
    for (const panel of panels) {
      if (panel.fade === 'down') expect(panel.top + panel.height).toBeLessThanOrEqual(bandY)
      else expect(panel.top).toBeGreaterThanOrEqual(bandY)
    }
  })
})

describe('mosaicTiles', () => {
  it.each(range(MOSAIC_CAPACITY))('has one tile per photo (%i)', (n) => {
    expect(mosaicTiles(n)).toHaveLength(n)
  })

  it.each(range(MOSAIC_CAPACITY).filter((n) => n > 1))(
    'fills each column top to bottom with no gaps or overlaps (%i)',
    (n) => {
      for (const column of ['left', 'right'] as const) {
        const tiles = mosaicTiles(n)
          .filter((tile) => tile.column === column)
          .sort((a, b) => a.top - b.top)
        let edge = 0
        for (const tile of tiles) {
          expect(tile.top).toBe(edge)
          edge = tile.top + tile.height
        }
        expect(edge).toBe(100)
      }
    },
  )

  it('surfaces the photos alternately either side of the centre', () => {
    expect(mosaicTiles(6).map((tile) => tile.column)).toEqual([
      'left',
      'right',
      'left',
      'right',
      'left',
      'right',
    ])
  })

  it('staggers the columns: no row boundary lines up across the gutter', () => {
    const tiles = mosaicTiles(6)
    const bounds = (column: 'left' | 'right') =>
      tiles.filter((t) => t.column === column).map((t) => t.top).filter((top) => top > 0)
    const right = new Set(bounds('right'))
    for (const top of bounds('left')) expect(right.has(top)).toBe(false)
  })
})

describe('filmStripHeight', () => {
  it('grows with each frame and fits a 9:16 stage with the copy under it', () => {
    let previous = 0
    for (const n of range(FILM_CAPACITY)) {
      const height = filmStripHeight(n)
      expect(height).toBeGreaterThan(previous)
      previous = height
    }
    // Strip + 0.1w of air + a ~0.3w Save the Date, inside a 16/9 = 1.78w stage.
    expect(filmStripHeight(FILM_CAPACITY) + 0.1 + 0.3).toBeLessThan(16 / 9)
  })
})
