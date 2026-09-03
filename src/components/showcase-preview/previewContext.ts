import type { InjectionKey } from 'vue'

/**
 * Which preview frame this tree is rendering inside.
 *
 * - `studio`   — the event manage tab's live preview and the partner template
 *                form's preview (both served by ShowcasePreviewFrameView).
 *                Someone is building *their own* invitation or template.
 * - `catalogue` — the public `/partners/templates` page
 *                (TemplateShowcasePreviewFrameView). A shop owner with no
 *                account is being sold a design.
 */
export type PreviewFrameKind = 'studio' | 'catalogue'

/**
 * Marks "this tree is rendering inside a preview frame" — provided by both
 * frame views for **every** frame, editable or not.
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
 * Most consumers only care *that* they are in a preview, so a plain truthiness
 * check is the normal use. Compare against a specific kind only for a slot that
 * is an argument to one audience rather than a placeholder for missing content —
 * the footer's "Your Logo" mark is the case: it sells the catalogue visitor that
 * exact spot, and is noise in the studio, where the person previewing already
 * knows whose logo goes there.
 *
 * Inject it as optional; `undefined` means the live showcase, where empty slots
 * must stay hidden from guests.
 */
export const PreviewFrameKey: InjectionKey<PreviewFrameKind> = Symbol('showcase-preview-frame')
