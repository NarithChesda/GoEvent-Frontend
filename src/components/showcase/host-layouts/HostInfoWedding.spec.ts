// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import HostInfoWedding from './HostInfoWedding.vue'
import type { HostInfoProps } from '@/types/showcase'
import type { CoverStageLayout, HostInfoDesignType } from '@/services/api/types/template.types'
import { resolveCoverDetails, type ResolvedCoverDetails } from '@/composables/showcase/useCoverStageLayout'
import type { CoverHostNamesBinding } from '../cover/coverDetails'

vi.mock('@/composables/useAppLanguage', () => ({
  useAppLanguage: () => ({ t: (k: string) => k, locale: { value: 'en' } }),
}))

const HOSTS: HostInfoProps['hosts'] = [
  { id: 1, name: 'Sochea', title: 'Bridegroom', parent_a_name: 'Mr Thann' },
  { id: 2, name: 'Sokphea', title: 'Bride', parent_a_name: 'Mr Sokhom' },
]

/** See HostInfoWeddingCrest.spec.ts — jsdom answers neither of AutoFitText's measurements. */
const AutoFitTextStub = { props: ['text'], template: '<span>{{ text }}</span>' }

const mountWedding = (props: Partial<HostInfoProps> = {}) =>
  mount(HostInfoWedding, {
    global: { stubs: { AutoFitText: AutoFitTextStub } },
    props: {
      hosts: HOSTS,
      eventInitial: 'S',
      primaryColor: '#5b4636',
      accentColor: '#c9a227',
      currentFont: 'serif',
      ...props,
    } as HostInfoProps,
  })

const DESIGNS: HostInfoDesignType[] = ['standard', 'portrait', 'simple', 'arch', 'crest']

describe('HostInfoWedding block placement', () => {
  it.each(DESIGNS)('positions the %s design from the shared wrapper', (designType) => {
    const wrapper = mountWedding({ designType, topOffset: 2.5 })

    // One rule on the one element all five designs share — arch and crest are
    // components of their own, simple and the grid are branches of the same
    // template, and only this wrapper wraps every one of them.
    expect(wrapper.attributes('style')).toContain('padding-top: 2.5rem')
    expect(wrapper.attributes('style')).toContain('margin-top: 0rem')
  })

  it('pulls the block up with a margin, since padding cannot go negative', () => {
    const wrapper = mountWedding({ designType: 'standard', topOffset: -1.5 })

    expect(wrapper.attributes('style')).toContain('margin-top: -1.5rem')
    expect(wrapper.attributes('style')).toContain('padding-top: 0rem')
  })

  it('sits flush with no offset set', () => {
    const wrapper = mountWedding({ designType: 'standard' })

    expect(wrapper.attributes('style')).toContain('padding-top: 0rem')
    expect(wrapper.attributes('style')).toContain('margin-top: 0rem')
  })
})

describe('HostInfoWedding logo size', () => {
  it.each(['standard', 'portrait', 'crest'] as HostInfoDesignType[])(
    'carries the logo size through on the %s design',
    (designType) => {
      const wrapper = mountWedding({ designType, logoScale: 140 })

      expect(wrapper.find('.logo-row').attributes('style')).toContain('--host-logo-scale: 1.4')
    },
  )

  it('leaves the variable unset at 100 so the caps resolve through their own fallback', () => {
    const wrapper = mountWedding({ designType: 'standard' })

    expect(wrapper.find('.logo-row').attributes('style') ?? '').not.toContain('--host-logo-scale')
  })

  it.each(['simple', 'arch'] as HostInfoDesignType[])(
    'draws no logo at all on the %s design, so there is nothing to size',
    (designType) => {
      const wrapper = mountWedding({ designType, logoScale: 140 })

      expect(wrapper.find('.logo-row').exists()).toBe(false)
    },
  )
})

describe('HostInfoWedding simple design, matched to the cover names', () => {
  const COUPLE: HostInfoProps['hosts'] = [
    { id: 1, name: 'Mary Anne Smith', title: 'Bride' },
    { id: 2, name: 'John Doe', title: 'Groom' },
    { id: 3, name: 'Third Host', title: 'Host' },
  ]

  const binding = (details: Partial<ResolvedCoverDetails> = {}): CoverHostNamesBinding => ({
    details: { ...resolveCoverDetails({} as Required<CoverStageLayout>), ...details },
    namesSlot: 'accent',
    sublineStyle: { fontType: undefined, fontScale: 1 },
    vars: { '--tpl-font-accent': 'Great Vibes', '--cover-block-font': 'var(--tpl-font-accent)' },
    separatorImageUrl: null,
  })

  it('keeps its own two stacked names when nothing asks it to match', () => {
    const wrapper = mountWedding({ designType: 'simple', hosts: COUPLE })

    expect(wrapper.find('.simple-names').exists()).toBe(true)
    expect(wrapper.find('.synced-names').exists()).toBe(false)
    // Its own look: two names, an ampersand, never the third host.
    expect(wrapper.findAll('.simple-name-text')).toHaveLength(2)
    expect(wrapper.find('.simple-amp').text()).toBe('&')
  })

  it("names the cover's hosts, split the way the cover splits them", () => {
    const wrapper = mountWedding({
      designType: 'simple',
      hosts: COUPLE,
      coverHostNames: binding({ hostSubline: 'surname', hostCount: 2 }),
    })

    expect(wrapper.find('.simple-names').exists()).toBe(false)
    const names = wrapper.findAll('.synced-name').map((n) => n.text().replace(/ /g, ' '))
    // The count caps it at two; the surname moves to the small line, and a
    // double given name stays together.
    expect(names).toEqual(['Mary Anne', 'John'])
    expect(wrapper.findAll('.synced-sub').map((s) => s.text())).toEqual(['Smith', 'Doe'])
    // One mark between two names.
    expect(wrapper.findAll('.synced-sep')).toHaveLength(1)
  })

  it('draws every host, a mark between each, when the cover names them all', () => {
    const wrapper = mountWedding({
      designType: 'simple',
      hosts: COUPLE,
      coverHostNames: binding({ hostCount: null, hostSubline: 'none', hostArrangement: 'inline' }),
    })

    expect(wrapper.findAll('.synced-name')).toHaveLength(3)
    expect(wrapper.findAll('.synced-sep')).toHaveLength(2)
    expect(wrapper.find('.synced-names').classes()).toContain('synced-names--inline')
  })

  it("uses the cover's mark, its word and its capitals", () => {
    const wrapper = mountWedding({
      designType: 'simple',
      hosts: COUPLE,
      coverHostNames: binding({ separator: 'word', capitals: true, hostSubline: 'none' }),
    })

    expect(wrapper.find('.hsm-word').exists()).toBe(true)
    expect(wrapper.find('.synced-name').classes()).toContain('synced-caps')
  })

  it("prefers the cover's uploaded mark over the one it chose", () => {
    const wrapper = mountWedding({
      designType: 'simple',
      hosts: COUPLE,
      coverHostNames: { ...binding({ separator: 'ampersand' }), separatorImageUrl: 'https://x/mark.png' },
    })

    expect(wrapper.find('.hsm-image').attributes('src')).toBe('https://x/mark.png')
    expect(wrapper.find('.hsm-glyph').exists()).toBe(false)
  })

  it("publishes the cover's variables, so its font and colour expressions resolve here", () => {
    const wrapper = mountWedding({
      designType: 'simple',
      hosts: COUPLE,
      coverHostNames: binding(),
    })

    const style = wrapper.find('.synced-names').attributes('style') ?? ''
    expect(style).toContain('--cover-block-font: var(--tpl-font-accent)')
    expect(style).toContain('--tpl-font-accent: Great Vibes')
    expect(wrapper.find('.synced-name').attributes('style')).toContain('var(--cover-block-font, serif)')
  })

  it("takes the cover's sizes, so a Size % set there reaches the invitation", () => {
    const wrapper = mountWedding({
      designType: 'simple',
      hosts: COUPLE,
      coverHostNames: {
        ...binding({ hostSubline: 'title', hostCount: 2 }),
        // What the cover publishes for names at 130% with their small line at 140%.
        vars: { '--cover-font-scale': '1.3' },
        sublineStyle: { fontType: undefined, fontScale: 1.4 },
      },
    })

    const style = wrapper.find('.synced-names').attributes('style') ?? ''
    // The names read the cover's own Size %; the small line carries its own.
    expect(style).toContain('--cover-font-scale: 1.3')
    expect(style).toContain('--synced-sub-scale: 1.4')
    // And both step down together as more names share the block (two: no step).
    expect(style).toContain('--synced-count-scale: 1')
  })

  it("sizes the names off the stage the cover measures, not off its own card", () => {
    const wrapper = mountWedding({
      designType: 'simple',
      hosts: COUPLE,
      coverHostNames: { ...binding(), vars: { '--cover-stage-w': '390px' } },
    })

    // MainContentStage measures the stage and publishes it; the rule below
    // spends it on the cover's own 6.4% / 2.3% coefficients.
    expect(wrapper.find('.synced-names').attributes('style')).toContain('--cover-stage-w: 390px')
  })

  it('steps the names down as more of them share the block, as the cover does', () => {
    const wrapper = mountWedding({
      designType: 'simple',
      hosts: COUPLE,
      coverHostNames: binding({ hostCount: null, hostSubline: 'none' }),
    })

    // Three stacked names: the cover's own step.
    expect(wrapper.find('.synced-names').attributes('style')).toContain('--synced-count-scale: 0.86')
  })

  it('keeps a Khmer name whole and never spaces its letters', () => {
    const wrapper = mountWedding({
      designType: 'simple',
      hosts: [
        { id: 1, name: 'ចាន់ សុភា', title: 'កូនកំលោះ' },
        { id: 2, name: 'Sokphea Lim', title: 'Bride' },
      ],
      coverHostNames: binding({ hostSubline: 'surname', capitals: true }),
    })

    const [khmer, latin] = wrapper.findAll('.synced-name')
    expect(khmer.text().replace(/ /g, ' ')).toBe('ចាន់ សុភា')
    expect(khmer.classes()).toContain('synced-khmer')
    expect(khmer.classes()).not.toContain('synced-caps')
    expect(latin.classes()).toContain('synced-caps')
  })
})
