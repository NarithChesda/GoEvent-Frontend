// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { i18n } from '@/i18n'
import DateTimePickerField from './DateTimePickerField.vue'

// jsdom has no matchMedia; default to desktop (not mobile)
vi.stubGlobal(
  'matchMedia',
  vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
)

const mountField = (props: Record<string, unknown> = {}) =>
  mount(DateTimePickerField, {
    props: { modelValue: '', ...props },
    global: { plugins: [createPinia(), i18n] },
    attachTo: document.body,
  })

const panel = () => document.body.querySelector('[role="dialog"]')

const dayButton = (day: number): HTMLButtonElement | undefined =>
  Array.from(panel()!.querySelectorAll<HTMLButtonElement>('.grid.grid-cols-7 button')).find(
    (b) => b.textContent?.trim() === String(day),
  )

describe('DateTimePickerField', () => {
  let wrapper: VueWrapper | undefined

  beforeEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  it('shows the placeholder when empty and a localized value when set', async () => {
    wrapper = mountField({ placeholder: 'Pick one' })
    expect(wrapper.find('button').text()).toContain('Pick one')

    await wrapper.setProps({ modelValue: '2026-07-15T14:30' })
    const text = wrapper.find('button').text()
    expect(text).toContain('Jul')
    expect(text).toContain('15')
    expect(text).toContain('2026')
  })

  it('opens the picker panel with a calendar for the value month', async () => {
    wrapper = mountField({ modelValue: '2026-07-15T14:30' })
    await wrapper.find('button').trigger('click')

    expect(panel()).toBeTruthy()
    expect(panel()!.textContent).toContain('July 2026')
    // July has 31 days
    expect(dayButton(31)).toBeTruthy()
  })

  it('emits a datetime-local string after picking a day and confirming', async () => {
    wrapper = mountField({ modelValue: '2026-07-15T14:30' })
    await wrapper.find('button').trigger('click')

    dayButton(9)!.click()
    const done = Array.from(panel()!.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      b.textContent?.includes('Done'),
    )
    done!.click()

    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-07-09T14:30']])
  })

  it('disables days outside min/max bounds', async () => {
    wrapper = mountField({
      modelValue: '2026-07-15T10:00',
      min: '2026-07-10T00:00',
      max: '2026-07-20T23:59',
    })
    await wrapper.find('button').trigger('click')

    expect(dayButton(9)!.disabled).toBe(true)
    expect(dayButton(10)!.disabled).toBe(false)
    expect(dayButton(20)!.disabled).toBe(false)
    expect(dayButton(21)!.disabled).toBe(true)
  })

  it('clears the value via the Clear action when clearable', async () => {
    wrapper = mountField({ modelValue: '2026-07-15T14:30', clearable: true })
    await wrapper.find('button').trigger('click')

    const clear = Array.from(panel()!.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      b.textContent?.includes('Clear'),
    )
    clear!.click()

    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
  })

  it('navigates between months', async () => {
    wrapper = mountField({ modelValue: '2026-07-15T14:30' })
    await wrapper.find('button').trigger('click')

    const next = panel()!.querySelector<HTMLButtonElement>('[aria-label="Next month"]')
    next!.click()
    await wrapper.vm.$nextTick()

    expect(panel()!.textContent).toContain('August 2026')
  })
})
