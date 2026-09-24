// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import UploadMediaDrawer from './UploadMediaDrawer.vue'
import PhotoArrangeGrid from './PhotoArrangeGrid.vue'
import { mediaService, type EventPhoto } from '../services/api'

vi.stubGlobal(
  'matchMedia',
  vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
)

vi.mock('@/composables/useAppLanguage', () => ({
  useAppLanguage: () => ({ t: (key: string) => key }),
}))

vi.mock('@/utils/imageCompression', () => ({ compressImage: vi.fn() }))

vi.mock('../services/api', () => ({
  mediaService: {
    getEventMedia: vi.fn(),
    deleteEventMedia: vi.fn(),
    bulkReorderEventMedia: vi.fn(),
    bulkUploadEventMedia: vi.fn(),
    updateEventMedia: vi.fn(),
  },
}))

const api = vi.mocked(mediaService)

/** Matches the drawer's own delay before an order is saved. */
const ORDER_SAVE_DELAY_MS = 450

const photo = (id: number, order: number, featured = false) =>
  ({ id, order, image: `https://example.com/p${id}.jpg`, is_featured: featured }) as unknown as EventPhoto

let wrapper: VueWrapper | undefined

const mountDrawer = async () => {
  wrapper = mount(UploadMediaDrawer, { props: { eventId: 'e1' }, attachTo: document.body })
  await flushPromises()
  return wrapper
}

const grid = (w: VueWrapper) => w.findComponent(PhotoArrangeGrid)

/** The drawer is teleported, so its DOM lives on the body. */
const shownIds = () =>
  Array.from(document.body.querySelectorAll<HTMLImageElement>('.pag-grid img')).map((img) =>
    Number(img.src.match(/p(\d+)\.jpg$/)![1]),
  )

const removeButtonFor = (id: number) =>
  Array.from(document.body.querySelectorAll('.pag-grid li'))
    .find((li) => li.querySelector('img')!.src.endsWith(`/p${id}.jpg`))!
    .querySelector('button')!

const buttonByText = (text: string) =>
  Array.from(document.body.querySelectorAll('button')).find((b) => b.textContent?.trim() === text)

const gallery = (key: string) => `management.media.uploadModal.gallery.${key}`

const changes = (w: VueWrapper) =>
  (w.emitted('photos-changed') ?? []).map(([list]) => (list as EventPhoto[]).map((p) => p.id))

const select = async (w: VueWrapper, id: number) => {
  grid(w).vm.$emit('update:selectedId', id)
  await flushPromises()
}

const reorder = (w: VueWrapper, ids: number[]) =>
  grid(w).vm.$emit(
    'reorder',
    ids.map((id, index) => photo(id, index)),
  )

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  api.getEventMedia.mockResolvedValue({
    success: true,
    data: [photo(2, 1), photo(1, 0, true), photo(3, 2)],
  } as never)
  api.deleteEventMedia.mockResolvedValue({ success: true } as never)
  api.bulkReorderEventMedia.mockResolvedValue({ success: true } as never)
  api.updateEventMedia.mockResolvedValue({ success: true } as never)
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('UploadMediaDrawer gallery', () => {
  it('shows the photos already uploaded, in their saved order', async () => {
    await mountDrawer()
    expect(shownIds()).toEqual([1, 2, 3])
  })

  describe('removing', () => {
    it('takes a photo off at once, and an undo puts it back without deleting it', async () => {
      const w = await mountDrawer()

      removeButtonFor(2).click()
      await flushPromises()
      expect(shownIds()).toEqual([1, 3])

      buttonByText(gallery('undo'))!.click()
      await flushPromises()
      expect(shownIds()).toEqual([1, 2, 3])

      vi.advanceTimersByTime(10_000)
      await flushPromises()
      expect(api.deleteEventMedia).not.toHaveBeenCalled()
      expect(changes(w)).toEqual([])
    })

    it('sends a removal once its undo window closes, and reports the gallery without it', async () => {
      const w = await mountDrawer()

      removeButtonFor(2).click()
      await flushPromises()
      expect(api.deleteEventMedia).not.toHaveBeenCalled()

      vi.advanceTimersByTime(5000)
      await flushPromises()
      expect(api.deleteEventMedia).toHaveBeenCalledWith('e1', 2)
      expect(changes(w)).toEqual([[1, 3]])
    })

    it('makes the previous removal final when another photo is removed', async () => {
      await mountDrawer()

      removeButtonFor(1).click()
      await flushPromises()
      removeButtonFor(3).click()
      await flushPromises()

      expect(api.deleteEventMedia).toHaveBeenCalledTimes(1)
      expect(api.deleteEventMedia).toHaveBeenCalledWith('e1', 1)
    })

    it('puts a photo back if the server refuses to delete it', async () => {
      api.deleteEventMedia.mockResolvedValueOnce({ success: false } as never)
      const w = await mountDrawer()

      removeButtonFor(2).click()
      vi.advanceTimersByTime(5000)
      await flushPromises()

      expect(shownIds()).toEqual([1, 2, 3])
      expect(changes(w)).toEqual([])
    })
  })

  describe('reordering', () => {
    it('shows a new order at once and saves it, with every position, once the moves stop', async () => {
      const w = await mountDrawer()

      reorder(w, [3, 1, 2])
      await flushPromises()
      expect(shownIds()).toEqual([3, 1, 2])
      expect(api.bulkReorderEventMedia).not.toHaveBeenCalled()

      vi.advanceTimersByTime(ORDER_SAVE_DELAY_MS)
      await flushPromises()
      expect(api.bulkReorderEventMedia).toHaveBeenCalledWith('e1', {
        updates: [
          { id: 3, order: 0 },
          { id: 1, order: 1 },
          { id: 2, order: 2 },
        ],
      })
      expect(changes(w)).toEqual([[3, 1, 2]])
    })

    it('saves several quick moves as one request, with the last order', async () => {
      const w = await mountDrawer()

      reorder(w, [2, 1, 3])
      vi.advanceTimersByTime(200)
      reorder(w, [2, 3, 1])
      vi.advanceTimersByTime(ORDER_SAVE_DELAY_MS)
      await flushPromises()

      expect(api.bulkReorderEventMedia).toHaveBeenCalledTimes(1)
      expect(changes(w)).toEqual([[2, 3, 1]])
    })

    it('puts the old order back if the new one fails to save', async () => {
      api.bulkReorderEventMedia.mockResolvedValueOnce({ success: false } as never)
      const w = await mountDrawer()

      reorder(w, [3, 1, 2])
      vi.advanceTimersByTime(ORDER_SAVE_DELAY_MS)
      await flushPromises()

      expect(shownIds()).toEqual([1, 2, 3])
      expect(changes(w)).toEqual([])
    })
  })

  describe('the selected photo', () => {
    it('raises a bar for the selected photo, and Done puts it away', async () => {
      const w = await mountDrawer()
      expect(buttonByText(gallery('done'))).toBeUndefined()

      await select(w, 2)
      expect(buttonByText(gallery('feature'))).toBeDefined()

      buttonByText(gallery('done'))!.click()
      await flushPromises()
      expect(buttonByText(gallery('done'))).toBeUndefined()
    })

    it('features the selected photo, and un-features the one that was', async () => {
      const w = await mountDrawer()

      await select(w, 3)
      buttonByText(gallery('feature'))!.click()
      await flushPromises()

      expect(api.updateEventMedia).toHaveBeenNthCalledWith(1, 'e1', 1, { is_featured: false })
      expect(api.updateEventMedia).toHaveBeenNthCalledWith(2, 'e1', 3, { is_featured: true })
      const [reported] = w.emitted('photos-changed')!.at(-1) as [EventPhoto[]]
      expect(reported.filter((p) => p.is_featured).map((p) => p.id)).toEqual([3])
      // The bar now says it is the featured one.
      expect(buttonByText(gallery('featuredOn'))).toBeDefined()
    })

    it('clears the feature when the featured photo is featured again', async () => {
      await mountDrawer()

      await select(wrapper!, 1)
      buttonByText(gallery('featuredOn'))!.click()
      await flushPromises()

      expect(api.updateEventMedia).toHaveBeenCalledTimes(1)
      expect(api.updateEventMedia).toHaveBeenCalledWith('e1', 1, { is_featured: false })
    })

    /** The bar's Use for menu, then one of its rows. */
    const useFor = async (row: string) => {
      buttonByText(gallery('useFor'))!.click()
      await flushPromises()
      buttonByText(gallery(row))!.click()
      await flushPromises()
    }

    describe('the cover photo', () => {
      /** The server echoing each PATCH back onto the photo. */
      const echo = () =>
        api.updateEventMedia.mockImplementation(
          async (_event: string, id: number, fields: object) =>
            ({ success: true, data: { ...photo(id, 0), ...fields } }) as never,
        )

      beforeEach(() => {
        api.getEventMedia.mockResolvedValue({
          success: true,
          data: [photo(1, 0), { ...photo(2, 1), is_cover_photo: true }, photo(3, 2)],
        } as never)
      })

      it('puts the selected photo on the cover, and takes the one that was off it', async () => {
        echo()
        const w = await mountDrawer()

        await select(w, 3)
        await useFor('coverPhotoFrame')

        // The chosen photo first: its echo says whether the server stores this at all.
        expect(api.updateEventMedia).toHaveBeenNthCalledWith(1, 'e1', 3, { is_cover_photo: true })
        expect(api.updateEventMedia).toHaveBeenNthCalledWith(2, 'e1', 2, { is_cover_photo: false })
        const [reported] = w.emitted('photos-changed')!.at(-1) as [EventPhoto[]]
        expect(reported.filter((p) => p.is_cover_photo).map((p) => p.id)).toEqual([3])
        expect(buttonByText(gallery('useFor'))!.getAttribute('aria-pressed')).toBe('true')
        expect(document.body.querySelectorAll('.pag-cover')).toHaveLength(1)
      })

      it('clears the cover photo when it is tapped again', async () => {
        echo()
        await mountDrawer()

        await select(wrapper!, 2)
        await useFor('coverPhotoFrame')

        expect(api.updateEventMedia).toHaveBeenCalledTimes(1)
        expect(api.updateEventMedia).toHaveBeenCalledWith('e1', 2, { is_cover_photo: false })
        expect(document.body.querySelectorAll('.pag-cover')).toHaveLength(0)
      })

      it('changes nothing, and says why, on a server that does not store it yet', async () => {
        // 200, with the unknown field dropped from the echo.
        api.updateEventMedia.mockResolvedValue({ success: true, data: photo(3, 2) } as never)
        const w = await mountDrawer()

        await select(w, 3)
        await useFor('coverPhotoFrame')

        expect(api.updateEventMedia).toHaveBeenCalledTimes(1)
        expect(w.emitted('photos-changed')).toBeUndefined()
        expect(document.body.textContent).toContain(gallery('coverUnsupported'))
        // Photo 2 is still the cover photo, and photo 3 isn't.
        expect(buttonByText(gallery('useFor'))!.getAttribute('aria-pressed')).toBe('false')
        expect(document.body.querySelectorAll('.pag-cover')).toHaveLength(1)
      })
    })

    /**
     * The countdown's photo is the same errand as the cover's, behind the same
     * menu — and a photo can be both, so marking one never touches the other.
     */
    describe('the countdown photo', () => {
      const echo = () =>
        api.updateEventMedia.mockImplementation(
          async (_event: string, id: number, fields: object) =>
            ({
              success: true,
              data: { ...photo(id, 0), is_countdown_photo: false, ...fields },
            }) as never,
        )

      beforeEach(() => {
        api.getEventMedia.mockResolvedValue({
          success: true,
          data: [
            { ...photo(1, 0), is_cover_photo: true },
            { ...photo(2, 1), is_countdown_photo: true },
            photo(3, 2),
          ],
        } as never)
      })

      it('moves the countdown mark to the selected photo, and leaves the cover alone', async () => {
        echo()
        const w = await mountDrawer()

        await select(w, 1)
        await useFor('countdownStrips')

        expect(api.updateEventMedia).toHaveBeenNthCalledWith(1, 'e1', 1, { is_countdown_photo: true })
        expect(api.updateEventMedia).toHaveBeenNthCalledWith(2, 'e1', 2, { is_countdown_photo: false })
        const [reported] = w.emitted('photos-changed')!.at(-1) as [EventPhoto[]]
        expect(reported.filter((p) => p.is_countdown_photo).map((p) => p.id)).toEqual([1])
        expect(reported.filter((p) => p.is_cover_photo).map((p) => p.id)).toEqual([1])
        expect(document.body.querySelectorAll('.pag-countdown')).toHaveLength(1)
      })

      it('says why, and changes nothing, on a server that does not store it yet', async () => {
        api.updateEventMedia.mockResolvedValue({ success: true, data: photo(3, 2) } as never)
        const w = await mountDrawer()

        await select(w, 3)
        await useFor('countdownStrips')

        expect(api.updateEventMedia).toHaveBeenCalledTimes(1)
        expect(w.emitted('photos-changed')).toBeUndefined()
        expect(document.body.textContent).toContain(gallery('countdownUnsupported'))
        expect(document.body.querySelectorAll('.pag-countdown')).toHaveLength(1)
      })
    })

    it('moves the selected photo with Earlier and Later', async () => {
      const w = await mountDrawer()

      await select(w, 1)
      buttonByText(gallery('moveLater'))!.click()
      await flushPromises()
      buttonByText(gallery('moveLater'))!.click()
      await flushPromises()
      expect(shownIds()).toEqual([2, 3, 1])

      vi.advanceTimersByTime(ORDER_SAVE_DELAY_MS)
      await flushPromises()
      expect(api.bulkReorderEventMedia).toHaveBeenCalledTimes(1)
      expect(changes(w)).toEqual([[2, 3, 1]])
      // At the end there is no later to go to.
      expect(buttonByText(gallery('moveLater'))!.disabled).toBe(true)
    })

    it('removes the selected photo from the bar, and puts the bar away', async () => {
      const w = await mountDrawer()

      await select(w, 2)
      buttonByText(gallery('removeShort'))!.click()
      await flushPromises()

      expect(shownIds()).toEqual([1, 3])
      expect(buttonByText(gallery('done'))).toBeUndefined()
      expect(buttonByText(gallery('undo'))).toBeDefined()
    })
  })

  it('sends whatever is still waiting when the drawer closes', async () => {
    const w = await mountDrawer()

    reorder(w, [2, 1, 3])
    await flushPromises()
    removeButtonFor(3).click()
    await flushPromises()
    buttonByText('management.media.uploadModal.drawer.closeTitle')!.click()
    await flushPromises()

    expect(api.bulkReorderEventMedia).toHaveBeenCalledTimes(1)
    expect(api.deleteEventMedia).toHaveBeenCalledWith('e1', 3)
    expect(w.emitted('close')).toHaveLength(1)
  })
})
