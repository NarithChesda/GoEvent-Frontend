import { nextTick, onMounted, onUnmounted, ref, watch, type Ref } from 'vue'

/**
 * The selection marker that travels between the tabs of a navigation bar.
 *
 * Extracted from MobileTabBar so the desktop bar can mark its active route the
 * same way. Both bars are mounted at once (each is hidden by a breakpoint, not
 * by `v-if`), so the cross-instance memory below is keyed per bar.
 *
 * Three things this has to get right, in order of how badly they show:
 *
 * 1. **The geometry is measured, never declared.** A tab's width is its label's
 *    width, which depends on the locale, on the loaded webfont, and — on the
 *    mobile pill — on whether it is the tab currently carrying a label at all.
 *    So the marker reads the box of whichever tab has `aria-current="page"`, an
 *    attribute the templates already set, and there is no second opinion about
 *    which tab is active.
 *
 * 2. **The destination moves while we travel.** The tabs are still relaying out
 *    underneath — one giving up its label, the next taking one — so a target
 *    measured once at the start aims at the old layout and lands short. It is
 *    re-read every frame instead.
 *
 * 3. **A redirect mid-flight must not restart the motion.** Tapping a third tab
 *    while the marker is still crossing to the second re-aims the spring and
 *    lets it carry the speed it already had. Restarting an eased tween there
 *    drops the velocity to zero on one frame — Apple's "brick wall". This is
 *    what the spring below buys that the previous eased-fraction rAF could not:
 *    interruption is free, because a spring is only ever a target and a
 *    current velocity.
 */

/** Where each bar's selection sat when its instance was torn down. */
const lastActive: Record<string, string> = {}

export interface IndicatorGeometry {
  x: number
  w: number
  visible: boolean
}

interface Options {
  /**
   * Opts into the cross-instance memory, and distinguishes the bars from each
   * other within it. Only the nav bars need it — they are rebuilt on every
   * navigation and have nothing to animate *from* otherwise. A control that
   * survives its own state changes (a segmented filter) must leave it unset:
   * two pages sharing a key would seed one from the other's value, which is not
   * even among its own options, and the marker would blink out for a frame
   * before correcting itself.
   */
  key?: string
  /** The positioning context the marker is absolute inside, and measured against. */
  row: Ref<HTMLElement | null | undefined>
  /** The live value the marker follows — a route path, or a selected filter. */
  path: Ref<string>
  /**
   * How the active element announces itself. `aria-current="page"` is right for
   * navigation; a filter is not a page, so a segmented control passes its own.
   */
  activeSelector?: string
  /**
   * Apple's two spring parameters (Designing Fluid Interfaces), not mass /
   * stiffness / damping. `response` is roughly how long it takes to arrive, in
   * seconds; `damping` 1 is critically damped — no overshoot. 1.0 / 0.4s is
   * Apple's own "move / reposition" pairing, and overshoot would be wrong here
   * anyway: nothing about clicking a tab carried momentum for the marker to
   * inherit.
   */
  response?: number
  damping?: number
}

export function useTravellingIndicator({
  key,
  row,
  path,
  activeSelector = '[aria-current="page"]',
  response = 0.4,
  damping = 1,
}: Options) {
  /*
   * Deliberately not `path` directly. Every view renders its own MainLayout, so
   * both bars are torn down and rebuilt on each navigation: the instance that
   * would play the transition is gone before it could, and the fresh one comes
   * up already showing the destination with nothing to animate *from*.
   *
   * So the destination is held back by a frame. `lastActive` outlives the
   * component, the new bar paints once as the page you came from, and only then
   * switches — which is an ordinary reactive change the marker can glide off.
   *
   * (The honest fix is for the nav chrome to be a persistent instance above the
   * router view rather than per-page furniture. That is a wider change.)
   */
  const activePath = ref((key && lastActive[key]) || path.value)

  // `immediate` matters: on a cold load nothing else ever writes this, and
  // without a first write the next bar would come up with no memory at all.
  if (key) {
    watch(
      activePath,
      (value) => {
        lastActive[key] = value
      },
      { immediate: true },
    )
  }

  const isActive = (candidate: string) => {
    const current = activePath.value
    return current === candidate || current.startsWith(candidate + '/')
  }

  const indicator = ref<IndicatorGeometry>({ x: 0, w: 0, visible: false })

  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null

  let frame = 0
  let lastFrameAt = 0
  // Carried across re-targets — see (3) above. This is the whole reason the
  // marker survives being redirected mid-flight without a visible hitch.
  let velocityX = 0
  let velocityW = 0

  /** Where the marker should be right now, or null if no tab is active. */
  const measure = () => {
    const container = row.value
    const tab = container?.querySelector<HTMLElement>(activeSelector)
    if (!container || !tab) return null
    const rowBox = container.getBoundingClientRect()
    const tabBox = tab.getBoundingClientRect()
    // A bar hidden by its breakpoint measures zero on every axis; leaving the
    // marker where it was beats collapsing it to nothing behind the scenes.
    if (!tabBox.width) return null
    return { x: tabBox.left - rowBox.left, w: tabBox.width }
  }

  const stop = () => {
    if (frame) cancelAnimationFrame(frame)
    frame = 0
  }

  /** Jump straight to the current geometry — mount, resize, locale change. */
  const settle = () => {
    stop()
    velocityX = 0
    velocityW = 0
    const target = measure()
    if (!target) {
      indicator.value = { ...indicator.value, visible: false }
      return
    }
    indicator.value = { ...target, visible: true }
  }

  const step = (now: number) => {
    frame = 0
    const target = measure()
    if (!target) {
      settle()
      return
    }

    // Clamped so a backgrounded tab returning after seconds away cannot hand the
    // integrator a dt large enough to diverge.
    const dt = Math.min(0.032, Math.max(0.001, (now - lastFrameAt) / 1000))
    lastFrameAt = now

    const omega = (2 * Math.PI) / response
    const stiffness = omega * omega
    const drag = 2 * damping * omega

    // Two independent springs. A single spring over the 2D distance desyncs the
    // moment position and width are moving at different speeds, which is every
    // move where the outgoing and incoming labels are different lengths.
    let { x, w } = indicator.value
    velocityX += (-stiffness * (x - target.x) - drag * velocityX) * dt
    velocityW += (-stiffness * (w - target.w) - drag * velocityW) * dt
    x += velocityX * dt
    w += velocityW * dt

    const atRest =
      Math.abs(x - target.x) < 0.4 &&
      Math.abs(w - target.w) < 0.4 &&
      Math.abs(velocityX) < 12 &&
      Math.abs(velocityW) < 12

    if (atRest) {
      // Land on the measured value, never the integrated one.
      indicator.value = { ...target, visible: true }
      velocityX = 0
      velocityW = 0
      return
    }

    indicator.value = { x, w, visible: true }
    frame = requestAnimationFrame(step)
  }

  const glide = () => {
    if (!indicator.value.visible || reducedMotion?.matches || !measure()) {
      settle()
      return
    }
    // Already in flight: leave it running. `measure()` returns the new tab's box
    // from the next frame on, so the spring simply re-aims — carrying the
    // velocity it already had, which is the point.
    if (frame) return
    lastFrameAt = performance.now()
    frame = requestAnimationFrame(step)
  }

  /** Move to a new tab, animating unless there is nothing to animate from. */
  const goTo = (next: string) => {
    if (activePath.value === next) return
    activePath.value = next
    nextTick(glide)
  }

  // A route change is the only thing that should animate. Everything else that
  // moves the tabs — a locale swap relabelling them, the viewport resizing,
  // signing in adding another — just repositions.
  watch(path, goTo)

  let resizeObserver: ResizeObserver | null = null

  onMounted(() => {
    // Place the marker on the tab we arrived from, then hand over to the real
    // route. Two frames: the first commits the starting geometry, and a change
    // in the same frame as the first paint would animate from nothing.
    settle()
    requestAnimationFrame(() => requestAnimationFrame(() => goTo(path.value)))

    // The label's width is the webfont's, and the first measure on a cold load
    // happens against the fallback face.
    document.fonts?.ready.then(() => {
      if (!frame) settle()
    })

    if (row.value && typeof ResizeObserver !== 'undefined') {
      // Catches the rest: the viewport changing, the laptop scale-down, and
      // tabs appearing or leaving when the user signs in or out.
      resizeObserver = new ResizeObserver(() => {
        if (!frame) settle()
      })
      resizeObserver.observe(row.value)
    }
  })

  onUnmounted(() => {
    stop()
    resizeObserver?.disconnect()
    resizeObserver = null
  })

  return { indicator, activePath, isActive, settle }
}
