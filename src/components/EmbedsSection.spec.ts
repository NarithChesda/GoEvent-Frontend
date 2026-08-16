// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EmbedsSection from '@/components/EmbedsSection.vue'
import presetData from '@/assets/venue-map-presets.json'

vi.stubGlobal(
  'matchMedia',
  vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
)

vi.mock('@/composables/useAppLanguage', () => ({
  useAppLanguage: () => ({ t: (k: string) => k, locale: { value: 'en' } }),
}))
vi.mock('../composables/useToast', () => ({
  useToast: () => ({ showSuccess: vi.fn(), showError: vi.fn() }),
}))
vi.mock('@/composables/useCollapsibleSection', () => ({
  useCollapsibleSection: () => ({ isExpanded: { value: true }, toggle: vi.fn() }),
}))

const baseEvent = { id: 'e1', youtube_embed_link: '', google_map_embed_link: '' }

const mountSection = (mapLink: string) =>
  mount(EmbedsSection, {
    props: {
      canEdit: true,
      eventData: { ...baseEvent, google_map_embed_link: mapLink } as never,
    },
    attachTo: document.body,
  })

describe('EmbedsSection map redesign', () => {
  // An unimported icon only ever surfaces as a console warning, so a missing
  // lucide import would otherwise ship silently.
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    const unresolved = warnSpy.mock.calls
      .map((args) => String(args[0]))
      .filter((msg) => msg.includes('Failed to resolve component'))
    warnSpy.mockRestore()
    expect(unresolved).toEqual([])
  })

  it('renders the preset dropdown as the primary control', () => {
    const wrapper = mountSection('')
    expect(wrapper.html()).toContain('aria-haspopup="dialog"')
    expect(wrapper.html()).toContain('presets.label')
  })

  it('keeps the manual paste field collapsed by default', () => {
    const wrapper = mountSection('')
    const toggle = wrapper.findAll('button').find((b) => b.text().includes('manual.toggle'))
    expect(toggle).toBeTruthy()
    expect(toggle!.attributes('aria-expanded')).toBe('false')
  })

  it('stays collapsed when the saved link is a preset', () => {
    const wrapper = mountSection(presetData.presets[0].embedUrl)
    const toggle = wrapper.findAll('button').find((b) => b.text().includes('manual.toggle'))
    expect(toggle!.attributes('aria-expanded')).toBe('false')
  })

  it('auto-opens when the saved link was pasted by hand', () => {
    const wrapper = mountSection('https://www.google.com/maps/embed?pb=!custom!link')
    const toggle = wrapper.findAll('button').find((b) => b.text().includes('manual.toggle'))
    expect(toggle!.attributes('aria-expanded')).toBe('true')
  })

  it('offers a button that opens the full-size editor modal', async () => {
    const wrapper = mountSection('')
    const openBtn = wrapper.findAll('button').find((b) => b.text().includes('map.openEditor'))
    expect(openBtn).toBeTruthy()

    // The modal is inert until asked for, then teleports into the document.
    expect(document.body.textContent).not.toContain('gmapTitle')
    await openBtn!.trigger('click')
    expect(document.body.textContent).toContain('gmapTitle')
  })

  it('shows a remove action only once a map is set', () => {
    const withoutMap = mountSection('')
    expect(
      withoutMap.findAll('button').some((b) => b.text().includes('map.removeBtn')),
    ).toBe(false)

    const withMap = mountSection(presetData.presets[0].embedUrl)
    expect(withMap.findAll('button').some((b) => b.text().includes('map.removeBtn'))).toBe(true)
  })

  it('renders one map preview, not a duplicate above the editor', () => {
    const wrapper = mountSection(presetData.presets[0].embedUrl)
    expect(wrapper.findAll('iframe')).toHaveLength(1)
  })
})
