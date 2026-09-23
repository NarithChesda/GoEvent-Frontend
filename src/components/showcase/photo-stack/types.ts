import type { EventPhoto } from '@/types/showcase'

/**
 * What TransitionStageStack hands every layout. The stage owns the clock, the
 * table, the Save the Date and the hand-off to the invitation; a layout owns
 * only its composition — where the photographs sit, how each one arrives, and
 * where the copy goes (the stage passes it in as the `copy` slot).
 *
 * The flags only ever go false → true within one run (a replay remounts the
 * layout), so a layout can express every beat as a CSS transition keyed off a
 * class and never needs a watcher.
 */
export interface StackLayoutProps {
  /** The photographs, in the order they are revealed. */
  photos: EventPhoto[]
  /** How many have been revealed so far. */
  shown: number
  /** The stage has begun: the table is coming in, and any object the layout
   *  brings on (the booth's card, the film strip) arrives with it. */
  entered: boolean
  /** The closing beat: every photograph is out and the composition gathers
   *  itself around the copy. */
  closed: boolean
  /** The stage is dissolving into the invitation behind it. */
  dissolving: boolean
  eventTitle: string
  /** The template's accent, `#rrggbb` — for the few marks a layout draws itself. */
  accentColor: string
  /** The table's wash (the template's blur-effect colour), `#rrggbb` — for a
   *  layout that lays a band of it under the copy. */
  washColor: string
  getMediaUrl: (url: string) => string
}
