/**
 * useMobileTopBar.ts
 *
 * Shared composable for mobile top bar functionality.
 * Handles scroll detection, language menu, and navigation.
 *
 * @module composables/useMobileTopBar
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

export interface Language {
  code: string
  name: string
  flag: string
}

const defaultLanguages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'km', name: 'ខ្មែរ', flag: '🇰🇭' },
]

/**
 * Composable for mobile top bar state and functionality
 */
export function useMobileTopBar(languages: Language[] = defaultLanguages) {
  const router = useRouter()

  const isScrolled = ref(false)
  const showLanguageMenu = ref(false)
  const currentLanguage = ref('en')

  const handleMobileScroll = () => {
    isScrolled.value = window.scrollY > 0
  }

  const handleLogoClick = () => {
    router.push('/events')
  }

  const toggleLanguageMenu = () => {
    showLanguageMenu.value = !showLanguageMenu.value
  }

  const selectLanguage = (code: string) => {
    currentLanguage.value = code
    showLanguageMenu.value = false
    // TODO: Implement actual language switching logic
  }

  const closeLanguageMenu = () => {
    showLanguageMenu.value = false
  }

  // Handle click outside to close language menu
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (
      showLanguageMenu.value &&
      !target.closest('[aria-label="Change language"]')
    ) {
      showLanguageMenu.value = false
    }
  }

  onMounted(() => {
    window.addEventListener('scroll', handleMobileScroll)
    handleMobileScroll() // Check initial scroll position
    document.addEventListener('click', handleClickOutside)
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleMobileScroll)
    document.removeEventListener('click', handleClickOutside)
  })

  return {
    // State
    isScrolled,
    showLanguageMenu,
    currentLanguage,
    languages,

    // Methods
    handleLogoClick,
    toggleLanguageMenu,
    selectLanguage,
    closeLanguageMenu,
  }
}
