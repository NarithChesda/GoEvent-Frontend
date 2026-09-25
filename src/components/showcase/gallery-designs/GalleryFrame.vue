<template>
  <div ref="frameRef" class="gf" :class="{ 'is-loaded': loaded, 'is-failed': failed }">
    <img
      v-if="load && !failed"
      :key="attempt"
      class="gf-img"
      :src="src"
      :srcset="srcset"
      :sizes="sizes"
      :alt="alt"
      :style="imgStyle"
      decoding="async"
      draggable="false"
      v-bind="protectionAttrs"
      @load="onLoad"
      @error="onError"
    />
    <svg
      v-if="failed"
      class="gf-failed"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.5"
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
    <!-- Whatever the design draws over the photograph: a flash, a develop
         cast, a veil. -->
    <slot />
    <!-- Transparent right-click guard, production only — the column's. -->
    <div v-if="isProduction" class="gf-guard" @contextmenu.prevent />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { EventPhoto } from '@/types/showcase'
import { cropCentre, cropToCoverGeometry, resolvePhotoCrop, type Size } from '@/utils/photoCrop'
import {
  PHOTO_DELIVERY,
  useTemplateProcessor,
} from '@/composables/showcase/useTemplateProcessor'
import { useAssetProtection } from '@/composables/showcase/useAssetProtection'

/**
 * One photograph in a framed gallery design, filling whatever frame the design
 * gives it — a print's window, a tile, a booth frame, a frame of film.
 *
 * The gallery's counterpart to the photo stack's StackPhoto, and laid out by
 * the same renderer: `cropToCoverGeometry`, so all of the organizer's framed
 * region shows in this frame whatever shape it is, and an unframed photo is a
 * plain centre cover. The frame is measured with layout values (clientWidth),
 * never a rect, because every design scales or tilts its frames as they
 * arrive.
 *
 * It fetches nothing until `load` — the design decides when a photograph is
 * close enough to be worth the bytes — and asks the CDN for the width the
 * image box actually has, which in a zoomed crop is wider than the frame.
 */
const props = withDefaults(
  defineProps<{
    photo: EventPhoto
    alt: string
    /** Assign the source. False until the frame is near the scroll. */
    load?: boolean
  }>(),
  { load: true },
)

const { isProduction, protectionAttrs } = useAssetProtection()
const { getOptimizedMediaUrl, getOptimizedMediaSrcset } = useTemplateProcessor()

const frameRef = ref<HTMLElement | null>(null)
const frameSize = ref<Size | null>(null)
const naturalSize = ref<Size | null>(null)
const loaded = ref(false)
const failed = ref(false)
const attempt = ref(0)

const MAX_RETRIES = 2
let retryTimer: ReturnType<typeof setTimeout> | undefined

const region = computed(() => resolvePhotoCrop(props.photo))
const geometry = computed(() =>
  cropToCoverGeometry(region.value, naturalSize.value, frameSize.value),
)

// Mid-ladder, for the parser's first pick before `sizes` resolves.
const src = computed(() =>
  getOptimizedMediaUrl(props.photo.image, { ...PHOTO_DELIVERY, width: 828, retina: 1 }),
)
const srcset = computed(
  () => getOptimizedMediaSrcset(props.photo.image, PHOTO_DELIVERY) || undefined,
)
// The image box, not the frame: a photo framed close is drawn wider than its
// frame, and asking for the frame's width would upscale it.
const sizes = computed(() => {
  const width = geometry.value?.width ?? frameSize.value?.width ?? 360
  return `${Math.ceil(width)}px`
})

/**
 * Percentages of the frame, so a frame that changes size between two
 * measurements still holds the same picture. Until both sizes are known the
 * image is a plain `cover` anchored on the region's centre — within a few
 * percent of the final layout, so the swap is not a visible jump.
 */
const imgStyle = computed((): Record<string, string> => {
  const centre = cropCentre(region.value)
  const origin = `${centre.x}% ${centre.y}%`
  const frame = frameSize.value
  const box = geometry.value
  if (!box || !frame) return { objectPosition: origin, transformOrigin: origin }
  return {
    left: `${(box.left / frame.width) * 100}%`,
    top: `${(box.top / frame.height) * 100}%`,
    width: `${(box.width / frame.width) * 100}%`,
    height: `${(box.height / frame.height) * 100}%`,
    transformOrigin: origin,
  }
})

const onLoad = (event: globalThis.Event) => {
  const image = event.target as HTMLImageElement
  if (image.naturalWidth && image.naturalHeight) {
    naturalSize.value = { width: image.naturalWidth, height: image.naturalHeight }
  }
  loaded.value = true
}

const onError = () => {
  if (attempt.value >= MAX_RETRIES) {
    failed.value = true
    return
  }
  // 1s, then 2s. Re-keying the image makes a fresh element and a fresh request.
  retryTimer = setTimeout(() => {
    attempt.value += 1
  }, 1000 * 2 ** attempt.value)
}

// The studio can swap a photograph's image under the same frame.
watch(
  () => props.photo.image,
  () => {
    clearTimeout(retryTimer)
    loaded.value = false
    failed.value = false
    attempt.value = 0
    naturalSize.value = null
  },
)

const measure = () => {
  const frame = frameRef.value
  if (frame?.clientWidth && frame.clientHeight) {
    frameSize.value = { width: frame.clientWidth, height: frame.clientHeight }
  }
}

let observer: ResizeObserver | null = null

onMounted(() => {
  measure()
  if (typeof ResizeObserver !== 'undefined' && frameRef.value) {
    observer = new ResizeObserver(measure)
    observer.observe(frameRef.value)
  }
})

onBeforeUnmount(() => {
  clearTimeout(retryTimer)
  observer?.disconnect()
  observer = null
})
</script>

<style scoped>
/* `--gf-empty` is the frame before its photograph arrives — paper for a print,
   the unexposed black of a negative. A design sets it on the frame. */
.gf {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--gf-empty, color-mix(in srgb, var(--gd-ink, #64748b) 10%, transparent));
}

/* `--gf-zoom` lets a design settle the photograph into its frame as it
   arrives; it scales about the framed region's centre (transform-origin is
   inline). Tailwind Preflight caps images at their container, and a photo
   framed close is wider than its frame — hence max-width: none. */
.gf-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  opacity: 0;
  transform: scale(var(--gf-zoom, 1));
  transition:
    opacity 0.6s var(--gd-ease-atmos, cubic-bezier(0.33, 1, 0.68, 1)),
    transform var(--gf-zoom-duration, 1.6s) var(--gd-ease-atmos, cubic-bezier(0.33, 1, 0.68, 1));
  -webkit-user-drag: none;
}

.is-loaded .gf-img {
  opacity: 1;
}

.gf-failed {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 28%;
  max-width: 2.5rem;
  translate: -50% -50%;
  color: var(--gd-ink, #64748b);
  opacity: 0.4;
}

.gf-guard {
  position: absolute;
  inset: 0;
  z-index: 10;
}

@media (prefers-reduced-motion: reduce) {
  .gf-img {
    transform: none;
  }
}
</style>
