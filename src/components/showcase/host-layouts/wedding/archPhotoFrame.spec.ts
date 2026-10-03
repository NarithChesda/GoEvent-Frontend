import { describe, expect, it } from 'vitest'
import type { FrameWindow } from '@/composables/showcase/useFrameWindow'
import {
  POINTED_FRAME_MASK,
  POINTED_FRAME_PATH,
  frameArtLayout,
  resolveCaptionPlacement,
  resolveFrameArt,
  resolvePhotoFrame,
} from './archPhotoFrame'

/** A frame drawn in the middle 80% of a square image, with a window in the middle 40%. */
const RING: FrameWindow = {
  aspectRatio: 1,
  ink: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
  opening: { x: 0.3, y: 0.3, width: 0.4, height: 0.4 },
  openingMask: 'data:image/png;base64,AAAA',
}

describe('the arch design config', () => {
  it('draws every shape it knows, and the round arch for anything else', () => {
    expect(resolvePhotoFrame('pointed')).toBe('pointed')
    expect(resolvePhotoFrame('rectangle')).toBe('rectangle')
    expect(resolvePhotoFrame(undefined)).toBe('arch')
    expect(resolvePhotoFrame('hexagon')).toBe('arch')
  })

  it('keeps the names underneath unless told to set them beside', () => {
    expect(resolveCaptionPlacement('beside')).toBe('beside')
    expect(resolveCaptionPlacement(undefined)).toBe('below')
    expect(resolveCaptionPlacement('above')).toBe('below')
  })

  it('cuts the pointed window with the very path its hairlines are drawn as', () => {
    expect(POINTED_FRAME_MASK.startsWith('url("data:image/svg+xml,')).toBe(true)
    expect(decodeURIComponent(POINTED_FRAME_MASK)).toContain(POINTED_FRAME_PATH)
  })
})

describe('frameArtLayout', () => {
  it('trims the artwork to what is drawn, and places the window inside that', () => {
    const layout = frameArtLayout(RING)!
    const expectBox = (box: Record<string, number>, expected: Record<string, number>) => {
      for (const [key, value] of Object.entries(expected)) expect(box[key]).toBeCloseTo(value, 9)
    }

    expect(layout.aspect).toBeCloseTo(1, 9)
    // The image is a quarter larger than the box, so its margin falls outside.
    expectBox({ ...layout.image }, { left: -12.5, top: -12.5, width: 125, height: 125 })
    expectBox({ ...layout.opening }, { left: 25, top: 25, width: 50, height: 50 })
  })

  it("takes the box's shape from the drawn area in real pixels, not ratios", () => {
    // A 2:1 image whose drawing fills its left half: a square frame.
    const layout = frameArtLayout({
      ...RING,
      aspectRatio: 2,
      ink: { x: 0, y: 0, width: 0.5, height: 1 },
      opening: { x: 0.1, y: 0.2, width: 0.3, height: 0.6 },
    })
    expect(layout?.aspect).toBe(1)
  })

  it('has no layout for a frame without a window', () => {
    expect(frameArtLayout({ ...RING, opening: null, openingMask: null })).toBeNull()
  })
})

describe('resolveFrameArt', () => {
  const URL = 'https://cdn.example/frame.png'

  it('is nothing without an upload', () => {
    expect(resolveFrameArt(null, true, null)).toBeNull()
  })

  it('holds the frame back while the artwork is still being measured', () => {
    expect(resolveFrameArt(URL, false, null)).toEqual({ mode: 'pending', url: URL })
  })

  it('fits the photo into a window the artwork encloses', () => {
    const art = resolveFrameArt(URL, true, RING)
    expect(art?.mode).toBe('window')
    expect(art).toMatchObject({ url: URL, mask: RING.openingMask })
  })

  it('lays an open design, or one that could not be read, over the drawn shape', () => {
    expect(resolveFrameArt(URL, true, { ...RING, opening: null, openingMask: null })).toEqual({
      mode: 'overlay',
      url: URL,
    })
    expect(resolveFrameArt(URL, true, null)).toEqual({ mode: 'overlay', url: URL })
  })
})
