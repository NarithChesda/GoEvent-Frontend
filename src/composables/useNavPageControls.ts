import { computed, readonly, ref } from 'vue'

/**
 * The channel between a list page's header row and the app's fixed bars.
 *
 * `isDesktopNav` — which navigation the page is dressing for, and with it where
 * the header row physically lives. Below 1024px `PageHeaderRow` teleports
 * itself into the mobile top bar and *is* the bar's contents; at and above it
 * the row sits in the page and the desktop nav absorbs only its controls on
 * scroll. Anything that has to look right in both places reads this rather than
 * carrying a prop down from the view.
 *
 * `pinned` — the page's own header row has scrolled under the bar overhead. On
 * pages built from `PageHeaderRow` (Events, Discover) this is only ever true on
 * desktop: below the nav breakpoint that row is already inside the mobile bar,
 * so there is nothing to hand up and nothing to observe. Services has no such
 * row — the featured-vendor hero is its header — so its list heading sits in
 * the page at every width and raises this on mobile too, where the mobile top
 * bar is the one that absorbs the controls.
 *
 * `absorbed` — narrower than `pinned`: true only while the *desktop nav* is
 * holding a page's filters. The nav reads it to yield space — the clock and the
 * Create Event shortcut step aside while the filters are up there. That room is
 * what lets the absorbed controls keep their full size and sit at the content
 * column's right edge, the exact spot the page header had them; without it they
 * would run into the right-hand utility cluster on anything but a very wide
 * desktop. Kept separate because `pinned` is also raised for a hand-off to the
 * mobile bar, which the desktop nav has no stake in, and because a page can pin
 * a header that has no filters to hand up at all — the nav must keep its
 * shortcuts for that one.
 */
const DESKTOP_NAV_QUERY = '(min-width: 1024px)'

const pinned = ref(false)
const absorbed = ref(false)
// Defaults to the desktop layout so that an environment without matchMedia
// (unit tests under jsdom) renders the header in the page rather than into a
// teleport target that isn't there.
const isDesktopNav = ref(true)

let desktopQuery: MediaQueryList | null = null

/**
 * One listener for the whole app, attached on first use and never removed —
 * the breakpoint outlives every page that reads it.
 */
const watchBreakpoint = () => {
  if (desktopQuery || typeof window === 'undefined' || !window.matchMedia) return
  desktopQuery = window.matchMedia(DESKTOP_NAV_QUERY)
  isDesktopNav.value = desktopQuery.matches
  desktopQuery.addEventListener('change', (event) => {
    isDesktopNav.value = event.matches
  })
}

export function useNavPageControls() {
  watchBreakpoint()

  const setPinned = (value: boolean) => {
    pinned.value = value
  }

  const setAbsorbed = (value: boolean) => {
    absorbed.value = value
  }

  return {
    isDesktopNav: readonly(isDesktopNav),
    pinned: readonly(pinned),
    absorbed: readonly(absorbed),
    setPinned,
    setAbsorbed,
  }
}

/**
 * The palette a header control should wear where it currently sits. Below the
 * nav breakpoint the page header row is inside the top bar, so a control that
 * asks for no particular tone still has to drop its glass card — otherwise it
 * reads as a card floating on the bar instead of part of the chrome.
 */
export function useHeaderTone(explicit?: () => 'page' | 'nav' | undefined) {
  watchBreakpoint()
  return computed<'page' | 'nav'>(() => explicit?.() ?? (isDesktopNav.value ? 'page' : 'nav'))
}
