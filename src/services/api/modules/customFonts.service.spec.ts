import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * The font library's write path, where the wrong request shape fails silently.
 *
 * A font upload is multipart; a rename is not. Sending a rename as multipart
 * would put an empty `font_file` part on the wire, which the server reads as an
 * attempt to replace the file rather than as "leave it alone" — so the two cases
 * genuinely need different requests, and which one is chosen has to be pinned.
 */

const get = vi.fn()
const patch = vi.fn()
const del = vi.fn()
const postFormData = vi.fn()
const patchFormData = vi.fn()

vi.mock('@/services/api/core/ApiClient', () => ({
  apiClient: {
    get: (...args: unknown[]) => get(...args),
    patch: (...args: unknown[]) => patch(...args),
    delete: (...args: unknown[]) => del(...args),
    post: vi.fn(),
    postFormData: (...args: unknown[]) => postFormData(...args),
    patchFormData: (...args: unknown[]) => patchFormData(...args),
    putFormData: vi.fn(),
  },
}))

import { customFontsService } from './templates.service'

const fontFile = (): File =>
  new File([new Uint8Array([0x77, 0x4f, 0x46, 0x32])], 'moul.woff2', { type: 'font/woff2' })

beforeEach(() => {
  get.mockReset().mockResolvedValue({ success: true, data: [] })
  patch.mockReset().mockResolvedValue({ success: true, data: {} })
  del.mockReset().mockResolvedValue({ success: true })
  postFormData.mockReset().mockResolvedValue({ success: true, data: {} })
  patchFormData.mockReset().mockResolvedValue({ success: true, data: {} })
})

describe('customFontsService.listFonts', () => {
  it('sends no filters when none are asked for', async () => {
    await customFontsService.listFonts()
    expect(get).toHaveBeenCalledWith('/api/core-data/custom-fonts/', {})
  })

  // `mine` gates on the parameter being present, so a literal "false" would
  // narrow the list to the caller's own uploads — the exact opposite of asking
  // for everything.
  it('omits `mine` entirely when it is false', async () => {
    await customFontsService.listFonts({ mine: false, source: 'partner' })
    expect(get).toHaveBeenCalledWith('/api/core-data/custom-fonts/', { source: 'partner' })
  })

  it('passes through the filters it is given', async () => {
    await customFontsService.listFonts({ mine: true, search: 'moul', ordering: '-created_at' })
    expect(get).toHaveBeenCalledWith('/api/core-data/custom-fonts/', {
      mine: 'true',
      search: 'moul',
      ordering: '-created_at',
    })
  })
})

describe('customFontsService.uploadFont', () => {
  it('posts multipart with the file and name', async () => {
    await customFontsService.uploadFont({ name: 'Moul Custom', font_file: fontFile() })

    const [endpoint, body] = postFormData.mock.calls[0] as [string, FormData]
    expect(endpoint).toBe('/api/core-data/custom-fonts/')
    expect(body.get('name')).toBe('Moul Custom')
    expect((body.get('font_file') as File).name).toBe('moul.woff2')
  })

  // `source` and `created_by` are stamped from the caller's account and are
  // read-only; a client that sends them would be describing a font it does not
  // get to define.
  it('sends only the fields the server accepts', async () => {
    await customFontsService.uploadFont({
      name: 'Moul Custom',
      font_file: fontFile(),
      license_note: 'SIL OFL',
    })

    const body = postFormData.mock.calls[0][1] as FormData
    expect([...body.keys()].sort()).toEqual(['font_file', 'license_note', 'name'])
  })

  it('omits an unset licence note rather than sending an empty one', async () => {
    await customFontsService.uploadFont({ name: 'Moul Custom', font_file: fontFile() })
    expect((postFormData.mock.calls[0][1] as FormData).has('license_note')).toBe(false)
  })
})

describe('customFontsService.updateFont', () => {
  // An omitted `font_file` has to mean "leave the stored file alone", which only
  // a JSON body can express unambiguously.
  it('sends JSON when the file is not being replaced', async () => {
    await customFontsService.updateFont(41, { name: 'Renamed' })

    expect(patchFormData).not.toHaveBeenCalled()
    expect(patch).toHaveBeenCalledWith('/api/core-data/custom-fonts/41/', { name: 'Renamed' })
  })

  it('switches to multipart when the file is being replaced', async () => {
    await customFontsService.updateFont(41, { name: 'Renamed', font_file: fontFile() })

    expect(patch).not.toHaveBeenCalled()
    const [endpoint, body] = patchFormData.mock.calls[0] as [string, FormData]
    expect(endpoint).toBe('/api/core-data/custom-fonts/41/')
    expect(body.get('name')).toBe('Renamed')
    expect((body.get('font_file') as File).name).toBe('moul.woff2')
  })

  it('never leaves an empty font_file part in the JSON body', async () => {
    await customFontsService.updateFont(41, { license_note: 'Updated licence' })
    expect(patch.mock.calls[0][1]).not.toHaveProperty('font_file')
  })
})

describe('customFontsService.deleteFont', () => {
  it('targets the library record, not a template row', async () => {
    await customFontsService.deleteFont(41)
    expect(del).toHaveBeenCalledWith('/api/core-data/custom-fonts/41/')
  })
})
