// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import GuestInviteSection from './GuestInviteSection.vue'
import GuestInviteInscribed from './guest-invite-designs/GuestInviteInscribed.vue'
import GuestInviteFormal from './guest-invite-designs/GuestInviteFormal.vue'
import GuestInvitePlaceCard from './guest-invite-designs/GuestInvitePlaceCard.vue'
import GuestInviteTag from './guest-invite-designs/GuestInviteTag.vue'
import type { GuestInviteDesignType } from '@/services/api/types/template.types'

// InlineEditableText reads the app's i18n; the showcase itself doesn't need it.
vi.mock('@/composables/useAppLanguage', () => ({
  useAppLanguage: () => ({ t: (k: string) => k, locale: { value: 'en' } }),
}))

type Props = InstanceType<typeof GuestInviteSection>['$props']

const mountSection = (props: Partial<Props> = {}) =>
  mount(GuestInviteSection, {
    props: {
      guestName: 'Sok Dara',
      primaryColor: '#5b4636',
      accentColor: '#c9a227',
      currentFont: 'serif',
      currentLanguage: 'en',
      guestInviteDesign: { type: 'inscribed' },
      ...props,
    } as Props,
  })

describe('GuestInviteSection', () => {
  it.each([
    ['inscribed', GuestInviteInscribed],
    ['formal', GuestInviteFormal],
    ['place_card', GuestInvitePlaceCard],
    ['tag', GuestInviteTag],
  ] as const)('draws the %s design', (type, component) => {
    const wrapper = mountSection({ guestInviteDesign: { type } })
    expect(wrapper.findComponent(component).exists()).toBe(true)
    expect(wrapper.find('.gid').classes()).toContain(`gid--${type}`)
  })

  it('draws inscribed for a design this build does not know', () => {
    const wrapper = mountSection({
      guestInviteDesign: { type: 'envelope' as GuestInviteDesignType },
    })
    expect(wrapper.findComponent(GuestInviteInscribed).exists()).toBe(true)
  })

  it("uses the organizer's invite text in the language on screen", () => {
    const wrapper = mountSection({
      currentLanguage: 'en',
      eventTexts: [
        { text_type: 'invite_text', language: 'kh', content: 'សូមគោរពអញ្ជើញ' },
        { text_type: 'invite_text', language: 'en', content: 'With love, for' },
      ],
    })
    expect(wrapper.find('.gid-invite').text()).toBe('With love, for')
  })

  it('falls back to the translated invite line when the organizer wrote none', () => {
    const wrapper = mountSection({ currentLanguage: 'kh', eventTexts: [] })
    expect(wrapper.find('.gid-invite').text()).toBe('សូមគោរពអញ្ជើញ')
  })

  it('keeps every word of the name, and a wrappable space between them', () => {
    const wrapper = mountSection({ guestName: '  Mr.  and Mrs. Sok  ' })
    const words = wrapper.findAll('.gid-word').map((w) => w.text())
    expect(words).toEqual(['Mr.', 'and', 'Mrs.', 'Sok'])
    // A real space between the inline-block words, never a no-break one, or a
    // long household name could not wrap.
    expect(wrapper.find('.gid-name').text()).toBe('Mr. and Mrs. Sok')
  })

  it('marks a Khmer name as Khmer whatever language the invitation is in', () => {
    const wrapper = mountSection({ currentLanguage: 'en', guestName: 'លោក សុខ ដារ៉ា' })
    expect(wrapper.find('.gid-name').classes()).toContain('gid-khmer')
    expect(wrapper.find('.gid-invite').classes()).not.toContain('gid-khmer')
  })

  it('steps a long household name down rather than setting it at display size', () => {
    const short = mountSection({ guestName: 'Dara' })
    const long = mountSection({
      guestName: 'His Excellency Sok Dara and Lok Chumteav Chan Sreymom and family',
    })
    expect(short.find('.gid').attributes('style')).toContain('--gid-name-scale: 1')
    expect(long.find('.gid').attributes('style')).toContain('--gid-name-scale: 0.72')
  })

  it('arrives at once where it cannot observe scrolling', async () => {
    // jsdom has no IntersectionObserver: nothing would ever flip the flag, and
    // the block would sit at opacity 0.
    const wrapper = mountSection()
    await nextTick()
    expect(wrapper.findComponent(GuestInviteInscribed).props('revealed')).toBe(true)
  })
})
