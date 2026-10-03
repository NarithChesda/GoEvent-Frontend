import { describe, expect, it } from 'vitest'
import { analyzeFrameAlpha } from './useFrameWindow'

/**
 * The window search, on synthetic alpha maps. Every frame here is 100 × 100,
 * which puts the tuck under the frame's inner edge at its 2px floor.
 */
const SIZE = 100

/** An alpha map painted by `alphaAt(x, y)`. */
function paint(alphaAt: (x: number, y: number) => number): Uint8Array {
  const alpha = new Uint8Array(SIZE * SIZE)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) alpha[y * SIZE + x] = alphaAt(x, y)
  }
  return alpha
}

/** Inside the square [from, to] on both axes. */
const within = (x: number, y: number, from: number, to: number) =>
  x >= from && x <= to && y >= from && y <= to

/** A solid square ring: drawn from `outer` inward, open from `inner` inward. */
const ring = (outer: number, inner: number) => (x: number, y: number) =>
  within(x, y, outer, SIZE - 1 - outer) && !within(x, y, inner, SIZE - 1 - inner) ? 255 : 0

describe('analyzeFrameAlpha', () => {
  it('finds the window a closed frame encloses, reaching just under its inner edge', () => {
    const result = analyzeFrameAlpha(paint(ring(10, 30)), SIZE, SIZE)

    // The artwork with its empty margin trimmed.
    expect(result?.ink).toEqual({ x: 10, y: 10, width: 80, height: 80 })
    // The 40px hole, tucked 2px under the frame on every side.
    expect(result?.opening?.rect).toEqual({ x: 28, y: 28, width: 44, height: 44 })
  })

  it('outlines the window exactly, corners included', () => {
    const opening = analyzeFrameAlpha(paint(ring(10, 30)), SIZE, SIZE)?.opening
    const { rect, mask } = opening!
    const at = (x: number, y: number) => mask[(y - rect.y) * rect.width + (x - rect.x)]

    expect(at(50, 50)).toBe(255)
    expect(at(rect.x, rect.y)).toBe(255)
    expect(mask.every((value) => value === 255)).toBe(true)
  })

  it('reports no window for an open design, whose middle reaches the outside', () => {
    // The same ring with a gap cut through its top side.
    const gapped = paint((x, y) => (x >= 48 && x <= 51 && y < 30 ? 0 : ring(10, 30)(x, y)))
    const result = analyzeFrameAlpha(gapped, SIZE, SIZE)

    expect(result?.ink).toEqual({ x: 10, y: 10, width: 80, height: 80 })
    expect(result?.opening).toBeNull()
  })

  it('does not mistake a gap in the ornament for the window', () => {
    // A solid plate with a 3 × 3 hole: enclosed, but no place for a face.
    const plate = paint((x, y) => (within(x, y, 10, 89) && !within(x, y, 49, 51) ? 255 : 0))

    expect(analyzeFrameAlpha(plate, SIZE, SIZE)?.opening).toBeNull()
  })

  it('takes the largest enclosed hole when there are several', () => {
    const twoHoles = paint((x, y) => {
      if (!within(x, y, 10, 89)) return 0
      const big = x >= 20 && x <= 59 && y >= 20 && y <= 79
      const small = x >= 70 && x <= 79 && y >= 20 && y <= 39
      return big || small ? 0 : 255
    })
    const rect = analyzeFrameAlpha(twoHoles, SIZE, SIZE)?.opening?.rect

    expect(rect).toEqual({ x: 18, y: 18, width: 44, height: 64 })
  })

  it('runs the photo under a shadow baked in along the window, not just the clear middle', () => {
    // Solid to 29, a see-through shadow from 30 to 34, clear from 35.
    const shadowed = paint((x, y) => {
      if (!within(x, y, 10, 89)) return 0
      if (!within(x, y, 30, 69)) return 255
      return within(x, y, 35, 64) ? 0 : 100
    })

    // Without the shadow the window would start at 33; through it, at 28.
    expect(analyzeFrameAlpha(shadowed, SIZE, SIZE)?.opening?.rect.x).toBe(28)
  })

  it("never tucks the photo into the frame's outer edge, however thin the frame", () => {
    // A 3px frame: the tuck reaches its inner two pixels, never the outermost.
    const thin = analyzeFrameAlpha(paint(ring(10, 13)), SIZE, SIZE)

    expect(thin?.opening?.rect).toEqual({ x: 11, y: 11, width: 78, height: 78 })
  })

  it('reports nothing for an image with nothing drawn on it', () => {
    expect(analyzeFrameAlpha(new Uint8Array(SIZE * SIZE), SIZE, SIZE)).toBeNull()
  })
})
