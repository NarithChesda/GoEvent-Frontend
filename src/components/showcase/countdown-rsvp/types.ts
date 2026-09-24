import type { EventPhoto } from '@/composables/useEventShowcase'

/** One figure of the count, already written the way the invitation sets it. */
export interface CountdownUnit {
  key: 'days' | 'hours' | 'minutes'
  /** `07`, or `០៧` in Khmer. */
  value: string
  /** `Days`, `ថ្ងៃ`, … in the event's language. */
  label: string
  /**
   * How full this unit's cycle is, 0–1: hours of a day, minutes of an hour.
   * Null for days, which have no cycle to be a share of.
   */
  share: number | null
}

/**
 * What every countdown design is handed. A design owns its composition and its
 * arrival and nothing else: it never reads a template colour (those arrive as
 * the section's `--crs-*` variables) or the event, and it is never told what
 * kind of event it is counting down to.
 */
export interface CountdownDesignProps {
  /** Days, hours, minutes — always all three, in that order. */
  units: CountdownUnit[]
  /** The section's eyebrow, for the designs that set one. */
  header: string
  /** Flips once, when the design first scrolls into view. */
  revealed: boolean
  /** The primary slot: figures. */
  displayFont: string
  /** The secondary slot: unit labels and the eyebrow. */
  textFont: string
  /** Khmer copy is never tracked or set in capitals, and needs taller leading. */
  khmer: boolean
  /** `strips` only: the photograph cut into strips. Null draws plain ink. */
  photo?: EventPhoto | null
  /**
   * `strips` only: the card's negative inline margins, so the band runs edge
   * to edge the way a photo band does. The other designs sit in the column.
   */
  bleedClass?: string
}

/**
 * What every RSVP shell is handed. The shell owns the surface and its arrival;
 * the form itself arrives in the default slot, already wrapped (and, on the
 * paper and page shells, already inked — see rsvp-ink.css). Colours arrive as
 * the section's `--crs-*` variables, including the reply card's own
 * `--crs-card-paper` / `--crs-card-ink`.
 */
export interface RsvpShellProps {
  /** Flips once, when the shell first scrolls into view. */
  revealed: boolean
  /** The reply card's mark — `R.S.V.P.` in the event's language. */
  mark: string
  textFont: string
  khmer: boolean
}
