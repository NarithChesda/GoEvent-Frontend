import { describe, expect, it } from 'vitest'

import { FULL_CROP } from '@/utils/photoCrop'
import {
  coverFramePhotoId,
  coverPhotoArt,
  coverPhotoImageRect,
  coverPhotoLayout,
  resolveCoverPhotoConfig,
  resolveCoverPhotoSource,
  resolveCoverPhotoVisibility,
} from './coverPhoto'

describe('coverPhotoArt', () => {
  it('draws the sample-logo pair until the template has artwork of its own', () => {
    expect(coverPhotoArt({ sample_logo_1: 'frame.png', sample_logo_2: 'shape.png' })).toEqual({
      frame: 'frame.png',
      shape: 'shape.png',
      fromSampleLogos: true,
    })
  })

  it('replaces the pair as a pair, never mixing one new image with one old one', () => {
    const assets = { sample_logo_1: 'old-frame.png', sample_logo_2: 'old-shape.png' }
    expect(coverPhotoArt({ ...assets, cover_photo_shape_image: 'shape.png' })).toEqual({
      frame: null,
      shape: 'shape.png',
      fromSampleLogos: false,
    })
    expect(coverPhotoArt({ ...assets, cover_photo_frame_image: 'frame.png' })).toEqual({
      frame: 'frame.png',
      shape: null,
      fromSampleLogos: false,
    })
  })

  it('never borrows a lone sample logo 1, which is the logo placeholder', () => {
    expect(coverPhotoArt({ sample_logo_1: 'mark.png' })).toEqual({
      frame: null,
      shape: null,
      fromSampleLogos: false,
    })
    expect(coverPhotoArt(null).fromSampleLogos).toBe(false)
  })
})

describe('resolveCoverPhotoVisibility', () => {
  const pair = { sample_logo_2: 'shape.png' }

  it('infers the frame, in the logo’s place, only from the sample-logo pair', () => {
    expect(resolveCoverPhotoVisibility({}, pair)).toEqual({ showCoverPhoto: true, showCoverLogo: false })
    expect(resolveCoverPhotoVisibility(null, pair)).toEqual({ showCoverPhoto: true, showCoverLogo: false })
    expect(resolveCoverPhotoVisibility({}, { sample_logo_1: 'mark.png' })).toEqual({
      showCoverPhoto: false,
      showCoverLogo: true,
    })
  })

  it('draws nothing inferred where the pair was switched off with the logo', () => {
    expect(resolveCoverPhotoVisibility({ showCoverLogo: false }, pair)).toEqual({
      showCoverPhoto: false,
      showCoverLogo: false,
    })
  })

  it('takes an explicit switch as the answer and leaves the logo’s own alone', () => {
    expect(resolveCoverPhotoVisibility({ showCoverPhoto: true }, null)).toEqual({
      showCoverPhoto: true,
      showCoverLogo: true,
    })
    expect(resolveCoverPhotoVisibility({ showCoverPhoto: false }, pair)).toEqual({
      showCoverPhoto: false,
      showCoverLogo: true,
    })
  })
})

describe('resolveCoverPhotoConfig', () => {
  it('reads absent and unknown layers as the artwork under the photo', () => {
    expect(resolveCoverPhotoConfig(undefined)).toEqual({ frameLayer: 'under' })
    expect(resolveCoverPhotoConfig({ frameLayer: 'sideways' as never })).toEqual({ frameLayer: 'under' })
    expect(resolveCoverPhotoConfig({ frameLayer: 'over' })).toEqual({ frameLayer: 'over' })
  })
})

describe('resolveCoverPhotoSource', () => {
  const hosts = [{ id: 7, name: 'Dara', profile_image: 'dara.jpg' }]

  it('shows the photo marked as the cover photo, framed by its own region', () => {
    const photos = [
      { id: 1, image: 'a.jpg', is_featured: true },
      { id: 2, image: 'b.jpg', caption: 'Us', is_cover_photo: true, crop_x: 10, crop_y: 20, crop_width: 30, crop_height: 40 },
    ]
    expect(resolveCoverPhotoSource(photos, hosts)).toEqual({
      kind: 'photo',
      image: 'b.jpg',
      crop: { x: 10, y: 20, width: 30, height: 40 },
      photoId: 2,
      hostId: null,
      alt: 'Us',
    })
  })

  it('falls back to the first host’s photo, which has no framing of its own', () => {
    expect(resolveCoverPhotoSource([{ id: 1, image: 'a.jpg', is_cover_photo: false }], hosts)).toEqual({
      kind: 'host',
      image: 'dara.jpg',
      crop: null,
      photoId: null,
      hostId: 7,
      alt: 'Dara',
    })
  })

  it('has nothing to show without either', () => {
    expect(resolveCoverPhotoSource([], [{ id: 7, name: 'Dara', profile_image: null }])).toBeNull()
    expect(resolveCoverPhotoSource(null, null)).toBeNull()
  })
})

describe('coverFramePhotoId', () => {
  const photos = [
    { id: 1, image: 'a.jpg' },
    { id: 2, image: 'b.jpg', is_cover_photo: true },
  ]

  it('names the marked photo while the design draws the frame', () => {
    expect(coverFramePhotoId(photos, { showCoverPhoto: true }, null)).toBe(2)
    // Inferred from the sample-logo pair counts as drawn.
    expect(coverFramePhotoId(photos, {}, { sample_logo_2: 'shape.png' })).toBe(2)
  })

  it('names nothing on a design without a frame, so the photo stays in the gallery', () => {
    expect(coverFramePhotoId(photos, { showCoverPhoto: false }, { sample_logo_2: 'shape.png' })).toBeNull()
    expect(coverFramePhotoId(photos, {}, null)).toBeNull()
  })

  it('names nothing when no photo is marked — the host’s photo is not in the gallery', () => {
    expect(coverFramePhotoId([{ id: 1, image: 'a.jpg' }], { showCoverPhoto: true }, null)).toBeNull()
  })
})

describe('coverPhotoLayout', () => {
  it('fills the whole canvas when there is no shape to cut to', () => {
    expect(coverPhotoLayout(4 / 5, null)).toEqual({
      canvasAspect: 4 / 5,
      window: { left: 0, top: 0, width: 100, height: 100 },
      photoBox: { left: 0, top: 0, width: 100, height: 100 },
      photoAspect: 4 / 5,
    })
    // Neither artwork nor shape: a square.
    expect(coverPhotoLayout(null, null).canvasAspect).toBe(1)
  })

  it('cuts the photo to the shape’s opaque bounds, drawn on the frame’s canvas', () => {
    // A circle 40% of a square canvas, in its middle.
    const layout = coverPhotoLayout(1, { x: 0.3, y: 0.3, width: 0.4, height: 0.4, aspectRatio: 1 })
    expect(layout.window).toEqual({ left: 0, top: 0, width: 100, height: 100 })
    expect(layout.photoBox).toEqual({ left: 30, top: 30, width: 40, height: 40 })
    expect(layout.photoAspect).toBe(1)
  })

  it('takes the shape’s canvas without artwork, and centres a mismatched shape in it', () => {
    expect(coverPhotoLayout(null, { x: 0, y: 0, width: 1, height: 1, aspectRatio: 2 }).canvasAspect).toBe(2)

    // A 2:1 shape image on a square frame: full width, half height, centred.
    const layout = coverPhotoLayout(1, { x: 0, y: 0, width: 1, height: 1, aspectRatio: 2 })
    expect(layout.window).toEqual({ left: 0, top: 25, width: 100, height: 50 })
  })

  it('measures the photo’s box in real pixels, not in the shape image’s ratios', () => {
    // Half the width and all the height of a 2:1 image is a square.
    const layout = coverPhotoLayout(null, { x: 0.25, y: 0, width: 0.5, height: 1, aspectRatio: 2 })
    expect(layout.photoAspect).toBeCloseTo(1)
  })
})

describe('coverPhotoImageRect', () => {
  it('covers a box of the photo’s own shape exactly with the whole image', () => {
    expect(coverPhotoImageRect(FULL_CROP, { width: 800, height: 800 }, 1)).toEqual({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
    })
  })

  it('shows all of the framed region, scaled up and centred on it', () => {
    // The top-left quarter of a square photo, in a square box: twice the size,
    // pinned to the top-left corner.
    const rect = coverPhotoImageRect({ x: 0, y: 0, width: 50, height: 50 }, { width: 800, height: 800 }, 1)
    expect(rect).toEqual({ left: 0, top: 0, width: 200, height: 200 })
  })

  it('waits for the photo’s size', () => {
    expect(coverPhotoImageRect(FULL_CROP, null, 1)).toBeNull()
  })
})
