// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import CoverPhotoFrame from './CoverPhotoFrame.vue'
import type { CoverPhotoFrameBinding } from './coverPhoto'

// EditableRegion reads the app language during setup, which throws without the
// i18n plugin installed.
vi.mock('@/composables/useAppLanguage', () => ({
  useAppLanguage: () => ({ t: (k: string) => k, locale: { value: 'en' } }),
}))

/** What the shape analysis answers — it reads pixels, which jsdom can't. */
const shape = vi.hoisted(() => ({
  bounds: null as null | { x: number; y: number; width: number; height: number; aspectRatio: number },
  settled: true,
}))

vi.mock('@/composables/showcase/useShapeMaskBounds', async () => {
  const { ref } = await import('vue')
  return {
    useShapeMaskBounds: () => ({ bounds: ref(shape.bounds), settled: ref(shape.settled) }),
  }
})

beforeEach(() => {
  shape.bounds = { x: 0.25, y: 0.25, width: 0.5, height: 0.5, aspectRatio: 1 }
  shape.settled = true
  // The artwork's aspect is measured by loading it into an Image; answer as a
  // square that loads at once.
  vi.stubGlobal(
    'Image',
    class {
      decoding = ''
      naturalWidth = 0
      naturalHeight = 0
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_url: string) {
        this.naturalWidth = 600
        this.naturalHeight = 600
        queueMicrotask(() => this.onload?.())
      }
    },
  )
})

const binding = (overrides: Partial<CoverPhotoFrameBinding> = {}): CoverPhotoFrameBinding => ({
  boxStyle: { left: '10%', top: '20%', width: '80%', height: '30%' },
  frameUrl: 'https://cdn.test/frame.png',
  shapeUrl: 'https://cdn.test/shape.png',
  frameLayer: 'under',
  photo: {
    kind: 'photo',
    image: 'us.jpg',
    crop: { x: 0, y: 0, width: 100, height: 100 },
    photoId: 3,
    hostId: null,
    alt: 'Us',
  },
  photoUrl: 'https://cdn.test/us.jpg',
  hostOffset: { x: 50, y: 50 },
  eventTitle: 'Sochea',
  ...overrides,
})

const mountFrame = async (overrides: Partial<CoverPhotoFrameBinding> = {}) => {
  const wrapper = mount(CoverPhotoFrame, { props: binding(overrides) })
  await flushPromises()
  return wrapper
}

describe('CoverPhotoFrame', () => {
  it('cuts the photo to the shape, over the artwork, at the shape’s bounds', async () => {
    const wrapper = await mountFrame()

    const window = wrapper.find('.cpf-window')
    expect(window.attributes('style')).toContain('mask-image: url("https://cdn.test/shape.png")')
    expect(wrapper.find('.cpf-photo-box').attributes('style')).toContain('left: 25%')
    expect(wrapper.find('.cpf-photo').attributes('src')).toBe('https://cdn.test/us.jpg')

    const art = wrapper.findAll('.cpf-canvas > *').map((node) => node.classes())
    expect(art[0]).toContain('cpf-art--under')
    expect(art[1]).toContain('cpf-window')
  })

  it('puts the artwork in front when the template says so', async () => {
    const wrapper = await mountFrame({ frameLayer: 'over' })

    const art = wrapper.findAll('.cpf-canvas > *').map((node) => node.classes())
    expect(art.at(-1)).toContain('cpf-art--over')
    expect(wrapper.find('.cpf-art--under').exists()).toBe(false)
  })

  it('draws the shape as itself when there is no photograph to cut', async () => {
    const wrapper = await mountFrame({ photo: null, photoUrl: null })

    expect(wrapper.find('.cpf-window').exists()).toBe(false)
    expect(wrapper.find('.cpf-art--shape').attributes('src')).toBe('https://cdn.test/shape.png')
  })

  it('does not cut to a shape it could not measure', async () => {
    shape.bounds = null
    const wrapper = await mountFrame()

    expect(wrapper.find('.cpf-photo').exists()).toBe(false)
    expect(wrapper.find('.cpf-art--shape').exists()).toBe(true)
  })

  it('draws nothing until the shape has been measured', async () => {
    shape.bounds = null
    shape.settled = false
    const wrapper = await mountFrame()

    expect(wrapper.find('.cpf-canvas').exists()).toBe(false)
  })

  it('places a host’s photo by the template’s offsets, having no framing of its own', async () => {
    const wrapper = await mountFrame({
      photo: { kind: 'host', image: 'dara.jpg', crop: null, photoId: null, hostId: 7, alt: 'Dara' },
      photoUrl: 'https://cdn.test/dara.jpg',
      hostOffset: { x: 50, y: 20 },
    })

    expect(wrapper.find('.cpf-photo').attributes('style')).toContain('object-position: 50% 20%')
  })

  it('shows the whole photo in a plain rectangle without any artwork', async () => {
    const wrapper = await mountFrame({ frameUrl: null, shapeUrl: null })

    const window = wrapper.find('.cpf-window')
    expect(window.exists()).toBe(true)
    expect(window.attributes('style')).not.toContain('mask-image')
    expect(wrapper.find('.cpf-canvas').attributes('style')).toContain('--cpf-aspect: 1')
  })
})
