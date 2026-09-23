<template>
  <div class="space-y-3">
    <!-- The frame holds still and the photograph moves under it, the way the
         iOS Photos crop tool works: what is inside the frame is what guests
         see, and the dimmed photo around it is what can still be brought in.
         The frame is the real shape of wherever this photo is drawn. -->
    <div
      ref="canvasRef"
      class="framing-canvas"
      :class="{ 'is-interacting': interacting, 'is-grabbing': pointerCount > 0 }"
      role="application"
      tabindex="0"
      :aria-label="t('management.showcasePreview.editors.cropBoxLabel')"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerEnd"
      @pointercancel="onPointerEnd"
      @lostpointercapture="onPointerEnd"
      @wheel="onWheel"
      @keydown="onKeydown"
    >
      <img
        ref="imageRef"
        :src="imageUrl"
        alt=""
        draggable="false"
        class="framing-photo"
        :style="photoStyle"
        @load="measureImage"
      />

      <!-- One spread shadow dims everything outside the frame, so there is no
           second set of overlay elements to keep in register. -->
      <div class="framing-frame" :style="frameStyle" aria-hidden="true">
        <span class="framing-thirds" />
      </div>

      <Loader v-if="!natural" class="framing-loading" aria-hidden="true" />

      <!-- Only offered once there is something to undo. -->
      <Transition name="framing-reset">
        <button
          v-if="natural && !isCentred"
          type="button"
          class="framing-reset"
          @pointerdown.stop
          @click="reset"
        >
          <RotateCcw class="w-3.5 h-3.5" aria-hidden="true" />
          {{ t('management.showcasePreview.editors.cropReset') }}
        </button>
      </Transition>
    </div>

    <p class="text-xs text-slate-500 text-center">
      {{ t('management.showcasePreview.editors.cropHint') }}
    </p>

    <!-- Zoom is the keyboard-reachable and precise equivalent of a pinch. -->
    <div class="flex items-center gap-3">
      <label :for="`${uid}-framing-zoom`" class="w-14 shrink-0 text-xs font-medium text-slate-600">
        {{ t('management.showcasePreview.editors.cropZoom') }}
      </label>
      <input
        :id="`${uid}-framing-zoom`"
        type="range"
        :min="1"
        :max="MAX_CROP_ZOOM"
        step="0.01"
        :value="sliderZoom"
        :disabled="!natural"
        class="flex-1 accent-[#1e90ff] disabled:opacity-50"
        @input="onZoomInput"
      />
      <span class="w-10 shrink-0 text-right text-xs tabular-nums text-slate-500">
        {{ sliderZoom.toFixed(1) }}×
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { Loader, RotateCcw } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { MAX_CROP_ZOOM, cropsEqual, type PhotoCrop, type Point, type Size } from '@/utils/photoCrop'
import {
  CENTRED_VIEW,
  clampCentre,
  clampView,
  projectMomentum,
  regionFromView,
  rubberband,
  unrubberband,
  viewFromRegion,
  visibleSpan,
  type FramingView,
} from '@/utils/photoFraming'

interface Props {
  /** Full URL of the photo being framed. */
  imageUrl: string
  /** Width ÷ height of the frame this photo is drawn in. */
  frameAspect: number
  /** The framed region, in % of the photo — see photoCrop.ts. */
  modelValue: PhotoCrop
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: PhotoCrop] }>()

const { t } = useAppLanguage()
const uid = useId()

/**
 * How much of the canvas the frame may take. The rest is the dimmed photograph
 * around it — the part being chosen from — so a frame that filled the canvas
 * would hide exactly what the organizer needs to see.
 */
const FRAME_FILL_W = 0.8
const FRAME_FILL_H = 0.86

/**
 * Settling after a release: critically damped (a photo that was dragged has no
 * business bouncing), at the 0.4s response Apple uses for repositioning.
 */
const SPRING_RESPONSE = 0.4

/** How far past each zoom limit a pinch may be pulled, with resistance. */
const ZOOM_OVERSHOOT = 1
const ZOOM_UNDERSHOOT = 0.5

/** Trackpad pinches arrive as ctrl+wheel; this makes one feel 1:1. */
const WHEEL_ZOOM_RATE = 0.01

/** Arrow-key nudges, in % of the photo. */
const NUDGE_PERCENT = 1
const NUDGE_PERCENT_FINE = 0.2
const KEY_ZOOM_STEP = 1.1

/** Velocity is read over the tail of the drag, and a finger that stopped before
 *  lifting has none. */
const VELOCITY_WINDOW_MS = 100
const VELOCITY_STALE_MS = 50

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

const canvasRef = ref<HTMLElement | null>(null)
const imageRef = ref<HTMLImageElement | null>(null)

const natural = ref<Size | null>(null)
const canvasSize = ref<Size>({ width: 0, height: 0 })

/**
 * What is on screen. Mid-gesture it can sit past a limit — the photo pulled
 * beyond its edge, a pinch beyond its zoom — which is the rubber band; every
 * value that leaves this component goes through `clampView` first.
 */
const view = ref<FramingView>({ zoom: 1, centre: { x: 50, y: 50 } })

// --- Layout --------------------------------------------------------------------

interface Box {
  left: number
  top: number
  width: number
  height: number
}

const frameBox = computed<Box | null>(() => {
  const { width: cw, height: ch } = canvasSize.value
  if (!cw || !ch || !(props.frameAspect > 0)) return null
  const width = Math.min(cw * FRAME_FILL_W, ch * FRAME_FILL_H * props.frameAspect)
  const height = width / props.frameAspect
  return { left: (cw - width) / 2, top: (ch - height) / 2, width, height }
})

/** The photo's size at zoom 1, where it exactly covers the frame. */
const baseSize = computed<Size | null>(() => {
  const frame = frameBox.value
  const n = natural.value
  if (!frame || !n) return null
  const scale = Math.max(frame.width / n.width, frame.height / n.height)
  return { width: n.width * scale, height: n.height * scale }
})

const frameCentre = (frame: Box): Point => ({
  x: frame.left + frame.width / 2,
  y: frame.top + frame.height / 2,
})

const frameStyle = computed((): Record<string, string> => {
  const frame = frameBox.value
  if (!frame) return { display: 'none' }
  return {
    left: `${frame.left}px`,
    top: `${frame.top}px`,
    width: `${frame.width}px`,
    height: `${frame.height}px`,
  }
})

/** A transform, never left/top: this repaints on every pointer event. */
const photoStyle = computed((): Record<string, string> => {
  const frame = frameBox.value
  const base = baseSize.value
  if (!frame || !base) return { visibility: 'hidden' }
  const { zoom, centre } = view.value
  const c = frameCentre(frame)
  const left = c.x - (centre.x / 100) * base.width * zoom
  const top = c.y - (centre.y / 100) * base.height * zoom
  return {
    width: `${base.width}px`,
    height: `${base.height}px`,
    transform: `translate3d(${left}px, ${top}px, 0) scale(${zoom})`,
  }
})

const sliderZoom = computed(() => clamp(view.value.zoom, 1, MAX_CROP_ZOOM))

const centredRegion = computed(() =>
  natural.value ? regionFromView(CENTRED_VIEW, natural.value, props.frameAspect) : null,
)

const isCentred = computed(
  () =>
    !natural.value ||
    !centredRegion.value ||
    cropsEqual(regionFromView(view.value, natural.value, props.frameAspect), centredRegion.value),
)

// --- Measuring ---------------------------------------------------------------

const measureImage = () => {
  const image = imageRef.value
  if (!image?.naturalWidth || !image.naturalHeight) return
  natural.value = { width: image.naturalWidth, height: image.naturalHeight }
}

const measureCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  // Layout values, not getBoundingClientRect: a CSS-scaled ancestor would make
  // every pointer delta wrong by that factor (localPoint undoes it instead).
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

// --- Model sync --------------------------------------------------------------

/** The last region this editor sent up, so its own echo isn't re-applied. */
let lastEmitted: PhotoCrop | null = null

const commit = (next: FramingView) => {
  const n = natural.value
  if (!n) return
  const region = regionFromView(next, n, props.frameAspect)
  if (lastEmitted && cropsEqual(region, lastEmitted)) return
  lastEmitted = region
  emit('update:modelValue', region)
}

/** Open on exactly what the stage draws in this frame today. Never emits:
 *  looking at a photo is not an edit. */
const syncFromModel = () => {
  const n = natural.value
  if (!n) return
  if (lastEmitted && cropsEqual(props.modelValue, lastEmitted)) return
  stopSpring()
  view.value = viewFromRegion(props.modelValue, n, props.frameAspect)
}

watch(natural, () => {
  lastEmitted = null
  syncFromModel()
})
watch(() => props.modelValue, syncFromModel)
watch(
  () => props.frameAspect,
  () => {
    lastEmitted = null
    syncFromModel()
  },
)
watch(
  () => props.imageUrl,
  () => {
    natural.value = null
    if (imageRef.value?.complete) measureImage()
  },
)

// --- Rubber band ---------------------------------------------------------------
// Resistance is applied in screen pixels, per axis, against the frame's size on
// that axis — so it feels the same on a tall column and a wide booth frame.

const bandZoom = (zoom: number): number => {
  if (zoom > MAX_CROP_ZOOM) return MAX_CROP_ZOOM + rubberband(zoom - MAX_CROP_ZOOM, ZOOM_OVERSHOOT)
  if (zoom < 1) return 1 - rubberband(1 - zoom, ZOOM_UNDERSHOOT)
  return zoom
}

const unbandZoom = (zoom: number): number => {
  if (zoom > MAX_CROP_ZOOM) return MAX_CROP_ZOOM + unrubberband(zoom - MAX_CROP_ZOOM, ZOOM_OVERSHOOT)
  if (zoom < 1) return 1 - unrubberband(1 - zoom, ZOOM_UNDERSHOOT)
  return zoom
}

type Band = (offset: number, dimension: number) => number

const bandCentreWith = (band: Band, centre: Point, zoom: number): Point => {
  const n = natural.value
  const base = baseSize.value
  const frame = frameBox.value
  if (!n || !base || !frame) return centre
  const inside = clampCentre(centre, visibleSpan(n, props.frameAspect, zoom))
  const axis = (value: number, limit: number, basePx: number, framePx: number) => {
    const pxPerPercent = (basePx * zoom) / 100
    if (pxPerPercent <= 0) return limit
    return limit + band((value - limit) * pxPerPercent, framePx) / pxPerPercent
  }
  return {
    x: axis(centre.x, inside.x, base.width, frame.width),
    y: axis(centre.y, inside.y, base.height, frame.height),
  }
}

const bandCentre = (centre: Point, zoom: number) => bandCentreWith(rubberband, centre, zoom)
const unbandCentre = (centre: Point, zoom: number) => bandCentreWith(unrubberband, centre, zoom)

/** Where the finger "really" has the photo: the displayed view, resistance undone. */
const unbandedView = (): FramingView => ({
  zoom: unbandZoom(view.value.zoom),
  centre: unbandCentre(view.value.centre, view.value.zoom),
})

const showRaw = (raw: FramingView) => {
  const zoom = bandZoom(raw.zoom)
  view.value = { zoom, centre: bandCentre(raw.centre, zoom) }
}

// --- Spring --------------------------------------------------------------------

let springFrame = 0

const stopSpring = () => {
  if (springFrame) cancelAnimationFrame(springFrame)
  springFrame = 0
}

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

/**
 * Glide from what is on screen to `target`, starting at `velocity` (% of the
 * photo per second) — the finger's own speed, so there is no seam between the
 * drag and the settle. Three independent critically damped springs (zoom, x,
 * y), solved analytically rather than integrated, so a slow frame can't make
 * them drift. Anything past an edge on the way is still rubber-banded.
 */
const animateTo = (target: FramingView, velocity: Point = { x: 0, y: 0 }) => {
  stopSpring()
  if (prefersReducedMotion()) {
    view.value = target
    return
  }
  const omega = (2 * Math.PI) / SPRING_RESPONSE
  const from = unbandedView()
  const axes: [from: number, to: number, v0: number][] = [
    [from.zoom, target.zoom, 0],
    [from.centre.x, target.centre.x, velocity.x],
    [from.centre.y, target.centre.y, velocity.y],
  ]
  const start = performance.now()

  const step = (now: number) => {
    const t = (now - start) / 1000
    const decay = Math.exp(-omega * t)
    const offsets = axes.map(([x0, x1, v0]) => {
      const a = x0 - x1
      return (a + (v0 + omega * a) * t) * decay
    })
    const settled = t > 1.5 || offsets.every((offset) => Math.abs(offset) < 0.005)
    if (settled) {
      springFrame = 0
      view.value = target
      return
    }
    showRaw({
      zoom: target.zoom + offsets[0],
      centre: { x: target.centre.x + offsets[1], y: target.centre.y + offsets[2] },
    })
    springFrame = requestAnimationFrame(step)
  }
  springFrame = requestAnimationFrame(step)
}

// --- Gestures ------------------------------------------------------------------

/** Pointers currently down, in canvas layout pixels. */
const pointers = new Map<number, Point>()
const pointerCount = ref(0)

/**
 * Re-based every time a finger lands or lifts, so going from a pinch to a drag
 * (or back) never jumps: the new gesture starts from wherever the photo is.
 */
let gesture: { raw: FramingView; anchor: Point; distance: number } | null = null
/** The unresisted view the current gesture has reached. */
let raw: FramingView = { zoom: 1, centre: { x: 50, y: 50 } }
/** Recent single-finger positions, for the release velocity. */
let trail: { t: number; p: Point }[] = []
/** A release after a pinch hands no velocity on — two lifting fingers are noise. */
let wasPinching = false

const localPoint = (event: { clientX: number; clientY: number }): Point => {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  const sx = rect.width ? canvas.clientWidth / rect.width : 1
  const sy = rect.height ? canvas.clientHeight / rect.height : 1
  return { x: (event.clientX - rect.left) * sx, y: (event.clientY - rect.top) * sy }
}

const midpoint = (points: Point[]): Point =>
  points.length < 2
    ? points[0]
    : { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 }

const spread = (points: Point[]): number =>
  points.length < 2 ? 0 : Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y)

const rebase = () => {
  const points = [...pointers.values()].slice(0, 2)
  if (!points.length) {
    gesture = null
    return
  }
  gesture = { raw: { ...raw, centre: { ...raw.centre } }, anchor: midpoint(points), distance: spread(points) }
  trail = []
}

const interacting = ref(false)
let interactingTimer: ReturnType<typeof setTimeout> | null = null

/** The grid and the lighter dim come up on contact and linger a moment after. */
const holdInteracting = (lingerMs: number | null) => {
  if (interactingTimer) clearTimeout(interactingTimer)
  interactingTimer = null
  interacting.value = true
  if (lingerMs !== null) {
    interactingTimer = setTimeout(() => {
      interacting.value = false
    }, lingerMs)
  }
}

const onPointerDown = (event: PointerEvent) => {
  if (!baseSize.value) return
  if (event.pointerType === 'mouse' && event.button !== 0) return
  // Grabbing a photo that is still settling takes it from where it is.
  if (!pointers.size) {
    stopSpring()
    raw = unbandedView()
    wasPinching = false
  }
  // No focus() here: the canvas is focusable, so the press focuses it natively,
  // and only native pointer focus keeps :focus-visible — the keyboard ring —
  // off for someone using a mouse.
  canvasRef.value?.setPointerCapture?.(event.pointerId)
  pointers.set(event.pointerId, localPoint(event))
  pointerCount.value = pointers.size
  if (pointers.size > 1) wasPinching = true
  holdInteracting(null)
  rebase()
}

const onPointerMove = (event: PointerEvent) => {
  if (!pointers.has(event.pointerId) || !gesture) return
  const frame = frameBox.value
  const base = baseSize.value
  if (!frame || !base) return
  pointers.set(event.pointerId, localPoint(event))
  const points = [...pointers.values()].slice(0, 2)
  const c = frameCentre(frame)
  const start = gesture.raw

  if (points.length === 1) {
    // 1:1 — the photo stays under the finger, at the offset it was grabbed.
    const zoom = bandZoom(start.zoom)
    const p = points[0]
    raw = {
      zoom: start.zoom,
      centre: {
        x: start.centre.x - ((p.x - gesture.anchor.x) / (base.width * zoom)) * 100,
        y: start.centre.y - ((p.y - gesture.anchor.y) / (base.height * zoom)) * 100,
      },
    }
    trail.push({ t: performance.now(), p })
    if (trail.length > 12) trail.shift()
  } else {
    // Pinch about the fingers: the point of the photo that was between them
    // stays between them while they spread, and follows them as they move.
    const mid = midpoint(points)
    const startZoom = bandZoom(start.zoom)
    const rawZoom = gesture.distance > 0 ? start.zoom * (spread(points) / gesture.distance) : start.zoom
    const zoom = bandZoom(rawZoom)
    const pinned = {
      x: start.centre.x + ((gesture.anchor.x - c.x) / (base.width * startZoom)) * 100,
      y: start.centre.y + ((gesture.anchor.y - c.y) / (base.height * startZoom)) * 100,
    }
    raw = {
      zoom: rawZoom,
      centre: {
        x: pinned.x - ((mid.x - c.x) / (base.width * zoom)) * 100,
        y: pinned.y - ((mid.y - c.y) / (base.height * zoom)) * 100,
      },
    }
  }

  showRaw(raw)
  if (natural.value) commit(clampView(view.value, natural.value, props.frameAspect))
}

/** Finger velocity over the tail of the drag, px/s; zero if it had stopped. */
const releaseVelocity = (): Point => {
  const now = performance.now()
  const last = trail[trail.length - 1]
  if (!last || wasPinching || now - last.t > VELOCITY_STALE_MS) return { x: 0, y: 0 }
  const first = trail.find((sample) => last.t - sample.t <= VELOCITY_WINDOW_MS) ?? last
  const dt = (last.t - first.t) / 1000
  if (dt <= 0) return { x: 0, y: 0 }
  return { x: (last.p.x - first.p.x) / dt, y: (last.p.y - first.p.y) / dt }
}

const onPointerEnd = (event: PointerEvent) => {
  if (!pointers.has(event.pointerId)) return
  const velocity = pointers.size === 1 ? releaseVelocity() : { x: 0, y: 0 }
  pointers.delete(event.pointerId)
  pointerCount.value = pointers.size
  if (pointers.size) {
    rebase()
    return
  }
  gesture = null
  holdInteracting(400)
  settle(velocity)
}

/**
 * Let go: carry the flick forward (momentum projection), keep the frame on
 * the photo, and glide there from wherever the rubber band left it, at the
 * finger's speed. The destination is committed now, not when the glide ends.
 */
const settle = (fingerVelocity: Point) => {
  const n = natural.value
  const base = baseSize.value
  if (!n || !base) return
  const current = view.value
  const zoom = clamp(current.zoom, 1, MAX_CROP_ZOOM)
  // The photo moves with the finger, so the point at the frame's centre moves
  // the other way.
  const velocity = {
    x: -(fingerVelocity.x / (base.width * current.zoom)) * 100,
    y: -(fingerVelocity.y / (base.height * current.zoom)) * 100,
  }
  const target = clampView(
    {
      zoom,
      centre: {
        x: current.centre.x + projectMomentum(velocity.x),
        y: current.centre.y + projectMomentum(velocity.y),
      },
    },
    n,
    props.frameAspect,
  )
  commit(target)
  raw = target
  animateTo(target, velocity)
}

onBeforeUnmount(() => {
  stopSpring()
  canvasObserver?.disconnect()
  canvasObserver = null
  if (interactingTimer) clearTimeout(interactingTimer)
})

// --- Wheel, keyboard, slider -----------------------------------------------------
// Direct and in bounds: none of these has a release to spring back from.

const place = (next: FramingView) => {
  const n = natural.value
  if (!n) return
  stopSpring()
  const clamped = clampView(next, n, props.frameAspect)
  view.value = clamped
  raw = clamped
  commit(clamped)
}

/** Zoom to `zoom` keeping the photo's point at `at` (canvas px) where it is. */
const zoomAbout = (zoom: number, at: Point) => {
  const frame = frameBox.value
  const base = baseSize.value
  const n = natural.value
  if (!frame || !base || !n) return
  const current = clampView(view.value, n, props.frameAspect)
  const next = clamp(zoom, 1, MAX_CROP_ZOOM)
  const c = frameCentre(frame)
  const pinned = {
    x: current.centre.x + ((at.x - c.x) / (base.width * current.zoom)) * 100,
    y: current.centre.y + ((at.y - c.y) / (base.height * current.zoom)) * 100,
  }
  place({
    zoom: next,
    centre: {
      x: pinned.x - ((at.x - c.x) / (base.width * next)) * 100,
      y: pinned.y - ((at.y - c.y) / (base.height * next)) * 100,
    },
  })
}

const onWheel = (event: WheelEvent) => {
  const base = baseSize.value
  const frame = frameBox.value
  const n = natural.value
  if (!base || !frame || !n || pointers.size) return
  event.preventDefault()
  holdInteracting(400)
  const current = clampView(view.value, n, props.frameAspect)
  // A trackpad pinch arrives as ctrl+wheel in every desktop browser.
  if (event.ctrlKey || event.metaKey) {
    zoomAbout(current.zoom * Math.exp(-event.deltaY * WHEEL_ZOOM_RATE), localPoint(event))
    return
  }
  // Two-finger scrolling moves the photo the way the fingers go.
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? frame.height : 1
  place({
    zoom: current.zoom,
    centre: {
      x: current.centre.x + ((event.deltaX * unit) / (base.width * current.zoom)) * 100,
      y: current.centre.y + ((event.deltaY * unit) / (base.height * current.zoom)) * 100,
    },
  })
}

const onKeydown = (event: KeyboardEvent) => {
  const n = natural.value
  const frame = frameBox.value
  if (!n || !frame) return
  const current = clampView(view.value, n, props.frameAspect)
  const step = event.shiftKey ? NUDGE_PERCENT_FINE : NUDGE_PERCENT
  // The arrows move the photo, as a drag does.
  const moves: Record<string, [number, number]> = {
    ArrowLeft: [step, 0],
    ArrowRight: [-step, 0],
    ArrowUp: [0, step],
    ArrowDown: [0, -step],
  }
  const move = moves[event.key]
  if (move) {
    event.preventDefault()
    place({
      zoom: current.zoom,
      centre: { x: current.centre.x + move[0], y: current.centre.y + move[1] },
    })
    return
  }
  if (event.key === '+' || event.key === '=') {
    event.preventDefault()
    zoomAbout(current.zoom * KEY_ZOOM_STEP, frameCentre(frame))
  } else if (event.key === '-' || event.key === '_') {
    event.preventDefault()
    zoomAbout(current.zoom / KEY_ZOOM_STEP, frameCentre(frame))
  } else if (event.key === '0') {
    event.preventDefault()
    reset()
  }
}

const onZoomInput = (event: globalThis.Event) => {
  const next = Number((event.target as HTMLInputElement).value)
  const frame = frameBox.value
  if (!Number.isFinite(next) || !frame) return
  zoomAbout(next, frameCentre(frame))
}

/** Back to the whole frame's worth of photo, centred — gliding there from
 *  where it is, so it reads as the same photo moving, not a new one. */
const reset = () => {
  const n = natural.value
  if (!n) return
  const target = clampView(CENTRED_VIEW, n, props.frameAspect)
  commit(target)
  raw = target
  animateTo(target)
}
</script>

<style scoped>
.framing-canvas {
  position: relative;
  width: 100%;
  height: clamp(15rem, 48vh, 26rem);
  overflow: hidden;
  border-radius: 0.875rem;
  background: #0f172a;
  touch-action: none;
  user-select: none;
  cursor: grab;
  outline: none;
}

.framing-canvas.is-grabbing {
  cursor: grabbing;
}

.framing-canvas:focus-visible {
  box-shadow:
    0 0 0 2px #ffffff,
    0 0 0 4px #1e90ff;
}

.framing-photo {
  position: absolute;
  left: 0;
  top: 0;
  /* Preflight's max-width: 100% would squash a zoomed photo back into the
     canvas and distort it. */
  max-width: none;
  transform-origin: 0 0;
  pointer-events: none;
  -webkit-user-drag: none;
}

.is-interacting .framing-photo {
  will-change: transform;
}

.framing-frame {
  position: absolute;
  pointer-events: none;
  border: 1.5px solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.62);
  transition: box-shadow 0.3s ease-out;
}

/* Lighter while the photo is moving, so what is about to come into the frame
   can be seen; darker at rest, so the frame's content reads as the result. */
.is-interacting .framing-frame {
  box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.4);
  transition-duration: 0.15s;
}

/* Rule-of-thirds guides — only while moving, as in Photos. Gradients, so there
   are no child elements to position. */
.framing-thirds {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.3s ease-out;
  background-image:
    linear-gradient(
      to right,
      transparent calc(33.333% - 0.5px),
      rgba(255, 255, 255, 0.55) calc(33.333% - 0.5px),
      rgba(255, 255, 255, 0.55) calc(33.333% + 0.5px),
      transparent calc(33.333% + 0.5px),
      transparent calc(66.666% - 0.5px),
      rgba(255, 255, 255, 0.55) calc(66.666% - 0.5px),
      rgba(255, 255, 255, 0.55) calc(66.666% + 0.5px),
      transparent calc(66.666% + 0.5px)
    ),
    linear-gradient(
      to bottom,
      transparent calc(33.333% - 0.5px),
      rgba(255, 255, 255, 0.55) calc(33.333% - 0.5px),
      rgba(255, 255, 255, 0.55) calc(33.333% + 0.5px),
      transparent calc(33.333% + 0.5px),
      transparent calc(66.666% - 0.5px),
      rgba(255, 255, 255, 0.55) calc(66.666% - 0.5px),
      rgba(255, 255, 255, 0.55) calc(66.666% + 0.5px),
      transparent calc(66.666% + 0.5px)
    );
}

.is-interacting .framing-thirds {
  opacity: 1;
  transition-duration: 0.12s;
}

.framing-loading {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 1.5rem;
  height: 1.5rem;
  margin: -0.75rem 0 0 -0.75rem;
  color: rgba(255, 255, 255, 0.6);
  animation: framing-spin 1s linear infinite;
}

@keyframes framing-spin {
  to {
    transform: rotate(360deg);
  }
}

.framing-reset {
  position: absolute;
  top: 0.625rem;
  right: 0.625rem;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  min-height: 2rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #334155;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 9999px;
  box-shadow: 0 1px 6px rgba(15, 23, 42, 0.25);
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    transform 0.1s ease-out;
}

.framing-reset:hover {
  background: #ffffff;
}

.framing-reset:active {
  transform: scale(0.97);
}

.framing-reset:focus-visible {
  outline: 2px solid #1e90ff;
  outline-offset: 2px;
}

.framing-reset-enter-active,
.framing-reset-leave-active {
  transition:
    opacity 0.18s ease-out,
    transform 0.18s ease-out;
}

.framing-reset-enter-from,
.framing-reset-leave-to {
  opacity: 0;
  transform: scale(0.94);
}

@media (prefers-reduced-motion: reduce) {
  .framing-frame,
  .framing-thirds {
    transition: none;
  }

  .framing-loading {
    animation: none;
  }
}
</style>
