/**
 * Featured-photo crop rectangle.
 *
 * The transition stage shows the featured photo full-screen, so something has
 * to decide which part of it survives. Rather than an anchor point (which can
 * only slide the photo along whichever axis happens to overflow — on a phone
 * that's left/right only, with no way to look further up or down), the
 * organizer draws a phone-shaped rectangle over the photo and the stage renders
 * what's inside it.
 *
 * Stored as four percentages of the source image, so the values stay correct
 * however the backend re-processes the file (uploads are resized to max
 * 1200x1200 and converted to WebP) and whatever shape the guest's screen is.
 *
 * The default `0 / 0 / 100 / 100` — the whole image — renders identically to
 * the plain `object-fit: cover; object-position: center` this replaces, so
 * photos with no stored crop look exactly as they always have.
 *
 * Backend contract (fields still pending server-side):
 * docs/backend-api-requirements/featured-photo-crop.md
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
 * The phone the crop is authored against: PreviewFrame's native 390x844
 * (iPhone 12/13/14 CSS px). The showcase is overwhelmingly viewed on phones,
 * so the crop box is locked to this one shape rather than offering a choice.
 */
export const SHOWCASE_FRAME_SIZE: Readonly<Size> = Object.freeze({ width: 390, height: 844 })
export const SHOWCASE_FRAME_ASPECT = SHOWCASE_FRAME_SIZE.width / SHOWCASE_FRAME_SIZE.height

/** How far in the organizer may crop, relative to the largest box that fits. */
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

// --- Aspect-locked sizing ----------------------------------------------------

/**
 * The largest rectangle of `aspect` (width/height, in *rendered pixels*) that
 * fits inside the image. One of the two dimensions always comes out at 100%:
 * a phone-shaped box over a landscape photo spans its full height, and over a
 * very tall photo its full width.
 *
 * This is why resizing matters rather than being a nicety — at maximum size the
 * box is pinned on one axis and can only slide along the other. Shrinking it is
 * what creates room to move the other way.
 */
export const maxCropSizeForAspect = (natural: Size, aspect: number): Size => {
  if (!natural.width || !natural.height) return { width: 100, height: 100 }
  const widthAtFullHeight = ((natural.height * aspect) / natural.width) * 100
  if (widthAtFullHeight <= 100) return { width: widthAtFullHeight, height: 100 }
  return { width: 100, height: (natural.width / aspect / natural.height) * 100 }
}

/** Zoom 1 = the largest box that fits; 2 = half that size, and so on. */
export const cropZoom = (crop: PhotoCrop, natural: Size, aspect: number): number => {
  const max = maxCropSizeForAspect(natural, aspect)
  if (crop.height <= 0) return 1
  return clamp(max.height / crop.height, 1, MAX_CROP_ZOOM)
}

/** Build an aspect-locked crop at `zoom`, centred on `centre`. */
export const cropFromZoom = (
  natural: Size,
  aspect: number,
  zoom: number,
  centre: Point = { x: 50, y: 50 },
): PhotoCrop => {
  const max = maxCropSizeForAspect(natural, aspect)
  const safeZoom = clamp(zoom, 1, MAX_CROP_ZOOM)
  const width = max.width / safeZoom
  const height = max.height / safeZoom
  return sanitizeCrop({ x: centre.x - width / 2, y: centre.y - height / 2, width, height })
}

/** Slide the crop without resizing it, stopping at the image's edges. */
export const moveCrop = (crop: PhotoCrop, deltaX: number, deltaY: number): PhotoCrop =>
  sanitizeCrop({ ...crop, x: crop.x + deltaX, y: crop.y + deltaY })

export type CropCorner = 'nw' | 'ne' | 'sw' | 'se'

/**
 * Resize by dragging one corner, with the opposite corner pinned and the aspect
 * locked. `pointer` is in image percentage coordinates.
 *
 * Aspect-locked means one size degree of freedom, so the two axes of the drag
 * have to be reconciled: whichever asks for the bigger box wins, which is what
 * makes a diagonal drag feel like it follows the cursor.
 */
export const resizeCropFromCorner = (
  crop: PhotoCrop,
  natural: Size,
  aspect: number,
  corner: CropCorner,
  pointer: Point,
): PhotoCrop => {
  const max = maxCropSizeForAspect(natural, aspect)
  const growsLeft = corner === 'nw' || corner === 'sw'
  const growsUp = corner === 'nw' || corner === 'ne'
  const anchorX = growsLeft ? crop.x + crop.width : crop.x
  const anchorY = growsUp ? crop.y + crop.height : crop.y

  /** Convert a wanted height into the width that the aspect lock implies. */
  const widthForHeight = (height: number) => (height / max.height) * max.width

  let width = Math.max(Math.abs(pointer.x - anchorX), widthForHeight(Math.abs(pointer.y - anchorY)))

  // Can't grow past the image edges, past the largest fitting box, or below the
  // zoom ceiling.
  const roomX = growsLeft ? anchorX : 100 - anchorX
  const roomY = growsUp ? anchorY : 100 - anchorY
  width = Math.min(width, roomX, widthForHeight(roomY), max.width)
  width = Math.max(width, max.width / MAX_CROP_ZOOM)

  const height = (width / max.width) * max.height
  return sanitizeCrop({
    x: growsLeft ? anchorX - width : anchorX,
    y: growsUp ? anchorY - height : anchorY,
    width,
    height,
  })
}

// --- Rendering ---------------------------------------------------------------

/** Absolute geometry for an <img> so that `crop` fills `viewport`. */
export interface CropGeometry {
  left: number
  top: number
  width: number
  height: number
}

/**
 * Lay the image out so the cropped region fills the viewport.
 *
 * The crop is authored on a phone, but guests turn up on other shapes, so a
 * rule is needed for what gives. This one matches the crop's **height** to the
 * viewport's and centres on the crop, then pulls the image back if that would
 * expose an edge.
 *
 * Height-priority rather than "cover the viewport with the crop": the crop is
 * always phone-portrait-shaped, so its height is where the subject lives.
 * Covering would make the crop's *width* bind on a wide screen and slice the
 * top and bottom off the chosen region — a portrait of a person loses their
 * head and feet on a desktop browser. Matching height instead keeps everything
 * the organizer framed and reveals more of the photo sideways, which is the
 * benign direction to be wrong in.
 *
 * The second term keeps the image covering the viewport horizontally, so there
 * is never an empty edge. For the whole-image default both terms reduce to the
 * plain `cover` scale, which is why an uncropped photo renders exactly as it
 * did before this feature existed.
 *
 * Returns null until both sizes are known — callers fall back to plain
 * `object-fit: cover` for that first frame.
 */
export const cropToCoverGeometry = (
  crop: PhotoCrop,
  natural: Size | null,
  viewport: Size | null,
): CropGeometry | null => {
  if (!natural?.width || !natural.height || !viewport?.width || !viewport.height) return null

  const safe = sanitizeCrop(crop)
  const cropPixelWidth = (safe.width / 100) * natural.width
  const cropPixelHeight = (safe.height / 100) * natural.height
  if (cropPixelWidth <= 0 || cropPixelHeight <= 0) return null

  const scale = Math.max(viewport.height / cropPixelHeight, viewport.width / natural.width)
  const width = natural.width * scale
  const height = natural.height * scale

  const centre = cropCentre(safe)
  // The image is always at least viewport-sized here (it contains the crop,
  // which covers the viewport), so these clamp ranges are never inverted.
  return {
    left: clamp(viewport.width / 2 - (centre.x / 100) * width, viewport.width - width, 0),
    top: clamp(viewport.height / 2 - (centre.y / 100) * height, viewport.height - height, 0),
    width,
    height,
  }
}
