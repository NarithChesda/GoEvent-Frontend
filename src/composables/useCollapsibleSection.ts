import { ref } from 'vue'

/**
 * Tracks expand/collapse state for a section panel. Always starts collapsed
 * on mount (no persistence) so the showcase tab reliably opens with every
 * section collapsed, regardless of what a host expanded in a prior visit.
 */
export function useCollapsibleSection(defaultExpanded = false) {
  const isExpanded = ref(defaultExpanded)

  const toggle = () => {
    isExpanded.value = !isExpanded.value
  }

  return { isExpanded, toggle }
}
