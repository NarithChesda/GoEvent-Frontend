import { shallowRef, watch, type Ref } from 'vue'

/**
 * Finds the window in an uploaded photo frame, so a photograph can be fitted
 * into it without the partner telling us where it is.
 *
 * A frame is artwork with a hole in it: an ornate ring, a garland, a carved
 * border, transparent in the middle and transparent around the outside. The
 * two transparent regions look identical pixel by pixel. What tells them apart
 * is topology: the outside reaches the image's edge, the window does not. So
 * the outside is flood-filled from the edge, and what transparent area is left
 * over is enclosed by the artwork. The largest such region is the window.
 *
 * A design whose middle is NOT enclosed (corner flowers, a half wreath, a ring
 * with a gap) floods through, has no window, and reports `opening: null`. The
 * caller lays such a design over a drawn shape instead, which is how that kind
 * of artwork is meant to be used anyway.
 *
 * Reading pixels needs the image served with CORS (or same-origin, as a blob
 * URL of a file just picked is), exactly like the cover photo frame's shape
 * mask (useShapeMaskBounds). An image that can't be read measures as `null`,
 * and the caller falls back the same way it does for an open design.
 */

/** A rectangle as ratios of the artwork's natural size, 0–1. */
export interface FrameRect {
  x: number
  y: number
  width: number
  height: number
}

/** What a frame's artwork turned out to be. Measured once per image URL. */
export interface FrameWindow {
  /** naturalWidth ÷ naturalHeight of the whole image. */
  aspectRatio: number
  /** Where anything is drawn at all: the artwork with its empty margin trimmed. */
  ink: FrameRect
  /**
   * The opening the photograph shows through — the largest region the
   * artwork encloses, reaching a little way under the frame's inner edge so
   * no gap opens between the photo and the frame. Null for an open design.
   */
  opening: FrameRect | null
  /** The opening's own outline, as an image to mask the photograph with. Covers exactly `opening`. */
  openingMask: string | null
}

/** A rectangle in sample pixels. */
export interface PixelRect {
  x: number
  y: number
  width: number
  height: number
}

export interface FrameAlphaAnalysis {
  ink: PixelRect
  /** `mask` is row-major over `rect`: 255 where the photograph shows, 0 where it doesn't. */
  opening: { rect: PixelRect; mask: Uint8Array } | null
}

/** A pixel at or above this alpha is part of the artwork; below it, it is a hole. */
const INK_ALPHA = 24

/**
 * Below this the artwork is see-through rather than solid: a shadow or glow
 * baked in along the window's inner edge. The photograph has to run under it,
 * or the shadow composites over the card instead and draws a pale ring between
 * the photo and the frame.
 */
const SOLID_ALPHA = 200

/**
 * The window must be at least this share of the inked area. Anything smaller is
 * a gap between two flourishes of the ornament, not a place for a face.
 */
const MIN_OPENING_SHARE = 0.04

/**
 * How far the photograph runs on under the frame's inner edge, as a share of
 * the image's longer side. Enough to cover the edge's antialiasing at any size
 * the frame is drawn; small enough to stay under all but the thinnest ring.
 */
const TUCK_SHARE = 0.015

/**
 * The window of a frame, from its alpha channel alone. Pure, so it can be
 * tested without a canvas; `alpha` is one byte per pixel, row-major.
 *
 * Returns null for an image with nothing drawn on it.
 */
export function analyzeFrameAlpha(
  alpha: ArrayLike<number>,
  width: number,
  height: number,
): FrameAlphaAnalysis | null {
  const size = width * height
  if (!width || !height || alpha.length < size) return null

  // --- What is drawn at all.
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (alpha[y * width + x] >= INK_ALPHA) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return null
  const ink: PixelRect = { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }

  const queue = new Int32Array(size)
  let head = 0
  let tail = 0

  // --- The outside: every hole reachable from the image's edge. Four-way, the
  // dual of an eight-way stroke — a ring drawn with diagonal steps still
  // closes.
  const outside = new Uint8Array(size)
  const seedOutside = (i: number) => {
    if (!outside[i] && alpha[i] < INK_ALPHA) {
      outside[i] = 1
      queue[tail++] = i
    }
  }
  for (let x = 0; x < width; x++) {
    seedOutside(x)
    seedOutside((height - 1) * width + x)
  }
  for (let y = 0; y < height; y++) {
    seedOutside(y * width)
    seedOutside(y * width + width - 1)
  }
  while (head < tail) {
    const i = queue[head++]
    const x = i % width
    if (x > 0) seedOutside(i - 1)
    if (x < width - 1) seedOutside(i + 1)
    if (i >= width) seedOutside(i - width)
    if (i + width < size) seedOutside(i + width)
  }

  // --- The largest hole the artwork encloses.
  const label = new Int32Array(size)
  let current = 0
  let best = 0
  let bestArea = 0
  const visitHole = (j: number) => {
    if (!label[j] && !outside[j] && alpha[j] < INK_ALPHA) {
      label[j] = current
      queue[tail++] = j
    }
  }
  for (let start = 0; start < size; start++) {
    if (alpha[start] >= INK_ALPHA || outside[start] || label[start]) continue
    current++
    head = 0
    tail = 0
    label[start] = current
    queue[tail++] = start
    while (head < tail) {
      const i = queue[head++]
      const x = i % width
      if (x > 0) visitHole(i - 1)
      if (x < width - 1) visitHole(i + 1)
      if (i >= width) visitHole(i - width)
      if (i + width < size) visitHole(i + width)
    }
    // Every pixel of the hole passed through the queue exactly once.
    if (tail > bestArea) {
      bestArea = tail
      best = current
    }
  }
  if (!best || bestArea < MIN_OPENING_SHARE * ink.width * ink.height) return { ink, opening: null }

  // --- The band the photograph must never enter: the outside, and the one
  // pixel of the frame's outer edge next to it, where the artwork's own
  // antialiasing would let a photo underneath show through.
  const blocked = new Uint8Array(size)
  for (let i = 0; i < size; i++) {
    if (!outside[i]) continue
    const x = i % width
    const y = (i - x) / width
    for (let dy = -1; dy <= 1; dy++) {
      const ny = y + dy
      if (ny < 0 || ny >= height) continue
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx
        if (nx >= 0 && nx < width) blocked[ny * width + nx] = 1
      }
    }
  }

  // --- The window, grown through anything see-through along its edge: a
  // baked inner shadow is part of what the photograph sits behind.
  const opening = new Uint8Array(size)
  const grow = (j: number) => {
    if (!opening[j] && !blocked[j] && alpha[j] < SOLID_ALPHA) {
      opening[j] = 1
      queue[tail++] = j
    }
  }
  head = 0
  tail = 0
  for (let i = 0; i < size; i++) {
    if (label[i] === best) {
      opening[i] = 1
      queue[tail++] = i
    }
  }
  while (head < tail) {
    const i = queue[head++]
    const x = i % width
    if (x > 0) grow(i - 1)
    if (x < width - 1) grow(i + 1)
    if (i >= width) grow(i - width)
    if (i + width < size) grow(i + width)
  }

  // --- Then a few pixels further, under the frame itself, one ring at a time.
  const tuck = Math.max(2, Math.round(TUCK_SHARE * Math.max(width, height)))
  let layer: number[] = []
  for (let i = 0; i < tail; i++) layer.push(queue[i])
  for (let step = 0; step < tuck && layer.length; step++) {
    const next: number[] = []
    for (const i of layer) {
      const x = i % width
      const y = (i - x) / width
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy
        if (ny < 0 || ny >= height) continue
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx
          if (nx < 0 || nx >= width) continue
          const j = ny * width + nx
          if (!opening[j] && !blocked[j]) {
            opening[j] = 1
            next.push(j)
          }
        }
      }
    }
    layer = next
  }

  // --- Its bounds, and its outline over them.
  let oMinX = width
  let oMinY = height
  let oMaxX = -1
  let oMaxY = -1
  for (let i = 0; i < size; i++) {
    if (!opening[i]) continue
    const x = i % width
    const y = (i - x) / width
    if (x < oMinX) oMinX = x
    if (x > oMaxX) oMaxX = x
    if (y < oMinY) oMinY = y
    if (y > oMaxY) oMaxY = y
  }
  const rect: PixelRect = { x: oMinX, y: oMinY, width: oMaxX - oMinX + 1, height: oMaxY - oMinY + 1 }
  const mask = new Uint8Array(rect.width * rect.height)
  for (let y = 0; y < rect.height; y++) {
    for (let x = 0; x < rect.width; x++) {
      if (opening[(rect.y + y) * width + rect.x + x]) mask[y * rect.width + x] = 255
    }
  }

  return { ink, opening: { rect, mask } }
}

/**
 * The longer side the artwork is read at. The window only has to be found to
 * within a pixel or two of a drawn frame a few hundred pixels across, and the
 * mask's edge sits under the frame, so a full-resolution read would buy
 * nothing but time.
 */
const SAMPLE_MAX = 320

const cache = new Map<string, Promise<FrameWindow | null>>()

function maskDataUrl(rect: PixelRect, mask: Uint8Array): string | null {
  const canvas = document.createElement('canvas')
  canvas.width = rect.width
  canvas.height = rect.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const image = ctx.createImageData(rect.width, rect.height)
  for (let i = 0; i < mask.length; i++) image.data[i * 4 + 3] = mask[i]
  ctx.putImageData(image, 0, 0)
  try {
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

function readFrame(image: HTMLImageElement): FrameWindow | null {
  const naturalWidth = image.naturalWidth
  const naturalHeight = image.naturalHeight
  if (!naturalWidth || !naturalHeight) return null

  const scale = Math.min(1, SAMPLE_MAX / Math.max(naturalWidth, naturalHeight))
  const width = Math.max(1, Math.round(naturalWidth * scale))
  const height = Math.max(1, Math.round(naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  let rgba: Uint8ClampedArray
  try {
    ctx.drawImage(image, 0, 0, width, height)
    rgba = ctx.getImageData(0, 0, width, height).data
  } catch {
    // A tainted canvas: the image loaded without CORS headers.
    return null
  }
  const alpha = new Uint8Array(width * height)
  for (let i = 0; i < alpha.length; i++) alpha[i] = rgba[i * 4 + 3]

  const analysis = analyzeFrameAlpha(alpha, width, height)
  if (!analysis) return null

  const toRatio = (rect: PixelRect): FrameRect => ({
    x: rect.x / width,
    y: rect.y / height,
    width: rect.width / width,
    height: rect.height / height,
  })
  // An opening is only any use with the outline to cut the photo to, so the
  // two are reported together or not at all.
  const openingMask = analysis.opening ? maskDataUrl(analysis.opening.rect, analysis.opening.mask) : null

  return {
    aspectRatio: naturalWidth / naturalHeight,
    ink: toRatio(analysis.ink),
    opening: analysis.opening && openingMask ? toRatio(analysis.opening.rect) : null,
    openingMask,
  }
}

function measure(url: string): Promise<FrameWindow | null> {
  const existing = cache.get(url)
  if (existing) return existing

  const promise = new Promise<FrameWindow | null>((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(null)
      return
    }
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.decoding = 'async'
    image.onload = () => resolve(readFrame(image))
    image.onerror = () => resolve(null)
    image.src = url
  }).catch(() => null)

  cache.set(url, promise)
  return promise
}

/**
 * The window of the frame at `url`, measured once per URL and shared by every
 * caller. `settled` tells "still measuring" (draw nothing yet) apart from
 * "could not measure" (fall back), which `frameWindow` alone reports
 * identically as null.
 */
export function useFrameWindow(url: Ref<string | null | undefined>) {
  const frameWindow = shallowRef<FrameWindow | null>(null)
  const settled = shallowRef(false)

  watch(
    url,
    async (next, _prev, onCleanup) => {
      if (!next) {
        frameWindow.value = null
        settled.value = true
        return
      }
      settled.value = false
      let cancelled = false
      onCleanup(() => {
        cancelled = true
      })
      const result = await measure(next)
      if (cancelled) return
      frameWindow.value = result
      settled.value = true
    },
    { immediate: true },
  )

  return { frameWindow, settled }
}
