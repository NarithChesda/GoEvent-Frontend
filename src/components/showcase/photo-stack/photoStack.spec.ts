import { describe, expect, it } from 'vitest'
import type { EventPhoto } from '@/types/showcase'
import {
  STACK_LAYOUT_TYPES,
  printFocus,
  resolveStackLayout,
  selectStackPhotos,
  stackCapacity,
  stackPhotosFor,
  stackTimeline,
} from './photoStack'

const photo = (id: number, order: number, isFeatured = false): EventPhoto => ({
  id,
  event: 'e',
  image: `/p${id}.jpg`,
  caption: '',
  order,
  is_featured: isFeatured,
  created_at: '',
})

const ids = (photos: EventPhoto[]) => photos.map((p) => p.id)

describe('resolveStackLayout', () => {
  it('keeps every known layout', () => {
    for (const layout of STACK_LAYOUT_TYPES) expect(resolveStackLayout(layout)).toBe(layout)
  })

  it('reads absent, null and unknown as the pile', () => {
    expect(resolveStackLayout(undefined)).toBe('pile')
    expect(resolveStackLayout(null)).toBe('pile')
    expect(resolveStackLayout('carousel')).toBe('pile')
  })
})

describe('selectStackPhotos', () => {
  it('reveals nothing when no photo is featured — the middle beat is gated on one', () => {
    expect(selectStackPhotos([photo(1, 0), photo(2, 1)], 5)).toEqual([])
    expect(selectStackPhotos([], 5)).toEqual([])
    expect(selectStackPhotos(undefined, 5)).toEqual([])
  })

  it('leads with the featured photos in order, then the gallery in order', () => {
    const photos = [photo(1, 3), photo(2, 0), photo(3, 2, true), photo(4, 1), photo(5, 4, true)]
    expect(ids(selectStackPhotos(photos, 5))).toEqual([3, 5, 2, 4, 1])
  })

  it('orders ties by id, so the stack is stable across loads', () => {
    expect(ids(selectStackPhotos([photo(9, 0, true), photo(4, 0, true)], 5))).toEqual([4, 9])
  })

  it("caps at the layout's capacity", () => {
    const photos = Array.from({ length: 9 }, (_, i) => photo(i + 1, i, i === 4))
    for (const layout of STACK_LAYOUT_TYPES) {
      const stack = stackPhotosFor(photos, layout)
      expect(stack).toHaveLength(stackCapacity(layout))
      expect(stack[0].id).toBe(5)
    }
  })
})

describe('printFocus', () => {
  it('centres an uncropped photo', () => {
    expect(printFocus(photo(1, 0))).toBe('50% 50%')
  })

  it("anchors on the centre of the organizer's crop", () => {
    expect(printFocus({ crop_x: 10, crop_y: 20, crop_width: 40, crop_height: 60 })).toBe('30% 50%')
  })
})

describe('stackTimeline', () => {
  it('deals the first print on the fifth beat of the cover stagger', () => {
    expect(stackTimeline(5).deals[0]).toBe(400)
  })

  it("gathers pace: every layout's gaps never lengthen", () => {
    for (const layout of STACK_LAYOUT_TYPES) {
      const { deals } = stackTimeline(stackCapacity(layout), false, layout)
      const gaps = deals.slice(1).map((t, k) => t - deals[k])
      for (let k = 1; k < gaps.length; k++) expect(gaps[k]).toBeLessThanOrEqual(gaps[k - 1])
    }
  })

  it.each(STACK_LAYOUT_TYPES)('runs its beats in order at every count (%s)', (layout) => {
    for (const reduced of [false, true]) {
      for (let n = 1; n <= stackCapacity(layout); n++) {
        const t = stackTimeline(n, reduced, layout)
        expect(t.deals).toHaveLength(n)
        expect(t.spread).toBeGreaterThan(t.deals[n - 1])
        expect(t.copy).toBeGreaterThanOrEqual(t.spread)
        expect(t.dissolve).toBeGreaterThan(t.copy)
        expect(t.complete).toBeGreaterThan(t.dissolve)
      }
    }
  })

  it('gives every Save the Date design the same 4s window the decoration stage does', () => {
    for (const layout of STACK_LAYOUT_TYPES) {
      const t = stackTimeline(stackCapacity(layout), false, layout)
      expect(t.dissolve - t.copy).toBe(4000)
    }
  })

  it('lands every full layout in about the same time', () => {
    for (const layout of STACK_LAYOUT_TYPES) {
      const { complete } = stackTimeline(stackCapacity(layout), false, layout)
      expect(complete).toBeGreaterThan(9000)
      expect(complete).toBeLessThan(11500)
    }
  })

  it('is shorter, not longer, under reduced motion', () => {
    for (const layout of STACK_LAYOUT_TYPES) {
      for (let n = 1; n <= stackCapacity(layout); n++) {
        expect(stackTimeline(n, true, layout).complete).toBeLessThan(stackTimeline(n, false, layout).complete)
      }
    }
  })
})
