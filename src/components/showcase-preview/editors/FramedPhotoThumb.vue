<template>
  <span class="framed-thumb" :style="{ width: `${width}px`, height: `${height}px` }">
    <img
      :src="imageUrl"
      alt=""
      draggable="false"
      class="framed-thumb__img"
      :style="imgStyle"
      @load="onLoad"
    />
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { cropCentre, cropToCoverGeometry, type PhotoCrop, type Size } from '@/utils/photoCrop'

/**
 * A photo drawn small in the shape of the frame it lands in, framed by its
 * region through the same function the stage uses — so a thumbnail can never
 * disagree with what guests see. Live: it redraws as the region is dragged.
 */
const props = withDefaults(
  defineProps<{
    imageUrl: string
    region: PhotoCrop
    /** Width ÷ height of the frame. */
    aspect: number
    height?: number
  }>(),
  { height: 64 },
)

/** A mosaic column can be 0.28:1 — true to shape, but never a hairline. */
const MIN_WIDTH = 20

const width = computed(() => Math.max(MIN_WIDTH, Math.round(props.height * props.aspect)))

const natural = ref<Size | null>(null)

const onLoad = (event: globalThis.Event) => {
  const image = event.target as HTMLImageElement
  if (image.naturalWidth && image.naturalHeight) {
    natural.value = { width: image.naturalWidth, height: image.naturalHeight }
  }
}

watch(
  () => props.imageUrl,
  () => {
    natural.value = null
  },
)

const imgStyle = computed((): Record<string, string> => {
  const frame = { width: width.value, height: props.height }
  const geometry = cropToCoverGeometry(props.region, natural.value, frame)
  if (!geometry) {
    const centre = cropCentre(props.region)
    return { objectPosition: `${centre.x}% ${centre.y}%` }
  }
  return {
    left: `${geometry.left}px`,
    top: `${geometry.top}px`,
    width: `${geometry.width}px`,
    height: `${geometry.height}px`,
  }
})
</script>

<style scoped>
.framed-thumb {
  position: relative;
  display: block;
  overflow: hidden;
  background: #e2e8f0;
}

.framed-thumb__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  pointer-events: none;
}
</style>
