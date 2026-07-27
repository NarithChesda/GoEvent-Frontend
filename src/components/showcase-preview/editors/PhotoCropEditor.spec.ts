// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { createPinia } from 'pinia'
import { i18n } from '@/i18n'
import PhotoCropEditor from './PhotoCropEditor.vue'
import { SHOWCASE_FRAME_ASPECT, cropFromZoom, cropZoom, type PhotoCrop } from '@/utils/photoCrop'

// jsdom does no layout and has no ResizeObserver or pointer capture, so the
// inputs the crop maths needs — canvas size, the image's intrinsic size, and
// pointer events — are supplied here.

/** On-screen size of the crop canvas (which is the photo's own rect). */
let canvasRect = { width: 300, height: 200 } // matches the 3000x2000 default

const realGetBoundingClientRect = Element.prototype.getBoundingClientRect
const realClientWidth = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth')
const realClientHeight = Object.getOwnPropertyDescriptor(Element.prototype, 'clientHeight')

const isCanvas = (el: unknown) => (el as HTMLElement)?.classList?.contains('crop-canvas')

beforeEach(() => {
  canvasRect = { width: 300, height: 200 }
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  Element.prototype.getBoundingClientRect = function () {
    const size = isCanvas(this) ? canvasRect : { width: 0, height: 0 }
    return {
      ...size,
      top: 0,
      left: 0,
      right: size.width,
      bottom: size.height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect
  }
  Object.defineProperty(Element.prototype, 'clientWidth', {
    configurable: true,
    get() {
      return isCanvas(this) ? canvasRect.width : 0
    },
  })
  Object.defineProperty(Element.prototype, 'clientHeight', {
    configurable: true,
    get() {
      return isCanvas(this) ? canvasRect.height : 0
    },
  })
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
})

afterEach(() => {
  Element.prototype.getBoundingClientRect = realGetBoundingClientRect
  if (realClientWidth) Object.defineProperty(Element.prototype, 'clientWidth', realClientWidth)
  if (realClientHeight) Object.defineProperty(Element.prototype, 'clientHeight', realClientHeight)
  document.body.innerHTML = ''
})

/** The live model, held outside the component so gestures read back their own updates. */
let model = ref<PhotoCrop>({ x: 0, y: 0, width: 100, height: 100 })

const LANDSCAPE = { width: 3000, height: 2000 }

const mountEditor = async (crop: PhotoCrop, photo = LANDSCAPE) => {
  model = ref<PhotoCrop>({ ...crop })

  const Host = defineComponent({
    setup: () => () =>
      h(PhotoCropEditor, {
        imageUrl: 'https://example.test/photo.webp',
        modelValue: model.value,
        'onUpdate:modelValue': (value: PhotoCrop) => {
          model.value = value
        },
      }),
  })

  const wrapper = mount(Host, {
    global: { plugins: [createPinia(), i18n] },
    attachTo: document.body,
  })

  const image = wrapper.find('img').element as HTMLImageElement
  Object.defineProperty(image, 'naturalWidth', { value: photo.width, configurable: true })
  Object.defineProperty(image, 'naturalHeight', { value: photo.height, configurable: true })
  await wrapper.find('img').trigger('load')
  await wrapper.vm.$nextTick()

  return wrapper
}

const crop = (): PhotoCrop => model.value

/** Drag on window, the way the component listens for it. */
const drag = async (from: [number, number], to: [number, number]) => {
  window.dispatchEvent(new MouseEvent('pointermove', { clientX: to[0], clientY: to[1] }))
  await Promise.resolve()
  void from
}

describe('PhotoCropEditor', () => {
  it('snaps an unset whole-image crop to the largest phone-shaped box', async () => {
    await mountEditor({ x: 0, y: 0, width: 100, height: 100 })

    // A phone-shaped box over a landscape photo spans its full height.
    expect(crop()).toEqual(cropFromZoom(LANDSCAPE, SHOWCASE_FRAME_ASPECT, 1))
    expect(crop().height).toBe(100)
    expect(crop().width).toBeCloseTo(30.8, 1)
  })

  it('moves the box with a drag, and only within the photo', async () => {
    const wrapper = await mountEditor(cropFromZoom(LANDSCAPE, SHOWCASE_FRAME_ASPECT, 2))
    const box = wrapper.find('.crop-box')
    const before = { ...crop() }

    await box.trigger('pointerdown', { clientX: 150, clientY: 100, pointerId: 1 })
    // +30px of a 300px-wide canvas = +10 percentage points.
    await drag([150, 100], [180, 120])

    expect(crop().x).toBeCloseTo(before.x + 10, 1)
    expect(crop().y).toBeCloseTo(before.y + 10, 1)
    // Size is untouched by a move.
    expect(crop().width).toBeCloseTo(before.width, 1)
    expect(crop().height).toBeCloseTo(before.height, 1)

    // Dragging far past the edge stops at it rather than leaving the photo.
    await drag([150, 100], [5000, 5000])
    expect(crop().x + crop().width).toBeCloseTo(100, 1)
    expect(crop().y + crop().height).toBeCloseTo(100, 1)
  })

  it('resizes from a corner with the phone aspect locked', async () => {
    const wrapper = await mountEditor(cropFromZoom(LANDSCAPE, SHOWCASE_FRAME_ASPECT, 2))
    const before = { ...crop() }
    const handles = wrapper.findAll('.crop-handle')
    expect(handles).toHaveLength(4)

    // Drag the bottom-right handle inward.
    const se = wrapper.find('.crop-handle--se')
    await se.trigger('pointerdown', { clientX: 200, clientY: 150, pointerId: 1 })
    await drag([200, 150], [170, 120])

    expect(crop().width).toBeLessThan(before.width)
    // The pinned corner stays pinned.
    expect(crop().x).toBeCloseTo(before.x, 1)
    expect(crop().y).toBeCloseTo(before.y, 1)
    // Still phone-shaped in rendered pixels.
    const pixelAspect =
      ((crop().width / 100) * LANDSCAPE.width) / ((crop().height / 100) * LANDSCAPE.height)
    expect(pixelAspect).toBeCloseTo(SHOWCASE_FRAME_ASPECT, 2)
  })

  it('stops tracking once the pointer is released', async () => {
    const wrapper = await mountEditor(cropFromZoom(LANDSCAPE, SHOWCASE_FRAME_ASPECT, 2))
    const box = wrapper.find('.crop-box')

    await box.trigger('pointerdown', { clientX: 150, clientY: 100, pointerId: 1 })
    await drag([150, 100], [165, 100])
    const afterDrag = { ...crop() }

    window.dispatchEvent(new MouseEvent('pointerup'))
    await drag([150, 100], [280, 190])
    expect(crop()).toEqual(afterDrag)
  })

  it('zooms around the box centre, so the subject stays put', async () => {
    const wrapper = await mountEditor(
      cropFromZoom(LANDSCAPE, SHOWCASE_FRAME_ASPECT, 1.5, { x: 40, y: 50 }),
    )
    const slider = wrapper.find('input[type="range"]')

    await slider.setValue('2.5')

    expect(cropZoom(crop(), LANDSCAPE, SHOWCASE_FRAME_ASPECT)).toBeCloseTo(2.5, 1)
    // Sub-percentage-point tolerance: the rectangle is rounded to one decimal.
    expect(crop().x + crop().width / 2).toBeCloseTo(40, 0)
    expect(crop().y + crop().height / 2).toBeCloseTo(50, 0)
  })

  it('nudges with the arrow keys', async () => {
    const wrapper = await mountEditor(cropFromZoom(LANDSCAPE, SHOWCASE_FRAME_ASPECT, 2))
    const box = wrapper.find('.crop-box')
    const before = { ...crop() }

    await box.trigger('keydown', { key: 'ArrowRight' })
    expect(crop().x).toBeCloseTo(before.x + 1, 1)

    await box.trigger('keydown', { key: 'ArrowUp', shiftKey: true })
    expect(crop().y).toBeCloseTo(before.y - 0.2, 1)
  })

  it('resets to the largest phone-shaped box', async () => {
    const wrapper = await mountEditor({ x: 5, y: 10, width: 15, height: 50 })
    const reset = wrapper.findAll('button').find((b) => b.text().includes('Reset'))

    expect(reset?.attributes('disabled')).toBeUndefined()
    await reset!.trigger('click')

    expect(crop()).toEqual(cropFromZoom(LANDSCAPE, SHOWCASE_FRAME_ASPECT, 1))
    expect(
      wrapper
        .findAll('button')
        .find((b) => b.text().includes('Reset'))
        ?.attributes('disabled'),
    ).toBeDefined()
  })

  it('positions the box as percentages of the photo', async () => {
    const wrapper = await mountEditor({ x: 10, y: 20, width: 15.4, height: 50 })
    const style = wrapper.find('.crop-box').attributes('style') ?? ''

    expect(style).toContain('left: 10%')
    expect(style).toContain('top: 20%')
    expect(style).toContain('width: 15.4%')
    expect(style).toContain('height: 50%')
  })
})
