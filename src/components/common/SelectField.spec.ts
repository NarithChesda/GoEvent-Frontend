// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import SelectField from './SelectField.vue'

// jsdom has no matchMedia; default to desktop (not mobile)
vi.stubGlobal(
  'matchMedia',
  vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
)

const options = [
  { value: 1, label: 'Wedding', color: '#e91e63' },
  { value: 2, label: 'Conference', color: '#3B82F6' },
]

const mountField = (props: Record<string, unknown> = {}) =>
  mount(SelectField, {
    props: { modelValue: '', options, placeholder: 'Select a category', ...props },
    attachTo: document.body,
  })

const panel = () => document.body.querySelector('[role="dialog"]')

const optionButton = (label: string): HTMLButtonElement | undefined =>
  Array.from(panel()!.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
    b.textContent?.includes(label),
  )

describe('SelectField', () => {
  let wrapper: VueWrapper | undefined

  beforeEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  it('shows the placeholder when empty and the selected label when set', async () => {
    wrapper = mountField()
    expect(wrapper.find('button').text()).toContain('Select a category')

    await wrapper.setProps({ modelValue: 2 })
    expect(wrapper.find('button').text()).toContain('Conference')
  })

  it('matches string model values against numeric option values', async () => {
    wrapper = mountField({ modelValue: '1' })
    expect(wrapper.find('button').text()).toContain('Wedding')
  })

  it('opens the panel and emits the picked value', async () => {
    wrapper = mountField()
    await wrapper.find('button').trigger('click')

    expect(panel()).toBeTruthy()
    optionButton('Conference')!.click()

    expect(wrapper.emitted('update:modelValue')).toEqual([[2]])
    await wrapper.vm.$nextTick()
    expect(panel()).toBeFalsy()
  })

  it('prepends a none option when allowEmpty is set', async () => {
    wrapper = mountField({ modelValue: 1, allowEmpty: true })
    await wrapper.find('button').trigger('click')

    optionButton('Select a category')!.click()
    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
  })

  it('marks the selected option with a check', async () => {
    wrapper = mountField({ modelValue: 1 })
    await wrapper.find('button').trigger('click')

    expect(optionButton('Wedding')!.getAttribute('aria-pressed')).toBe('true')
    expect(optionButton('Conference')!.getAttribute('aria-pressed')).toBe('false')
  })

  it('does not open while disabled', async () => {
    wrapper = mountField({ disabled: true })
    await wrapper.find('button').trigger('click')

    expect(panel()).toBeFalsy()
  })

  it('shows no search box unless searchable', async () => {
    wrapper = mountField()
    await wrapper.find('button').trigger('click')

    expect(panel()!.querySelector('input')).toBeFalsy()
  })

  describe('searchable', () => {
    const searchInput = () => panel()!.querySelector('input') as HTMLInputElement

    const typeQuery = async (value: string) => {
      const input = searchInput()
      input.value = value
      input.dispatchEvent(new Event('input'))
      await wrapper!.vm.$nextTick()
    }

    it('filters options by label', async () => {
      wrapper = mountField({ searchable: true })
      await wrapper.find('button').trigger('click')
      await typeQuery('conf')

      expect(optionButton('Conference')).toBeTruthy()
      expect(optionButton('Wedding')).toBeFalsy()
    })

    it('matches description and hidden keywords too', async () => {
      wrapper = mountField({
        searchable: true,
        options: [{ value: 9, label: 'Sofitel', description: 'Phnom Penh', keywords: 'phokeethra' }],
      })
      await wrapper.find('button').trigger('click')

      await typeQuery('phnom')
      expect(optionButton('Sofitel')).toBeTruthy()

      await typeQuery('phokeethra')
      expect(optionButton('Sofitel')).toBeTruthy()
    })

    it('shows the no-results message when nothing matches', async () => {
      wrapper = mountField({ searchable: true, noResultsText: 'Nothing found' })
      await wrapper.find('button').trigger('click')
      await typeQuery('zzzz')

      expect(panel()!.textContent).toContain('Nothing found')
    })

    it('keeps the none option visible while filtering', async () => {
      wrapper = mountField({ searchable: true, allowEmpty: true })
      await wrapper.find('button').trigger('click')
      await typeQuery('zzzz')

      expect(optionButton('Select a category')).toBeTruthy()
    })

    it('clears the query between openings', async () => {
      wrapper = mountField({ searchable: true })
      await wrapper.find('button').trigger('click')
      await typeQuery('conf')
      expect(optionButton('Wedding')).toBeFalsy()

      optionButton('Conference')!.click()
      await wrapper.vm.$nextTick()

      await wrapper.find('button').trigger('click')
      expect(optionButton('Wedding')).toBeTruthy()
    })
  })
})
