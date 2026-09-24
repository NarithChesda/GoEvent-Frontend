<template>
  <!-- The photo frame: a photograph cut to the template's shape and set in its
       frame artwork. Data and geometry live in coverPhoto.ts.

       A layer of its own over the whole stage, for the reason the names and
       details are one (see CoverDetailBlocks): the block is placed by its own
       box in both layout modes, and in `rows` mode CoverContentRows' root is
       the stacking container, so a box inside it would be measured from the
       container rather than from the stage.

       `pointer-events: none` on the layer and `auto` on the block, so the layer
       doesn't swallow the other blocks' click-to-edit in the preview. A tap on
       the block still bubbles to the cover's open-envelope handler. -->
  <div class="cpf">
    <div class="cpf-block" :class="{ 'cpf-enter': showAnimations }" :style="boxStyle">
      <!-- Nothing is drawn until the artwork and the shape have been measured:
           the canvas takes the artwork's shape, and drawing it square first
           would jump the moment the real one arrived. -->
      <EditableRegion v-if="ready" :intent="editIntent">
        <div class="cpf-canvas" :style="{ '--cpf-aspect': `${geometry.canvasAspect}` }">
          <img
            v-if="frameUrl && frameLayer === 'under'"
            :src="frameUrl"
            alt=""
            class="cpf-art cpf-art--under"
            draggable="false"
            fetchpriority="high"
            v-bind="protectionAttrs"
          />

          <div v-if="showsPhoto" class="cpf-window" :style="windowStyle">
            <div class="cpf-photo-box" :style="rectStyle(geometry.photoBox)">
              <img
                ref="photoRef"
                :src="photoUrl!"
                :alt="photo?.alt || `${eventTitle} photo`"
                class="cpf-photo"
                :style="photoStyle"
                draggable="false"
                fetchpriority="high"
                v-bind="protectionAttrs"
                @load="measurePhoto"
              />
            </div>
          </div>
          <!-- No photograph to cut, or a shape that couldn't be measured (it
               needs CORS to read, as the mask does to apply): the shape is
               drawn as itself, which is how the template's author drew it. -->
          <img
            v-else-if="shapeUrl"
            :src="shapeUrl"
            alt=""
            class="cpf-art cpf-art--shape"
            :style="rectStyle(geometry.window)"
            draggable="false"
            v-bind="protectionAttrs"
          />

          <img
            v-if="frameUrl && frameLayer === 'over'"
            :src="frameUrl"
            alt=""
            class="cpf-art cpf-art--over"
            draggable="false"
            fetchpriority="high"
            v-bind="protectionAttrs"
          />
        </div>
      </EditableRegion>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import EditableRegion from '@/components/showcase-preview/edit/EditableRegion.vue'
import type { EditIntent } from '@/components/showcase-preview/edit/editContext'
import { useAssetProtection } from '@/composables/showcase/useAssetProtection'
import { useShapeMaskBounds } from '@/composables/showcase/useShapeMaskBounds'
import { cropCentre, type Size } from '@/utils/photoCrop'
import {
  coverPhotoImageRect,
  coverPhotoLayout,
  type CoverPhotoFrameBinding,
  type PercentRect,
} from './coverPhoto'

interface Props extends CoverPhotoFrameBinding {
  /** Rise in on mount — the decoration cover. Door leaves draw it still. */
  showAnimations?: boolean
}

const props = withDefaults(defineProps<Props>(), { showAnimations: false })

const { protectionAttrs } = useAssetProtection()

// --- Measuring -------------------------------------------------------------------

/** The artwork's width ÷ height; null until it loads (or when it fails to). */
const frameAspect = ref<number | null>(null)
const frameSettled = ref(true)

watch(
  () => props.frameUrl,
  (url, _prev, onCleanup) => {
    frameAspect.value = null
    if (!url || typeof window === 'undefined') {
      frameSettled.value = true
      return
    }
    frameSettled.value = false
    let cancelled = false
    onCleanup(() => {
      cancelled = true
    })
    const image = new Image()
    image.decoding = 'async'
    const settle = () => {
      if (cancelled) return
      if (image.naturalWidth && image.naturalHeight) {
        frameAspect.value = image.naturalWidth / image.naturalHeight
      }
      frameSettled.value = true
    }
    image.onload = settle
    // A broken artwork URL must not hold the photograph back with it.
    image.onerror = settle
    image.src = url
  },
  { immediate: true },
)

const shapeUrlRef = computed(() => props.shapeUrl)
const { bounds, settled: shapeSettled } = useShapeMaskBounds(shapeUrlRef)

const ready = computed(() => frameSettled.value && (!props.shapeUrl || shapeSettled.value))

/** The shape's bounds, only while they are this shape's. */
const shapeBounds = computed(() => (props.shapeUrl && shapeSettled.value ? bounds.value : null))

const geometry = computed(() => coverPhotoLayout(frameAspect.value, shapeBounds.value))

// --- The photograph ------------------------------------------------------------------

/** With a shape, the photo can only be cut once the shape has been measured. */
const showsPhoto = computed(() => !!props.photoUrl && (!props.shapeUrl || !!shapeBounds.value))

const photoRef = ref<HTMLImageElement | null>(null)
const natural = ref<Size | null>(null)

const measurePhoto = () => {
  const image = photoRef.value
  if (image?.naturalWidth && image.naturalHeight) {
    natural.value = { width: image.naturalWidth, height: image.naturalHeight }
  }
}

// A new photograph is measured afresh — and a cached one may have decoded
// before the listener attached, in which case @load never fires.
watch(
  () => [props.photoUrl, showsPhoto.value] as const,
  async () => {
    natural.value = null
    await nextTick()
    if (photoRef.value?.complete) measurePhoto()
  },
  { immediate: true },
)

const rectStyle = (rect: PercentRect): Record<string, string> => ({
  left: `${rect.left}%`,
  top: `${rect.top}%`,
  width: `${rect.width}%`,
  height: `${rect.height}%`,
})

const windowStyle = computed<Record<string, string>>(() => {
  const style = rectStyle(geometry.value.window)
  if (!props.shapeUrl) return style
  const mask = `url("${props.shapeUrl}")`
  return { ...style, maskImage: mask, WebkitMaskImage: mask }
})

/**
 * A chosen photo is laid out so all of its framed region shows. Until its
 * size is known, and always for a host's photo (hosts carry no framing), it
 * covers the box — the host's by the template's own offsets, as it always was.
 */
const photoStyle = computed<Record<string, string>>(() => {
  const photo = props.photo
  if (photo?.kind === 'photo' && photo.crop) {
    const rect = coverPhotoImageRect(photo.crop, natural.value, geometry.value.photoAspect)
    if (rect) return rectStyle(rect)
    const centre = cropCentre(photo.crop)
    return { ...rectStyle({ left: 0, top: 0, width: 100, height: 100 }), objectFit: 'cover', objectPosition: `${centre.x}% ${centre.y}%` }
  }
  return {
    ...rectStyle({ left: 0, top: 0, width: 100, height: 100 }),
    objectFit: 'cover',
    objectPosition: `${props.hostOffset.x}% ${props.hostOffset.y}%`,
  }
})

// --- Editing -------------------------------------------------------------------------

/**
 * The shape this frame cuts to travels with the tap, so the editor frames the
 * photograph in the very window drawn here — only this side has measured it.
 */
const editIntent = computed<EditIntent>(() => {
  const b = shapeBounds.value
  return {
    kind: 'coverPhoto',
    frameAspect: geometry.value.photoAspect,
    shape:
      props.shapeUrl && b
        ? { url: props.shapeUrl, bounds: { x: b.x, y: b.y, width: b.width, height: b.height } }
        : null,
  }
})
</script>

<style scoped>
.cpf {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* left/top/width/height come from coverElementStyle, already resolved to a
   top-left corner — never a translate, which the entrance keyframes would
   overwrite. A size container, so the canvas can fit itself to the box. */
.cpf-block {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  container-type: size;
  pointer-events: auto;
}

/* The composition, in the artwork's own shape, as large as the box allows:
   the box is the frame's size, so dragging its handles scales the frame and
   never stretches it. Sized in the box's container units rather than
   percentages, because in the preview it sits inside EditableRegion's wrapper,
   which has no size of its own to take a percentage of. */
.cpf-canvas {
  position: relative;
  aspect-ratio: var(--cpf-aspect, 1);
  width: min(100cqw, calc(100cqh * var(--cpf-aspect, 1)));
}

/* `max-width: none` throughout: preflight's `img { max-width: 100% }` would
   squash a zoomed photograph back into its box and distort it. */
.cpf-art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}

.cpf-art--under {
  z-index: 1;
}

.cpf-window,
.cpf-art--shape {
  z-index: 2;
}

.cpf-art--over {
  z-index: 3;
}

/* The shape image stretched over exactly its own footprint is the mask, so
   only its opaque pixels let the photograph through. */
.cpf-window {
  position: absolute;
  overflow: hidden;
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
}

.cpf-art--shape {
  inset: auto;
}

.cpf-photo-box {
  position: absolute;
  overflow: hidden;
}

.cpf-photo {
  position: absolute;
  display: block;
  max-width: none;
  max-height: none;
  user-select: none;
  -webkit-user-drag: none;
}

.cpf-enter {
  animation: cpfEnter 1s ease-out 200ms both;
}

@keyframes cpfEnter {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cpf-enter {
    animation-name: cpfFade;
    animation-duration: 0.4s;
  }

  @keyframes cpfFade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
}
</style>
