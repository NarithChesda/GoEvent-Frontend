/**
 * A photo's framed region: the part of it the organizer has said must show.
 *
 * It began as a phone-shaped crop for the one full-screen featured photo. The
 * photo stack then put the same photographs into frames of every shape — a 4:5
 * print, a 3:2 booth frame, a mosaic column taller than 1:3 — and a rectangle
 * of one shape is only ever right for frames of that shape. So the rectangle
 * now means **"everything in here stays visible"**, in any shape, and every
 * frame shows all of it and fills the rest of its own shape with the photo
 * around it (`cropToCoverGeometry`). In the frame it was framed in, that is
 * exactly what the organizer saw; in any other it is that plus more.
 *
 * A stored phone-shaped crop is simply a region that happens to be phone-shaped,
 * so every crop saved before this renders as it always did.
 *
 * Stored as four percentages of the source image, so the values stay correct
 * however the backend re-processes the file (uploads are resized to max
 * 1200x1200 and converted to WebP) and whatever shape the guest's screen is.
 *
 * The default `0 / 0 / 100 / 100` — the whole image — renders identically to
 * the plain `object-fit: cover; object-position: center` this replaces, so
 * photos with no stored crop look exactly as they always have.
 *
 * Backend contract: docs/backend-api-requirements/featured-photo-crop.md
 */

/** A rectangle in percentages of the source image. */
export interface PhotoCrop {
  /** Left edge, 0-100. */
  x: number
  /** Top edge, 0-100. */
  y: number
  /** Width as a percentage of the source image's width. */
  width: number
  /** Height as a percentage of the source image's height. */
  height: number
}

export interface Size {
  width: number
  height: number
}

export interface Point {
  x: number
  y: number
}

/** The whole image — what an unset photo means, and what the stage did before. */
export const FULL_CROP: Readonly<PhotoCrop> = Object.freeze({ x: 0, y: 0, width: 100, height: 100 })

/**
 * The phone every frame is measured on: PreviewFrame's native 390x844 (iPhone
 * 12/13/14 CSS px). A full-screen stage is exactly this shape; the photo
 * stack's frames are fractions of it (see stackFrameAspect).
 */
export const SHOWCASE_FRAME_SIZE: Readonly<Size> = Object.freeze({ width: 390, height: 844 })
export const SHOWCASE_FRAME_ASPECT = SHOWCASE_FRAME_SIZE.width / SHOWCASE_FRAME_SIZE.height

/**
 * How far a photo is ever magnified past a plain `cover` of its frame — the
 * editor's zoom ceiling, and the renderer's.
 *
 * One number serves both because a region never needs more zoom in any frame
 * than it was framed at: framed at zoom z, one of its axes spans exactly 1/z of
 * the photo, so containing it anywhere takes at most z × that frame's cover.
 * The renderer's cap therefore only ever binds on a rectangle that did not come
 * from the editor — and binding zooms OUT, so all of the region still shows.
 */
export const MAX_CROP_ZOOM = 3

/** Below this the rectangle stops being meaningful (and risks dividing by zero). */
const MIN_CROP_PERCENT = 1

/** The crop fields as they travel on an EventPhoto — absent until the backend ships them. */
export interface PhotoCropFields {
  crop_x?: number | null
  crop_y?: number | null
  crop_width?: number | null
  crop_height?: number | null
}

const roundPercent = (value: number): number => Math.round(value * 10) / 10

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

/**
 * Parses one wire value. null / '' are screened before Number(), which would
 * otherwise turn both into a very plausible-looking 0.
 */
const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** Force a rectangle to be a sane, in-bounds crop. */
export const sanitizeCrop = (crop: PhotoCrop): PhotoCrop => {
  const width = clamp(crop.width, MIN_CROP_PERCENT, 100)
  const height = clamp(crop.height, MIN_CROP_PERCENT, 100)
  return {
    x: roundPercent(clamp(crop.x, 0, 100 - width)),
    y: roundPercent(clamp(crop.y, 0, 100 - height)),
    width: roundPercent(width),
    height: roundPercent(height),
  }
}

/**
 * Read a photo's stored crop. All four fields are required together — a
 * half-specified rectangle isn't a rectangle, so anything incomplete or
 * unparseable falls back to the whole image rather than being guessed at.
 */
export const resolvePhotoCrop = (photo?: PhotoCropFields | null): PhotoCrop => {
  const x = toNumber(photo?.crop_x)
  const y = toNumber(photo?.crop_y)
  const width = toNumber(photo?.crop_width)
  const height = toNumber(photo?.crop_height)
  if (x === null || y === null || width === null || height === null) return { ...FULL_CROP }
  if (width < MIN_CROP_PERCENT || height < MIN_CROP_PERCENT) return { ...FULL_CROP }
  return sanitizeCrop({ x, y, width, height })
}

export const isFullCrop = (crop: PhotoCrop): boolean =>
  crop.x === 0 && crop.y === 0 && crop.width === 100 && crop.height === 100

export const cropsEqual = (a: PhotoCrop, b: PhotoCrop): boolean =>
  a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height

/** PATCH body for `/api/events/{id}/photos/{photoId}/`. */
export const toPhotoCropPayload = (crop: PhotoCrop): Required<PhotoCropFields> => {
  const safe = sanitizeCrop(crop)
  return { crop_x: safe.x, crop_y: safe.y, crop_width: safe.width, crop_height: safe.height }
}

/** True once the backend echoes the crop fields back — see the doc for why. */
export const responseSupportsPhotoCrop = (photo?: PhotoCropFields | null): boolean =>
  photo != null && photo.crop_width !== undefined

export const cropCentre = (crop: PhotoCrop): Point => ({
  x: crop.x + crop.width / 2,
  y: crop.y + crop.height / 2,
})

// --- Rendering ---------------------------------------------------------------

/** Absolute geometry for an <img> so that `crop` fills `viewport`. */
export interface CropGeometry {
  left: number
  top: number
  width: number
  height: number
}

export interface CropGeometryOptions {
  /**
   * Share of the frame's height, at its top and again at its bottom, that the
   * region is kept clear of — for a frame whose top and bottom edges fade out
   * (the photo band). The photo still covers the whole frame; only the "all of
   * the region shows" fit moves inward, so a face framed near the top of a
   * photo lands where the photo is still sharp rather than inside the fade.
   * 0, the default, is every other frame and changes nothing.
   */
  insetY?: number
}

/** Past this a frame would have no clear middle left to fit a region into. */
const MAX_INSET_Y = 0.4

/**
 * Lay the image out in a frame so that all of the region shows.
 *
 * The rule is "contain the region, but never less than cover the frame":
 *
 * 1. Scale so the region fits the frame exactly on its binding axis — the
 *    region's height on a frame wider than it, its width on one narrower. All
 *    of it shows; the frame's spare room on the other axis is filled with the
 *    photo around it, centred on the region.
 * 2. Never below `cover`, so there is no empty edge. Where the photo simply
 *    isn't that shape (a portrait photo in a 3:2 frame), the frame shows as
 *    much of the region as the photo allows.
 * 3. Never past MAX_CROP_ZOOM × cover (see there for why that never cuts a
 *    region the editor produced).
 *
 * Then the image is pulled back if centring on the region would expose an edge.
 *
 * In the frame a region was framed in, (1) is an exact fit — the frame shows
 * what the organizer saw. Everywhere else it errs by showing more, never less,
 * which is the benign direction: a portrait framed on a phone keeps the heads
 * and feet on a desktop, and a close crop framed for a 4:5 print keeps both
 * faces in a 3:2 one.
 *
 * For the whole-image default every term reduces to the plain `cover` scale,
 * which is why an uncropped photo renders exactly as it did before this
 * feature existed. For a phone-shaped crop (every crop saved before the photo
 * stack) on any screen at least as wide as a phone, (1) is the crop's height
 * matched to the screen's — the rule this stage has always used.
 *
 * With `insetY` the region is contained in the frame's clear middle instead of
 * the whole frame (see CropGeometryOptions). The inset is symmetric, so that
 * middle shares the frame's centre and the centring below is unchanged.
 *
 * Returns null until both sizes are known — callers fall back to plain
 * `object-fit: cover` for that first frame.
 */
export const cropToCoverGeometry = (
  crop: PhotoCrop,
  natural: Size | null,
  viewport: Size | null,
  options: CropGeometryOptions = {},
): CropGeometry | null => {
  if (!natural?.width || !natural.height || !viewport?.width || !viewport.height) return null

  const safe = sanitizeCrop(crop)
  const cropPixelWidth = (safe.width / 100) * natural.width
  const cropPixelHeight = (safe.height / 100) * natural.height
  if (cropPixelWidth <= 0 || cropPixelHeight <= 0) return null

  const clearHeight = viewport.height * (1 - 2 * clamp(options.insetY ?? 0, 0, MAX_INSET_Y))
  const cover = Math.max(viewport.width / natural.width, viewport.height / natural.height)
  const contain = Math.min(viewport.width / cropPixelWidth, clearHeight / cropPixelHeight)
  const scale = clamp(contain, cover, cover * MAX_CROP_ZOOM)
  const width = natural.width * scale
  const height = natural.height * scale

  const centre = cropCentre(safe)
  // At or above `cover` the image is at least viewport-sized on both axes, so
  // these clamp ranges are never inverted.
  return {
    left: clamp(viewport.width / 2 - (centre.x / 100) * width, viewport.width - width, 0),
    top: clamp(viewport.height / 2 - (centre.y / 100) * height, viewport.height - height, 0),
    width,
    height,
  }
}
