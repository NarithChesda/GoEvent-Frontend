import type { InjectionKey, Ref } from 'vue'
import type { CoverElementBoxes, CoverElementId } from '@/services/api/types/template.types'

/**
 * Frame-side state for the direct-manipulation cover layout editor.
 *
 * Provided by ShowcasePreviewFrameView when the parent turns layout editing on,
 * and consumed by the renderer (which merges `override` into the layout it hands
 * the showcase) and by CoverLayoutEditor (which writes it).
 *
 * `override` exists because a drag cannot afford a round trip. Every drag frame
 * writes here and the cover re-renders immediately from local state; the same
 * values also go up the bridge, come back down inside the next debounced
 * template push, and the override is dropped then — at which point the pushed
 * template is saying exactly what the override already was, so nothing moves.
 *
 * `dragging` guards that hand-back: a push landing mid-drag is our own stale
 * echo, and clearing the override for it would snap the block back to where it
 * was two frames ago.
 */
export interface CoverLayoutEditContext {
  /** Layout editing is on — the overlay renders and captures pointer input. */
  active: Ref<boolean>
  /** Boxes being dragged right now; null means the pushed template rules. */
  override: Ref<CoverElementBoxes | null>
  /** The block the editor pane and the overlay agree is selected. */
  selected: Ref<CoverElementId | null>
  /** A pointer drag is in flight, so incoming pushes are stale echoes. */
  dragging: Ref<boolean>
}

/**
 * Inert by default, exactly like InlineEditKey: only the preview frame provides
 * it, so the live public showcase renders with no overlay, no listeners, and no
 * extra DOM.
 */
export const CoverLayoutEditKey: InjectionKey<CoverLayoutEditContext> =
  Symbol('showcase-cover-layout-edit')
