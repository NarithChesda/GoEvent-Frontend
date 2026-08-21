/**
 * The chrome shared by every settings form.
 *
 * `AccountTab` established this arrangement — a section card split into a label
 * rail and a field column — and kept the strings in local constants so a card or
 * an input could not drift between copies inside one file. They live here now
 * because the same drift was happening *between* files: the vendor form had
 * restated the input recipe fourteen times in its own dialect, and the two tabs
 * of the same settings page no longer looked like one product.
 *
 * Everything here is a literal from `goevent-design` (§7 cards, §8 forms) — this
 * module is a single source for those recipes, not a second opinion on them.
 */

/** Section card. One per group of related fields; see `paneClass` for the split. */
export const sectionCardClass = 'rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-6'

/**
 * The rail/field split inside a section card. Below `lg` the rail simply stacks
 * above its fields, which is why the settings column can run to `max-w-5xl`
 * without stretching a lone input across a desktop.
 */
export const paneClass = 'grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10'
export const paneTitleClass = 'text-sm font-semibold text-slate-900'
export const paneHintClass = 'mt-1 text-xs text-slate-500 leading-relaxed'

const FIELD_BASE =
  'w-full py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-lg transition-colors duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400'

/** Text/email/tel/url inputs and textareas. */
export const fieldClass = `${FIELD_BASE} pl-3.5 pr-3.5`
/** Same field with room for a leading affordance (the `@` on a username). */
export const prefixedFieldClass = `${FIELD_BASE} pl-8 pr-3.5`
/**
 * Same field with room for a trailing control inside it — the eye that reveals
 * a password. The gutter is sized for a 40px tap target (`w-10`) plus the
 * inset it is nudged off the border by, so the button never sits on the text.
 */
export const trailingActionFieldClass = `${FIELD_BASE} pl-3.5 pr-11`

/**
 * Added to a field class when that field failed validation, and the line that
 * says why. `goevent-design` §8: the border reddens and the ring follows it, so
 * a focused invalid field still reads as invalid rather than reverting to sky.
 */
export const fieldErrorClass = 'border-red-300 focus:ring-red-200 focus:border-red-400'
export const fieldErrorTextClass = 'mt-1.5 text-xs text-red-600'

/** Labels go above the input, always — never a placeholder standing in for one. */
export const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5'
/** Helper text and character counts, below the input they belong to. */
export const fieldHintClass = 'mt-1.5 text-xs text-slate-500'

/**
 * The labelled neutral action beside an image — "Change photo", "Replace logo".
 * Never the primary action on the page, so it stays off the brand gradient.
 */
export const imageActionClass =
  'inline-flex flex-shrink-0 items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg transition-colors duration-200 hover:bg-slate-200 active:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200'

/**
 * The icon-only destructive twin of `imageActionClass`, sitting beside it and
 * clearing the artwork rather than replacing it. Only rendered when there is
 * something to clear, so it has no empty state of its own; the red arrives on
 * hover, because a settings form should not read as dangerous at rest. Sized to
 * a 40px tap target and given the app's one focus ring — the button is
 * destructive, focus is not.
 */
export const imageRemoveClass =
  'inline-flex flex-shrink-0 items-center justify-center w-10 h-10 min-h-[40px] text-slate-400 rounded-lg transition-colors duration-200 hover:text-red-600 hover:bg-red-50 active:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200'

/**
 * The disc that sits on the corner of an image and opens the file picker. Add
 * the positioning at the call site — the offset depends on the image's shape.
 */
export const imageActionDiscClass =
  'flex items-center justify-center w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-600 shadow-sm transition-all duration-200 hover:text-[#1e90ff] hover:border-sky-300 hover:shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200'

/** The empty frame an image drops into, before there is an image. */
export const imagePlaceholderClass =
  'flex items-center justify-center bg-slate-50 border border-dashed border-slate-300 text-slate-300'
