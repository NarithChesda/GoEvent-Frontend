/**
 * Preview-frame context
 *
 * The manage page's Design Studio embeds 2-3 <iframe>s pointing at
 * `/events/:id/showcase-preview-frame` (see ShowcasePreviewTab.vue). Each of
 * those is a separate browsing context, so each one boots its own complete copy
 * of the app from main.ts — nothing is shared with the parent page, not parsed
 * JavaScript, not Pinia, not the API request-dedupe cache.
 *
 * That makes every piece of app-shell startup work cost 3x on the Studio tab.
 * Most of it is pointless in there: a preview frame renders one showcase stage
 * and never shows the notification bell, never offers Google sign-in, and never
 * navigates anywhere. This flag lets those startup steps stand down.
 *
 * Deliberately derived from `location.pathname` rather than the router: it has
 * to be answerable in main.ts, before the router exists.
 */

/** Path segment of the route ShowcasePreviewTab points its iframes at. */
export const PREVIEW_FRAME_PATH_SEGMENT = 'showcase-preview-frame'

/**
 * Whether THIS document is one of the studio's embedded preview frames.
 *
 * Note this is a property of the document, not of the iframe element — the
 * frame page itself asks, so a standalone visit to the same URL (there is no
 * link to it, but it is reachable) gets the same slimmed-down shell, which is
 * exactly right: the shell it skips is chrome that route never renders anyway.
 */
export function isPreviewFrameDocument(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.pathname.includes(PREVIEW_FRAME_PATH_SEGMENT)
}
