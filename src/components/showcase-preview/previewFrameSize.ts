import { computed, type Ref, type ComputedRef } from 'vue'
import { useMediaQuery } from '@/composables/useMediaQuery'

/**
 * The native viewport every showcase preview frame renders its iframe at.
 *
 * Width is always a real phone's (iPhone 12/13/14 CSS px) — the showcase is
 * built on real vh/vw units, so rendering at an actual phone width is what
 * makes a preview match what a guest sees rather than a design canvas scaled
 * down. Only the *height* differs between the two shapes below.
 */
export const PREVIEW_FRAME_WIDTH = 390

/**
 * A modern phone's own viewport (~19.5:9). Used on phones and small tablets,
 * where the preview is the one thing on screen and the point is to be exactly
 * the device the guest holds.
 */
export const PREVIEW_FRAME_HEIGHT_TALL = 844

/**
 * 9:16 — what the frames render at on a desktop/laptop, where a phone-shaped
 * frame is one object among several (a catalogue beside it, two more frames
 * next to it, a studio panel) and height is the scarce dimension. A 9:16 box
 * is still a real phone viewport (an iPhone SE is 375x667), so nothing inside
 * renders at a size no device produces — it is simply a shorter one, which
 * scales up wider in the same vertical space.
 */
export const PREVIEW_FRAME_HEIGHT_WIDE = Math.round((PREVIEW_FRAME_WIDTH * 16) / 9)

/**
 * How large the phone may be *drawn*, as opposed to the viewport it renders
 * at (the two constants above, which never change — the showcase always lays
 * itself out as a 390px-wide phone).
 *
 * Spare vertical space is spent by drawing the phone bigger rather than left
 * empty: a frame capped at its native width leaves a band of nothing under
 * every phone on a desktop, which is the one thing a preview column has no
 * use for. 1.5x is the ceiling because past it the mockup stops reading as a
 * phone and starts reading as a tablet — and it is the factor the partner
 * form's fullscreen preview already used, so nothing on screen grows past a
 * size this app was already drawing.
 */
export const PREVIEW_FRAME_MAX_UPSCALE = 1.5
export const PREVIEW_FRAME_MAX_WIDTH = Math.round(
  PREVIEW_FRAME_WIDTH * PREVIEW_FRAME_MAX_UPSCALE,
)

/**
 * What counts as "a PC" for frame sizing — the same 1024px boundary the studio
 * uses to swap its frame row for the full-bleed mobile sheet, so a viewport is
 * never between the two answers.
 */
export const DESKTOP_PREVIEW_FRAME_QUERY = '(min-width: 1024px)'

/**
 * The native height of a preview frame at this viewport. Reactive: a window
 * resized across the boundary re-sizes the frames with it.
 */
export function usePreviewFrameHeight(): ComputedRef<number> {
  const isDesktop = useMediaQuery(DESKTOP_PREVIEW_FRAME_QUERY)
  return computed(() =>
    isDesktop.value ? PREVIEW_FRAME_HEIGHT_WIDE : PREVIEW_FRAME_HEIGHT_TALL,
  )
}

/**
 * The frame's native aspect (width / height) at this viewport — for callers
 * that fit the frame themselves instead of letting PreviewFrame do it, and
 * which must therefore agree with it about the shape.
 */
export function usePreviewFrameAspect(): ComputedRef<number> {
  const height: Ref<number> = usePreviewFrameHeight()
  return computed(() => PREVIEW_FRAME_WIDTH / height.value)
}
