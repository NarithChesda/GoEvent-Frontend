import type {
  CoupleOrnament,
  HostBreaklineStyle,
  HostCaptionPlacement,
  HostFrameStyle,
  HostInfoDesignConfig,
  HostInfoDesignType,
  HostPhotoFrame,
  PartnerTemplate,
} from '@/services/api'
import {
  resolveCaptionPlacement,
  resolvePhotoFrame,
} from '@/components/showcase/host-layouts/wedding/archPhotoFrame'

/**
 * The host block's design and all of its sibling settings.
 *
 * One backend config that the form unpacks into flat fields, which is exactly
 * why it lives in a module of its own: before this, each field carried its own
 * default line, its own hydrate line and its own payload line, several hundred
 * lines apart, and nothing checked that the three lists still named the same
 * fields.
 */
export interface HostInfoDesignFormState {
  /** Host info block design rendered in the showcase (standard | simple). */
  host_info_design_type: HostInfoDesignType
  /** Frame chrome shared by the host title and avatar. `none` is the pre-frames look. */
  host_frame_style: HostFrameStyle
  /** Motif between the two hosts in the grid's centre column. */
  host_couple_ornament: CoupleOrnament
  /**
   * The crest design's horizontal breakline. `rule` is that design's own
   * default rather than a legacy value — no published template carries `crest`
   * yet, so there is nothing here to stay compatible with.
   */
  host_divider_style: HostBreaklineStyle
  /** Width of that breakline, in percent of the block. */
  host_divider_scale: number
  /** Crest (logo) size, in percent of the design's base. */
  host_logo_scale: number
  /** Where the crest block starts, in rem. */
  host_top_offset: number
  /** `simple` only: draw the names the way the cover's host names are set up. */
  host_sync_cover_names: boolean
  /** `arch` only: the shape each host's photo sits in. */
  host_photo_frame: HostPhotoFrame
  /** `arch` only: each host's title, name and parents under their frame, or beside it. */
  host_caption_placement: HostCaptionPlacement
}

export const defaultHostInfoDesign = (): HostInfoDesignFormState => ({
  host_info_design_type: 'standard',
  host_frame_style: 'none',
  host_couple_ornament: 'none',
  host_divider_style: 'rule',
  host_divider_scale: 100,
  host_logo_scale: 100,
  host_top_offset: 0,
  host_sync_cover_names: false,
  host_photo_frame: 'arch',
  host_caption_placement: 'below',
})

export function hydrateHostInfoDesign(template: PartnerTemplate | null): HostInfoDesignFormState {
  const design = template?.host_info_design
  return {
    host_info_design_type: design?.type ?? 'standard',
    // Sibling keys on the same config. Absent means the template predates
    // frames, which is exactly 'none' - the look it already has.
    host_frame_style: design?.frame_style ?? 'none',
    host_couple_ornament: design?.couple_ornament ?? 'none',
    // The crest design's own four. Their fallbacks are that design's defaults
    // rather than a look to stay compatible with: `crest` is newer than any
    // saved template, so an absent value has never rendered anything.
    host_divider_style: design?.divider_style ?? 'rule',
    host_divider_scale: design?.divider_scale ?? 100,
    host_logo_scale: design?.logo_scale ?? 100,
    host_top_offset: design?.top_offset ?? 0,
    // Absent is `false`: the simple design's own two names, as every template
    // saved before the option existed renders them.
    host_sync_cover_names: design?.sync_cover_names ?? false,
    // The arch design's own two. Absent is the look every arch template
    // already has — round arches, names underneath — and a value this build
    // doesn't draw reads as that look too, which is what the showcase draws.
    host_photo_frame: resolvePhotoFrame(design?.photo_frame),
    host_caption_placement: resolveCaptionPlacement(design?.caption_placement),
  }
}

/**
 * The host-info choices travel as one config object, because they are one on
 * the wire: `frame_style` and `couple_ornament` are sibling keys on
 * `host_info_design` rather than fields of their own.
 *
 * The arch design's two are sent only when they say something, on any design:
 * absent already means round arches with the names underneath, so a template
 * that never touched them saves exactly the payload it always did, while one
 * that did keeps its choice through a switch to another design and back.
 */
export const buildHostInfoDesignPayload = (
  state: HostInfoDesignFormState,
): HostInfoDesignConfig => ({
  type: state.host_info_design_type,
  frame_style: state.host_frame_style,
  couple_ornament: state.host_couple_ornament,
  divider_style: state.host_divider_style,
  divider_scale: state.host_divider_scale,
  logo_scale: state.host_logo_scale,
  top_offset: state.host_top_offset,
  sync_cover_names: state.host_sync_cover_names,
  ...(state.host_photo_frame !== 'arch' && { photo_frame: state.host_photo_frame }),
  ...(state.host_caption_placement !== 'below' && {
    caption_placement: state.host_caption_placement,
  }),
})
