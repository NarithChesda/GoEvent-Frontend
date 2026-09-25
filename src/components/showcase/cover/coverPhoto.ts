/**
 * The cover's photo frame: one of the event's photographs, cut to a shape the
 * template supplies and set in the template's frame artwork.
 *
 * It began as a birthday-only trick in the logo row. `sample_logo_1` was drawn
 * as the logo, `sample_logo_2` was laid over it, and the first host's photo was
 * clipped to `sample_logo_2`'s opaque pixels. So the "logo" was really a photo
 * frame, and it could not sit anywhere except where the logo sat, be sized
 * except by the logo row's height, or show anything but the first host's
 * profile photo, positioned by template-wide X/Y sliders. It is now a block of
 * its own (`photo`), placed by its own box in both layout modes, with artwork
 * of its own and a photograph the organizer chooses and frames.
 *
 * Everything that is data rather than markup lives here, so CoverPhotoFrame.vue
 * is only the drawing and every rule can be tested without mounting it.
 *
 * Backend contract: docs/backend-api-requirements/cover-photo-frame.md
 */
import type { CoverPhotoFields } from '@/services/api/types/event.types'
import type {
  CoverPhotoConfig,
  CoverPhotoFrameLayer,
  CoverStageLayout,
} from '@/services/api/types/template.types'
import {
  cropToCoverGeometry,
  resolvePhotoCrop,
  type PhotoCrop,
  type PhotoCropFields,
  type Size,
} from '@/utils/photoCrop'

// --- Config ------------------------------------------------------------------

export const COVER_PHOTO_FRAME_LAYERS: readonly CoverPhotoFrameLayer[] = ['under', 'over']

/** The artwork under the photograph: what the sample-logo pair always drew. */
export const COVER_PHOTO_DEFAULTS: Required<CoverPhotoConfig> = {
  frameLayer: 'under',
}

/** Every field filled in, and an option this build doesn't know read as the default. */
export function resolveCoverPhotoConfig(
  config: CoverPhotoConfig | null | undefined,
): Required<CoverPhotoConfig> {
  const layer = config?.frameLayer
  return {
    frameLayer: (COVER_PHOTO_FRAME_LAYERS as readonly unknown[]).includes(layer)
      ? (layer as CoverPhotoFrameLayer)
      : COVER_PHOTO_DEFAULTS.frameLayer,
  }
}

// --- Artwork -------------------------------------------------------------------

/** The template's image fields the frame can draw from, as they travel (raw URLs). */
export interface CoverPhotoArtSources {
  cover_photo_frame_image?: string | null
  cover_photo_shape_image?: string | null
  sample_logo_1?: string | null
  sample_logo_2?: string | null
}

export interface CoverPhotoArt {
  /** Drawn behind or in front of the photograph (`frameLayer`). */
  frame: string | null
  /** Its opaque pixels are where the photograph shows. */
  shape: string | null
  /** The artwork is the legacy sample-logo pair, not an upload of its own. */
  fromSampleLogos: boolean
}

/**
 * Which images the frame is made of.
 *
 * The dedicated pair wins, and it wins AS A PAIR: once a template uploads
 * either of its own frame or shape, the sample logos stop being frame artwork
 * altogether. Mixing one new image with one legacy one would pair art that was
 * never drawn to line up.
 *
 * Without either upload, the sample logos are frame artwork only while
 * `sample_logo_2` exists. That image never did anything but shape the photo, so
 * a template carrying it was using the pair. A template with `sample_logo_1`
 * alone was using it as what it is named: the logo's placeholder, which the
 * frame must not borrow.
 */
export function coverPhotoArt(assets: CoverPhotoArtSources | null | undefined): CoverPhotoArt {
  const frame = assets?.cover_photo_frame_image || null
  const shape = assets?.cover_photo_shape_image || null
  if (frame || shape) return { frame, shape, fromSampleLogos: false }

  const legacyShape = assets?.sample_logo_2 || null
  if (!legacyShape) return { frame: null, shape: null, fromSampleLogos: false }
  return { frame: assets?.sample_logo_1 || null, shape: legacyShape, fromSampleLogos: true }
}

// --- Whether it draws ------------------------------------------------------------

export interface CoverPhotoVisibility {
  showCoverPhoto: boolean
  showCoverLogo: boolean
}

/**
 * Whether the photo frame and the logo are drawn.
 *
 * An explicit `showCoverPhoto` is the answer, and leaves the logo's own switch
 * alone. Absent means infer, from the one configuration that already drew a
 * photograph on the cover: the sample-logo pair (`sample_logo_2`) with the logo
 * switched on. That pair WAS the logo row, so a template inferred onto the
 * photo frame has its logo off, and the frame takes the logo row's place
 * (rowsToCoverElements seeds the photo's box from it). Nothing moves.
 *
 * The inference never yields a frame for a template without the pair, so no
 * other published template gains one. It is the only implementation of this
 * table: the cover, the preview's drag overlay and the partner form's seed all
 * go through it.
 */
export function resolveCoverPhotoVisibility(
  layout: Pick<CoverStageLayout, 'showCoverPhoto' | 'showCoverLogo'> | null | undefined,
  assets: CoverPhotoArtSources | null | undefined,
): CoverPhotoVisibility {
  const showCoverLogo = layout?.showCoverLogo ?? true
  if (typeof layout?.showCoverPhoto === 'boolean') {
    return { showCoverPhoto: layout.showCoverPhoto, showCoverLogo }
  }
  const inferred = showCoverLogo && !!assets?.sample_logo_2
  return { showCoverPhoto: inferred, showCoverLogo: inferred ? false : showCoverLogo }
}

// --- Which photograph ------------------------------------------------------------

/** A photo as the showcase carries it — only what choosing one needs. */
export type CoverPhotoCandidate = { id: number; image: string; caption?: string | null } & CoverPhotoFields &
  PhotoCropFields

/** A host as the showcase carries it — only what the fallback needs. */
export interface CoverPhotoHost {
  id?: number | null
  name?: string | null
  profile_image?: string | null
}

/** The photograph the frame shows, and where it came from. */
export interface CoverPhotoSource {
  /**
   * `photo`: the gallery photo the organizer marked, framed by its own region.
   * `host`: the first host's profile photo, the fallback until one is marked;
   * hosts carry no framing, so it is placed by the template's host offsets.
   */
  kind: 'photo' | 'host'
  /** As stored, before getMediaUrl. */
  image: string
  /** The framed region. Null for a host photo. */
  crop: PhotoCrop | null
  photoId: number | null
  hostId: number | null
  alt: string
}

/**
 * The marked photo, else the first host's profile photo, else nothing. First
 * marked photo in the order given, should a backend ever let two through.
 */
export function resolveCoverPhotoSource(
  photos: readonly CoverPhotoCandidate[] | null | undefined,
  hosts: readonly CoverPhotoHost[] | null | undefined,
): CoverPhotoSource | null {
  const chosen = photos?.find((photo) => photo.is_cover_photo === true && !!photo.image)
  if (chosen) {
    return {
      kind: 'photo',
      image: chosen.image,
      crop: resolvePhotoCrop(chosen),
      photoId: chosen.id,
      hostId: null,
      alt: chosen.caption || '',
    }
  }
  const host = hosts?.[0]
  if (host?.profile_image) {
    return {
      kind: 'host',
      image: host.profile_image,
      crop: null,
      photoId: null,
      hostId: host.id ?? null,
      alt: host.name || '',
    }
  }
  return null
}

/**
 * The photo the cover's frame is drawing — the one that leaves the gallery, so
 * the invitation never shows the same photograph twice (the rule a band photo
 * follows). Null while the design draws no frame: a marked photo is then shown
 * nowhere else, and taking it out of the gallery would lose it altogether. So
 * switching to a design without a frame puts it back, and one with a frame
 * takes it out again, with nothing stored changing.
 */
export function coverFramePhotoId(
  photos: readonly CoverPhotoCandidate[] | null | undefined,
  layout: Pick<CoverStageLayout, 'showCoverPhoto' | 'showCoverLogo'> | null | undefined,
  assets: CoverPhotoArtSources | null | undefined,
): number | null {
  if (!resolveCoverPhotoVisibility(layout, assets).showCoverPhoto) return null
  return resolveCoverPhotoSource(photos, null)?.photoId ?? null
}

/** The PATCH body that makes a photo the cover photo, or stops it being one. */
export const coverPhotoPayload = (isCover: boolean): Required<CoverPhotoFields> => ({
  is_cover_photo: isCover,
})

/** True once the backend echoes the field back — a server that doesn't know it drops it and answers 200. */
export const responseSupportsCoverPhoto = (photo?: CoverPhotoFields | null): boolean =>
  photo != null && photo.is_cover_photo !== undefined

// --- Geometry --------------------------------------------------------------------

/** A shape image's opaque bounding box — useShapeMaskBounds' result. */
export interface CoverPhotoShapeBounds {
  /** Ratios of the shape image's natural size, 0–1. */
  x: number
  y: number
  width: number
  height: number
  /** naturalWidth / naturalHeight of the whole shape image. */
  aspectRatio: number
}

/** A rectangle in percentages of its container. */
export interface PercentRect {
  left: number
  top: number
  width: number
  height: number
}

const FULL_RECT: Readonly<PercentRect> = Object.freeze({ left: 0, top: 0, width: 100, height: 100 })

export interface CoverPhotoLayout {
  /** Width ÷ height of the whole composition. */
  canvasAspect: number
  /** Where the shape image sits in the composition, % of the canvas. */
  window: PercentRect
  /** Where the photograph goes inside the shape image, % of the window. */
  photoBox: PercentRect
  /**
   * Width ÷ height of the photograph's box in real pixels — the shape the
   * organizer frames the photo in, and the one the renderer fits it to.
   */
  photoAspect: number
}

const validAspect = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0

/**
 * How the composition is laid out, from the frame artwork's aspect and the
 * shape's opaque bounds. Both are optional.
 *
 * The canvas takes the artwork's shape, as the sample-logo stack did: the pair
 * was drawn on one canvas, and the artwork is what the eye reads as the frame.
 * The shape image is fitted inside it, centred — exactly aligned when the two
 * were drawn on the same canvas, which is how they are made. With no artwork
 * the canvas is the shape's own; with neither it is square.
 *
 * The photograph fills the shape's opaque bounding box rather than the whole
 * shape image: a round window drawn in the middle of a large transparent canvas
 * would otherwise spend most of the photo on pixels the mask throws away.
 */
export function coverPhotoLayout(
  frameAspect: number | null | undefined,
  shape: CoverPhotoShapeBounds | null | undefined,
): CoverPhotoLayout {
  const shapeAspect = shape && validAspect(shape.aspectRatio) ? shape.aspectRatio : null
  const canvasAspect = validAspect(frameAspect) ? frameAspect : (shapeAspect ?? 1)

  if (!shape || !shapeAspect) {
    return { canvasAspect, window: { ...FULL_RECT }, photoBox: { ...FULL_RECT }, photoAspect: canvasAspect }
  }

  // The shape image, contained in the canvas and centred on it.
  const wider = shapeAspect >= canvasAspect
  const width = wider ? 100 : (shapeAspect / canvasAspect) * 100
  const height = wider ? (canvasAspect / shapeAspect) * 100 : 100
  const windowRect: PercentRect = { left: (100 - width) / 2, top: (100 - height) / 2, width, height }

  const photoBox: PercentRect = {
    left: shape.x * 100,
    top: shape.y * 100,
    width: shape.width * 100,
    height: shape.height * 100,
  }
  const photoAspect =
    shape.height > 0 && shape.width > 0 ? (shape.width / shape.height) * shapeAspect : shapeAspect

  return { canvasAspect, window: windowRect, photoBox, photoAspect }
}

/**
 * Where the photograph's <img> goes inside its box, in % of the box, so that
 * all of the framed region shows (cropToCoverGeometry, the renderer every
 * photo frame in the showcase shares). Percentages rather than pixels because
 * the geometry depends only on the box's shape, and a percentage survives
 * every resize without being measured again.
 *
 * Null until the photo's natural size is known; the caller covers the box
 * meanwhile, which is what the whole-image default resolves to anyway.
 */
export function coverPhotoImageRect(
  crop: PhotoCrop,
  natural: Size | null,
  photoAspect: number,
): PercentRect | null {
  if (!validAspect(photoAspect)) return null
  const frame = { width: photoAspect * 1000, height: 1000 }
  const geometry = cropToCoverGeometry(crop, natural, frame)
  if (!geometry) return null
  return {
    left: (geometry.left / frame.width) * 100,
    top: (geometry.top / frame.height) * 100,
    width: (geometry.width / frame.width) * 100,
    height: (geometry.height / frame.height) * 100,
  }
}

// --- Binding ---------------------------------------------------------------------

/**
 * Everything CoverPhotoFrame draws from, as one bindable object — built once
 * by the cover overlay and handed to its own copy and to both door leaves,
 * the way CoverDetailBlocksBinding is.
 */
export interface CoverPhotoFrameBinding {
  /** The block's box, resolved by useCoverStageLayout (elementStyles.photo). */
  boxStyle: Record<string, string>
  /** Full URLs. */
  frameUrl: string | null
  shapeUrl: string | null
  frameLayer: CoverPhotoFrameLayer
  photo: CoverPhotoSource | null
  /** `photo.image`, already a full URL. */
  photoUrl: string | null
  /** Where a host photo sits in the shape (hostClipOffsetX/Y), in %. */
  hostOffset: { x: number; y: number }
  eventTitle: string
}
