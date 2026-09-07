// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import HostInfoWeddingCrest from './HostInfoWeddingCrest.vue'
import type { HostInfoProps } from '@/types/showcase'

vi.mock('@/composables/useAppLanguage', () => ({
  useAppLanguage: () => ({ t: (k: string) => k, locale: { value: 'en' } }),
}))

const HOSTS: HostInfoProps['hosts'] = [
  { id: 1, name: 'Sochea', title: 'Bridegroom', parent_a_name: 'Mr Thann', parent_b_name: 'Mrs Pisey' },
  { id: 2, name: 'Sokphea', title: 'Bride', parent_a_name: 'Mr Sokhom', parent_b_name: 'Mrs Sopha' },
]

/**
 * AutoFitText measures itself with `getComputedStyle` inside a ResizeObserver,
 * neither of which jsdom answers usefully — and none of what is asserted here
 * depends on the measurement. Stubbed down to the text it was handed so the
 * parent-name assertions still read the real strings.
 */
const AutoFitTextStub = {
  props: ['text'],
  template: '<span>{{ text }}</span>',
}

const mountCrest = (props: Partial<HostInfoProps> = {}) =>
  mount(HostInfoWeddingCrest, {
    global: { stubs: { AutoFitText: AutoFitTextStub } },
    props: {
      hosts: HOSTS,
      eventInitial: 'S',
      primaryColor: '#5b4636',
      accentColor: '#c9a227',
      currentFont: 'serif',
      descriptionTitle: 'We are honoured',
      descriptionText: 'to invite you to share in the beginning of our life together.',
      ...props,
    } as HostInfoProps,
  })

describe('HostInfoWeddingCrest', () => {
  it('renders the blocks in the order that is the design', () => {
    const wrapper = mountCrest({ coupleOrnament: 'heart', dividerImage: '/media/bl.svg' })
    const order = wrapper
      .findAll('.crest-logo, .parent-row, .crest-invite, .crest-couple, .crest-breakline')
      .map((el) => el.classes().find((c) => c === 'parent-row' || c.startsWith('crest-')))

    expect(order).toEqual([
      'crest-logo',
      'parent-row',
      'parent-row',
      'crest-invite',
      'crest-couple',
      'crest-breakline',
    ])
  })

  it('carries no welcome header — the invitation sentence is the headline', () => {
    const wrapper = mountCrest({ welcomeMessage: 'Welcome to our wedding' })

    expect(wrapper.find('.welcome-row').exists()).toBe(false)
    // The title joins its words with a non-breaking space, like every other
    // short string in the showcase; only the paragraph below uses a breaking one.
    expect(wrapper.find('.crest-invite-title').text()).toBe('We\u00A0are\u00A0honoured')
    expect(wrapper.find('.crest-invite-text').text()).toContain('to invite you to share')
  })

  it('draws no avatars — the composition ends on the names', () => {
    const wrapper = mountCrest()

    expect(wrapper.find('.profile-picture-row').exists()).toBe(false)
  })

  it('reuses the standard design’s own parent rows, class for class', () => {
    const wrapper = mountCrest()
    const rows = wrapper.findAll('.parent-row')

    // Two rows, not two stacked columns: the same structure the standard grid
    // uses, which is what keeps the type scale and row rhythm identical.
    expect(rows).toHaveLength(2)
    expect(rows[0].find('.host-parent-left').text()).toContain('Mr Thann')
    expect(rows[0].find('.host-parent-right').text()).toContain('Mr Sokhom')
    expect(rows[1].find('.host-parent-left').text()).toContain('Mrs Pisey')
    expect(wrapper.find('.parent-name-text').exists()).toBe(true)
  })

  it('puts the shared centre motif between the two names', () => {
    const wrapper = mountCrest({ coupleOrnament: 'rings' })

    expect(wrapper.find('.crest-couple .center-spacer--ornament').exists()).toBe(true)
    expect(wrapper.find('.couple-ornament').exists()).toBe(true)
    // Every row's centre track widens together, or the couple stops sharing a
    // column axis with the parents above it.
    expect(wrapper.classes()).toContain('has-ornament')
  })

  it('leaves the motif out when the template asks for none', () => {
    const wrapper = mountCrest({ coupleOrnament: 'none' })

    expect(wrapper.find('.couple-ornament').exists()).toBe(false)
    expect(wrapper.classes()).not.toContain('has-ornament')
  })

  it('drops the motif and the second column for a single host', () => {
    const wrapper = mountCrest({ hosts: [HOSTS[0]], coupleOrnament: 'heart' })

    expect(wrapper.find('.couple-ornament').exists()).toBe(false)
    expect(wrapper.find('.crest-couple').classes()).toContain('is-solo')
  })

  it('closes on a drawn hairline by default', () => {
    const wrapper = mountCrest()

    expect(wrapper.find('.crest-breakline').exists()).toBe(true)
    expect(wrapper.find('.host-breakline__rule--full').exists()).toBe(true)
  })

  it('threads the chosen motif through the middle of that rule', () => {
    const wrapper = mountCrest({ dividerStyle: 'diamond' })

    expect(wrapper.find('.host-breakline__motif').exists()).toBe(true)
    // Two half-rules, not one rule with the mark laid over it.
    expect(wrapper.findAll('.host-breakline__rule')).toHaveLength(2)
    expect(wrapper.find('.host-breakline__rule--full').exists()).toBe(false)
  })

  it('draws the flourish as one stroke across the whole width', () => {
    const wrapper = mountCrest({ dividerStyle: 'flourish' })

    expect(wrapper.find('.host-breakline__flourish').exists()).toBe(true)
    expect(wrapper.find('.host-breakline__rule').exists()).toBe(false)
  })

  it('draws uploaded artwork instead of the chosen style, not alongside it', () => {
    const wrapper = mountCrest({
      dividerStyle: 'lotus',
      dividerImage: 'https://cdn.example/breakline.png',
    })

    expect(wrapper.find('.host-breakline__art').attributes('src')).toBe(
      'https://cdn.example/breakline.png',
    )
    expect(wrapper.find('.host-breakline__motif').exists()).toBe(false)
    expect(wrapper.find('.host-breakline__rule').exists()).toBe(false)
  })

  it('still draws uploaded artwork when the style says none', () => {
    // `none` is a statement about the drawn rule. Discarding a file the partner
    // attached would leave the upload control looking broken.
    const wrapper = mountCrest({ dividerStyle: 'none', dividerImage: '/media/bl.svg' })

    expect(wrapper.find('.host-breakline__art').exists()).toBe(true)
  })

  it('ends on the names when the style is none and nothing is attached', () => {
    const wrapper = mountCrest({ dividerStyle: 'none' })

    expect(wrapper.find('.crest-breakline').exists()).toBe(false)
  })

  it('resolves the breakline width against the block, not the mark', () => {
    const wrapper = mountCrest({ dividerScale: 150 })

    // 100% on the wire is half the block, so 150% is three quarters of it.
    expect(wrapper.attributes('style')).toContain('--crest-bl-width: 75%')
  })

  it('carries the logo size through to HostLogo', () => {
    const wrapper = mountCrest({ logoScale: 60 })

    expect(wrapper.find('.logo-row').attributes('style')).toContain('--host-logo-scale: 0.6')
  })

  it('leaves the logo scale unset at 100 so the caps resolve through their own fallback', () => {
    const wrapper = mountCrest()

    expect(wrapper.find('.logo-row').attributes('style') ?? '').not.toContain('--host-logo-scale')
  })

  it('does not position itself — the block offset belongs to the shared wrapper', () => {
    // Applied once by HostInfoWedding on the element all five designs share; a
    // copy here would double it. See HostInfoWedding.spec.ts.
    const wrapper = mountCrest({ topOffset: 2.5 })

    expect(wrapper.attributes('style') ?? '').not.toContain('padding-top')
  })
})
