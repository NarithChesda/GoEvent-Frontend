<template>
  <div ref="frameRef" class="pb" :class="{ 'is-loaded': loaded }" :style="rootStyle">
    <!-- Edge inward: a heavy blur, a light blur, then the photograph. Each is
         masked to its own stretch of the fade (photoBand.ts), so the photo
         softens as it goes rather than just thinning out. One URL for all
         three: a single download. -->
    <div class="pb-layer pb-layer--far" aria-hidden="true">
      <img :src="src" alt="" class="pb-img" :style="imgStyle" loading="lazy" decoding="async" draggable="false" />
    </div>
    <div class="pb-layer pb-layer--mid" aria-hidden="true">
      <img :src="src" alt="" class="pb-img" :style="imgStyle" loading="lazy" decoding="async" draggable="false" />
    </div>
    <div class="pb-layer pb-layer--sharp">
      <img
        :src="src"
        :alt="photo.caption || ''"
        class="pb-img"
        :style="imgStyle"
        loading="lazy"
        decoding="async"
        v-bind="protectionAttrs"
        @load="onLoad"
      />
    </div>
    <!-- The blend colour, over all three: under the blur layers alone it was
         covered by the light blur before it could reach the photo, and the
         edge went muddy through the photo's own darks instead. -->
    <div v-if="blendColor" class="pb-layer pb-layer--far pb-tint" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { EventPhoto } from '@/composables/useEventShowcase'
import { PHOTO_DELIVERY, useTemplateProcessor } from '@/composables/showcase/useTemplateProcessor'
import { useAssetProtection } from '@/composables/showcase/useAssetProtection'
import { cropCentre, cropToCoverGeometry, type PhotoCrop, type Size } from '@/utils/photoCrop'
import {
  PHOTO_BAND_ASPECT,
  PHOTO_BAND_BLUR,
  PHOTO_BAND_INSET_Y,
  PHOTO_BAND_MASKS,
  photoBandTint,
} from './photoBand'

/**
 * One of the event's photographs, full width, with its top and bottom
 * dissolving into the page through a blur — and, when the organizer picked
 * one, through a wash of the colour behind the card, which is what makes the
 * edge disappear against a backdrop the blur alone can't match.
 *
 * Framed like every other photo on the showcase: the organizer's region all
 * shows (`cropToCoverGeometry`), here kept clear of the fades by `insetY`.
 * The caller sets the band's horizontal bleed; this component is the frame.
 */
const props = defineProps<{
  photo: EventPhoto
  /** `#rrggbb`, or null for blur only. */
  blendColor: string | null
  /** The region that must show — the band's own framing, else the photo's. */
  crop: PhotoCrop
}>()

const { getOptimizedMediaUrl } = useTemplateProcessor()
const { protectionAttrs } = useAssetProtection()

// The gallery grid's own URL for this photo, so a guest who has scrolled past
// the gallery (or will) downloads it once.
const src = computed(() =>
  getOptimizedMediaUrl(props.photo.image, { ...PHOTO_DELIVERY, width: 1080, retina: 1 }),
)

const frameRef = ref<HTMLElement | null>(null)
const loaded = ref(false)
const naturalSize = ref<Size | null>(null)
const frameSize = ref<Size | null>(null)

const onLoad = (event: globalThis.Event) => {
  loaded.value = true
  const image = event.target as HTMLImageElement
  if (image.naturalWidth && image.naturalHeight) {
    naturalSize.value = { width: image.naturalWidth, height: image.naturalHeight }
  }
}

// A different photo is a different intrinsic size; keep the last one's
// geometry and the faded-in state until this one says otherwise.
watch(src, () => {
  naturalSize.value = null
})

// Layout values rather than getBoundingClientRect: the manage-page preview
// CSS-scales the whole frame, and a scaled rect would shrink the geometry.
const measureFrame = () => {
  const frame = frameRef.value
  if (frame?.clientWidth && frame.clientHeight) {
    frameSize.value = { width: frame.clientWidth, height: frame.clientHeight }
  }
}

let frameObserver: ResizeObserver | null = null

onMounted(() => {
  measureFrame()
  if (typeof ResizeObserver !== 'undefined' && frameRef.value) {
    frameObserver = new ResizeObserver(measureFrame)
    frameObserver.observe(frameRef.value)
  }
})

onBeforeUnmount(() => {
  frameObserver?.disconnect()
  frameObserver = null
})

/**
 * Percentages of the frame, so a resize between two measurements still holds
 * the same picture. Until both sizes are known it is a plain `cover` anchored
 * on the region's centre, close enough that the swap isn't a visible jump.
 */
const imgStyle = computed((): Record<string, string> => {
  const centre = cropCentre(props.crop)
  const frame = frameSize.value
  const geometry = cropToCoverGeometry(props.crop, naturalSize.value, frame, {
    insetY: PHOTO_BAND_INSET_Y,
  })
  if (!geometry || !frame) return { objectPosition: `${centre.x}% ${centre.y}%` }
  return {
    left: `${(geometry.left / frame.width) * 100}%`,
    top: `${(geometry.top / frame.height) * 100}%`,
    width: `${(geometry.width / frame.width) * 100}%`,
    height: `${(geometry.height / frame.height) * 100}%`,
  }
})

const rootStyle = computed(() => ({
  '--pb-aspect': String(PHOTO_BAND_ASPECT),
  '--pb-blur-far': `${PHOTO_BAND_BLUR.far}px`,
  '--pb-blur-mid': `${PHOTO_BAND_BLUR.mid}px`,
  '--pb-mask-far': PHOTO_BAND_MASKS.far,
  '--pb-mask-mid': PHOTO_BAND_MASKS.mid,
  '--pb-mask-sharp': PHOTO_BAND_MASKS.sharp,
  ...(props.blendColor ? { '--pb-tint': photoBandTint(props.blendColor) } : {}),
}))
</script>

<style scoped>
/* Capped in dvh so a wide card (a desktop's 9:16 frame) doesn't give one
   photograph most of a screen; the geometry adapts to whatever shape that
   leaves. */
.pb {
  position: relative;
  width: 100%;
  aspect-ratio: var(--pb-aspect);
  max-height: 70dvh;
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.6s cubic-bezier(0.33, 1, 0.68, 1);
}

.pb.is-loaded {
  opacity: 1;
}

.pb-layer {
  position: absolute;
  inset: 0;
}

.pb-layer--far {
  -webkit-mask-image: var(--pb-mask-far);
  mask-image: var(--pb-mask-far);
}

.pb-layer--mid {
  -webkit-mask-image: var(--pb-mask-mid);
  mask-image: var(--pb-mask-mid);
}

.pb-layer--sharp {
  -webkit-mask-image: var(--pb-mask-sharp);
  mask-image: var(--pb-mask-sharp);
}

/* A plain `cover` until the geometry is known; the inline left/top/width/height
   then place the whole photograph. `max-width: none` because Tailwind's
   preflight caps images at their container, and a framed photo is often wider
   than the band. */
.pb-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  pointer-events: none;
  user-select: none;
}

/* A blur fades its own edges to transparent, which would show as pale corners
   in the fades wherever the photo meets the band's sides. Scaling the soft
   copies past the frame pushes those edges out of it; nobody can see that a
   blurred copy is 12% larger than the sharp one it sits under. */
.pb-layer--far .pb-img {
  filter: blur(var(--pb-blur-far));
  transform: scale(1.12);
}

.pb-layer--mid .pb-img {
  filter: blur(var(--pb-blur-mid));
  transform: scale(1.04);
}

/* Masked like the far layer, so the colour itself still dissolves at the very
   edge: a solid band of it would draw a new boundary wherever the backdrop
   isn't exactly that colour. */
.pb-tint {
  background: var(--pb-tint);
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .pb {
    transition: none;
  }
}
</style>
