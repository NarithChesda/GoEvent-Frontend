// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import CoverLayoutEditor from './CoverLayoutEditor.vue'
import {
  COVER_ELEMENT_IDS,
  COVER_STAGE_LAYOUT_DEFAULTS,
  resolveCoverElements,
} from '@/composables/showcase/useCoverStageLayout'
import type { CoverElementId } from '@/services/api/types/template.types'

vi.mock('@/composables/useAppLanguage', () => ({
  useAppLanguage: () => ({ t: (k: string) => k, locale: { value: 'en' } }),
}))

const elements = resolveCoverElements(COVER_STAGE_LAYOUT_DEFAULTS)
const allVisible = Object.fromEntries(COVER_ELEMENT_IDS.map((id) => [id, true])) as Record<
  CoverElementId,
  boolean
>

const mountEditor = (props: Partial<InstanceType<typeof CoverLayoutEditor>['$props']> = {}) =>
  mount(CoverLayoutEditor, {
    props: { elements, visible: allVisible, selected: 'date', ...props },
  })

/**
 * The toolbar's A−/A+ changes a TEXT's size, which lives in `coverText` — not
 * the box, whose type the row model ignores in rows mode. So it must read the
 * resolved text size and report a text change, never a box change.
 */
describe('CoverLayoutEditor text size', () => {
  it('steps from the text size it is given and reports it as a text change', async () => {
    const wrapper = mountEditor({ textScales: { date: 1.2 } })
    expect(wrapper.find('.cly-tools__value').text()).toBe('120%')

    await wrapper.findAll('.cly-tool')[1].trigger('click')

    expect(wrapper.emitted('textScale')).toEqual([['date', 1.25]])
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('clamps at the ends of the range', async () => {
    const wrapper = mountEditor({ textScales: { date: 0.4 } })
    await wrapper.findAll('.cly-tool')[0].trigger('click')
    expect(wrapper.emitted('textScale')).toEqual([['date', 0.4]])
  })

  it('offers no handles for a row block the row model places', () => {
    const wrapper = mountEditor({ placeable: ['hosts', 'date', 'location'], selected: 'header' })
    expect(wrapper.findAll('.cly-box')).toHaveLength(3)
    expect(wrapper.find('.cly-tools').exists()).toBe(false)
  })
})
