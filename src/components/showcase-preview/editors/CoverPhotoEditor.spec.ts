// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import CoverPhotoEditor from './CoverPhotoEditor.vue'

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
  props: ['modelValue', 'imageUrl', 'frameAspect', 'shapeMask'],
  emits: ['update:modelValue'],
  setup: (props, { emit }) => () =>
    h(
      'button',
      {
        class: 'framing-stub',
        'data-aspect': props.frameAspect,
        'data-shape': props.shapeMask?.url ?? '',
        onClick: () => emit('update:modelValue', FRAMED),
      },
      'frame',
    ),
})

const STORED_CROP = { crop_x: null, crop_y: null, crop_width: null, crop_height: null }
const photo = (id: number, fields: Record<string, unknown> = {}) => ({
  id,
  image: `${id}.webp`,
  caption: '',
  order: id,
  is_featured: false,
  is_cover_photo: false,
  ...STORED_CROP,
  ...fields,
})

const SHAPE = { url: 'https://cdn.test/shape.png', bounds: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 } }

const mounted: { unmount: () => void }[] = []

/** Mounted closed and then opened, the way the host opens it. */
const open = async (photos: ReturnType<typeof photo>[], extra: Record<string, unknown> = {}) => {
  getEventMedia.mockResolvedValue({ success: true, data: { results: photos } })
  const wrapper = mount(CoverPhotoEditor, {
    props: { modelValue: false, eventId: 'evt-1', frameAspect: 0.8, shape: SHAPE, ...extra },
    global: { stubs: { teleport: true, PhotoFramingEditor: FramingStub } },
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
const lastPreview = (wrapper: Wrapper) =>
  ((wrapper.emitted('preview') ?? []).at(-1)?.[0] as Patch[] | undefined) ?? []
const patchFor = (patches: Patch[], id: number) => patches.find((p) => p.id === id)

const button = (wrapper: Wrapper, key: string) =>
  wrapper.findAll('button').find((b) => b.text() === key || b.attributes('aria-label') === key)

const choices = (wrapper: Wrapper) => wrapper.find('[role="radiogroup"]').findAll('[role="radio"]')

describe('CoverPhotoEditor', () => {
  beforeEach(() => {
    getEventMedia.mockReset()
    updateEventMedia.mockReset()
  })

  afterEach(() => {
    while (mounted.length) mounted.pop()!.unmount()
  })

  it('opens with nothing chosen, and previews nothing until a photo is picked', async () => {
    const wrapper = await open([photo(1), photo(2)])

    expect(wrapper.emitted('preview')).toBeUndefined()
    expect(choices(wrapper).every((c) => c.attributes('aria-checked') === 'false')).toBe(true)

    await choices(wrapper)[1].trigger('click')
    await settle()
    expect(lastPreview(wrapper)).toEqual([{ id: 2, is_cover_photo: true, ...STORED_CROP }])
  })

  it('opens a chosen photo on its framing, in the frame’s own shape', async () => {
    const wrapper = await open([photo(1), photo(2, { is_cover_photo: true })])

    const framing = wrapper.find('.framing-stub')
    expect(framing.exists()).toBe(true)
    expect(framing.attributes('data-aspect')).toBe('0.8')
    expect(framing.attributes('data-shape')).toBe(SHAPE.url)

    await framing.trigger('click')
    await settle()
    expect(patchFor(lastPreview(wrapper), 2)).toMatchObject({ is_cover_photo: true, ...FRAMED_FIELDS })
  })

  it('moving the cover photo hands the old one back in the same preview', async () => {
    const wrapper = await open([photo(1), photo(2, { is_cover_photo: true })])

    await button(wrapper, 'management.showcasePreview.editors.cropTabChoose')!.trigger('click')
    await choices(wrapper)[0].trigger('click')
    await settle()

    const patches = lastPreview(wrapper)
    expect(patchFor(patches, 2)).toMatchObject({ is_cover_photo: false })
    expect(patchFor(patches, 1)).toMatchObject({ is_cover_photo: true })
  })

  it('puts every previewed photo back as stored when it closes unsaved', async () => {
    const wrapper = await open([photo(1), photo(2)])
    await choices(wrapper)[0].trigger('click')
    await settle()

    await button(wrapper, 'management.showcasePreview.editors.cancel')!.trigger('click')
    await wrapper.setProps({ modelValue: false })
    expect(lastPreview(wrapper)).toEqual([{ id: 1, is_cover_photo: false, ...STORED_CROP }])
  })

  it('saves the move and the framing, and reports the whole gallery', async () => {
    updateEventMedia.mockImplementation(async (_event: string, id: number, fields: object) => ({
      success: true,
      data: { ...photo(id), ...fields },
    }))
    const wrapper = await open([photo(1), photo(2, { is_cover_photo: true })])

    await button(wrapper, 'management.showcasePreview.editors.cropTabChoose')!.trigger('click')
    await choices(wrapper)[0].trigger('click')
    await button(wrapper, 'management.showcasePreview.editors.cropTabAdjust')!.trigger('click')
    await wrapper.find('.framing-stub').trigger('click')
    await button(wrapper, 'management.showcasePreview.editors.save')!.trigger('click')
    await flushPromises()

    expect(updateEventMedia).toHaveBeenCalledWith('evt-1', 2, { is_cover_photo: false })
    expect(updateEventMedia).toHaveBeenCalledWith('evt-1', 1, { is_cover_photo: true, ...FRAMED_FIELDS })
    const saved = wrapper.emitted('saved')?.at(-1)?.[0] as { id: number; is_cover_photo: boolean }[]
    expect(saved.map((p) => [p.id, p.is_cover_photo])).toEqual([
      [1, true],
      [2, false],
    ])
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toBe(false)
  })

  it('says so, and stays, when the server does not store a cover photo yet', async () => {
    // A server that doesn't know the field answers 200 and leaves it out.
    updateEventMedia.mockImplementation(async (_event: string, id: number) => {
      const { is_cover_photo: _dropped, ...rest } = photo(id)
      return { success: true, data: rest }
    })
    const wrapper = await open([photo(1)])

    await choices(wrapper)[0].trigger('click')
    await button(wrapper, 'management.showcasePreview.editors.save')!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('management.showcasePreview.editors.coverPhotoUnsupported')
    expect(wrapper.emitted('saved')).toBeUndefined()
  })

  it('removing the cover photo only unmarks it', async () => {
    updateEventMedia.mockImplementation(async (_event: string, id: number, fields: object) => ({
      success: true,
      data: { ...photo(id), ...fields },
    }))
    const wrapper = await open([photo(1, { is_cover_photo: true })])

    await button(wrapper, 'management.showcasePreview.editors.coverPhotoRemove')!.trigger('click')
    await flushPromises()

    expect(updateEventMedia).toHaveBeenCalledTimes(1)
    expect(updateEventMedia).toHaveBeenCalledWith('evt-1', 1, { is_cover_photo: false })
  })
})

/**
 * The same editor for the photo the countdown's strips are cut from: only the
 * flag it writes and its words change, so these check exactly that — and that
 * the cover's flag is never touched from here.
 */
describe('CoverPhotoEditor as the countdown photo editor', () => {
  beforeEach(() => {
    getEventMedia.mockReset()
    updateEventMedia.mockReset()
  })

  afterEach(() => {
    while (mounted.length) mounted.pop()!.unmount()
  })

  const countdown = { role: 'countdown' }

  it('opens on the photo marked for the countdown, not the cover', async () => {
    const wrapper = await open(
      [photo(1, { is_cover_photo: true }), photo(2, { is_countdown_photo: true })],
      countdown,
    )
    await button(wrapper, 'management.showcasePreview.editors.cropTabChoose')!.trigger('click')
    expect(choices(wrapper).map((c) => c.attributes('aria-checked'))).toEqual(['false', 'true'])
    expect(wrapper.text()).toContain('management.showcasePreview.editors.countdownPhotoTitle')
  })

  it('moves the countdown flag, and only that flag', async () => {
    updateEventMedia.mockImplementation(async (_event: string, id: number, fields: object) => ({
      success: true,
      data: { ...photo(id), is_countdown_photo: false, ...fields },
    }))
    const wrapper = await open([photo(1), photo(2, { is_countdown_photo: true })], countdown)

    await button(wrapper, 'management.showcasePreview.editors.cropTabChoose')!.trigger('click')
    await choices(wrapper)[0].trigger('click')
    await settle()
    expect(patchFor(lastPreview(wrapper), 1)).toMatchObject({ is_countdown_photo: true })
    expect(patchFor(lastPreview(wrapper), 1)).not.toHaveProperty('is_cover_photo')

    await button(wrapper, 'management.showcasePreview.editors.save')!.trigger('click')
    await flushPromises()
    expect(updateEventMedia).toHaveBeenCalledWith('evt-1', 2, { is_countdown_photo: false })
    expect(updateEventMedia).toHaveBeenCalledWith('evt-1', 1, { is_countdown_photo: true })
  })

  it('says so when the server does not store a countdown photo yet', async () => {
    updateEventMedia.mockImplementation(async (_event: string, id: number) => ({
      success: true,
      data: photo(id), // no is_countdown_photo: the field was dropped
    }))
    const wrapper = await open([photo(1)], countdown)

    await choices(wrapper)[0].trigger('click')
    await button(wrapper, 'management.showcasePreview.editors.save')!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('management.showcasePreview.editors.countdownPhotoUnsupported')
    expect(wrapper.emitted('saved')).toBeUndefined()
  })
})
