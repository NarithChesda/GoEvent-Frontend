import type { InjectionKey } from 'vue'
import type { StackLayoutType } from '@/services/api/types/template.types'

/**
 * Identifies which record + field an inline edit on the showcase preview
 * writes to. Mirrors the save targets the management forms already use:
 * EventText upsert-by-(text_type, language), Host PATCH (the base fields in
 * English, that language's `translations[]` row otherwise), DressCode PATCH.
 * (Agenda titles are no longer inline-edited — the whole agenda card is an
 * EditableRegion opening EditAgendaDrawer, which handles translations.)
 */
export type InlineEditTarget =
  | { kind: 'eventText'; textType: string; field: 'title' | 'content' }
  | { kind: 'host'; hostId: number; field: 'name' | 'parent_a_name' | 'parent_b_name' | 'title' }
  | { kind: 'dressCode'; dressCodeId: number; field: 'title' | 'description' }

export interface InlineEditContext {
  save: (target: InlineEditTarget, value: string) => Promise<{ success: boolean; message?: string }>
}

/**
 * Provided only by the manage-page preview frame (ShowcasePreviewFrameView in
 * editable mode). The live public showcase never provides it, so
 * InlineEditableText renders as a bare pass-through slot there — zero DOM or
 * behavior change in production.
 */
export const InlineEditKey: InjectionKey<InlineEditContext> = Symbol('showcase-inline-edit')

/**
 * An edit that can't be committed inline inside the 390x844 preview frame
 * (file pickers, crop UIs, URL entry, gallery management would render
 * unusably tiny at preview scale). EditableRegion posts these through the
 * preview bridge; the parent manage page opens the matching full-size editor
 * the forms tab already uses (see PreviewEditorHost.vue).
 */
export type EditIntent =
  | { kind: 'eventLogo' }
  | { kind: 'gmapEmbed' }
  | { kind: 'eventDate' }
  | { kind: 'hostImage'; hostId: number }
  | { kind: 'photos' }
  | { kind: 'agendaItem'; agendaId: number }
  | { kind: 'agendaAdd' }
  | { kind: 'agendaDate'; date: string | null; itemCount: number }
  | { kind: 'agendaReorder'; agendaId: number; direction: 'up' | 'down' }
  | { kind: 'dressCodeItem'; dressCodeId: number }
  | { kind: 'dressCodeAdd' }
  | { kind: 'youtubeEmbed' }
  | { kind: 'paymentItem'; paymentMethodId: number }
  | { kind: 'paymentAdd' }
  /** `focus: 'crop'` opens the picker straight on its crop tab — the transition
   *  stage offers both (tap the photo to swap it, the crop button to re-frame
   *  the one already chosen). The photo stack also says which layout it is
   *  drawing, so the editor frames each photograph in its own frame's shape,
   *  and which photograph was tapped, so it opens on that one. */
  | {
      kind: 'featuredPhoto'
      focus?: 'choose' | 'crop'
      stackLayout?: StackLayoutType
      photoId?: number
    }
  | { kind: 'displayToggle'; field: 'rsvp_enabled' | 'comments_enabled' | 'countdown_enabled' }
  /** Edit the photo band that was tapped — or, without a `photoId`, add one. */
  | { kind: 'photoBand'; photoId?: number }

export interface EditIntentContext {
  requestEdit: (intent: EditIntent) => void
}

/**
 * Same inert-by-default contract as InlineEditKey: only the editable preview
 * frame provides it, so EditableRegion renders a bare slot everywhere else.
 */
export const EditIntentKey: InjectionKey<EditIntentContext> = Symbol('showcase-edit-intent')
