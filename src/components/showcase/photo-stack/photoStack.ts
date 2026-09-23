import type { EventPhoto } from '@/types/showcase'
import type { StackLayoutType } from '@/services/api/types/template.types'
import { cropCentre, resolvePhotoCrop, type PhotoCropFields } from '@/utils/photoCrop'
import {
  BOOTH_CAPACITY,
  FILM_CAPACITY,
  MOSAIC_CAPACITY,
  PILE_CAPACITY,
  SPLIT_CAPACITY,
} from './geometry'

/**
 * The photo-stack transition (`showcaseAnimationType: 'stack'`): the event's
 * photographs revealed one at a time, then gathered into a composition the Save
 * the Date is written into. How they are gathered is the template's
 * `cover_stage_layout.stackLayout`:
 *
 * - `pile`   — instant-film prints dealt onto a pile, which spreads as the
 *              camera pulls back. The default.
 * - `split`  — four panels cut on a slanted seam, wiping open one by one, with
 *              the copy in a band across the middle.
 * - `booth`  — a photo-booth strip: three frames, each flashing into its window,
 *              the copy at the foot of the card.
 * - `mosaic` — two staggered columns of rounded tiles surfacing out of the dark,
 *              then pulled back into a keepsake card.
 * - `film`   — a taped strip of film whose frames develop in turn.
 *
 * Everything here is data — which photographs, how many each layout holds, and
 * when each beat happens — so the stage only draws it and the view can warm
 * exactly the photographs the stage will ask for.
 */
export type { StackLayoutType }

export const STACK_LAYOUT_TYPES: readonly StackLayoutType[] = ['pile', 'split', 'booth', 'mosaic', 'film']

/**
 * Absent, null or unknown all mean `pile`, the layout the transition shipped
 * with — the value is backend-served, and a template saved against a newer
 * option set must still render rather than blank the middle of the showcase.
 */
export const resolveStackLayout = (value: unknown): StackLayoutType =>
  STACK_LAYOUT_TYPES.includes(value as StackLayoutType) ? (value as StackLayoutType) : 'pile'

/**
 * One layout's clock, from the tap (the stage mounts on the tap, so its clock
 * and the cover's exit clock are one).
 */
interface ClockSpec {
  /** When the first photograph is revealed. */
  first: number
  /** The gap after each reveal before the next; the last entry repeats. */
  gaps: readonly number[]
  /** From the last reveal to the closing beat. */
  hold: number
  /** From the closing beat to the Save the Date. */
  copyAfterClose: number
}

interface LayoutSpec {
  /** How many photographs the composition holds. */
  capacity: number
  clock: ClockSpec
  /**
   * What the Save the Date is written on, which decides its halo: the stage's
   * wash of the template's blur-effect colour, or the white of a printed card.
   */
  copyGround: 'wash' | 'paper'
}

/**
 * Why each clock is what it is:
 *
 * - `pile` deals its first print on the fifth beat of the cover's ornament
 *   stagger (they start at 100–400ms and take 0.8s, so a print starting at
 *   400ms lands with the last of them). The gaps close as the pile grows — the
 *   montage gathers pace — but never below ~0.8s, about the least a photograph
 *   needs to be recognised rather than glimpsed. The copy waits 700ms into the
 *   pull-back, because it is laid out where the spread ENDS, inside the
 *   full-size pile's foot, and the spread's ease-in-out barely moves at first.
 * - `split` wipes its first panel on the same beat. Each wipe takes 1.2s, so the
 *   hold lets the last one finish before the band clears and the copy starts.
 * - `booth` and `film` first bring on their object — the card, the strip —
 *   which lands by ~1.2s; their first photograph waits for it.
 * - `mosaic` holds six, so it runs its gaps shorter to land in the same ~10s as
 *   the others, and waits for its pull-back before the copy for the pile's
 *   reason.
 */
const STACK_LAYOUTS: Readonly<Record<StackLayoutType, LayoutSpec>> = {
  pile: {
    capacity: PILE_CAPACITY,
    clock: { first: 400, gaps: [1100, 950, 850, 800], hold: 900, copyAfterClose: 700 },
    copyGround: 'wash',
  },
  split: {
    capacity: SPLIT_CAPACITY,
    clock: { first: 400, gaps: [1000, 900, 850], hold: 1300, copyAfterClose: 0 },
    copyGround: 'wash',
  },
  booth: {
    capacity: BOOTH_CAPACITY,
    clock: { first: 1250, gaps: [1050, 950], hold: 1100, copyAfterClose: 0 },
    copyGround: 'paper',
  },
  mosaic: {
    capacity: MOSAIC_CAPACITY,
    clock: { first: 500, gaps: [750, 650, 600, 550, 500], hold: 900, copyAfterClose: 700 },
    copyGround: 'wash',
  },
  film: {
    capacity: FILM_CAPACITY,
    clock: { first: 1300, gaps: [950, 850, 800], hold: 1300, copyAfterClose: 500 },
    copyGround: 'wash',
  },
}

export const stackCapacity = (layout: StackLayoutType): number => STACK_LAYOUTS[layout].capacity

export const stackCopyGround = (layout: StackLayoutType): 'wash' | 'paper' =>
  STACK_LAYOUTS[layout].copyGround

const byOrder = (a: EventPhoto, b: EventPhoto) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id

/**
 * The photographs the stack reveals, first to last: every featured photograph
 * in gallery order, then the rest of the gallery in order, up to `max` — the
 * layout's capacity.
 *
 * Featured photographs lead because featuring is how an organizer says "this
 * one goes in the transition" on every other stage. The gallery follows because
 * most events have exactly one — the preview's featured-photo picker is
 * single-select, since the other two stages draw only one — and a stack of one
 * photograph is not a stack. The gallery is already public further down the
 * same invitation, so nothing new is shown by drawing from it.
 *
 * No featured photograph means no stack at all, not a stack of gallery photos:
 * the view gates the middle beat on a featured photo for all three transitions
 * (`hasFeaturedPhoto`), and a frame that revealed photographs the live showcase
 * would then skip is a preview that lies.
 */
export function selectStackPhotos(
  photos: readonly EventPhoto[] | null | undefined,
  max: number,
): EventPhoto[] {
  if (!photos?.length) return []
  const ordered = [...photos].sort(byOrder)
  const featured = ordered.filter((p) => p.is_featured)
  if (!featured.length) return []
  return [...featured, ...ordered.filter((p) => !p.is_featured)].slice(0, max)
}

/** `selectStackPhotos` at the capacity of the template's layout. */
export const stackPhotosFor = (
  photos: readonly EventPhoto[] | null | undefined,
  layout: StackLayoutType,
): EventPhoto[] => selectStackPhotos(photos, stackCapacity(layout))

/**
 * Where inside its frame a photograph is anchored: the centre of the
 * organizer's stored crop, as an `object-position`.
 *
 * The crop is authored as a phone-shaped rectangle for a full-screen stage, and
 * these frames are every other shape, so the rectangle itself can't be applied —
 * but its centre is exactly "where the subject is", which is the one thing a
 * smaller window needs to know. No stored crop resolves to 50% 50%.
 */
export const printFocus = (photo: PhotoCropFields | null | undefined): string => {
  const centre = cropCentre(resolvePhotoCrop(photo))
  return `${centre.x}% ${centre.y}%`
}

// --- Clock -------------------------------------------------------------------

export interface StackTimeline {
  /** When each photograph is revealed. */
  deals: number[]
  /** The closing beat: the composition gathers and makes room for the copy. */
  spread: number
  /** When the Save the Date block is revealed (its own `--std-t0` is 0). */
  copy: number
  /** When the stage starts dissolving into the invitation behind it. */
  dissolve: number
  /** When it has fully dissolved: `transitionComplete`. */
  complete: number
}

/**
 * From the Save the Date's reveal to the dissolve. Every design finishes inside
 * this window on the decoration stage, which uses the same 4000ms, so none of
 * them needs retuning for this one.
 */
const COPY_HOLD_MS = 4000

export const DISSOLVE_MS = 1200

/**
 * One clock for every layout, for a guest who asked for reduced motion: the
 * photographs are the content, so they are all still shown, but faster and
 * without travel — each fades in where it lies, and nothing moves to make room
 * for the copy (every layout already leaves it room in its reduced form).
 * Gentler, not longer: the door stage makes the same call.
 */
const REDUCED = {
  first: 300,
  gap: 700,
  hold: 700,
  copyAfterClose: 0,
  copyHold: 2200,
  dissolve: 600,
} as const

export const REDUCED_DISSOLVE_MS = REDUCED.dissolve

export function stackTimeline(
  count: number,
  reduced = false,
  layout: StackLayoutType = 'pile',
): StackTimeline {
  const clock = STACK_LAYOUTS[layout].clock
  const n = Math.max(1, Math.min(STACK_LAYOUTS[layout].capacity, Math.floor(count)))
  const deals: number[] = [reduced ? REDUCED.first : clock.first]
  for (let k = 1; k < n; k++) {
    const gap = reduced ? REDUCED.gap : clock.gaps[Math.min(k - 1, clock.gaps.length - 1)]
    deals.push(deals[k - 1] + gap)
  }
  const spread = deals[n - 1] + (reduced ? REDUCED.hold : clock.hold)
  const copy = spread + (reduced ? REDUCED.copyAfterClose : clock.copyAfterClose)
  const dissolve = copy + (reduced ? REDUCED.copyHold : COPY_HOLD_MS)
  const complete = dissolve + (reduced ? REDUCED.dissolve : DISSOLVE_MS)
  return { deals, spread, copy, dissolve, complete }
}
