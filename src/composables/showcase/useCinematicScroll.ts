import { onBeforeUnmount, onMounted, readonly, ref, type Ref } from 'vue'

/**
 * Tap-to-play for the invitation: a tap anywhere on the main content stage
 * rolls the card down on its own, like a camera dollying down the page, and
 * lands on the footer mark. A second tap pauses it; any scroll of the guest's
 * own takes over.
 *
 * Driven by rAF writing `scrollTop`, not by CSS: a scroll offset is not a
 * property CSS can animate, and `scrollTo({ behavior: 'smooth' })` is a fixed
 * ~500ms browser curve that can be neither slowed to a reading pace nor paused.
 *
 * The velocity profile is a real camera move's: constant acceleration up to a
 * cruise speed, then constant deceleration onto the rest point. Starting at
 * full speed reads as a jolt, and stopping dead on the footer reads as having
 * hit the end of the content rather than arriving at it.
 */

/** Cruise speed as one scrollport per this many seconds — a reading pace that
 *  holds on any screen, where a fixed px/s would crawl on a desktop card and
 *  race on a small phone. */
const SECONDS_PER_SCREEN = 12

/** Time from rest to cruise. */
const RAMP_UP_MS = 700

/** Time from cruise to rest on the landing. */
const BRAKE_MS = 1400

/** A frame longer than this is a stall (tab hidden, main thread busy), not
 *  motion: without the cap the page would leap on the next frame. */
const MAX_FRAME_MS = 50

/** How far the real offset may stray from ours before we follow it. Engines
 *  that round `scrollTop` stay within a pixel; anything past this is scroll
 *  anchoring or a reflow having moved the page under us. */
const DRIFT_PX = 3

/** A press that travels further than this was a drag, not a tap. */
const TAP_SLOP_PX = 10

/** Close enough to the rest point to call it landed. */
const LANDED_PX = 0.5

/** Elements whose tap already means something. The search is bounded to the
 *  stage, so a stage rendered inside some larger control is not rejected
 *  wholesale. */
const INTERACTIVE_SELECTOR = [
  'a',
  'button',
  'input',
  'textarea',
  'select',
  'label',
  'summary',
  'iframe',
  'video',
  'audio',
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[role="dialog"]',
  '[contenteditable]:not([contenteditable="false"])',
].join(',')

/**
 * Scroll velocity (px/s) for one frame of playback.
 *
 * `remaining` is the distance to the rest point. Braking is uniform
 * deceleration: covering `d` at a constant rate from cruise to zero leaves a
 * speed of `cruise * sqrt(d / brakeDistance)` with `d` still to go — which,
 * unlike an exponential approach, actually arrives in finite time.
 */
export function playbackVelocity(cruise: number, elapsedMs: number, remaining: number): number {
  const rampUp = Math.min(1, Math.max(0, elapsedMs) / RAMP_UP_MS)
  const brakeDistance = (cruise * BRAKE_MS) / 2000
  const brake = remaining >= brakeDistance ? 1 : Math.sqrt(Math.max(0, remaining) / brakeDistance)
  return cruise * Math.min(rampUp, brake)
}

/**
 * Whether a tap landed on the invitation itself rather than on something that
 * owns its own tap — a control, a photo tile, or a layer floating over the page
 * (the menu's scrim, an in-place sheet).
 *
 * The cursor test is what catches clickable elements that are not controls,
 * like the gallery's photo tiles, without this file having to know every
 * section. It inherits, so the image inside a tile is caught by its tile.
 */
export function isPlainTap(target: EventTarget | null, root: HTMLElement): boolean {
  let el = target instanceof Element ? target : null
  if (!el || !root.contains(el)) return false

  const control = el.closest(INTERACTIVE_SELECTOR)
  if (control && root.contains(control)) return false

  for (; el && el !== root; el = el.parentElement) {
    const style = getComputedStyle(el)
    if (style.cursor === 'pointer' || style.position === 'fixed') return false
  }
  return true
}

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

export interface CinematicScrollOptions {
  /** Where taps are heard: the whole stage, so the margin around the card
   *  plays it too, not only the card. */
  root: Ref<HTMLElement | null | undefined>
  /** The element that scrolls. */
  scroller: Ref<HTMLElement | null | undefined>
  /**
   * The scroll offset playback comes to rest at. Asked every frame rather than
   * once, because sections keep mounting and photos keep loading while it plays.
   */
  restOffset: (scroller: HTMLElement) => number
  /** False where a tap already means something else (the editable preview). */
  enabled?: () => boolean
}

export function useCinematicScroll(options: CinematicScrollOptions) {
  const isPlaying = ref(false)

  let rafId = 0
  // Our own float offset. Re-reading `scrollTop` each frame instead would stall
  // for good on an engine that rounds it: a 0.6px step rounds back to where it
  // started, every frame.
  let position = 0
  let startedAt = -1
  let lastFrame = 0

  // The press that precedes a click, so the click can tell a tap from a drag
  // and a pausing tap from a playing one.
  let downX = 0
  let downY = 0
  let pressWasPlaying = false

  const stop = () => {
    if (rafId) cancelAnimationFrame(rafId)
    rafId = 0
    isPlaying.value = false
  }

  const frame = (now: number) => {
    rafId = 0
    const el = options.scroller.value
    if (!el || !isPlaying.value) return stop()

    if (startedAt < 0) {
      startedAt = now
      lastFrame = now
    }
    const dt = Math.min(Math.max(0, now - lastFrame), MAX_FRAME_MS) / 1000
    lastFrame = now

    // Follow a move we didn't make rather than yanking the page back to ours.
    if (Math.abs(el.scrollTop - position) > DRIFT_PX) position = el.scrollTop

    const maxOffset = el.scrollHeight - el.clientHeight
    const rest = Math.max(0, Math.min(options.restOffset(el), maxOffset))
    const remaining = rest - position
    if (remaining <= LANDED_PX) {
      if (remaining > 0) el.scrollTop = rest
      return stop()
    }

    const cruise = el.clientHeight / SECONDS_PER_SCREEN
    position = Math.min(rest, position + playbackVelocity(cruise, now - startedAt, remaining) * dt)
    el.scrollTop = position

    rafId = requestAnimationFrame(frame)
  }

  const play = () => {
    const el = options.scroller.value
    if (!el || isPlaying.value) return
    position = el.scrollTop
    startedAt = -1
    isPlaying.value = true
    rafId = requestAnimationFrame(frame)
  }

  const onPointerDown = (e: PointerEvent) => {
    if (!e.isPrimary) return
    downX = e.clientX
    downY = e.clientY
    pressWasPlaying = isPlaying.value
    // A finger on a moving page catches it, the way it catches momentum on
    // iOS: at once, before anyone knows whether this is a tap, a drag or a
    // press on a button.
    if (pressWasPlaying) stop()
  }

  const onClick = (e: MouseEvent) => {
    const wasPlaying = pressWasPlaying
    pressWasPlaying = false

    // detail 0 is a keyboard-activated click, which has no press before it.
    if (e.detail === 0 || wasPlaying) return
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > TAP_SLOP_PX) return

    const root = options.root.value
    if (!root || !isPlainTap(e.target, root)) return
    if (options.enabled && !options.enabled()) return
    // A whole viewport in continuous motion is the canonical vestibular
    // trigger, and there is no gentler version of it: the invitation still
    // scrolls by hand exactly as before.
    if (prefersReducedMotion()) return

    play()
  }

  const onWheel = () => {
    if (isPlaying.value) stop()
  }

  const onKeyDown = () => {
    if (isPlaying.value) stop()
  }

  let listeningOn: HTMLElement | null = null

  onMounted(() => {
    const root = options.root.value
    if (!root) return
    listeningOn = root
    // Capture: a child that stops propagation must still not be able to leave
    // the page running under the guest's finger.
    root.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true })
    root.addEventListener('wheel', onWheel, { capture: true, passive: true })
    // Bubble: a control that stops its own click is saying the tap was its.
    root.addEventListener('click', onClick)
    window.addEventListener('keydown', onKeyDown)
  })

  onBeforeUnmount(() => {
    stop()
    if (listeningOn) {
      listeningOn.removeEventListener('pointerdown', onPointerDown, { capture: true })
      listeningOn.removeEventListener('wheel', onWheel, { capture: true })
      listeningOn.removeEventListener('click', onClick)
      listeningOn = null
    }
    window.removeEventListener('keydown', onKeyDown)
  })

  return { isPlaying: readonly(isPlaying), stop }
}
