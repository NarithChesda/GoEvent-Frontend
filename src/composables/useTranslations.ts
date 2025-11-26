/**
 * Translation Management Composable
 * Handles multi-language translation management for entities (hosts, agenda items, etc.)
 */

import { ref, reactive, computed, type Ref } from 'vue'

// Available languages (matching API documentation)
export const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'kh', name: 'Khmer' },
  { code: 'fr', name: 'French' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh-cn', name: 'Chinese (Simplified)' },
  { code: 'th', name: 'Thai' },
  { code: 'vn', name: 'Vietnamese' },
] as const

export interface Translation {
  id?: number
  language: string
  [key: string]: any
}

export function useTranslations<T extends Translation>(
  translations: Ref<T[]>,
  defaultTranslation: Omit<T, 'id'>,
) {
  // State
  const activeTab = ref<string>('en') // Default to English tab
  const showAddTranslation = ref(false)
  // Use ref instead of reactive to avoid complex type inference issues
  const newTranslation = ref<Omit<T, 'id'>>({ ...defaultTranslation })

  // Computed
  const availableLanguagesForAdd = computed(() => {
    return AVAILABLE_LANGUAGES.filter(
      (lang) => lang.code !== 'en' && !translations.value.some((t) => t.language === lang.code),
    )
  })

  // Methods
  const getLanguageName = (code: string): string => {
    return AVAILABLE_LANGUAGES.find((lang) => lang.code === code)?.name || code
  }

  const addTranslation = () => {
    if (!newTranslation.value.language) return

    // Check if translation for this language already exists
    if (translations.value.some((t) => t.language === newTranslation.value.language)) {
      alert('Translation for this language already exists')
      return
    }

    const languageCode = newTranslation.value.language
    translations.value.push({ ...newTranslation.value } as T)

    // Switch to the newly added language tab
    activeTab.value = languageCode

    // Reset form
    newTranslation.value = { ...defaultTranslation }

    showAddTranslation.value = false
  }

  const removeTranslation = (index: number) => {
    const removedLanguage = translations.value[index].language
    translations.value.splice(index, 1)

    // If we're removing the currently active tab, switch to English
    if (activeTab.value === removedLanguage) {
      activeTab.value = 'en'
    }
  }

  const closeAddTranslation = () => {
    showAddTranslation.value = false
    newTranslation.value = { ...defaultTranslation }
  }

  // Keyboard navigation for tabs
  const focusNextTab = () => {
    const tabs = ['en', ...translations.value.map((t) => t.language)]
    const currentIndex = tabs.indexOf(activeTab.value)
    const nextIndex = (currentIndex + 1) % tabs.length
    activeTab.value = tabs[nextIndex]
  }

  const focusPreviousTab = () => {
    const tabs = ['en', ...translations.value.map((t) => t.language)]
    const currentIndex = tabs.indexOf(activeTab.value)
    const previousIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1
    activeTab.value = tabs[previousIndex]
  }

  return {
    // State
    activeTab,
    showAddTranslation,
    newTranslation,

    // Computed
    availableLanguagesForAdd,
    availableLanguages: AVAILABLE_LANGUAGES,

    // Methods
    getLanguageName,
    addTranslation,
    removeTranslation,
    closeAddTranslation,
    focusNextTab,
    focusPreviousTab,
  }
}
