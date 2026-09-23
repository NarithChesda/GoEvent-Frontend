<template>
  <div ref="frameRef" class="sp" :class="{ 'is-shown': shown }">
    <img
      :src="getMediaUrl(photo.image)"
      :alt="index === 0 ? alt : ''"
      class="sp-img"
      :class="{ 'is-loaded': loaded }"
      :style="imgStyle"
      @load="onLoad"
    />
    <slot />
    <!-- Manage-page preview: a photograph opens the framing editor on itself,
         in this frame's shape — the stack's photographs are framed where they
         are, not in a list somewhere else. -->
    <EditableRegion v-if="editIntentCtx" :intent="intent" class="sp-edit" />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue'
import type { EventPhoto } from '@/types/showcase'
import { EditIntentKey, type EditIntent } from '@/components/showcase-preview/edit/editContext'
import EditableRegion from '@/components/showcase-preview/edit/EditableRegion.vue'
import { cropCentre, cropToCoverGeometry, resolvePhotoCrop, type Size } from '@/utils/photoCrop'
import { StackLayoutKey, printFocus } from './photoStack'

/**
 * One photograph in a photo-stack layout, filling whatever frame the layout
 * gives it — a print's window, a panel, a tile.
 *
 * The same in every layout, so it lives once: laid out so ALL of the
 * organizer's framed region shows in this frame, whatever shape the frame is
 * (cropToCoverGeometry), faded into its frame when it arrives late rather than
 * popping in over its own reveal, and drifting in toward the region's centre
 * for as long as it is on screen from the moment it is `shown` — memories
 * coming slightly alive. How the frame itself arrives (a drop, a wipe, a flash)
 * is the layout's; the layout's default slot draws over the photograph for
 * exactly that.
 *
 * `--sp-empty` is the frame before its photograph arrives: paper for a print,
 * unexposed black for film.
 */
const props = defineProps<{
  photo: EventPhoto
  /** Position in the reveal order — 0 is the featured photograph. */
  index: number
  shown: boolean
  alt: string
  getMediaUrl: (url: string) => string
}>()

const editIntentCtx = inject(EditIntentKey, undefined)
const stackLayout = inject(StackLayoutKey, undefined)

const frameRef = ref<HTMLElement | null>(null)
const loaded = ref(false)
const naturalSize = ref<Size | null>(null)
const frameSize = ref<Size | null>(null)

const region = computed(() => resolvePhotoCrop(props.photo))

const onLoad = (event: globalThis.Event) => {
  loaded.value = true
  const image = event.target as HTMLImageElement
  if (image.naturalWidth && image.naturalHeight) {
    naturalSize.value = { width: image.naturalWidth, height: image.naturalHeight }
  }
}

// Layout values rather than getBoundingClientRect: every layout scales and
// rotates its frames as they arrive, and the preview frame is CSS-scaled on
// top — a transformed rect would be the wrong shape mid-animation.
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
 * Percentages of the frame rather than pixels, so a frame that changes size
 * between two measurements still holds the same picture. Until both sizes are
 * known the image is a plain `cover` anchored on the region's centre — within a
 * few percent of the final layout, so the swap is not a visible jump.
 */
const imgStyle = computed((): Record<string, string> => {
  const centre = cropCentre(region.value)
  const origin = `${centre.x}% ${centre.y}%`
  const frame = frameSize.value
  const geometry = cropToCoverGeometry(region.value, naturalSize.value, frame)
  if (!geometry || !frame) return { objectPosition: printFocus(props.photo), transformOrigin: origin }
  return {
    left: `${(geometry.left / frame.width) * 100}%`,
    top: `${(geometry.top / frame.height) * 100}%`,
    width: `${(geometry.width / frame.width) * 100}%`,
    height: `${(geometry.height / frame.height) * 100}%`,
    // The image box is the whole photograph here, so the region's centre in
    // % of the photograph is also its centre in % of the box.
    transformOrigin: origin,
  }
})

const intent = computed<EditIntent>(() => ({
  kind: 'featuredPhoto',
  focus: 'crop',
  stackLayout: stackLayout?.value,
  photoId: props.photo.id,
}))
</script>

<style scoped>
.sp {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--sp-empty, #e7e0d3);
}

/* A plain `cover` of the frame until the geometry is known; the inline
   left/top/width/height then place the whole photograph, and the box already
   has its aspect, so `cover` changes nothing. */
.sp-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  /* Tailwind Preflight caps images at their container; the drift scales past
     it, and a zoomed photograph is wider than its frame. */
  max-width: none;
  object-fit: cover;
  opacity: 0;
  transform: scale(1.08);
  transition:
    opacity 0.5s var(--sk-ease-atmos, cubic-bezier(0.33, 1, 0.68, 1)),
    transform 6s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.sp-img.is-loaded {
  opacity: 1;
}

.is-shown .sp-img {
  transform: scale(1);
}

/* The stage root is pointer-events:none; the edit region opts back in. */
.sp-edit {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: auto;
}

@media (prefers-reduced-motion: reduce) {
  .sp-img,
  .is-shown .sp-img {
    transform: none;
  }
}
</style>
