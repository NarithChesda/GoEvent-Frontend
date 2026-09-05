/** Default color for a newly created guest group. */
export const DEFAULT_GUEST_GROUP_COLOR = '#3498db'

/**
 * The colors offered when naming a group.
 *
 * A guest group's color is a *label*, not a design decision — it is read at
 * 6px as a dot beside a name, in a list where a dozen of them sit under each
 * other. So the choice is a small set that stays distinguishable at that size
 * rather than a free-form picker: eight hues spaced around the wheel, none of
 * them so pale that the dot disappears on white.
 *
 * The default is included so the swatch row always opens with one selected,
 * and an off-palette color (a group created before this, or through the custom
 * picker) is prepended rather than silently dropped — see `resolvePalette`.
 */
export const GUEST_GROUP_PALETTE = [
  DEFAULT_GUEST_GROUP_COLOR, // the long-standing default blue
  '#e11d48', // rose
  '#f59e0b', // amber
  '#10b981', // emerald
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#64748b', // slate
] as const

/** Hex comparison that ignores case, so `#E11D48` still lights its swatch. */
const sameColor = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

/**
 * The palette to draw for a given current color: the presets, with that color
 * prepended when it is not one of them. Editing a group whose color came from
 * anywhere else must not quietly change it just because the form re-rendered.
 */
export const resolvePalette = (current: string): string[] =>
  GUEST_GROUP_PALETTE.some((preset) => sameColor(preset, current))
    ? [...GUEST_GROUP_PALETTE]
    : [current, ...GUEST_GROUP_PALETTE]

export const isSameColor = sameColor
