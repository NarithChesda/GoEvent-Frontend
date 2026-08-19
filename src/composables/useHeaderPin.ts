import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useNavPageControls } from './useNavPageControls'

/**
 * Reports when the row the returned `sentinel` sits on has scrolled under the
 * app's fixed top bar — the moment a page's list controls hand themselves to
 * that bar instead of leaving with the row.
 *
 * The bar is *measured* rather than assumed. Which one is overhead depends on
 * the breakpoint (the desktop nav above 1024px, the mobile top bar below it),
 * and the mobile one is as tall as the device's safe-area inset makes it — a
 * hardcoded height put the hand-off a notch early on every phone with a notch.
 *
 * `PageHeaderRow` keeps its own, simpler version of this and does not use this
 * composable: below the nav breakpoint its row is already *inside* the bar, so
 * there is nothing to observe there and only the desktop nav's fixed 64px ever
 * matters. This one exists for a page whose controls live in the page at every
 * width — Services, whose header is the featured-vendor hero.
 */
const DESKTOP_BAR_FALLBACK = 64
const MOBILE_BAR_FALLBACK = 56

export function useHeaderPin() {
  const sentinel = ref<HTMLElement | null>(null)
  const isPinned = ref(false)

  const { isDesktopNav } = useNavPageControls()

  let observer: IntersectionObserver | null = null
  let observedOffset = -1

  /** The bottom edge of whichever bar is currently overhead, in viewport px. */
  const barOffset = () => {
    const bar = document.getElementById(
      isDesktopNav.value ? 'nav-page-controls' : 'mobile-page-header',
    )
    // A hidden bar measures 0 — the desktop nav is `display: none` on phones and
    // vice versa — so fall back to its design height rather than pinning at the
    // very top of the viewport.
    const bottom = bar?.getBoundingClientRect().bottom ?? 0
    return bottom > 0
      ? Math.round(bottom)
      : isDesktopNav.value
        ? DESKTOP_BAR_FALLBACK
        : MOBILE_BAR_FALLBACK
  }

  const observe = () => {
    observer?.disconnect()
    observer = null
    if (!sentinel.value) return

    const offset = barOffset()
    observedOffset = offset

    observer = new IntersectionObserver(
      ([entry]) => {
        // The root is shrunk by the bar's height, so the sentinel leaves it on
        // the frame the row's top edge passes underneath. Only pin when it has
        // gone *above* the viewport — scrolling past the list's end must not
        // re-trigger it from below.
        isPinned.value = !entry.isIntersecting && entry.boundingClientRect.top < offset
      },
      { rootMargin: `-${offset}px 0px 0px 0px`, threshold: 0 },
    )

    observer.observe(sentinel.value)
  }

  // `rootMargin` is fixed at construction, so a bar that changes height — a
  // rotation into a different safe-area inset, or crossing the nav breakpoint
  // into the other bar entirely — needs the observer rebuilt against the new one.
  const handleResize = () => {
    if (barOffset() !== observedOffset) observe()
  }

  watch(isDesktopNav, () => observe(), { flush: 'post' })

  onMounted(() => {
    observe()
    window.addEventListener('resize', handleResize, { passive: true })
  })

  onUnmounted(() => {
    observer?.disconnect()
    window.removeEventListener('resize', handleResize)
  })

  return { sentinel, isPinned }
}
