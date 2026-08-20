// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'

/**
 * What the create flow actually sends.
 *
 * A listing saved with a photo attached was arriving on the server with the
 * fields and no media, and "is that us or the backend" is not a question to
 * answer by reading. These mount the real drawer over a mocked service layer
 * and assert on the calls it makes: if `bulkUploadMedia` fires with the File,
 * the frontend has done its half and the answer is upstream of us.
 */

const createListing = vi.fn()
const getListing = vi.fn()
const bulkUploadMedia = vi.fn()
const setCoverImage = vi.fn()
const listCategories = vi.fn()

vi.mock('@/services/api', () => ({
  serviceListingsService: {
    createListing: (...args: unknown[]) => createListing(...args),
    getListing: (...args: unknown[]) => getListing(...args),
    bulkUploadMedia: (...args: unknown[]) => bulkUploadMedia(...args),
    setCoverImage: (...args: unknown[]) => setCoverImage(...args),
    updateListing: vi.fn(),
    deleteListing: vi.fn(),
    deleteMedia: vi.fn(),
  },
  serviceCategoriesService: {
    listCategories: (...args: unknown[]) => listCategories(...args),
  },
  apiClient: { getProfilePictureUrl: (u: string) => u },
}))

const toasts: Array<{ kind: string; text: string }> = []
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    showSuccess: (text: string) => toasts.push({ kind: 'success', text }),
    showError: (text: string) => toasts.push({ kind: 'error', text }),
    showWarning: (text: string) => toasts.push({ kind: 'warning', text }),
    showInfo: (text: string) => toasts.push({ kind: 'info', text }),
  }),
}))

// Partial: the language store pulls `createI18n` from here at import time, so
// only the composable the drawer uses is swapped for a key-echoing stub.
vi.mock('vue-i18n', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-i18n')>()),
  useI18n: () => ({ t: (k: string) => k }),
}))

vi.mock('@/composables/useCategoryTranslation', () => ({
  useCategoryTranslation: () => ({ translateServiceCategory: (n: string) => n }),
}))

import ListingFormDrawer from './ListingFormDrawer.vue'

const CATEGORY = { id: 3, name: 'Photography' }

/**
 * jsdom has no real file picker, so the gallery is filled the way the picker
 * fills it — a `change` on the hidden input carrying a FileList — rather than
 * by writing into the component's internals. That keeps the FileReader hop in
 * the path under test, which is where a dropped file would most plausibly go.
 */
const attachPhoto = async (wrapper: ReturnType<typeof mount>, file: File) => {
  const input = wrapper.find('input[type="file"]')
  Object.defineProperty(input.element, 'files', {
    value: { 0: file, length: 1, item: (i: number) => (i === 0 ? file : null) },
    configurable: true,
  })
  await input.trigger('change')

  // FileReader.onload lands on a macrotask in jsdom
  await new Promise((resolve) => setTimeout(resolve, 0))
  await flushPromises()
}

const fillRequiredFields = async (wrapper: ReturnType<typeof mount>) => {
  await wrapper.find('#listing-title').setValue('Full-day wedding photography')
  await wrapper.find('#listing-description').setValue('Two shooters, all day.')
  await wrapper.find('#listing-category').setValue(String(CATEGORY.id))
  await wrapper.find('#listing-price').setValue(500)
}

/**
 * Mounted closed, then opened — the drawer loads categories and resets the form
 * from a `modelValue` watcher, which a mount that is already open never fires.
 * That is also how the listings tab uses it: the component is always there and
 * the prop is what opens it.
 */
const mountDrawer = async () => {
  const wrapper = mount(ListingFormDrawer, {
    props: { modelValue: false },
    attachTo: document.body,
    global: {
      // The preview card and the delete modal both reach the language store
      // through `useAppLanguage`; a real Pinia is cheaper than stubbing each.
      plugins: [createPinia()],
      // The drawer teleports to <body>, which puts its markup outside the
      // wrapper's tree; stubbed, it renders in place and `find` can reach it.
      stubs: { teleport: true },
    },
  })

  await wrapper.setProps({ modelValue: true })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  // jsdom implements neither; the drawer calls both when it focuses a bad field.
  Element.prototype.scrollIntoView = vi.fn()
  vi.clearAllMocks()
  toasts.length = 0
  listCategories.mockResolvedValue({ success: true, data: { results: [CATEGORY] } })
  createListing.mockResolvedValue({ success: true, data: { id: 'listing-uuid-1' } })
  getListing.mockResolvedValue({
    success: true,
    data: { id: 'listing-uuid-1', media: [], status: 'draft' },
  })
  bulkUploadMedia.mockResolvedValue({
    success: true,
    data: { status: 'ok', count: 1, media: [{ id: 77, image: '/media/x.webp' }] },
  })
  setCoverImage.mockResolvedValue({ success: true, data: {} })
})

describe('ListingFormDrawer — creating a listing with a photo', () => {
  it('uploads the attached file and sets it as the cover', async () => {
    const wrapper = await mountDrawer()

    const file = new File(['binary'], 'cover.jpg', { type: 'image/jpeg' })
    await attachPhoto(wrapper, file)
    await fillRequiredFields(wrapper)

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(createListing).toHaveBeenCalledTimes(1)

    // The half we own: the file has to leave the browser.
    expect(bulkUploadMedia).toHaveBeenCalledTimes(1)
    const [listingId, files] = bulkUploadMedia.mock.calls[0]
    expect(listingId).toBe('listing-uuid-1')
    expect(files).toHaveLength(1)
    expect(files[0]).toBeInstanceOf(File)
    expect(files[0].name).toBe('cover.jpg')

    // And the uploaded media id has to come back round as the cover.
    expect(setCoverImage).toHaveBeenCalledWith('listing-uuid-1', 77)
  })

  it('tells the vendor when the photo upload is rejected', async () => {
    bulkUploadMedia.mockResolvedValue({
      success: false,
      message: 'Image exceeds the maximum size',
    })

    const wrapper = await mountDrawer()

    await attachPhoto(wrapper, new File(['binary'], 'cover.jpg', { type: 'image/jpeg' }))
    await fillRequiredFields(wrapper)

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    // The listing itself saved, so this is not an error — but a vendor who
    // attached a photo and got a listing without one must not be told only
    // that everything worked.
    expect(toasts.some((t) => t.kind === 'warning')).toBe(true)
    expect(setCoverImage).not.toHaveBeenCalled()
  })
})
