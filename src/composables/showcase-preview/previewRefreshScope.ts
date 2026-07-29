/**
 * How much a save owes the live preview frames.
 *
 * Posting `refresh` to a frame makes it refetch its showcase data and re-mount
 * its stages, which the host sees as the preview blinking mid-edit. Most saves
 * earn that. Some change nothing a frame paints, and some change exactly one
 * value the frame already binds — those get handled without a refetch.
 *
 * Used by ShowcasePreviewTab.vue's onEditorSaved.
 */
import type { Event } from '@/services/api'

/**
 * Event fields no preview frame renders:
 *
 *  - `banner_image` exists to be the link preview's og:image and nothing else
 *    — the only surfaces that draw it are the events list, the public event
 *    page, and EventBannerSection's own mock-up of the shared-link card. No
 *    showcase stage touches it.
 *  - `title` / `short_description` / `description` are that same link preview's
 *    og: text (see EventBannerSection.vue) and the add-to-calendar link's
 *    fields. What a showcase stage paints as its title and description comes
 *    from `event_texts`, not from these. The one lag is a V2 cover/hero for an
 *    event with no hosts at all, which falls back to the event title.
 *  - the music fields drive the showcase's music control, which lives in the
 *    floating action menu — and the preview frame hides that outright (see
 *    ShowcasePreviewFrameView.vue) and neutralizes the toggle in edit mode, so
 *    no frame shows anything about the track.
 *  - `updated_at` is bumped by every PATCH and says nothing about what changed.
 */
export const PREVIEW_INERT_FIELDS = new Set([
  'banner_image',
  'title',
  'short_description',
  'description',
  'music',
  'selected_music',
  'selected_music_details',
  'music_start_time',
  'music_end_time',
  'updated_at',
])

/**
 * Fields a frame binds straight off its event object, where copying the new
 * value in is the whole update — no refetch, so no re-mount and no blink. Both
 * logos reach the cover, transition and host layouts as plain `event.logo_*`
 * props and are normalised through `getMediaUrl` at the leaf, so the manage
 * endpoint's URL shape is as good as the showcase endpoint's.
 *
 * Only add a field here once it's clear that (a) the frame reads it directly
 * off the event rather than deriving something at load time (fonts, template
 * assets and language content all need the real refetch) and (b) both endpoints
 * serialize it the same way.
 */
export const PREVIEW_PATCHABLE_FIELDS = new Set(['logo_one', 'logo_two'])

/** What ShowcasePreviewTab should do with a save. */
export type PreviewSaveScope =
  /** Nothing a frame paints — propagate the data, leave the frames alone. */
  | { kind: 'inert' }
  /** Push these values into the frames; they re-render the bound nodes. */
  | { kind: 'patch'; fields: Record<string, unknown> }
  /** Anything else: the frames refetch. */
  | { kind: 'refresh' }

/**
 * Which fields a save actually changed.
 *
 * Both sides come from the same `/api/events/{id}/` serializer — `before` is the
 * manage view's copy, still pre-save when this runs — so the values are directly
 * comparable. Only keys the response carries are considered: the manage view
 * merges extras into its copy (`event_texts`, for one), and a key missing from a
 * response wasn't part of that save.
 */
const changedFields = (before: Event, after: Event): string[] => {
  const from = before as unknown as Record<string, unknown>
  const to = after as unknown as Record<string, unknown>
  return Object.keys(to).filter(
    (key) => !PREVIEW_INERT_FIELDS.has(key) && JSON.stringify(from[key]) !== JSON.stringify(to[key]),
  )
}

/**
 * Anything unrecognised resolves to `refresh`, so the default stays the safe
 * one: a stale preview is a bug, a redundant refetch is only a blink.
 */
export const resolvePreviewSaveScope = (
  before: Event | undefined,
  after: Event,
): PreviewSaveScope => {
  if (!before) return { kind: 'refresh' }

  const changed = changedFields(before, after)
  if (changed.length === 0) return { kind: 'inert' }
  if (!changed.every((key) => PREVIEW_PATCHABLE_FIELDS.has(key))) return { kind: 'refresh' }

  const source = after as unknown as Record<string, unknown>
  return {
    kind: 'patch',
    fields: Object.fromEntries(changed.map((key) => [key, source[key]])),
  }
}
