// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import EventInfo from './EventInfo.vue'
import MapFrame from './map-designs/MapFrame.vue'
import { EditIntentKey } from '@/components/showcase-preview/edit/editContext'

// The studio affordances read the app's i18n; the showcase itself doesn't need it.
vi.mock('@/composables/useAppLanguage', () => ({
  useAppLanguage: () => ({ t: (k: string) => k, locale: { value: 'en' } }),
}))

// EventInfo watches for itself scrolling into view; jsdom has no observer.
vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)

type Props = InstanceType<typeof EventInfo>['$props']

const CARD_SHELLS = ['.gradient-stroke-container', '.frosted-sheet', '.engraved-sheet']

const mountInfo = (props: Partial<Props> = {}, options: { studio?: boolean } = {}) =>
  mount(EventInfo, {
    props: {
      primaryColor: '#4a2336',
      accentColor: '#b8893a',
      backgroundColor: '#f6ede3',
      currentFont: 'serif',
      currentLanguage: 'en',
      eventStartDate: '2026-12-12T10:00:00Z',
      detailsDesign: 'flanked',
      locationText: 'Sofitel Phnom Penh Phokeethra',
      hasGoogleMap: true,
      googleMapEmbedLink: 'https://www.google.com/maps/embed?pb=x',
      infoCardDesign: 'glass',
      ...props,
    } as Props,
    global: options.studio
      ? { provide: { [EditIntentKey as symbol]: { requestEdit: vi.fn() } } }
      : {},
  })

describe('EventInfo — the venue', () => {
  it('keeps the card round the venue, map, countdown and RSVP while they share it', () => {
    for (const infoCardDesign of ['glass', 'frosted', 'engraved'] as const) {
      const wrapper = mountInfo({ infoCardDesign })
      expect(wrapper.find('.venue-block').exists()).toBe(false)
      expect(CARD_SHELLS.some((shell) => wrapper.find(shell).exists())).toBe(true)
    }
  })

  /**
   * With the countdown and RSVP in a section of their own, a card round one
   * map is a container for its own sake: the venue sits on the page.
   */
  it('sets the venue on the page, with no card material, once the pair has left', () => {
    for (const infoCardDesign of ['glass', 'frosted', 'engraved'] as const) {
      const wrapper = mountInfo({ infoCardDesign, countdownRsvpInSection: true })
      expect(wrapper.find('.venue-block').exists()).toBe(true)
      expect(CARD_SHELLS.every((shell) => !wrapper.find(shell).exists())).toBe(true)
      expect(wrapper.find('.venue-block__name').text()).toBe('Sofitel Phnom Penh Phokeethra')
    }
  })

  it('frames the map on the page with the chosen frame, the window included', () => {
    const window = mountInfo({ countdownRsvpInSection: true })
    expect(window.findComponent(MapFrame).props('variant')).toBe('window')

    const arch = mountInfo({ countdownRsvpInSection: true, mapStyle: 'arch' })
    expect(arch.findComponent(MapFrame).props('variant')).toBe('arch')
    // On the page there is no glass to be white against.
    expect(arch.findComponent(MapFrame).props('light')).toBe(false)
  })

  it('draws the frame in the date design’s marker colour and on the shared paper', () => {
    const stationery = { paper: '#fdf2f4', radius: 14, tone: 'light' as const, shadow: 'none' }
    const wrapper = mountInfo({
      countdownRsvpInSection: true,
      mapStyle: 'polaroid',
      detailsMarkerColorSource: 'secondary',
      secondaryColor: '#8a6a55',
      stationery,
    })
    const frame = wrapper.findComponent(MapFrame)
    expect(frame.props('accent')).toBe('#8a6a55')
    expect(frame.props('stationery')).toEqual(stationery)
    // The polaroid writes the venue in its own margin, so it isn't set above too.
    expect(wrapper.find('.venue-block__name').exists()).toBe(false)
  })

  it('leaves the venue to date designs that set it themselves', () => {
    const wrapper = mountInfo({ countdownRsvpInSection: true, detailsDesign: 'ticket' })
    expect(wrapper.find('.venue-block__name').exists()).toBe(false)
    expect(wrapper.findComponent(MapFrame).exists()).toBe(true)
  })

  it('draws nothing at all when the page has no venue line and no map', () => {
    const wrapper = mountInfo({
      countdownRsvpInSection: true,
      detailsDesign: 'ticket',
      hasGoogleMap: false,
      googleMapEmbedLink: undefined,
    })
    expect(wrapper.find('.venue-block').exists()).toBe(false)
  })

  it('offers to add a map in the studio, in the map’s own place', () => {
    const wrapper = mountInfo(
      { countdownRsvpInSection: true, hasGoogleMap: false, googleMapEmbedLink: undefined },
      { studio: true },
    )
    expect(wrapper.find('.venue-block__add').exists()).toBe(true)
  })
})
