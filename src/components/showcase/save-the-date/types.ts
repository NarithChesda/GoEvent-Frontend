import type { SaveTheDateDesignType } from '@/services/api/types/template.types'

/**
 * The event date pre-broken into the pieces the designs set separately. Built
 * once in SaveTheDate.vue so six components don't each re-derive it — and so
 * the two transition stages, which used to format their own dates with subtly
 * different code, now agree by construction.
 */
export interface SaveTheDateParts {
  /** Zero-padded day of month, e.g. `06`. */
  day: string
  /** Zero-padded month number, e.g. `12`. */
  month: string
  /** Abbreviated month, uppercase, e.g. `DEC`. */
  monthShort: string
  /** Full month name, e.g. `December`. */
  monthLong: string
  /** Four-digit year. */
  year: string
  /** Full weekday name, e.g. `Saturday`. */
  weekday: string
}

/**
 * What every design component receives — identical across all six, so the
 * dispatcher can hand them straight through with `v-bind="$props"` the way
 * HostInfo.vue does with its layout variants.
 *
 * Colour arrives twice on purpose: as CSS custom properties on the block's root
 * (which the stylesheets read) and as the two plain strings below (which the
 * SVG drawings need, since `stroke` can't fall back through a var chain the way
 * a `color` can).
 */
export interface SaveTheDateDesignProps {
  /** Flips the block's `is-revealed` class, which is what arms every beat. */
  revealed: boolean
  /** The label copy — 'Save the Date'. */
  label: string
  /** Long form, e.g. `Saturday, December 6, 2026`. */
  longDate: string | null
  /** The cartouche form, e.g. `06 · 12 · 2026`. */
  numericDate: string | null
  /** Split form, for the designs that set the pieces separately. */
  parts: SaveTheDateParts | null
  /** Which fill the host stage's ground calls for. See save-the-date-base.css. */
  ink: 'solid' | 'metal'
  /** The ink colour as a plain string, for SVG strokes. */
  inkColor: string
  /** The specular hotspot as a plain string, for SVG fills. */
  hotColor: string
}

export type { SaveTheDateDesignType }
