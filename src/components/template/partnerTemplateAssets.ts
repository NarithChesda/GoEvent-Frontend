import type { TemplateAssets, TemplateColor, TemplateFont } from '@/composables/useEventShowcase'
import type {
  AgendaDesignConfig,
  AmbientCreaturesConfig,
  CoverStageLayout,
  EventDetailsDesignConfig,
  EventTemplateColor,
  EventTemplateLanguageFont,
  FallingEffectConfig,
  HostInfoDesignConfig,
  InfoCardDesignConfig,
  PartnerTemplate,
  SaveTheDateDesignConfig,
  SparkFieldConfig,
  StageModesConfig,
} from '@/services/api'

/**
 * Every media field a partner template carries, in the exact field names both
 * the API payload and `TemplateAssets.assets` use.
 *
 * `preview_image` is deliberately NOT here: it's the gallery thumbnail the
 * partner uploads for the browse grid, not something any showcase stage
 * renders, so it has no place in a live preview.
 */
export const PARTNER_TEMPLATE_ASSET_FIELDS = [
  'basic_background_photo',
  'basic_decoration_photo',
  'standard_background_video',
  'standard_cover_video',
  'standard_transition_video',
  'top_decoration',
  'bottom_decoration',
  'left_decoration',
  'right_decoration',
  'cover_top_decoration',
  'cover_bottom_decoration',
  'cover_left_decoration',
  'cover_right_decoration',
  'guest_title_frame_left',
  'guest_title_frame_mid',
  'guest_title_frame_right',
  'sample_logo_1',
  'sample_logo_2',
  'header_text_image',
] as const

export type PartnerTemplateAssetField = (typeof PARTNER_TEMPLATE_ASSET_FIELDS)[number]

/**
 * What the template form holds while it's being edited: config objects in their
 * final API shape, plus the still-unuploaded `File`s keyed by asset field. This
 * is the *live* draft — including changes that have never been saved — which is
 * the whole point of previewing it.
 */
export interface PartnerTemplateDraft {
  name: string
  display_liquid_glass_background: boolean
  cover_stage_layout: CoverStageLayout
  falling_effect: FallingEffectConfig | null
  ambient_creatures: AmbientCreaturesConfig | null
  event_details_design: EventDetailsDesignConfig
  host_info_design: HostInfoDesignConfig
  info_card_design: InfoCardDesignConfig
  agenda_design: AgendaDesignConfig
  save_the_date_design: SaveTheDateDesignConfig | null
  /** Per-stage animation/video modes. Null = the legacy asset/category inference. */
  stage_modes: StageModesConfig | null
  /** Saved colors (edit mode) or pending ones (create mode) — same shape either way. */
  colors: Array<Pick<EventTemplateColor, 'hex_color_code' | 'name'> & { id?: number }>
  /** Saved language fonts. Pending (create-mode) fonts carry no font file yet, so they can't preview. */
  fonts: EventTemplateLanguageFont[]
  /** Files chosen in this editing session, not yet uploaded. */
  files: Partial<Record<PartnerTemplateAssetField, File | null>>
  /**
   * Saved assets the partner has marked for removal but hasn't saved yet. The
   * preview must honour these or removing a decoration appears to do nothing
   * until the save round trip completes.
   */
  clearedFiles: PartnerTemplateAssetField[]
  /** Unsaved replacement for the falling effect's custom particle image. */
  fallingEffectCustomImage: File | null
  /** The partner removed the saved custom particle image. */
  clearFallingEffectCustomImage: boolean
  sparks: SparkFieldConfig | null
  /** Unsaved replacement for the spark field's custom mote image. */
  sparkCustomImage: File | null
  /** The partner removed the saved custom mote image. */
  clearSparkCustomImage: boolean
}

/**
 * Resolves one asset field to the URL the preview should render: the unsaved
 * file the partner just picked, else whatever is already saved on the template
 * (unless they've marked it for removal), else nothing.
 *
 * `resolveFileUrl` is injected rather than calling `URL.createObjectURL` here so
 * the caller can cache and revoke the object URLs it creates — minting a fresh
 * one on every keystroke (this runs inside a computed) would leak a blob per
 * render for the lifetime of the document.
 */
function resolveAssetUrl(
  field: PartnerTemplateAssetField,
  draft: PartnerTemplateDraft,
  saved: PartnerTemplate | null,
  resolveFileUrl: (file: File) => string,
): string | undefined {
  const pending = draft.files[field]
  if (pending instanceof File) return resolveFileUrl(pending)
  if (draft.clearedFiles.includes(field)) return undefined
  return saved?.[field] ?? undefined
}

/**
 * The falling effect's particle image follows the same pending/saved/cleared
 * rules as the form's own save path (see buildFallingEffectPayload's caller):
 * a new File wins, an explicit clear beats the saved value, otherwise keep it.
 */
function resolveFallingEffect(
  draft: PartnerTemplateDraft,
  saved: PartnerTemplate | null,
  resolveFileUrl: (file: File) => string,
): FallingEffectConfig | null {
  if (!draft.falling_effect) return null
  const config: FallingEffectConfig = { ...draft.falling_effect }
  if (draft.fallingEffectCustomImage instanceof File) {
    config.custom_image = resolveFileUrl(draft.fallingEffectCustomImage)
  } else if (draft.clearFallingEffectCustomImage) {
    config.custom_image = null
  } else {
    config.custom_image = saved?.falling_effect?.custom_image ?? null
  }
  return config
}

/**
 * The spark field's custom mote image, on the same pending/saved/cleared rules
 * the falling effect's particle image follows above.
 */
function resolveSparks(
  draft: PartnerTemplateDraft,
  saved: PartnerTemplate | null,
  resolveFileUrl: (file: File) => string,
): SparkFieldConfig | null {
  if (!draft.sparks) return null
  const config: SparkFieldConfig = { ...draft.sparks }
  if (draft.sparkCustomImage instanceof File) {
    config.custom_image = resolveFileUrl(draft.sparkCustomImage)
  } else if (draft.clearSparkCustomImage) {
    config.custom_image = null
  } else {
    config.custom_image = saved?.spark_custom_image ?? null
  }
  return config
}

/**
 * `EventTemplateLanguageFont` (what the partner-template API returns) nests the
 * actual font under `.font`, while the showcase's `TemplateFont` reads
 * `font_name`/`font_file` with the nested object only as a fallback (see
 * getFontName/getFontFile in useTemplateProcessor). Flattening here means the
 * preview resolves fonts by the primary path rather than the fallback one.
 *
 * Fonts with no file attached are dropped: the font manager would register an
 * @font-face pointing at nothing, and every string would silently render in the
 * fallback family anyway.
 */
function toShowcaseFonts(fonts: EventTemplateLanguageFont[]): TemplateFont[] {
  return fonts
    .filter((entry) => !!entry.font?.font_file)
    .map((entry) => ({
      id: entry.id,
      language: entry.language,
      font_name: entry.font!.name,
      font_file: entry.font!.font_file,
      font_type: entry.font_type,
      // The size trim and the library face's own normalization both have to make
      // the crossing: the font manager multiplies them into the `size-adjust` it
      // injects, so dropping either here would leave the preview rendering at a
      // different size than the saved template will.
      size_scale: entry.size_scale,
      font: {
        name: entry.font!.name,
        font_file: entry.font!.font_file,
        size_adjust: entry.font!.size_adjust,
        ascent_override: entry.font!.ascent_override,
        descent_override: entry.font!.descent_override,
        line_gap_override: entry.font!.line_gap_override,
      },
    }))
}

function toShowcaseColors(colors: PartnerTemplateDraft['colors']): TemplateColor[] {
  return colors.map((color) => ({
    id: color.id,
    hex_color_code: color.hex_color_code,
    name: color.name,
  }))
}

/**
 * Converts a partner template being edited into the `TemplateAssets` payload the
 * showcase preview frames already understand, so a draft can be pushed straight
 * over the preview bridge (`postTemplatePreview`) exactly like a published
 * template's assets are during a browse-and-try-on.
 *
 * The two shapes are the same data in two layouts: `PartnerTemplate` is flat
 * (one field per asset, as the API stores them), `TemplateAssets` nests the
 * media under `assets` and keeps the config objects at the top level. Note that
 * `guest_title_frame_*` belong INSIDE `assets` despite the interface also
 * declaring them at the top level — that's where the showcase actually reads
 * them from (see the templateAssets computed in useEventShowcase.ts, which
 * spreads `template_assets.assets` and hands the result to CoverContentOverlay).
 *
 * @param draft   the live form state, unsaved files included
 * @param saved   the template as last persisted, for fields the draft hasn't touched
 * @param resolveFileUrl  turns an unsaved File into a (cached, revocable) blob URL
 */
export function partnerTemplateDraftToAssets(
  draft: PartnerTemplateDraft,
  saved: PartnerTemplate | null,
  resolveFileUrl: (file: File) => string,
): TemplateAssets {
  const assets: NonNullable<TemplateAssets['assets']> = {}
  for (const field of PARTNER_TEMPLATE_ASSET_FIELDS) {
    const url = resolveAssetUrl(field, draft, saved, resolveFileUrl)
    if (url) assets[field] = url
  }

  // The envelope button isn't editable in the form, but a saved template can
  // carry one — dropping it would make the preview differ from the real thing.
  if (saved?.open_envelope_button) assets.open_envelope_button = saved.open_envelope_button

  return {
    template: {
      id: saved?.id ?? 0,
      name: draft.name,
      preview_image: saved?.preview_image ?? undefined,
    },
    assets,
    colors: toShowcaseColors(draft.colors),
    fonts: toShowcaseFonts(draft.fonts),
    cover_stage_layout: draft.cover_stage_layout,
    falling_effect: resolveFallingEffect(draft, saved, resolveFileUrl),
    ambient_creatures: draft.ambient_creatures,
    sparks: resolveSparks(draft, saved, resolveFileUrl),
    event_details_design: draft.event_details_design,
    host_info_design: draft.host_info_design,
    info_card_design: draft.info_card_design,
    agenda_design: draft.agenda_design,
    save_the_date_design: draft.save_the_date_design,
    stage_modes: draft.stage_modes,
    display_liquid_glass_background: draft.display_liquid_glass_background,
  }
}
