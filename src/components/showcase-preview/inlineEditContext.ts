import type { InjectionKey } from 'vue'

/**
 * Identifies which record + field an inline edit on the showcase preview
 * writes to. Mirrors the four save targets the management forms already use:
 * EventText upsert-by-(text_type, language), Host PATCH, AgendaItem PATCH,
 * DressCode PATCH.
 */
export type InlineEditTarget =
  | { kind: 'eventText'; textType: string; field: 'title' | 'content' }
  | { kind: 'host'; hostId: number; field: 'name' | 'parent_a_name' | 'parent_b_name' | 'title' }
  | { kind: 'agenda'; agendaId: number; field: 'title' }
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
