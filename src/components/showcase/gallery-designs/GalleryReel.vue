<template>
  <!-- The strip. Bled to the card's edges (bleedClass) so the photographs run
       off both sides, which is what says "there are more" before anything
       moves. Vertical gestures still belong to the invitation (touch-action:
       pan-y); horizontal ones move the reel. -->
  <div
    ref="rootRef"
    class="rl"
    :class="[bleedClass, { 'is-dragging': dragging, 'is-static': !loops }]"
    :style="reelStyle"
    role="group"
    aria-roledescription="carousel"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
    @click.capture="onClickCapture"
    @click="onClick"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
    @keydown="onKeydown"
  >
    <!-- The camera. Perspective lives on the one element all cards share, so
         the reel has one vanishing point; a per-card perspective() would give
         each card its own and the bow would stop reading as one surface. -->
    <div class="rl-scene">
      <div v-for="card in cards" :key="card.key" :ref="cardRef(card.slot)" class="rl-card">
        <button
          type="button"
          class="rl-photo"
          :data-slot="card.slot"
          :tabindex="card.copy === 0 ? 0 : -1"
          :aria-hidden="card.copy === 0 ? undefined : 'true'"
          :aria-label="card.photo.caption || alt"
          @click="emit('openPhoto', card.photo)"
        >
          <GalleryFrame
            :photo="card.photo"
            :alt="card.photo.caption || alt"
            :load="loadable.has(card.slot)"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref, shallowReactive, watch } from 'vue'
import { EditIntentKey } from '@/components/showcase-preview/edit/editContext'
import { showcaseRevealObserverInit } from '@/composables/showcase/useScrollProgress'
import GalleryFrame from './GalleryFrame.vue'
import {
  reelCopies,
  reelMetrics,
  reelPose,
  wrapCentred,
  type ReelMetrics,
} from './galleryLayout'
import { prefersReducedMotion } from './useGalleryReveal'
import type { GalleryDesignEmits, GalleryDesignProps } from './types'

/**
 * `reel` — the one horizontal gallery. A strip of framed photographs laid on a
 * very wide concave bow, dealt in from the right one after another as it
 * scrolls into view, then drifting on its own. It takes a swipe and a throw,
 * and a thrown reel settles back into its drift.
 *
 * The motion is the landing page's mobile ring, carried over deliberately:
 * one position, one velocity, one requestAnimationFrame — a drift that a
 * finger can catch, push, and fling, with the throw decaying back into the
 * drift. What changed is everything that made the ring wrong for photographs:
 * the ring is the OUTSIDE of a drum, so its tiles turn away and vanish; this
 * is the inside of one, so a photograph turns toward the guest as it passes.
 * The ring's square bezelled tiles are artwork; these are portrait prints at
 * a size a face can be recognised at, cut to each photo's own framing.
 *
 * The entrance runs in the same loop rather than as a CSS animation, because a
 * card sliding in has to travel ALONG the bow — turning as it comes — and a
 * keyframe on an inner element would slide it flat across a card already
 * turned to its final angle.
 */
const props = defineProps<GalleryDesignProps>()
const emit = defineEmits<GalleryDesignEmits>()

const editIntentCtx = inject(EditIntentKey, undefined)
const reducedMotion = prefersReducedMotion()

/** Pixels per second the reel moves on its own. Positive: photographs travel
 *  left, the way the entrance brought them in. Slow enough that a card takes
 *  ten seconds to cross the screen — it is a room turning, not a ticker. */
const DRIFT_PX_S = 17
/** Seconds for a thrown reel to settle back into its drift (exponential). */
const SETTLE_S = 0.9
/** Ceiling on a throw, so a hard flick spins fast without smearing. */
const MAX_PX_S = 2600
/** A frame longer than this is a stall (a backgrounded tab); don't integrate it. */
const MAX_FRAME_S = 0.05
/** Movement before a press becomes a drag. Below it, a tap stays a tap. */
const DRAG_SLOP_PX = 7
/** A release this long after the last move is a finger that stopped, not a throw. */
const STALE_THROW_MS = 70
/** Seconds for keyboard focus to bring a card to the middle. */
const GLIDE_S = 0.14

/** The entrance: each visible card travels in from past the right edge. */
const ENTER_MS = 1250
const ENTER_STAGGER_MS = 170

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

const rootRef = ref<HTMLElement | null>(null)
/** Measured; the guess only has to last until the first ResizeObserver tick. */
const reelWidth = ref(360)
const metrics = computed<ReelMetrics>(() => reelMetrics(reelWidth.value))

/** A single photograph stands still in the middle; two or more make a loop. */
const loops = computed(() => props.photos.length > 1)

const copies = computed(() =>
  loops.value ? reelCopies(props.photos.length, metrics.value.pitch, reelWidth.value) : 1,
)

interface ReelCard {
  key: string
  photo: GalleryDesignProps['photos'][number]
  /** Which lap of the loop this card belongs to. Only lap 0 is focusable. */
  copy: number
  /** Position along the loop, 0-based, across every lap. */
  slot: number
}

const cards = computed<ReelCard[]>(() => {
  const out: ReelCard[] = []
  for (let copy = 0; copy < copies.value; copy++) {
    props.photos.forEach((photo, index) => {
      out.push({ key: `${copy}-${photo.id}`, photo, copy, slot: copy * props.photos.length + index })
    })
  }
  return out
})

const lap = computed(() => cards.value.length * metrics.value.pitch)

const reelStyle = computed(() => ({
  '--rl-w': `${reelWidth.value}px`,
  '--rl-card-w': `${metrics.value.cardWidth}px`,
  '--rl-card-h': `${metrics.value.cardHeight}px`,
}))

// ---------------------------------------------------------------------------
// Motion state — plain variables, not refs: the loop writes them every frame
// and nothing in the template reads them.
// ---------------------------------------------------------------------------

/** How far the reel has travelled, px. A card's place is its slot × pitch − pos. */
let pos = 0
let velocity = 0
let frame: number | undefined
let prevTs = 0

let hovered = false
let keyboardFocus = false
/** Keyboard focus asks for a card in the middle; the loop glides there. */
let glideTarget: number | null = null

const cardEls: (HTMLElement | null)[] = []
const cardRef = (slot: number) => (el: unknown) => {
  cardEls[slot] = el instanceof HTMLElement ? el : null
}

/** Cards whose photograph may be fetched. Grows, never shrinks. */
const loadable = shallowReactive(new Set<number>())
let near = false

const revealed = ref(false)
/** Per slot: when its entrance starts (ms, rAF clock) and how far it travels. */
const entrances = new Map<number, { start: number; travel: number }>()

/**
 * The reel starts with the first photograph at the left, its successor beside
 * it and the third peeking in — so it reads left to right in the organizer's
 * order, and the drift carries on in the direction the entrance came from.
 */
const restingStart = (m: ReelMetrics) => reelWidth.value / 2 - m.cardWidth / 2 - m.gap * 1.5

/** Distance along the bow from the reel's centre to this slot's card, px. */
const arcOf = (slot: number): number => {
  if (!loops.value) return 0
  return wrapCentred(slot * metrics.value.pitch - pos, lap.value)
}

const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5)

// ---------------------------------------------------------------------------
// Painting
// ---------------------------------------------------------------------------

const paint = (now: number) => {
  const m = metrics.value
  const width = reelWidth.value
  const loadHorizon = width * 1.5

  for (const card of cards.value) {
    const el = cardEls[card.slot]
    if (!el) continue

    let arc = arcOf(card.slot)
    let opacity = revealed.value ? 1 : 0

    const entrance = entrances.get(card.slot)
    if (entrance) {
      const progress = Math.min(1, Math.max(0, (now - entrance.start) / ENTER_MS))
      arc += (1 - easeOutQuint(progress)) * entrance.travel
      // Solid within the first fifth of its trip: it is a card sliding in,
      // not a ghost fading up in place.
      opacity = Math.min(1, progress / 0.2)
      if (progress >= 1) entrances.delete(card.slot)
    }

    if (near && !loadable.has(card.slot) && Math.abs(arc) < loadHorizon) loadable.add(card.slot)

    const pose = reelPose(arc, m, width)
    if (!pose.visible) {
      if (el.style.visibility !== 'hidden') el.style.visibility = 'hidden'
      continue
    }
    if (el.style.visibility) el.style.visibility = ''
    el.style.transform = `translate3d(${pose.x.toFixed(2)}px, 0, ${pose.z.toFixed(2)}px) rotateY(${pose.rotateY.toFixed(3)}deg)`
    // Always written: the stylesheet holds every card at 0 until it arrives.
    el.style.opacity = opacity === 1 ? '1' : opacity.toFixed(3)
  }
}

/** Nothing left to animate: no drift wanted, nothing moving, nothing arriving. */
const isIdle = (): boolean =>
  targetDrift() === 0 &&
  Math.abs(velocity) < 0.5 &&
  glideTarget === null &&
  entrances.size === 0 &&
  pointerId === null

const targetDrift = (): number => {
  if (!loops.value || reducedMotion || !revealed.value) return 0
  // Held still under a mouse, so a photograph can be clicked where it is, and
  // under keyboard focus, so the card that was brought to the middle stays.
  if (hovered || keyboardFocus) return 0
  return DRIFT_PX_S
}

const step = (ts: number) => {
  frame = undefined
  const dt = prevTs ? Math.min((ts - prevTs) / 1000, MAX_FRAME_S) : 0
  prevTs = ts

  // While a finger is down the move handler owns the position.
  if (pointerId === null && dt > 0) {
    if (glideTarget !== null) {
      const gap = glideTarget - pos
      pos += gap * (1 - Math.exp(-dt / GLIDE_S))
      velocity = 0
      if (Math.abs(gap) < 0.5) {
        pos = glideTarget
        glideTarget = null
      }
    } else {
      velocity += (targetDrift() - velocity) * (1 - Math.exp(-dt / SETTLE_S))
      pos += velocity * dt
    }
  }

  paint(ts)

  if (visible && !isIdle()) frame = requestAnimationFrame(step)
  else prevTs = 0
}

/** (Re)start the loop. Safe to call any time; it runs at most once. */
const wake = () => {
  if (frame !== undefined || !visible) return
  prevTs = 0
  frame = requestAnimationFrame(step)
}

// ---------------------------------------------------------------------------
// Arrival
// ---------------------------------------------------------------------------

/**
 * Deal in whatever is on screen, left to right, each from just past the right
 * edge. Planned and painted in the same turn, before the class flips, so no
 * card is ever seen at its resting place before it has arrived there.
 */
const reveal = () => {
  if (revealed.value) return
  const m = metrics.value
  const edge = reelWidth.value / 2 + m.cardWidth * 0.75 + m.gap
  const now = performance.now()

  const onScreen = cards.value
    .map((card) => ({ slot: card.slot, arc: arcOf(card.slot) }))
    .filter(({ arc }) => Math.abs(arc) < reelWidth.value / 2 + m.cardWidth / 2)
    .sort((a, b) => a.arc - b.arc)

  onScreen.forEach(({ slot, arc }, order) => {
    entrances.set(slot, {
      start: now + order * (reducedMotion ? 60 : ENTER_STAGGER_MS),
      // Reduced motion: the same one-by-one arrival, faded in where it lies.
      travel: reducedMotion ? 0 : Math.max(0, edge - arc),
    })
  })

  revealed.value = true
  // The first card starts moving at once, not after the decay has ramped up:
  // the reel is still when it arrives and begins turning as the cards land.
  velocity = 0
  paint(now)
  wake()
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

let pointerId: number | null = null
let startX = 0
let startY = 0
let lastX = 0
let lastMoveTs = 0
const dragging = ref(false)
/** Set when a press became a drag, so the click that ends it opens nothing. */
let swallowClick = false

const onPointerDown = (event: PointerEvent) => {
  if (!loops.value || !event.isPrimary) return
  if (event.pointerType === 'mouse' && event.button !== 0) return
  pointerId = event.pointerId
  startX = lastX = event.clientX
  startY = event.clientY
  lastMoveTs = event.timeStamp
  swallowClick = false
  glideTarget = null
  // Caught: a finger on a moving reel stops it at once, before anyone knows
  // whether this is a tap, a drag or a scroll.
  velocity = 0
}

const onPointerMove = (event: PointerEvent) => {
  if (event.pointerId !== pointerId) return

  if (!dragging.value) {
    const dx = event.clientX - startX
    const dy = event.clientY - startY
    if (Math.hypot(dx, dy) < DRAG_SLOP_PX) return
    // A vertical gesture is the invitation scrolling; the browser takes it
    // (touch-action: pan-y) and this press is no longer ours.
    if (Math.abs(dy) > Math.abs(dx)) {
      pointerId = null
      wake()
      return
    }
    dragging.value = true
    // Captured only now, never on press: a captured pointer's click lands on
    // the reel rather than on the photograph, and a tap has to open it.
    rootRef.value?.setPointerCapture(event.pointerId)
    pos -= dx
    lastX = event.clientX
    lastMoveTs = event.timeStamp
    paint(performance.now())
    return
  }

  const moved = event.clientX - lastX
  // Floored: two moves can share a timestamp, and dividing by zero here would
  // hand the release an infinite throw.
  const dt = Math.max((event.timeStamp - lastMoveTs) / 1000, 1 / 240)
  lastX = event.clientX
  lastMoveTs = event.timeStamp
  pos -= moved
  velocity = Math.max(-MAX_PX_S, Math.min(MAX_PX_S, -moved / dt))
  paint(performance.now())
}

const onPointerUp = (event: PointerEvent) => {
  if (event.pointerId !== pointerId) return
  pointerId = null
  if (dragging.value) {
    dragging.value = false
    swallowClick = event.type === 'pointerup'
    if (event.timeStamp - lastMoveTs > STALE_THROW_MS) velocity = 0
  }
  // Whatever the last move measured is the throw; the loop decays it from here.
  wake()
}

const onPointerEnter = (event: PointerEvent) => {
  if (event.pointerType !== 'mouse') return
  hovered = true
}

const onPointerLeave = (event: PointerEvent) => {
  if (event.pointerType !== 'mouse') return
  hovered = false
  wake()
}

const onClickCapture = (event: MouseEvent) => {
  if (!swallowClick) return
  swallowClick = false
  event.stopPropagation()
  event.preventDefault()
}

/**
 * The reel owns its taps. Without this a tap on the space between two cards
 * would reach the stage and start the invitation's tap-to-play scroll, which
 * is the opposite of what someone looking at photographs wants. In the studio
 * the tap is left to bubble: the gallery's edit region hears it and opens the
 * photos drawer, which is what a tap on the gallery means there.
 */
const onClick = (event: MouseEvent) => {
  if (!editIntentCtx) event.stopPropagation()
}

/** The slot of the lap-0 card a button belongs to, or null. */
const slotOf = (target: EventTarget | null): number | null => {
  const button = target instanceof Element ? target.closest<HTMLElement>('.rl-photo') : null
  const slot = button?.dataset.slot
  return slot === undefined ? null : Number(slot)
}

const onFocusIn = (event: FocusEvent) => {
  const target = event.target as Element | null
  // Keyboard only. A tap focuses the button too in some browsers, and a reel
  // that stopped for good after every tap would stop drifting at all.
  if (!target?.matches?.(':focus-visible')) return
  const slot = slotOf(target)
  if (slot === null || !loops.value) return
  keyboardFocus = true
  glideTarget = pos + arcOf(slot)
  wake()
}

const onFocusOut = (event: FocusEvent) => {
  if (rootRef.value?.contains(event.relatedTarget as Node | null)) return
  keyboardFocus = false
  wake()
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
  const slot = slotOf(event.target)
  if (slot === null) return
  event.preventDefault()
  const count = props.photos.length
  const next = (slot % count) + (event.key === 'ArrowRight' ? 1 : -1)
  rootRef.value
    ?.querySelector<HTMLElement>(`.rl-photo[data-slot="${(next + count) % count}"]`)
    ?.focus()
}

/** A trackpad's sideways swipe moves the reel; a vertical one is the page's. */
const onWheel = (event: WheelEvent) => {
  if (!loops.value || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
  event.preventDefault()
  glideTarget = null
  pos += event.deltaX
  velocity = 0
  paint(performance.now())
  wake()
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

let visible = false
let resizeObserver: ResizeObserver | null = null
let visibilityObserver: IntersectionObserver | null = null
let nearObserver: IntersectionObserver | null = null
let revealObserver: IntersectionObserver | null = null

const measure = () => {
  const width = rootRef.value?.clientWidth
  if (width && Math.abs(width - reelWidth.value) > 0.5) reelWidth.value = width
}

// Photographs added or taken away in the studio, or a resize: repaint where
// things now are, in the same frame the DOM changed.
watch([cards, metrics], () => {
  requestAnimationFrame(() => paint(performance.now()))
})

onMounted(() => {
  const root = rootRef.value
  if (!root) return

  measure()
  pos = restingStart(metrics.value)
  paint(performance.now())

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(root)
  }

  root.addEventListener('wheel', onWheel, { passive: false })

  if (typeof IntersectionObserver === 'undefined') {
    near = true
    visible = true
    reveal()
    return
  }

  const init = showcaseRevealObserverInit()

  // Only turns while it can be seen. A reel drifting under the RSVP form is a
  // frame loop nobody is watching, on a phone.
  visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      visible = Boolean(entry?.isIntersecting)
      if (visible) wake()
    },
    { root: init.root, threshold: 0 },
  )
  visibilityObserver.observe(root)

  nearObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return
      near = true
      nearObserver?.disconnect()
      nearObserver = null
      paint(performance.now())
    },
    { root: init.root, threshold: 0, rootMargin: '100% 0px 100% 0px' },
  )
  nearObserver.observe(root)

  revealObserver = new IntersectionObserver(([entry]) => {
    if (!entry?.isIntersecting) return
    revealObserver?.disconnect()
    revealObserver = null
    reveal()
  }, init)
  revealObserver.observe(root)
})

onBeforeUnmount(() => {
  if (frame !== undefined) cancelAnimationFrame(frame)
  frame = undefined
  rootRef.value?.removeEventListener('wheel', onWheel)
  resizeObserver?.disconnect()
  visibilityObserver?.disconnect()
  nearObserver?.disconnect()
  revealObserver?.disconnect()
})
</script>

<style scoped>
/* The reel's height follows its cards, which follow its width — so it is the
   same composition on a 320px phone and in a desktop's 9:16 frame. The top
   and bottom room is for the cards' shadow and for the bow, which brings the
   side cards forward and so draws them a little taller than the middle one. */
.rl {
  --rl-pad-y: calc(var(--rl-card-h) * 0.07 + 10px);
  position: relative;
  height: calc(var(--rl-card-h) + var(--rl-pad-y) * 2);
  overflow: hidden;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  cursor: grab;
  /* The strip fades into the card's edges rather than being cut by them. */
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%);
  mask-image: linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%);
}

.rl.is-dragging {
  cursor: grabbing;
}

.rl.is-static {
  cursor: auto;
  -webkit-mask-image: none;
  mask-image: none;
}

/* Short enough to be a real lens (under twice the reel's width), long enough
   that the middle card is square-on rather than bulging. Kept one level below
   the clip for the reason the landing ring's is: overflow and perspective on
   one element don't reliably clip transformed children in Chromium. */
.rl-scene {
  position: absolute;
  inset: 0;
  perspective: calc(var(--rl-w) * 1.8);
  perspective-origin: 50% 50%;
}

/* Every card is centred on the reel and moved out to its place by the loop
   (one transform per card per frame). Hidden until the entrance says
   otherwise, so nothing is seen before it has arrived. */
.rl-card {
  position: absolute;
  left: calc(50% - var(--rl-card-w) / 2);
  top: var(--rl-pad-y);
  width: var(--rl-card-w);
  height: var(--rl-card-h);
  opacity: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  will-change: transform;
}

/* A photograph, not a tile: no bezel, no paper — the landing ring's frames
   are artwork, and a frame round a guest's photograph competes with it. The
   shadow lifts it off the invitation; the hairline mat in the ink is the
   column's, so the two designs share a vocabulary. */
.rl-photo {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  border-radius: 14px;
  overflow: hidden;
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.12),
    0 12px 26px -14px rgba(15, 23, 42, 0.45);
  transition: scale 160ms var(--gd-ease-out, cubic-bezier(0.23, 1, 0.32, 1));
}

.rl-photo::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 20;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--gd-ink, #0f172a) 18%, transparent);
  pointer-events: none;
}

/* Pressed, but not while dragging: a finger that has started pushing the
   reel is not pressing the photograph under it. */
.rl:not(.is-dragging) .rl-photo:active {
  scale: 0.97;
}

.rl-photo:focus-visible {
  outline: 2px solid var(--gd-ink, #0f172a);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .rl-photo {
    transition: none;
  }
}
</style>
