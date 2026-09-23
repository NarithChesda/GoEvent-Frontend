import { inject, provide, type ComputedRef, type InjectionKey } from 'vue'
import type { PartnerTemplate } from '@/services/api'

import type { FormState } from './config'
import type { TemplateAssets } from './useTemplateAssets'

/** The rail's entries, and therefore which panel is on screen. */
export type SectionId = 'basics' | 'brand' | 'cover' | 'transition' | 'content' | 'effects'

/**
 * What every section panel needs and none of them owns.
 *
 * Provided rather than passed down as props, and deliberately so for `form`: the
 * template being edited is ONE shared document that the panels write into, not a
 * value the parent owns and lends out. As a prop, every assignment a panel makes
 * would be a prop mutation — correct at runtime, since the object is reactive and
 * shared, but flagged by `vue/no-mutating-props` and misleading about who owns
 * what. The alternative, an event per field, would be fifty-seven events carrying
 * no information the panel doesn't already have.
 *
 * Provide once in the editor's setup; read with `useTemplateEditor()`.
 */
export interface TemplateEditorContext {
  /** The whole editable state. Panels assign into it directly. */
  form: FormState
  /** The saved record, for reading saved asset URLs and edit-vs-create branches. */
  existingTemplate: ComputedRef<PartnerTemplate | null>
  isEditing: ComputedRef<boolean>
  /** Pending picks, staged removals and their thumbnails. */
  assets: TemplateAssets
  /** Move the rail (and with it the live preview) to another section. */
  selectSection: (id: SectionId) => void
}

const TEMPLATE_EDITOR: InjectionKey<TemplateEditorContext> = Symbol('goevent.templateEditor')

export function provideTemplateEditor(context: TemplateEditorContext): void {
  provide(TEMPLATE_EDITOR, context)
}

/**
 * Throws rather than returning undefined: a section panel outside the editor is
 * a wiring mistake, and the alternative is every binding in it silently reading
 * from nothing.
 */
export function useTemplateEditor(): TemplateEditorContext {
  const context = inject(TEMPLATE_EDITOR)
  if (!context) {
    throw new Error('[template] a section panel was rendered outside PartnerTemplateForm')
  }
  return context
}
