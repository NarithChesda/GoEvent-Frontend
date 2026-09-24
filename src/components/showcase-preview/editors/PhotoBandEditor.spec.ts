// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import PhotoBandEditor from './PhotoBandEditor.vue'

vi.mock('@/composables/useAppLanguage', () => ({
  useAppLanguage: () => ({ t: (k: string) => k, locale: { value: 'en' } }),
}))

const getEventMedia = vi.fn()
const updateEventMedia = vi.fn()

vi.mock('@/services/api', () => ({
  mediaService: {
    getEventMedia: (...args: unknown[]) => getEventMedia(...args),
    updateEventMedia: (...args: unknown[]) => updateEventMedia(...args),
  },
}))

/** The framing editor, reduced to "the organizer framed it like this". */
const FRAMED = { x: 5, y: 10, width: 40, height: 50 }
const FRAMED_FIELDS = { crop_x: 5, crop_y: 10, crop_width: 40, crop_height: 50 }
const FramingStub = defineComponent({
  props: ['modelValue', 'imageUrl', 'frameAspect'],
  emits: ['update:modelValue'],
  setup: (_, { emit }) => () =>
    h('button', { class: 'framing-stub', onClick: () => emit('update:modelValue', FRAMED) }, 'frame'),
})

/** SelectField, reduced to a native select. */
const SelectStub = defineComponent({
  props: ['modelValue', 'options'],
  emits: ['update:modelValue'],
  setup: (props, { emit }) => () =>
    h(
      'select',
      {
        class: 'placement-stub',
        value: props.modelValue,
        onChange: (e: globalThis.Event) => emit('update:modelValue', (e.target as HTMLSelectElement).value),
      },
      (props.options as { value: string }[]).map((o) => h('option', { value: o.value }, o.value)),
    ),
})

const STORED_CROP = { crop_x: null, crop_y: null, crop_width: null, crop_height: null }
const photo = (id: number, fields: Record<string, unknown> = {}) => ({
  id,
  image: `${id}.webp`,
  caption: '',
  order: id,
  is_featured: false,
  band_placement: null,
  band_blend_color: null,
  ...STORED_CROP,
  ...fields,
})

/** Photo 2 is featured; photo 4 is already a band after the gallery. */
const PHOTOS = [
  photo(1),
  photo(2, { is_featured: true }),
  photo(3),
  photo(4, { band_placement: 'after_gallery', band_blend_color: '#8b4c50' }),
]

/** A photo as the frames should show it once put back: exactly as stored. */
const restored = (id: number) => {
  const p = PHOTOS.find((x) => x.id === id)!
  return {
    id,
    band_placement: p.band_placement,
    band_blend_color: p.band_blend_color,
    ...STORED_CROP,
  }
}

const mounted: { unmount: () => void }[] = []

/** Mounted closed and then opened, the way the host opens it. */
const open = async (props: Record<string, unknown> = {}) => {
  const wrapper = mount(PhotoBandEditor, {
    props: { modelValue: false, eventId: 'evt-1', ...props },
    global: {
      stubs: { teleport: true, PhotoFramingEditor: FramingStub, SelectField: SelectStub },
    },
  })
  mounted.push(wrapper)
  await wrapper.setProps({ modelValue: true })
  await flushPromises()
  return wrapper
}

type Wrapper = Awaited<ReturnType<typeof open>>

/** Past the live preview's throttle, so the last change has reached the frames. */
const settle = async () => {
  await new Promise((resolve) => setTimeout(resolve, 150))
  await flushPromises()
}

type Patch = { id: number } & Record<string, unknown>
const previews = (wrapper: Wrapper) => (wrapper.emitted('preview') ?? []).map(([patches]) => patches as Patch[])
const lastPreview = (wrapper: Wrapper) => previews(wrapper).at(-1)!
const patchFor = (patches: Patch[], id: number) => patches.find((p) => p.id === id)

/** What the host does with update:modelValue. */
const closeLikeTheHost = async (wrapper: Wrapper) => {
  expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toBe(false)
  await wrapper.setProps({ modelValue: false })
}

const button = (wrapper: Wrapper, key: string) =>
  wrapper.findAll('button').find((b) => b.text() === key || b.attributes('aria-label') === key)

const photoChoices = (wrapper: Wrapper) =>
  wrapper.findAll('[role="radiogroup"]')[0].findAll('[role="radio"]')

/** The server echoing each PATCH back onto the stored photo. */
const echoSaves = () =>
  updateEventMedia.mockImplementation(async (_event: string, id: number, fields: object) => ({
    success: true,
    data: { ...PHOTOS.find((p) => p.id === id), ...fields },
  }))

describe('PhotoBandEditor', () => {
  beforeEach(() => {
    getEventMedia.mockReset()
    updateEventMedia.mockReset()
    getEventMedia.mockResolvedValue({ success: true, data: { results: PHOTOS } })
  })

  afterEach(() => {
    while (mounted.length) mounted.pop()!.unmount()
  })

  describe('adding', () => {
    it('opens on the featured photo in the first free section, and the frames show it at once', async () => {
      const wrapper = await open()
      expect(lastPreview(wrapper)).toEqual([
        { ...restored(2), band_placement: 'after_event_info', band_blend_color: null },
      ])
    })

    it('offers only photos that are not bands already', async () => {
      const wrapper = await open()
      expect(photoChoices(wrapper)).toHaveLength(3)
    })

    it('choosing another photo puts the first one back as it was', async () => {
      const wrapper = await open()
      await photoChoices(wrapper)[0].trigger('click')
      await settle()
      const patches = lastPreview(wrapper)
      expect(patchFor(patches, 2)).toEqual(restored(2))
      expect(patchFor(patches, 1)).toMatchObject({ band_placement: 'after_event_info' })
    })

    it('offers no remove for a band that was never saved', async () => {
      const wrapper = await open()
      expect(button(wrapper, 'management.showcasePreview.editors.photoBandRemove')).toBeUndefined()
    })
  })

  describe('editing a band', () => {
    it('opens on it as stored, and changes it in place', async () => {
      const wrapper = await open({ photoId: 4 })
      expect(photoChoices(wrapper)).toHaveLength(4)

      await wrapper.find('select.placement-stub').setValue('top')
      await wrapper.findAll('[role="radio"]').find((r) => r.attributes('title') === '#ffffff')!.trigger('click')
      await settle()
      expect(lastPreview(wrapper)).toEqual([
        { ...restored(4), band_placement: 'top', band_blend_color: '#ffffff' },
      ])
    })

    it('moving it to another photo gives the old photo back to the gallery', async () => {
      const wrapper = await open({ photoId: 4 })
      await photoChoices(wrapper)[0].trigger('click')
      await settle()
      const patches = lastPreview(wrapper)
      expect(patchFor(patches, 4)).toMatchObject({ band_placement: null, band_blend_color: null })
      expect(patchFor(patches, 1)).toMatchObject({ band_placement: 'after_gallery', band_blend_color: '#8b4c50' })
    })

    it('frames it on the crop tab, and a new photo starts from its own framing again', async () => {
      const wrapper = await open({ photoId: 4 })
      await button(wrapper, 'management.showcasePreview.editors.cropTabAdjust')!.trigger('click')
      await wrapper.find('.framing-stub').trigger('click')
      await settle()
      expect(patchFor(lastPreview(wrapper), 4)).toMatchObject(FRAMED_FIELDS)

      await button(wrapper, 'management.showcasePreview.editors.photoBandTabBand')!.trigger('click')
      await photoChoices(wrapper)[0].trigger('click')
      await settle()
      expect(patchFor(lastPreview(wrapper), 1)).toMatchObject(STORED_CROP)
    })
  })

  describe('leaving', () => {
    it('cancelling puts every photo the frames were shown back as stored', async () => {
      const wrapper = await open({ photoId: 4 })
      await photoChoices(wrapper)[0].trigger('click')
      await settle()

      await button(wrapper, 'management.showcasePreview.editors.cancel')!.trigger('click')
      await closeLikeTheHost(wrapper)
      expect(lastPreview(wrapper)).toEqual(expect.arrayContaining([restored(4), restored(1)]))
      expect(lastPreview(wrapper)).toHaveLength(2)
    })

    it('a change still inside the throttle never reaches the frames after a cancel', async () => {
      const wrapper = await open({ photoId: 4 })
      await wrapper.find('select.placement-stub').setValue('after_video')
      await button(wrapper, 'management.showcasePreview.editors.cancel')!.trigger('click')
      await closeLikeTheHost(wrapper)
      await settle()
      expect(lastPreview(wrapper)).toEqual([restored(4)])
    })
  })

  describe('saving', () => {
    it('saves onto the photo, hands back the whole list, and reverts nothing after', async () => {
      echoSaves()
      const wrapper = await open({ photoId: 4 })
      await wrapper.find('select.placement-stub').setValue('top')
      await button(wrapper, 'management.showcasePreview.editors.save')!.trigger('click')
      await flushPromises()

      expect(updateEventMedia).toHaveBeenCalledWith('evt-1', 4, {
        band_placement: 'top',
        band_blend_color: '#8b4c50',
      })
      const [list] = wrapper.emitted('saved')![0] as [Array<{ id: number; band_placement: string }>]
      expect(list.map((p) => p.id)).toEqual([1, 2, 3, 4])
      expect(list[3].band_placement).toBe('top')

      const before = previews(wrapper).length
      await closeLikeTheHost(wrapper)
      await settle()
      expect(previews(wrapper).length).toBe(before)
    })

    it('a move saves both photos: the old one back to the gallery, the new one as the band', async () => {
      echoSaves()
      const wrapper = await open({ photoId: 4 })
      await photoChoices(wrapper)[0].trigger('click')
      await button(wrapper, 'management.showcasePreview.editors.save')!.trigger('click')
      await flushPromises()
      expect(updateEventMedia).toHaveBeenCalledWith('evt-1', 4, { band_placement: null, band_blend_color: null })
      expect(updateEventMedia).toHaveBeenCalledWith('evt-1', 1, {
        band_placement: 'after_gallery',
        band_blend_color: '#8b4c50',
      })
    })

    it('saves a new framing with the band', async () => {
      echoSaves()
      const wrapper = await open({ photoId: 4 })
      await button(wrapper, 'management.showcasePreview.editors.cropTabAdjust')!.trigger('click')
      await wrapper.find('.framing-stub').trigger('click')
      await button(wrapper, 'management.showcasePreview.editors.save')!.trigger('click')
      await flushPromises()
      expect(updateEventMedia).toHaveBeenCalledWith('evt-1', 4, expect.objectContaining(FRAMED_FIELDS))
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false])
    })

    it('says so when the server drops the band fields, and keeps the draft on screen until closed', async () => {
      updateEventMedia.mockResolvedValue({ success: true, data: { id: 2, image: '2.webp' } })
      const wrapper = await open()
      await button(wrapper, 'management.showcasePreview.editors.save')!.trigger('click')
      await flushPromises()
      expect(wrapper.text()).toContain('management.showcasePreview.editors.photoBandUnsupported')
      expect(wrapper.emitted('saved')).toBeUndefined()

      await button(wrapper, 'management.showcasePreview.editors.cancel')!.trigger('click')
      await closeLikeTheHost(wrapper)
      expect(lastPreview(wrapper)).toEqual([restored(2)])
    })

    it('keeps the panel open when the band saved but the framing did not', async () => {
      updateEventMedia.mockImplementation(async (_e: string, id: number, fields: Record<string, unknown>) => ({
        success: true,
        data: {
          ...PHOTOS.find((p) => p.id === id),
          band_placement: fields.band_placement,
          band_blend_color: fields.band_blend_color,
          crop_x: undefined,
          crop_y: undefined,
          crop_width: undefined,
          crop_height: undefined,
        },
      }))
      const wrapper = await open({ photoId: 4 })
      await button(wrapper, 'management.showcasePreview.editors.cropTabAdjust')!.trigger('click')
      await wrapper.find('.framing-stub').trigger('click')
      await button(wrapper, 'management.showcasePreview.editors.save')!.trigger('click')
      await flushPromises()
      expect(wrapper.emitted('saved')).toHaveLength(1)
      expect(wrapper.text()).toContain('management.showcasePreview.editors.cropUnsupported')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('removing gives the photo back to the gallery', async () => {
      echoSaves()
      const wrapper = await open({ photoId: 4 })
      await button(wrapper, 'management.showcasePreview.editors.photoBandRemove')!.trigger('click')
      await flushPromises()
      expect(updateEventMedia).toHaveBeenCalledWith('evt-1', 4, { band_placement: null, band_blend_color: null })
      expect(wrapper.emitted('saved')).toHaveLength(1)
    })
  })

  it('hands off to the upload drawer when there is nothing to choose', async () => {
    getEventMedia.mockResolvedValue({ success: true, data: { results: [] } })
    const wrapper = await open()
    await button(wrapper, 'management.showcasePreview.editors.featuredPhotoUploadButton')!.trigger('click')
    expect(wrapper.emitted('uploadRequested')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false])
  })
})
