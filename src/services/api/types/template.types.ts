/**
 * Event template type definitions
 */

/**
 * A font from the shared library, as nested inside a template's font row.
 *
 * The four metric fields normalize how big the face *renders* at a given
 * `font-size`, which varies widely between typefaces and is what made a showcase
 * size tuned against one family land wrong on another. They describe the face
 * itself, so they live here — on the library record every template shares —
 * rather than on the per-template row. All are optional and default to unadjusted.
 *
 * See `src/utils/fontMetrics.ts` and
 * docs/backend-api-requirements/font-metric-normalization.md
 */
/**
 * Where a library font came from.
 *
 * - `system`   — curated by staff, visible to everyone while `is_active`
 * - `partner`  — uploaded by one partner, visible ONLY to them (and staff)
 *
 * A partner font never appears in another partner's library. It reaches the
 * public solely through that partner's own approved template, whose assets are
 * served by `public_template_assets`.
 */
export type CustomFontSource = 'system' | 'partner'

export interface EventTemplateFont {
  id: number
  name: string
  font_file: string
  source?: CustomFontSource
  source_display?: string
  is_active?: boolean
  /** Licence or provenance. Shown to the admin reviewing the template. */
  license_note?: string | null
  /** Uploader's user id; `null` for system fonts. */
  created_by?: number | null
  /** Whether the calling account uploaded this font, i.e. may edit or delete it. */
  is_owner?: boolean
  /** Glyph scale inside the em box. 1 = unchanged. CSS `size-adjust`. */
  size_adjust?: number | string | null
  /** Ascent as a fraction of the em. CSS `ascent-override`. */
  ascent_override?: number | string | null
  /** Descent as a fraction of the em. CSS `descent-override`. */
  descent_override?: number | string | null
  /** Line gap as a fraction of the em. CSS `line-gap-override`. */
  line_gap_override?: number | string | null
}

export interface EventTemplateLanguageFont {
  id: number
  language: string
  language_display: string
  /**
   * `null` means "no custom font assigned" — the showcase falls back to its own
   * system default for that language. A deleted library font also leaves rows
   * pointing at it in this state, so null is a normal steady state, not an error.
   *
   * On the parent template read (`/partner-templates/{id}/`) this is the full
   * font object. On the nested row endpoints (`/fonts/`) the API returns an
   * integer id here and expands the object under `font_detail` instead.
   */
  font: EventTemplateFont | null
  /** Only on the nested `/fonts/` endpoints, where `font` is an id. */
  font_detail?: EventTemplateFont | null
  font_type: string
  font_type_display: string
  /**
   * The partner's size trim for this template, multiplied onto the library's
   * `size_adjust`. 1 (the default) is exactly what the template rendered before
   * this field existed.
   *
   * Rows are already per language x font_type, so this is also how a template
   * says "Khmer a little smaller" without touching its English type.
   */
  size_scale?: number | string | null
}

export interface EventTemplateColor {
  id: number
  hex_color_code: string
  name: string
}

export interface EventTemplatePackagePlan {
  id: number
  name: string
  price: string
  commission: string
  features: string[]
  category?: {
    id: number
    name: string
    color: string
  }
}

export interface EventTemplate {
  id: number
  name: string
  package_plan: EventTemplatePackagePlan
  preview_image: string
  youtube_preview_url?: string
  template_colors: EventTemplateColor[]
  template_fonts: EventTemplateLanguageFont[]
  open_envelope_button?: string
  basic_decoration_photo?: string
  basic_background_photo?: string
  standard_cover_video?: string
  /** Standard mode's middle stage, used when the event has no `event_video` of its own. */
  standard_transition_video?: string
  standard_background_video?: string
  /** Primary sample logo (transparency). Rendered in the merged logo row when showCoverHeaderText is false. */
  sample_logo_1?: string | null
  /** Secondary sample logo (transparency). Overlaid on top of sample_logo_1 at the same position. */
  sample_logo_2?: string | null
  /** Header text rendered as an image (transparency). */
  header_text_image?: string | null
  created_at?: string
  updated_at?: string
}

export interface TemplateAssets {
  open_envelope_button?: string
  basic_decoration_photo?: string
  basic_background_photo?: string
  standard_cover_video?: string
  /** Standard mode's middle stage, used when the event has no `event_video` of its own. */
  standard_transition_video?: string
  standard_background_video?: string
  /** Primary sample logo (transparency). Rendered in the merged logo row when showCoverHeaderText is false. */
  sample_logo_1?: string | null
  /** Secondary sample logo (transparency). Overlaid on top of sample_logo_1 at the same position. */
  sample_logo_2?: string | null
  /** Header text rendered as an image (transparency). */
  header_text_image?: string | null
  ambient_creatures?: AmbientCreaturesConfig | null
  /** Drifting spark field. Absent = fall back to the legacy gilding fields. */
  sparks?: SparkFieldConfig | null
  [key: string]: unknown
}

/**
 * The four cover-stage blocks a template can place freely.
 *
 * Deliberately NOT the swipe arrow: that one is navigation chrome with a fixed
 * pixel size and its own responsive rules, and `swipeArrowBottom` already
 * positions it in both layout modes.
 */
export type CoverElementId = 'header' | 'logo' | 'invite' | 'guest'

/**
 * Where one cover block's text takes its colour from.
 *
 * Named palette slots rather than a bare hex, for the same reason `fontType`
 * names a font slot: the template's `template_colors` are the single source of
 * the palette, so recolouring a template keeps propagating to every block that
 * didn't deliberately opt out. `custom` + `customColor` is the escape hatch —
 * the same pair `FallingEffectConfig` / `AmbientCreaturesConfig` already use.
 */
export type CoverElementColorSource =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'guestname'
  | 'custom'

/**
 * One block's placement on the cover stage, in stage-relative percentages.
 *
 * The anchor is the block's CENTRE, not its top-left corner: the cover is a
 * centred composition, so a centre anchor keeps a block optically in place when
 * its width or height changes, and makes "put this on the middle axis" the
 * single value `x: 50` rather than a width-dependent calculation.
 *
 * Percentages (not px, not vh+vw mixed) because the cover stage always fills the
 * viewport: `x`/`width` are % of stage width, `y`/`height` are % of stage height
 * — the latter being numerically identical to vh, which is what the row model
 * already used.
 */
export interface CoverElementBox {
  /** Centre X as % of the cover stage width. 0 = left edge, 50 = middle. */
  x: number
  /** Centre Y as % of the cover stage height (equivalently, vh). */
  y: number
  /** Box width as % of the cover stage width. */
  width: number
  /** Box height as % of the cover stage height. */
  height: number
  /**
   * Multiplier on the block's own responsive font size. 1 (the default) is
   * exactly what the row model rendered, so an unset value never changes a
   * template's look. Ignored by `logo`, which has no text — that block's size
   * is its box.
   */
  fontScale?: number
  /**
   * Which of the template's font slots this block renders in.
   *
   * A slot name, never a font family string: `template_fonts` declares fonts
   * PER LANGUAGE (language + font_type), so a baked-in family would freeze the
   * cover to one script and the showcase's language switch would stop changing
   * the type. Naming the slot lets the existing per-language resolution in
   * useTemplateProcessor keep doing its job.
   *
   * `CoverFontSlot`, not the full `TemplateFontType`: the cover stage is a V1
   * construct and only V1's four slots are published as CSS variables for blocks
   * to inherit (`COVER_FONT_SLOT_VARS`). Naming a V2 slot here would resolve to
   * no variable at all and render the block in nothing.
   *
   * Unset means "whatever this block used before free placement existed" —
   * primary for the header and guest name, secondary for the invite line.
   */
  fontType?: CoverFontSlot
  /** Which palette slot the block's text colour comes from. Unset = unchanged. */
  colorSource?: CoverElementColorSource
  /** Hex colour, read only when `colorSource` is `custom`. */
  customColor?: string | null
}

/** Placement per block. Partial: any missing block falls back to the row model. */
export type CoverElementBoxes = Partial<Record<CoverElementId, CoverElementBox>>

/**
 * How the guest name's frame artwork is constructed.
 *
 * - `split`   — the original 3-piece frame: a fixed left cap, a middle that
 *               repeats horizontally to whatever width the name needs, and a
 *               fixed right cap. Suits art that tiles.
 * - `single`  — one image IS the whole frame, scaled as a unit. Suits a closed
 *               ornament (a flourish banner) that can't be cut into pieces.
 * - `corners` — corner ornaments placed at the box's four corners, with nothing
 *               drawn along the edges between them.
 *
 * The three styles read the SAME three upload slots rather than each having its
 * own, so switching styles never needs a backend field: `split` uses all three,
 * `single` uses `guest_title_frame_mid`, `corners` uses left + right. The
 * template form relabels the slots per style so the reuse isn't confusing.
 */
export type GuestFrameStyle = 'split' | 'single' | 'corners'

/**
 * Which uploaded slot one corner position draws, or `none` to leave it empty.
 *
 * Only two sources exist because corner art is symmetric under reflection: a
 * partner uploads a left-side and a right-side ornament and the flips below
 * cover the bottom two positions, so a full four-corner frame costs one or two
 * uploads rather than four.
 */
export type GuestFrameCornerSource = 'left' | 'right' | 'none'

export type GuestFrameCornerId = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'

/** One corner position: what it draws, and how it's mirrored. */
export interface GuestFrameCorner {
  source: GuestFrameCornerSource
  /** Mirror horizontally (`scaleX(-1)`). */
  flipX?: boolean
  /** Mirror vertically (`scaleY(-1)`). */
  flipY?: boolean
}

export type GuestFrameCorners = Partial<Record<GuestFrameCornerId, GuestFrameCorner>>

/**
 * Configuration for the guest name's frame.
 *
 * Lives inside `cover_stage_layout` alongside `layoutMode`/`coverElements` (same
 * JSON blob, same additive rules): a template carrying no `guestFrame` at all
 * resolves to the `split` style with today's geometry, so existing templates are
 * untouched.
 */
export interface GuestFrameConfig {
  /** Which artwork style renders. Default `split`. */
  style?: GuestFrameStyle
  /**
   * Multiplier on the frame artwork's size, independent of the text.
   *
   * Separate from `CoverElementBox.fontScale` (which scales the name AND, via
   * `--cover-font-scale`, its frame together): this one re-balances the frame
   * against the name it wraps, which every style needs since a partner's artwork
   * has its own idea of how much margin it leaves around the text. Default 1.
   */
  scale?: number
  /** Per-corner sources and flips. Read only when `style` is `corners`. */
  corners?: GuestFrameCorners
  /** Corner artwork width as % of the frame box width. Default 28. */
  cornerSize?: number
  /** How far each corner is pulled inward from the box edges, as % of box width. Default 0. */
  cornerInset?: number
}

/**
 * How the cover blocks are positioned.
 *
 * - `rows` — the original stacked model: one absolutely-positioned container
 *   (`contentTopPosition` + `innerContainerHeight`), inside which the four
 *   blocks are flex rows with percentage heights.
 * - `free` — each block is placed independently from `coverElements`. Blocks may
 *   overlap, sit anywhere on the stage, and carry their own text scale.
 */
export type CoverLayoutMode = 'rows' | 'free'

/**
 * Where the cover gilding's warm tint (its sparks, and the glow on its corner
 * flares) is sourced from. The travelling highlight itself is deliberately NOT
 * on this list: a polished surface's specular is near-white whatever the metal's
 * base hue, so tinting it to the palette would read as a coloured wash rather
 * than as light.
 */
export type CoverGildingColorSource = 'primary' | 'secondary' | 'accent' | 'custom'

/**
 * Overall strength of the cover's lighting. Scales the sweeps, the bevel shadow,
 * the corner flares and the sparks together, so a template picks one word rather
 * than balancing four numbers.
 */
export type CoverGildingIntensity = 'subtle' | 'normal' | 'bright'

/**
 * How far the four cover decorations sit off the plate behind them.
 *
 * Rendered as a two-pass `drop-shadow` on the decoration artwork — a zero-blur
 * offset that reads as the ornament's own thickness, then a far blurred one that
 * reads as height above the surface. Because it is `drop-shadow` and not
 * `box-shadow`, the shadow follows the PNG's alpha, so an ornament casts a
 * shadow of its own shape rather than of its bounding box.
 *
 * - `none`   — flat, exactly as decorations have always rendered.
 * - `soft`   — a restrained lift; the safe default over artwork of any brightness.
 * - `raised` — the reference artwork's own numbers: a pronounced extrude and a
 *              deep cast shadow. Reads well on a dark plate, heavy on a pale one.
 */
export type CoverDecorationRelief = 'none' | 'soft' | 'raised'

/**
 * Printed-gold lighting for the cover artwork — the effect that makes a flat
 * decoration photo read as an ornate border catching the light.
 *
 * Four layers on the same annulus around the artwork's edge (see
 * CoverGilding.vue): a fixed bevel shadow raking the band, two travelling
 * speculars at different speeds and angles, and pulsing flares on the four
 * corners. It is the same lighting model `TransitionStageDoor`'s frame already
 * uses, moved onto the cover so the two stages read as one lit surface rather
 * than as a flat cover handing off to a lit one.
 *
 * A fifth layer, the drifting sparks (CoverSparks.vue), is configured here but
 * deliberately does NOT live on the band: it is mounted by CoverStage and spans
 * every stage. See `sparkCount`.
 *
 * Opt-in per template (`enabled` defaults to false): it is lighting for artwork
 * that has a border to catch it, and a photo with no such border just gets a
 * diagonal sheen sliding over it.
 */
export interface CoverGildingConfig {
  /** Master switch. Default false — every existing template renders unchanged. */
  enabled?: boolean
  /**
   * Outer edge of the lit band, as % of the STAGE WIDTH (not of each side's own
   * axis, so the band stays a uniform width all the way round). Default 2.2.
   */
  bandOuter?: number
  /**
   * Inner edge of the lit band, same units. Everything between this and
   * `bandOuter` is lit; everything inside it is left alone. Default 6.9 — the
   * reference artwork's 74px on a 1080-wide plate. Ignored if it isn't larger
   * than `bandOuter`, which would invert the ring.
   */
  bandInner?: number
  /** Strength of every layer at once. Default `normal`. */
  intensity?: CoverGildingIntensity
  /**
   * Depth the four cover decorations sit at, lit from the same direction as the
   * band. Default `soft`.
   *
   * Applies to the decoration PNGs rather than to the band, so it is the one
   * part of this config that does something on a cover whose artwork is edge
   * pieces instead of a printed border.
   */
  decorationRelief?: CoverDecorationRelief
  /** Pulsing radial flares at the band's four corners. Default true. */
  cornerFlares?: boolean
  /**
   * @deprecated Superseded by `template_assets.sparks.count`.
   *
   * The spark field is its own decoration now (see `SparkFieldConfig`) rather
   * than a fifth gilding layer — it was never confined to the cover, and gating
   * it on `enabled` forced band lighting onto templates that only wanted
   * sparkle. Still read as the fallback for templates saved before the split,
   * so their covers render unchanged; new templates write `sparks` instead.
   */
  sparkCount?: number
  /**
   * Palette slot the corner glow takes its tint from. Default `accent`.
   *
   * Also the legacy fallback for the spark field's tint — see `sparkCount`.
   */
  colorSource?: CoverGildingColorSource
  /** Hex colour, read only when `colorSource` is `custom`. */
  customColor?: string | null
}

/**
 * Cover stage layout configuration
 * All values are optional with sensible defaults applied in components
 */
export interface CoverStageLayout {
  // Container positioning (vh units)
  contentTopPosition?: number       // default: 23.5
  innerContainerHeight?: number     // default: 53

  // Row heights (% of inner container)
  eventTitleHeight?: number         // default: 18.75
  logoHeight?: number               // default: 48
  inviteTextHeight?: number         // default: 8.75
  guestNameHeight?: number          // default: 16

  // Guest name max width as a percentage of the row container width (%)
  guestNameMaxWidthPercent?: number // default: 60

  // Render the welcome header text on the main (background) stage.
  showWelcomeHeaderText?: boolean   // default: true

  // Render the first host's name directly below the sample-logo avatar on the
  // main (background) stage. Currently honoured by HostInfoBirthday.
  showHostNameUnderLogo?: boolean   // default: false

  // Render the cover header text row on the cover stage. When false, the event
  // title row is hidden and its height is absorbed by the logo row so
  // sample_logo_1 / sample_logo_2 render in the merged space.
  showCoverHeaderText?: boolean     // default: true

  // Host image clipped into sample_logo_2's shape (merged logo row).
  // hostClipScale sets image size as % of the clip square (0–100).
  // hostClipOffsetX/Y pan the host photo within the clip square via CSS
  // object-position — use this to keep the face inside a head-region shape.
  // 0 = left/top edge, 50 = center, 100 = right/bottom edge.
  hostClipScale?: number            // default: 60
  hostClipOffsetX?: number          // default: 50
  hostClipOffsetY?: number          // default: 50

  // Swipe arrow positioning (vh units)
  swipeArrowBottom?: number         // default: 5

  // Decoration z-indexes
  leftDecorationZIndex?: number     // default: 24
  rightDecorationZIndex?: number    // default: 24
  topDecorationZIndex?: number      // default: 25
  bottomDecorationZIndex?: number   // default: 25

  // Animation settings
  showcaseAnimationType?: 'decoration' | 'door'  // default: 'decoration'

  // Printed-gold lighting over the cover artwork. Omitted = off, so every
  // existing template's cover renders exactly as before.
  coverGilding?: CoverGildingConfig

  // Main-content liquid glass card width. 'wide' grows the card toward the
  // viewport edges and shrinks its inner horizontal padding for more content width.
  contentWidth?: 'standard' | 'wide'  // default: 'standard'

  // How the four cover blocks are placed. Omitted (or 'rows') keeps every
  // existing template rendering exactly as before — the free model is opt-in.
  layoutMode?: CoverLayoutMode        // default: 'rows'

  // Free placement per block. Only read when layoutMode is 'free'; a block
  // missing from here falls back to the box the row model would have given it,
  // so a partially-authored free layout is still a complete one.
  //
  // Kept even while layoutMode is 'rows' so switching back and forth in the
  // template editor doesn't discard hand-placed positions.
  coverElements?: CoverElementBoxes

  // How the guest name's frame artwork is built. Omitted means the 3-piece
  // split frame with its original geometry — i.e. every existing template.
  guestFrame?: GuestFrameConfig
}

/**
 * Visual style used to render the event date + location block in EventInfo.
 *
 * - `panel`    — the default two-column framed panel: stacked weekday / day /
 *                month on the left, location on the right (the original look).
 * - `calendar` — a full month-grid calendar with the event day circled, with
 *                the location rendered below it.
 * - `flanked`  — engraved-invitation typography: weekday | day numeral | month
 *                on one baseline, split by vertical hairlines, year + time
 *                beneath. No card frame.
 * - `arch`     — the date set inside a hairline arch that draws itself on
 *                reveal, with the type sized to fill the arch.
 * - `ticket`   — an admit-one stub: a die-cut rounded card split by a dashed
 *                perforation, date on the stub, weekday/time + location beside it.
 *
 * Every design except `panel` needs a parseable `start_date`; without one the
 * showcase falls back to `panel`.
 *
 * `panel` and `ticket` set the venue themselves; `calendar`, `flanked` and
 * `arch` are date marks and hand it to the map card header instead.
 *
 * Selected per template via `template_assets.event_details_design` and flows
 * through the showcase exactly like `falling_effect`.
 */
export type EventDetailsDesignType = 'panel' | 'calendar' | 'flanked' | 'arch' | 'ticket'

/**
 * Where a date design's accent mark takes its colour from — the calendar's
 * hand-drawn heart (and the matching tint on the day number), the `flanked`
 * rules, the `arch` outline, the `ticket` perforation and stub numeral.
 *
 * Mirrors `FallingEffectConfig.color_source`. Defaults to `accent` so the mark
 * follows the template's own highlight colour instead of a fixed red that can
 * disappear against a red background. Ignored by `panel`, which has no accent mark.
 */
export type EventDetailsMarkerColorSource = 'accent' | 'primary' | 'secondary' | 'custom'

/**
 * Configuration for the event date + location block on the showcase.
 *
 * Mirrors the `FallingEffectConfig` pattern: a small JSON object sent inside
 * the template package and forwarded down to EventInfo.vue. When omitted the
 * showcase falls back to the `panel` design.
 */
export interface EventDetailsDesignConfig {
  /** Which date/location layout to render. Defaults to `panel`. */
  type: EventDetailsDesignType
  /**
   * Colour slot for the design's accent mark. Ignored by the `panel` design,
   * which has none. Defaults to `accent`.
   */
  marker_color_source?: EventDetailsMarkerColorSource
  /** Hex colour, read only when `marker_color_source` is `custom`. */
  marker_custom_color?: string | null
}

/**
 * Visual style used to render the host information block in HostInfo.
 *
 * - `standard` — the default rich layout: welcome header, parent names, logo,
 *                host titles, host names and profile pictures (the original look).
 * - `simple`   — a minimal layout: the welcome header above large script host
 *                names stacked and joined by an ampersand.
 * - `portrait` — the standard layout with one row moved: title, then portrait,
 *                then name, so the label introduces the person, the photo shows
 *                them and the name closes.
 * - `arch`     — the showcase-v2 couple-story composition: two arch-framed
 *                portraits staged on a diagonal with a drawn hairline between
 *                them, each host's title, name and parents stacked under their
 *                own frame instead of split across shared rows.
 *
 * `portrait` and `arch` are implemented by the **wedding** host layout only;
 * other event types ignore them and render `standard`.
 *
 * Selected per template via `template_assets.host_info_design` and flows through
 * the showcase exactly like `event_details_design`.
 */
export type HostInfoDesignType = 'standard' | 'simple' | 'portrait' | 'arch'

/**
 * Configuration for the host information block on the showcase.
 *
 * Mirrors the `EventDetailsDesignConfig` pattern: a small JSON object sent inside
 * the template package and forwarded down to HostInfo.vue. When omitted the
 * showcase falls back to the `standard` design.
 */
/**
 * Chrome drawn around the host's title *and* around their avatar — one choice,
 * two renderings, so the pair can never be mismatched.
 *
 * Each style is a matched set in one visual language, not a title treatment and
 * an avatar treatment picked independently:
 *
 * - `none`   — the default: plain title text over a plain circular avatar.
 *              Every template that predates this field renders here, unchanged.
 * - `banner` — the title on a filled banner with notched ends; the avatar in a
 *              thick ring of the same fill with a small gem at its crown. The
 *              solid, high-contrast option.
 * - `plaque` — the title in a hairline double rule with cut corners; the avatar
 *              in a double hairline ring. Engraved and quiet — the one that
 *              rhymes with the `engraved` save-the-date and the `arch` /
 *              `flanked` date designs.
 * - `ribbon` — the title on a band with folded tails either side; the avatar
 *              ring with two tails at its foot. Wedding stationery.
 * - `laurel` — the title flanked by two sprigs; the avatar ring with laurel
 *              sweeping its lower half. The most ornament of the four.
 *
 * Rendered by the **grid** host layouts (`standard` and `portrait`). `arch`
 * draws its own frames and `simple` has neither a title nor an avatar, so both
 * ignore this.
 */
export type HostFrameStyle = 'none' | 'banner' | 'plaque' | 'ribbon' | 'laurel'

/**
 * The motif in the centre column between the two hosts — the empty
 * `.center-spacer` track that the grid has always had and never filled.
 *
 * Defaults to `none`, which is the empty spacer as before.
 */
export type CoupleOrnament = 'none' | 'heart' | 'rings' | 'knot' | 'bloom'

export interface HostInfoDesignConfig {
  /** Which host info layout to render. Defaults to `standard`. */
  type: HostInfoDesignType
  /**
   * Frame chrome shared by the host title and the avatar. Defaults to `none`.
   *
   * A sibling key rather than a field of its own: this config was deliberately
   * kept an object so design options could be added without a breaking change
   * (see docs/backend-api-requirements/host-info-design.md), and this is the
   * first one to take that path.
   */
  frame_style?: HostFrameStyle
  /** Motif drawn between the two hosts. Defaults to `none`. */
  couple_ornament?: CoupleOrnament
}

/**
 * Visual language of the info card below the date — the block that carries the
 * venue, the Google Map, the countdown and the RSVP form.
 *
 * - `glass`    — the default: a rounded liquid-glass panel with a 2px white
 *                border, a tinted translucent fill and white text throughout.
 * - `engraved` — the same content set as engraved type on the page ground:
 *                hairline rules instead of a card frame, everything inked in
 *                the template's primary colour, and a hairline-framed map
 *                plate. Built to sit under the `calendar` / `flanked` / `arch`
 *                date designs, which are drawn in the same language — the glass
 *                panel reads as a different material stacked under them.
 *
 * Selected per template via `template_assets.info_card_design` and flows through
 * the showcase exactly like `event_details_design`.
 */
export type InfoCardDesignType = 'glass' | 'engraved'

/**
 * Configuration for the venue / map / countdown / RSVP card on the showcase.
 *
 * Mirrors the `HostInfoDesignConfig` pattern: a small JSON object sent inside
 * the template package and forwarded down to EventInfo.vue. When omitted the
 * showcase falls back to the `glass` design, so existing templates are unchanged.
 */
export interface InfoCardDesignConfig {
  /** Which info card treatment to render. Defaults to `glass`. */
  type: InfoCardDesignType
}

/**
 * Composition used for the **Save the Date** title card on the transition
 * stage — the block that carries the label and the event date over the
 * featured photograph, between the cover and the invitation.
 *
 * Both transition stages render the same six designs. Each one owns a distinct
 * *composition* and a distinct reveal *gesture*, not just a restyle:
 *
 * - `script`    — the decoration stage's original: an italic script label
 *                 blooming in letter by letter between two fine hairlines that
 *                 draw outward from centre, with the long date tracked out
 *                 beneath it.
 * - `engraved`  — the door stage's original: ornament rules top and bottom
 *                 bracketing a tracked uppercase label, a large `DD · MM · YYYY`
 *                 numeral as the hero, and the long date under it, every line
 *                 arriving on a centre-out wipe.
 * - `minimal`   — no rules, no ornament: a small tracked label over the long
 *                 date set large in the display serif, both on one short
 *                 rise-and-fade. For templates whose photograph is the hero.
 * - `columns`   — a large day flanked by the month and year as tracked-caps
 *                 labels, divided by vertical hairlines that draw downward,
 *                 under a tracked eyebrow with the weekday closing beneath.
 *                 Laid out on the same flanked grid as the info card's
 *                 `flanked` date, so the row is centred on the day rather than
 *                 on its own total width.
 * - `medallion` — a drawn hairline ring with the day numeral inside it, the
 *                 month and year tracked below and the label above: a crest
 *                 rather than a frame.
 * - `poster`    — `SAVE` / `THE DATE` stacked large at tight leading, each line
 *                 mask-revealed from below, with the numeric date small beneath
 *                 a hairline. The one design that isn't wedding-coded.
 *
 * Absent / `null` falls back to **whichever design that stage shipped with** —
 * `script` for the decoration transition, `engraved` for the door transition —
 * so every already-published template renders exactly as it does today. That
 * per-stage fallback is the one way this config differs from
 * `host_info_design`, which has a single global default.
 *
 * Selected per template via `template_assets.save_the_date_design` and flows
 * through the showcase exactly like `host_info_design`.
 */
export type SaveTheDateDesignType =
  | 'script'
  | 'engraved'
  | 'minimal'
  | 'columns'
  | 'medallion'
  | 'poster'

/**
 * Configuration for the Save the Date title card on the transition stage.
 *
 * Mirrors the `HostInfoDesignConfig` pattern: a small JSON object sent inside
 * the template package and forwarded down to both TransitionStage.vue and
 * TransitionStageDoor.vue. When omitted each stage keeps its own original
 * design (see `SaveTheDateDesignType`).
 */
export interface SaveTheDateDesignConfig {
  /** Which Save the Date composition to render. Defaults per stage. */
  type: SaveTheDateDesignType
}

/**
 * How one showcase stage presents itself: built from artwork and animated, or
 * a film.
 *
 * One vocabulary for all three stages, because it is one question asked three
 * times. What each value draws depends on the stage:
 *
 * | stage        | `animation`                                        | `video` |
 * |--------------|----------------------------------------------------|---------|
 * | `cover`      | the decoration photo, exited by the cover animation | `standard_cover_video` looping full-bleed |
 * | `transition` | the Save the Date card over the featured photograph | the event's `event_video`, else `standard_transition_video`, full screen |
 * | `background` | `basic_background_photo` → template colour → white  | `standard_background_video` looping |
 *
 * A stage whose asset is missing degrades rather than breaking: an `animation`
 * middle beat on an event with no featured photo makes the cover's own exit the
 * whole beat, and a `video` one with no film skips it — which is what those
 * events already do today.
 */
export type StageMode = 'animation' | 'video'

/**
 * Per-stage presentation modes — which stage is animated and which plays a
 * film — declared by the template.
 *
 * Before this existed the showcase inferred all three from asset presence and
 * event category: a `standard_cover_video` meant "standard package" and
 * switched the cover, the middle beat *and* the main backdrop to video
 * together, while the animated middle beat was hard-limited to the wedding
 * category. That coupling is what this config replaces. The package plan is a
 * **pricing** decision and decides nothing here: any plan may put any mode on
 * any stage.
 *
 * **Every key is optional and absent means "infer it from the assets"**, so a
 * template that carries no `stage_modes` renders as it did before:
 *
 * | resolved     | fallback inference                                        |
 * |--------------|-----------------------------------------------------------|
 * | `cover`      | `standard_cover_video` present → `video`, else `animation` |
 * | `transition` | follows the resolved cover                                |
 * | `background` | `standard_background_video` present, or cover is `video` → `video`, else `animation` |
 *
 * See `resolveStageModes` in src/composables/showcase/useStageModes.ts — the
 * one place that table is implemented — and
 * docs/backend-api-requirements/stage-modes.md for the pending backend field.
 */
export interface StageModesConfig {
  /** Cover stage. Absent = inferred from `standard_cover_video`. */
  cover?: StageMode | null
  /** Middle beat. Absent = follows the cover. */
  transition?: StageMode | null
  /** Main content backdrop. Absent = inferred from `standard_background_video`. */
  background?: StageMode | null
}

/**
 * Built-in falling particle effect types.
 * Each maps to a predefined SVG shape in the particle registry.
 */
export type FallingEffectType =
  | 'petals'
  | 'confetti'
  | 'snowflakes'
  | 'stars'
  | 'leaves'
  | 'maple'
  | 'hearts'
  | 'none'

/**
 * Configuration for the falling particle effect on the showcase main stage.
 *
 * Supports two rendering modes:
 * 1. **Built-in SVG shapes** — set `type` to a preset (petals, confetti, etc.)
 * 2. **Custom image** — set `custom_image` to a URL of a transparent PNG/SVG
 *    uploaded via the template. When `custom_image` is set, `type` is ignored
 *    for rendering but still useful for labeling/categorization.
 *
 * Recommended custom image specs:
 * - Format: PNG with transparency or SVG
 * - Size: 64×64 px to 128×128 px
 * - File size: under 20 KB for performance
 */
export interface FallingEffectConfig {
  /** Which built-in particle shape to use (ignored when custom_image is set) */
  type: FallingEffectType
  /** URL to a custom particle image — overrides the built-in SVG shape */
  custom_image?: string | null
  /** Where to source the particle color (only applies to built-in SVG shapes) */
  color_source?: 'primary' | 'accent' | 'custom'
  /** Hex color when color_source is 'custom' */
  custom_color?: string | null
  /** Controls spawn rate and max particles on screen */
  intensity?: 'light' | 'normal' | 'heavy'
  /**
   * Fall-speed multiplier. `1` (the default when omitted) is the speed the
   * effect has always run at, so every existing template keeps its exact look.
   * Above 1 the particles fall faster, below 1 they float. Clamped to
   * FALLING_SPEED_RANGE on read — see useFallingParticles.
   *
   * Deliberately independent of `intensity`: intensity is how MANY particles
   * are on screen, speed is how fast each one crosses it. The composable
   * rescales the spawn interval by the same factor so changing speed alone
   * doesn't thin out or crowd the field.
   */
  speed?: number | null
}

/**
 * Built-in spark shapes.
 *
 * `glow` is the original mote — a soft radial gradient with no edge, which is
 * what the field has always drawn — so a template that names no shape keeps
 * rendering exactly as before. The rest are drawn shapes with real geometry,
 * for covers that want a sharper glint than a blur can give.
 */
export type SparkShape = 'glow' | 'star' | 'sparkle' | 'diamond' | 'cross' | 'dot'

/**
 * Where the spark field takes its tint from. Same slot names as
 * `CoverGildingColorSource`, because the sparks used to read the gilding's
 * value and a template's stored choice has to keep meaning what it meant.
 */
export type SparkColorSource = 'primary' | 'secondary' | 'accent' | 'custom'

/**
 * The drifting, blinking motes that span every showcase stage.
 *
 * Previously configured inside `CoverGildingConfig` (as `sparkCount` /
 * `colorSource` / `customColor`), which tied the field to a cover-band lighting
 * effect it never actually belonged to: sparks are mounted by CoverStage for the
 * life of the showcase and drift on through the transition into the main
 * content, so gating them on `coverGilding.enabled` meant a template that wanted
 * ambient sparkle had to switch on band lighting it may have had no border to
 * catch. This is the same standalone shape `falling_effect` and
 * `ambient_creatures` already have.
 *
 * Legacy templates keep working: when `template_assets.sparks` is absent the
 * showcase falls back to the gilding fields, so nothing that renders today
 * changes. See `resolveSparkField`.
 */
export interface SparkFieldConfig {
  /** Master switch. When omitted the legacy gilding fallback decides. */
  enabled?: boolean
  /** How many motes. 0 turns the field off. Default 18, max 60. */
  count?: number
  /**
   * Blink rate multiplier. `1` is the original 12-second pulse cycle; above 1
   * blinks faster, below 1 slower. Clamped to SPARK_BLINK_SPEED_RANGE.
   */
  blink_speed?: number | null
  /**
   * Mote size range, as a % of the stage width — the same units the rest of the
   * cover geometry uses, so a spark keeps its proportions on any screen rather
   * than being a fixed pixel size tuned for one. Defaults 0.46 / 1.94, the
   * reference artwork's 5px–21px on its 1080-wide plate.
   */
  min_size?: number | null
  max_size?: number | null
  /** Which built-in shape to draw (ignored when `custom_image` is set). */
  shape?: SparkShape
  /** URL of a custom mote image — overrides the built-in shape. */
  custom_image?: string | null
  /** Palette slot the motes take their tint from. Default `accent`. */
  color_source?: SparkColorSource
  /** Hex colour, read only when `color_source` is `custom`. */
  custom_color?: string | null
  /** Overall brightness. Default `normal`. */
  intensity?: 'subtle' | 'normal' | 'bright'
}

/**
 * Ambient creature types available for the cover stage effect.
 * Each maps to a pure SVG creature with animated wings/glow.
 */
export type AmbientCreatureEffectType = 'butterfly' | 'dove' | 'firefly' | 'dragonfly' | 'balloon' | 'hummingbird'

/**
 * A single creature entry in the ambient creatures configuration.
 * Defines which creature type to include, its relative spawn weight,
 * and optional size overrides.
 */
export interface AmbientCreatureEntry {
  /** Which creature SVG to render */
  type: AmbientCreatureEffectType
  /** Relative spawn weight (1–10). Higher = more of this type in the mix. Default: 1 */
  weight?: number
  /** Minimum creature size in pixels. Overrides built-in default when set. */
  min_size?: number | null
  /** Maximum creature size in pixels. Overrides built-in default when set. */
  max_size?: number | null
}

/**
 * Configuration for ambient creature animations on the cover stage.
 *
 * Controls which creature types appear, their proportions, sizes, count,
 * speed, and color. The `creatures` array defines a weighted spawn pool —
 * each entry's `weight` determines how frequently that type is chosen.
 *
 * Example: `{ creatures: [{ type: "butterfly", weight: 2 }, { type: "firefly", weight: 3 }], count: 6 }`
 * creates a pool of ~2 butterflies and ~3 fireflies out of 6 total.
 */
export interface AmbientCreaturesConfig {
  /** Which creature types to include and their configuration. At least one entry required. */
  creatures: AmbientCreatureEntry[]
  /** Total number of creatures to spawn on screen (1–15). Default: 6 */
  count?: number
  /** Global flight speed preset. Default: 'normal' */
  speed?: 'slow' | 'normal' | 'fast'
  /** Which template color to use for SVG creature fill. Default: 'accent' */
  color_source?: 'primary' | 'accent' | 'custom'
  /** Hex color when color_source is 'custom' */
  custom_color?: string | null
}

export interface PackagePlan {
  id: number
  name: string
  description: string
  price: string
  commission: string
  features: string[]
  is_active: boolean
  category?: {
    id: number
    name: string
    color: string
  }
}

export interface BrowseTemplatesResponse {
  message: string
  templates: EventTemplate[]
}

// Partner Template types
export type PartnerTemplateStatus = 'draft' | 'pending_review' | 'approved' | 'rejected'

export interface PartnerTemplate {
  id: number
  name: string
  package_plan: EventTemplatePackagePlan | null
  template_type: 'partner'
  status: PartnerTemplateStatus
  status_display: string
  created_by: number
  created_by_name: string
  admin_notes: string
  reviewed_by: number | null
  reviewed_at: string | null
  preview_image: string | null
  youtube_preview_url: string | null
  template_colors: EventTemplateColor[]
  template_fonts: EventTemplateLanguageFont[]
  cover_stage_layout: CoverStageLayout | null
  falling_effect: FallingEffectConfig | null
  event_details_design: EventDetailsDesignConfig | null
  host_info_design: HostInfoDesignConfig | null
  info_card_design: InfoCardDesignConfig | null
  save_the_date_design: SaveTheDateDesignConfig | null
  /** Per-stage animation/video modes. Null = infer from assets + category. */
  stage_modes: StageModesConfig | null
  ambient_creatures: AmbientCreaturesConfig | null
  sparks: SparkFieldConfig | null
  /** Custom spark image, when the field uses one instead of a built-in shape. */
  spark_custom_image: string | null
  display_liquid_glass_background: boolean
  open_envelope_button: string | null
  basic_decoration_photo: string | null
  basic_background_photo: string | null
  top_decoration: string | null
  bottom_decoration: string | null
  left_decoration: string | null
  right_decoration: string | null
  cover_top_decoration: string | null
  cover_bottom_decoration: string | null
  cover_left_decoration: string | null
  cover_right_decoration: string | null
  guest_title_frame_left: string | null
  guest_title_frame_mid: string | null
  guest_title_frame_right: string | null
  standard_cover_video: string | null
  standard_transition_video: string | null
  standard_background_video: string | null
  sample_logo_1: string | null
  sample_logo_2: string | null
  header_text_image: string | null
  created_at: string
  updated_at: string
}

/**
 * A file field on the way to the server. `File` uploads, `''` deletes whatever
 * is stored, and omitting the key leaves the stored file alone — the three
 * states the template editor needs to distinguish (see TEMPLATE_FILE_FIELDS in
 * templates.service.ts).
 */
type TemplateFileUpload = File | ''

export interface PartnerTemplateCreatePayload {
  name: string
  package_plan_id?: number | null
  preview_image?: TemplateFileUpload
  youtube_preview_url?: string
  basic_background_photo?: TemplateFileUpload
  basic_decoration_photo?: TemplateFileUpload
  top_decoration?: TemplateFileUpload
  bottom_decoration?: TemplateFileUpload
  left_decoration?: TemplateFileUpload
  right_decoration?: TemplateFileUpload
  cover_top_decoration?: TemplateFileUpload
  cover_bottom_decoration?: TemplateFileUpload
  cover_left_decoration?: TemplateFileUpload
  cover_right_decoration?: TemplateFileUpload
  guest_title_frame_left?: TemplateFileUpload
  guest_title_frame_mid?: TemplateFileUpload
  guest_title_frame_right?: TemplateFileUpload
  standard_cover_video?: TemplateFileUpload
  standard_transition_video?: TemplateFileUpload
  standard_background_video?: TemplateFileUpload
  sample_logo_1?: TemplateFileUpload
  sample_logo_2?: TemplateFileUpload
  header_text_image?: TemplateFileUpload
  display_liquid_glass_background?: boolean
  open_envelope_button?: TemplateFileUpload
  cover_stage_layout?: CoverStageLayout
  /** Falling particle effect config. Pass `null` to disable the effect. */
  falling_effect?: FallingEffectConfig | null
  /** Custom particle image. Pass a File to upload, or `''` to clear an existing one. */
  falling_effect_custom_image?: File | ''
  /** Event date/location block design. Pass `null` to fall back to the `panel` design. */
  event_details_design?: EventDetailsDesignConfig | null
  /** Host info block design. Pass `null` to fall back to the `standard` design. */
  host_info_design?: HostInfoDesignConfig | null
  /** Info card (venue/map/countdown/RSVP) design. Pass `null` to fall back to `glass`. */
  info_card_design?: InfoCardDesignConfig | null
  /** Transition-stage Save the Date design. Pass `null` to keep each stage's own default. */
  save_the_date_design?: SaveTheDateDesignConfig | null
  /** Per-stage animation/video modes. Pass `null` to fall back to the legacy inference. */
  stage_modes?: StageModesConfig | null
  /** Ambient creature effect config. Pass `null` to disable the effect. */
  ambient_creatures?: AmbientCreaturesConfig | null
  /** Drifting spark field config. Pass `null` to disable the effect. */
  sparks?: SparkFieldConfig | null
  /** Custom spark image. Pass a File to upload, or `''` to clear an existing one. */
  spark_custom_image?: File | ''
}

// Custom fonts (available via core-data endpoint)
/**
 * The font library list endpoint's row. Carries the same metric normalization as
 * `EventTemplateFont` — it is the same record, read from the library rather than
 * through a template — so the studio can calibrate against it before a font has
 * ever been attached to a template.
 */
export interface CustomFont {
  id: number
  name: string
  font_file: string
  created_at: string
  updated_at: string
  source: CustomFontSource
  source_display: string
  is_active: boolean
  license_note: string | null
  created_by: number | null
  /** True when the caller uploaded it — the only fonts they may edit or delete. */
  is_owner: boolean
  size_adjust?: number | string | null
  ascent_override?: number | string | null
  descent_override?: number | string | null
  line_gap_override?: number | string | null
}

/** Filters accepted by the font library list endpoint. */
export interface CustomFontQuery {
  source?: CustomFontSource
  /** `true` narrows to the caller's own uploads. */
  mine?: boolean
  search?: string
  /** `name` or `created_at`, prefix `-` to reverse. */
  ordering?: string
}

/**
 * A font upload. Sent as multipart, never JSON — `font_file` is a real file.
 *
 * `source` and `created_by` are stamped by the server from the caller's account
 * and are read-only, so they are deliberately absent here: a partner's upload
 * becomes a partner font, a staff upload becomes a system font, and the client
 * gets no say in it.
 */
export interface CreateCustomFontPayload {
  name: string
  font_file: File
  license_note?: string
  is_active?: boolean
}

/** Any subset of the above. Omitting `font_file` leaves the stored file alone. */
export type UpdateCustomFontPayload = Partial<CreateCustomFontPayload>

// Template Color CRUD payloads
export interface CreateTemplateColorPayload {
  hex_color_code: string
  name: string
}

export type UpdateTemplateColorPayload = Partial<CreateTemplateColorPayload>

// Template Font types
/**
 * `v2-body` and `v2-display` are the scroll-story showcase's own slots, kept
 * separate from V1's four so a template's V1 type never leaks into V2 by
 * accident (see `V2_FONT_TYPES` in composables/showcase-v2/v2Theme.ts). They
 * became valid backend enum values in the Aug 2026 font-library release; the
 * request that asked for them is docs/backend-api-requirements/showcase-v2-theming.md.
 */
export type TemplateFontType =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'decorative'
  | 'v2-body'
  | 'v2-display'

/**
 * The font slots a V1 cover block may name.
 *
 * V1's four only. The V2 slots are real `font_type` values on a template row, but
 * the cover stage doesn't exist in V2 and doesn't publish variables for them, so
 * they are not selectable here.
 */
export type CoverFontSlot = Extract<
  TemplateFontType,
  'primary' | 'secondary' | 'accent' | 'decorative'
>
export type TemplateLanguageCode = 'en' | 'kh' | 'fr' | 'ja' | 'ko' | 'zh-cn' | 'th' | 'vn'

// Nested font payload (font is an integer ID in create/update)
export interface CreateTemplateFontPayload {
  language: TemplateLanguageCode
  /**
   * A font id from the caller's visible library — an active system font, or one
   * they uploaded. `null` assigns no custom font and lets the showcase use its
   * own default for that language.
   */
  font: number | null
  font_type: TemplateFontType
  /** Size trim for this row. Omitted when 1, so an untouched row sends nothing new. */
  size_scale?: number
}

export type UpdateTemplateFontPayload = Partial<CreateTemplateFontPayload>

// Label maps for display
export const FONT_TYPE_LABELS: Record<TemplateFontType, string> = {
  primary: 'Primary',
  secondary: 'Secondary',
  accent: 'Accent',
  decorative: 'Decorative',
  'v2-body': 'Scroll story body',
  'v2-display': 'Scroll story display',
}

export const LANGUAGE_CODE_LABELS: Record<TemplateLanguageCode, string> = {
  en: 'English',
  kh: 'Khmer',
  fr: 'French',
  ja: 'Japanese',
  ko: 'Korean',
  'zh-cn': 'Chinese (Simplified)',
  th: 'Thai',
  vn: 'Vietnamese',
}

export interface SubmitForReviewResponse {
  message: string
  template: PartnerTemplate
}
