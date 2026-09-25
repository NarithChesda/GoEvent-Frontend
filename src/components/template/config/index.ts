import type {
  AgendaDesignConfig,
  AmbientCreaturesConfig,
  CountdownRsvpDesignConfig,
  CoverStageLayout,
  DressCodeDesignConfig,
  EventDetailsDesignConfig,
  FallingEffectConfig,
  GalleryDesignConfig,
  GuestInviteDesignConfig,
  HostInfoDesignConfig,
  InfoCardDesignConfig,
  PartnerTemplate,
  SaveTheDateDesignConfig,
  SparkFieldConfig,
  StageModesConfig,
  TextEffectsConfig,
} from '@/services/api'

import { defaultAssets, hydrateAssets, type AssetsFormState } from './assets'
import { defaultBasics, hydrateBasics, type BasicsFormState } from './basics'
import {
  buildCoverLayoutPayload,
  defaultCoverLayout,
  hydrateCoverLayout,
  type CoverLayoutFormState,
} from './coverLayout'
import {
  buildCountdownRsvpDesignPayload,
  defaultCountdownRsvpDesign,
  hydrateCountdownRsvpDesign,
  type CountdownRsvpFormState,
} from './countdownRsvpDesign'
import {
  buildEventDetailsDesignPayload,
  defaultEventDetailsDesign,
  hydrateEventDetailsDesign,
  type EventDetailsDesignFormState,
} from './eventDetailsDesign'
import {
  buildFallingEffectPayload,
  defaultFallingEffect,
  hydrateFallingEffect,
  type FallingEffectFormState,
} from './fallingEffect'
import {
  buildAmbientCreaturesPayload,
  defaultAmbientCreatures,
  hydrateAmbientCreatures,
  type AmbientCreaturesFormState,
} from './ambientCreatures'
import {
  buildHostInfoDesignPayload,
  defaultHostInfoDesign,
  hydrateHostInfoDesign,
  type HostInfoDesignFormState,
} from './hostInfoDesign'
import {
  buildAgendaDesignPayload,
  buildDressCodeDesignPayload,
  buildGalleryDesignPayload,
  buildGuestInviteDesignPayload,
  buildInfoCardDesignPayload,
  buildSaveTheDateDesignPayload,
  defaultSectionDesigns,
  hydrateSectionDesigns,
  type SectionDesignsFormState,
} from './sectionDesigns'
import {
  buildSparksPayload,
  defaultSparkField,
  hydrateSparkField,
  type SparkFieldFormState,
} from './sparkField'
import {
  buildStageModesPayload,
  defaultStageModes,
  hydrateStageModes,
  type StageModesFormState,
} from './stageModes'
import {
  buildTextEffectsPayload,
  defaultTextEffects,
  hydrateTextEffects,
  type TextEffectsFormState,
} from './textEffects'

/**
 * Everything the partner template editor holds while a template is being edited.
 *
 * An intersection of one slice per config rather than one flat interface, so
 * each config's default, its hydration and its serialization sit together in a
 * module of its own instead of three lists several hundred lines apart. The
 * slice keys are the flat form-state names verbatim, which is what keeps every
 * existing `form.host_frame_style` binding working — the nesting is in the
 * source layout, not in the runtime object.
 *
 * ADDING A NEW OPTION: write (or extend) one module under this directory, then
 * add it in the three places below — the intersection, `defaultForm`, and
 * `hydrateForm`; plus `buildConfigPayload` if it is a new config block. Those
 * four sit within thirty lines of each other on purpose. Nothing else in the
 * editor needs to know, and the live preview picks it up for free because it
 * shares `buildConfigPayload` with the save path.
 */
export type FormState = BasicsFormState &
  AssetsFormState &
  CoverLayoutFormState &
  FallingEffectFormState &
  AmbientCreaturesFormState &
  SparkFieldFormState &
  EventDetailsDesignFormState &
  HostInfoDesignFormState &
  SectionDesignsFormState &
  CountdownRsvpFormState &
  StageModesFormState &
  TextEffectsFormState

export const defaultForm = (): FormState => ({
  ...defaultBasics(),
  ...defaultAssets(),
  ...defaultCoverLayout(),
  ...defaultFallingEffect(),
  ...defaultAmbientCreatures(),
  ...defaultSparkField(),
  ...defaultEventDetailsDesign(),
  ...defaultHostInfoDesign(),
  ...defaultSectionDesigns(),
  ...defaultCountdownRsvpDesign(),
  ...defaultStageModes(),
  ...defaultTextEffects(),
})

/**
 * The whole editable state of one template, or of a blank one when `template` is
 * null. Every module returns a complete slice, so this is a total function —
 * there is no "assign the defaults first, then override some of them" step in
 * which a missed field keeps a value from the previously opened template.
 */
export function hydrateForm(template: PartnerTemplate | null): FormState {
  const coverLayout = hydrateCoverLayout(template)
  return {
    ...hydrateBasics(template),
    ...hydrateAssets(),
    ...coverLayout,
    ...hydrateFallingEffect(template),
    ...hydrateAmbientCreatures(template),
    // Seeded from the cover's gilding when the template predates the standalone
    // spark config, hence the dependency on the layout resolved just above.
    ...hydrateSparkField(template, coverLayout.cover_stage_layout.coverGilding),
    ...hydrateEventDetailsDesign(template),
    ...hydrateHostInfoDesign(template),
    ...hydrateSectionDesigns(template),
    ...hydrateCountdownRsvpDesign(template),
    ...hydrateStageModes(template),
    ...hydrateTextEffects(template),
  }
}

/**
 * The config half of the save payload — everything that is not a file or a
 * scalar column. Every key is present, because every builder below always
 * returns a value: a config that is switched off serializes as `null`, never as
 * an absent key.
 *
 * Written out rather than `Pick`ed from the payload type, because the two say
 * different things. On the wire every config is optional and most accept `null`
 * — absent means "do not touch this", null means "switch this off". This form
 * always has an answer for all fourteen, and for the eight that cannot be switched
 * off it is never null; the live preview renders this value, so it needs the
 * narrower truth.
 *
 * That the narrower type still satisfies the wider one is checked where it
 * actually matters, not by a standalone assertion: `handleSave` spreads this
 * into a `PartnerTemplateCreatePayload` and `previewDraft` into a
 * `PartnerTemplateDraft`, so a builder that returned the wrong shape fails to
 * compile at both call sites.
 */
export interface TemplateConfigPayload {
  cover_stage_layout: CoverStageLayout
  falling_effect: FallingEffectConfig | null
  ambient_creatures: AmbientCreaturesConfig | null
  sparks: SparkFieldConfig
  event_details_design: EventDetailsDesignConfig
  host_info_design: HostInfoDesignConfig
  info_card_design: InfoCardDesignConfig
  agenda_design: AgendaDesignConfig
  dress_code_design: DressCodeDesignConfig
  gallery_design: GalleryDesignConfig
  guest_invite_design: GuestInviteDesignConfig | null
  countdown_rsvp_design: CountdownRsvpDesignConfig | null
  save_the_date_design: SaveTheDateDesignConfig | null
  stage_modes: StageModesConfig
  text_effects: TextEffectsConfig | null
}

/**
 * Every JSON config block, built once from the form.
 *
 * Shared verbatim by the save payload and the live preview draft, which is the
 * whole point: the preview's job is to show what a save would produce, and the
 * only way to guarantee that is for both to call this. Three of these configs
 * used to be built as inline object literals duplicated across the two call
 * sites — see sectionDesigns.ts.
 */
export function buildConfigPayload(form: FormState): TemplateConfigPayload {
  return {
    cover_stage_layout: buildCoverLayoutPayload(form),
    falling_effect: buildFallingEffectPayload(form),
    ambient_creatures: buildAmbientCreaturesPayload(form),
    sparks: buildSparksPayload(form),
    event_details_design: buildEventDetailsDesignPayload(form),
    host_info_design: buildHostInfoDesignPayload(form),
    info_card_design: buildInfoCardDesignPayload(form),
    agenda_design: buildAgendaDesignPayload(form),
    dress_code_design: buildDressCodeDesignPayload(form),
    gallery_design: buildGalleryDesignPayload(form),
    guest_invite_design: buildGuestInviteDesignPayload(form),
    countdown_rsvp_design: buildCountdownRsvpDesignPayload(form),
    save_the_date_design: buildSaveTheDateDesignPayload(form),
    stage_modes: buildStageModesPayload(form),
    text_effects: buildTextEffectsPayload(form),
  }
}

export { CREATURE_TYPES, type AmbientCreaturesSettings } from './ambientCreatures'
export { TEMPLATE_FORM_ASSET_FIELDS, type TemplateFormAssetField } from './assets'
export { defaultCoverStageLayout, type CoverStageLayoutFormState } from './coverLayout'
export { type FallingEffectSettings } from './fallingEffect'
export { type SparkFieldSettings } from './sparkField'
export { type TextEffectFinishChoice, type TextEffectFormState } from './textEffects'
