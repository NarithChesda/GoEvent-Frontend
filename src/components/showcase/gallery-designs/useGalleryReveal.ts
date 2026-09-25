import { onBeforeUnmount, ref } from 'vue'
import { showcaseRevealObserverInit } from '@/composables/showcase/useScrollProgress'

export interface GalleryRevealOptions {
  /**
   * Seconds between items that come into view together. The stagger is only
   * ever within one batch: items that enter one after another as the guest
   * scrolls arrive when they enter, with no delay of their own, so a slow
   * scroll is never made to wait on a stagger it can't see.
   */
  step: number
  /** Ceiling on a batch's stagger, so a tall screen doesn't queue a slow tail. */
  cap?: number
}

/**
 * The per-item arrival every vertical gallery design shares: each photograph
 * (or strip) is handed over once, as it scrolls into the card, and never taken
 * back — the gesture is a print being laid down, not a hover state.
 *
 * Two observers on the card's own scroller, one per question:
 *
 * - **near** — a screen ahead of the scroll, so the image is fetched before
 *   anyone can see its frame. Native `loading="lazy"` can't answer this here:
 *   it measures against the window, and the photographs are clipped by the
 *   card's scroller, so a lazy image below the card's fold only starts loading
 *   once it is already on screen.
 * - **revealed** — the shared showcase reveal config (threshold 0, 60px in;
 *   see `showcaseRevealObserverInit` for why the threshold must be 0).
 *
 * Keyed by string, not by index, so the studio re-ordering or removing a
 * photograph doesn't hand one photo's arrival to its neighbour.
 */
export function useGalleryReveal({ step, cap = 0.6 }: GalleryRevealOptions) {
  /** Key → its delay in seconds, once revealed. */
  const revealed = ref<Record<string, number>>({})
  const near = ref<Record<string, true>>({})

  const elements = new Map<string, Element>()
  const keyOf = new WeakMap<Element, string>()
  let revealObserver: IntersectionObserver | null = null
  let nearObserver: IntersectionObserver | null = null
  const unsupported = typeof IntersectionObserver === 'undefined'

  const onReveal = (entries: IntersectionObserverEntry[]) => {
    // Read in reading order, not in the order the observer happened to list
    // them — the stagger has to run down the page, and across it on a row.
    const entering = entries
      .filter((entry) => entry.isIntersecting)
      .sort(
        (a, b) =>
          a.boundingClientRect.top - b.boundingClientRect.top ||
          a.boundingClientRect.left - b.boundingClientRect.left,
      )
    if (!entering.length) return

    const next = { ...revealed.value }
    let order = 0
    for (const entry of entering) {
      const key = keyOf.get(entry.target)
      revealObserver?.unobserve(entry.target)
      if (key === undefined || key in next) continue
      next[key] = Math.min(order * step, cap)
      order += 1
    }
    revealed.value = next
  }

  const onNear = (entries: IntersectionObserverEntry[]) => {
    const next = { ...near.value }
    let changed = false
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      const key = keyOf.get(entry.target)
      nearObserver?.unobserve(entry.target)
      if (key === undefined || next[key]) continue
      next[key] = true
      changed = true
    }
    if (changed) near.value = next
  }

  const ensureObservers = () => {
    if (revealObserver || unsupported) return
    const init = showcaseRevealObserverInit()
    revealObserver = new IntersectionObserver(onReveal, init)
    nearObserver = new IntersectionObserver(onNear, {
      root: init.root,
      threshold: 0,
      // A screen ahead and behind: `%` resolves against the root, which is the
      // card's scroller — the window a guest actually sees.
      rootMargin: '100% 0px 100% 0px',
    })
  }

  /**
   * A function ref for `:ref`. Safe to call on every render: the same element
   * under the same key is a no-op, a new element is observed, and a detached
   * one is dropped.
   */
  const itemRef = (key: string) => (el: unknown) => {
    const element = el instanceof Element ? el : null
    const previous = elements.get(key)
    if (previous === element) return

    if (previous) {
      revealObserver?.unobserve(previous)
      nearObserver?.unobserve(previous)
      elements.delete(key)
    }
    if (!element) return

    elements.set(key, element)
    keyOf.set(element, key)

    if (unsupported) {
      // Nothing can tell us when it scrolls in, so it is simply there.
      if (!(key in revealed.value)) revealed.value = { ...revealed.value, [key]: 0 }
      if (!near.value[key]) near.value = { ...near.value, [key]: true }
      return
    }

    ensureObservers()
    if (!(key in revealed.value)) revealObserver?.observe(element)
    if (!near.value[key]) nearObserver?.observe(element)
  }

  onBeforeUnmount(() => {
    revealObserver?.disconnect()
    nearObserver?.disconnect()
    revealObserver = null
    nearObserver = null
    elements.clear()
  })

  return {
    itemRef,
    isRevealed: (key: string) => key in revealed.value,
    /** The item's stagger within its batch, in seconds. 0 until revealed. */
    delayOf: (key: string) => revealed.value[key] ?? 0,
    isNear: (key: string) => Boolean(near.value[key]) || key in revealed.value,
  }
}

/** True under `prefers-reduced-motion: reduce`. Read once per mount. */
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
