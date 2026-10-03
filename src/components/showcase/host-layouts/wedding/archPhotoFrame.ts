/**
 * The `arch` host design's portrait frame: which shape each host's photograph
 * sits in, where the names go, and how an uploaded frame is fitted.
 *
 * Everything that is data rather than markup lives here, so ArchPhotoFrame.vue
 * is only the drawing and every rule can be tested without mounting it — the
 * split coverPhoto.ts makes for the cover's photo frame.
 *
 * Backend contract: docs/backend-api-requirements/host-info-design.md
 */
import type { FrameWindow } from '@/composables/showcase/useFrameWindow'
import type {
  HostCaptionPlacement,
  HostPhotoFrame,
} from '@/services/api/types/template.types'

// --- Config ------------------------------------------------------------------

/**
 * In the order the partner form offers them: the round arch every arch
 * template already draws, then from the most to the least architectural.
 */
export const HOST_PHOTO_FRAMES: readonly HostPhotoFrame[] = [
  'arch',
  'pointed',
  'oval',
  'circle',
  'rectangle',
]

/** Absent, null and anything this build doesn't draw are the round arch. */
export function resolvePhotoFrame(value: unknown): HostPhotoFrame {
  return (HOST_PHOTO_FRAMES as readonly unknown[]).includes(value)
    ? (value as HostPhotoFrame)
    : 'arch'
}

/** Absent, null and anything unknown keep the names under the frame. */
export function resolveCaptionPlacement(value: unknown): HostCaptionPlacement {
  return value === 'beside' ? 'beside' : 'below'
}

// --- The pointed window ---------------------------------------------------------

/**
 * The one shape border-radius cannot draw, in the photograph's own 4:5 box.
 *
 * Each half of the crown is an arc centred on the springing line (y = 64) at
 * the far side's reach, radius 66: a blunt pointed arch whose crown takes the
 * top half of the photo. An equilateral lancet of the same width would take
 * two thirds of it and leave the face in a slot. Centring each arc on the
 * springing line makes the walls meet it on a tangent, so they rise without a
 * kink; the feet are softened to match the round arch's.
 */
export const POINTED_FRAME_VIEWBOX = '0 0 100 125'
export const POINTED_FRAME_PATH =
  'M0 119V64A66 66 0 0 1 50 0A66 66 0 0 1 100 64V119Q100 125 94 125H6Q0 125 0 119Z'

/**
 * The pointed window as a CSS mask. Stretched over the photo's box
 * (`preserveAspectRatio="none"`), which is always 4:5, so it never distorts.
 */
export const POINTED_FRAME_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${POINTED_FRAME_VIEWBOX}" preserveAspectRatio="none"><path d="${POINTED_FRAME_PATH}"/></svg>`,
)}")`

// --- Uploaded frame art ------------------------------------------------------------

/** A rectangle in percentages of its container. */
export interface PercentBox {
  left: number
  top: number
  width: number
  height: number
}

export interface FrameArtLayout {
  /** Width ÷ height of the inked artwork: the frame's box on the card. */
  aspect: number
  /** The artwork's <img>, placed so its inked area fills that box exactly. */
  image: PercentBox
  /** Where the photograph goes inside the box. */
  opening: PercentBox
}

/**
 * Where the artwork and the photograph go, from what the artwork measured as.
 * Null when it has no window of its own.
 *
 * The box is the artwork's INKED area rather than the whole image: an upload
 * with a wide transparent margin would otherwise draw a small frame floating
 * in a large empty column. Everything outside the inked area is transparent by
 * definition, so trimming it draws exactly what the partner drew.
 */
export function frameArtLayout(frame: FrameWindow): FrameArtLayout | null {
  const { ink, opening, aspectRatio } = frame
  if (!opening || !(ink.width > 0) || !(ink.height > 0) || !(aspectRatio > 0)) return null
  return {
    aspect: (ink.width / ink.height) * aspectRatio,
    image: {
      left: (-ink.x / ink.width) * 100,
      top: (-ink.y / ink.height) * 100,
      width: 100 / ink.width,
      height: 100 / ink.height,
    },
    opening: {
      left: ((opening.x - ink.x) / ink.width) * 100,
      top: ((opening.y - ink.y) / ink.height) * 100,
      width: (opening.width / ink.width) * 100,
      height: (opening.height / ink.height) * 100,
    },
  }
}

/**
 * The uploaded frame as the drawing receives it — resolved once by the design
 * and handed to every card, so one image is measured once.
 *
 * - `pending` — still being measured. Nothing is drawn yet: a drawn arch that
 *   swapped for the artwork a moment later would show the guest a frame the
 *   template doesn't have.
 * - `window`  — the artwork encloses an opening, and the photo is fitted into it.
 * - `overlay` — it doesn't (an open design), or it couldn't be read (no CORS).
 *   The photo keeps the drawn shape and the artwork is laid over it.
 */
export type ArchFrameArt =
  | { mode: 'pending'; url: string }
  | { mode: 'window'; url: string; layout: FrameArtLayout; mask: string }
  | { mode: 'overlay'; url: string }

export function resolveFrameArt(
  url: string | null,
  settled: boolean,
  measured: FrameWindow | null,
): ArchFrameArt | null {
  if (!url) return null
  if (!settled) return { mode: 'pending', url }
  const layout = measured ? frameArtLayout(measured) : null
  if (layout && measured?.openingMask) {
    return { mode: 'window', url, layout, mask: measured.openingMask }
  }
  return { mode: 'overlay', url }
}
