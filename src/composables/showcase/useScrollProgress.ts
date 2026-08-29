import { onMounted, onUnmounted, watch, type Ref } from 'vue'

/**
 * Shared scroll-progress registry for the showcase's scroll-driven reveals
 * (agenda cards, gallery photos).
 *
 * One scroll listener and one rAF for every registered element, with all
 * `getBoundingClientRect()` reads batched ahead of all style writes.
 *
 * Registering per component instead meant N listeners and N rAF callbacks per
 * frame, each reading the shared container's rect and then writing a custom
 * property — read-after-write interleaved N times, which forces synchronous
 * layout N times per frame. A 20-item agenda paid that on every scroll event.
 */

const SCROLL_ROOT_SELECTOR = '.liquid-glass-card .custom-scrollbar'

/**
 * The one IntersectionObserver config every showcase section reveal uses.
 *
 * The root matters: all scrolling happens inside the liquid-glass card's own
 * container, so observing against the viewport (`root: null`) measures a
 * different rectangle and applies `rootMargin` to the wrong edge. Sections
 * disagreeing about this is what produced four different configs — a section
 * wrapper firing at one moment and the word animation inside it at another —
 * plus a width-based threshold hack in the agenda layouts that was really just
 * compensating for the wrong root.
 *
 * `threshold` MUST stay 0. An area-fraction threshold asks a question no tall
 * section can answer: `intersectionRatio` is capped at rootHeight / sectionHeight,
 * so once a section grows past `rootHeight / threshold` the ratio can never
 * reach it and the section sits at `opacity: 0` forever — present, laid out and
 * still clickable, which reads to a guest as blank space that opens a photo when
 * tapped. The photo gallery is the section that hits it: measured on a Pixel 7,
 * the card scrolls in a 713px window while an 11-photo gallery is 3139px tall
 * (ceiling 0.21), and the same gallery in a messaging app's browser, where
 * toolbars leave a 366px window, peaks at 0.097 against the old 0.1 and never
 * appears at all. A portrait-heavy wedding gallery crosses it on a full-height
 * phone at ~15 photos. This is the same failure the deleted mobile CSS fallback
 * was papering over.
 *
 * The intent — "don't reveal until a bit of it is showing" — is carried by the
 * bottom `rootMargin` instead, which states it in pixels: the section reveals
 * once 60px of it has entered the scroller, whatever its height. For the ~600px
 * sections the 0.1 was tuned against that is the same moment as before.
 */
export function showcaseRevealObserverInit(): IntersectionObserverInit {
  return {
    threshold: 0,
    rootMargin: '0px 0px -60px 0px',
    root: document.querySelector(SCROLL_ROOT_SELECTOR),
  }
}

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)

const elements = new Set<HTMLElement>()
let scrollRoot: HTMLElement | null = null
let rafId: number | null = null
let listening = false

/**
 * Bind (or re-bind) the scroll listener to the showcase's scroll container.
 *
 * The root is re-resolved on every scheduled frame while it is still missing,
 * because the first element can register before the liquid-glass card exists.
 * Latching `window` permanently in that case would measure against the wrong
 * rectangle for the rest of the session.
 */
const bindRoot = () => {
  const found = document.querySelector<HTMLElement>(SCROLL_ROOT_SELECTOR)
  if (found === scrollRoot && listening) return

  if (listening) {
    const previous: EventTarget = scrollRoot ?? window
    previous.removeEventListener('scroll', schedule)
  }
  scrollRoot = found
  const target: EventTarget = scrollRoot ?? window
  target.addEventListener('scroll', schedule, { passive: true })
}

const measure = () => {
  rafId = null
  if (elements.size === 0) return
  if (!scrollRoot) bindRoot()

  // --- read phase: container first, then every element ---
  let viewportTop = 0
  let viewportBottom = window.innerHeight
  if (scrollRoot) {
    const rootRect = scrollRoot.getBoundingClientRect()
    viewportTop = rootRect.top
    viewportBottom = rootRect.bottom
  }
  const viewportHeight = viewportBottom - viewportTop
  if (viewportHeight <= 0) return

  const writes: Array<[HTMLElement, string]> = []
  for (const el of elements) {
    const rect = el.getBoundingClientRect()
    if (rect.height === 0) continue

    const visibleTop = Math.max(rect.top, viewportTop)
    const visibleBottom = Math.min(rect.bottom, viewportBottom)
    const visibleHeight = Math.max(0, visibleBottom - visibleTop)

    // Normalize against the smaller of element height / viewport height so an
    // element taller than the viewport can still reach progress 1.
    const maxVisible = Math.min(rect.height, viewportHeight)
    const raw = maxVisible > 0 ? visibleHeight / maxVisible : 0
    writes.push([el, easeOutCubic(Math.min(1, Math.max(0, raw))).toFixed(3)])
  }

  // --- write phase ---
  for (const [el, value] of writes) {
    el.style.setProperty('--scroll-progress', value)
  }
}

const schedule = () => {
  if (rafId !== null) return
  rafId = requestAnimationFrame(measure)
}

const startListening = () => {
  if (listening) return
  bindRoot()
  window.addEventListener('resize', schedule, { passive: true })
  listening = true
}

const stopListening = () => {
  if (!listening) return
  const target: EventTarget = scrollRoot ?? window
  target.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', schedule)
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  scrollRoot = null
  listening = false
}

/** Register an element; returns a disposer. Prefer the composable below. */
export function registerScrollProgress(el: HTMLElement): () => void {
  elements.add(el)
  startListening()
  schedule()
  return () => {
    elements.delete(el)
    if (elements.size === 0) stopListening()
  }
}

/** Force a recomputation — e.g. after content above the element changes height. */
export function refreshScrollProgress(): void {
  schedule()
}

/**
 * Track `--scroll-progress` on `elRef` for as long as the component is mounted.
 *
 * `startDelayMs` holds the element at progress 0 before its first measurement,
 * which is what lets a list stagger its cards in rather than resolving them all
 * on the same frame.
 */
export function useScrollProgress(
  elRef: Ref<HTMLElement | null>,
  options: { startDelayMs?: number } = {},
) {
  let dispose: (() => void) | null = null
  let delayTimer: number | null = null

  const attach = (el: HTMLElement | null) => {
    dispose?.()
    dispose = null
    if (delayTimer !== null) {
      clearTimeout(delayTimer)
      delayTimer = null
    }
    if (!el) return

    el.style.setProperty('--scroll-progress', '0')
    const delay = options.startDelayMs ?? 0
    if (delay > 0) {
      delayTimer = window.setTimeout(() => {
        delayTimer = null
        if (elRef.value) dispose = registerScrollProgress(elRef.value)
      }, delay)
    } else {
      dispose = registerScrollProgress(el)
    }
  }

  onMounted(() => attach(elRef.value))
  watch(elRef, (el) => attach(el))

  onUnmounted(() => {
    dispose?.()
    dispose = null
    if (delayTimer !== null) {
      clearTimeout(delayTimer)
      delayTimer = null
    }
  })
}
