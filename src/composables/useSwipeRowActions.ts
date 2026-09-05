import { ref, onBeforeUnmount } from 'vue'

/**
 * Swipe-to-reveal for a list row, built on physics rather than on a threshold.
 *
 * Everything here exists to remove a seam the user can feel:
 *
 * - **Response and 1:1 tracking.** The row is glued to the finger for the whole
 *   gesture — no transition, no easing, no commit-on-release-only. Its position
 *   is written straight to a `translate3d` on every `pointermove`.
 * - **Momentum projection.** Release does not snap to whichever stop is nearest
 *   the *release point*; it projects where a decelerating flick would come to
 *   rest and snaps to the stop nearest *that*. A small flick therefore throws
 *   the tray open, which is the whole difference between dragging a drawer and
 *   flicking one.
 * - **Velocity hand-off.** The spring starts at the finger's exact release
 *   velocity, so there is no visible moment where dragging stops and animating
 *   begins.
 * - **Interruptibility.** A press during the settle reads the live on-screen
 *   value and drags on from there. Nothing is locked out, and no animation has
 *   to finish before the next may start.
 * - **Rubber-banding.** Past either stop the row keeps following, with
 *   resistance that grows the further it is pulled. A hard stop reads as frozen;
 *   progressive resistance reads as "responsive, but there is nothing more here".
 *
 * The row must carry `touch-action: pan-y` so the browser keeps vertical
 * scrolling for itself and hands us the horizontal axis — which is also what
 * makes list scrolling immune to this gesture.
 */

interface SwipeOptions {
  /** Width of the action tray, measured live (it varies with the action set). */
  width: () => number
  /** Whether the gesture applies at all — false on desktop and in selection mode. */
  enabled: () => boolean
  /** Fired the moment a release commits to open, for the snap haptic. */
  onOpen?: () => void
}

/** Horizontal travel before we claim the gesture from the scroller. */
const AXIS_LOCK_PX = 10
/** Apple's projection function — exponential decay, not the v^2/2a textbook one. */
const DECELERATION = 0.998
/** Springs are described by overshoot + how fast they arrive, never by duration. */
const SPRING_RESPONSE = 0.32
/** Momentum-carrying motion earns a little overshoot; a plain close does not. */
const SPRING_BOUNCE_DAMPING = 0.82
const SPRING_FLAT_DAMPING = 1

const project = (velocity: number) => ((velocity / 1000) * DECELERATION) / (1 - DECELERATION)

/** The further past the bound, the less the row follows. */
const rubberband = (overshoot: number, dimension: number, constant = 0.55) =>
  (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot))

/**
 * One open row at a time — the same singleton discipline the row's popovers
 * already use. Two open trays in one list is a state nobody asked for and
 * nobody can leave with one gesture.
 */
let openRow: { close: () => void } | null = null

export function useSwipeRowActions(options: SwipeOptions) {
  /** Negative = revealed. The single source of truth for where the row is. */
  const offset = ref(0)
  const dragging = ref(false)
  const isOpen = ref(false)

  let velocity = 0
  let frame: number | null = null
  let pointerId: number | null = null
  let startX = 0
  let startY = 0
  let startOffset = 0
  let claimed = false
  let abandoned = false
  let samples: Array<{ x: number; t: number }> = []
  let target: HTMLElement | null = null

  const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const stopAnimation = () => {
    if (frame !== null) cancelAnimationFrame(frame)
    frame = null
  }

  const settle = (to: number) => {
    const nowOpen = to !== 0
    if (nowOpen) {
      if (openRow?.close !== close) {
        openRow?.close()
        openRow = { close }
      }
    } else if (openRow?.close === close) {
      openRow = null
    }
    isOpen.value = nowOpen
  }

  /**
   * Critically-damped-by-default spring, integrated at display cadence.
   *
   * Apple's two designer parameters rather than the physics triplet: `response`
   * is how quickly it arrives, `damping` is whether it overshoots. It always
   * starts from the *presentation* value (`offset.value` as it stands right
   * now), which is what makes an interrupted animation continue instead of jump.
   */
  const springTo = (to: number, initialVelocity: number, damping: number) => {
    stopAnimation()

    if (prefersReducedMotion()) {
      offset.value = to
      velocity = 0
      settle(to)
      return
    }

    const omega = (2 * Math.PI) / SPRING_RESPONSE
    const k = omega * omega
    const c = 2 * damping * omega
    velocity = initialVelocity

    let last = performance.now()

    const step = (now: number) => {
      // Sub-step so a dropped frame cannot blow the integrator up.
      let dt = Math.min((now - last) / 1000, 0.064)
      last = now
      while (dt > 0) {
        const h = Math.min(dt, 1 / 120)
        const acceleration = -k * (offset.value - to) - c * velocity
        velocity += acceleration * h
        offset.value += velocity * h
        dt -= h
      }

      if (Math.abs(offset.value - to) < 0.4 && Math.abs(velocity) < 24) {
        offset.value = to
        velocity = 0
        frame = null
        settle(to)
        return
      }
      frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
  }

  const close = (animate = true) => {
    if (openRow?.close === close) openRow = null
    isOpen.value = false
    if (!animate || offset.value === 0) {
      stopAnimation()
      offset.value = 0
      velocity = 0
      return
    }
    springTo(0, velocity, SPRING_FLAT_DAMPING)
  }

  const open = () => {
    if (openRow?.close !== close) openRow?.close()
    openRow = { close }
    isOpen.value = true
    springTo(-options.width(), velocity, SPRING_BOUNCE_DAMPING)
  }

  const releasePointer = () => {
    if (pointerId !== null && target) {
      try {
        target.releasePointerCapture(pointerId)
      } catch {
        /* already released */
      }
    }
    pointerId = null
    target = null
  }

  const onPointerDown = (event: PointerEvent) => {
    if (!options.enabled()) return
    // Mouse keeps the desktop row exactly as it was: click to select, hover to
    // reveal. This gesture is for the coarse pointer it was designed for.
    if (event.pointerType === 'mouse') return
    if (pointerId !== null) return

    // Grab the row mid-flight: start from where it *is*, not where it was going.
    stopAnimation()

    pointerId = event.pointerId
    target = event.currentTarget as HTMLElement
    startX = event.clientX
    startY = event.clientY
    startOffset = offset.value
    claimed = false
    abandoned = false
    samples = [{ x: event.clientX, t: event.timeStamp }]
  }

  const onPointerMove = (event: PointerEvent) => {
    if (pointerId !== event.pointerId || abandoned) return

    // The gesture can be disqualified *during* itself — holding a row to enter
    // selection mode is exactly that — and a drag that outlives its own
    // permission would open a tray in a mode that has no use for one.
    if (!options.enabled()) {
      abandoned = true
      releasePointer()
      if (claimed) close()
      return
    }

    const dx = event.clientX - startX
    const dy = event.clientY - startY

    if (!claimed) {
      // Both plausible gestures are tracked in parallel, then the loser is
      // cancelled once intent is clear — rather than blocking the scroller
      // while we decide.
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > AXIS_LOCK_PX) {
        abandoned = true
        releasePointer()
        return
      }
      if (Math.abs(dx) < AXIS_LOCK_PX) return
      claimed = true
      dragging.value = true
      try {
        target?.setPointerCapture(event.pointerId)
      } catch {
        /* capture is a nicety, not a requirement */
      }
      // Take the lock threshold out of the travel so the row starts moving from
      // exactly under the finger rather than jumping 10px on the first frame.
      startX += dx > 0 ? AXIS_LOCK_PX : -AXIS_LOCK_PX
    }

    const width = options.width()
    const raw = startOffset + (event.clientX - startX)

    if (raw > 0) {
      offset.value = rubberband(raw, width)
    } else if (raw < -width) {
      offset.value = -width - rubberband(-(raw + width), width)
    } else {
      offset.value = raw
    }

    samples.push({ x: event.clientX, t: event.timeStamp })
    if (samples.length > 6) samples.shift()
  }

  const onPointerUp = () => {
    if (pointerId === null) return
    const wasDragging = claimed
    releasePointer()

    if (!wasDragging) {
      dragging.value = false
      return
    }

    // Velocity over the tail of the gesture, not the whole of it — what the
    // finger was doing at release is the only part the animation inherits.
    const last = samples[samples.length - 1]
    const first = samples.find((s) => last.t - s.t <= 110) ?? samples[0]
    const elapsed = Math.max(last.t - first.t, 1)
    const releaseVelocity = ((last.x - first.x) / elapsed) * 1000

    const width = options.width()
    const projected = offset.value + project(releaseVelocity)
    const wasOpen = isOpen.value
    const shouldOpen = Math.abs(projected + width) < Math.abs(projected)

    velocity = releaseVelocity
    if (shouldOpen) {
      if (!wasOpen) options.onOpen?.()
      open()
    } else {
      close()
    }

    // Held until after the decision so the release cannot be read as a tap.
    requestAnimationFrame(() => {
      dragging.value = false
    })
  }

  const onPointerCancel = () => {
    if (pointerId === null) return
    const wasDragging = claimed
    releasePointer()
    if (wasDragging) {
      close()
      requestAnimationFrame(() => {
        dragging.value = false
      })
    }
  }

  /** True while the row is displaced at all — a tap here must not commit. */
  const isDisplaced = () => Math.abs(offset.value) > 1

  onBeforeUnmount(() => {
    stopAnimation()
    releasePointer()
    if (openRow?.close === close) openRow = null
  })

  return {
    offset,
    dragging,
    isOpen,
    isDisplaced,
    close,
    handlers: {
      onPointerdown: onPointerDown,
      onPointermove: onPointerMove,
      onPointerup: onPointerUp,
      onPointercancel: onPointerCancel,
    },
  }
}
