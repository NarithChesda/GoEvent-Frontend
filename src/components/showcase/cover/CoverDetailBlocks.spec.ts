// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import CoverDetailBlocks from './CoverDetailBlocks.vue'
import {
  COVER_DETAILS_DEFAULTS,
  COVER_ELEMENT_IDS,
  coverElementStyle,
  resolveCoverElements,
  COVER_STAGE_LAYOUT_DEFAULTS,
  type ResolvedCoverDetails,
} from '@/composables/showcase/useCoverStageLayout'
import type { CoverElementId } from '@/services/api/types/template.types'
import type { CoverEventDetails } from './coverDetails'

// The inline-edit primitives read the app language during setup, which throws
// without the i18n plugin installed. Same mock CoverContentRows.spec uses.
vi.mock('@/composables/useAppLanguage', () => ({
  useAppLanguage: () => ({ t: (k: string) => k, locale: { value: 'en' } }),
}))

const elements = resolveCoverElements(COVER_STAGE_LAYOUT_DEFAULTS)
const elementStyles = Object.fromEntries(
  COVER_ELEMENT_IDS.map((id) => [id, coverElementStyle(elements[id])]),
) as Record<CoverElementId, Record<string, string>>

const eventDetails: CoverEventDetails = {
  hosts: [
    { id: 1, name: 'Richard Jones', title: 'Groom' },
    { id: 2, name: 'Amanda Wilson', title: 'Bride' },
  ],
  startDate: '2025-10-20T03:00:00Z',
  timezone: 'Asia/Phnom_Penh',
  location: '123 Anywhere St., Any City',
}

const mountBlocks = (
  overrides: {
    details?: Partial<ResolvedCoverDetails>
    visible?: Partial<Record<'hosts' | 'date' | 'location', boolean>>
    eventDetails?: CoverEventDetails
    currentLanguage?: string
    separatorImageUrl?: string | null
  } = {},
) =>
  mount(CoverDetailBlocks, {
    props: {
      eventDetails: overrides.eventDetails ?? eventDetails,
      eventTexts: [],
      currentLanguage: overrides.currentLanguage ?? 'en',
      visible: { hosts: true, date: true, location: true, ...overrides.visible },
      details: { ...COVER_DETAILS_DEFAULTS, ...overrides.details },
      elementStyles,
      primaryColor: '#555555',
      accentColor: '#C9A45C',
      currentFont: 'serif',
      separatorImageUrl: overrides.separatorImageUrl ?? null,
    },
  })

describe('CoverDetailBlocks', () => {
  it('sets the reference card: split names joined by an ampersand, the date, the venue', () => {
    const wrapper = mountBlocks()
    const names = wrapper.findAll('.cdb-name').map((n) => n.text())
    const sublines = wrapper.findAll('.cdb-sub').map((n) => n.text())
    expect(names).toEqual(['Richard', 'Amanda'])
    expect(sublines).toEqual(['Jones', 'Wilson'])
    expect(wrapper.find('.hsm-glyph').text()).toBe('&')
    // 03:00Z is 10:00 in Phnom Penh, on the 20th.
    expect(wrapper.find('.cdb-date').text()).toBe('20.10.2025')
    expect(wrapper.findAll('.cdb-line').map((l) => l.text())).toEqual([
      '10 AM',
      '123 Anywhere St., Any City',
    ])
  })

  it('draws one mark between each pair of names, however many hosts there are', () => {
    const wrapper = mountBlocks({
      eventDetails: {
        ...eventDetails,
        hosts: [
          { id: 1, name: 'Ana' },
          { id: 2, name: 'Ben' },
          { id: 3, name: 'Cy' },
        ],
      },
    })
    expect(wrapper.findAll('.cdb-name')).toHaveLength(3)
    expect(wrapper.findAll('.hsm')).toHaveLength(2)
  })

  it('caps the names at the template count', () => {
    const wrapper = mountBlocks({ details: { hostCount: 1 } })
    expect(wrapper.findAll('.cdb-name')).toHaveLength(1)
    expect(wrapper.find('.hsm').exists()).toBe(false)
  })

  it('lets an uploaded mark replace the chosen one', () => {
    const wrapper = mountBlocks({ separatorImageUrl: 'https://cdn.example/mark.png' })
    expect(wrapper.find('.hsm-image').attributes('src')).toBe('https://cdn.example/mark.png')
    expect(wrapper.find('.hsm-glyph').exists()).toBe(false)
  })

  it('joins with the language\'s own word', () => {
    const wrapper = mountBlocks({ details: { separator: 'word' }, currentLanguage: 'kh' })
    expect(wrapper.find('.hsm-word').text()).toBe('និង')
  })

  it('never sets Khmer in spaced capitals', () => {
    const wrapper = mountBlocks({
      eventDetails: { ...eventDetails, hosts: [{ id: 1, name: 'ចាន់ សុភា' }, { id: 2, name: 'Amanda Wilson' }] },
    })
    const [khmer, latin] = wrapper.findAll('.cdb-name')
    expect(khmer.classes()).not.toContain('cdb-caps')
    expect(khmer.classes()).toContain('cdb-khmer')
    expect(latin.classes()).toContain('cdb-caps')
  })

  it('draws only the blocks the template switched on', () => {
    const wrapper = mountBlocks({ visible: { hosts: false, location: false } })
    expect(wrapper.find('.cdb-name').exists()).toBe(false)
    expect(wrapper.find('.cdb-line').exists()).toBe(false)
    expect(wrapper.find('.cdb-date').exists()).toBe(true)
  })

  it('leaves the names block out entirely for an event with no named host', () => {
    const wrapper = mountBlocks({ eventDetails: { ...eventDetails, hosts: [] } })
    expect(wrapper.findAll('.cdb-block')).toHaveLength(2)
  })

  // Set on its own: not in em of the name above it, so resizing the names leaves
  // the small line alone, and in its own slot rather than the names' face.
  it('styles the line under each name apart from the names', () => {
    const wrapper = mount(CoverDetailBlocks, {
      props: {
        eventDetails,
        visible: { hosts: true, date: false, location: false },
        details: COVER_DETAILS_DEFAULTS,
        elementStyles,
        primaryColor: '#555555',
        currentFont: 'serif',
        secondaryFont: 'Montserrat',
        sublineStyle: { fontType: 'accent', fontScale: 0.7 },
      },
    })
    expect(wrapper.find('.cdb-hosts').attributes('style')).toContain('--cdb-sub-scale: 0.7')
    expect(wrapper.find('.cdb-sub').attributes('style')).toContain('var(--tpl-font-accent, Montserrat)')
  })

  it('drops the time line when the template turns it off', () => {
    const wrapper = mountBlocks({ details: { showTime: false } })
    expect(wrapper.findAll('.cdb-line').map((l) => l.text())).toEqual(['123 Anywhere St., Any City'])
  })
})
