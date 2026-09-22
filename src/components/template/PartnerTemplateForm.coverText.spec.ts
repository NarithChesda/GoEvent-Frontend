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

async function openCoverSection(layout: CoverStageLayout = coverLayout) {
  const wrapper = mount(PartnerTemplateForm, {
    props: {
      isOpen: true,
      existingTemplate: { ...template, cover_stage_layout: layout },
      eventId: 'evt',
    },
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

/** The type row (font select + size) for one text, inside its block's settings. */
function textRow(wrapper: Awaited<ReturnType<typeof openCoverSection>>, textKey: string) {
  const row = wrapper.find(`[data-cover-text="${textKey}"]`)
  expect(row.exists(), `a row for ${textKey}`).toBe(true)
  return row.element as HTMLElement
}

const textRowIds = (wrapper: Awaited<ReturnType<typeof openCoverSection>>) =>
  wrapper.findAll('[data-cover-text]').map((row) => row.attributes('data-cover-text'))

describe('PartnerTemplateForm — cover text styles', () => {
  it('lists one row per text that is on the cover', async () => {
    const wrapper = await openCoverSection()
    // Header, invite and guest name are on by default; the names bring their
    // small line (surname by default); the date is on; the venue is not.
    expect(textRowIds(wrapper)).toEqual(['header', 'invite', 'guest', 'hostNames', 'hostSubline', 'date'])
  })

  it('labels a lone text "Font" and the names by text', async () => {
    const wrapper = await openCoverSection()
    const label = (id: string) => textRow(wrapper, id).querySelector('label')?.textContent?.trim()
    expect(label('guest')).toBe('management.coverLayoutEditor.fields.fontType')
    expect(label('hostNames')).toBe('management.partnerTemplateForm.coverText.texts.hostNames')
    expect(label('hostSubline')).toBe('management.partnerTemplateForm.coverText.texts.hostSubline')
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

describe('PartnerTemplateForm — cover blocks', () => {
  it('lists every block once, in the order the cover draws them', async () => {
    const wrapper = await openCoverSection()
    const blocks = wrapper.findAll('[data-cover-block]').map((row) => row.attributes('data-cover-block'))
    expect(blocks).toEqual(['header', 'logo', 'invite', 'guest', 'hosts', 'date', 'location'])
  })

  it("keeps a block's type after its own settings, inside its switch", async () => {
    const wrapper = await openCoverSection()
    // The guest name's frame and its font are one block's settings: nothing of
    // another block sits between the frame picker and the guest's type row.
    const html = wrapper.html()
    const frame = html.indexOf('management.partnerTemplateForm.coverDecorations.guestFrameGroup')
    const guestType = html.indexOf('data-cover-text="guest"')
    const hostsSwitch = html.indexOf('data-cover-block="hosts"')
    expect(frame).toBeGreaterThan(-1)
    expect(frame).toBeLessThan(guestType)
    expect(guestType).toBeLessThan(hostsSwitch)
  })

  it('offers a colour beside the type wherever the block is placed by box', async () => {
    const free = await openCoverSection()
    const freeColors = free.findAll('[data-cover-color]').map((row) => row.attributes('data-cover-color'))
    // Free mode: every block with text that is on (the logo has none).
    expect(freeColors).toEqual(['header', 'invite', 'guest', 'hosts', 'date'])

    const rows = await openCoverSection({ ...coverLayout, layoutMode: 'rows', coverElements: {} })
    const rowColors = rows.findAll('[data-cover-color]').map((row) => row.attributes('data-cover-color'))
    // Rows mode: the row blocks are laid out by the row numbers and have no box.
    expect(rowColors).toEqual(['hosts', 'date'])
  })

  it("writes a block's colour onto its box", async () => {
    const wrapper = await openCoverSection()
    const select = wrapper.find('[data-cover-color="guest"] select').element as HTMLSelectElement
    select.value = 'accent'
    select.dispatchEvent(new Event('change'))
    await flushPromises()

    expect(draftLayout(wrapper).coverElements?.guest?.colorSource).toBe('accent')
  })

  it('resetting a placement keeps the colour set beside the type', async () => {
    const wrapper = await openCoverSection({
      ...coverLayout,
      coverElements: {
        ...coverLayout.coverElements,
        guest: { x: 30, y: 70, width: 40, height: 8, colorSource: 'custom', customColor: '#C9A45C' },
      },
    })
    const chip = wrapper
      .findAll('button')
      .find((b) => b.text() === 'management.coverLayoutEditor.blocks.guest')
    await chip!.trigger('click')
    const reset = wrapper
      .findAll('button')
      .find((b) => b.text() === 'management.coverLayoutEditor.resetBlock')
    await reset!.trigger('click')
    await flushPromises()

    const guest = draftLayout(wrapper).coverElements?.guest
    expect(guest).toMatchObject({ colorSource: 'custom', customColor: '#C9A45C' })
    // The geometry did go back.
    expect(guest?.x).not.toBe(30)
  })

  it('reset all drops the boxes but keeps their colours', async () => {
    const wrapper = await openCoverSection({
      ...coverLayout,
      coverElements: {
        ...coverLayout.coverElements,
        date: { x: 20, y: 80, width: 40, height: 6, colorSource: 'secondary' },
      },
    })
    const chip = wrapper
      .findAll('button')
      .find((b) => b.text() === 'management.coverLayoutEditor.blocks.date')
    await chip!.trigger('click')
    const resetAll = wrapper
      .findAll('button')
      .find((b) => b.text() === 'management.coverLayoutEditor.resetAll')
    await resetAll!.trigger('click')
    await flushPromises()

    const boxes = draftLayout(wrapper).coverElements ?? {}
    expect(boxes.date).toMatchObject({ colorSource: 'secondary' })
    expect(boxes.date?.x).not.toBe(20)
    // A block that carried no colour has no box left at all.
    expect(boxes.hosts).toBeUndefined()
  })
})
