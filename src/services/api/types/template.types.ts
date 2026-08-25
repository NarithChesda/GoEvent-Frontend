/**
 * Event template type definitions
 */

export interface EventTemplateFont {
  id: number
  name: string
  font_file: string
}

export interface EventTemplateLanguageFont {
  id: number
  language: string
  language_display: string
  font: EventTemplateFont | null
  font_type: string
  font_type_display: string
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
   * Unset means "whatever this block used before free placement existed" —
   * primary for the header and guest name, secondary for the invite line.
   */
  fontType?: TemplateFontType
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
 *
 * Selected per template via `template_assets.event_details_design` and flows
 * through the showcase exactly like `falling_effect`.
 */
export type EventDetailsDesignType = 'panel' | 'calendar'

/**
 * Where the calendar design's event-day marker (the hand-drawn heart around the
 * date, and the matching tint on the day number) takes its colour from.
 *
 * Mirrors `FallingEffectConfig.color_source`. Defaults to `accent` so the marker
 * follows the template's own highlight colour instead of a fixed red that can
 * disappear against a red background.
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
   * Colour slot for the calendar design's event-day marker. Ignored by the
   * `panel` design. Defaults to `accent`.
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
 *
 * Selected per template via `template_assets.host_info_design` and flows through
 * the showcase exactly like `event_details_design`.
 */
export type HostInfoDesignType = 'standard' | 'simple'

/**
 * Configuration for the host information block on the showcase.
 *
 * Mirrors the `EventDetailsDesignConfig` pattern: a small JSON object sent inside
 * the template package and forwarded down to HostInfo.vue. When omitted the
 * showcase falls back to the `standard` design.
 */
export interface HostInfoDesignConfig {
  /** Which host info layout to render. Defaults to `standard`. */
  type: HostInfoDesignType
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
  /** Ambient creature effect config. Pass `null` to disable the effect. */
  ambient_creatures?: AmbientCreaturesConfig | null
  /** Drifting spark field config. Pass `null` to disable the effect. */
  sparks?: SparkFieldConfig | null
  /** Custom spark image. Pass a File to upload, or `''` to clear an existing one. */
  spark_custom_image?: File | ''
}

// Custom fonts (available via core-data endpoint)
export interface CustomFont {
  id: number
  name: string
  font_file: string
  created_at: string
  updated_at: string
}

// Template Color CRUD payloads
export interface CreateTemplateColorPayload {
  hex_color_code: string
  name: string
}

export type UpdateTemplateColorPayload = Partial<CreateTemplateColorPayload>

// Template Font types
export type TemplateFontType = 'primary' | 'secondary' | 'accent' | 'decorative'
export type TemplateLanguageCode = 'en' | 'kh' | 'fr' | 'ja' | 'ko' | 'zh-cn' | 'th' | 'vn'

// Nested font payload (font is an integer ID in create/update)
export interface CreateTemplateFontPayload {
  language: TemplateLanguageCode
  font: number
  font_type: TemplateFontType
}

export type UpdateTemplateFontPayload = Partial<CreateTemplateFontPayload>

// Label maps for display
export const FONT_TYPE_LABELS: Record<TemplateFontType, string> = {
  primary: 'Primary',
  secondary: 'Secondary',
  accent: 'Accent',
  decorative: 'Decorative',
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
