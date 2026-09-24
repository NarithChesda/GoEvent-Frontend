import { describe, it, expect } from 'vitest'
import {
  FULL_CROP,
  MAX_CROP_ZOOM,
  SHOWCASE_FRAME_ASPECT,
  cropCentre,
  cropToCoverGeometry,
  cropsEqual,
  isFullCrop,
  resolvePhotoCrop,
  responseSupportsPhotoCrop,
  sanitizeCrop,
  toPhotoCropPayload,
  type CropGeometry,
  type PhotoCrop,
  type Point,
  type Size,
} from './photoCrop'
import { regionFromView } from './photoFraming'

const LANDSCAPE = { width: 3000, height: 2000 }
const PORTRAIT = { width: 1200, height: 1600 }

/** A region framed in a frame of `aspect` at `zoom` — what the editor stores. */
const framedIn = (natural: Size, aspect: number, zoom: number, centre: Point = { x: 50, y: 50 }) =>
  regionFromView({ zoom, centre }, natural, aspect)

/** The shape every crop saved before the photo stack has. */
const phoneCrop = (natural: Size, zoom: number, centre?: Point) =>
  framedIn(natural, SHOWCASE_FRAME_ASPECT, zoom, centre)

/** Where the region lands inside the viewport, in viewport pixels. */
const regionOnScreen = (crop: PhotoCrop, g: CropGeometry) => ({
  left: g.left + (crop.x / 100) * g.width,
  top: g.top + (crop.y / 100) * g.height,
  right: g.left + ((crop.x + crop.width) / 100) * g.width,
  bottom: g.top + ((crop.y + crop.height) / 100) * g.height,
})

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
    const crop = phoneCrop(LANDSCAPE, 2, { x: 25, y: 40 })
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
      phoneCrop(LANDSCAPE, 1),
      phoneCrop(LANDSCAPE, 3, { x: 5, y: 95 }), // hard against a corner
      phoneCrop(PORTRAIT, 2, { x: 100, y: 0 }),
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
    const crop = phoneCrop(LANDSCAPE, 2, { x: 30, y: 50 })
    const desktop = { width: 1600, height: 900 }
    const g = cropToCoverGeometry(crop, LANDSCAPE, desktop)!

    // The crop's full height still shows — height-priority means a wide screen
    // reveals more of the photo sideways instead of slicing off the top and
    // bottom of what the organizer framed.
    expect((crop.height / 100) * g.height).toBeCloseTo(desktop.height, 0)
    // ...and horizontally we see more than the crop, never less.
    expect((crop.width / 100) * g.width).toBeLessThanOrEqual(desktop.width + 0.01)
  })

  // --- Any shape ------------------------------------------------------------
  // The photo stack draws one region in a 4:5 print, a 3:2 booth frame, a
  // mosaic column under 1:3 and everything between.

  const SHAPES = [0.28, 0.6, SHOWCASE_FRAME_ASPECT, 4 / 5, 1.15, 4 / 3, 3 / 2, 16 / 9]
  const PHOTOS = [LANDSCAPE, PORTRAIT, { width: 1000, height: 1000 }, { width: 900, height: 1600 }]

  it('is exactly what was framed, in the frame it was framed in', () => {
    for (const natural of PHOTOS) {
      for (const aspect of SHAPES) {
        const region = framedIn(natural, aspect, 1.7, { x: 38, y: 33 })
        const viewport = { width: 500 * aspect, height: 500 }
        const box = regionOnScreen(region, cropToCoverGeometry(region, natural, viewport)!)
        // Within a pixel of a 500px frame: the stored rectangle is rounded to
        // one decimal of a percent.
        expect(Math.abs(box.left)).toBeLessThan(1)
        expect(Math.abs(box.top)).toBeLessThan(1)
        expect(Math.abs(box.right - viewport.width)).toBeLessThan(1)
        expect(Math.abs(box.bottom - viewport.height)).toBeLessThan(1)
      }
    }
  })

  it('shows all of a region in every other shape, or as much as the photo allows', () => {
    const eps = 0.5
    for (const natural of PHOTOS) {
      for (const framedAspect of SHAPES) {
        for (const zoom of [1, 2, MAX_CROP_ZOOM]) {
          const region = framedIn(natural, framedAspect, zoom, { x: 30, y: 25 })
          for (const aspect of SHAPES) {
            const viewport = { width: 400 * aspect, height: 400 }
            const g = cropToCoverGeometry(region, natural, viewport)!
            const box = regionOnScreen(region, g)
            // Per axis: the region fits inside the frame, or — where the photo
            // is simply the wrong shape for it — spans the whole frame, so
            // nothing outside the region is shown in its place.
            const fitsX = box.left >= -eps && box.right <= viewport.width + eps
            const spansX = box.left <= eps && box.right >= viewport.width - eps
            const fitsY = box.top >= -eps && box.bottom <= viewport.height + eps
            const spansY = box.top <= eps && box.bottom >= viewport.height - eps
            expect(fitsX || spansX).toBe(true)
            expect(fitsY || spansY).toBe(true)
          }
        }
      }
    }
  })

  it('never needs more zoom than a region was framed at', () => {
    // Which is why the renderer's cap is the editor's cap.
    for (const natural of PHOTOS) {
      for (const framedAspect of SHAPES) {
        const zoom = MAX_CROP_ZOOM
        const region = framedIn(natural, framedAspect, zoom, { x: 60, y: 45 })
        for (const aspect of SHAPES) {
          const viewport = { width: 400 * aspect, height: 400 }
          const g = cropToCoverGeometry(region, natural, viewport)!
          const cover = Math.max(viewport.width / natural.width, viewport.height / natural.height)
          expect(g.width / natural.width / cover).toBeLessThanOrEqual(zoom + 0.01)
        }
      }
    }
  })

  it('keeps all of a phone crop on a phone narrower than the one it was framed on', () => {
    // The one change for crops saved before the photo stack: matching height
    // would slice their sides here; containing them shows a sliver more above
    // and below instead.
    const crop = phoneCrop(LANDSCAPE, 2, { x: 40, y: 50 })
    const narrow = { width: 360, height: 800 }
    const box = regionOnScreen(crop, cropToCoverGeometry(crop, LANDSCAPE, narrow)!)
    expect(box.left).toBeCloseTo(0, 0)
    expect(box.right).toBeCloseTo(narrow.width, 0)
    expect(box.top).toBeGreaterThanOrEqual(-0.01)
    expect(box.bottom).toBeLessThanOrEqual(narrow.height + 0.01)
  })

  it('stops magnifying at the cap for a rectangle the editor could not have made', () => {
    const tiny = { x: 49.5, y: 49.5, width: 1, height: 1 }
    const viewport = { width: 390, height: 844 }
    const g = cropToCoverGeometry(tiny, LANDSCAPE, viewport)!
    const cover = Math.max(viewport.width / LANDSCAPE.width, viewport.height / LANDSCAPE.height)
    expect(g.width / LANDSCAPE.width / cover).toBeCloseTo(MAX_CROP_ZOOM, 6)
    // Centred on it all the same.
    const centre = cropCentre(tiny)
    expect(g.left + (centre.x / 100) * g.width).toBeCloseTo(viewport.width / 2, 1)
  })

  describe('with insetY (a frame whose top and bottom fade out)', () => {
    const BAND = { width: 400, height: 500 }
    const INSET = 0.12

    it('is exactly the plain renderer at 0', () => {
      const crop = phoneCrop(PORTRAIT, 1.6, { x: 45, y: 30 })
      expect(cropToCoverGeometry(crop, PORTRAIT, BAND, { insetY: 0 })).toEqual(
        cropToCoverGeometry(crop, PORTRAIT, BAND),
      )
    })

    it('fits a tall region between the fades instead of edge to edge', () => {
      // A standing couple framed tighter than the band: without the inset their
      // heads and feet would sit in the fades.
      const couple = { x: 40, y: 20, width: 20, height: 40 }
      const box = regionOnScreen(couple, cropToCoverGeometry(couple, PORTRAIT, BAND, { insetY: INSET })!)
      expect(box.top).toBeCloseTo(BAND.height * INSET, 1)
      expect(box.bottom).toBeCloseTo(BAND.height * (1 - INSET), 1)

      const plain = regionOnScreen(couple, cropToCoverGeometry(couple, PORTRAIT, BAND)!)
      expect(plain.top).toBeCloseTo(0, 1)
    })

    it('still covers the whole frame — the fades are drawn over photo, not over nothing', () => {
      for (const natural of PHOTOS) {
        const g = cropToCoverGeometry(FULL_CROP, natural, BAND, { insetY: INSET })!
        expect(g.left).toBeLessThanOrEqual(0.01)
        expect(g.top).toBeLessThanOrEqual(0.01)
        expect(g.left + g.width).toBeGreaterThanOrEqual(BAND.width - 0.01)
        expect(g.top + g.height).toBeGreaterThanOrEqual(BAND.height - 0.01)
      }
    })

    it('leaves some clear middle whatever inset it is handed', () => {
      const couple = { x: 40, y: 20, width: 20, height: 40 }
      const g = cropToCoverGeometry(couple, PORTRAIT, BAND, { insetY: 5 })!
      expect(Number.isFinite(g.width) && g.width > 0).toBe(true)
    })
  })
})
