import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

/**
 * Which record an inline host edit lands on, in each language.
 *
 * The showcase flattens every host to the language on screen — a translation
 * row replaces the base fields wholesale — so the text a partner edits in the
 * Khmer preview IS the Khmer row. Saving it by PATCHing the bare field wrote the
 * English base instead: the preview showed the new name (the local copy is
 * updated optimistically) while the Khmer invitation kept the old one.
 */
vi.mock('@/services/api', () => ({
  hostsService: { getHost: vi.fn(), patchHost: vi.fn() },
  dressCodeService: { updateDressCode: vi.fn() },
  eventTextsService: {},
}))

import { hostsService } from '@/services/api'
import { useShowcaseEditSaves } from './useShowcaseEditSaves'
import type { EventData, ShowcaseData } from '@/composables/useEventShowcase'

const baseHost = {
  id: 7,
  name: 'Dara',
  parent_a_name: 'Mr. Sok',
  parent_b_name: 'Mrs. Chan',
  title: 'Groom',
  bio: '',
}

const khmerRow = {
  id: 70,
  host: 7,
  language: 'kh',
  name: 'ដារា',
  parent_a_name: 'លោក សុខ',
  parent_b_name: 'លោកស្រី ចាន់',
  title: 'កូនកំលោះ',
  bio: '',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const setup = (language: string, displayed: Record<string, unknown> = baseHost) => {
  const event = ref({ id: 'evt-1' } as EventData)
  const showcaseData = ref({
    event: { id: 'evt-1', hosts: [{ ...displayed }] },
  } as unknown as ShowcaseData)
  const currentLanguage = ref(language)
  const { save } = useShowcaseEditSaves({ event, showcaseData, currentLanguage })
  const displayedHost = () => showcaseData.value!.event.hosts![0]
  return { save, currentLanguage, displayedHost }
}

const mockHostRecord = (translations: unknown[]) => {
  vi.mocked(hostsService.getHost).mockResolvedValue({
    success: true,
    data: { ...baseHost, translations },
  } as never)
}

describe('useShowcaseEditSaves — host fields', () => {
  beforeEach(() => {
    vi.mocked(hostsService.getHost).mockReset()
    vi.mocked(hostsService.patchHost).mockReset()
    vi.mocked(hostsService.patchHost).mockResolvedValue({ success: true } as never)
  })

  it('writes the base field when the preview is in English', async () => {
    const { save } = setup('en')

    await save({ kind: 'host', hostId: 7, field: 'name' }, 'Dara Sok')

    expect(hostsService.getHost).not.toHaveBeenCalled()
    expect(hostsService.patchHost).toHaveBeenCalledWith('evt-1', 7, { name: 'Dara Sok' })
  })

  it("writes the Khmer row, not the English base, when the preview is in Khmer", async () => {
    mockHostRecord([khmerRow])
    const { save } = setup('kh', { ...baseHost, ...khmerRow, id: 7 })

    await save({ kind: 'host', hostId: 7, field: 'name' }, 'ដារា សុខ')

    expect(hostsService.patchHost).toHaveBeenCalledTimes(1)
    const payload = vi.mocked(hostsService.patchHost).mock.calls[0][2]
    expect(payload).not.toHaveProperty('name')
    expect(payload.translations).toEqual([
      {
        language: 'kh',
        name: 'ដារា សុខ',
        parent_a_name: 'លោក សុខ',
        parent_b_name: 'លោកស្រី ចាន់',
        title: 'កូនកំលោះ',
        bio: '',
      },
    ])
  })

  it('keeps every other language when rewriting one', async () => {
    const frenchRow = { ...khmerRow, id: 71, language: 'fr', name: 'Dara', title: 'Le marié' }
    mockHostRecord([khmerRow, frenchRow])
    const { save } = setup('kh')

    await save({ kind: 'host', hostId: 7, field: 'title' }, 'កូនប្រុស')

    const { translations } = vi.mocked(hostsService.patchHost).mock.calls[0][2]
    expect(translations?.map((t) => [t.language, t.title])).toEqual([
      ['kh', 'កូនប្រុស'],
      ['fr', 'Le marié'],
    ])
  })

  it('creates the Khmer row from the base fields it was falling back to', async () => {
    mockHostRecord([])
    const { save } = setup('kh')

    await save({ kind: 'host', hostId: 7, field: 'name' }, 'ដារា')

    // Only `name` was edited, but a row replaces every field — seeding the rest
    // from the base keeps the parents and title the partner was looking at.
    expect(vi.mocked(hostsService.patchHost).mock.calls[0][2].translations).toEqual([
      {
        language: 'kh',
        name: 'ដារា',
        parent_a_name: 'Mr. Sok',
        parent_b_name: 'Mrs. Chan',
        title: 'Groom',
        bio: '',
      },
    ])
  })

  it('runs two edits on one host in turn, so the second sees the first', async () => {
    let record = { ...baseHost, translations: [{ ...khmerRow }] }
    vi.mocked(hostsService.getHost).mockImplementation(
      async () => ({ success: true, data: structuredClone(record) }) as never,
    )
    vi.mocked(hostsService.patchHost).mockImplementation(async (_e, _h, data) => {
      // What the API does: the sent array replaces the stored one.
      if (data.translations) record = { ...record, translations: data.translations as never }
      return { success: true } as never
    })
    const { save } = setup('kh')

    await Promise.all([
      save({ kind: 'host', hostId: 7, field: 'name' }, 'ដារា សុខ'),
      save({ kind: 'host', hostId: 7, field: 'title' }, 'កូនប្រុស'),
    ])

    expect(record.translations[0]).toMatchObject({ name: 'ដារា សុខ', title: 'កូនប្រុស' })
  })

  it('stays on the language the edit was made in if the preview switches mid-queue', async () => {
    let releaseFirst!: () => void
    vi.mocked(hostsService.patchHost)
      .mockImplementationOnce(
        () => new Promise((resolve) => (releaseFirst = () => resolve({ success: true } as never))),
      )
      .mockResolvedValue({ success: true } as never)
    mockHostRecord([khmerRow])
    const { save, currentLanguage } = setup('en')

    const first = save({ kind: 'host', hostId: 7, field: 'name' }, 'Dara Sok')
    currentLanguage.value = 'kh'
    const second = save({ kind: 'host', hostId: 7, field: 'title' }, 'កូនប្រុស')
    await vi.waitFor(() => expect(hostsService.patchHost).toHaveBeenCalledTimes(1))
    // Queued behind the first, not racing it.
    expect(hostsService.getHost).not.toHaveBeenCalled()
    releaseFirst()
    await Promise.all([first, second])

    expect(vi.mocked(hostsService.patchHost).mock.calls[0][2]).toEqual({ name: 'Dara Sok' })
    expect(vi.mocked(hostsService.patchHost).mock.calls[1][2].translations?.[0].title).toBe(
      'កូនប្រុស',
    )
  })

  it('puts the displayed value back when the write fails', async () => {
    mockHostRecord([khmerRow])
    vi.mocked(hostsService.patchHost).mockResolvedValue({
      success: false,
      message: 'This field may not be blank.',
    } as never)
    const { save, displayedHost } = setup('kh', { ...baseHost, ...khmerRow, id: 7 })

    const res = await save({ kind: 'host', hostId: 7, field: 'name' }, '')

    expect(res?.success).toBe(false)
    expect(displayedHost().name).toBe('ដារា')
  })
})
