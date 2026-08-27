import type { InjectionKey } from 'vue'

/**
 * Marks "this tree is rendering inside a preview frame" — provided by
 * ShowcasePreviewFrameView for **every** frame, editable or not.
 *
 * Distinct from `EditIntentKey` on purpose. That one means "the viewer can edit
 * this event", and it is only provided with `?editable=1`. Components had been
 * using it for a second, different question — "should I show a slot that has no
 * content yet?" — which is true of any preview and false on the live showcase.
 * The two coincided until the partner-template preview arrived: it is a preview
 * (a partner is choosing how the template looks, so every element the template
 * defines has to be on screen) but not an editor (`canEdit: false`), so
 * anything gated on the edit context silently disappeared there.
 *
 * The same principle is already applied one level up, where the partner
 * preview's renderer context forces `hasFeaturedPhoto: true` — "someone building
 * a template wants to see every stage that template defines".
 *
 * Inject it as optional; `undefined` means the live showcase, where empty slots
 * must stay hidden from guests.
 */
export const PreviewFrameKey: InjectionKey<true> = Symbol('showcase-preview-frame')
