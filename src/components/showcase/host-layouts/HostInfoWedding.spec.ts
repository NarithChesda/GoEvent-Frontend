// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import HostInfoWedding from './HostInfoWedding.vue'
import type { HostInfoProps } from '@/types/showcase'
import type { HostInfoDesignType } from '@/services/api/types/template.types'

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
