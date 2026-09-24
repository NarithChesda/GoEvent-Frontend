import { describe, expect, it } from 'vitest'
import type { PartnerTemplate } from '@/services/api'

import { buildConfigPayload, defaultForm, hydrateForm, type FormState } from './index'

/**
 * The editor's save/reload contract, tested without mounting the component.
 *
 * This is the reason the config modules exist. Every one of these assertions
 * used to require rendering a 5,500-line SFC, so in practice none of them was
 * made, and the round trip — default → hydrate → serialize → hydrate — was only
 * ever exercised by hand against a live backend. A config whose hydration and
 * serialization disagreed would lose a partner's setting silently on reload.
 */

/** A saved template with nothing configured — every config null, as the API sends. */
function blankTemplate(overrides: Partial<PartnerTemplate> = {}): PartnerTemplate {
  return {
    id: 1,
    name: 'Blank',
    package_plan: null,
    template_type: 'partner',
    status: 'draft',
    status_display: 'Draft',
    created_by: 1,
    created_by_name: 'Tester',
    admin_notes: '',
    reviewed_by: null,
    reviewed_at: null,
    preview_image: null,
    youtube_preview_url: null,
    template_colors: [],
    template_fonts: [],
    cover_stage_layout: null,
    falling_effect: null,
    event_details_design: null,
    host_info_design: null,
    info_card_design: null,
    agenda_design: null,
    dress_code_design: null,
    save_the_date_design: null,
    stage_modes: null,
    text_effects: null,
    ambient_creatures: null,
    sparks: null,
    spark_custom_image: null,
    host_divider_image: null,
    display_liquid_glass_background: true,
    open_envelope_button: null,
    basic_decoration_photo: null,
    basic_background_photo: null,
    top_decoration: null,
    bottom_decoration: null,
    left_decoration: null,
    right_decoration: null,
    cover_top_decoration: null,
    cover_bottom_decoration: null,
    cover_left_decoration: null,
    cover_right_decoration: null,
    guest_title_frame_left: null,
    guest_title_frame_mid: null,
    guest_title_frame_right: null,
    standard_cover_video: null,
    standard_transition_video: null,
    standard_background_video: null,
    sample_logo_1: null,
    sample_logo_2: null,
    header_text_image: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

/**
 * The template a save would produce from this form state — the configs it sends,
 * folded back onto a saved record. This is what the editor reopens.
 */
function savedAs(form: FormState, overrides: Partial<PartnerTemplate> = {}): PartnerTemplate {
  return blankTemplate({
    name: form.name,
    display_liquid_glass_background: form.display_liquid_glass_background,
    ...buildConfigPayload(form),
    ...overrides,
  })
}

describe('partner template form config round trip', () => {
  it('hydrates a blank form for no template', () => {
    expect(hydrateForm(null)).toEqual(defaultForm())
  })

  it('reads a template that has no config at all as the defaults', () => {
    const hydrated = hydrateForm(blankTemplate())
    const fresh = defaultForm()
    // Name and the scalar columns do come off the record; every config falls back.
    expect(hydrated.host_info_design_type).toBe(fresh.host_info_design_type)
    expect(hydrated.agenda_design_type).toBe(fresh.agenda_design_type)
    expect(hydrated.dress_code_design_type).toBe(fresh.dress_code_design_type)
    expect(hydrated.info_card_design_type).toBe(fresh.info_card_design_type)
    expect(hydrated.save_the_date_design_type).toBe('auto')
    expect(hydrated.guest_invite_design_type).toBe('none')
    expect(hydrated.text_effects).toEqual(fresh.text_effects)
    expect(hydrated.falling_effect_enabled).toBe(false)
    expect(hydrated.ambient_creatures_enabled).toBe(false)
  })

  /**
   * The whole point. Saving a template and reopening it must land on the state
   * the partner left it in — for every config at once, not one at a time.
   */
  it('survives save and reload unchanged', () => {
    const edited: FormState = {
      ...defaultForm(),
      name: 'Round Trip',
      host_info_design_type: 'crest',
      host_frame_style: 'laurel',
      host_couple_ornament: 'bloom',
      host_divider_style: 'flourish',
      host_divider_scale: 72,
      host_logo_scale: 130,
      host_top_offset: -2,
      host_sync_cover_names: true,
      agenda_design_type: 'thread',
      dress_code_design_type: 'atelier',
      info_card_design_type: 'engraved',
      save_the_date_design_type: 'engraved',
      guest_invite_design_type: 'place_card',
      event_details_design_type: 'calendar',
      event_details_marker_color_source: 'custom',
      event_details_marker_custom_color: '#123456',
      stage_mode_cover: 'video',
      stage_mode_transition: 'none',
      stage_mode_background: 'video',
      falling_effect_enabled: true,
      ambient_creatures_enabled: true,
      sparks_enabled: true,
    }
    edited.falling_effect.type = 'maple'
    edited.falling_effect.color_source = 'custom'
    edited.falling_effect.custom_color = '#ABCDEF'
    edited.ambient_creatures.count = 9
    edited.ambient_creatures.speed = 'fast'
    edited.sparks.count = 40
    edited.sparks.shape = 'star'
    edited.text_effects.primary = { finish: 'relief', metal: 'silver', animation: 'shimmer' }

    const reopened = hydrateForm(savedAs(edited))

    // Compared through the builders rather than field by field: this asserts
    // that what a second save would send is byte-identical to the first, which
    // is the property that actually matters and the one a per-field check on a
    // list somebody maintains by hand keeps missing.
    expect(buildConfigPayload(reopened)).toEqual(buildConfigPayload(edited))
  })

  it('keeps every stage mode a template declared', () => {
    const form = { ...defaultForm(), stage_mode_transition: 'none' as const }
    const reopened = hydrateForm(savedAs(form))
    expect(reopened.stage_mode_transition).toBe('none')
  })

  describe('values that are deliberately not stored as themselves', () => {
    it('persists the Save the Date "auto" choice as null, and reads it back as auto', () => {
      const form = { ...defaultForm(), save_the_date_design_type: 'auto' as const }
      expect(buildConfigPayload(form).save_the_date_design).toBeNull()
      expect(hydrateForm(savedAs(form)).save_the_date_design_type).toBe('auto')
    })

    /**
     * The guest dedication is additive: off draws no block, so it has to reach
     * the server as an explicit null (absent would mean "leave it alone") and
     * come back as off — never as a design nobody chose.
     */
    it('persists the guest dedication "none" as null, and reads it back as none', () => {
      const form = { ...defaultForm(), guest_invite_design_type: 'none' as const }
      expect(buildConfigPayload(form).guest_invite_design).toBeNull()
      expect(hydrateForm(savedAs(form)).guest_invite_design_type).toBe('none')
    })

    it('reads a guest dedication design this build does not know as inscribed', () => {
      const template = blankTemplate({
        guest_invite_design: { type: 'envelope' } as unknown as PartnerTemplate['guest_invite_design'],
      })
      // Switched on by the partner, so it opens on the design the showcase
      // draws for it rather than as "off", which a save would then persist.
      expect(hydrateForm(template).guest_invite_design_type).toBe('inscribed')
    })

    it('sends sparks off as an explicit enabled:false, never as null', () => {
      const payload = buildConfigPayload({ ...defaultForm(), sparks_enabled: false })
      // Null would be read as "no standalone config", which falls back to the
      // cover gilding's legacy spark fields and turns them back on.
      expect(payload.sparks).not.toBeNull()
      expect(payload.sparks.enabled).toBe(false)
    })

    it('sends no text_effects at all when no slot carries a finish', () => {
      expect(buildConfigPayload(defaultForm()).text_effects).toBeNull()
    })

    it('drops the calendar marker colour when the design is a panel', () => {
      const payload = buildConfigPayload({
        ...defaultForm(),
        event_details_design_type: 'panel',
        event_details_marker_color_source: 'custom',
        event_details_marker_custom_color: '#FF0000',
      })
      expect(payload.event_details_design).toEqual({ type: 'panel' })
    })

    it('keeps a custom colour only while the source is custom', () => {
      const base = { ...defaultForm(), falling_effect_enabled: true }
      base.falling_effect.color_source = 'primary'
      base.falling_effect.custom_color = '#FF0000'
      expect(buildConfigPayload(base).falling_effect).not.toHaveProperty('custom_color')

      base.falling_effect.color_source = 'custom'
      expect(buildConfigPayload(base).falling_effect).toHaveProperty('custom_color', '#FF0000')
    })

    it('swaps an inverted spark size range rather than storing it backwards', () => {
      const form = { ...defaultForm(), sparks_enabled: true }
      form.sparks.min_size = 9
      form.sparks.max_size = 2
      const { sparks } = buildConfigPayload(form)
      expect(sparks.min_size).toBe(2)
      expect(sparks.max_size).toBe(9)
    })
  })

  /**
   * The regression that prompted the refactor: the save payload and the live
   * preview draft each built their own configs, and three of them were inline
   * literals duplicated across the two. They share one builder now, so this
   * guards the property that made that duplication safe-looking — every config
   * the preview renders is a key this function produces.
   */
  it('builds every config block in one place', () => {
    expect(Object.keys(buildConfigPayload(defaultForm())).sort()).toEqual(
      [
        'agenda_design',
        'ambient_creatures',
        'cover_stage_layout',
        'dress_code_design',
        'event_details_design',
        'falling_effect',
        'guest_invite_design',
        'host_info_design',
        'info_card_design',
        'save_the_date_design',
        'sparks',
        'stage_modes',
        'text_effects',
      ].sort(),
    )
  })

  /**
   * A template saved before sparks were split out of the cover gilding carries
   * no `sparks` block; the form has to seed one from the gilding so that opening
   * it shows what it actually renders rather than a fresh default.
   */
  it('seeds sparks from the legacy cover gilding when there is no sparks block', () => {
    const template = blankTemplate({
      sparks: null,
      cover_stage_layout: {
        coverGilding: { enabled: true, sparkCount: 17, intensity: 'bright' },
      } as PartnerTemplate['cover_stage_layout'],
    })
    const hydrated = hydrateForm(template)
    expect(hydrated.sparks_enabled).toBe(true)
    expect(hydrated.sparks.count).toBe(17)
    expect(hydrated.sparks.intensity).toBe('bright')
  })

  /**
   * The photo stack's layout rides in the cover layout blob beside the
   * animation type. A chosen layout has to survive a reload; a stored null or
   * an option this build doesn't know opens (and re-saves) as the pile, which is
   * what the showcase renders for it — never as an unselected picker.
   */
  it('round-trips the photo stack layout, reading null and unknown as the pile', () => {
    const chosen = blankTemplate({
      cover_stage_layout: {
        showcaseAnimationType: 'stack',
        stackLayout: 'mosaic',
      } as PartnerTemplate['cover_stage_layout'],
    })
    const saved = buildConfigPayload(hydrateForm(chosen))
    expect(saved.cover_stage_layout?.stackLayout).toBe('mosaic')
    const reloaded = hydrateForm(blankTemplate({ cover_stage_layout: saved.cover_stage_layout }))
    expect(reloaded.cover_stage_layout.stackLayout).toBe('mosaic')

    for (const stored of [null, 'carousel']) {
      const template = blankTemplate({
        cover_stage_layout: { stackLayout: stored } as unknown as PartnerTemplate['cover_stage_layout'],
      })
      expect(hydrateForm(template).cover_stage_layout.stackLayout).toBe('pile')
    }
  })
  /**
   * The photo frame's switch is inferred when absent, from the sample-logo pair
   * the birthday cover drew its photo with. The form opens on what the cover
   * renders and a save pins it, so an unrelated edit to such a template never
   * moves or drops its photo — and a template without the pair never gains one.
   */
  describe('cover photo frame', () => {
    it('opens a sample-logo template on the photo frame, logo off, and saves it that way', () => {
      for (const layout of [null, { logoHeight: 40 }]) {
        const legacy = blankTemplate({
          sample_logo_1: 'frame.png',
          sample_logo_2: 'shape.png',
          cover_stage_layout: layout as PartnerTemplate['cover_stage_layout'],
        })
        const hydrated = hydrateForm(legacy)
        expect(hydrated.cover_stage_layout.showCoverPhoto).toBe(true)
        expect(hydrated.cover_stage_layout.showCoverLogo).toBe(false)

        const saved = buildConfigPayload(hydrated)
        expect(saved.cover_stage_layout).toMatchObject({ showCoverPhoto: true, showCoverLogo: false })
      }
    })

    it('never gives a frame to a template without the pair', () => {
      const plain = hydrateForm(blankTemplate({ sample_logo_1: 'mark.png' }))
      expect(plain.cover_stage_layout.showCoverPhoto).toBe(false)
      expect(plain.cover_stage_layout.showCoverLogo).toBe(true)
    })

    it('keeps an explicit switch and the frame layer through save and reload', () => {
      const template = blankTemplate({
        sample_logo_2: 'shape.png',
        cover_stage_layout: {
          showCoverPhoto: false,
          coverPhoto: { frameLayer: 'over' },
        } as PartnerTemplate['cover_stage_layout'],
      })
      const hydrated = hydrateForm(template)
      expect(hydrated.cover_stage_layout.showCoverPhoto).toBe(false)
      expect(hydrated.cover_stage_layout.showCoverLogo).toBe(true)

      const reloaded = hydrateForm(savedAs(hydrated, { sample_logo_2: 'shape.png' }))
      expect(reloaded.cover_stage_layout.showCoverPhoto).toBe(false)
      expect(reloaded.cover_stage_layout.coverPhoto).toEqual({ frameLayer: 'over' })
    })
  })
})
