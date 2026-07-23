import type { InjectionKey } from 'vue'

/**
 * Identifies which record + field an inline edit on the showcase preview
 * writes to. Mirrors the save targets the management forms already use:
 * EventText upsert-by-(text_type, language), Host PATCH, DressCode PATCH.
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

export interface EditIntentContext {
  requestEdit: (intent: EditIntent) => void
}

/**
 * Same inert-by-default contract as InlineEditKey: only the editable preview
 * frame provides it, so EditableRegion renders a bare slot everywhere else.
 */
export const EditIntentKey: InjectionKey<EditIntentContext> = Symbol('showcase-edit-intent')
