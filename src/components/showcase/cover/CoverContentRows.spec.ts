// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

import CoverContentRows from './CoverContentRows.vue'

/**
 * The URL the sample_logo_2 shape analysis was handed. That analysis downloads
 * the image, so `null` here is what "nothing was fetched" looks like.
 */
const mask = vi.hoisted(() => ({ url: null as { value: string | null | undefined } | null }))

// The inline-edit primitives read the app language during setup, which throws
// without the i18n plugin installed. Same mock HostInfoWedding.spec uses.
vi.mock('@/composables/useAppLanguage', () => ({
  useAppLanguage: () => ({ t: (k: string) => k, locale: { value: 'en' } }),
}))

vi.mock('@/composables/showcase/useShapeMaskBounds', async () => {
  const { ref } = await import('vue')
  return {
    useShapeMaskBounds: (url: { value: string | null | undefined }) => {
      mask.url = url
      return { bounds: ref(null) }
    },
  }
})

/** Every URL the base logo's aspect measurement loaded. */
let measured: string[] = []

beforeEach(() => {
  mask.url = null
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
      sampleLogoTwo: 'shape.png',
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

    expect(wrapper.find('.content-row-logo img').exists()).toBe(true)
    expect(wrapper.find('.content-row-invite .scaled-invite-text').exists()).toBe(true)
    expect(measured).toEqual(['https://cdn.test/logo.png'])
    expect(mask.url?.value).toBe('https://cdn.test/shape.png')
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
    mountRows({ showCoverLogo: false })

    expect(measured).toEqual([])
    expect(mask.url?.value).toBeNull()
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
