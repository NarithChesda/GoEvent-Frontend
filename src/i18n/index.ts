/**
 * App i18n configuration (vue-i18n v11)
 *
 * Scope: This is for the APP UI — navigation, pages, buttons, forms.
 * The event SHOWCASE system keeps its own translation layer in
 * `src/utils/translations.ts` since showcase language is driven by
 * event data / guest URL params, independent of the app language.
 *
 * How to add a new locale:
 *   1. Create src/i18n/locales/<code>/*.json (mirror existing namespaces)
 *   2. Import them below and add to `messages`
 *   3. Add the locale code to `SUPPORTED_LOCALES`
 *
 * How to add a new namespace (e.g. "expenses.json"):
 *   1. Create src/i18n/locales/en/expenses.json + kh/expenses.json
 *   2. Import both and merge into the messages object below
 */

import { createI18n } from 'vue-i18n'

// English namespaces
import enCommon from './locales/en/common.json'
import enAuth from './locales/en/auth.json'
import enEvents from './locales/en/events.json'
import enDiscover from './locales/en/discover.json'
import enManagement from './locales/en/management.json'
import enSettings from './locales/en/settings.json'
import enCategories from './locales/en/categories.json'
import enServices from './locales/en/services.json'

// Khmer namespaces
import khCommon from './locales/kh/common.json'
import khAuth from './locales/kh/auth.json'
import khEvents from './locales/kh/events.json'
import khDiscover from './locales/kh/discover.json'
import khManagement from './locales/kh/management.json'
import khSettings from './locales/kh/settings.json'
import khCategories from './locales/kh/categories.json'
import khServices from './locales/kh/services.json'

export const SUPPORTED_LOCALES = ['en', 'kh'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = 'en'
export const FALLBACK_LOCALE: AppLocale = 'en'

/**
 * Flat message object keyed by locale. Each namespace becomes a
 * top-level key so usage is `t('events.title')`, `t('common.actions.save')`.
 */
const messages = {
  en: {
    common: enCommon,
    auth: enAuth,
    events: enEvents,
    discover: enDiscover,
    management: enManagement,
    settings: enSettings,
    categories: enCategories,
    services: enServices,
  },
  kh: {
    common: khCommon,
    auth: khAuth,
    events: khEvents,
    discover: khDiscover,
    management: khManagement,
    settings: khSettings,
    categories: khCategories,
    services: khServices,
  },
}

/**
 * Read persisted locale from localStorage (if any). We read here rather
 * than from the Pinia store because i18n is created before Pinia mounts.
 * The store keeps itself in sync on init and on every setLocale call.
 */
const STORAGE_KEY = 'goevent_app_locale'

function getInitialLocale(): AppLocale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
      return stored as AppLocale
    }
  } catch {
    // localStorage can throw in private mode / SSR — fall through
  }
  return DEFAULT_LOCALE
}

export const i18n = createI18n({
  legacy: false, // Composition API mode
  locale: getInitialLocale(),
  fallbackLocale: FALLBACK_LOCALE,
  messages,
  missingWarn: import.meta.env.DEV,
  fallbackWarn: import.meta.env.DEV,
  silentTranslationWarn: !import.meta.env.DEV,
  silentFallbackWarn: !import.meta.env.DEV,
})

/**
 * Imperative locale setter. Prefer using the Pinia store or the
 * `useAppLanguage` composable in components; this is exported for
 * non-component code (e.g. router guards, API error handlers).
 */
export function setI18nLocale(locale: AppLocale): void {
  i18n.global.locale.value = locale
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // ignore persistence failures
  }
  // Reflect on <html lang="..."> for accessibility and SEO
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', locale === 'kh' ? 'km' : 'en')
  }
}

export { STORAGE_KEY as APP_LOCALE_STORAGE_KEY }
