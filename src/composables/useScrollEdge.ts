import { onMounted, onUnmounted, ref, type Ref } from 'vue'

/**
 * Scroll-edge progress for translucent chrome pinned to the top of the viewport.
 *
 * Apple's toolbars do not flip a "scrolled" flag — the material *materialises*
 * across the first few dozen pixels of scroll, so the bar tracks the wheel or
 * the finger the whole way and reversing the scroll reverses the effect on the
 * same frame. A boolean at `scrollY > 0` instead lands the entire material —
 * the white sheet, the saturation boost, the edge falloff — in one 200ms tween
 * fired by a single pixel of movement, and cannot be reversed until that tween
 * has finished. That is the pop the old `transition: backdrop-filter` was
 * scheduling around rather than removing.
 *
 * The progress is written straight onto the element as `--nav-edge` instead of
 * being returned as reactive state: it changes every frame the page is moving,
 * and a ref would put a component re-render behind each one. The stylesheet
 * then interpolates nothing at all — every value that varies is `calc()`ed off
 * the one custom property.
 *
 * `scrolled` is the coarse companion for the things that genuinely are binary
 * (an `aria` hint, a high-contrast hairline); it flips once, so reactivity is
 * the right tool for it.
 */
export function useScrollEdge(target: Ref<HTMLElement | undefined | null>, distance = 56) {
  const scrolled = ref(false)
  let frame = 0

  const apply = () => {
    frame = 0
    const y = typeof window === 'undefined' ? 0 : window.scrollY
    const progress = Math.min(1, Math.max(0, y / distance))
    target.value?.style.setProperty('--nav-edge', progress.toFixed(3))
    scrolled.value = y > 0
  }

  // Coalesced onto the frame: a scroll event can fire several times between
  // paints, and the only thing this does is write a style the paint will read.
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(apply)
  }

  onMounted(() => {
    // Passive: this listener never calls `preventDefault`, and without the flag
    // the browser has to wait for it before it may scroll the page.
    window.addEventListener('scroll', onScroll, { passive: true })
    apply() // a restored scroll position must not start the bar clear
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
    if (frame) cancelAnimationFrame(frame)
  })

  return { scrolled }
}
