import type { EditIntent } from '../edit/editContext'
import type { TemplateAssets } from '@/composables/useEventShowcase'

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
 *                    preview-template-clear (cancel a try-on and restore the
 *                      frame's own real template fields — purely local, no
 *                      refetch, since the try-on never touched the backend),
 *                    preview-template-commit (a try-on was just confirmed for
 *                      real — the frame is already showing it correctly, so
 *                      this only forgets the revert snapshot; no visual change),
 *                    edit-hints-on/off (persistently outline the editable
 *                      parts — the only discoverable affordance on touch,
 *                      where the hover states these normally rely on can
 *                      never fire)
 */
export const PREVIEW_BRIDGE_SOURCE = 'goevent-showcase-preview'

export type ParentToFrameType =
  | 'replay'
  | 'refresh'
  | 'preview-template-clear'
  | 'preview-template-commit'
  | 'edit-hints-on'
  | 'edit-hints-off'

/** Just-saved event fields, in the shape the event serializer returns them. */
export type EventFieldPatch = Record<string, unknown>

export type PreviewBridgeMessage =
  | { source: typeof PREVIEW_BRIDGE_SOURCE; type: ParentToFrameType }
  | { source: typeof PREVIEW_BRIDGE_SOURCE; type: 'edit-intent'; intent: EditIntent }
  | { source: typeof PREVIEW_BRIDGE_SOURCE; type: 'preview-template'; templateData: TemplateAssets }
  | { source: typeof PREVIEW_BRIDGE_SOURCE; type: 'patch-event'; fields: EventFieldPatch }
  | { source: typeof PREVIEW_BRIDGE_SOURCE; type: 'frame-ready' }

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
