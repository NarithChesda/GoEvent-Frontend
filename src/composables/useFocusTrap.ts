import type { Ref } from 'vue'

/**
 * Keeps Tab inside an overlay.
 *
 * Without it the user tabs straight out of a drawer into the page behind the
 * backdrop — which they can neither see nor click, so focus simply disappears
 * and the only way back is a mouse.
 *
 * Deliberately not a self-registering listener. Every drawer already owns a
 * `keydown` handler for Escape, and the order those two keys resolve in is a
 * per-drawer decision (a disclosed calendar, a stacked confirm modal); a
 * composable that added its own listener would race that one. Call `trapFocus`
 * from the handler you already have.
 */

/**
 * `:not([tabindex="-1"])` on every clause, not just the last.
 *
 * The original selector took `button:not([disabled])` on its own, which matches
 * the time wheel's option cells — 36 buttons that are deliberately *not*
 * tabbable. They then counted towards `first`/`last`, so the wrap could be
 * computed against an element Tab never visits and focus would escape at the
 * end of the list. Anything holding `tabindex="-1"` is reachable by script and
 * by pointer, never by Tab, so it must not appear here.
 */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable="true"]',
  '[tabindex]',
]
  .map((selector) => `${selector}:not([tabindex="-1"])`)
  .join(', ')

export function useFocusTrap(container: Ref<HTMLElement | undefined>) {
  /** Pass the `keydown` event; only acts on Tab. */
  const trapFocus = (event: KeyboardEvent) => {
    const root = container.value
    if (!root) return

    const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null,
    )
    if (!items.length) return

    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement as HTMLElement | null

    // Shift-Tab off the front wraps to the back; so does a Tab arriving while
    // focus sits outside the overlay entirely (the browser puts it on <body>
    // after the element it was on unmounted).
    if (event.shiftKey && (active === first || !root.contains(active))) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && (active === last || !root.contains(active))) {
      event.preventDefault()
      first.focus()
    }
  }

  return { trapFocus }
}
