/**
 * Language Store
 *
 * Global app language preference. Keeps the vue-i18n runtime, localStorage,
 * and the <html lang> attribute in sync.
 *
 * Usage in components:
 *   const lang = useLanguageStore()
 *   lang.setLocale('kh')
 *   lang.locale        // reactive ref
 *
 * For reading the current locale and translating, prefer the
 * `useAppLanguage` composable which combines this store with vue-i18n's t().
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  APP_LOCALE_STORAGE_KEY,
  setI18nLocale,
  type AppLocale,
} from '@/i18n'

export const useLanguageStore = defineStore('language', () => {
  // Initialize from localStorage (the same source i18n used on boot)
  const locale = ref<AppLocale>(readStoredLocale())

  function readStoredLocale(): AppLocale {
    try {
      const stored = localStorage.getItem(APP_LOCALE_STORAGE_KEY)
      if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
        return stored as AppLocale
      }
    } catch {
      // ignore
    }
    return DEFAULT_LOCALE
  }

  function setLocale(next: AppLocale) {
    if (!(SUPPORTED_LOCALES as readonly string[]).includes(next)) return
    locale.value = next
    setI18nLocale(next) // updates vue-i18n + localStorage + <html lang>
  }

  /**
   * Sync the <html lang> attribute on initial app mount. i18n.ts already
   * read the stored locale, but we call setI18nLocale once so the DOM
   * attribute is set even on a fresh load.
   */
  function init() {
    setI18nLocale(locale.value)
  }

  return {
    locale,
    setLocale,
    init,
  }
})
