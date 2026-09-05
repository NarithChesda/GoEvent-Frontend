/**
 * The one recipe both list controls' triggers are built from — the category
 * filter and the sort menu. They sit side by side and swap surfaces together,
 * so the classes live here rather than being written out twice and drifting.
 *
 * Built from the shared `lfc-*` tokens in src/assets/main.css, the same ones
 * the Events / Discover header controls use. That is not tidiness: both pages
 * teleport their controls into the *same* slot (`#nav-page-controls`, pinned to
 * the content column's right edge) with the same `absorb` transition, so any
 * difference in height or type shows as the bar's contents jumping when you
 * navigate between the two tabs.
 *
 * It did. This file previously sized the trigger with `min-h-[40px]`, a
 * Tailwind arbitrary *pixel* value, while `.lfc-chip` is `height: 2.5rem`. The
 * laptop scale-down in main.css drops the root font to 75% between 1200px and
 * 1599px wide, so on most laptops the Events chip computed to 30px and this one
 * stayed at 40px — a 10px step, in the same pixel position, plus a `text-base`
 * / `text-sm` type step. Anything sized here must stay in `rem` (or in a shared
 * token) for that reason.
 */

/**
 * Which surface the control is currently sitting on.
 *
 * `page` — in the listings heading row, on the page's own background.
 * `nav`  — in either bar: the mobile top bar, and the desktop top bar once it
 *          has absorbed the row.
 */
export type ListControlTone = 'page' | 'nav'

/**
 * Geometry and type, identical in both tones: the hand-off must not resize the
 * button. Height comes from `.lfc-chip`, press feedback and the transition it
 * needs from `.lfc-press` — which is also what makes the press a *scale* rather
 * than a colour change, and what turns it off under `prefers-reduced-motion`.
 *
 * Symmetric `px-3` rather than the Events chip's `pl-3 pr-2.5`: that asymmetry
 * pays for a trailing chevron, and neither of these two triggers has one.
 */
const SHAPE =
  'lfc-chip lfc-press flex items-center gap-2 px-3 rounded-full text-sm font-medium tracking-[-0.01em] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ecc71]/40'

/**
 * @param tone   Which surface the trigger is on.
 * @param active Whether the control is actually doing something — a category
 *               is filtering, or the order is no longer the default.
 */
export const listControlTriggerClass = (tone: ListControlTone, active: boolean) => {
  // Set: a filled brand tint, not green text. A control that only recolours its
  // own label is the weakest way to say "this list is narrowed", and it was the
  // one thing the Events chip was rebuilt to stop doing.
  if (active) return [SHAPE, 'lfc-chip--set text-slate-900']

  // Unset: a surface rather than a bare ghost button, so the control reads as
  // an object on the page. `--nav` is opaque on purpose — both bars are liquid
  // glass with the list running underneath, and a translucent control laid on
  // one takes its contrast from whatever happens to be scrolling past.
  return [
    SHAPE,
    tone === 'nav' ? 'lfc-surface--nav' : 'lfc-surface--page',
    'text-slate-600 hover:text-slate-900',
  ]
}
