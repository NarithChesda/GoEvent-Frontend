<template>
  <div class="space-y-3">
    <!-- The whole photo, at its own aspect ratio, so the crop box can be placed
         against everything that's available rather than a pre-cropped view.
         The canvas element *is* the photo's rect, which keeps percentage
         coordinates a straight mapping with no letterbox arithmetic. -->
    <div class="flex justify-center">
      <div ref="canvasRef" class="crop-canvas" :style="{ '--photo-aspect': photoAspect }">
        <img
          ref="imageRef"
          :src="imageUrl"
          alt=""
          draggable="false"
          class="absolute inset-0 w-full h-full object-cover select-none"
          @load="measureImage"
        />

        <!-- Everything outside the box is dimmed by one giant spread shadow,
             so there's no second set of overlay elements to keep in sync. -->
        <div
          class="crop-box"
          :class="{ 'is-dragging': gesture !== null }"
          :style="boxStyle"
          role="application"
          tabindex="0"
          :aria-label="t('management.showcasePreview.editors.cropBoxLabel')"
          @pointerdown="onBoxPointerDown"
          @keydown="onBoxKeydown"
        >
          <span class="crop-box__thirds" aria-hidden="true" />

          <button
            v-for="corner in CORNERS"
            :key="corner"
            type="button"
            class="crop-handle"
            :class="`crop-handle--${corner}`"
            :aria-label="t(CORNER_LABEL_KEYS[corner])"
            @pointerdown.stop="onHandlePointerDown(corner, $event)"
          />
        </div>
      </div>
    </div>

    <p class="text-xs text-slate-500 text-center">
      {{ t('management.showcasePreview.editors.cropHint') }}
    </p>

    <!-- Zoom is the keyboard-reachable and precise equivalent of the corner
         handles. It's also the control that unlocks movement on the axis the
         box is pinned to at full size, so it isn't optional chrome. -->
    <div class="flex items-center gap-3">
      <label :for="`${uid}-crop-zoom`" class="w-14 shrink-0 text-xs font-medium text-slate-600">
        {{ t('management.showcasePreview.editors.cropZoom') }}
      </label>
      <input
        :id="`${uid}-crop-zoom`"
        type="range"
        :min="1"
        :max="MAX_CROP_ZOOM"
        step="0.01"
        :value="zoom"
        class="flex-1 accent-[#1e90ff]"
        @input="onZoomInput"
      />
      <span class="w-10 shrink-0 text-right text-xs tabular-nums text-slate-500">
        {{ zoom.toFixed(1) }}×
      </span>
    </div>

    <button
      type="button"
      class="w-full px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      :disabled="isReset"
      @click="reset"
    >
      {{ t('management.showcasePreview.editors.cropReset') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import {
  MAX_CROP_ZOOM,
  SHOWCASE_FRAME_ASPECT,
  cropFromZoom,
  cropZoom,
  cropsEqual,
  maxCropSizeForAspect,
  moveCrop,
  resizeCropFromCorner,
  type CropCorner,
  type PhotoCrop,
  type Size,
} from '@/utils/photoCrop'

interface Props {
  /** Full URL of the photo being cropped. */
  imageUrl: string
  modelValue: PhotoCrop
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: PhotoCrop] }>()

const { t } = useAppLanguage()
const uid = useId()

const CORNERS: CropCorner[] = ['nw', 'ne', 'sw', 'se']

const CORNER_LABEL_KEYS: Record<CropCorner, string> = {
  nw: 'management.showcasePreview.editors.cropCornerTopLeft',
  ne: 'management.showcasePreview.editors.cropCornerTopRight',
  sw: 'management.showcasePreview.editors.cropCornerBottomLeft',
  se: 'management.showcasePreview.editors.cropCornerBottomRight',
}

/** One arrow-key press, in percentage points. */
const NUDGE_PERCENT = 1
const NUDGE_PERCENT_FINE = 0.2

const canvasRef = ref<HTMLElement | null>(null)
const imageRef = ref<HTMLImageElement | null>(null)

const naturalSize = ref<Size | null>(null)
const canvasSize = ref<Size>({ width: 0, height: 0 })

const photoAspect = computed(() =>
  naturalSize.value ? naturalSize.value.width / naturalSize.value.height : 1,
)

const boxStyle = computed(() => ({
  left: `${props.modelValue.x}%`,
  top: `${props.modelValue.y}%`,
  width: `${props.modelValue.width}%`,
  height: `${props.modelValue.height}%`,
}))

const zoom = computed(() =>
  naturalSize.value ? cropZoom(props.modelValue, naturalSize.value, SHOWCASE_FRAME_ASPECT) : 1,
)

/** The reset target: the largest phone-shaped box, centred. */
const resetCrop = computed(() =>
  naturalSize.value ? cropFromZoom(naturalSize.value, SHOWCASE_FRAME_ASPECT, 1) : null,
)

const isReset = computed(() => !!resetCrop.value && cropsEqual(props.modelValue, resetCrop.value))

const update = (next: PhotoCrop) => emit('update:modelValue', next)

const measureImage = () => {
  const image = imageRef.value
  if (!image?.naturalWidth || !image.naturalHeight) return
  naturalSize.value = { width: image.naturalWidth, height: image.naturalHeight }
}

const measureCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  // Layout values, not getBoundingClientRect: the manage page renders these
  // previews inside CSS-scaled containers, and a scaled rect would make every
  // pointer delta wrong by that factor.
  canvasSize.value = { width: canvas.clientWidth, height: canvas.clientHeight }
}

let canvasObserver: ResizeObserver | null = null

onMounted(() => {
  measureCanvas()
  // A cached image may already be decoded before the listener attaches, in
  // which case @load never fires.
  if (imageRef.value?.complete) measureImage()
  if (typeof ResizeObserver !== 'undefined' && canvasRef.value) {
    canvasObserver = new ResizeObserver(measureCanvas)
    canvasObserver.observe(canvasRef.value)
  }
})

onBeforeUnmount(() => {
  canvasObserver?.disconnect()
  canvasObserver = null
})

watch(
  () => props.imageUrl,
  () => {
    naturalSize.value = null
    if (imageRef.value?.complete) measureImage()
  },
)

// The aspect ratio can only be honoured once the image's dimensions are known;
// a stored crop from a different aspect (or the parent's initial guess) gets
// snapped to a legal box at that point.
watch(naturalSize, (natural) => {
  if (!natural) return
  const max = maxCropSizeForAspect(natural, SHOWCASE_FRAME_ASPECT)
  const expectedWidth = (props.modelValue.height / max.height) * max.width
  if (Math.abs(expectedWidth - props.modelValue.width) > 0.5) {
    update(
      cropFromZoom(
        natural,
        SHOWCASE_FRAME_ASPECT,
        cropZoom(props.modelValue, natural, SHOWCASE_FRAME_ASPECT),
        {
          x: props.modelValue.x + props.modelValue.width / 2,
          y: props.modelValue.y + props.modelValue.height / 2,
        },
      ),
    )
  }
})

// --- Gestures ----------------------------------------------------------------

type Gesture =
  | { kind: 'move'; pointerX: number; pointerY: number; start: PhotoCrop }
  | { kind: 'resize'; corner: CropCorner }

const gesture = ref<Gesture | null>(null)

/** Pointer position as a percentage of the image. */
const pointerToPercent = (event: PointerEvent): { x: number; y: number } | null => {
  const canvas = canvasRef.value
  if (!canvas || canvasSize.value.width <= 0 || canvasSize.value.height <= 0) return null
  const rect = canvas.getBoundingClientRect()
  // Ratios, so a CSS-scaled ancestor cancels out of both numerator and
  // denominator and the maths holds at any preview scale.
  return {
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100,
  }
}

const captureOn = (event: PointerEvent) => {
  const target = event.currentTarget as HTMLElement | null
  target?.setPointerCapture?.(event.pointerId)
}

const onBoxPointerDown = (event: PointerEvent) => {
  gesture.value = {
    kind: 'move',
    pointerX: event.clientX,
    pointerY: event.clientY,
    start: { ...props.modelValue },
  }
  captureOn(event)
  attachWindowListeners()
}

const onHandlePointerDown = (corner: CropCorner, event: PointerEvent) => {
  gesture.value = { kind: 'resize', corner }
  captureOn(event)
  attachWindowListeners()
}

const onPointerMove = (event: PointerEvent) => {
  const active = gesture.value
  if (!active) return

  if (active.kind === 'move') {
    const canvas = canvasRef.value
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    update(
      moveCrop(
        active.start,
        ((event.clientX - active.pointerX) / rect.width) * 100,
        ((event.clientY - active.pointerY) / rect.height) * 100,
      ),
    )
    return
  }

  const pointer = pointerToPercent(event)
  if (!pointer || !naturalSize.value) return
  update(
    resizeCropFromCorner(
      props.modelValue,
      naturalSize.value,
      SHOWCASE_FRAME_ASPECT,
      active.corner,
      pointer,
    ),
  )
}

const endGesture = () => {
  gesture.value = null
  detachWindowListeners()
}

// Window-level listeners rather than element ones: a resize drag routinely
// leaves the tiny handle, and releasing outside it must still end the gesture.
const attachWindowListeners = () => {
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', endGesture)
  window.addEventListener('pointercancel', endGesture)
}

const detachWindowListeners = () => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', endGesture)
  window.removeEventListener('pointercancel', endGesture)
}

onBeforeUnmount(detachWindowListeners)

// --- Keyboard ----------------------------------------------------------------

const onBoxKeydown = (event: KeyboardEvent) => {
  const step = event.shiftKey ? NUDGE_PERCENT_FINE : NUDGE_PERCENT
  const moves: Record<string, [number, number]> = {
    ArrowLeft: [-step, 0],
    ArrowRight: [step, 0],
    ArrowUp: [0, -step],
    ArrowDown: [0, step],
  }
  const delta = moves[event.key]
  if (!delta) return
  event.preventDefault()
  update(moveCrop(props.modelValue, delta[0], delta[1]))
}

// --- Zoom / reset ------------------------------------------------------------

const onZoomInput = (event: globalThis.Event) => {
  const next = Number((event.target as HTMLInputElement).value)
  if (!Number.isFinite(next) || !naturalSize.value) return
  // Zoom around the box's own centre so the subject stays put.
  update(
    cropFromZoom(naturalSize.value, SHOWCASE_FRAME_ASPECT, next, {
      x: props.modelValue.x + props.modelValue.width / 2,
      y: props.modelValue.y + props.modelValue.height / 2,
    }),
  )
}

const reset = () => {
  if (resetCrop.value) update(resetCrop.value)
}
</script>

<style scoped>
.crop-canvas {
  position: relative;
  width: 100%;
  aspect-ratio: var(--photo-aspect);
  /* Bounding the height directly would break the aspect ratio (width would
     stay at 100%), so the height cap is expressed as a width cap instead. */
  max-width: calc(46vh * var(--photo-aspect));
  overflow: hidden;
  border-radius: 0.875rem;
  background: #0f172a;
  touch-action: none;
  user-select: none;
}

.crop-box {
  position: absolute;
  cursor: move;
  border: 2px solid #ffffff;
  /* Dims the whole photo outside the box in one declaration. */
  box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.6);
  outline: none;
}

.crop-box:focus-visible {
  border-color: #1e90ff;
}

.crop-box.is-dragging {
  border-color: #1e90ff;
}

/* Rule-of-thirds guides, drawn with gradients so there are no child elements
   to position. */
.crop-box__thirds {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.4;
  background-image:
    linear-gradient(
      to right,
      transparent calc(33.333% - 0.5px),
      rgba(255, 255, 255, 0.8) calc(33.333% - 0.5px),
      rgba(255, 255, 255, 0.8) calc(33.333% + 0.5px),
      transparent calc(33.333% + 0.5px),
      transparent calc(66.666% - 0.5px),
      rgba(255, 255, 255, 0.8) calc(66.666% - 0.5px),
      rgba(255, 255, 255, 0.8) calc(66.666% + 0.5px),
      transparent calc(66.666% + 0.5px)
    ),
    linear-gradient(
      to bottom,
      transparent calc(33.333% - 0.5px),
      rgba(255, 255, 255, 0.8) calc(33.333% - 0.5px),
      rgba(255, 255, 255, 0.8) calc(33.333% + 0.5px),
      transparent calc(33.333% + 0.5px),
      transparent calc(66.666% - 0.5px),
      rgba(255, 255, 255, 0.8) calc(66.666% - 0.5px),
      rgba(255, 255, 255, 0.8) calc(66.666% + 0.5px),
      transparent calc(66.666% + 0.5px)
    );
}

.crop-handle {
  position: absolute;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  background: #ffffff;
  border: 1.5px solid rgba(15, 23, 42, 0.25);
  border-radius: 9999px;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.35);
  cursor: pointer;
}

.crop-handle:focus-visible {
  outline: 2px solid #1e90ff;
  outline-offset: 2px;
}

/* Handles sit centred on their corner, half outside the box, so they stay
   grabbable even when the box is small. */
.crop-handle--nw {
  top: -0.75rem;
  left: -0.75rem;
  cursor: nwse-resize;
}

.crop-handle--ne {
  top: -0.75rem;
  right: -0.75rem;
  cursor: nesw-resize;
}

.crop-handle--sw {
  bottom: -0.75rem;
  left: -0.75rem;
  cursor: nesw-resize;
}

.crop-handle--se {
  bottom: -0.75rem;
  right: -0.75rem;
  cursor: nwse-resize;
}
</style>
