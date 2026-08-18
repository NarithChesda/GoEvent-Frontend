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

const CUSTOM_LINK = 'https://www.google.com/maps/embed?pb=!custom!link'

const baseEvent = { id: 'e1', youtube_embed_link: '', google_map_embed_link: '' }

// Teleported modals outlive their wrapper, so every mount is tracked and torn
// down — otherwise one test's open modal is still in document.body for the next.
const mounted: { unmount: () => void }[] = []

const mountSection = (mapLink: string, canEdit = true) => {
  const wrapper = mount(EmbedsSection, {
    props: {
      canEdit,
      eventData: { ...baseEvent, google_map_embed_link: mapLink } as never,
    },
    attachTo: document.body,
  })
  mounted.push(wrapper)
  return wrapper
}

type Wrapper = ReturnType<typeof mountSection>

const findByText = (wrapper: Wrapper, needle: string) =>
  wrapper.findAll('button').find((b) => b.text().includes(needle))

const findByLabel = (wrapper: Wrapper, label: string) =>
  wrapper.findAll('button').find((b) => (b.attributes('aria-label') ?? '').includes(label))

describe('EmbedsSection map card', () => {
  // An unimported icon only ever surfaces as a console warning, so a missing
  // lucide import would otherwise ship silently.
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    while (mounted.length) mounted.pop()!.unmount()

    const unresolved = warnSpy.mock.calls
      .map((args) => String(args[0]))
      .filter((msg) => msg.includes('Failed to resolve component'))
    warnSpy.mockRestore()
    expect(unresolved).toEqual([])
  })

  describe('with no map set', () => {
    it('offers an add affordance that opens the same editor the preview opens', async () => {
      const wrapper = mountSection('')

      const add = findByText(wrapper, 'editors.addMap')
      expect(add).toBeTruthy()

      // The modal is inert until asked for, then teleports into the document.
      expect(document.body.textContent).not.toContain('gmapTitle')
      await add!.trigger('click')
      expect(document.body.textContent).toContain('gmapTitle')
    })

    it('renders no map frame and no remove action', () => {
      const wrapper = mountSection('')
      expect(wrapper.findAll('iframe')).toHaveLength(0)
      expect(findByLabel(wrapper, 'map.removeBtn')).toBeUndefined()
    })

    it('gives a viewer the empty label rather than an add prompt', () => {
      const wrapper = mountSection('', false)
      expect(wrapper.text()).toContain('map.empty')
      expect(findByText(wrapper, 'editors.addMap')).toBeUndefined()
    })
  })

  describe('with a map set', () => {
    it('renders one preview, in the 16:9 frame the showcase uses', () => {
      const wrapper = mountSection(presetData.presets[0].embedUrl)

      const frames = wrapper.findAll('iframe')
      expect(frames).toHaveLength(1)
      expect(frames[0].element.parentElement?.className).toContain('aspect-video')
    })

    it('names the map in words instead of showing its URL', () => {
      const wrapper = mountSection(presetData.presets[0].embedUrl)

      expect(wrapper.text()).toContain(presetData.presets[0].name)
      // The `?pb=…` blob belongs in the editor, not on the resting screen.
      expect(wrapper.find('textarea').exists()).toBe(false)
      expect(wrapper.text()).not.toContain('!1m18')
    })

    it('labels a hand-pasted link as custom rather than guessing a venue', () => {
      expect(mountSection(CUSTOM_LINK).text()).toContain('source.custom')
    })

    it('opens the editor from the change action', async () => {
      const wrapper = mountSection(presetData.presets[0].embedUrl)

      expect(document.body.textContent).not.toContain('gmapTitle')
      await findByText(wrapper, 'map.changeBtn')!.trigger('click')
      expect(document.body.textContent).toContain('gmapTitle')
    })

    it('routes the remove action through the delete confirmation', async () => {
      const wrapper = mountSection(presetData.presets[0].embedUrl)

      expect(document.body.textContent).not.toContain('map.deleteModal.title')
      await findByLabel(wrapper, 'map.removeBtn')!.trigger('click')
      expect(document.body.textContent).toContain('map.deleteModal.title')
    })

    it('shows a viewer the map without any editing chrome', () => {
      const wrapper = mountSection(presetData.presets[0].embedUrl, false)

      expect(wrapper.findAll('iframe')).toHaveLength(1)
      expect(findByText(wrapper, 'map.changeBtn')).toBeUndefined()
      expect(findByLabel(wrapper, 'map.removeBtn')).toBeUndefined()
    })
  })
})
