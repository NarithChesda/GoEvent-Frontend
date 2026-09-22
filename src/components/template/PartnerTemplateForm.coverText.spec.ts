// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import PartnerTemplateForm from './PartnerTemplateForm.vue'
import PartnerTemplatePreview from './PartnerTemplatePreview.vue'
import type { CoverStageLayout, PartnerTemplate } from '@/services/api'

// Keys in, keys out: the assertions below read the labels the form asked for.
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
    locale: { value: 'en' },
  }),
}))

const coverLayout: CoverStageLayout = {
  layoutMode: 'free',
  showCoverHosts: true,
  showCoverDate: true,
  showCoverLogo: false,
  // A size and a slot left on the names block's BOX by the editor before text
  // styles existed. Free mode, so they have always rendered.
  coverElements: {
    hosts: { x: 50, y: 46, width: 84, height: 20, fontScale: 1.4, fontType: 'accent' },
  },
}

const template = {
  id: 7,
  name: 'Sage',
  status: 'draft',
  package_plan: { id: 3, name: 'Basic' },
  cover_stage_layout: coverLayout,
  template_colors: [],
  template_fonts: [
    { id: 1, language: 'en', font_type: 'primary', font: { id: 5, name: 'Cormorant Garamond' } },
    { id: 2, language: 'kh', font_type: 'primary', font: { id: 6, name: 'Kantumruy Pro' } },
  ],
} as unknown as PartnerTemplate

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  const ok = (data: unknown) => vi.fn(async () => ({ success: true, data }))
  return {
    ...actual,
    packagePlanService: { listPlans: ok([]) },
    customFontsService: { listFonts: ok([]) },
    partnerTemplateService: {
      listColors: ok([]),
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

async function openCoverSection() {
  const wrapper = mount(PartnerTemplateForm, {
    props: { isOpen: true, existingTemplate: template, eventId: 'evt' },
    global: { stubs: { PartnerTemplatePreview: true, Teleport: true } },
  })
  await flushPromises()
  const rail = wrapper.findAll('nav button')
  const cover = rail.find((button) => button.text().includes('sections.cover'))
  await cover!.trigger('click')
  await flushPromises()
  return wrapper
}

const draftLayout = (wrapper: Awaited<ReturnType<typeof openCoverSection>>) =>
  wrapper.findComponent(PartnerTemplatePreview).props('draft').cover_stage_layout as CoverStageLayout

/** The Text styles row whose font select is labelled for `textKey`. */
function textRow(wrapper: Awaited<ReturnType<typeof openCoverSection>>, textKey: string) {
  const label = wrapper
    .findAll('label')
    .find((l) => l.text() === `management.partnerTemplateForm.coverText.texts.${textKey}`)
  expect(label, `a row for ${textKey}`).toBeTruthy()
  // The select's label and the size field sit in one grid row.
  return label!.element.closest('.grid') as HTMLElement
}

describe('PartnerTemplateForm — cover text styles', () => {
  it('lists one row per text that is on the cover', async () => {
    const wrapper = await openCoverSection()
    const labels = wrapper.findAll('label').map((l) => l.text())
    // Header, invite and guest name are on by default; the names bring their
    // small line (surname by default); the date is on; the venue is not.
    for (const id of ['header', 'invite', 'guest', 'hostNames', 'hostSubline', 'date']) {
      expect(labels).toContain(`management.partnerTemplateForm.coverText.texts.${id}`)
    }
    expect(labels).not.toContain('management.partnerTemplateForm.coverText.texts.location')
  })

  it('names what each font slot holds, one name per language', async () => {
    const wrapper = await openCoverSection()
    const options = [...textRow(wrapper, 'date').querySelectorAll('option')].map((o) => o.textContent?.trim())
    expect(options).toContain('management.coverLayoutEditor.fontTypes.primary · Cormorant Garamond / Kantumruy Pro')
  })

  it('shows what the names render at today, box fallback included', async () => {
    const wrapper = await openCoverSection()
    const row = textRow(wrapper, 'hostNames')
    expect((row.querySelector('select') as HTMLSelectElement).value).toBe('accent')
    expect((row.querySelector('input[type="number"]') as HTMLInputElement).value).toBe('140')
  })

  it('writes the text style and takes the old type off the box', async () => {
    const wrapper = await openCoverSection()
    const row = textRow(wrapper, 'hostNames')
    const size = row.querySelector('input[type="number"]') as HTMLInputElement
    size.value = '120'
    size.dispatchEvent(new Event('input'))
    await flushPromises()

    const layout = draftLayout(wrapper)
    // The slot it was inheriting survives the resize, now as its own.
    expect(layout.coverText?.hostNames).toEqual({ fontType: 'accent', fontScale: 1.2 })
    expect(layout.coverElements?.hosts?.fontScale).toBeUndefined()
    expect(layout.coverElements?.hosts?.fontType).toBeUndefined()
    // Geometry is left exactly where it was.
    expect(layout.coverElements?.hosts).toMatchObject({ x: 50, y: 46, width: 84, height: 20 })
  })

  it('picking Default really clears the slot rather than falling back to the box', async () => {
    const wrapper = await openCoverSection()
    const select = textRow(wrapper, 'hostNames').querySelector('select') as HTMLSelectElement
    select.value = 'auto'
    select.dispatchEvent(new Event('change'))
    await flushPromises()

    expect(draftLayout(wrapper).coverText?.hostNames).toEqual({ fontScale: 1.4 })
    expect((textRow(wrapper, 'hostNames').querySelector('select') as HTMLSelectElement).value).toBe('auto')
  })

  it('never creates a box for a row block when styling its text', async () => {
    const wrapper = await openCoverSection()
    const size = textRow(wrapper, 'guest').querySelector('input[type="number"]') as HTMLInputElement
    size.value = '130'
    size.dispatchEvent(new Event('input'))
    await flushPromises()

    const layout = draftLayout(wrapper)
    expect(layout.coverText?.guest).toEqual({ fontScale: 1.3 })
    expect(layout.coverElements?.guest).toBeUndefined()
  })
})
