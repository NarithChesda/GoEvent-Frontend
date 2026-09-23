import type {
  AgendaDesignConfig,
  AgendaDesignType,
  DressCodeDesignConfig,
  DressCodeDesignType,
  InfoCardDesignConfig,
  InfoCardDesignType,
  PartnerTemplate,
  SaveTheDateDesignConfig,
  SaveTheDateDesignType,
} from '@/services/api'

/**
 * The four section designs that are a bare choice of composition: the info
 * card, the agenda, the dress code and the Save the Date. Each is one `{ type }`
 * config on the wire, with no sibling settings — so far.
 *
 * Grouped rather than given a module each because they are the same shape and
 * the same decision asked four times, and because the builders below are the
 * point of this file: three of these four used to be written as inline literals
 * (`{ type: form.agenda_design_type }`) in BOTH the save payload and the preview
 * draft, duplicated verbatim. Harmless while the expression was one key — and a
 * live drift risk the moment one of them gains a second, which the type comment
 * on DressCodeDesignConfig explicitly anticipates. They go through a builder now
 * like every other config, so the preview cannot disagree with what is saved.
 */
export interface SectionDesignsFormState {
  /** Info card (venue/map/countdown/RSVP) treatment in the showcase (glass | engraved). */
  info_card_design_type: InfoCardDesignType
  agenda_design_type: AgendaDesignType
  dress_code_design_type: DressCodeDesignType
  /**
   * Save the Date composition on the transition stage. `auto` is not a design —
   * it stores nothing, which leaves each transition stage on the one it shipped
   * with (`script` for decoration, `engraved` for door). Every template saved
   * before this field existed loads as `auto`, so opening and re-saving one
   * can't silently pin it to a design its partner never chose.
   */
  save_the_date_design_type: SaveTheDateDesignType | 'auto'
}

export const defaultSectionDesigns = (): SectionDesignsFormState => ({
  info_card_design_type: 'glass',
  agenda_design_type: 'rail',
  dress_code_design_type: 'portrait',
  save_the_date_design_type: 'auto',
})

export function hydrateSectionDesigns(template: PartnerTemplate | null): SectionDesignsFormState {
  return {
    info_card_design_type: template?.info_card_design?.type ?? 'glass',
    // Absent means the template predates the field, which is exactly 'rail' —
    // the one composition every agenda rendered back when the look came from
    // the event category.
    agenda_design_type: template?.agenda_design?.type ?? 'rail',
    // Absent means the template predates the field, which is exactly
    // 'portrait' — the one composition every dress code section rendered.
    dress_code_design_type: template?.dress_code_design?.type ?? 'portrait',
    // No stored value means 'auto' — each transition stage keeps its own
    // default — which is what every template saved before this field existed has.
    save_the_date_design_type: template?.save_the_date_design?.type ?? 'auto',
  }
}

export const buildInfoCardDesignPayload = (
  state: SectionDesignsFormState,
): InfoCardDesignConfig => ({ type: state.info_card_design_type })

export const buildAgendaDesignPayload = (state: SectionDesignsFormState): AgendaDesignConfig => ({
  type: state.agenda_design_type,
})

export const buildDressCodeDesignPayload = (
  state: SectionDesignsFormState,
): DressCodeDesignConfig => ({ type: state.dress_code_design_type })

/**
 * `auto` is the absence of a choice, so it persists as `null` rather than as a
 * type — which is what makes the per-stage fallback in SaveTheDate.vue reachable
 * at all.
 */
export const buildSaveTheDateDesignPayload = (
  state: SectionDesignsFormState,
): SaveTheDateDesignConfig | null =>
  state.save_the_date_design_type === 'auto'
    ? null
    : { type: state.save_the_date_design_type }
