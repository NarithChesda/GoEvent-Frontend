import type { EditIntent } from '../edit/editContext'
import type { TemplateAssets } from '@/composables/useEventShowcase'

/**
 * Typed same-origin postMessage protocol between the manage-page preview tab
 * (parent) and the showcase preview frames (same-origin iframes rendering
 * ShowcasePreviewFrameView).
 *
 *   frame → parent : edit intents (media/embed edits that need full-size UI)
 *   parent → frame : replay (re-run a frame's mount animation),
 *                    refresh (refetch showcase data after a parent-side save),
 *                    preview-template (live, non-destructive template try-on),
 *                    edit-hints-on/off (persistently outline the editable
 *                      parts — the only discoverable affordance on touch,
 *                      where the hover states these normally rely on can
 *                      never fire)
 */
export const PREVIEW_BRIDGE_SOURCE = 'goevent-showcase-preview'

export type ParentToFrameType = 'replay' | 'refresh' | 'edit-hints-on' | 'edit-hints-off'

export type PreviewBridgeMessage =
  | { source: typeof PREVIEW_BRIDGE_SOURCE; type: ParentToFrameType }
  | { source: typeof PREVIEW_BRIDGE_SOURCE; type: 'edit-intent'; intent: EditIntent }
  | { source: typeof PREVIEW_BRIDGE_SOURCE; type: 'preview-template'; templateData: TemplateAssets }

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

/** Parent side: push a staged template's assets into one frame for live try-on. */
export function postTemplatePreviewToFrame(
  frameWindow: Window | null | undefined,
  templateData: TemplateAssets,
): void {
  frameWindow?.postMessage(
    { source: PREVIEW_BRIDGE_SOURCE, type: 'preview-template', templateData } satisfies PreviewBridgeMessage,
    window.location.origin,
  )
}
