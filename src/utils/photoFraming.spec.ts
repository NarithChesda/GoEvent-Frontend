import { describe, it, expect } from 'vitest'
import { MAX_CROP_ZOOM, SHOWCASE_FRAME_ASPECT, cropToCoverGeometry, type Size } from './photoCrop'
import {
  CENTRED_VIEW,
  clampView,
  projectMomentum,
  regionFromView,
  rubberband,
  unrubberband,
  viewFromRegion,
  visibleSpan,
} from './photoFraming'

const LANDSCAPE: Size = { width: 3000, height: 2000 }
const PORTRAIT: Size = { width: 1200, height: 1600 }

describe('visibleSpan', () => {
  it('covers the frame at zoom 1 — one axis is the whole photo', () => {
    // A 4:5 print over a 3:2 photo: full height, a slice of the width.
    expect(visibleSpan(LANDSCAPE, 4 / 5, 1)).toEqual({ width: (0.8 / 1.5) * 100, height: 100 })
    // A 3:2 booth frame over a 3:4 photo: full width, half the height.
    expect(visibleSpan(PORTRAIT, 3 / 2, 1)).toEqual({ width: 100, height: 50 })
  })

  it('shrinks both axes with zoom', () => {
    const at1 = visibleSpan(LANDSCAPE, 4 / 5, 1)
    const at2 = visibleSpan(LANDSCAPE, 4 / 5, 2)
    expect(at2.width).toBeCloseTo(at1.width / 2, 6)
    expect(at2.height).toBeCloseTo(at1.height / 2, 6)
  })
})

describe('clampView', () => {
  it('holds zoom between cover and the ceiling', () => {
    expect(clampView({ zoom: 0.4, centre: { x: 50, y: 50 } }, LANDSCAPE, 4 / 5).zoom).toBe(1)
    expect(clampView({ zoom: 9, centre: { x: 50, y: 50 } }, LANDSCAPE, 4 / 5).zoom).toBe(MAX_CROP_ZOOM)
  })

  it('keeps the frame on the photo', () => {
    const view = clampView({ zoom: 1, centre: { x: 0, y: 0 } }, LANDSCAPE, 4 / 5)
    const span = visibleSpan(LANDSCAPE, 4 / 5, 1)
    expect(view.centre.x).toBeCloseTo(span.width / 2, 6)
    // At zoom 1 the frame spans the full height, so there is nowhere to go.
    expect(view.centre.y).toBe(50)
  })

  it('lets a frame move along the axis zooming frees up', () => {
    const view = clampView({ zoom: 2, centre: { x: 50, y: 20 } }, LANDSCAPE, 4 / 5)
    expect(view.centre.y).toBeCloseTo(25, 6)
  })
})

describe('regionFromView / viewFromRegion', () => {
  const frames = [0.28, SHOWCASE_FRAME_ASPECT, 4 / 5, 1, 4 / 3, 3 / 2]

  it('stores exactly what the frame shows', () => {
    const region = regionFromView({ zoom: 2, centre: { x: 30, y: 40 } }, LANDSCAPE, 4 / 5)
    const span = visibleSpan(LANDSCAPE, 4 / 5, 2)
    expect(region.width).toBeCloseTo(span.width, 1)
    expect(region.height).toBeCloseTo(span.height, 1)
    expect(region.x + region.width / 2).toBeCloseTo(30, 1)
    expect(region.y + region.height / 2).toBeCloseTo(40, 1)
  })

  it('round-trips through the renderer in the same frame', () => {
    for (const natural of [LANDSCAPE, PORTRAIT]) {
      for (const aspect of frames) {
        const view = clampView({ zoom: 1.8, centre: { x: 35, y: 60 } }, natural, aspect)
        const back = viewFromRegion(regionFromView(view, natural, aspect), natural, aspect)
        // Within the one-decimal rounding of the stored rectangle.
        expect(back.zoom).toBeCloseTo(view.zoom, 1)
        expect(back.centre.x).toBeCloseTo(view.centre.x, 0)
        expect(back.centre.y).toBeCloseTo(view.centre.y, 0)
      }
    }
  })

  it('opens a region framed elsewhere on what the stage draws in this frame', () => {
    const region = regionFromView({ zoom: 2.5, centre: { x: 70, y: 30 } }, LANDSCAPE, 4 / 5)
    const view = viewFromRegion(region, LANDSCAPE, 3 / 2)
    const drawn = cropToCoverGeometry(region, LANDSCAPE, { width: 1500, height: 1000 })!
    const cover = Math.max(1500 / LANDSCAPE.width, 1000 / LANDSCAPE.height)
    expect(view.zoom).toBeCloseTo(drawn.width / LANDSCAPE.width / cover, 6)
  })

  it('reads the whole photo as the centred cover', () => {
    for (const aspect of frames) {
      const view = viewFromRegion({ x: 0, y: 0, width: 100, height: 100 }, LANDSCAPE, aspect)
      expect(view.zoom).toBeCloseTo(CENTRED_VIEW.zoom, 6)
      expect(view.centre.x).toBeCloseTo(50, 6)
      expect(view.centre.y).toBeCloseTo(50, 6)
    }
  })
})

describe('gesture physics', () => {
  it('resists progressively and never reaches the dimension', () => {
    const d = 300
    expect(rubberband(0, d)).toBe(0)
    expect(rubberband(100, d)).toBeLessThan(100)
    expect(rubberband(10_000, d)).toBeLessThan(d)
    expect(rubberband(-100, d)).toBeCloseTo(-rubberband(100, d), 9)
  })

  it('undoes the resistance exactly', () => {
    for (const overshoot of [-400, -30, 0, 12, 250, 900]) {
      expect(unrubberband(rubberband(overshoot, 300), 300)).toBeCloseTo(overshoot, 6)
    }
  })

  it('projects a flick forward, in proportion to its speed', () => {
    expect(projectMomentum(0)).toBe(0)
    expect(projectMomentum(1000)).toBeCloseTo(99, 6)
    expect(projectMomentum(-1000)).toBeCloseTo(-99, 6)
  })
})
