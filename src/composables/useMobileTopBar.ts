/**
 * useMobileTopBar.ts
 *
 * Shared composable for mobile top bar functionality.
 * Handles scroll detection, language menu, and navigation.
 *
 * @module composables/useMobileTopBar
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppLanguage } from '@/composables/useAppLanguage'
import type { AppLocale } from '@/i18n'

/**
 * Composable for mobile top bar state and functionality
 */
export function useMobileTopBar() {
  const router = useRouter()
  const { locale, setLocale, availableLocales } = useAppLanguage()

  const isScrolled = ref(false)
  const showLanguageMenu = ref(false)
  const currentLanguage = computed(() => locale.value)

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
    setLocale(code as AppLocale)
    showLanguageMenu.value = false
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
    languages: availableLocales,

    // Methods
    handleLogoClick,
    toggleLanguageMenu,
    selectLanguage,
    closeLanguageMenu,
  }
}
