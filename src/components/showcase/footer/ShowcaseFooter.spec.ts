// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import ShowcaseFooter from './ShowcaseFooter.vue'
import { legacyFooterDesign, resolveFooterDesign } from './footerDesign'
import { PAPER_DARK, stationeryPaper } from '../stationery'
import type { FooterDesignType } from '@/services/api/types/template.types'

vi.mock('@/composables/useAppLanguage', () => ({
  useAppLanguage: () => ({ t: (k: string) => k, locale: { value: 'en' } }),
}))

describe('resolveFooterDesign', () => {
  it('lets the Liquid Glass switch pick when the template has no footer design', () => {
    expect(resolveFooterDesign(null, false)).toBe('plain')
    expect(resolveFooterDesign(undefined, true)).toBe('glass')
    // The switch has always defaulted to on.
    expect(resolveFooterDesign(null, undefined)).toBe('glass')
    expect(legacyFooterDesign(null)).toBe('glass')
  })

  it('keeps a chosen design whatever the switch says, and reads an unknown one as absent', () => {
    expect(resolveFooterDesign({ type: 'card' }, false)).toBe('card')
    expect(resolveFooterDesign({ type: 'minimal' }, true)).toBe('minimal')
    expect(resolveFooterDesign({ type: 'plain' }, true)).toBe('plain')
    expect(resolveFooterDesign({ type: 'ribbon' as FooterDesignType }, false)).toBe('plain')
  })
})

const INK = '#dfa54b'
const BAND = '#5f080c'

const mountFooter = (design: FooterDesignType, extra: Record<string, unknown> = {}) =>
  mount(ShowcaseFooter, {
    props: {
      design,
      ink: INK,
      band: BAND,
      paper: stationeryPaper({ tone: BAND }),
      font: 'Lobster',
      ...extra,
    },
  })

describe('ShowcaseFooter', () => {
  it('draws the two old looks value for value', () => {
    const glass = mountFooter('glass').element as HTMLElement
    expect(glass.style.background).toContain('rgba') // the #5f080c90 band
    expect(glass.style.getPropertyValue('--ft-ink')).toBe('#ffffff')
    expect(glass.style.getPropertyValue('--ft-btn-bg')).toBe('rgba(255, 255, 255, 0.2)')

    const plain = mountFooter('plain').element as HTMLElement
    expect(plain.style.background).toBe('none')
    expect(plain.style.getPropertyValue('--ft-ink')).toBe(INK)
    expect(plain.style.getPropertyValue('--ft-btn-bg')).toBe(`${INK}20`)
    expect(plain.style.getPropertyValue('--ft-mark-filter')).toBe(`drop-shadow(0 2px 8px ${INK}40)`)
  })

  it('prints the card in an ink its paper can carry', () => {
    const dark = stationeryPaper({ calendarCard: { color: PAPER_DARK } })
    const card = mountFooter('card', { paper: dark }).element as HTMLElement
    expect(card.classList).toContain('showcase-footer--card')
    expect(card.style.getPropertyValue('--ft-paper')).toBe(dark.paper)
    // Gold on the dark stock clears small-text contrast, so it keeps its ink.
    expect(card.style.getPropertyValue('--ft-ink')).toBe(INK)
  })

  it('keeps the class the stage exempts from the text edge, and hands the lockup back', () => {
    let lockup: Element | null = null
    const wrapper = mountFooter('minimal', {
      lockupRef: (el: Element | null) => {
        lockup = el
      },
    })
    expect(wrapper.classes()).toContain('footer-card-container')
    expect(lockup).not.toBeNull()
    expect((lockup as unknown as HTMLElement).classList).toContain('footer-lockup')
  })

  it('draws the partner row only with a mark or its slot', () => {
    expect(mountFooter('plain').find('.collab-ornament').exists()).toBe(false)
    const withLogo = mountFooter('plain', { partnerLogoUrl: '/logo.png', partnerName: 'Shop' })
    expect(withLogo.find('.partner-mark img').attributes('src')).toBe('/logo.png')
    expect(withLogo.find('.collab-ornament').exists()).toBe(true)
    const slot = mountFooter('plain', { showPartnerSlot: true })
    expect(slot.find('.partner-slot-mark').exists()).toBe(true)
  })
})
