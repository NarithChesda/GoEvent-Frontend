import { describe, it, expect } from 'vitest'
import {
  FULL_CROP,
  MAX_CROP_ZOOM,
  SHOWCASE_FRAME_ASPECT,
  cropCentre,
  cropFromZoom,
  cropToCoverGeometry,
  cropZoom,
  cropsEqual,
  isFullCrop,
  maxCropSizeForAspect,
  moveCrop,
  resizeCropFromCorner,
  resolvePhotoCrop,
  responseSupportsPhotoCrop,
  sanitizeCrop,
  toPhotoCropPayload,
  type PhotoCrop,
} from './photoCrop'

const LANDSCAPE = { width: 3000, height: 2000 }
const PORTRAIT = { width: 1200, height: 1600 }

describe('resolvePhotoCrop', () => {
  it('falls back to the whole image when nothing is stored', () => {
    expect(resolvePhotoCrop(null)).toEqual(FULL_CROP)
    expect(resolvePhotoCrop({})).toEqual(FULL_CROP)
  })

  it('requires all four fields — a partial rectangle is not a rectangle', () => {
    expect(resolvePhotoCrop({ crop_x: 10, crop_y: 20 })).toEqual(FULL_CROP)
    expect(resolvePhotoCrop({ crop_x: 10, crop_y: 20, crop_width: 30 })).toEqual(FULL_CROP)
  })

  it('reads a complete stored crop', () => {
    expect(resolvePhotoCrop({ crop_x: 12, crop_y: 5, crop_width: 30, crop_height: 80 })).toEqual({
      x: 12,
      y: 5,
      width: 30,
      height: 80,
    })
  })

  it('treats null as absent rather than as zero', () => {
    // Number(null) is 0, which would read as a legitimate top-left crop.
    expect(
      resolvePhotoCrop({ crop_x: null, crop_y: null, crop_width: null, crop_height: null }),
    ).toEqual(FULL_CROP)
  })

  it('accepts the strings a DRF DecimalField serializes by default', () => {
    expect(
      resolvePhotoCrop({
        crop_x: '12.5' as unknown as number,
        crop_y: '0' as unknown as number,
        crop_width: '25' as unknown as number,
        crop_height: '60' as unknown as number,
      }),
    ).toEqual({ x: 12.5, y: 0, width: 25, height: 60 })
  })

  it('pulls an out-of-bounds rectangle back inside the image', () => {
    expect(resolvePhotoCrop({ crop_x: 90, crop_y: -10, crop_width: 40, crop_height: 60 })).toEqual({
      x: 60,
      y: 0,
      width: 40,
      height: 60,
    })
  })

  it('rejects a degenerate rectangle instead of dividing by it later', () => {
    expect(resolvePhotoCrop({ crop_x: 0, crop_y: 0, crop_width: 0, crop_height: 50 })).toEqual(
      FULL_CROP,
    )
  })
})

describe('sanitizeCrop / payload / comparisons', () => {
  it('keeps the rectangle inside the image', () => {
    expect(sanitizeCrop({ x: 80, y: 80, width: 50, height: 50 })).toEqual({
      x: 50,
      y: 50,
      width: 50,
      height: 50,
    })
  })

  it('builds a PATCH body with the wire field names', () => {
    expect(toPhotoCropPayload({ x: 12.34, y: 5, width: 25, height: 60 })).toEqual({
      crop_x: 12.3,
      crop_y: 5,
      crop_width: 25,
      crop_height: 60,
    })
  })

  it('recognises the whole image and compares rectangles', () => {
    expect(isFullCrop({ ...FULL_CROP })).toBe(true)
    expect(isFullCrop({ x: 0, y: 0, width: 100, height: 99 })).toBe(false)
    expect(
      cropsEqual({ x: 1, y: 2, width: 3, height: 4 }, { x: 1, y: 2, width: 3, height: 4 }),
    ).toBe(true)
  })

  it('is false for a response that dropped the crop fields', () => {
    // The only way to tell a real save from a 200 that silently ignored them.
    expect(responseSupportsPhotoCrop({ id: 1 } as never)).toBe(false)
    expect(responseSupportsPhotoCrop({ crop_width: null })).toBe(true)
    expect(responseSupportsPhotoCrop({ crop_width: 30 })).toBe(true)
  })
})

describe('maxCropSizeForAspect', () => {
  it('spans the full height of a landscape photo', () => {
    const max = maxCropSizeForAspect(LANDSCAPE, SHOWCASE_FRAME_ASPECT)
    expect(max.height).toBe(100)
    // 2000px tall * (390/844) = 924px wide, out of 3000 = 30.8%
    expect(max.width).toBeCloseTo(30.8, 1)
  })

  it('spans the full width of a photo taller than the phone frame', () => {
    // 9:32 is narrower than 390:844, so height is the spare dimension.
    const max = maxCropSizeForAspect({ width: 900, height: 3200 }, SHOWCASE_FRAME_ASPECT)
    expect(max.width).toBe(100)
    expect(max.height).toBeLessThan(100)
  })

  it('produces a box whose rendered pixels really are the frame aspect', () => {
    for (const natural of [LANDSCAPE, PORTRAIT, { width: 900, height: 3200 }]) {
      const max = maxCropSizeForAspect(natural, SHOWCASE_FRAME_ASPECT)
      const pixelAspect =
        ((max.width / 100) * natural.width) / ((max.height / 100) * natural.height)
      expect(pixelAspect).toBeCloseTo(SHOWCASE_FRAME_ASPECT, 4)
      expect(max.width).toBeLessThanOrEqual(100)
      expect(max.height).toBeLessThanOrEqual(100)
    }
  })
})

describe('cropFromZoom / cropZoom', () => {
  it('round-trips zoom', () => {
    for (const zoom of [1, 1.5, 2, 3]) {
      const crop = cropFromZoom(LANDSCAPE, SHOWCASE_FRAME_ASPECT, zoom)
      expect(cropZoom(crop, LANDSCAPE, SHOWCASE_FRAME_ASPECT)).toBeCloseTo(zoom, 1)
    }
  })

  it('centres on the requested point and clamps to the image', () => {
    const centred = cropFromZoom(LANDSCAPE, SHOWCASE_FRAME_ASPECT, 2, { x: 40, y: 60 })
    expect(cropCentre(centred).x).toBeCloseTo(40, 1)
    expect(cropCentre(centred).y).toBeCloseTo(60, 1)

    // A centre near the edge can't be honoured without leaving the image.
    const clamped = cropFromZoom(LANDSCAPE, SHOWCASE_FRAME_ASPECT, 2, { x: 0, y: 0 })
    expect(clamped.x).toBe(0)
    expect(clamped.y).toBe(0)
  })

  it('refuses to zoom past the ceiling or below the largest fitting box', () => {
    const tooFar = cropFromZoom(LANDSCAPE, SHOWCASE_FRAME_ASPECT, 99)
    expect(cropZoom(tooFar, LANDSCAPE, SHOWCASE_FRAME_ASPECT)).toBeCloseTo(MAX_CROP_ZOOM, 1)

    const tooWide = cropFromZoom(LANDSCAPE, SHOWCASE_FRAME_ASPECT, 0.2)
    expect(tooWide).toEqual(cropFromZoom(LANDSCAPE, SHOWCASE_FRAME_ASPECT, 1))
  })

  it('gives vertical room only once the box has been shrunk', () => {
    // This is the whole reason resizing exists: at full size a phone-shaped box
    // over a landscape photo spans its entire height and cannot move up/down.
    const full = cropFromZoom(LANDSCAPE, SHOWCASE_FRAME_ASPECT, 1)
    expect(full.height).toBe(100)
    expect(moveCrop(full, 0, 20).y).toBe(0)

    const smaller = cropFromZoom(LANDSCAPE, SHOWCASE_FRAME_ASPECT, 2)
    expect(moveCrop(smaller, 0, 20).y).toBeGreaterThan(smaller.y)
  })
})

describe('moveCrop', () => {
  it('slides the box and stops at the edges', () => {
    const crop: PhotoCrop = { x: 10, y: 10, width: 20, height: 40 }
    expect(moveCrop(crop, 5, -5)).toEqual({ x: 15, y: 5, width: 20, height: 40 })
    expect(moveCrop(crop, 999, 999)).toEqual({ x: 80, y: 60, width: 20, height: 40 })
    expect(moveCrop(crop, -999, -999)).toEqual({ x: 0, y: 0, width: 20, height: 40 })
  })
})

describe('resizeCropFromCorner', () => {
  const start = cropFromZoom(LANDSCAPE, SHOWCASE_FRAME_ASPECT, 2, { x: 50, y: 50 })

  it('pins the opposite corner', () => {
    const resized = resizeCropFromCorner(start, LANDSCAPE, SHOWCASE_FRAME_ASPECT, 'nw', {
      x: start.x + 5,
      y: start.y + 5,
    })
    // Dragging the top-left inward must leave the bottom-right where it was.
    expect(resized.x + resized.width).toBeCloseTo(start.x + start.width, 1)
    expect(resized.y + resized.height).toBeCloseTo(start.y + start.height, 1)
    expect(resized.width).toBeLessThan(start.width)
  })

  it('holds the frame aspect through a resize', () => {
    const resized = resizeCropFromCorner(start, LANDSCAPE, SHOWCASE_FRAME_ASPECT, 'se', {
      x: 95,
      y: 60,
    })
    const pixelAspect =
      ((resized.width / 100) * LANDSCAPE.width) / ((resized.height / 100) * LANDSCAPE.height)
    expect(pixelAspect).toBeCloseTo(SHOWCASE_FRAME_ASPECT, 3)
  })

  it('never grows outside the image or past the zoom limits', () => {
    const grown = resizeCropFromCorner(start, LANDSCAPE, SHOWCASE_FRAME_ASPECT, 'se', {
      x: 500,
      y: 500,
    })
    expect(grown.x).toBeGreaterThanOrEqual(0)
    expect(grown.y).toBeGreaterThanOrEqual(0)
    expect(grown.x + grown.width).toBeLessThanOrEqual(100.01)
    expect(grown.y + grown.height).toBeLessThanOrEqual(100.01)

    const shrunk = resizeCropFromCorner(start, LANDSCAPE, SHOWCASE_FRAME_ASPECT, 'se', {
      x: start.x,
      y: start.y,
    })
    expect(cropZoom(shrunk, LANDSCAPE, SHOWCASE_FRAME_ASPECT)).toBeLessThanOrEqual(MAX_CROP_ZOOM)
  })
})

describe('cropToCoverGeometry', () => {
  const PHONE = { width: 390, height: 844 }

  it('waits for both sizes before computing anything', () => {
    expect(cropToCoverGeometry({ ...FULL_CROP }, null, PHONE)).toBeNull()
    expect(cropToCoverGeometry({ ...FULL_CROP }, LANDSCAPE, null)).toBeNull()
    expect(cropToCoverGeometry({ ...FULL_CROP }, { width: 0, height: 0 }, PHONE)).toBeNull()
  })

  it('reproduces a plain centred `cover` for the whole-image default', () => {
    const geometry = cropToCoverGeometry({ ...FULL_CROP }, LANDSCAPE, PHONE)!
    const coverScale = Math.max(PHONE.width / LANDSCAPE.width, PHONE.height / LANDSCAPE.height)

    expect(geometry.width).toBeCloseTo(LANDSCAPE.width * coverScale, 2)
    expect(geometry.height).toBeCloseTo(LANDSCAPE.height * coverScale, 2)
    // Centred: equal overhang on both sides.
    expect(geometry.left).toBeCloseTo((PHONE.width - geometry.width) / 2, 2)
    expect(geometry.top).toBeCloseTo((PHONE.height - geometry.height) / 2, 2)
  })

  it('puts the chosen region on screen, exactly, at the authored aspect', () => {
    const crop = cropFromZoom(LANDSCAPE, SHOWCASE_FRAME_ASPECT, 2, { x: 25, y: 40 })
    const geometry = cropToCoverGeometry(crop, LANDSCAPE, PHONE)!

    // The crop's centre should land in the middle of the phone viewport...
    const centre = cropCentre(crop)
    expect(geometry.left + (centre.x / 100) * geometry.width).toBeCloseTo(PHONE.width / 2, 1)
    expect(geometry.top + (centre.y / 100) * geometry.height).toBeCloseTo(PHONE.height / 2, 1)

    // ...and the crop should fill it, since it was authored at this aspect.
    // Sub-pixel tolerance: the stored rectangle is rounded to one decimal.
    expect((crop.width / 100) * geometry.width).toBeCloseTo(PHONE.width, 0)
    expect((crop.height / 100) * geometry.height).toBeCloseTo(PHONE.height, 0)
  })

  it('always covers the viewport, whatever shape the guest turns up with', () => {
    const viewports = [
      { width: 390, height: 844 }, // the phone it was authored on
      { width: 430, height: 932 }, // a bigger phone
      { width: 820, height: 1180 }, // tablet
      { width: 1920, height: 1080 }, // desktop, landscape
      { width: 360, height: 360 }, // square, for good measure
    ]
    const crops = [
      { ...FULL_CROP },
      cropFromZoom(LANDSCAPE, SHOWCASE_FRAME_ASPECT, 1),
      cropFromZoom(LANDSCAPE, SHOWCASE_FRAME_ASPECT, 3, { x: 5, y: 95 }), // hard against a corner
      cropFromZoom(PORTRAIT, SHOWCASE_FRAME_ASPECT, 2, { x: 100, y: 0 }),
    ]

    for (const natural of [LANDSCAPE, PORTRAIT]) {
      for (const crop of crops) {
        for (const viewport of viewports) {
          const g = cropToCoverGeometry(crop, natural, viewport)!
          // No gap on any edge — a letterboxed transition stage would be a
          // visible black band mid-animation.
          expect(g.left).toBeLessThanOrEqual(0.01)
          expect(g.top).toBeLessThanOrEqual(0.01)
          expect(g.left + g.width).toBeGreaterThanOrEqual(viewport.width - 0.01)
          expect(g.top + g.height).toBeGreaterThanOrEqual(viewport.height - 0.01)
          // Undistorted: the rendered box keeps the source's aspect ratio.
          expect(g.width / g.height).toBeCloseTo(natural.width / natural.height, 4)
        }
      }
    }
  })

  it('shows a slice of the chosen region on a wider screen, not something else', () => {
    const crop = cropFromZoom(LANDSCAPE, SHOWCASE_FRAME_ASPECT, 2, { x: 30, y: 50 })
    const desktop = { width: 1600, height: 900 }
    const g = cropToCoverGeometry(crop, LANDSCAPE, desktop)!

    // The crop's full height still shows — height-priority means a wide screen
    // reveals more of the photo sideways instead of slicing off the top and
    // bottom of what the organizer framed.
    expect((crop.height / 100) * g.height).toBeCloseTo(desktop.height, 0)
    // ...and horizontally we see more than the crop, never less.
    expect((crop.width / 100) * g.width).toBeLessThanOrEqual(desktop.width + 0.01)
  })
})
