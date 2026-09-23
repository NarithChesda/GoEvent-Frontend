import {
  MAX_CROP_ZOOM,
  cropToCoverGeometry,
  sanitizeCrop,
  type PhotoCrop,
  type Point,
  type Size,
} from './photoCrop'

/**
 * The framing editor's model: a photo moved and zoomed under a fixed frame, the
 * way the iOS Photos crop tool works — the frame holds still and the photograph
 * slides beneath it.
 *
 * The editor thinks in a *view* (how far in, and which point of the photo is at
 * the frame's centre) because that is what a drag and a pinch change. What it
 * stores is the *region* that view shows — see photoCrop.ts for why a region
 * is right in every other frame too. Everything here depends only on the
 * frame's aspect, never its pixel size, so the editor, the thumbnails and the
 * stage all agree at any scale.
 */
export interface FramingView {
  /** Magnification past a plain `cover` of the frame: 1 … MAX_CROP_ZOOM. */
  zoom: number
  /** The point of the photo at the frame's centre, in % of the photo. */
  centre: Point
}

export const CENTRED_VIEW: Readonly<FramingView> = Object.freeze({
  zoom: 1,
  centre: Object.freeze({ x: 50, y: 50 }),
})

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

/**
 * How much of the photo, in % of each axis, a frame of `frameAspect` shows at
 * `zoom`. At zoom 1 one axis is always 100% — the photo exactly covers the
 * frame that way — which is why a frame the photo's own shape can't move at
 * all until it is zoomed.
 */
export const visibleSpan = (natural: Size, frameAspect: number, zoom: number): Size => {
  const imageAspect = natural.width / natural.height
  const z = Math.max(zoom, Number.EPSILON)
  if (imageAspect >= frameAspect) {
    return { width: ((frameAspect / imageAspect) * 100) / z, height: 100 / z }
  }
  return { width: 100 / z, height: ((imageAspect / frameAspect) * 100) / z }
}

/** The centre, held where the frame can't run off the photo. A span of 100% or
 *  more on an axis (only while a pinch is past its limit) pins that axis. */
export const clampCentre = (centre: Point, span: Size): Point => ({
  x: span.width >= 100 ? 50 : clamp(centre.x, span.width / 2, 100 - span.width / 2),
  y: span.height >= 100 ? 50 : clamp(centre.y, span.height / 2, 100 - span.height / 2),
})

/** A view the frame can actually hold: zoom in range, and no gap at any edge. */
export const clampView = (view: FramingView, natural: Size, frameAspect: number): FramingView => {
  const zoom = clamp(view.zoom, 1, MAX_CROP_ZOOM)
  return { zoom, centre: clampCentre(view.centre, visibleSpan(natural, frameAspect, zoom)) }
}

/** The region a view frames: exactly what the frame is showing. */
export const regionFromView = (
  view: FramingView,
  natural: Size,
  frameAspect: number,
): PhotoCrop => {
  const { zoom, centre } = clampView(view, natural, frameAspect)
  const span = visibleSpan(natural, frameAspect, zoom)
  return sanitizeCrop({
    x: centre.x - span.width / 2,
    y: centre.y - span.height / 2,
    width: span.width,
    height: span.height,
  })
}

/**
 * How a stored region sits in a frame — read back through the renderer itself,
 * so the editor opens on precisely what the stage draws in that frame, whatever
 * shape the region was framed in.
 */
export const viewFromRegion = (
  region: PhotoCrop,
  natural: Size,
  frameAspect: number,
): FramingView => {
  const frame = { width: frameAspect * 1000, height: 1000 }
  const geometry = cropToCoverGeometry(region, natural, frame)
  if (!geometry) return { zoom: 1, centre: { x: 50, y: 50 } }
  const cover = Math.max(frame.width / natural.width, frame.height / natural.height)
  return clampView(
    {
      zoom: geometry.width / natural.width / cover,
      centre: {
        x: ((frame.width / 2 - geometry.left) / geometry.width) * 100,
        y: ((frame.height / 2 - geometry.top) / geometry.height) * 100,
      },
    },
    natural,
    frameAspect,
  )
}

// --- Gesture physics ---------------------------------------------------------
// The same instruments useSwipeRowActions uses, for the same reasons.

/**
 * How far a released flick carries, in the units of `velocity` × seconds — the
 * exponential decay Apple ships, not the textbook v²/2a. 0.99 rather than
 * scrolling's 0.998: this is a small, precise canvas, and a scroll-length throw
 * would overshoot the photo on every flick.
 */
export const projectMomentum = (velocity: number, decelerationRate = 0.99): number =>
  ((velocity / 1000) * decelerationRate) / (1 - decelerationRate)

/**
 * Progressive resistance past a boundary: the photo keeps following the finger,
 * less and less, instead of stopping dead — a hard stop reads as frozen.
 */
export const rubberband = (overshoot: number, dimension: number, constant = 0.55): number =>
  dimension <= 0
    ? 0
    : (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot))

/**
 * The overshoot a displayed (resisted) offset came from — `rubberband`'s exact
 * inverse. A photo grabbed while it is still springing back from past an edge
 * has to resume from the finger's position that would put it there, or the
 * first move re-applies the resistance and it jumps inward.
 */
export const unrubberband = (displayed: number, dimension: number, constant = 0.55): number => {
  if (dimension <= 0) return 0
  // rubberband never reaches `dimension`; hold just short of the asymptote.
  const magnitude = Math.min(Math.abs(displayed), dimension * 0.999)
  return (Math.sign(displayed) * magnitude * dimension) / (constant * (dimension - magnitude))
}
