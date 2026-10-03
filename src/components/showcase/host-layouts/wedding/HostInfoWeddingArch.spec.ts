// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import HostInfoWeddingArch from './HostInfoWeddingArch.vue'
import type { HostInfoProps } from '@/types/showcase'
import type { FrameWindow } from '@/composables/showcase/useFrameWindow'
import { POINTED_FRAME_PATH } from './archPhotoFrame'

vi.mock('@/composables/useAppLanguage', () => ({
  useAppLanguage: () => ({ t: (k: string) => k, locale: { value: 'en' } }),
}))

/**
 * Measuring an uploaded frame reads its pixels on a canvas, which jsdom
 * cannot do. What the measurement concludes is set per test instead; the
 * measuring itself is covered by useFrameWindow.spec.ts.
 */
const measured = vi.hoisted(() => ({
  frameWindow: null as FrameWindow | null,
  settled: true,
}))

vi.mock('@/composables/showcase/useFrameWindow', async () => {
  const { shallowRef } = await import('vue')
  return {
    useFrameWindow: () => ({
      frameWindow: shallowRef(measured.frameWindow),
      settled: shallowRef(measured.settled),
    }),
  }
})

const HOSTS: HostInfoProps['hosts'] = [
  { id: 1, name: 'Sochea', title: 'Bridegroom', parent_a_name: 'Mr Thann' },
  { id: 2, name: 'Sokphea', title: 'Bride', parent_a_name: 'Mr Sokhom' },
]

const THIRD: HostInfoProps['hosts'][number] = { id: 3, name: 'Dara', title: 'Best man' }

const FRAME_ART = 'https://cdn.example/frame.png'

/** A frame drawn in the middle 80% of a square image, with a window in its middle half. */
const RING: FrameWindow = {
  aspectRatio: 1,
  ink: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
  opening: { x: 0.3, y: 0.3, width: 0.4, height: 0.4 },
  openingMask: 'data:image/png;base64,AAAA',
}

const mountArch = (props: Partial<HostInfoProps> = {}) =>
  mount(HostInfoWeddingArch, {
    props: {
      hosts: HOSTS,
      eventInitial: 'S',
      primaryColor: '#5b4636',
      accentColor: '#c9a227',
      currentFont: 'serif',
      ...props,
    } as HostInfoProps,
  })

beforeEach(() => {
  measured.frameWindow = null
  measured.settled = true
})

describe('HostInfoWeddingArch frame', () => {
  it('draws round arches with the names underneath when the template says nothing', () => {
    const wrapper = mountArch()

    expect(wrapper.find('.arch-stage').classes()).toContain('arch-stage--below')
    const frames = wrapper.findAll('.arch-frame')
    expect(frames).toHaveLength(2)
    expect(frames.every((frame) => frame.classes().includes('arch-frame--arch'))).toBe(true)
  })

  it("draws the template's shape for every host, extras included", () => {
    const wrapper = mountArch({ photoFrame: 'oval', hosts: [...HOSTS, THIRD] })
    const frames = wrapper.findAll('.arch-frame')

    expect(frames).toHaveLength(3)
    expect(frames.every((frame) => frame.classes().includes('arch-frame--oval'))).toBe(true)
  })

  it('draws a shape this build does not know as the round arch', () => {
    const wrapper = mountArch({ photoFrame: 'hexagon' as HostInfoProps['photoFrame'] })

    expect(wrapper.find('.arch-frame').classes()).toContain('arch-frame--arch')
  })

  it('draws both hairlines of the pointed window as the path the photo is cut to', () => {
    const wrapper = mountArch({ photoFrame: 'pointed' })
    const frame = wrapper.find('.arch-frame')

    expect(frame.find('.arch-rule--outer path').attributes('d')).toBe(POINTED_FRAME_PATH)
    expect(frame.find('.arch-photo .arch-rule--inner path').attributes('d')).toBe(POINTED_FRAME_PATH)
    expect(frame.attributes('style')).toContain('--arch-pointed-mask')
  })

  it('draws the rounded shapes without a drawn path', () => {
    const wrapper = mountArch({ photoFrame: 'circle' })

    expect(wrapper.find('.arch-rule').exists()).toBe(false)
  })
})

describe('HostInfoWeddingArch names', () => {
  it('sets the names beside the frames, with the flourish crossing between the rows', () => {
    const wrapper = mountArch({ captionPlacement: 'beside' })

    expect(wrapper.find('.arch-stage').classes()).toContain('arch-stage--beside')
    // Shallow, for the short row it crosses rather than the empty cell it fills.
    expect(wrapper.find('.arch-thread').attributes('viewBox')).toBe('0 0 60 34')
    // Each card is a figure and a caption, the two things a row sets side by side.
    const card = wrapper.find('.arch-card--b')
    expect(card.find('.arch-figure').exists()).toBe(true)
    expect(card.find('.arch-caption .arch-name').text()).toBe('Sokphea')
  })

  it('keeps the steep flourish when the names are underneath', () => {
    const wrapper = mountArch()

    expect(wrapper.find('.arch-thread').attributes('viewBox')).toBe('0 0 60 90')
  })

  /**
   * A pathLength dash draw under non-scaling-stroke stops short of the dot in
   * Chromium whenever the flourish is drawn larger than its viewBox. The wipe
   * doesn't depend on how the stroke is measured.
   */
  it('draws the flourish with a wipe, never with its own dash', () => {
    const wrapper = mountArch({ captionPlacement: 'beside' })

    expect(wrapper.find('.arch-thread').classes()).toContain('is-drawing')
    expect(wrapper.find('.arch-thread-path').attributes('pathLength')).toBeUndefined()
  })

  it('reads a placement this build does not know as names underneath', () => {
    const wrapper = mountArch({ captionPlacement: 'above' as HostInfoProps['captionPlacement'] })

    expect(wrapper.find('.arch-stage').classes()).toContain('arch-stage--below')
  })
})

describe('HostInfoWeddingArch custom frame', () => {
  it('holds every frame back, artwork already loading, until it has been measured', () => {
    measured.settled = false
    const wrapper = mountArch({ photoFrameImage: FRAME_ART })
    const frames = wrapper.findAll('.arch-frame')

    expect(frames.every((frame) => frame.classes().includes('arch-frame--pending'))).toBe(true)
    expect(wrapper.find('.arch-art').attributes('src')).toBe(FRAME_ART)
  })

  it('fits the photo into the window the artwork encloses', () => {
    measured.frameWindow = RING
    const wrapper = mountArch({ photoFrameImage: FRAME_ART, photoFrame: 'pointed' })
    const frame = wrapper.find('.arch-frame')

    // The artwork's own shape replaces the drawn one, hairlines and all.
    expect(frame.classes()).toEqual(['arch-frame', 'arch-frame--art'])
    expect(frame.find('.arch-rule').exists()).toBe(false)
    expect((frame.element as HTMLElement).style.aspectRatio).toBe('1')

    const percent = (value: string) => Number.parseFloat(value)
    const photo = frame.find('.arch-photo').element as HTMLElement
    expect(percent(photo.style.left)).toBeCloseTo(25, 6)
    expect(percent(photo.style.width)).toBeCloseTo(50, 6)
    expect(photo.style.maskImage).toBe(`url("${RING.openingMask}")`)

    const art = frame.find('.arch-art')
    expect(art.classes()).toContain('arch-art--placed')
    expect(percent((art.element as HTMLElement).style.width)).toBeCloseTo(125, 6)
  })

  it('lays an open design over the drawn shape, in place of its hairlines', () => {
    measured.frameWindow = { ...RING, opening: null, openingMask: null }
    const wrapper = mountArch({ photoFrameImage: FRAME_ART, photoFrame: 'pointed' })
    const frame = wrapper.find('.arch-frame')

    expect(frame.classes()).toContain('arch-frame--pointed')
    expect(frame.classes()).toContain('arch-frame--overlaid')
    expect(frame.find('.arch-rule').exists()).toBe(false)
    expect(frame.find('.arch-art').classes()).toContain('arch-art--over')
  })

  it('keeps the monogram in the window when a host has no photo yet', () => {
    measured.frameWindow = RING
    const wrapper = mountArch({ photoFrameImage: FRAME_ART })

    expect(wrapper.find('.arch-frame--art .arch-monogram').text()).toBe('S')
  })
})
