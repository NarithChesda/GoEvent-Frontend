/**
 * useAppLanguage
 *
 * Thin convenience composable that bundles:
 *   - current locale (reactive, from the Pinia store)
 *   - setLocale() — also persists and updates <html lang>
 *   - t() — vue-i18n translate function
 *   - available locales list with display names
 *
 * Use this in components instead of importing vue-i18n and the store
 * separately. It keeps components decoupled from the i18n library choice —
 * if we ever swap vue-i18n out, only this file needs to change.
 *
 * Example:
 *   const { t, locale, setLocale, availableLocales } = useAppLanguage()
 *   <h1>{{ t('events.title') }}</h1>
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLanguageStore } from '@/stores/language'
import { SUPPORTED_LOCALES, type AppLocale } from '@/i18n'

interface LocaleOption {
  code: AppLocale
  name: string
  flag: string
}

const LOCALE_OPTIONS: LocaleOption[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'kh', name: 'ខ្មែរ', flag: '🇰🇭' },
]

export function useAppLanguage() {
  const { t, d, n } = useI18n()
  const store = useLanguageStore()

  const locale = computed<AppLocale>(() => store.locale)

  function setLocale(next: AppLocale) {
    store.setLocale(next)
  }

  const availableLocales = computed<LocaleOption[]>(() =>
    LOCALE_OPTIONS.filter((opt) =>
      (SUPPORTED_LOCALES as readonly string[]).includes(opt.code),
    ),
  )

  const currentLocaleOption = computed<LocaleOption>(
    () =>
      availableLocales.value.find((opt) => opt.code === locale.value) ??
      availableLocales.value[0],
  )

  return {
    t,
    d, // date formatter
    n, // number formatter
    locale,
    setLocale,
    availableLocales,
    currentLocaleOption,
  }
}
