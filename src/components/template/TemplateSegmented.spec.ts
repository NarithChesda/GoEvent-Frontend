// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import TemplateSegmented from './TemplateSegmented.vue'

/** jsdom has no layout, so each button is given a geometry of its own. The
 *  numbers travel with the ELEMENT, which is what makes the assertion about
 *  *which* button the thumb measured rather than about where it sits. */
const stubGeometry = (el: HTMLElement, left: number, width: number) => {
  Object.defineProperty(el, 'offsetLeft', { value: left, configurable: true })
  Object.defineProperty(el, 'offsetWidth', { value: width, configurable: true })
}

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
})

const EN = { value: 'en', label: 'EN' }
const KH = { value: 'kh', label: 'KH' }

describe('TemplateSegmented thumb', () => {
  it('tracks the active option after the option list is re-ordered', async () => {
    const wrapper = mount(TemplateSegmented, {
      props: { modelValue: 'en', options: [EN, KH] },
      attachTo: document.body,
    })

    const [enBtn, khBtn] = wrapper.findAll('.tpl-seg__item').map((w) => w.element as HTMLElement)
    stubGeometry(enBtn, 4, 40)
    stubGeometry(khBtn, 46, 44)

    await nextTick()
    await nextTick()
    const thumb = () => wrapper.find('.tpl-seg__thumb').attributes('style') ?? ''
    expect(thumb()).toContain('translateX(4px)')
    expect(thumb()).toContain('width: 40px')

    // What the preview pane does: the frame reports the event's own language
    // order, which flips the list under an already-mounted control.
    await wrapper.setProps({ modelValue: 'kh', options: [KH, EN] })
    await nextTick()
    await nextTick()

    expect(thumb()).toContain('translateX(46px)')
    expect(thumb()).toContain('width: 44px')
    wrapper.unmount()
  })
})
