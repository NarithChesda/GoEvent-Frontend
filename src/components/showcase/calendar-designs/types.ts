import type { CalendarDesignModel } from './calendarModel'

/**
 * What EventInfo hands every calendar style. The style owns the composition
 * and its arrival; the card around it (its bounce-in, the `em` scale ladder of
 * `.details-design`, the `--details-marker-color` slot, the edit region) is
 * EventInfo's, as it is for the flanked / arch / ticket designs.
 */
export interface CalendarStyleProps {
  model: CalendarDesignModel
  /** The info block has scrolled into view — every beat keys off this. */
  active: boolean
  /** Seconds after which the card has landed; each beat is offset from it. */
  t0: number
  /** The template's display face (primary slot), for headings and numerals. */
  displayFont: string
  /** The template's text face (secondary slot), for labels and small numbers. */
  textFont: string
  /** Ink for anything drawn ON the marker colour. */
  markerInk: string
  /** Metallic-finish classes for the display numeral, when the slot has one. */
  finishClass?: string[]
  khmer?: boolean
  /** The `card` style's corner radius, in px. Ignored by the others. */
  cardRadius?: number
  /** The `card` style's paper colour. Ignored by the others. */
  cardColor?: string
  /** The ink the `card` style prints in, readable on `cardColor`. */
  cardInk?: string
  /** Whether `cardColor` is light or dark — sets the shadow's depth. */
  paperTone?: 'light' | 'dark'
}
