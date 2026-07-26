import { ref, computed } from 'vue'
import { useAccordionGroup } from './useAccordionGroup'

/**
 * Tracks expand/collapse state for a section panel. Always starts collapsed
 * on mount (no persistence) so the showcase tab reliably opens with every
 * section collapsed, regardless of what a host expanded in a prior visit.
 *
 * Pass `id` to coordinate with an ancestor's `provideAccordionGroup()` (e.g.
 * EventMediaTab.vue) — expanding this section then collapses whichever other
 * id'd section was open, single-open "accordion" style. With no `id`, or no
 * provided group in scope, this section is fully independent (unchanged
 * behavior for every other caller).
 */
export function useCollapsibleSection(id?: string, defaultExpanded = false) {
  const group = id ? useAccordionGroup() : null

  if (group) {
    const isExpanded = computed(() => group.activeId.value === id)
    const toggle = () => {
      group.activeId.value = isExpanded.value ? null : (id as string)
    }
    return { isExpanded, toggle }
  }

  const isExpanded = ref(defaultExpanded)

  const toggle = () => {
    isExpanded.value = !isExpanded.value
  }

  return { isExpanded, toggle }
}
