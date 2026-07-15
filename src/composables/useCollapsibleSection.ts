import { ref } from 'vue'

/**
 * Tracks expand/collapse state for a section panel, persisted per `storageKey`
 * so a host's chosen layout (which sections they keep open) survives reloads.
 */
export function useCollapsibleSection(storageKey: string, defaultExpanded = false) {
  const isExpanded = ref(defaultExpanded)

  try {
    const stored = localStorage.getItem(storageKey)
    if (stored !== null) {
      isExpanded.value = stored === 'true'
    }
  } catch {
    // Storage unavailable (private mode) - keep default
  }

  const toggle = () => {
    isExpanded.value = !isExpanded.value
    try {
      localStorage.setItem(storageKey, String(isExpanded.value))
    } catch {
      // Storage unavailable - ignore
    }
  }

  return { isExpanded, toggle }
}
