import { ref } from 'vue'

// Shared state for sidebar
const isCollapsed = ref(true)
const isMobileMenuOpen = ref(false)

export function useSidebar() {
  const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value
  }

  const openSidebar = () => {
    isMobileMenuOpen.value = true
  }

  const closeSidebar = () => {
    isMobileMenuOpen.value = false
  }

  const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
  }

  return {
    isCollapsed,
    isMobileMenuOpen,
    toggleCollapse,
    openSidebar,
    closeSidebar,
    toggleMobileMenu
  }
}