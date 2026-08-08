import { computed, onUnmounted, ref, watch, type ComputedRef, type Ref } from 'vue'
import { cropToCoverGeometry, resolvePhotoCrop, type PhotoCropFields, type Size } from '@/utils/photoCrop'

/** Plain centre `cover` — what a stage shows until both sizes are known. */
const COVER_FALLBACK_STYLE: Record<string, string> = {
  inset: '0',
  width: '100%',
  height: '100%',
}

export interface FeaturedPhotoGeometry {
  /** Attach to the element the photo fills — its box is the crop's viewport. */
  photoContainerRef: Ref<HTMLElement | null>
  /** Inline geometry for the <img>: the organizer's crop laid out in pixels. */
  photoStyle: ComputedRef<Record<string, string>>
  /** Bind to the <img>'s `load` so the intrinsic size can be read. */
  onPhotoLoad: (event: globalThis.Event) => void
}

/**
 * Lays a featured photo out so the organizer's stored crop rectangle fills the
 * stage, exactly like a `background-size: cover` of just that region.
 *
 * The stored rectangle is in percentages of the source image, so turning it
 * into pixels needs both the image's intrinsic size and the viewport's — the
 * latter measured live, since the stage resizes with the window (and is
 * CSS-scaled inside the manage-page preview frame).
 *
 * Shared by both transition stages (decoration and door), which lay the
 * featured photo out identically and differ only in what they animate on top.
 */
export function useFeaturedPhotoGeometry(
  featuredPhoto: Ref<PhotoCropFields | null> | ComputedRef<PhotoCropFields | null>,
): FeaturedPhotoGeometry {
  const photoContainerRef = ref<HTMLElement | null>(null)
  const naturalSize = ref<Size | null>(null)
  const viewportSize = ref<Size | null>(null)

  const onPhotoLoad = (event: globalThis.Event) => {
    const image = event.target as HTMLImageElement
    if (!image.naturalWidth || !image.naturalHeight) return
    naturalSize.value = { width: image.naturalWidth, height: image.naturalHeight }
  }

  const measureViewport = () => {
    const container = photoContainerRef.value
    if (!container) return
    // Layout values rather than getBoundingClientRect: the manage-page preview
    // renders these stages inside a CSS-scaled frame, and a scaled rect would
    // shrink the computed geometry to match the scale.
    viewportSize.value = { width: container.clientWidth, height: container.clientHeight }
  }

  let viewportObserver: ResizeObserver | null = null

  const photoStyle = computed<Record<string, string>>(() => {
    const geometry = cropToCoverGeometry(
      resolvePhotoCrop(featuredPhoto.value),
      naturalSize.value,
      viewportSize.value,
    )
    if (!geometry) return { ...COVER_FALLBACK_STYLE }
    return {
      left: `${geometry.left}px`,
      top: `${geometry.top}px`,
      width: `${geometry.width}px`,
      height: `${geometry.height}px`,
    }
  })

  // Keyed off the element appearing rather than off mount: the photo container
  // is v-if'd on there being a featured photo, so on a slower load it doesn't
  // exist yet when onMounted runs, and observing "whatever is there at mount"
  // would silently never measure anything — leaving every crop stuck on the
  // uncropped fallback.
  watch(photoContainerRef, (container) => {
    viewportObserver?.disconnect()
    viewportObserver = null
    if (!container) return
    measureViewport()
    if (typeof ResizeObserver !== 'undefined') {
      viewportObserver = new ResizeObserver(measureViewport)
      viewportObserver.observe(container)
    }
  })

  onUnmounted(() => {
    viewportObserver?.disconnect()
    viewportObserver = null
  })

  return { photoContainerRef, photoStyle, onPhotoLoad }
}
