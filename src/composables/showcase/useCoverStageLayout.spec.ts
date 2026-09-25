import { describe, it, expect } from 'vitest'
import { computed } from 'vue'
import {
  COVER_DETAIL_ELEMENT_DEFAULTS,
  COVER_DETAILS_DEFAULTS,
  COVER_ELEMENT_IDS,
  COVER_SEPARATOR_SCALE_RANGE,
  COVER_STAGE_LAYOUT_DEFAULTS,
  COVER_TEXT_IDS,
  COVER_TEXT_SCALE_RANGE,
  coverElementStyle,
  placeableCoverElementIds,
  resolveCoverElements,
  useCoverStageLayout,
} from './useCoverStageLayout'
import type { CoverStageLayout } from '@/services/api/types/template.types'

/**
 * The type slots are easy to break in a way nothing else catches: seeding them
 * with a default would look identical on screen and only diverge for the guest
 * name (whose font has its own script-dependent rule), and dropping them
 * somewhere in the chain fails silently — the save returns 200 and the value
 * reverts on the next load, which is exactly how the backend serializer's
 * per-field rebuild hid them at first.
 */
describe('cover element type slots', () => {
  const layout: Required<CoverStageLayout> = {
    ...COVER_STAGE_LAYOUT_DEFAULTS,
    layoutMode: 'free',
    coverElements: {
      header: { x: 50, y: 30, width: 100, height: 10, fontScale: 1.2, fontType: 'decorative' },
      invite: { x: 50, y: 60, width: 100, height: 5, colorSource: 'accent' },
      guest: { x: 50, y: 70, width: 60, height: 8, colorSource: 'custom', customColor: '#ABCDEF' },
    },
  }

  it('carries the slots through resolution', () => {
    const resolved = resolveCoverElements(layout)
    expect(resolved.header.fontType).toBe('decorative')
    expect(resolved.invite.colorSource).toBe('accent')
    expect(resolved.guest.customColor).toBe('#ABCDEF')
    // Untouched block keeps "unset" rather than being seeded.
    expect(resolved.logo.fontType).toBeUndefined()
  })

  it('emits the CSS variables the renderer reads', () => {
    const resolved = resolveCoverElements(layout)
    expect(coverElementStyle(resolved.header)['--cover-block-font']).toBe(
      'var(--tpl-font-decorative)',
    )
    expect(coverElementStyle(resolved.invite)['--cover-block-color']).toBe(
      'var(--tpl-color-accent)',
    )
    expect(coverElementStyle(resolved.guest)['--cover-block-color']).toBe('#ABCDEF')
    // A block that opted into nothing must define neither variable, so the
    // consumers' var() fallbacks (their original values) apply.
    expect(coverElementStyle(resolved.logo)['--cover-block-font']).toBeUndefined()
    expect(coverElementStyle(resolved.logo)['--cover-block-color']).toBeUndefined()
  })

  it('survives the JSON round trip the save path performs', () => {
    const sent = JSON.parse(JSON.stringify(layout)) as Required<CoverStageLayout>
    expect(sent.coverElements.header).toEqual({
      x: 50,
      y: 30,
      width: 100,
      height: 10,
      fontScale: 1.2,
      fontType: 'decorative',
    })
    expect(sent.coverElements.guest?.colorSource).toBe('custom')
  })

  // The metallic finish is a class, so it can't follow the font through the
  // `--cover-block-font` variable reference; it reads the resolved slot instead,
  // and has to agree with the variable about which slot that is.
  it('resolves each block\'s slot for its metallic finish', () => {
    const { elementFontSlots } = useCoverStageLayout(computed(() => layout))
    expect(elementFontSlots.value).toEqual({
      header: 'decorative',
      logo: 'primary',
      photo: 'primary',
      invite: 'secondary',
      guest: 'primary',
      hosts: 'primary',
      date: 'primary',
      location: 'secondary',
    })
  })

  it('ignores picked slots in rows mode, as the styles do', () => {
    const { elementFontSlots } = useCoverStageLayout(
      computed(() => ({ ...layout, layoutMode: 'rows' as const })),
    )
    expect(elementFontSlots.value.header).toBe('primary')
  })
})

/**
 * The logo and invite-text switches take a block off the cover without handing
 * its space to anything. Cover artwork is drawn with a place for each line, so
 * the invariant worth pinning is that switching one off moves no other block —
 * in either placement model.
 */
describe('cover block switches', () => {
  const resolve = (config: CoverStageLayout) =>
    useCoverStageLayout(computed<CoverStageLayout | undefined>(() => config))

  it('draws the logo and the invite text unless the template says otherwise', () => {
    const { layout } = resolve({})
    expect(layout.value.showCoverLogo).toBe(true)
    expect(layout.value.showCoverInviteText).toBe(true)
  })

  it('carries an explicit false through', () => {
    const { layout } = resolve({ showCoverLogo: false, showCoverInviteText: false })
    expect(layout.value.showCoverLogo).toBe(false)
    expect(layout.value.showCoverInviteText).toBe(false)
  })

  it('moves no other block when one is switched off', () => {
    const shown = resolve({})
    const hidden = resolve({
      showCoverLogo: false,
      showCoverInviteText: false,
      showCoverGuestName: false,
    })
    expect(hidden.rowStyles.value).toEqual(shown.rowStyles.value)
    expect(hidden.elements.value).toEqual(shown.elements.value)
  })

  it('draws the guest name unless the template says otherwise', () => {
    expect(resolve({}).layout.value.showCoverGuestName).toBe(true)
    expect(resolve({ showCoverGuestName: false }).layout.value.showCoverGuestName).toBe(false)
  })
})

/**
 * Text styles live per text in `coverText` and hold in both layout modes. The
 * invariant that matters most is the one nobody would see break: a template
 * that never set one must render exactly as it did — including a row block in
 * rows mode that still carries a style from an old free session, which never
 * rendered and must not start to.
 */
describe('cover text styles', () => {
  const resolve = (config: CoverStageLayout) =>
    useCoverStageLayout(computed<CoverStageLayout | undefined>(() => config))

  it('changes nothing for a template that set none', () => {
    const { textStyles, rowStyles } = resolve({})
    for (const id of COVER_TEXT_IDS) {
      expect(textStyles.value[id]).toEqual({ fontType: undefined, fontScale: 1 })
    }
    expect(rowStyles.value.eventTitle).toEqual({ height: '18.75%', '--cover-font-scale': '1' })
  })

  it('styles a row block in rows mode, where its box never could', () => {
    const { rowStyles, elementFontSlots } = resolve({
      layoutMode: 'rows',
      coverText: { guest: { fontType: 'decorative', fontScale: 1.3 } },
    })
    expect(rowStyles.value.guestName).toMatchObject({
      '--cover-font-scale': '1.3',
      '--cover-block-font': 'var(--tpl-font-decorative)',
    })
    expect(elementFontSlots.value.guest).toBe('decorative')
  })

  it('falls back to the box only where the box has always applied', () => {
    const stale = { header: { x: 50, y: 30, width: 100, height: 10, fontScale: 1.6, fontType: 'accent' as const } }
    // Free mode: the box's type has always rendered, and still does.
    expect(resolve({ layoutMode: 'free', coverElements: stale }).textStyles.value.header).toEqual({
      fontType: 'accent',
      fontScale: 1.6,
    })
    // Rows mode: it never rendered, so it still doesn't.
    const rows = resolve({ layoutMode: 'rows', coverElements: stale })
    expect(rows.textStyles.value.header).toEqual({ fontType: undefined, fontScale: 1 })
    expect(rows.rowStyles.value.eventTitle['--cover-block-font']).toBeUndefined()
  })

  it('lets the text style win over its box, field by field', () => {
    const { textStyles, elementStyles } = resolve({
      layoutMode: 'free',
      coverElements: { invite: { x: 50, y: 60, width: 100, height: 5, fontScale: 1.4, fontType: 'accent' } },
      coverText: { invite: { fontScale: 0.8 } },
    })
    expect(textStyles.value.invite).toEqual({ fontType: 'accent', fontScale: 0.8 })
    expect(elementStyles.value.invite['--cover-font-scale']).toBe('0.8')
    expect(elementStyles.value.invite['--cover-block-font']).toBe('var(--tpl-font-accent)')
  })

  it('styles the line under the names apart from the names', () => {
    const { textStyles, elementStyles } = resolve({
      coverText: { hostNames: { fontScale: 1.2 }, hostSubline: { fontType: 'accent', fontScale: 0.7 } },
    })
    expect(elementStyles.value.hosts['--cover-font-scale']).toBe('1.2')
    expect(textStyles.value.hostSubline).toEqual({ fontType: 'accent', fontScale: 0.7 })
  })

  it('drops a slot this build publishes no variable for, and clamps the size', () => {
    const { textStyles } = resolve({
      coverText: { date: { fontType: 'v2-display' as never, fontScale: 9 } },
    })
    expect(textStyles.value.date).toEqual({ fontType: undefined, fontScale: COVER_TEXT_SCALE_RANGE.max })
  })
})

/**
 * The names, date and venue. Off until switched on — so no existing template
 * changes — and placed by box in both layout modes, because they never stacked.
 */
describe('cover detail blocks', () => {
  const resolve = (config: CoverStageLayout) =>
    useCoverStageLayout(computed<CoverStageLayout | undefined>(() => config))

  it('is off on every template that has not asked for it', () => {
    const { layout, coverDetails } = resolve({})
    expect(layout.value.showCoverHosts).toBe(false)
    expect(layout.value.showCoverDate).toBe(false)
    expect(layout.value.showCoverLocation).toBe(false)
    expect(coverDetails.value).toEqual(COVER_DETAILS_DEFAULTS)
  })

  it('starts each block on the reference card placement', () => {
    const { elements } = resolve({})
    expect(elements.value.hosts).toEqual(COVER_DETAIL_ELEMENT_DEFAULTS.hosts)
    expect(elements.value.date).toEqual(COVER_DETAIL_ELEMENT_DEFAULTS.date)
    expect(elements.value.location).toEqual(COVER_DETAIL_ELEMENT_DEFAULTS.location)
    // Stacked top to bottom as the card reads.
    expect(elements.value.hosts.y).toBeLessThan(elements.value.date.y)
    expect(elements.value.date.y).toBeLessThan(elements.value.location.y)
  })

  it('places a detail block by its own box even in rows mode', () => {
    const moved = { x: 40, y: 30, width: 60, height: 10, fontScale: 1.2, fontType: 'decorative' as const }
    const { elements, elementStyles, elementFontSlots } = resolve({
      layoutMode: 'rows',
      coverElements: { hosts: moved },
    })
    expect(elements.value.hosts).toMatchObject({ x: 40, y: 30, width: 60, height: 10 })
    expect(elementStyles.value.hosts.left).toBe('10%')
    // The detail block's font pick holds in rows mode; a row block's doesn't.
    expect(elementFontSlots.value.hosts).toBe('decorative')
  })

  it('lets a partner move the photo and the details in rows mode and every block in free mode', () => {
    expect(placeableCoverElementIds('rows')).toEqual(['photo', 'hosts', 'date', 'location'])
    expect(placeableCoverElementIds('free')).toEqual(COVER_ELEMENT_IDS)
  })

  it('falls back to the reference card for values this build does not know', () => {
    const { coverDetails } = resolve({
      coverDetails: {
        separator: 'sparkle' as never,
        hostArrangement: 'diagonal' as never,
        dateFormat: 'lunar' as never,
        hostCount: 0,
        separatorScale: 9,
      },
    })
    expect(coverDetails.value.separator).toBe('ampersand')
    expect(coverDetails.value.hostArrangement).toBe('stacked')
    expect(coverDetails.value.dateFormat).toBe('numeric')
    // 0 is not "show none" — that is the switch's job — so it means every host.
    expect(coverDetails.value.hostCount).toBeNull()
    expect(coverDetails.value.separatorScale).toBe(COVER_SEPARATOR_SCALE_RANGE.max)
  })

  it('carries a partial config through, filling only what it leaves out', () => {
    const { coverDetails } = resolve({ coverDetails: { separator: 'rings', hostCount: 3.4 } })
    expect(coverDetails.value.separator).toBe('rings')
    expect(coverDetails.value.hostCount).toBe(3)
    expect(coverDetails.value.hostSubline).toBe(COVER_DETAILS_DEFAULTS.hostSubline)
  })
})

/**
 * The photo frame grew out of the logo row, where the sample-logo pair drew the
 * first host's photo. A template that carried that pair must render exactly as
 * it did — frame on, logo off, in the logo row's place — and no other template
 * may gain a frame it never asked for.
 */
describe('cover photo frame', () => {
  const resolve = (config: CoverStageLayout, assets: Record<string, string | null> = {}) =>
    useCoverStageLayout(
      computed<CoverStageLayout | undefined>(() => config),
      undefined,
      computed(() => assets),
    )

  it('is off, and leaves the logo alone, on a template without the sample-logo pair', () => {
    const { layout } = resolve({}, { sample_logo_1: 'mark.png' })
    expect(layout.value.showCoverPhoto).toBe(false)
    expect(layout.value.showCoverLogo).toBe(true)
  })

  it('takes the logo row over on a template that carried the sample-logo pair', () => {
    const { layout, elements } = resolve({}, { sample_logo_1: 'frame.png', sample_logo_2: 'shape.png' })
    expect(layout.value.showCoverPhoto).toBe(true)
    expect(layout.value.showCoverLogo).toBe(false)
    expect(elements.value.photo).toEqual(elements.value.logo)
  })

  it('infers nothing once the template says, or once the logo was already off', () => {
    const pair = { sample_logo_2: 'shape.png' }
    expect(resolve({ showCoverPhoto: false }, pair).layout.value).toMatchObject({
      showCoverPhoto: false,
      showCoverLogo: true,
    })
    expect(resolve({ showCoverPhoto: true, showCoverLogo: true }, pair).layout.value).toMatchObject({
      showCoverPhoto: true,
      showCoverLogo: true,
    })
    expect(resolve({ showCoverLogo: false }, pair).layout.value.showCoverPhoto).toBe(false)
  })

  it('follows the logo row until it is moved, then keeps its own box in rows mode', () => {
    const tall = resolve({ showCoverPhoto: true, logoHeight: 60 })
    expect(tall.elements.value.photo).toEqual(tall.elements.value.logo)

    const moved = resolve({
      showCoverPhoto: true,
      layoutMode: 'rows',
      coverElements: { photo: { x: 50, y: 40, width: 50, height: 30 } },
    })
    expect(moved.elements.value.photo).toMatchObject({ x: 50, y: 40, width: 50, height: 30 })
    expect(moved.elementStyles.value.photo).toMatchObject({ left: '25%', top: '25%', width: '50%' })
  })

  it('reads an unknown frame layer as the artwork under the photo', () => {
    const { layout } = resolve({ coverPhoto: { frameLayer: 'sideways' as never } })
    expect(layout.value.coverPhoto).toEqual({ frameLayer: 'under' })
  })
})
