import { readonly, ref } from 'vue'

/**
 * Shared flag between a list page's `PinnedListControls` and the top nav: true
 * while the page has handed its filters up to the bar.
 *
 * The nav reads it to yield space — the clock and the Create Event shortcut
 * step aside while the filters are up there. That room is what lets the
 * absorbed controls keep their full size and sit at the content column's right
 * edge, the exact spot the page header had them; without it they would run
 * into the right-hand utility cluster on anything but a very wide desktop.
 */
const absorbed = ref(false)

export function useNavPageControls() {
  const setAbsorbed = (value: boolean) => {
    absorbed.value = value
  }

  return {
    absorbed: readonly(absorbed),
    setAbsorbed,
  }
}
