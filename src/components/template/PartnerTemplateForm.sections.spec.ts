// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import PartnerTemplateForm from './PartnerTemplateForm.vue'
import PartnerTemplatePreview from './PartnerTemplatePreview.vue'
import BasicsSection from './sections/BasicsSection.vue'
import BrandSection from './sections/BrandSection.vue'
import CoverSection from './sections/CoverSection.vue'
import TransitionSection from './sections/TransitionSection.vue'
import EffectsSection from './sections/EffectsSection.vue'
import ContentSection from './sections/ContentSection.vue'
import type { PartnerTemplate } from '@/services/api'

/**
 * Every rail section mounts, and each one's panel is the component that owns it.
 *
 * The editor's six panels are separate components that read their shared state
 * from a provided context rather than from props. Nothing in the type system
 * checks that the provide actually reaches them — a panel rendered outside it
 * throws — and nothing checks that a binding left behind in a panel still
 * resolves. Walking the rail is what does.
 */

// Keys in, keys out.
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
    locale: { value: 'en' },
  }),
}))

const template = {
  id: 7,
  name: 'Sage',
  status: 'draft',
  package_plan: { id: 3, name: 'Standard' },
  display_liquid_glass_background: false,
  cover_stage_layout: { layoutMode: 'free', coverElements: {} },
  template_colors: [{ id: 1, hex_color_code: '#C9A45C', name: 'primary' }],
  template_fonts: [
    { id: 1, language: 'en', font_type: 'primary', font: { id: 5, name: 'Cormorant Garamond' } },
  ],
} as unknown as PartnerTemplate

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  const ok = (data: unknown) => vi.fn(async () => ({ success: true, data }))
  return {
    ...actual,
    packagePlanService: {
      listPlans: ok([{ id: 3, name: 'Standard', is_active: true }]),
    },
    customFontsService: { listFonts: ok([{ id: 5, name: 'Cormorant Garamond', source: 'system' }]) },
    partnerTemplateService: {
      // `template` is only reachable inside the closure: this factory is
      // hoisted above its declaration.
      listColors: vi.fn(async () => ({ success: true, data: template.template_colors })),
      getTemplate: vi.fn(async () => ({ success: true, data: template })),
    },
  }
})

beforeEach(() => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }))
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})

async function openEditor() {
  const wrapper = mount(PartnerTemplateForm, {
    props: { isOpen: true, existingTemplate: template, eventId: 'evt' },
    global: { stubs: { PartnerTemplatePreview: true, Teleport: true } },
  })
  await flushPromises()
  return wrapper
}

type Editor = Awaited<ReturnType<typeof openEditor>>

async function openSection(wrapper: Editor, id: string) {
  const button = wrapper
    .findAll('nav button')
    .find((candidate) => candidate.text().includes(`sections.${id}`))
  expect(button, `a rail chip for ${id}`).toBeTruthy()
  await button!.trigger('click')
  await flushPromises()
}

const SECTIONS = [
  ['basics', BasicsSection],
  ['brand', BrandSection],
  ['cover', CoverSection],
  ['transition', TransitionSection],
  ['effects', EffectsSection],
  ['content', ContentSection],
] as const

describe('PartnerTemplateForm — section panels', () => {
  it('opens on Basics', async () => {
    const wrapper = await openEditor()
    expect(wrapper.findComponent(BasicsSection).exists()).toBe(true)
  })

  for (const [id, component] of SECTIONS) {
    it(`renders the ${id} panel, and only that one`, async () => {
      const wrapper = await openEditor()
      await openSection(wrapper, id)

      expect(wrapper.findComponent(component).exists()).toBe(true)
      for (const [otherId, other] of SECTIONS) {
        if (otherId === id) continue
        expect(wrapper.findComponent(other).exists(), `${otherId} is not also mounted`).toBe(false)
      }
    })
  }

  /**
   * A panel writes into the shared form object rather than emitting an event
   * per field, so this is the property that makes that safe: an edit made
   * inside a panel reaches the editor, and therefore the save path and the live
   * preview, without any plumbing between them.
   */
  it('lets a panel write straight into the shared form', async () => {
    const wrapper = await openEditor()
    await openSection(wrapper, 'content')

    const preview = wrapper.findComponent(PartnerTemplatePreview)
    expect(preview.props('draft').agenda_design).toEqual({ type: 'rail' })

    // Pick a different agenda composition from inside the Content panel.
    const content = wrapper.findComponent(ContentSection)
    const thread = content
      .findAll('button')
      .find((b) => b.text() === 'management.partnerTemplateForm.agendaDesign.types.thread')
    expect(thread, 'the thread agenda option').toBeTruthy()
    await thread!.trigger('click')
    await flushPromises()

    // The editor's own draft — built by buildConfigPayload from the shared form
    // — has moved, without the panel emitting anything.
    expect(preview.props('draft').agenda_design).toEqual({ type: 'thread' })
  })

  /**
   * Walking every section once is also what proves no panel throws on mount —
   * a stale binding in a moved template only shows up when it renders.
   */
  it('survives a full pass over the rail', async () => {
    const wrapper = await openEditor()
    for (const [id] of SECTIONS) {
      await openSection(wrapper, id)
    }
    // Back to the start, to prove nothing is one-shot.
    await openSection(wrapper, 'basics')
    expect(wrapper.findComponent(BasicsSection).exists()).toBe(true)
  })
})
