/**
 * The shared visual vocabulary of the templates modal — the browse grid, the
 * "Mine" panel and the partner template editor.
 *
 * These three surfaces are one modal, but they grew separately, and each had
 * invented its own answer to the same three questions: what does a primary
 * action look like, what does "this one is selected" look like, and what does a
 * text field look like. Between them they shipped four primary buttons (gradient
 * `rounded-xl`, gradient `rounded-lg`, gradient `rounded-full lg:rounded-xl`,
 * and a solid `bg-sky-500`), five selected-states (brand gradient fill,
 * `bg-slate-900` fill, white + `text-sky-700`, gradient tint + sky ring, and
 * `bg-sky-500` fill) and two input recipes at three different heights.
 *
 * Rather than restate the winning recipe at ~40 call sites, each one is named
 * once here. The rules the names encode:
 *
 * SELECTION HAS EXACTLY THREE FORMS, and each means one thing:
 *   1. Brand gradient fill — reserved for the active segment of a *view
 *      switcher* (Browse/Mine, Edit/Preview, which stage the preview shows) and
 *      for the primary commitment button. Gradient means "you are here" or
 *      "this is the action"; spending it on ordinary options is what made the
 *      modal read as five competing UIs.
 *   2. `OPTION_SELECTED` — gradient tint + sky ring. One chosen option among
 *      visible alternatives: a package plan, a radio card, a rail section, a
 *      sidebar filter, a cover block chip.
 *   3. `OPTION_IDLE` — white + slate ring. Everything not chosen.
 *
 * RADIUS IS PICKED BY SIZE, NOT BY MOOD (§3): `rounded-lg` inputs / small
 * buttons / chips, `rounded-xl` large buttons and option cards, `rounded-2xl`
 * section panels, `rounded-full` pills and icon buttons. A button does not
 * change shape at a breakpoint.
 *
 * MOTION IS SHORT AND NAMED. Hover and press feedback run at 150–200ms on
 * listed properties — never `transition-all`, never 300ms, which is drawer
 * territory and reads as lag on a button. Every pressable surface answers the
 * press with `active:scale-[0.97]`.
 */

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

const BTN_BASE =
  'inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-[background-color,box-shadow,transform,color] duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.97] disabled:active:scale-100'

/** The one commitment action on a surface: Use template, Save, Create. */
export const BTN_PRIMARY = `${BTN_BASE} px-5 py-2.5 rounded-xl text-sm bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-md shadow-sky-500/25 hover:from-[#27ae60] hover:to-[#1873cc] hover:shadow-lg hover:shadow-sky-500/35`

/** Same commitment, inline in a form row (Add colour, Add font). Was `bg-sky-500`. */
export const BTN_PRIMARY_SM = `${BTN_BASE} px-3.5 py-2 rounded-lg text-sm bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-sm shadow-sky-500/25 hover:from-[#27ae60] hover:to-[#1873cc]`

/**
 * The bar form of the same two buttons.
 *
 * BARS GET PILLS; PANELS GET SLABS. A bar is a full-width strip of chrome at
 * the edge of the modal — the header row, the browse footer, the editor's
 * mobile save bar. Everything already living in one is `rounded-full`: the
 * Browse/Mine switch, the search field, the close button, the status chips,
 * the footer's little emerald check disc. `BTN_PRIMARY` dropped a `rounded-xl`
 * slab with a coloured halo into the middle of that, which is why "New
 * Template", "Save Changes" and "Use template" read as pasted in from
 * somewhere else — not the gradient (that is the brand's primary-action
 * language and it stays), but the shape and the glow.
 *
 * So the bar variants are the strip's shape at the strip's height, with the
 * halo dialled back to a shadow that sits the button *on* the surface instead
 * of floating it above one — in a flat white bar there is nothing for a
 * `shadow-md` glow to float above, which is what made it look like it belonged
 * to another layer. Hover still lifts to `shadow-md`, so the rest/hover/press
 * ladder survives.
 *
 * `BTN_PRIMARY` stays for a CTA centred in a panel (the empty state), where
 * there is no surrounding strip to agree with and the slab is right.
 *
 * Written out rather than composed as `BTN_PRIMARY + overrides`:
 * `rounded-full` vs `rounded-xl` and `text-sm` vs `text-[13px]` are
 * conflicting utilities, and those resolve by stylesheet order, not by the
 * order they appear in a class list.
 */
export const BTN_PRIMARY_BAR = `${BTN_BASE} h-10 px-4 rounded-full text-[0.8125rem] bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-sm shadow-sky-500/20 hover:from-[#27ae60] hover:to-[#1873cc] hover:shadow-md hover:shadow-sky-500/25`

/** Its neutral partner — Cancel beside Save in the same row. */
export const BTN_GHOST_BAR = `${BTN_BASE} h-10 px-4 rounded-full text-[0.8125rem] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900`

/** Neutral action that still needs an edge: Cancel in a dialog, Clear filters. */
export const BTN_SECONDARY = `${BTN_BASE} px-4 py-2 rounded-xl text-sm font-medium bg-white text-slate-700 ring-1 ring-slate-200 shadow-sm hover:bg-slate-50 hover:ring-slate-300`

export const BTN_SECONDARY_SM = `${BTN_BASE} px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300`

/** Dismissals that should not compete with the action beside them. */
export const BTN_GHOST = `${BTN_BASE} px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900`

export const BTN_GHOST_SM = `${BTN_BASE} px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700`

export const BTN_DANGER = `${BTN_BASE} px-4 py-2 rounded-xl text-sm bg-red-500 text-white shadow-md shadow-red-500/25 hover:bg-red-600`

/** Round icon button — close, back, expand. One size, one fill, everywhere. */
export const BTN_ICON =
  'inline-flex items-center justify-center flex-shrink-0 w-9 h-9 rounded-full bg-slate-100 text-slate-500 transition-[background-color,color,transform] duration-200 ease-out hover:bg-slate-200 hover:text-slate-700 active:scale-[0.94] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500'

/** Small edit/delete affordance inside a row. Hover colour comes from the caller. */
export const BTN_ICON_MICRO =
  'inline-flex items-center justify-center flex-shrink-0 p-1.5 rounded-lg text-slate-400 transition-[background-color,color,transform] duration-200 ease-out active:scale-[0.94] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500'

// ---------------------------------------------------------------------------
// Selection (see the three forms above)
// ---------------------------------------------------------------------------

/** A chosen option among visible alternatives. */
export const OPTION_SELECTED =
  'bg-gradient-to-br from-[#2ecc71]/10 to-[#1e90ff]/10 ring-sky-300 text-slate-900 shadow-sm'

export const OPTION_IDLE =
  'bg-white ring-slate-200 text-slate-600 hover:ring-slate-300 hover:bg-slate-50 hover:text-slate-900'

/** Shared frame for an option card / radio card / rail item. */
export const OPTION_BASE =
  'ring-1 transition-[background-color,box-shadow,color] duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1'

/** Pill-shaped variant of the same idea (cover block chips, filter chips). */
export const CHIP_BASE = `${OPTION_BASE} px-3 py-1.5 rounded-full text-xs font-medium active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100`

/** Icon accent inside a selected vs idle option. */
export const OPTION_ICON_SELECTED = 'text-[#1e90ff]'
export const OPTION_ICON_IDLE = 'text-slate-400'

export const optionClass = (selected: boolean): string =>
  `${OPTION_BASE} ${selected ? OPTION_SELECTED : OPTION_IDLE}`

export const optionIconClass = (selected: boolean): string =>
  selected ? OPTION_ICON_SELECTED : OPTION_ICON_IDLE

// ---------------------------------------------------------------------------
// Fields
// ---------------------------------------------------------------------------

/** The one text-field recipe. Filled at rest, white and ringed on focus. */
export const FIELD =
  'w-full px-3 py-2 bg-slate-100 border border-transparent rounded-lg text-sm text-slate-800 transition-[background-color,border-color,box-shadow] duration-200 ease-out placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-sky-300 focus:ring-4 focus:ring-sky-100 disabled:opacity-60 disabled:cursor-not-allowed'

/** Same field, compact — grid cells inside a card (weights, sizes). */
export const FIELD_SM =
  'w-full px-2 py-1.5 bg-slate-100 border border-transparent rounded-lg text-sm text-slate-800 transition-[background-color,border-color,box-shadow] duration-200 ease-out placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-sky-300 focus:ring-4 focus:ring-sky-100'

/**
 * The numeric box beside a slider. Spelled out rather than composed from
 * `FIELD_SM` + overrides: it needs a smaller type size, and two conflicting
 * Tailwind font-size utilities on one element resolve by stylesheet order, not
 * by the order they're written in the class list.
 */
export const FIELD_NUM =
  'w-16 px-2 py-1 text-right text-xs font-semibold text-slate-700 tabular-nums bg-slate-100 border border-transparent rounded-lg transition-[background-color,border-color,box-shadow] duration-200 ease-out focus:outline-none focus:bg-white focus:border-sky-300 focus:ring-4 focus:ring-sky-100'

/** Field label. Denser than §8's page-form label — this is an editor, not a page. */
export const FIELD_LABEL = 'block text-xs font-medium text-slate-600'

/** Uppercase micro-heading above a group of fields (§2). */
export const SECTION_HEADING = 'text-xs font-semibold text-slate-500 uppercase tracking-wider'

/** Explanatory line under a field or section. */
export const FIELD_HINT = 'text-[0.6875rem] leading-snug text-slate-400'

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

/** A section panel inside the editor. */
export const PANEL = 'bg-white rounded-2xl ring-1 ring-slate-200/80'

/** Status / count chip. Colour comes from the caller. */
export const STAT_CHIP =
  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium'

/** Dashed "add another" pill (§7). */
export const BTN_ADD_DASHED =
  'inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 border border-dashed border-slate-300 rounded-full transition-[background-color,border-color,color,transform] duration-200 ease-out hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-300 disabled:hover:text-slate-600 disabled:hover:bg-transparent disabled:active:scale-100'
