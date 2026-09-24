// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

import CoverContentRows from './CoverContentRows.vue'

// The inline-edit primitives read the app language during setup, which throws
// without the i18n plugin installed. Same mock HostInfoWedding.spec uses.
vi.mock('@/composables/useAppLanguage', () => ({
  useAppLanguage: () => ({ t: (k: string) => k, locale: { value: 'en' } }),
}))

/** Every URL the logo's aspect measurement loaded. */
let measured: string[] = []

beforeEach(() => {
  measured = []
  // jsdom has no ResizeObserver; the guest-name row sizes itself with one.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
  // The logo's aspect ratio is read by loading it into an Image, which jsdom
  // silently ignores — record the load instead.
  vi.stubGlobal(
    'Image',
    class {
      decoding = ''
      onload: (() => void) | null = null
      set src(url: string) {
        measured.push(url)
      }
    },
  )
})

type RowsProps = InstanceType<typeof CoverContentRows>['$props']

const mountRows = (props: Partial<RowsProps> = {}) =>
  mount(CoverContentRows, {
    global: { stubs: { GuestNameFrame: true } },
    props: {
      eventTitle: 'Sochea & Sokphea',
      eventLogo: 'logo.png',
      guestName: 'Dara',
      primaryColor: '#5b4636',
      currentFont: 'serif',
      containerStyle: { top: '23.5vh', height: '53vh' },
      rowStyles: {
        eventTitle: { height: '18.75%' },
        logo: { height: '48%' },
        inviteText: { height: '8.75%' },
        guestName: { height: '16%' },
      },
      getMediaUrl: (url: string) => `https://cdn.test/${url}`,
      ...props,
    } as RowsProps,
  })

describe('CoverContentRows block switches', () => {
  it('draws the logo and the invite text by default', () => {
    const wrapper = mountRows()

    expect(wrapper.find('.content-row-logo img.scaled-logo').exists()).toBe(true)
    expect(wrapper.find('.content-row-invite .scaled-invite-text').exists()).toBe(true)
    // Drawn at its natural size, so there is nothing to measure.
    expect(measured).toEqual([])
  })

  it('fills the merged row with the logo when the header is hidden', () => {
    const wrapper = mountRows({ showCoverHeaderText: false })

    expect(wrapper.find('.content-row-logo .logo-fill img').exists()).toBe(true)
    expect(measured).toEqual(['https://cdn.test/logo.png'])
  })

  // The photo frame is a block of its own now (CoverPhotoFrame); the logo row
  // draws a logo and nothing else.
  it('draws nothing but the logo in the logo row', () => {
    const wrapper = mountRows({ showCoverHeaderText: false })

    expect(wrapper.findAll('.content-row-logo img')).toHaveLength(1)
  })

  it('empties the logo row without closing it, so nothing below moves', () => {
    const wrapper = mountRows({ showCoverLogo: false })
    const row = wrapper.find('.content-row-logo')

    expect(row.exists()).toBe(true)
    expect(row.attributes('style')).toContain('height: 48%')
    expect(row.element.childElementCount).toBe(0)
    expect(wrapper.find('.content-row-invite .scaled-invite-text').exists()).toBe(true)
    expect(wrapper.find('.content-row-guest').exists()).toBe(true)
  })

  it('does not download a logo it is not going to draw', () => {
    mountRows({ showCoverLogo: false, showCoverHeaderText: false })

    expect(measured).toEqual([])
  })

  it('empties the invite row without closing it, so the guest name stays put', () => {
    const wrapper = mountRows({ showCoverInviteText: false })
    const row = wrapper.find('.content-row-invite')

    expect(row.exists()).toBe(true)
    expect(row.attributes('style')).toContain('height: 8.75%')
    expect(row.element.childElementCount).toBe(0)
    expect(wrapper.find('.content-row-guest').exists()).toBe(true)
    expect(wrapper.find('.content-row-logo img').exists()).toBe(true)
  })
})
