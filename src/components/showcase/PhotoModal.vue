<template>
  <div v-if="isMounted" ref="backdropRef" class="pm-root" @click="requestClose">
    <!-- Close Button -->
    <button
      ref="closeRef"
      class="pm-chrome pm-close"
      aria-label="Close photo viewer"
      @click.stop="requestClose"
    >
      <X class="w-5 h-5" />
    </button>

    <!-- Desktop side navigation. Hidden on touch, where the swipe and the
         chevrons beside the counter do this job within thumb reach. -->
    <button
      v-if="canGoPrevious"
      class="pm-chrome pm-nav pm-nav--prev"
      aria-label="Previous photo"
      @click.stop="goToPrevious"
    >
      <ChevronLeft class="w-6 h-6" />
    </button>
    <button
      v-if="canGoNext"
      class="pm-chrome pm-nav pm-nav--next"
      aria-label="Next photo"
      @click.stop="goToNext"
    >
      <ChevronRight class="w-6 h-6" />
    </button>

    <div class="pm-body">
      <!--
        The stage carries the photo's own aspect ratio, so it hugs the image
        instead of being a full-width box with letterbox gutters on either side
        of a portrait shot. Two things depend on that: the tap-to-close target
        starts exactly where the photograph ends, and the open animation can
        scale the stage uniformly from the thumbnail with no distortion.
      -->
      <div
        ref="stageRef"
        class="pm-stage"
        :style="{ '--pm-aspect': String(stageAspect) }"
        @click.stop
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <!-- Base layer: the smallest ladder rung, so the frame is never blank
             while the full-resolution candidate is in flight. On a phone this
             is usually the rung the grid already loaded, i.e. free. -->
        <img
          v-if="displayPhoto"
          :src="getPhotoPreviewUrl(displayPhoto.image)"
          alt=""
          class="pm-photo"
          aria-hidden="true"
          v-bind="protectionAttrs"
          @load="handlePreviewLoad"
        />
        <img
          v-if="displayPhoto"
          :key="displayPhoto.id"
          :src="getFullPhotoUrl(displayPhoto.image)"
          :srcset="getFullPhotoSrcset(displayPhoto.image)"
          sizes="(min-width: 1152px) 1152px, 100vw"
          :alt="displayPhoto.caption || 'Event Photo'"
          class="pm-photo pm-photo--full"
          :class="{ 'is-loaded': fullImageLoaded }"
          v-bind="protectionAttrs"
          @load="fullImageLoaded = true"
        />

        <!-- Transparent protection overlay (production-only) -->
        <div
          v-if="isProduction && displayPhoto"
          class="pm-guard"
          @contextmenu.prevent
        ></div>

        <!-- Caption -->
        <div v-if="displayPhoto?.caption" class="pm-caption">
          <p class="text-center text-sm">{{ displayPhoto.caption }}</p>
        </div>
      </div>

      <!--
        Counter and navigation are one control. The chevrons replace the old
        "Swipe to navigate" pill: that was hardcoded English on an invitation
        that is usually read in Khmer, and it re-announced itself on every
        single open - an animation seen dozens of times for a gesture everybody
        already knows. Glyphs need no translation, and they are tappable, which
        gives touch users an alternative to the swipe rather than a lecture
        about it.
      -->
      <div ref="chromeRef" class="pm-counter">
        <button
          class="pm-step"
          :class="{ 'is-off': !canGoPrevious }"
          :disabled="!canGoPrevious"
          aria-label="Previous photo"
          @click.stop="goToPrevious"
        >
          &lsaquo;
        </button>
        <span class="pm-count">{{ currentIndex + 1 }} / {{ photos.length }}</span>
        <button
          class="pm-step"
          :class="{ 'is-off': !canGoNext }"
          :disabled="!canGoNext"
          aria-label="Next photo"
          @click.stop="goToNext"
        >
          &rsaquo;
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref, nextTick, onUnmounted } from 'vue'
import { X, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { EventPhoto } from '../../composables/useEventShowcase'
import {
  useTemplateProcessor,
  PHOTO_DELIVERY,
} from '../../composables/showcase/useTemplateProcessor'
import { useAssetProtection } from '../../composables/showcase/useAssetProtection'

// Asset protection (production-only)
const { isProduction, protectionAttrs } = useAssetProtection()

interface Props {
  isOpen: boolean
  photos: EventPhoto[]
  currentPhoto: EventPhoto | null
  getMediaUrl: (url: string) => string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  navigate: [EventPhoto]
}>()

// Template processor for optimized media URLs
const { getOptimizedMediaUrl, getOptimizedMediaSrcset } = useTemplateProcessor()

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)'
const ENTER_MS = 320
const EXIT_MS = 220
const CHROME_MS = 200

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

/**
 * The lightbox used to request the *thumbnail* width, deliberately, so opening
 * a photo was a guaranteed cache hit. That made the cache hit the whole feature:
 * the frame is up to 1152px wide at 85vh, so tapping a photo showed the same
 * ~500px image stretched, and there was no way to actually look at a picture.
 *
 * It now asks for the frame's real size and keeps the fast first paint by
 * layering, rather than by refusing to load anything better.
 */
const getPhotoPreviewUrl = (imageUrl: string) =>
  getOptimizedMediaUrl(imageUrl, { ...PHOTO_DELIVERY, width: 640, retina: 1 })

const getFullPhotoUrl = (imageUrl: string) =>
  getOptimizedMediaUrl(imageUrl, { ...PHOTO_DELIVERY, width: 1600, retina: 1 })

const getFullPhotoSrcset = (imageUrl: string) =>
  getOptimizedMediaSrcset(imageUrl, PHOTO_DELIVERY) || undefined

const backdropRef = ref<HTMLElement | null>(null)
const stageRef = ref<HTMLElement | null>(null)
const closeRef = ref<HTMLElement | null>(null)
const chromeRef = ref<HTMLElement | null>(null)

/**
 * Mount is owned here rather than by the `isOpen` prop, because the parent
 * clears `currentPhoto` the moment it closes - so the element and its photo
 * both have to outlive the prop long enough to animate out.
 */
const isMounted = ref(false)
const displayPhoto = ref<EventPhoto | null>(null)

/** Reset per photo, so swiping doesn't reveal the next image before it decodes. */
const fullImageLoaded = ref(false)

/**
 * Drives the stage's `aspect-ratio`, and it has to be known *before* the first
 * paint or the open animation would measure the wrong target box. It is taken
 * from the grid thumbnail, which has already loaded and - because the grid
 * renders photos at their natural ratio rather than cropping them - is exactly
 * the ratio the full image will have. `handlePreviewLoad` corrects it
 * afterwards for the case where no thumbnail could be found.
 */
const stageAspect = ref(1.5)

const handlePreviewLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
  if (img.naturalWidth > 0 && img.naturalHeight > 0) {
    stageAspect.value = img.naturalWidth / img.naturalHeight
  }
}

const currentIndex = computed(() => {
  if (!displayPhoto.value || props.photos.length === 0) return 0
  return props.photos.findIndex((photo) => photo.id === displayPhoto.value?.id)
})

const canGoPrevious = computed(() => currentIndex.value > 0)
const canGoNext = computed(() => currentIndex.value < props.photos.length - 1)

/**
 * The grid thumbnail this photo was opened from, if it is still on screen.
 * PhotoGallery already stamps `data-photo-id` on every image, so the origin can
 * be recovered here without threading a rect through the parent view and the
 * showcase composable.
 *
 * `data-photo-id` is therefore the opt-in for the zoom, and it is only correct
 * on a gallery that renders photos at their natural ratio. V2's strip crops to
 * a fixed 230px height with `object-fit: cover`, so its thumbnails do not share
 * an aspect ratio with the full image - it deliberately has no `data-photo-id`
 * and gets the centred fallback instead. Do not add the attribute to a cropping
 * gallery: the single uniform scale below would visibly reshape the photograph.
 */
const findThumbRect = (photoId: string | number | undefined): DOMRect | null => {
  if (photoId === undefined || typeof document === 'undefined') return null
  const el = document.querySelector(`img[data-photo-id="${photoId}"]`)
  if (!el) return null
  const rect = el.getBoundingClientRect()
  if (rect.width < 1 || rect.height < 1) return null
  // Scrolled out of the card: zooming from off-screen would fly in from nowhere.
  if (rect.bottom <= 0 || rect.top >= window.innerHeight) return null
  return rect
}

let enterAnimations: Animation[] = []
let exitAnimation: Animation | null = null
let snapAnimation: Animation | null = null

const cancelAnimations = () => {
  enterAnimations.forEach((animation) => animation.cancel())
  enterAnimations = []
  exitAnimation?.cancel()
  exitAnimation = null
  snapAnimation?.cancel()
  snapAnimation = null
}

const runEnter = () => {
  const backdrop = backdropRef.value
  const stage = stageRef.value
  if (!backdrop || !stage) return

  const reduced = prefersReducedMotion()

  enterAnimations.push(
    backdrop.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: reduced ? 150 : ENTER_MS,
      easing: EASE_OUT,
    }),
  )

  // Chrome arrives after the photograph has landed. Fading it in with the zoom
  // would put a counter and a close button on top of a still-moving image.
  const chrome = [closeRef.value, chromeRef.value].filter(Boolean) as HTMLElement[]
  chrome.forEach((el) => {
    enterAnimations.push(
      el.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: CHROME_MS,
        delay: reduced ? 0 : ENTER_MS - 120,
        easing: EASE_OUT,
        fill: 'backwards',
      }),
    )
  })

  if (reduced) {
    enterAnimations.push(
      stage.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: EASE_OUT }),
    )
    return
  }

  const target = stage.getBoundingClientRect()
  const thumb = findThumbRect(displayPhoto.value?.id)

  if (thumb && target.width > 1) {
    // A single uniform scale: the thumbnail and the full frame share an aspect
    // ratio, so there is no axis-independent stretch to correct for and the
    // photograph never distorts on the way up.
    const scale = thumb.width / target.width
    const dx = thumb.left + thumb.width / 2 - (target.left + target.width / 2)
    const dy = thumb.top + thumb.height / 2 - (target.top + target.height / 2)
    enterAnimations.push(
      stage.animate(
        [
          { transform: `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`, opacity: 0.6 },
          { transform: 'translate3d(0, 0, 0) scale(1)', opacity: 1 },
        ],
        { duration: ENTER_MS, easing: EASE_OUT },
      ),
    )
  } else {
    // No thumbnail on screen. Nothing in the real world appears from nothing,
    // so this still starts from a visible size rather than from zero.
    enterAnimations.push(
      stage.animate(
        [
          { transform: 'scale(0.94)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1 },
        ],
        { duration: 260, easing: EASE_OUT },
      ),
    )
  }
}

const runExit = (fromDrag: boolean): Promise<void> => {
  const backdrop = backdropRef.value
  const stage = stageRef.value
  if (!backdrop || !stage) return Promise.resolve()

  const reduced = prefersReducedMotion()

  // Read the live transform *before* stopping anything. Cancelling the open
  // animation first would snap the photo to its resting position and then exit
  // from there, which is visible as a jolt if you dismiss mid-open.
  const currentTransform = getComputedStyle(stage).transform
  const from = currentTransform === 'none' ? 'translate3d(0, 0, 0) scale(1)' : currentTransform
  const fromOpacity = Number(backdrop.style.opacity || 1)
  cancelAnimations()

  backdrop.animate([{ opacity: fromOpacity }, { opacity: 0 }], {
    duration: reduced ? 120 : EXIT_MS,
    easing: EASE_OUT,
    fill: 'forwards',
  })

  let stageKeyframes: Keyframe[]
  if (reduced) {
    stageKeyframes = [{ opacity: 1 }, { opacity: 0 }]
  } else if (fromDrag) {
    // Dismissed by flicking the photo away - carry the motion it already has
    // rather than snapping back to centre first and then leaving.
    stageKeyframes = [
      { transform: from, opacity: 1 },
      { transform: `${from} translate3d(0, 96px, 0) scale(0.9)`, opacity: 0 },
    ]
  } else {
    const target = stage.getBoundingClientRect()
    const thumb = findThumbRect(displayPhoto.value?.id)
    if (thumb && target.width > 1) {
      const scale = thumb.width / target.width
      const dx = thumb.left + thumb.width / 2 - (target.left + target.width / 2)
      const dy = thumb.top + thumb.height / 2 - (target.top + target.height / 2)
      stageKeyframes = [
        { transform: from, opacity: 1 },
        { transform: `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`, opacity: 0.6 },
      ]
    } else {
      stageKeyframes = [
        { transform: from, opacity: 1 },
        { transform: 'scale(0.94)', opacity: 0 },
      ]
    }
  }

  exitAnimation = stage.animate(stageKeyframes, {
    duration: reduced ? 120 : EXIT_MS,
    easing: EASE_OUT,
    fill: 'forwards',
  })

  return exitAnimation.finished.catch(() => undefined).then(() => undefined)
}

// Neighbours at the preview rung, so a swipe lands on an image that is already
// decoded instead of on an empty frame. Small enough (640px) that prefetching
// two of them costs less than the photo already on screen.
const preloadNeighbours = () => {
  if (typeof Image === 'undefined') return
  const index = currentIndex.value
  ;[index - 1, index + 1].forEach((i) => {
    const photo = props.photos[i]
    if (!photo) return
    const img = new Image()
    img.decoding = 'async'
    img.src = getPhotoPreviewUrl(photo.image)
  })
}

const requestClose = () => {
  emit('close')
}

const goToPrevious = () => {
  if (canGoPrevious.value) emit('navigate', props.photos[currentIndex.value - 1])
}

const goToNext = () => {
  if (canGoNext.value) emit('navigate', props.photos[currentIndex.value + 1])
}

// Keyboard navigation with additional shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  if (!props.isOpen) return

  switch (event.key) {
    case 'Escape':
    case 'Backspace':
      requestClose()
      break
    case 'ArrowLeft':
    case 'KeyA':
      event.preventDefault()
      goToPrevious()
      break
    case 'ArrowRight':
    case 'KeyD':
      event.preventDefault()
      goToNext()
      break
    case 'Home':
      event.preventDefault()
      if (props.photos.length > 0) emit('navigate', props.photos[0])
      break
    case 'End':
      event.preventDefault()
      if (props.photos.length > 0) emit('navigate', props.photos[props.photos.length - 1])
      break
  }
}

/* ============================================================
   DRAG
   ============================================================ */

const AXIS_LOCK_PX = 8
const NAV_DISTANCE_PX = 60
const NAV_VELOCITY = 0.25 // px/ms
const DISMISS_DISTANCE_PX = 110
const DISMISS_VELOCITY = 0.5 // px/ms
const EDGE_FRICTION = 0.28

/**
 * Gesture state is plain `let`, not refs, and the transform is written straight
 * to the element. A reactive offset would re-render the component on every
 * pointermove - and because the value lived in the template's inline style, it
 * also invalidated both image elements each frame.
 */
let activePointer: number | null = null
let startX = 0
let startY = 0
let startTime = 0
let axis: 'none' | 'x' | 'y' = 'none'
let lastDx = 0
let lastDy = 0
let dismissedByDrag = false

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const onPointerDown = (event: PointerEvent) => {
  // Multi-touch protection: a second finger arriving mid-drag would otherwise
  // teleport the photo to wherever it landed.
  if (activePointer !== null) return
  if (event.pointerType === 'mouse' && event.button !== 0) return

  snapAnimation?.cancel()
  snapAnimation = null

  activePointer = event.pointerId
  startX = event.clientX
  startY = event.clientY
  startTime = performance.now()
  axis = 'none'
  lastDx = 0
  lastDy = 0

  stageRef.value?.setPointerCapture?.(event.pointerId)
  stageRef.value?.classList.add('is-dragging')
}

const onPointerMove = (event: PointerEvent) => {
  if (activePointer !== event.pointerId) return

  const stage = stageRef.value
  const backdrop = backdropRef.value
  if (!stage) return

  lastDx = event.clientX - startX
  lastDy = event.clientY - startY

  if (axis === 'none') {
    const travelled = Math.max(Math.abs(lastDx), Math.abs(lastDy))
    if (travelled < AXIS_LOCK_PX) return
    axis = Math.abs(lastDx) > Math.abs(lastDy) ? 'x' : 'y'
  }

  if (axis === 'x') {
    // Friction, not a wall: at the first or last photo the frame still gives a
    // little, which says "nothing that way" without feeling broken.
    const hasNeighbour = lastDx > 0 ? canGoPrevious.value : canGoNext.value
    const offset = hasNeighbour ? lastDx : lastDx * EDGE_FRICTION
    stage.style.transform = `translate3d(${offset}px, 0, 0)`
  } else {
    // Pull-to-dismiss. Upward is damped because there is nothing above.
    const offset = lastDy < 0 ? lastDy * 0.4 : lastDy
    const scale = clamp(1 - Math.abs(offset) / 1400, 0.86, 1)
    stage.style.transform = `translate3d(0, ${offset}px, 0) scale(${scale})`
    if (backdrop) backdrop.style.opacity = String(clamp(1 - Math.abs(offset) / 420, 0.25, 1))
  }
}

const snapBack = () => {
  const stage = stageRef.value
  const backdrop = backdropRef.value
  if (!stage) return

  const from = getComputedStyle(stage).transform
  stage.style.transform = ''
  if (from !== 'none') {
    snapAnimation = stage.animate([{ transform: from }, { transform: 'none' }], {
      duration: 260,
      easing: EASE_OUT,
    })
  }

  if (backdrop && backdrop.style.opacity) {
    const fromOpacity = backdrop.style.opacity
    backdrop.style.opacity = ''
    backdrop.animate([{ opacity: fromOpacity }, { opacity: 1 }], {
      duration: 220,
      easing: EASE_OUT,
    })
  }
}

const onPointerUp = (event: PointerEvent) => {
  if (activePointer !== event.pointerId) return

  const stage = stageRef.value
  stage?.releasePointerCapture?.(event.pointerId)
  stage?.classList.remove('is-dragging')
  activePointer = null

  const elapsed = Math.max(1, performance.now() - startTime)

  if (axis === 'y') {
    const velocity = lastDy / elapsed
    // A flick counts even when it is short: waiting for 110px of travel makes a
    // deliberate, quick gesture feel ignored.
    if (lastDy > DISMISS_DISTANCE_PX || (lastDy > 24 && velocity > DISMISS_VELOCITY)) {
      dismissedByDrag = true
      requestClose()
      axis = 'none'
      return
    }
  } else if (axis === 'x') {
    const velocity = Math.abs(lastDx) / elapsed
    const shouldNavigate = Math.abs(lastDx) > NAV_DISTANCE_PX || velocity > NAV_VELOCITY
    if (shouldNavigate) {
      if (lastDx > 0 && canGoPrevious.value) {
        snapBack()
        goToPrevious()
        axis = 'none'
        return
      }
      if (lastDx < 0 && canGoNext.value) {
        snapBack()
        goToNext()
        axis = 'none'
        return
      }
    }
  }

  snapBack()
  axis = 'none'
}

/* ============================================================
   OPEN / CLOSE
   ============================================================ */

watch(
  () => props.currentPhoto,
  (photo) => {
    // Ignore the parent clearing the photo on close - the exit animation still
    // needs something to render.
    if (!photo) return
    const changed = displayPhoto.value?.id !== photo.id
    displayPhoto.value = photo
    if (changed) {
      fullImageLoaded.value = false
      const thumb = findThumbRect(photo.id)
      if (thumb) stageAspect.value = thumb.width / thumb.height
      preloadNeighbours()
    }
  },
  { immediate: true },
)

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen) {
      cancelAnimations()
      dismissedByDrag = false
      document.addEventListener('keydown', handleKeydown)
      document.body.style.overflow = 'hidden'
      isMounted.value = true
      // Two frames: one for Vue to create the element, one for the browser to
      // lay it out at its aspect ratio so the measured target rect is real.
      await nextTick()
      requestAnimationFrame(() => runEnter())
      return
    }

    document.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
    if (!isMounted.value) return

    await runExit(dismissedByDrag)
    // Guard against a reopen that raced the exit.
    if (!props.isOpen) {
      isMounted.value = false
      displayPhoto.value = null
    }
    dismissedByDrag = false
  },
  { immediate: true },
)

onUnmounted(() => {
  cancelAnimations()
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.pm-root {
  position: fixed;
  inset: 0;
  /* Above the floating action menu (10003), which would otherwise sit on top of
     the photograph on mobile. */
  z-index: 10050;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.94);
  overscroll-behavior: contain;
  padding: max(0.75rem, env(safe-area-inset-top)) max(0.75rem, env(safe-area-inset-right))
    max(0.75rem, env(safe-area-inset-bottom)) max(0.75rem, env(safe-area-inset-left));
}

.pm-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 72rem;
}

/* ============================================================
   STAGE
   ============================================================ */

.pm-stage {
  --pm-max-h: 72vh;
  --pm-max-h: 72dvh;
  position: relative;
  width: 100%;
  aspect-ratio: var(--pm-aspect, 1.5);
  max-height: var(--pm-max-h);
  max-width: min(100%, calc(var(--pm-max-h) * var(--pm-aspect, 1.5)));
  overflow: hidden;
  /* Matches the grid thumbnail's radius, so the zoom does not have to animate a
     paint property to keep the two shapes reading as the same object. */
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.04);
  /* The drag is horizontal and vertical, so the browser must not claim either
     axis for scrolling. */
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* Promoted only for the duration of a drag. A permanent compositor layer for a
   full-screen photograph is expensive on the phones this matters most on. */
.pm-stage.is-dragging {
  will-change: transform;
}

.pm-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  pointer-events: none;
}

/*
 * The full-resolution layer sits exactly on top of the preview layer and fades
 * in once decoded. Both are laid out identically, so the swap is a pure
 * crossfade with no reflow.
 */
.pm-photo--full {
  opacity: 0;
  transition: opacity 0.25s ease-out;
}

.pm-photo--full.is-loaded {
  opacity: 1;
}

.pm-guard {
  position: absolute;
  inset: 0;
  z-index: 2;
}

/* ============================================================
   CAPTION + COUNTER
   ============================================================ */

.pm-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 3;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0));
  color: white;
  padding: 2rem 1rem 0.875rem;
  pointer-events: none;
}

.pm-counter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
}

.pm-count {
  padding: 0 0.5rem;
  pointer-events: none;
}

/* 44px of touch target around a glyph that is drawn much smaller - the hit area
   is what the thumb needs, the disc is what the eye wants. */
.pm-step {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  font-size: 1.5rem;
  line-height: 1;
  color: rgba(255, 255, 255, 0.85);
  background: none;
  border: 0;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 140ms cubic-bezier(0.23, 1, 0.32, 1),
    opacity 140ms ease;
}

.pm-step:active {
  transform: scale(0.9);
}

.pm-step.is-off {
  opacity: 0.22;
  pointer-events: none;
}

/* ============================================================
   CHROME
   ============================================================ */

.pm-chrome {
  position: absolute;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border-radius: 9999px;
  background-color: rgba(255, 255, 255, 0.12);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  /* Explicit properties rather than `all`: `all` also transitions the backdrop
     filter and the border, which is both wasteful and visibly laggy on a phone. */
  transition:
    transform 160ms cubic-bezier(0.23, 1, 0.32, 1),
    background-color 160ms ease;
}

.pm-chrome:active {
  transform: scale(0.94);
  background-color: rgba(255, 255, 255, 0.22);
}

.pm-close {
  top: max(0.75rem, env(safe-area-inset-top));
  right: max(0.75rem, env(safe-area-inset-right));
  /* Was 28-32px at 40-50% opacity: the one control that gets you out of a
     full-screen takeover was below the minimum touch target and almost
     invisible against a bright photograph. */
  width: 44px;
  height: 44px;
}

.pm-nav {
  top: 50%;
  width: 3rem;
  height: 3rem;
  margin-top: -1.5rem;
  opacity: 0.55;
  transition:
    opacity 200ms ease,
    transform 160ms cubic-bezier(0.23, 1, 0.32, 1),
    background-color 160ms ease;
}

.pm-nav--prev {
  left: 1rem;
}

.pm-nav--next {
  right: 1rem;
}

/* Touch devices navigate by swipe and by the chevrons beside the counter, both
   within thumb reach. Side buttons there would only cover the photograph. */
@media (hover: none), (max-width: 768px) {
  .pm-nav {
    display: none;
  }
}

@media (hover: hover) and (pointer: fine) {
  .pm-nav:hover,
  .pm-chrome:hover {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.24);
  }
}

/* ============================================================
   RESPONSIVE
   ============================================================ */

@media (max-width: 768px) {
  .pm-stage {
    --pm-max-h: 74vh;
    --pm-max-h: 74dvh;
  }

  .pm-caption {
    padding: 1.75rem 0.75rem 0.75rem;
    font-size: 0.875rem;
  }
}

/* Short phones in landscape: the photo has to give room back to the counter. */
@media (max-height: 480px) {
  .pm-stage {
    --pm-max-h: 62vh;
    --pm-max-h: 62dvh;
  }

  .pm-step {
    width: 40px;
    height: 40px;
  }
}

@media (min-width: 1025px) {
  .pm-stage {
    --pm-max-h: 82vh;
    --pm-max-h: 82dvh;
  }

  .pm-counter {
    margin-top: 0.75rem;
    font-size: 0.875rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pm-photo--full,
  .pm-chrome,
  .pm-nav,
  .pm-step {
    transition: none;
  }

  .pm-chrome:active,
  .pm-step:active {
    transform: none;
  }
}
</style>
