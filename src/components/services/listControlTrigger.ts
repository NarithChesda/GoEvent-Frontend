/**
 * The one recipe both list controls' triggers are built from — the category
 * filter and the sort menu. They sit side by side and swap surfaces together,
 * so the classes live here rather than being written out twice and drifting.
 */

/**
 * Which surface the control is currently sitting on.
 *
 * `page` — in the listings heading row, on the page's own background.
 * `nav`  — absorbed into the desktop top bar once that row scrolls under it.
 */
export type ListControlTone = 'page' | 'nav'

/** Geometry, identical in both tones: the hand-off must not resize the button. */
const SHAPE =
  'flex items-center gap-2 px-3 py-2 min-h-[40px] rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200'

/**
 * @param tone   Which surface the trigger is on.
 * @param active Whether the control is actually doing something — a category
 *               is filtering, or the order is no longer the default.
 */
export const listControlTriggerClass = (tone: ListControlTone, active: boolean) => {
  if (tone === 'nav') {
    // In the bar the control's neighbours are the Events / Discover / Services
    // links, so it wears their text size and weight and their contrast step:
    // slate-700 at rest, slate-900 once it carries a value. Deliberately *not*
    // the links' slate-400 resting grey — a nav link that faint is still
    // readable because the word never changes, but these two carry the current
    // category and order, which are the things a visitor comes back to the bar
    // to read. So they sit at one flat legible weight with no hover step; the
    // brand-green tint and the hover pill stay behind on the page row, where
    // they read as a control rather than as chrome.
    return [SHAPE, 'text-base font-medium', active ? 'text-slate-900' : 'text-slate-700']
  }

  // On the page: a compact ghost button, tinted brand green once it is actually
  // filtering or re-ordering the list below it.
  return [
    SHAPE,
    'text-sm',
    active
      ? 'text-[#2ecc71] font-medium hover:bg-[#2ecc71]/10'
      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
  ]
}
