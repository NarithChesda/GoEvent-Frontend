import { onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { isTouchPrimaryDevice } from '@/utils/browserDetection'

/**
 * Makes the *document* the thing the guest's finger scrolls, so mobile browsers
 * collapse their own chrome (URL bar / in-app-browser header) on the first swipe.
 *
 * The problem: browsers only hide that chrome in response to a scroll of the root
 * scroller. The V1 showcase is a fixed 100dvh stage whose content scrolls inside
 * the glass card, so the document's scroll height always equalled the viewport —
 * there was nothing to scroll, and the header stayed up no matter how the guest
 * swiped. (Hence having to find a dead spot on the page and drag it away by hand.)
 *
 * Rather than restructure the stage — the card, the pinned frame artwork and the
 * background all depend on that fixed layout — this inverts the plumbing:
 *
 *   1. A spacer element (rendered by the caller, teleported to <body>) gives the
 *      document exactly as much scrollable height as the card has overflow.
 *   2. The card's own scroller is switched to `overflow: hidden`, so the touch
 *      gesture falls through to the document instead of being consumed.
 *   3. Every document scroll is mirrored back into `scroller.scrollTop`.
 *
 * Net effect: pixel-identical rendering, but the browser now sees a real page
 * scroll and hides its chrome. Because the card still genuinely scrolls, the
 * IntersectionObserver reveal animations keep working against it unchanged.
 *
 * Only enabled for coarse pointers. Desktop has no collapsing chrome to win back,
 * so it keeps the original in-card scrolling untouched.
 */

/** Marks the document while the proxy owns scrolling; see main.css. */
const ACTIVE_CLASS = 'showcase-scroll-proxy-active'

export function useDocumentScrollProxy(scroller: Ref<HTMLElement | null>) {
  /** Height for the caller's spacer element; 0 means the proxy is off. */
  const proxyHeight = ref(0)
  const isActive = ref(false)

  let resizeObserver: ResizeObserver | null = null
  let pullFrame = 0

  /**
   * The two scroll ranges being mapped between. Returns null whenever either
   * side has nothing to scroll, which is also the "don't touch anything" signal.
   */
  const ranges = () => {
    const el = scroller.value
    if (!isActive.value || !el) return null
    const inner = el.scrollHeight - el.clientHeight
    const outer = document.documentElement.scrollHeight - window.innerHeight
    if (inner <= 0 || outer <= 0) return null
    return { el, inner, outer }
  }

  /**
   * Size the spacer so the document's scroll range matches the card's overflow —
   * a 1:1 mapping, so a swipe moves the invitation exactly as far as it used to.
   * `window.innerHeight` covers the viewport the document needs before it can
   * scroll at all; main.css zeroes #app's min-height so nothing else adds to it.
   */
  const measure = () => {
    const el = scroller.value
    if (!isActive.value || !el) {
      proxyHeight.value = 0
      return
    }
    const overflow = Math.max(0, el.scrollHeight - el.clientHeight)
    proxyHeight.value = overflow > 0 ? window.innerHeight + overflow : 0
  }

  /** Mirror the document's offset into the card. */
  const pull = () => {
    pullFrame = 0
    const r = ranges()
    if (!r) return
    r.el.scrollTop = (window.scrollY / r.outer) * r.inner
  }

  const onScroll = () => {
    if (!pullFrame) pullFrame = requestAnimationFrame(pull)
  }

  const onResize = () => {
    measure()
    // The spacer's new height only lands after Vue flushes it to the DOM.
    requestAnimationFrame(pull)
  }

  /**
   * Focusing an input inside an `overflow: hidden` box still lets the browser
   * scroll that box to reveal it — which would silently desync the two. Push the
   * document to wherever the card ended up instead of fighting it.
   */
  const onFocusIn = () => {
    requestAnimationFrame(() => {
      const r = ranges()
      if (!r) return
      const target = (r.el.scrollTop / r.inner) * r.outer
      if (Math.abs(target - window.scrollY) > 1) window.scrollTo({ top: target })
    })
  }

  /**
   * Drop-in replacement for `element.scrollIntoView()` for content inside the
   * card: with the proxy on, the card no longer responds to its own scrolling,
   * so the equivalent document offset has to be driven instead. Falls back to
   * the native call whenever the proxy is off (desktop, or nothing to scroll).
   */
  const scrollElementIntoView = (element: Element, block: 'center' | 'start' = 'center') => {
    const r = ranges()
    if (!r) {
      element.scrollIntoView({ behavior: 'smooth', block })
      return
    }
    const elementRect = element.getBoundingClientRect()
    const scrollerRect = r.el.getBoundingClientRect()
    let top = r.el.scrollTop + (elementRect.top - scrollerRect.top)
    if (block === 'center') top -= Math.max(0, (r.el.clientHeight - elementRect.height) / 2)
    top = Math.min(Math.max(top, 0), r.inner)
    window.scrollTo({ top: (top / r.inner) * r.outer, behavior: 'smooth' })
  }

  const teardown = () => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
    document.removeEventListener('focusin', onFocusIn)
    resizeObserver?.disconnect()
    resizeObserver = null
    if (pullFrame) cancelAnimationFrame(pullFrame)
    pullFrame = 0
    document.documentElement.classList.remove(ACTIVE_CLASS)
    proxyHeight.value = 0
    isActive.value = false
  }

  watch(
    scroller,
    (el) => {
      if (!el) {
        if (isActive.value) teardown()
        return
      }
      if (!isTouchPrimaryDevice()) return

      isActive.value = true
      document.documentElement.classList.add(ACTIVE_CLASS)

      // Content height moves constantly here — images decode, the language
      // switches, accordions open, and the viewport itself changes the moment
      // the browser chrome finally collapses. Re-measure on all of it.
      resizeObserver = new ResizeObserver(onResize)
      resizeObserver.observe(el)
      if (el.firstElementChild) resizeObserver.observe(el.firstElementChild)

      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onResize)
      document.addEventListener('focusin', onFocusIn)

      measure()
      // The invitation always opens at the top. Until now the document had no
      // scroll range at all, so a reload could leave a restored offset behind
      // that would suddenly become meaningful once the spacer lands.
      window.scrollTo({ top: 0 })
    },
    { immediate: true },
  )

  onBeforeUnmount(teardown)

  return { proxyHeight, isActive, scrollElementIntoView }
}
