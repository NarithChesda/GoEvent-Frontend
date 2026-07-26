import { getCurrentInstance, onUnmounted, ref, type Ref } from 'vue'

/**
 * Reactive `window.matchMedia`.
 *
 * Preferred over an ad-hoc `resize` listener + `window.innerWidth` compare:
 * `resize` fires on every mobile URL-bar collapse (and on every keyboard
 * open/close), so width-derived state recomputes far more often than it
 * changes, and any layout measured in the same handler visibly jumps. A
 * MediaQueryList only notifies when the boundary is actually crossed.
 */
export function useMediaQuery(query: string): Ref<boolean> {
  const matches = ref(false)
  if (typeof window === 'undefined' || !window.matchMedia) return matches

  const list = window.matchMedia(query)
  matches.value = list.matches

  const onChange = (event: MediaQueryListEvent) => {
    matches.value = event.matches
  }
  list.addEventListener('change', onChange)

  // Usable outside a component (module scope) too — there's just nothing to
  // hook the teardown onto there.
  if (getCurrentInstance()) {
    onUnmounted(() => list.removeEventListener('change', onChange))
  }

  return matches
}
