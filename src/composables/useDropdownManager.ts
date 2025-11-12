import { ref, onMounted, onUnmounted, type Ref } from 'vue'

/**
 * Composable for managing dropdown state with click-outside handling
 *
 * @param dropdownKeys - Array of dropdown identifiers to manage
 */
export function useDropdownManager<T extends string>(dropdownKeys: T[]) {
  // Initialize dropdown state for all keys
  const dropdownState = ref<Record<T, boolean>>(
    dropdownKeys.reduce((acc, key) => {
      acc[key] = false
      return acc
    }, {} as Record<T, boolean>)
  ) as Ref<Record<T, boolean>>

  /**
   * Close all dropdowns
   */
  const closeAllDropdowns = () => {
    dropdownKeys.forEach(key => {
      dropdownState.value[key] = false
    })
  }

  /**
   * Toggle a specific dropdown (closes others first)
   */
  const toggleDropdown = (key: T) => {
    const currentState = dropdownState.value[key]
    closeAllDropdowns()
    dropdownState.value[key] = !currentState
  }

  /**
   * Open a specific dropdown (closes others first)
   */
  const openDropdown = (key: T) => {
    closeAllDropdowns()
    dropdownState.value[key] = true
  }

  /**
   * Close a specific dropdown
   */
  const closeDropdown = (key: T) => {
    dropdownState.value[key] = false
  }

  /**
   * Check if a specific dropdown is open
   */
  const isOpen = (key: T): boolean => {
    return dropdownState.value[key] === true
  }

  /**
   * Handle click outside to close dropdowns
   * This is typically called from a root element's @click handler
   */
  const handleClickOutside = () => {
    closeAllDropdowns()
  }

  return {
    // State
    dropdownState,

    // Methods
    closeAllDropdowns,
    toggleDropdown,
    openDropdown,
    closeDropdown,
    isOpen,
    handleClickOutside
  }
}
