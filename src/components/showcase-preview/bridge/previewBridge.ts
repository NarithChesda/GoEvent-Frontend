import type { EditIntent } from '../edit/editContext'
import type { TemplateAssets } from '@/composables/useEventShowcase'
import type { CoverElementBoxes, CoverElementId } from '@/services/api/types/template.types'

/**
 * Typed same-origin postMessage protocol between the manage-page preview tab
 * (parent) and the showcase preview frames (same-origin iframes rendering
 * ShowcasePreviewFrameView).
 *
 *   frame → parent : edit intents (media/embed edits that need full-size UI),
 *                    frame-ready (this frame's message listener is now live —
 *                      the only safe moment to push state into it, see
 *                      postFrameReadyToParent)
 *   parent → frame : replay (re-run a frame's mount animation),
 *                    refresh (refetch showcase data after a parent-side save),
 *                    patch-event (merge a handful of just-saved event fields
 *                      straight into the frame's showcase data — the SPA-style
 *                      update for saves whose whole effect is a value the frame
 *                      already binds, e.g. a replaced logo; no refetch, so no
 *                      re-mount flicker. See previewRefreshScope.ts for which
 *                      fields qualify),
 *                    preview-template (live, non-destructive template try-on),
 *                    preview-event (swap which event the PUBLIC template
 *                      preview is drawn through — see
 *                      postPreviewEventToFrame),
 *                    preview-template-clear (cancel a try-on and restore the
 *                      frame's own real template fields — purely local, no
 *                      refetch, since the try-on never touched the backend),
 *                    preview-template-commit (a try-on was just confirmed for
 *                      real — the frame is already showing it correctly, so
 *                      this only forgets the revert snapshot; no visual change),
 *                    edit-hints-on/off (persistently outline the editable
 *                      parts — the only discoverable affordance on touch,
 *                      where the hover states these normally rely on can
 *                      never fire),
 *                    cover-layout-edit-on/off (turn the direct-manipulation
 *                      cover layout overlay on — see CoverLayoutEditor.vue)
 *
 * `cover-layout-change` and `cover-layout-select` travel in BOTH directions:
 * dragging a block in the frame reports up, and the editor pane's numeric
 * fields / block list push back down. Each side only ever receives the other's
 * (a frame posts to `window.parent`, which never routes back to itself; the
 * parent filters incoming messages by `event.source`), so one message type per
 * concept is enough.
 */
export const PREVIEW_BRIDGE_SOURCE = 'goevent-showcase-preview'

export type ParentToFrameType =
  | 'replay'
  | 'refresh'
  | 'preview-template-clear'
  | 'preview-template-commit'
  | 'edit-hints-on'
  | 'edit-hints-off'
  | 'cover-layout-edit-on'
  | 'cover-layout-edit-off'

/** Just-saved event fields, in the shape the event serializer returns them. */
export type EventFieldPatch = Record<string, unknown>

export type PreviewBridgeMessage =
  | { source: typeof PREVIEW_BRIDGE_SOURCE; type: ParentToFrameType }
  | { source: typeof PREVIEW_BRIDGE_SOURCE; type: 'edit-intent'; intent: EditIntent }
  | { source: typeof PREVIEW_BRIDGE_SOURCE; type: 'preview-template'; templateData: TemplateAssets }
  | { source: typeof PREVIEW_BRIDGE_SOURCE; type: 'patch-event'; fields: EventFieldPatch }
  | { source: typeof PREVIEW_BRIDGE_SOURCE; type: 'frame-ready' }
  | { source: typeof PREVIEW_BRIDGE_SOURCE; type: 'frame-loaded' }
  | { source: typeof PREVIEW_BRIDGE_SOURCE; type: 'set-language'; language: string }
  | {
      source: typeof PREVIEW_BRIDGE_SOURCE
      type: 'preview-event'
      /** `null` falls the frame back to its bundled sample invitation. */
      eventId: string | null
    }
  | {
      source: typeof PREVIEW_BRIDGE_SOURCE
      type: 'showcase-languages'
      languages: string[]
      currentLanguage: string
    }
  | {
      source: typeof PREVIEW_BRIDGE_SOURCE
      type: 'cover-layout-change'
      elements: CoverElementBoxes
      /** False for every frame of a drag, true on release. */
      commit: boolean
    }
  | {
      source: typeof PREVIEW_BRIDGE_SOURCE
      type: 'cover-layout-select'
      elementId: CoverElementId | null
    }

/**
 * Validates origin + shape and returns the typed message, or null for
 * anything that isn't ours. Never trust `MessageEvent.data` without this.
 */
export function parsePreviewBridgeMessage(event: MessageEvent): PreviewBridgeMessage | null {
  if (event.origin !== window.location.origin) return null
  const data = event.data as { source?: unknown; type?: unknown } | null
  if (!data || data.source !== PREVIEW_BRIDGE_SOURCE || typeof data.type !== 'string') return null
  return data as PreviewBridgeMessage
}

/**
 * Frame side: announce that this frame's own `message` listener is attached and
 * it can now receive parent commands.
 *
 * The iframe element's `load` event cannot stand in for this. The frame route is
 * a lazily imported chunk (see router/index.ts), and a dynamic `import()` does
 * NOT delay a document's load event — so `load` routinely fires while that chunk
 * is still in flight, i.e. before the view has mounted and subscribed. Since
 * postMessage doesn't queue, anything the parent pushes in that window is
 * dropped on the floor with no error: a template try-on staged for a frame that
 * mounts at that moment simply never arrived, and the frame kept rendering the
 * previously applied template until a full page reload (which warms the chunk
 * and lets mount win the race). Handshaking removes the race instead of betting
 * on it.
 */
export function postFrameReadyToParent(): void {
  if (window.parent === window) return
  window.parent.postMessage(
    { source: PREVIEW_BRIDGE_SOURCE, type: 'frame-ready' } satisfies PreviewBridgeMessage,
    window.location.origin,
  )
}

/**
 * Frame side: this frame has finished loading its showcase and has something on
 * screen.
 *
 * Deliberately separate from `frame-ready`, because they answer different
 * questions at very different moments. `frame-ready` means "my listener is
 * attached, you may push state to me" and fires at mount, while the showcase
 * fetch, the stage chunk and every image and video are still in flight.
 * `frame-loaded` means "I am actually showing an invitation".
 *
 * A parent that boots frames in sequence needs the second one. Advancing the
 * queue on `frame-ready` let the next frame start booting a few milliseconds
 * after the previous one mounted, so all of them competed for the connection
 * anyway and the queue bought nothing — which is most visible on the one frame
 * the visitor is actually looking at, and worst on the slow connections the
 * staggering exists for.
 */
export function postFrameLoadedToParent(): void {
  if (window.parent === window) return
  window.parent.postMessage(
    { source: PREVIEW_BRIDGE_SOURCE, type: 'frame-loaded' } satisfies PreviewBridgeMessage,
    window.location.origin,
  )
}

/**
 * Frame side: publish which languages this event actually has, and which one is
 * showing now.
 *
 * A parent can't work this out for itself. `available_languages` lives on the
 * *showcase* response, not on the events list — so a parent that only has an
 * event id (the partner template studio) has no way to know an event is
 * English+Khmer until the frame that loaded it says so. Posted after the initial
 * load and again after every `set-language`, so the parent's switcher and the
 * frame can never disagree about what's on screen.
 */
export function postShowcaseLanguagesToParent(
  languages: string[],
  currentLanguage: string,
): void {
  if (window.parent === window) return
  window.parent.postMessage(
    {
      source: PREVIEW_BRIDGE_SOURCE,
      type: 'showcase-languages',
      languages,
      currentLanguage,
    } satisfies PreviewBridgeMessage,
    window.location.origin,
  )
}

/**
 * Parent side: switch the frame's language in place.
 *
 * Deliberately a bridge message rather than a new `?lang=` on the iframe's
 * `src`: any change to `src`, however small, makes the browser navigate the
 * frame — a full reload, a spinner, and every mount animation replayed, for
 * what should be a content swap. The frame handles this with the showcase's own
 * `updateLanguageContent`, which refetches just the localized content and
 * merges it in place.
 */
export function postSetLanguageToFrame(
  frameWindow: Window | null | undefined,
  language: string,
): void {
  frameWindow?.postMessage(
    { source: PREVIEW_BRIDGE_SOURCE, type: 'set-language', language } satisfies PreviewBridgeMessage,
    window.location.origin,
  )
}

/**
 * Parent side: swap which event the public template preview frame draws.
 *
 * The design catalogue previews each design through a real event of that
 * design's own category (see useTemplatePreviewEvents), so picking a funeral
 * design after a wedding one changes the invitation as well as the template.
 * A message rather than a new `?eventId=` on the iframe's `src`, for the same
 * reason the language is one: any change to `src` re-navigates the frame, and
 * with three frames on screen that is three full app boots per click. The frame
 * reloads its showcase data in place and re-applies the template it is
 * currently showing.
 */
export function postPreviewEventToFrame(
  frameWindow: Window | null | undefined,
  eventId: string | null,
): void {
  frameWindow?.postMessage(
    { source: PREVIEW_BRIDGE_SOURCE, type: 'preview-event', eventId } satisfies PreviewBridgeMessage,
    window.location.origin,
  )
}

/**
 * Frame side: report cover blocks that were just dragged/resized.
 *
 * Posted on every pointer move (with `commit: false`) so the editor pane's
 * numbers track the drag, and once more on release (`commit: true`) — the flag
 * is what lets a parent treat one drag as a single undoable edit rather than
 * fifty. The frame renders the move from its own local state meanwhile, so this
 * never has to round-trip before the block visually moves.
 */
export function postCoverLayoutChangeToParent(
  elements: CoverElementBoxes,
  commit: boolean,
): void {
  if (window.parent === window) return
  window.parent.postMessage(
    {
      source: PREVIEW_BRIDGE_SOURCE,
      type: 'cover-layout-change',
      // Same reason postTemplatePreviewToFrame unwraps: structured clone throws
      // on a Vue reactive proxy, and these boxes come straight off a ref.
      elements: JSON.parse(JSON.stringify(elements)) as CoverElementBoxes,
      commit,
    } satisfies PreviewBridgeMessage,
    window.location.origin,
  )
}

/** Either side: agree on which cover block is selected. */
export function postCoverLayoutSelection(
  target: Window | null | undefined,
  elementId: CoverElementId | null,
): void {
  target?.postMessage(
    {
      source: PREVIEW_BRIDGE_SOURCE,
      type: 'cover-layout-select',
      elementId,
    } satisfies PreviewBridgeMessage,
    window.location.origin,
  )
}

/** Frame side: report an edit intent up to the manage page. */
export function postEditIntentToParent(intent: EditIntent): void {
  if (window.parent === window) return
  window.parent.postMessage(
    { source: PREVIEW_BRIDGE_SOURCE, type: 'edit-intent', intent } satisfies PreviewBridgeMessage,
    window.location.origin,
  )
}

/** Parent side: post a command into one frame's window. */
export function postToFrame(frameWindow: Window | null | undefined, type: ParentToFrameType): void {
  frameWindow?.postMessage(
    { source: PREVIEW_BRIDGE_SOURCE, type } satisfies PreviewBridgeMessage,
    window.location.origin,
  )
}

/**
 * Parent side: push just-saved event fields into one frame, to be merged over
 * whatever it already holds. The values come off an API response the parent
 * usually keeps in a ref or a prop, so unwrap any reactive proxy here for the
 * same reason postTemplatePreviewToFrame does — structured clone throws on one.
 */
export function postEventPatchToFrame(
  frameWindow: Window | null | undefined,
  fields: EventFieldPatch,
): void {
  frameWindow?.postMessage(
    {
      source: PREVIEW_BRIDGE_SOURCE,
      type: 'patch-event',
      fields: JSON.parse(JSON.stringify(fields)) as EventFieldPatch,
    } satisfies PreviewBridgeMessage,
    window.location.origin,
  )
}

/** Parent side: push a staged template's assets into one frame for live try-on. */
export function postTemplatePreviewToFrame(
  frameWindow: Window | null | undefined,
  templateData: TemplateAssets,
): void {
  frameWindow?.postMessage(
    {
      source: PREVIEW_BRIDGE_SOURCE,
      type: 'preview-template',
      // postMessage structured-clones its payload, and a Vue reactive Proxy is
      // not clonable — it throws DataCloneError and kills the whole handler.
      // Callers legitimately hold this in a ref (the tab's stagedTemplateData)
      // or take it as a prop (the mobile sheet), and both hand over a proxy, so
      // unwrap here at the boundary rather than asking every call site to
      // remember. TemplateAssets is plain API JSON, so the round-trip is
      // lossless.
      templateData: JSON.parse(JSON.stringify(templateData)) as TemplateAssets,
    } satisfies PreviewBridgeMessage,
    window.location.origin,
  )
}
