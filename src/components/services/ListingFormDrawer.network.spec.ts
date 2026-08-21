// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'

/**
 * The create flow, down to the wire.
 *
 * The sibling spec mocks the service layer, so it proves the drawer *asks* for
 * an upload. It cannot see what `apiClient` then puts on the network — the URL
 * it builds, the field name, whether a body survives. Creating a listing with a
 * photo dropped the photo while editing the same listing kept it, and those two
 * paths differ only in where the listing id comes from, so this stubs `fetch`
 * itself and reads the requests back.
 */

// Only the composable is swapped; the language store pulls `createI18n` from
// the same module at import time.
vi.mock('vue-i18n', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-i18n')>()),
  useI18n: () => ({ t: (k: string) => k }),
}))

vi.mock('@/composables/useCategoryTranslation', () => ({
  useCategoryTranslation: () => ({ translateServiceCategory: (n: string) => n }),
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

import ListingFormDrawer from './ListingFormDrawer.vue'

const LISTING_ID = 'b2c3d4e5-6789-01bc-def2-3456789012cd'
const CATEGORY = { id: 1, name: 'Photography', subcategories: [] }

/** The 201 body from SERVICES_API_DOCS.md, trimmed to what the drawer reads. */
const createdListing = {
  id: LISTING_ID,
  vendor: 'a1b2c3d4-5678-90ab-cdef-1234567890ab',
  category: 1,
  category_details: CATEGORY,
  title: 'Wedding Photography Package',
  description: 'Complete coverage.',
  short_tagline: '',
  price_min: '500.00',
  price_max: '500.00',
  price_display_text: '$500',
  currency: 'USD',
  service_area: '',
  tags: '',
  tags_list: [],
  status: 'draft',
  admin_notes: '',
  is_featured: false,
  media: [],
  cover_image_url: null,
  views_count: 0,
  contact_clicks_count: 0,
}

type Recorded = { method: string; url: string; body: unknown }
let requests: Recorded[] = []

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const fetchStub = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input)
  const method = init?.method || 'GET'
  requests.push({ method, url, body: init?.body })

  if (url.includes('/api/services/categories/')) {
    return json({ count: 1, next: null, previous: null, results: [CATEGORY] })
  }
  if (url.includes('/media/bulk-upload/')) {
    return json({ status: 'ok', count: 1, media: [{ id: 77, image: '/media/x.webp' }] })
  }
  if (url.includes('/set-cover/')) {
    return json({ id: 77, is_cover: true })
  }
  if (url.endsWith(`/api/services/listings/${LISTING_ID}/`)) {
    return json(createdListing)
  }
  if (url.endsWith('/api/services/listings/') && method === 'POST') {
    return json(createdListing, 201)
  }
  return json({ detail: 'unexpected' }, 404)
})

const attachPhoto = async (wrapper: ReturnType<typeof mount>, file: File) => {
  const input = wrapper.find('input[type="file"]')
  Object.defineProperty(input.element, 'files', {
    value: { 0: file, length: 1, item: (i: number) => (i === 0 ? file : null) },
    configurable: true,
  })
  await input.trigger('change')
  await new Promise((resolve) => setTimeout(resolve, 0))
  await flushPromises()
}

const mountDrawer = async () => {
  const wrapper = mount(ListingFormDrawer, {
    props: { modelValue: false },
    attachTo: document.body,
    global: { plugins: [createPinia()], stubs: { teleport: true } },
  })
  await wrapper.setProps({ modelValue: true })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn()
  requests = []
  toasts.length = 0
  fetchStub.mockClear()
  vi.stubGlobal('fetch', fetchStub)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('create listing with a photo — over the wire', () => {
  it('posts the file to the new listing id, not to undefined', async () => {
    const wrapper = await mountDrawer()

    await attachPhoto(wrapper, new File(['binary'], 'cover.jpg', { type: 'image/jpeg' }))
    await wrapper.find('#listing-title').setValue('Wedding Photography Package')
    await wrapper.find('#listing-description').setValue('Complete coverage.')
    await wrapper.find('#listing-category').setValue('1')
    await wrapper.find('#listing-price').setValue(500)

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const upload = requests.find((r) => r.url.includes('/media/bulk-upload/'))
    expect(
      upload,
      `no upload request was made. Requests:\n${requests
        .map((r) => `${r.method} ${r.url}`)
        .join('\n')}`,
    ).toBeTruthy()

    // The id has to come out of the create response, not be `undefined`.
    expect(upload!.url).toContain(`/api/services/listings/${LISTING_ID}/media/bulk-upload/`)

    // And the body has to be multipart carrying the file under `images`.
    expect(upload!.body).toBeInstanceOf(FormData)
    const sent = (upload!.body as FormData).getAll('images')
    expect(sent).toHaveLength(1)
    expect((sent[0] as File).name).toBe('cover.jpg')
  })

  /**
   * The reported bug, reproduced.
   *
   * Opening the drawer runs `await fetchCategories()` and only *then* resets the
   * form. In edit mode that gap is invisible, because `fetchListing` raises the
   * `loading` flag and the form is not rendered until it lands. In create mode
   * nothing is raised: the fields are live from the first frame, so a photo
   * attached while the category request is still in flight is wiped by the
   * reset that arrives behind it — and the listing saves with no media.
   *
   * The category request is the slow one on a cold page: it is a fresh fetch on
   * the first open of a session, and memoised on every open after that. Which is
   * exactly the reported shape — the first create loses its photo, and the edit
   * that follows keeps it.
   */
  it('keeps a photo attached while the category request is still in flight', async () => {
    let releaseCategories: () => void = () => {}
    const categoriesPending = new Promise<void>((resolve) => {
      releaseCategories = resolve
    })

    fetchStub.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method || 'GET'
      requests.push({ method, url, body: init?.body })

      if (url.includes('/api/services/categories/')) {
        await categoriesPending
        return json({ count: 1, next: null, previous: null, results: [CATEGORY] })
      }
      if (url.includes('/media/bulk-upload/')) {
        return json({ status: 'ok', count: 1, media: [{ id: 77, image: '/media/x.webp' }] })
      }
      if (url.includes('/set-cover/')) return json({ id: 77, is_cover: true })
      if (url.endsWith(`/api/services/listings/${LISTING_ID}/`)) return json(createdListing)
      if (url.endsWith('/api/services/listings/') && method === 'POST') {
        return json(createdListing, 201)
      }
      return json({ detail: 'unexpected' }, 404)
    })

    const wrapper = mount(ListingFormDrawer, {
      props: { modelValue: false },
      attachTo: document.body,
      global: { plugins: [createPinia()], stubs: { teleport: true } },
    })
    await wrapper.setProps({ modelValue: true })
    await flushPromises()

    // The vendor attaches a photo while the categories are still loading.
    await attachPhoto(wrapper, new File(['binary'], 'cover.jpg', { type: 'image/jpeg' }))

    // Categories land, and the open handler resumes past its await.
    releaseCategories()
    await flushPromises()

    // The photo must still be on the form.
    expect(wrapper.findAll('img[alt=""]').length).toBe(1)
  })
})
