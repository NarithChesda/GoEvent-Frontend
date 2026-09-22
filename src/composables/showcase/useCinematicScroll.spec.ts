// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { isPlainTap, playbackVelocity, useCinematicScroll } from './useCinematicScroll'

describe('playbackVelocity', () => {
  const cruise = 60

  it('starts from rest and reaches cruise speed', () => {
    expect(playbackVelocity(cruise, 0, 5000)).toBe(0)
    expect(playbackVelocity(cruise, 350, 5000)).toBeCloseTo(30)
    expect(playbackVelocity(cruise, 5000, 5000)).toBe(cruise)
  })

  it('brakes to zero at the rest point', () => {
    // Braking distance at 60px/s over 1.4s of uniform deceleration is 42px.
    expect(playbackVelocity(cruise, 5000, 42)).toBe(cruise)
    expect(playbackVelocity(cruise, 5000, 10.5)).toBeCloseTo(30)
    expect(playbackVelocity(cruise, 5000, 0)).toBe(0)
    expect(playbackVelocity(cruise, 5000, -10)).toBe(0)
  })
})

describe('isPlainTap', () => {
  let root: HTMLElement

  beforeEach(() => {
    root = document.createElement('div')
    document.body.appendChild(root)
  })

  afterEach(() => root.remove())

  it('accepts a tap on invitation text', () => {
    root.innerHTML = '<section><p><span id="t">Welcome</span></p></section>'
    expect(isPlainTap(root.querySelector('#t'), root)).toBe(true)
  })

  it('rejects a tap inside a control', () => {
    root.innerHTML = '<button><svg><path id="t"></path></svg></button>'
    expect(isPlainTap(root.querySelector('#t'), root)).toBe(false)
  })

  it('rejects an element styled as clickable, like a photo tile', () => {
    root.innerHTML = '<div style="cursor: pointer" id="t"></div>'
    expect(isPlainTap(root.querySelector('#t'), root)).toBe(false)
  })

  it('rejects a tap on a layer floating over the page', () => {
    root.innerHTML = '<div style="position: fixed"><div id="t"></div></div>'
    expect(isPlainTap(root.querySelector('#t'), root)).toBe(false)
  })

  it('rejects a target outside the stage', () => {
    expect(isPlainTap(document.body, root)).toBe(false)
  })
})

describe('useCinematicScroll', () => {
  let rafQueue: FrameRequestCallback[] = []
  let clock = 0
  let reducedMotion = false
  let wrapper: VueWrapper | null = null

  /** Advance playback by `ms` in 16ms frames. */
  const run = (ms: number) => {
    for (let t = 0; t < ms; t += 16) {
      clock += 16
      const queued = rafQueue
      rafQueue = []
      queued.forEach((cb) => cb(clock))
    }
  }

  const setup = (enabled = true) => {
    const api: { isPlaying?: Readonly<{ value: boolean }> } = {}
    const Stage = defineComponent({
      setup() {
        const root = ref<HTMLElement>()
        const scroller = ref<HTMLElement>()
        const { isPlaying } = useCinematicScroll({
          root,
          scroller,
          restOffset: () => 2000,
          enabled: () => enabled,
        })
        api.isPlaying = isPlaying
        return () =>
          h('div', { ref: root, class: 'stage' }, [
            h('div', { ref: scroller, class: 'scroller' }, [h('p', { class: 'copy' }, 'Hello')]),
            h('button', { class: 'control' }, 'RSVP'),
          ])
      },
    })
    wrapper = mount(Stage, { attachTo: document.body })

    const scroller = wrapper.find('.scroller').element as HTMLElement
    Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: 720 })
    Object.defineProperty(scroller, 'scrollHeight', { configurable: true, value: 3000 })

    return { scroller, isPlaying: () => api.isPlaying!.value }
  }

  /** jsdom has no PointerEvent; the composable reads only these fields. */
  const press = (el: Element, x = 10, y = 10) => {
    const e = new Event('pointerdown', { bubbles: true })
    Object.assign(e, { isPrimary: true, clientX: x, clientY: y })
    el.dispatchEvent(e)
  }

  const tap = (el: Element, x = 10, y = 10) => {
    press(el, x, y)
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1, clientX: x, clientY: y }))
  }

  beforeEach(() => {
    rafQueue = []
    clock = 0
    reducedMotion = false
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafQueue.push(cb)
      return rafQueue.length
    })
    vi.stubGlobal('cancelAnimationFrame', () => {
      rafQueue = []
    })
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce') && reducedMotion,
    }))
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    vi.unstubAllGlobals()
  })

  it('plays on a tap and eases up to speed', () => {
    const { scroller, isPlaying } = setup()
    tap(scroller.querySelector('.copy')!)
    expect(isPlaying()).toBe(true)

    run(200)
    const early = scroller.scrollTop
    run(2000)
    // 720px per 12s is 60px/s at cruise; ramping in costs part of the first 700ms.
    expect(early).toBeGreaterThan(0)
    expect(scroller.scrollTop).toBeGreaterThan(100)
    expect(scroller.scrollTop).toBeLessThan(132)
  })

  it('pauses on the next tap, at once', () => {
    const { scroller, isPlaying } = setup()
    tap(scroller.querySelector('.copy')!)
    run(1000)

    press(scroller.querySelector('.copy')!)
    expect(isPlaying()).toBe(false)
    const held = scroller.scrollTop
    scroller.dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 1, clientX: 10, clientY: 10 }),
    )
    run(500)
    expect(isPlaying()).toBe(false)
    expect(scroller.scrollTop).toBe(held)
  })

  it('stops when the guest scrolls with a wheel', () => {
    const { scroller, isPlaying } = setup()
    tap(scroller.querySelector('.copy')!)
    scroller.dispatchEvent(new Event('wheel', { bubbles: true }))
    expect(isPlaying()).toBe(false)
  })

  it('lands on the rest point and stops there', () => {
    const { scroller, isPlaying } = setup()
    scroller.scrollTop = 1900
    tap(scroller.querySelector('.copy')!)
    run(10_000)
    expect(scroller.scrollTop).toBe(2000)
    expect(isPlaying()).toBe(false)
  })

  it('leaves taps on controls alone', () => {
    const { isPlaying } = setup()
    tap(wrapper!.find('.control').element)
    expect(isPlaying()).toBe(false)
  })

  it('ignores a drag', () => {
    const { scroller, isPlaying } = setup()
    const copy = scroller.querySelector('.copy')!
    press(copy, 10, 10)
    copy.dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 1, clientX: 10, clientY: 60 }),
    )
    expect(isPlaying()).toBe(false)
  })

  it('does nothing under reduced motion', () => {
    reducedMotion = true
    const { scroller, isPlaying } = setup()
    tap(scroller.querySelector('.copy')!)
    expect(isPlaying()).toBe(false)
  })

  it('does nothing where it is disabled', () => {
    const { scroller, isPlaying } = setup(false)
    tap(scroller.querySelector('.copy')!)
    expect(isPlaying()).toBe(false)
  })
})
