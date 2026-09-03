/**
 * The contract between AgendaSection.vue (the shell) and an agenda design.
 *
 * The split follows the one save-the-date uses: **the design owns the
 * composition, the section owns the ground and the clock.** The section
 * resolves the header copy from the event category, groups the items by day,
 * draws the day tabs, holds the reveal gate and mounts the edit affordances;
 * a design receives one already-sorted day's items and decides only how that
 * list is drawn.
 *
 * That is why there is no `eventType` here, and no `eventTexts`: a design that
 * could read the category would be the very coupling this config replaced.
 */
export interface AgendaDesignItem {
  id: number
  title: string
  description?: string
  color?: string
  date?: string
  start_time_text?: string
  end_time_text?: string
  order?: number
  icon?: {
    id: number
    name: string
    svg_code: string
  }
}

export interface AgendaDesignProps {
  /** One day's activities, already sorted by `order`. */
  items: AgendaDesignItem[]
  primaryColor: string
  accentColor: string
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  currentLanguage?: string
  /**
   * Extra stagger applied to every item's reveal — the section's own header and
   * tab animations run first, and on the very first reveal the list waits for
   * them. Zero on a tab switch, where the chrome is already on screen.
   */
  isInitialReveal?: boolean
}
