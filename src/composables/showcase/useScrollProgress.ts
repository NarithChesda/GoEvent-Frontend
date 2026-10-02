import { onMounted, onUnmounted, watch, type Ref } from 'vue'

/**
 * Shared scroll-progress registry for the showcase's JS-measured scroll reveals
 * (agenda cards, gallery photos), plus the one IntersectionObserver config every
 * section reveal uses. The CSS-driven chapter entrances live in scroll-story.css.
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
 * How far above the scroller's bottom edge a section's own entrance plays
 * under the scroll story: a share of the scroller, so it sits the same
 * distance into the visible card on every phone. 22% clears the deepest
 * bottom ornaments the templates draw (~10% of the card) with room for a line
 * of text, and is still low enough that a guest scrolling at reading speed
 * meets each performance as it starts rather than finished.
 */
export const STORY_READING_LINE = '22%'

/** "On screen": 60px clear of the scroller's bottom edge. */
const ON_SCREEN_LINE_PX = 60

/**
 * Whether the scroll story runs: the browser can drive animations by scroll
 * position (CSS scroll-driven animations — Chromium 115+, Safari 26+) and the
 * guest hasn't asked for less motion. The stylesheets gate on exactly the same
 * two conditions (`@supports (animation-timeline: view())` inside
 * `prefers-reduced-motion: no-preference`), so the reading line below and the
 * scrubbed entrances can never disagree about which mode the page is in.
 */
export function storyScrollActive(): boolean {
  if (typeof window === 'undefined' || typeof CSS === 'undefined' || !CSS.supports) return false
  if (!CSS.supports('animation-timeline: view()')) return false
  return !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

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
 *
 * Under the scroll story (`storyScrollActive`) the line moves up to
 * `STORY_READING_LINE`. 60px is under most templates' bottom ornament, so every
 * section's own performance (words writing themselves, the circled day, the
 * countdown's wipe, the wishes dropping in) played where nobody could see it
 * and was over before the section reached the reading zone. That was tolerable
 * only because the section itself was invisible until then. With the story on,
 * a section is visible as it rises (scroll-scrubbed, scroll-story.css), so the
 * performance waits for it to be somewhere the guest is looking. Without scroll
 * timelines, or with reduced motion, nothing changes: the section is hidden
 * until it reveals, so revealing late would only leave a blank band.
 */
export function showcaseRevealObserverInit(): IntersectionObserverInit {
  return {
    threshold: 0,
    rootMargin: storyScrollActive()
      ? `0px 0px -${STORY_READING_LINE} 0px`
      : `0px 0px -${ON_SCREEN_LINE_PX}px 0px`,
    root: document.querySelector(SCROLL_ROOT_SELECTOR),
  }
}

/**
 * `new IntersectionObserver(callback, showcaseRevealObserverInit())`, plus the
 * one rule the scroll story's reading line needs: an element that is already
 * on screen when it is first observed counts as revealed at once.
 *
 * The reading line is for content the guest scrolls TO. The opening screen —
 * whatever is in view when the invitation appears, or a section that mounts
 * where the guest is already looking — was never scrolled to, and nothing will
 * carry it up to the line: under the line alone, the invitation sentence below
 * the hosts sat blank until the first scroll. On screen means the line every
 * reveal used before the story: 60px clear of the bottom edge.
 *
 * Only an element's first report gets the rule; after that it waits for the
 * line like everything else. Callers see an ordinary entry list — an entry
 * revealed this way is a plain copy of the original with `isIntersecting` set.
 * Without the story it is exactly `new IntersectionObserver`.
 */
export function createShowcaseRevealObserver(
  callback: IntersectionObserverCallback,
): IntersectionObserver {
  const init = showcaseRevealObserverInit()
  if (!storyScrollActive()) return new IntersectionObserver(callback, init)

  const root = init.root instanceof Element ? init.root : null
  const reported = new WeakSet<Element>()

  return new IntersectionObserver((entries, observer) => {
    let screen: { top: number; bottom: number } | null = null
    const adjusted = entries.map((entry) => {
      const first = !reported.has(entry.target)
      reported.add(entry.target)
      if (!first || entry.isIntersecting) return entry

      screen ??= root?.getBoundingClientRect() ?? { top: 0, bottom: window.innerHeight }
      const rect = entry.boundingClientRect
      const onScreen = rect.top < screen.bottom - ON_SCREEN_LINE_PX && rect.bottom > screen.top
      return onScreen ? revealedEntry(entry) : entry
    })
    callback(adjusted, observer)
  }, init)
}

const revealedEntry = (entry: IntersectionObserverEntry): IntersectionObserverEntry => ({
  boundingClientRect: entry.boundingClientRect,
  intersectionRatio: entry.intersectionRatio,
  intersectionRect: entry.intersectionRect,
  isIntersecting: true,
  rootBounds: entry.rootBounds,
  target: entry.target,
  time: entry.time,
})

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)

const elements = new Set<HTMLElement>()
let scrollRoot: HTMLElement | null = null
let rafId: number | null = null
let listening = false

/**
 * Bind (or re-bind) the scroll listener to the showcase's scroll container.
 *
 * The root is re-resolved while it is missing OR while the bound one has left
 * the document, because neither state is permanent:
 *
 * - The first element can register before the liquid-glass card exists.
 *   Latching `window` permanently in that case would measure against the wrong
 *   rectangle for the rest of the session.
 * - The whole showcase subtree is rebuilt under the live preview: CoverStage is
 *   keyed on its video URLs, so staging a template into an already-mounted
 *   frame (the partner catalogue's core gesture, and the studio's late backfill
 *   of an unpaid template's assets) tears down the glass card and mounts a new
 *   one. The replacement's elements register BEFORE the outgoing ones are
 *   disposed — Vue sets template refs as a post-flush job at id -1 and runs
 *   onUnmounted hooks after it — so `elements` never empties and
 *   `stopListening` never runs. A registry that re-resolved only a *null* root
 *   therefore stayed bound to the detached scroller, whose scroll events no
 *   longer arrive and whose rect measures 0 — which bails `measure` out at the
 *   zero-height guard before it writes anything. Every agenda card and photo
 *   then sits at progress 0 (opacity .55, scale .94) for the rest of the
 *   session: the reveal frozen half-transparent, exactly what the preview
 *   showed and the live showcase never did, because there the card mounts once.
 */
const bindRoot = () => {
  const found = document.querySelector<HTMLElement>(SCROLL_ROOT_SELECTOR)
  if (found === scrollRoot && listening && (!scrollRoot || scrollRoot.isConnected)) return

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
  if (!scrollRoot?.isConnected) bindRoot()

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
  // Always re-resolve: a registration arriving after the subtree was replaced
  // is the only signal the registry gets that its root is stale. bindRoot()
  // no-ops when the root is unchanged and still connected.
  bindRoot()
  if (listening) return
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
