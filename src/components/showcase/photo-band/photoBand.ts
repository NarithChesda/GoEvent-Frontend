/**
 * Photo bands: the event's photographs drawn full width across the invitation
 * card, each after a section of the organizer's choosing, its top and bottom
 * dissolving into the page through a blur.
 *
 * A band is a setting on the photo, beside `is_featured` and its `crop_*`
 * framing: a photo with a `band_placement` is drawn as a band after that
 * section and leaves the gallery. So any number of photos can be bands, and the
 * gallery never shows the same photograph twice.
 *
 * Everything that is data rather than markup lives here — reading the photos'
 * settings and the gradients the layers are masked with — so PhotoBand.vue is
 * only the drawing, and the numbers can be tested and tuned in one place.
 *
 * Backend contract: docs/backend-api-requirements/photo-band.md
 */
import type { PhotoBandFields, PhotoBandPlacement } from '@/services/api/types/event.types'
import { resolvePhotoCrop, type PhotoCrop, type PhotoCropFields } from '@/utils/photoCrop'

/** Width ÷ height. Portrait, because the fades spend a share of the height. */
export const PHOTO_BAND_ASPECT = 4 / 5

/** How far each fade reaches into the band, as a share of its height. */
export const PHOTO_BAND_FADE = 0.22

/**
 * How much of the band's height, top and bottom, the organizer's framed
 * region is kept out of (`cropToCoverGeometry`'s `insetY`). About half the
 * fade: past that point the photo is still mostly sharp, so a face that lands
 * there reads, while one in the outer half would be dissolving.
 */
export const PHOTO_BAND_INSET_Y = 0.12

/**
 * The shape the organizer frames in: the band's clear middle, between the two
 * insets. The renderer fits the framed region into exactly that window, so
 * what is framed is what shows sharp, and the fades add a little more of the
 * photo above and below it.
 */
export const PHOTO_BAND_FRAME_ASPECT = PHOTO_BAND_ASPECT / (1 - 2 * PHOTO_BAND_INSET_Y)

/** Blur radii for the two soft copies, in CSS px. */
export const PHOTO_BAND_BLUR = { far: 14, mid: 5 } as const

/** The sections a band can follow, in the order the invitation draws them. */
export const PHOTO_BAND_PLACEMENTS: readonly PhotoBandPlacement[] = [
  'top',
  'after_hosts',
  'after_event_info',
  'after_dress_code',
  'after_agenda',
  'after_host_message',
  'after_video',
  'after_gallery',
  'after_payment',
  'after_comments',
]

/**
 * Where a new band goes first, and where a placement this build doesn't know
 * (a section added later) is drawn: straight after the date, venue and RSVP.
 */
export const DEFAULT_PHOTO_BAND_PLACEMENT: PhotoBandPlacement = 'after_event_info'

// --- Reading a photo's settings ---------------------------------------------

const HEX_COLOR = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

/** `#rgb` / `#rrggbb`, with or without the hash → lowercase `#rrggbb`; anything else → null. */
export const normalizeBlendColor = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const match = HEX_COLOR.exec(value.trim())
  if (!match) return null
  const hex = match[1].toLowerCase()
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex
  return `#${full}`
}

/**
 * Where a photo's band goes, or null for an ordinary gallery photo. Any other
 * non-empty value is a section this build doesn't know yet, and is drawn at
 * the default rather than dropped — a photo the organizer took out of the
 * gallery must not vanish from the invitation altogether.
 */
export const photoBandPlacement = (photo: PhotoBandFields | null | undefined): PhotoBandPlacement | null => {
  const value: unknown = photo?.band_placement
  if (typeof value !== 'string' || !value.trim()) return null
  return (PHOTO_BAND_PLACEMENTS as readonly string[]).includes(value)
    ? (value as PhotoBandPlacement)
    : DEFAULT_PHOTO_BAND_PLACEMENT
}

export const isPhotoBand = (photo: PhotoBandFields | null | undefined): boolean =>
  photoBandPlacement(photo) !== null

/**
 * The gallery's photos: every photo that isn't a band, in the order given —
 * nor any photo another block is drawing, for the same reason: the cover's
 * photo frame (`coverFramePhotoId`), the countdown's strips
 * (`countdownStripsPhotoId`). Each is passed as an id, or null when that block
 * isn't drawing a photo of its own.
 */
export const galleryPhotosOf = <P extends PhotoBandFields & { id?: number }>(
  photos: readonly P[] | null | undefined,
  ...drawnElsewhere: (number | null)[]
): P[] => {
  const taken = new Set(drawnElsewhere.filter((id): id is number => id !== null))
  return (photos ?? []).filter(
    (photo) => !isPhotoBand(photo) && (photo.id === undefined || !taken.has(photo.id)),
  )
}

export interface ResolvedPhotoBand<P> {
  /** The photo's id — one photo is at most one band. */
  id: number
  photo: P
  blendColor: string | null
  placement: PhotoBandPlacement
  /** The photo's own framing: the one region every frame it is drawn in shows. */
  crop: PhotoCrop
}

/** What the invitation draws as bands, in the order given (the gallery's). */
export const resolvePhotoBands = <P extends { id: number } & PhotoBandFields & PhotoCropFields>(
  photos: readonly P[] | null | undefined,
): ResolvedPhotoBand<P>[] =>
  (photos ?? []).flatMap((photo) => {
    const placement = photoBandPlacement(photo)
    if (!placement) return []
    return [
      {
        id: photo.id,
        photo,
        blendColor: normalizeBlendColor(photo.band_blend_color),
        placement,
        crop: resolvePhotoCrop(photo),
      },
    ]
  })

/** The PATCH body that makes a photo a band — or, with no placement, a gallery photo again. */
export const photoBandPayload = (
  placement: PhotoBandPlacement | null,
  blendColor: string | null = null,
): Required<PhotoBandFields> => ({
  band_placement: placement,
  band_blend_color: placement ? normalizeBlendColor(blendColor) : null,
})

/** True once the backend echoes the band fields back — see the doc for why. */
export const responseSupportsPhotoBand = (photo?: PhotoBandFields | null): boolean =>
  photo != null && photo.band_placement !== undefined

/** A blend colour the editor offers. */
export interface BlendSwatch {
  /** `#rrggbb` */
  hex: string
  /** The template colour slot it came from, shown on hover. */
  name?: string
}

/**
 * The applied template's colours as blend swatches. They are the likeliest
 * match for what is behind the card, since the template painted it. The
 * scroll-story's `v2-*` palette is left out, because nothing on a V1 card is
 * drawn in it.
 */
export const templateBlendSwatches = (
  colors: ReadonlyArray<{ hex_color_code?: string; hex_code?: string; name?: string }> | null | undefined,
): BlendSwatch[] =>
  (colors ?? []).flatMap((color) => {
    if (color.name?.startsWith('v2-')) return []
    const hex = normalizeBlendColor(color.hex_color_code ?? color.hex_code)
    return hex ? [{ hex, name: color.name }] : []
  })

// --- Masks -------------------------------------------------------------------

/**
 * Hermite smoothstep. A linear alpha ramp has a visible start: the eye finds
 * the line where the fade begins. Easing both ends leaves no line to find.
 */
const smoothstep = (t: number): number => t * t * (3 - 2 * t)

const SAMPLES = 8

const pct = (value: number): string => `${(value * 100).toFixed(2)}%`

/**
 * A vertical gradient that ramps in from the top edge and back out to the
 * bottom one, mirrored. `from`/`to` are where the ramp starts and ends,
 * measured inward from each edge as fractions of the fade; `at(t)` is the
 * colour at progress t along it. Before `from` the gradient holds `at(0)`, and
 * between the two ramps it holds `at(1)`.
 */
const mirroredRamp = (from: number, to: number, at: (t: number) => string): string => {
  const top: string[] = []
  const bottom: string[] = []
  for (let k = 0; k <= SAMPLES; k++) {
    const t = k / SAMPLES
    const offset = (from + t * (to - from)) * PHOTO_BAND_FADE
    top.push(`${at(t)} ${pct(offset)}`)
    bottom.unshift(`${at(t)} ${pct(1 - offset)}`)
  }
  return `linear-gradient(to bottom, ${top.join(', ')}, ${bottom.join(', ')})`
}

const alphaRamp = (from: number, to: number): string =>
  mirroredRamp(from, to, (t) => `rgba(0, 0, 0, ${smoothstep(t).toFixed(3)})`)

/**
 * The three layers' masks, edge inward: the heavy blur arrives first and
 * dissolves at the very edge, the light blur takes over from it, and the sharp
 * photograph from that. Staggered ramps rather than one crossfade between
 * sharp and blurred, which reads as a double exposure in its middle.
 */
export const PHOTO_BAND_MASKS = {
  far: alphaRamp(0, 0.45),
  mid: alphaRamp(0.15, 0.6),
  sharp: alphaRamp(0.35, 1),
} as const

/** How strongly the edge takes the blend colour, at its strongest. */
const TINT_PEAK = 0.9

/**
 * The wash of blend colour laid over all three layers: full at the edge, gone
 * just inside where the fade ends, so the photograph takes on the colour as it
 * leaves. PhotoBand masks it like the far layer, so the colour itself still
 * dissolves at the very edge — photo, then colour, then page.
 */
export const photoBandTint = (color: string): string => {
  const hex = normalizeBlendColor(color) ?? '#ffffff'
  return mirroredRamp(0, 0.9, (t) => {
    const alpha = Math.round((1 - smoothstep(t)) * TINT_PEAK * 255)
    return `${hex}${alpha.toString(16).padStart(2, '0')}`
  })
}
