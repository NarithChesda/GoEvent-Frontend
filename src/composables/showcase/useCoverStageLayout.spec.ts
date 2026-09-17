import { describe, it, expect } from 'vitest'
import { computed } from 'vue'
import {
  COVER_STAGE_LAYOUT_DEFAULTS,
  coverElementStyle,
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
      invite: 'secondary',
      guest: 'primary',
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
    const hidden = resolve({ showCoverLogo: false, showCoverInviteText: false })
    expect(hidden.rowStyles.value).toEqual(shown.rowStyles.value)
    expect(hidden.elements.value).toEqual(shown.elements.value)
  })
})
