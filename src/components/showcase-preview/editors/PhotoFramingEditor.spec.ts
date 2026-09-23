// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { createPinia } from 'pinia'
import { i18n } from '@/i18n'
import PhotoFramingEditor from './PhotoFramingEditor.vue'
import { FULL_CROP, MAX_CROP_ZOOM, cropCentre, type PhotoCrop, type Size } from '@/utils/photoCrop'
import { visibleSpan } from '@/utils/photoFraming'

// jsdom does no layout and has no ResizeObserver or pointer capture, so the
// inputs the framing maths needs — the canvas size, the image's intrinsic size,
// pointer events — are supplied here. Reduced motion is reported so a release
// settles in one step instead of on animation frames.

const CANVAS = { width: 500, height: 400 }
const LANDSCAPE: Size = { width: 3000, height: 2000 }
const PRINT = 4 / 5

const realGetBoundingClientRect = Element.prototype.getBoundingClientRect
const realClientWidth = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth')
const realClientHeight = Object.getOwnPropertyDescriptor(Element.prototype, 'clientHeight')

const isCanvas = (el: unknown) => (el as HTMLElement)?.classList?.contains('framing-canvas')

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduce'),
    addEventListener() {},
    removeEventListener() {},
  }))
  Element.prototype.getBoundingClientRect = function () {
    const size = isCanvas(this) ? CANVAS : { width: 0, height: 0 }
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
      return isCanvas(this) ? CANVAS.width : 0
    },
  })
  Object.defineProperty(Element.prototype, 'clientHeight', {
    configurable: true,
    get() {
      return isCanvas(this) ? CANVAS.height : 0
    },
  })
  Element.prototype.setPointerCapture = vi.fn()
})

afterEach(() => {
  vi.unstubAllGlobals()
  Element.prototype.getBoundingClientRect = realGetBoundingClientRect
  if (realClientWidth) Object.defineProperty(Element.prototype, 'clientWidth', realClientWidth)
  if (realClientHeight) Object.defineProperty(Element.prototype, 'clientHeight', realClientHeight)
  document.body.innerHTML = ''
})

let model = ref<PhotoCrop>({ ...FULL_CROP })
let emitted = 0

const mountEditor = async (region: PhotoCrop = { ...FULL_CROP }, aspect = PRINT) => {
  model = ref<PhotoCrop>({ ...region })
  emitted = 0
  const Host = defineComponent({
    setup: () => () =>
      h(PhotoFramingEditor, {
        imageUrl: 'https://example.test/photo.webp',
        frameAspect: aspect,
        modelValue: model.value,
        'onUpdate:modelValue': (value: PhotoCrop) => {
          emitted++
          model.value = value
        },
      }),
  })
  const wrapper = mount(Host, { global: { plugins: [createPinia(), i18n] }, attachTo: document.body })
  const image = wrapper.find('img').element as HTMLImageElement
  Object.defineProperty(image, 'naturalWidth', { value: LANDSCAPE.width, configurable: true })
  Object.defineProperty(image, 'naturalHeight', { value: LANDSCAPE.height, configurable: true })
  await wrapper.find('img').trigger('load')
  await wrapper.vm.$nextTick()
  return wrapper
}

const canvas = () => document.querySelector('.framing-canvas') as HTMLElement

const pointer = (type: string, x: number, y: number, id = 1) => {
  const event = new MouseEvent(type, { clientX: x, clientY: y, bubbles: true })
  Object.defineProperty(event, 'pointerId', { value: id })
  canvas().dispatchEvent(event)
}

/** The frame the editor draws: 80% of the canvas width or 86% of its height. */
const frameHeight = () => Math.min(CANVAS.width * 0.8, CANVAS.height * 0.86 * PRINT) / PRINT

describe('PhotoFramingEditor', () => {
  it('opens without emitting — looking at a photo is not an edit', async () => {
    await mountEditor()
    expect(emitted).toBe(0)
  })

  it('moves the photo with the finger, 1:1', async () => {
    // Zoomed in, so there is room on both axes.
    await mountEditor({ x: 30, y: 20, width: 20, height: 60 })
    const before = cropCentre(model.value)

    pointer('pointerdown', 250, 200)
    pointer('pointermove', 230, 210)
    pointer('pointerup', 230, 210)

    const after = cropCentre(model.value)
    // Dragging the photo left and down brings its right and upper part into
    // the frame: the centre moves right and up, by the drag in photo terms.
    const photoHeightPx = frameHeight() / (model.value.height / 100)
    expect(after.x).toBeGreaterThan(before.x)
    expect(after.y).toBeLessThan(before.y)
    expect(before.y - after.y).toBeCloseTo((10 / photoHeightPx) * 100, 0)
  })

  it('never stores a frame that runs off the photo', async () => {
    await mountEditor()
    pointer('pointerdown', 250, 200)
    pointer('pointermove', 2000, 200)
    pointer('pointerup', 2000, 200)
    expect(model.value.x).toBe(0)
  })

  it('stores a region in the shape of the frame', async () => {
    await mountEditor()
    const slider = document.querySelector('input[type="range"]') as HTMLInputElement
    slider.value = '2'
    slider.dispatchEvent(new Event('input'))
    const region = model.value
    const pixelAspect = (region.width * LANDSCAPE.width) / (region.height * LANDSCAPE.height)
    expect(pixelAspect).toBeCloseTo(PRINT, 1)
  })

  it('zooms around the frame centre from the slider', async () => {
    await mountEditor()
    const slider = document.querySelector('input[type="range"]') as HTMLInputElement
    slider.value = String(MAX_CROP_ZOOM)
    slider.dispatchEvent(new Event('input'))
    const span = visibleSpan(LANDSCAPE, PRINT, MAX_CROP_ZOOM)
    expect(model.value.height).toBeCloseTo(span.height, 1)
    // The stored rectangle is rounded to a tenth of a percent.
    expect(cropCentre(model.value).x).toBeCloseTo(50, 0)
    expect(cropCentre(model.value).y).toBeCloseTo(50, 0)
  })

  it('nudges the photo with the arrow keys, the way a drag moves it', async () => {
    await mountEditor({ x: 30, y: 20, width: 20, height: 60 })
    const before = cropCentre(model.value)
    canvas().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(cropCentre(model.value).x).toBeCloseTo(before.x - 1, 1)
  })

  it('resets to the centred cover', async () => {
    await mountEditor({ x: 60, y: 10, width: 20, height: 45 })
    canvas().dispatchEvent(new KeyboardEvent('keydown', { key: '0', bubbles: true }))
    const span = visibleSpan(LANDSCAPE, PRINT, 1)
    expect(model.value.height).toBeCloseTo(span.height, 1)
    expect(cropCentre(model.value).x).toBeCloseTo(50, 1)
  })
})
