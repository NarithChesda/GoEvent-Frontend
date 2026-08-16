// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
// ScrollTrigger registers at import time and reads matchMedia (see
// plugins/gsap.ts), so this has to be in place before the component imports.
vi.hoisted(() => {
  globalThis.matchMedia = (() => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  })) as unknown as typeof globalThis.matchMedia
})

import V2VenueSection from './V2VenueSection.vue'
import { EditIntentKey } from '@/components/showcase-preview/edit/editContext'

vi.mock('@/composables/useAppLanguage', () => ({
  useAppLanguage: () => ({ t: (k: string) => k, locale: { value: 'en' } }),
}))

const MAP = 'https://www.google.com/maps/embed?pb=!1m18'

const mountVenue = (props: Record<string, unknown>, editable = false) =>
  mount(V2VenueSection, {
    props: { chapterNumber: 3, title: 'Venue', ...props },
    global: {
      stubs: { V2ChapterShell: { template: '<div><slot /></div>' } },
      ...(editable
        ? { provide: { [EditIntentKey as symbol]: { requestEdit: vi.fn() } } }
        : {}),
    },
  })

describe('V2VenueSection map editing', () => {
  it('renders a bare iframe on the public showcase', () => {
    const wrapper = mountVenue({ googleMapEmbedLink: MAP })

    expect(wrapper.find('iframe').exists()).toBe(true)
    // No edit chrome leaks into production.
    expect(wrapper.find('.editable-region').exists()).toBe(false)
  })

  it('shows no add-map affordance on the public showcase', () => {
    const wrapper = mountVenue({ googleMapEmbedLink: '' })

    expect(wrapper.find('.v2-venue-map-placeholder').exists()).toBe(false)
  })

  it('wraps the map in an editable region inside the preview', () => {
    const wrapper = mountVenue({ googleMapEmbedLink: MAP }, true)

    expect(wrapper.find('.editable-region').exists()).toBe(true)
    expect(wrapper.find('iframe').exists()).toBe(true)
  })

  it('offers an add-map affordance in the preview when no map is set', async () => {
    const requestEdit = vi.fn()
    const wrapper = mount(V2VenueSection, {
      props: { chapterNumber: 3, title: 'Venue', googleMapEmbedLink: '' },
      global: {
        stubs: { V2ChapterShell: { template: '<div><slot /></div>' } },
        provide: { [EditIntentKey as symbol]: { requestEdit } },
      },
    })

    const placeholder = wrapper.find('.v2-venue-map-placeholder')
    expect(placeholder.exists()).toBe(true)

    await placeholder.trigger('click')
    expect(requestEdit).toHaveBeenCalledWith({ kind: 'gmapEmbed' })
  })
})
