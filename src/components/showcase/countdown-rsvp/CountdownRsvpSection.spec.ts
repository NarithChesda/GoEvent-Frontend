// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import CountdownRsvpSection from './CountdownRsvpSection.vue'
import CountdownStrips from './countdown-designs/CountdownStrips.vue'
import CountdownFlip from './countdown-designs/CountdownFlip.vue'
import CountdownOrbit from './countdown-designs/CountdownOrbit.vue'
import CountdownTypeset from './countdown-designs/CountdownTypeset.vue'
import RsvpCard from './rsvp-designs/RsvpCard.vue'
import RsvpEnvelope from './rsvp-designs/RsvpEnvelope.vue'
import RsvpGlass from './rsvp-designs/RsvpGlass.vue'
import RsvpInline from './rsvp-designs/RsvpInline.vue'
import { EditIntentKey } from '@/components/showcase-preview/edit/editContext'
import { PAPER_DARK } from '../stationery'
import type { CountdownRsvpDesignConfig } from '@/services/api/types/template.types'

// The studio chips read the app's i18n; the showcase itself doesn't need it.
vi.mock('@/composables/useAppLanguage', () => ({
  useAppLanguage: () => ({ t: (k: string) => k, locale: { value: 'en' } }),
}))

vi.mock('@/composables/showcase/useTemplateProcessor', () => ({
  PHOTO_DELIVERY: {},
  useTemplateProcessor: () => ({ getOptimizedMediaUrl: (url: string) => url }),
}))

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** A start this far ahead, with half a minute of slack so the floor is stable. */
const startIn = (ms: number) => new Date(Date.now() + ms + 30_000).toISOString()

type Props = InstanceType<typeof CountdownRsvpSection>['$props']

const mountSection = (
  props: Partial<Props> = {},
  options: { studio?: boolean } = {},
) =>
  mount(CountdownRsvpSection, {
    props: {
      design: { countdown: 'strips', rsvp: 'card' } as CountdownRsvpDesignConfig,
      eventStartDate: startIn(42 * DAY + 7 * HOUR + 12 * MINUTE),
      showCountdown: true,
      showRsvp: true,
      isEventPast: false,
      photos: [],
      primaryColor: '#3b1f2b',
      accentColor: '#c9a227',
      backgroundColor: '#f7efe6',
      currentFont: 'serif',
      currentLanguage: 'en',
      ...props,
    } as Props,
    slots: { rsvp: '<form class="the-form">reply</form>' },
    global: options.studio
      ? { provide: { [EditIntentKey as symbol]: { requestEdit: vi.fn() } } }
      : {},
  })

describe('CountdownRsvpSection', () => {
  it.each([
    ['strips', CountdownStrips],
    ['flip', CountdownFlip],
    ['orbit', CountdownOrbit],
    ['typeset', CountdownTypeset],
  ] as const)('draws the %s countdown', (countdown, component) => {
    const wrapper = mountSection({ design: { countdown, rsvp: 'card' } })
    expect(wrapper.findComponent(component).exists()).toBe(true)
  })

  it.each([
    ['card', RsvpCard, true],
    ['envelope', RsvpEnvelope, true],
    ['glass', RsvpGlass, false],
    ['inline', RsvpInline, true],
  ] as const)('sets the form on the %s shell, inked: %s', (rsvp, component, inked) => {
    const wrapper = mountSection({ design: { countdown: 'typeset', rsvp } })
    const shell = wrapper.findComponent(component)
    expect(shell.exists()).toBe(true)
    // The form arrives inside the shell, in the wrapper that inks it — every
    // shell but glass, which keeps the forms' native white.
    expect(shell.find('.the-form').exists()).toBe(true)
    expect(shell.find('.crs-form').classes().includes('crs-form--ink')).toBe(inked)
  })

  it('counts days, hours and minutes to the start', () => {
    const wrapper = mountSection({ design: { countdown: 'typeset', rsvp: 'card' } })
    const units = wrapper.findComponent(CountdownTypeset).props('units')
    expect(units.map((u: { value: string }) => u.value)).toEqual(['42', '07', '12'])
    expect(units.map((u: { label: string }) => u.label)).toEqual(['Days', 'Hours', 'Minutes'])
  })

  it('writes the count in Khmer numerals and words for Khmer', () => {
    const wrapper = mountSection({
      design: { countdown: 'typeset', rsvp: 'card' },
      currentLanguage: 'kh',
    })
    const units = wrapper.findComponent(CountdownTypeset).props('units')
    expect(units[0].value).toBe('៤២')
    expect(units[2].label).toBe('នាទី')
  })

  it('stops drawing the count once the start has passed, and keeps the reply', () => {
    const wrapper = mountSection({ eventStartDate: new Date(Date.now() - HOUR).toISOString() })
    expect(wrapper.find('.crs-countdown').exists()).toBe(false)
    expect(wrapper.find('.crs-rsvp').exists()).toBe(true)
  })

  it('draws no reply shell once the event has ended — the forms hide themselves then', () => {
    const wrapper = mountSection({ isEventPast: true })
    expect(wrapper.find('.crs-rsvp').exists()).toBe(false)
  })

  it('honours the organizer switching either block off', () => {
    const wrapper = mountSection({ showCountdown: false, showRsvp: false })
    expect(wrapper.find('.crs-countdown').exists()).toBe(false)
    expect(wrapper.find('.crs-rsvp').exists()).toBe(false)
  })

  it('keeps switched-off blocks in the studio, with their on/off chips', () => {
    const wrapper = mountSection({ showCountdown: false, showRsvp: false }, { studio: true })
    expect(wrapper.find('.crs-countdown').exists()).toBe(true)
    expect(wrapper.find('.crs-rsvp').exists()).toBe(true)
    expect(wrapper.findAll('.section-display-toggle')).toHaveLength(2)
  })

  /** Gold on the card stock measures about 2:1 — the form's labels would vanish. */
  it('prints the reply card in near-black when the template ink is too pale for paper', () => {
    const wrapper = mountSection({ primaryColor: '#dfa54b', backgroundColor: '#fff8ec' })
    const form = wrapper.find('.crs-form')
    expect(form.attributes('style')).toContain(`--crs-form-ink: ${PAPER_DARK}`)
  })

  /** One accent for the set: the date design's marker, not the template's accent. */
  it('spends its marks in the date design’s marker colour', () => {
    const wrapper = mountSection({ markerColor: '#7d8f73' })
    expect(wrapper.find('.crs').attributes('style')).toContain('--crs-accent: #7d8f73')
  })

  it('prints the reply card on the invitation’s one paper, corner and lift', () => {
    const wrapper = mountSection({
      stationery: { paper: '#fdf2f4', radius: 14, tone: 'light', shadow: '0 1px 2px red' },
    })
    const style = wrapper.find('.crs').attributes('style')
    expect(style).toContain('--crs-card-paper: #fdf2f4')
    expect(style).toContain('--crs-radius: 14px')
    expect(style).toContain('--crs-paper-shadow: 0 1px 2px red')
  })

  it('cuts the strips from the featured photograph', () => {
    const wrapper = mountSection({
      photos: [
        { id: 1, image: '/first.jpg', is_featured: false },
        { id: 2, image: '/featured.jpg', is_featured: true },
      ] as Props['photos'],
    })
    expect(wrapper.findComponent(CountdownStrips).props('photo')?.id).toBe(2)
    // One image per strip, all three the same print.
    const sources = wrapper.findAll('.cds__img').map((img) => img.attributes('src'))
    expect(sources).toEqual(['/featured.jpg', '/featured.jpg', '/featured.jpg'])
  })

  it('cuts the strips from the photo marked for the countdown, over the featured one', () => {
    const wrapper = mountSection({
      photos: [
        { id: 1, image: '/featured.jpg', is_featured: true },
        { id: 2, image: '/countdown.jpg', is_featured: false, is_countdown_photo: true },
      ] as Props['photos'],
    })
    expect(wrapper.findComponent(CountdownStrips).props('photo')?.id).toBe(2)
  })

  /** The one design that runs edge to edge, the way a photo band does. */
  it('bleeds the strips to the card edges, and only the strips', () => {
    const strips = mountSection({ bleedClass: '-mx-6' })
    expect(strips.find('.cds').classes()).toContain('-mx-6')

    const typeset = mountSection({ bleedClass: '-mx-6', design: { countdown: 'typeset', rsvp: 'card' } })
    expect(typeset.find('.cdt').classes()).not.toContain('-mx-6')
  })

  it('opens the countdown photo editor from the strips in the studio, told the stripes', async () => {
    const requestEdit = vi.fn()
    const wrapper = mount(CountdownRsvpSection, {
      props: {
        design: { countdown: 'strips', rsvp: 'card' },
        eventStartDate: startIn(3 * DAY),
        showCountdown: true,
        showRsvp: false,
        isEventPast: false,
        photos: [],
        primaryColor: '#3b1f2b',
        accentColor: '#c9a227',
        currentFont: 'serif',
      } as Props,
      global: { provide: { [EditIntentKey as symbol]: { requestEdit } } },
    })
    await wrapper.find('.cds__region').trigger('click')
    const intent = requestEdit.mock.calls[0][0]
    expect(intent.kind).toBe('countdownPhoto')
    expect(intent.frameAspect).toBeCloseTo(4 / 5)
    expect(intent.shape.url).toMatch(/^data:image\/svg\+xml,/)
  })

  it('arrives at once where it cannot observe scrolling', async () => {
    // jsdom has no IntersectionObserver: nothing would ever flip the flags, and
    // both blocks would sit at their hidden starting state.
    const wrapper = mountSection()
    await nextTick()
    await nextTick()
    expect(wrapper.findComponent(CountdownStrips).props('revealed')).toBe(true)
    expect(wrapper.findComponent(RsvpCard).props('revealed')).toBe(true)
  })
})
