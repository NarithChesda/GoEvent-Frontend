<template>
  <div>
    <ul
      ref="gridEl"
      class="pag-grid"
      :aria-describedby="hintId"
      :aria-label="t('management.media.uploadModal.gallery.title')"
    >
      <li
        v-for="(photo, index) in items"
        :key="photo.id"
        :ref="(el) => setTileRef(photo.id, el)"
        class="pag-tile"
        :class="{
          'is-pressing': pressingId === photo.id,
          'is-lifted': liftedId === photo.id,
          'is-selected': selectedId === photo.id,
          'is-settling': settlingId === photo.id,
        }"
        tabindex="0"
        :aria-label="photoLabel(photo, index)"
        :aria-selected="selectedId === photo.id"
        @pointerdown="onPointerDown($event, photo)"
        @keydown="onKeydown($event, photo)"
        @contextmenu.prevent
      >
        <span class="pag-frame">
          <img
            :src="thumbnail(photo)"
            alt=""
            draggable="false"
            loading="lazy"
            decoding="async"
            class="pag-img"
          />
        </span>

        <!-- Which one the transition stage shows. Information only — choosing it
             is the featured-photo picker's job, not a second control here. -->
        <span
          v-if="photo.is_featured"
          class="pag-star"
          :title="t('management.media.uploadModal.gallery.featured')"
        >
          <Star class="w-3 h-3 fill-current" aria-hidden="true" />
        </span>

        <!-- A band: this photo appears in its own section of the invitation
             instead of the gallery. Information only, like the star; the
             selection bar's Band action is where it is set. -->
        <span
          v-if="isPhotoBand(photo)"
          class="pag-band"
          :title="t('management.media.uploadModal.gallery.band')"
        >
          <GalleryHorizontal class="w-3 h-3" aria-hidden="true" />
        </span>

        <!-- The cover's photo frame shows this one. Information only, like the
             star; the selection bar's Cover action is where it is set. -->
        <span
          v-if="photo.is_cover_photo === true"
          class="pag-cover"
          :title="t('management.media.uploadModal.gallery.coverPhoto')"
        >
          <Frame class="w-3 h-3" aria-hidden="true" />
        </span>

        <!-- The countdown's strips are cut from this one. Information only:
             it is chosen and framed on the strips themselves, in the Design
             Studio preview, where the cuts can be seen. Beside the cover's
             badge when a photo is both, since every corner is taken. -->
        <span
          v-if="photo.is_countdown_photo === true"
          class="pag-countdown"
          :class="{ 'is-beside-cover': photo.is_cover_photo === true }"
          :title="t('management.media.uploadModal.gallery.countdownPhoto')"
        >
          <Timer class="w-3 h-3" aria-hidden="true" />
        </span>

        <!-- Selected: a check where the remove button sits, which the bar
             below takes over while this photo is selected. -->
        <span v-if="selectedId === photo.id" class="pag-check" aria-hidden="true">
          <Check class="w-3.5 h-3.5" stroke-width="3" />
        </span>

        <!-- pointerdown stopped so pressing it never starts a lift. -->
        <button
          type="button"
          class="pag-remove"
          :disabled="disabled"
          :aria-label="t('management.media.uploadModal.gallery.remove')"
          :title="t('management.media.uploadModal.gallery.remove')"
          @pointerdown.stop
          @click.stop="emit('remove', photo)"
        >
          <X class="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </li>
    </ul>

    <p :id="hintId" class="sr-only">{{ t('management.media.uploadModal.gallery.keyboardHint') }}</p>
    <p class="sr-only" aria-live="polite">{{ announcement }}</p>
  </div>
</template>

<script setup lang="ts">
/**
 * The event's photos, in the order guests see them, arranged by hand.
 *
 * Built for a finger first, because the place it is needed most is the studio's
 * phone preview, where the Showcase tab's grid is a whole page away. Two ways
 * in, because the fluid one is not the discoverable one:
 *
 * - **Tap to select.** The obvious first move on a photo, and what the parent
 *   answers with plain, labelled actions (feature, move earlier / later,
 *   remove) — so nothing depends on knowing a gesture exists. A selected photo
 *   is moved with `move()`, which the parent's buttons call.
 * - **Press and hold, then drag**, for moving far in one go. A short hold lifts
 *   the photo (it gives a little under the finger while the hold runs, so the
 *   gesture says what it is about to do), and from then on it is glued to the
 *   finger at the point it was grabbed. Moving before the hold completes is a
 *   scroll, and is left to be one. A mouse needs no hold — dragging is
 *   unambiguous with a pointer. The others make way as it goes, each sliding
 *   from wherever it is on screen at that instant (FLIP), so a change of mind
 *   mid-drag reverses smoothly; letting go settles it into its slot.
 * - **Keyboard**: Space or Enter selects, the arrow keys then move the
 *   selected photo, Escape clears the selection. Delete removes.
 *
 * It owns no data. The parent hands it the photos and the selection, and hears
 * `reorder` (the new order — once per drop, once per `move`), `remove` and
 * `update:selectedId` — saving, undo and failure are the parent's.
 */
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Check, Frame, GalleryHorizontal, Star, Timer, X } from 'lucide-vue-next'
import type { EventPhoto } from '@/services/api'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { imagekitUrl, resolveMediaUrl } from '@/utils/mediaUrl'
import { isPhotoBand } from '@/components/showcase/photo-band/photoBand'

interface Props {
  photos: EventPhoto[]
  /** Freeze arranging and removing (e.g. while an upload is in flight). */
  disabled?: boolean
  /** The element that scrolls around the grid, so a drag held near its top or
   *  bottom edge can scroll it. */
  scroller?: HTMLElement | null
  /** The selected photo (`v-model:selectedId`). */
  selectedId?: number | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** The photos in their new order — once per drop or `move`, only when it
   *  changed. */
  reorder: [photos: EventPhoto[]]
  remove: [photo: EventPhoto]
  'update:selectedId': [id: number | null]
}>()

const { t } = useAppLanguage()

const hintId = `pag-hint-${Math.random().toString(36).slice(2, 9)}`

/** The order on screen. Follows `photos` except while a photo is in the hand,
 *  when it is the grid's own working copy. (Not while one is merely selected:
 *  the parent's answers — a featured star, a reverted save — have to show.) */
const items = ref<EventPhoto[]>([...props.photos])

watch(
  () => props.photos,
  (photos) => {
    if (liftedId.value === null) items.value = [...photos]
  },
)

const thumbnail = (photo: EventPhoto) => {
  const url = resolveMediaUrl(photo.image)
  return imagekitUrl(url, 'w-240,h-240,fo-auto') ?? url
}

const photoLabel = (photo: EventPhoto, index: number) => {
  const position = t('management.media.uploadModal.gallery.photoLabel', {
    n: index + 1,
    total: items.value.length,
  })
  return [
    position,
    photo.is_featured ? t('management.media.uploadModal.gallery.featured') : null,
    isPhotoBand(photo) ? t('management.media.uploadModal.gallery.band') : null,
    photo.is_cover_photo === true ? t('management.media.uploadModal.gallery.coverPhoto') : null,
    photo.is_countdown_photo === true
      ? t('management.media.uploadModal.gallery.countdownPhoto')
      : null,
  ]
    .filter(Boolean)
    .join(', ')
}

// ---------------------------------------------------------------------------
// Tiles and motion
// ---------------------------------------------------------------------------

const gridEl = ref<HTMLElement | null>(null)
const tileEls = new Map<number, HTMLElement>()

const setTileRef = (id: number, el: unknown) => {
  if (el instanceof HTMLElement) tileEls.set(id, el)
  else tileEls.delete(id)
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Critically damped in feel: fast off the mark, no overshoot. */
const EASE_SETTLE = 'cubic-bezier(0.2, 0.8, 0.2, 1)'
const MAKE_WAY_MS = 220
const SETTLE_MS = 260

/**
 * Move one photo to a new index, and slide every other tile from where it is on
 * screen right now to its new slot. Reading the *current* rect — mid-animation
 * included — is what lets a reversed drag glide back instead of snapping.
 */
const moveTo = async (id: number, target: number) => {
  const from = items.value.findIndex((photo) => photo.id === id)
  if (from === -1 || target === from) return

  const firstRects = new Map<number, DOMRect>()
  for (const [tileId, el] of tileEls) {
    if (tileId !== id) firstRects.set(tileId, el.getBoundingClientRect())
  }

  const next = [...items.value]
  const [moved] = next.splice(from, 1)
  next.splice(target, 0, moved)
  items.value = next
  await nextTick()

  if (!prefersReducedMotion()) {
    for (const [tileId, first] of firstRects) {
      const el = tileEls.get(tileId)
      if (!el) continue
      el.style.transition = 'none'
      el.style.transform = ''
      const last = el.getBoundingClientRect()
      const dx = first.left - last.left
      const dy = first.top - last.top
      if (!dx && !dy) continue
      el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`
      void el.offsetWidth
      el.style.transition = `transform ${MAKE_WAY_MS}ms ${EASE_SETTLE}`
      el.style.transform = ''
    }
  }

  // The lifted tile's slot just changed under it; keep it under the finger.
  if (drag) followPointer()
}

/** Where a tile sits in the layout, ignoring any transform on it. */
const slotRect = (el: HTMLElement) => {
  const grid = gridEl.value!.getBoundingClientRect()
  return {
    left: grid.left + el.offsetLeft,
    top: grid.top + el.offsetTop,
    width: el.offsetWidth,
    height: el.offsetHeight,
  }
}

/** The slot whose centre is nearest the point — so a finger in a gap, or past
 *  the last row, still means somewhere. */
const indexAt = (x: number, y: number): number => {
  let best = -1
  let bestDistance = Infinity
  items.value.forEach((photo, index) => {
    const el = tileEls.get(photo.id)
    if (!el) return
    const slot = slotRect(el)
    const distance = Math.hypot(x - (slot.left + slot.width / 2), y - (slot.top + slot.height / 2))
    if (distance < bestDistance) {
      bestDistance = distance
      best = index
    }
  })
  return best
}

// ---------------------------------------------------------------------------
// Pointer: press, lift, drag, drop
// ---------------------------------------------------------------------------

/** How long a finger has to rest before the photo lifts. */
const LONG_PRESS_MS = 320
/** Movement that turns a press into a scroll (touch) or a drag (mouse). */
const SLOP_PX = 8

interface Press {
  id: number
  pointerId: number
  pointerType: string
  startX: number
  startY: number
  x: number
  y: number
  timer: ReturnType<typeof setTimeout> | null
}

interface Drag {
  id: number
  pointerId: number
  /** Where in the tile it was grabbed, so it never jumps to centre itself. */
  grabX: number
  grabY: number
  x: number
  y: number
  /** The order before the lift, for a cancel. */
  snapshot: EventPhoto[]
}

let press: Press | null = null
let drag: Drag | null = null

const pressingId = ref<number | null>(null)
const liftedId = ref<number | null>(null)
const settlingId = ref<number | null>(null)

/**
 * Put the lifted tile exactly under the finger, at the point it was grabbed.
 * Translate only, and never transitioned — anything eased here trails the
 * finger. The lift's scale lives on the frame inside it (CSS), where it can
 * animate without dragging the position along with it.
 */
const followPointer = () => {
  if (!drag) return
  const el = tileEls.get(drag.id)
  if (!el) return
  const slot = slotRect(el)
  const tx = drag.x - drag.grabX - slot.left
  const ty = drag.y - drag.grabY - slot.top
  el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`
}

const clearPress = () => {
  if (press?.timer) clearTimeout(press.timer)
  press = null
  pressingId.value = null
}

const lift = () => {
  if (!press) return
  const el = tileEls.get(press.id)
  if (!el) return clearPress()

  const rect = el.getBoundingClientRect()
  drag = {
    id: press.id,
    pointerId: press.pointerId,
    grabX: press.x - rect.left,
    grabY: press.y - rect.top,
    x: press.x,
    y: press.y,
    snapshot: [...items.value],
  }
  clearPress()

  liftedId.value = drag.id
  el.style.transition = 'none'
  followPointer()
  // The lift is the one moment a hand wants confirming: the hold worked.
  navigator.vibrate?.(8)
  startAutoScroll()
}

const onPointerDown = (event: PointerEvent, photo: EventPhoto) => {
  if (props.disabled || drag) return
  if (event.pointerType === 'mouse' && event.button !== 0) return

  press = {
    id: photo.id,
    pointerId: event.pointerId,
    pointerType: event.pointerType,
    startX: event.clientX,
    startY: event.clientY,
    x: event.clientX,
    y: event.clientY,
    timer: null,
  }

  if (event.pointerType !== 'mouse') {
    pressingId.value = photo.id
    press.timer = setTimeout(lift, LONG_PRESS_MS)
  }

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerCancel)
}

const onPointerMove = (event: PointerEvent) => {
  if (press && event.pointerId === press.pointerId) {
    press.x = event.clientX
    press.y = event.clientY
    const moved = Math.hypot(event.clientX - press.startX, event.clientY - press.startY)
    if (moved > SLOP_PX) {
      if (press.pointerType === 'mouse') lift()
      else {
        // A finger that moves before the hold is up is scrolling.
        clearPress()
        detachWindowListeners()
      }
    }
    return
  }

  if (!drag || event.pointerId !== drag.pointerId) return
  drag.x = event.clientX
  drag.y = event.clientY
  followPointer()
  const target = indexAt(drag.x, drag.y)
  const current = items.value.findIndex((photo) => photo.id === drag!.id)
  if (target !== -1 && target !== current) void moveTo(drag.id, target)
}

const detachWindowListeners = () => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerCancel)
}

/** Glide the lifted tile from wherever it is into its slot. */
const settle = (id: number) => {
  const el = tileEls.get(id)
  liftedId.value = null
  if (!el) return
  settlingId.value = id
  el.style.transition = prefersReducedMotion() ? 'none' : `transform ${SETTLE_MS}ms ${EASE_SETTLE}`
  el.style.transform = ''
  window.setTimeout(() => {
    if (settlingId.value === id) settlingId.value = null
  }, SETTLE_MS)
}

const sameOrder = (a: EventPhoto[], b: EventPhoto[]) =>
  a.length === b.length && a.every((photo, index) => photo.id === b[index].id)

const onPointerUp = (event: PointerEvent) => {
  // Let go before the hold lifted it, without having moved: a tap.
  if (press && event.pointerId === press.pointerId) {
    const tapped = press.id
    clearPress()
    detachWindowListeners()
    toggleSelection(tapped)
    return
  }
  if (!drag || event.pointerId !== drag.pointerId) return

  const { id, snapshot } = drag
  endDrag()
  settle(id)
  if (!sameOrder(items.value, snapshot)) {
    const index = items.value.findIndex((photo) => photo.id === id)
    announce('dropped', index)
    emit('reorder', [...items.value])
  }
}

/** The browser took the gesture back (a system gesture, the tab hidden…). The
 *  move never finished, so neither does the reorder. */
const onPointerCancel = (event: PointerEvent) => {
  if (press && event.pointerId === press.pointerId) {
    clearPress()
    detachWindowListeners()
    return
  }
  if (!drag || event.pointerId !== drag.pointerId) return
  const { id, snapshot } = drag
  endDrag()
  items.value = snapshot
  settle(id)
}

const endDrag = () => {
  drag = null
  stopAutoScroll()
  detachWindowListeners()
}

// Once a photo is lifted, a moving finger is dragging it, not the page. Touch
// scrolling can only be refused from a non-passive touchmove, and only for as
// long as the lift lasts — before it, the same finger is free to scroll.
const onTouchMove = (event: TouchEvent) => {
  if (drag && event.cancelable) event.preventDefault()
}

onMounted(() => gridEl.value?.addEventListener('touchmove', onTouchMove, { passive: false }))

onBeforeUnmount(() => {
  gridEl.value?.removeEventListener('touchmove', onTouchMove)
  clearPress()
  endDrag()
})

// ---------------------------------------------------------------------------
// Auto-scroll: a drag held near the scroller's top or bottom edge carries on
// into what is out of view, faster the deeper into the edge it is held.
// ---------------------------------------------------------------------------

const EDGE_PX = 56
const MAX_SCROLL_STEP = 14

let scrollFrame = 0

const autoScrollTick = () => {
  scrollFrame = 0
  const scroller = props.scroller
  if (!drag || !scroller) return
  const bounds = scroller.getBoundingClientRect()
  let step = 0
  if (drag.y < bounds.top + EDGE_PX) {
    step = -MAX_SCROLL_STEP * Math.min(1, (bounds.top + EDGE_PX - drag.y) / EDGE_PX)
  } else if (drag.y > bounds.bottom - EDGE_PX) {
    step = MAX_SCROLL_STEP * Math.min(1, (drag.y - (bounds.bottom - EDGE_PX)) / EDGE_PX)
  }
  if (step) {
    const before = scroller.scrollTop
    scroller.scrollTop += step
    if (scroller.scrollTop !== before) {
      // The grid moved under a still finger: re-place the tile and re-read
      // which slot it is over.
      followPointer()
      const target = indexAt(drag.x, drag.y)
      const current = items.value.findIndex((photo) => photo.id === drag!.id)
      if (target !== -1 && target !== current) void moveTo(drag.id, target)
    }
  }
  scrollFrame = requestAnimationFrame(autoScrollTick)
}

const startAutoScroll = () => {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(autoScrollTick)
}

const stopAutoScroll = () => {
  if (scrollFrame) cancelAnimationFrame(scrollFrame)
  scrollFrame = 0
}

// ---------------------------------------------------------------------------
// Selection, and moving the selected photo a step at a time
// ---------------------------------------------------------------------------

const announcement = ref('')

const announce = (key: 'selected' | 'movedTo' | 'dropped' | 'deselected', index = 0) => {
  announcement.value = t(`management.media.uploadModal.gallery.${key}`, {
    n: index + 1,
    total: items.value.length,
  })
}

const toggleSelection = (id: number) => {
  if (props.selectedId === id) {
    emit('update:selectedId', null)
    announce('deselected')
    return
  }
  emit('update:selectedId', id)
  announce('selected', items.value.findIndex((photo) => photo.id === id))
}

/**
 * Move a photo one or more places, animated like a drag, and report the new
 * order. The parent's "earlier / later" buttons call this; so do the arrows.
 * The moved photo is kept in view — a step can carry it onto a row that has
 * scrolled away.
 */
const move = async (id: number, delta: number) => {
  if (props.disabled || drag) return
  const index = items.value.findIndex((photo) => photo.id === id)
  if (index === -1) return
  const target = Math.min(Math.max(index + delta, 0), items.value.length - 1)
  if (target === index) return
  await moveTo(id, target)
  tileEls.get(id)?.scrollIntoView?.({
    block: 'nearest',
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  })
  announce('movedTo', target)
  emit('reorder', [...items.value])
}

defineExpose({ move })

const onKeydown = (event: KeyboardEvent, photo: EventPhoto) => {
  if (props.disabled || drag) return
  // Only the tile's own keys — not ones bubbling up from its remove button.
  if (event.target !== event.currentTarget) return

  const selected = props.selectedId === photo.id

  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    toggleSelection(photo.id)
    return
  }

  if (selected && ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(event.key)) {
    event.preventDefault()
    const step = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1
    void move(photo.id, step).then(() => tileEls.get(photo.id)?.focus())
    return
  }

  if (selected && event.key === 'Escape') {
    // Clear the selection — and don't let the drawer read this Escape as
    // "close".
    event.preventDefault()
    event.stopPropagation()
    toggleSelection(photo.id)
    return
  }

  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    emit('remove', photo)
  }
}
</script>

<style scoped>
.pag-grid {
  /* Tiles are placed from their offsets against this box (see slotRect). */
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}

@media (min-width: 640px) {
  .pag-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.pag-tile {
  position: relative;
  aspect-ratio: 1;
  border-radius: 0.75rem;
  cursor: grab;
  /* Vertical pans stay the page's until a photo lifts; see onTouchMove. */
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  /* A held image would otherwise open iOS's save/share callout, or start a
     system drag of the picture itself. */
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  outline: none;
}

.pag-tile:focus-visible .pag-frame {
  box-shadow: 0 0 0 2px #fff, 0 0 0 4px rgb(56 189 248);
}

/* The frame carries the clipping and the rounding, so the tile itself can let
   the remove button's hit area reach past its corner. */
.pag-frame {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  background: rgb(241 245 249);
  transition:
    transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 200ms ease;
}

.pag-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  -webkit-user-drag: none;
  pointer-events: none;
}

/* The hold, telegraphed: the photo gives a little under the finger for as long
   as the press lasts, then lifts out of it. Same duration as the hold, so it
   bottoms out exactly as the lift begins. */
.pag-tile.is-pressing .pag-frame {
  transform: scale(0.96);
}

.pag-tile.is-lifted,
.pag-tile.is-settling {
  z-index: 10;
}

.pag-tile.is-lifted {
  cursor: grabbing;
}

/* Lifted out of the grid: a touch larger, casting a shadow, and quicker to
   arrive than the hold was to press — the hold is waiting, the lift is an
   answer. */
.pag-tile.is-lifted .pag-frame {
  transform: scale(1.06);
  box-shadow: 0 14px 30px -8px rgba(15, 23, 42, 0.45);
  transition-duration: 180ms;
}

/* Selected: ringed and lightly tinted in place, with a check in the corner so
   it does not rest on colour alone. It stays in the grid — it is being acted
   on from the bar below, not carried — so it does not grow into its
   neighbours. */
.pag-tile.is-selected .pag-frame {
  box-shadow:
    0 0 0 2px #fff,
    0 0 0 4px rgb(56 189 248);
}

/* On the photo, under the star and the check — not over the whole tile, where
   it would wash them out too. */
.pag-tile.is-selected .pag-frame::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(14, 165, 233, 0.14);
  pointer-events: none;
}

.pag-star {
  position: absolute;
  top: 0.375rem;
  left: 0.375rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 9999px;
  color: #fff;
  background: linear-gradient(to bottom right, #facc15, #f97316);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.3);
  pointer-events: none;
}

/* Bottom-left, clear of the star above it and the remove button on the right. */
.pag-band {
  position: absolute;
  bottom: 0.375rem;
  left: 0.375rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 9999px;
  color: #fff;
  background: #1e90ff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.3);
  pointer-events: none;
}

/* Bottom-right: the one corner the star, the band and the remove button leave. */
.pag-cover {
  position: absolute;
  bottom: 0.375rem;
  right: 0.375rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 9999px;
  color: #fff;
  background: rgb(16 185 129);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.3);
  pointer-events: none;
}

/* The countdown's photo: the same chip in indigo, stepping left of the cover's
   when one photo is both. */
.pag-countdown {
  position: absolute;
  bottom: 0.375rem;
  right: 0.375rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 9999px;
  color: #fff;
  background: rgb(99 102 241);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.3);
  pointer-events: none;
}

.pag-countdown.is-beside-cover {
  right: 1.875rem;
}

.pag-check {
  position: absolute;
  top: 0.3125rem;
  right: 0.3125rem;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 9999px;
  color: #fff;
  background: rgb(14 165 233);
  box-shadow:
    0 0 0 2px #fff,
    0 1px 3px rgba(15, 23, 42, 0.3);
  pointer-events: none;
}

.pag-remove {
  position: absolute;
  top: 0.3125rem;
  right: 0.3125rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 9999px;
  color: #fff;
  background: rgba(15, 23, 42, 0.62);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  touch-action: manipulation;
  transition:
    opacity 150ms ease,
    background-color 150ms ease,
    transform 150ms ease;
}

/* A 24px disc is what fits on a ~110px photo without covering it; the target
   around it is the 40px a thumb needs. */
.pag-remove::before {
  content: '';
  position: absolute;
  inset: -0.5rem;
}

.pag-remove:active {
  background: rgba(220, 38, 38, 0.85);
  transform: scale(0.92);
}

.pag-remove:focus-visible {
  outline: 2px solid rgb(56 189 248);
  outline-offset: 1px;
}

.pag-remove:disabled {
  opacity: 0.4;
}

@media (hover: hover) and (pointer: fine) {
  .pag-remove:hover {
    background: rgba(220, 38, 38, 0.85);
  }
}

/* Nothing to remove while a photo is in the hand — and on the selected one, the
   bar below already says Remove in words. */
.pag-tile.is-lifted .pag-remove,
.pag-tile.is-selected .pag-remove,
.pag-tile.is-settling .pag-remove {
  opacity: 0;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .pag-frame {
    transition: box-shadow 200ms ease;
  }

  .pag-tile.is-pressing .pag-frame,
  .pag-tile.is-lifted .pag-frame {
    transform: none;
  }
}
</style>
