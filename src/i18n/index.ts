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
 *   2. Create src/i18n/messages/<code>.ts re-exporting them as one bundle
 *   3. Add it to LAZY_LOCALE_LOADERS below
 *   4. Add the locale code to `SUPPORTED_LOCALES`
 *
 * How to add a new namespace (e.g. "expenses.json"):
 *   1. Create src/i18n/locales/en/expenses.json + kh/expenses.json
 *   2. Add it to BOTH bundles in src/i18n/messages/
 *
 * ---------------------------------------------------------------------------
 * Why only the fallback locale is bundled eagerly
 * ---------------------------------------------------------------------------
 * The message JSON is large — ~476kB raw across both locales, of which
 * management.json alone is ~366kB — and it used to sit, in full, in the app
 * ENTRY chunk. That is paid on every boot, and the Design Studio boots the app
 * four times over (the page plus one per preview iframe, each its own browsing
 * context with its own parse). Only one locale is ever displayed at a time, so
 * bundling both meant every one of those boots parsed ~320kB of Khmer it would
 * never render.
 *
 * English stays eager because it is FALLBACK_LOCALE: vue-i18n needs it present
 * to resolve any key the active locale is missing, so deferring it would make
 * every gap in a translation render as a raw key path. Every other locale is
 * fetched on demand and merged in via `ensureLocaleMessages` — awaited before
 * mount in main.ts when it is the startup locale, and awaited by the language
 * store before it flips `locale`, so no component ever renders against messages
 * that have not arrived. If the fetch fails, vue-i18n simply falls back to
 * English rather than showing key paths.
 */

import { createI18n } from 'vue-i18n'

import enMessages from './messages/en'

export const SUPPORTED_LOCALES = ['en', 'kh'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = 'en'
export const FALLBACK_LOCALE: AppLocale = 'en'

type LocaleMessages = typeof enMessages

/**
 * Every locale except the bundled fallback.
 *
 * 'en' is spelled literally rather than as `typeof FALLBACK_LOCALE`: that
 * constant is annotated `AppLocale`, so its type is the whole union and the
 * Exclude would collapse to `never`.
 */
type LazyLocale = Exclude<AppLocale, 'en'>

/**
 * Locales fetched on demand. Keyed so adding one is a single line here plus its
 * bundle module — and so a missing entry is a type error rather than a locale
 * that silently never loads.
 */
const LAZY_LOCALE_LOADERS: Record<LazyLocale, () => Promise<{ default: LocaleMessages }>> = {
  kh: () => import('./messages/kh'),
}

/**
 * Flat message object keyed by locale. Each namespace becomes a
 * top-level key so usage is `t('events.title')`, `t('common.actions.save')`.
 *
 * Only the fallback locale is present at boot; the rest are merged in at
 * runtime by `ensureLocaleMessages`. Typed across all locales so vue-i18n
 * infers `locale` as AppLocale rather than narrowing it to the one key that
 * happens to be here statically.
 */
const messages = { en: enMessages } as Record<AppLocale, LocaleMessages>

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

/** Locales whose messages are in the runtime already. */
const loadedLocales = new Set<AppLocale>([FALLBACK_LOCALE])

/** In-flight loads, so N concurrent callers share one fetch. */
const localeLoads = new Map<AppLocale, Promise<void>>()

/**
 * Make sure `locale`'s messages are present in the vue-i18n runtime.
 *
 * Resolves immediately for anything already loaded (always the case for the
 * fallback locale, which is bundled). Resolving is the signal that it is safe
 * to switch to `locale` — call it BEFORE setI18nLocale, never after, or the
 * first render lands on empty messages.
 *
 * Never rejects: a failed locale chunk leaves the runtime on the fallback
 * locale's messages, which is a degraded but readable UI, and lets a later
 * attempt retry from scratch.
 */
export async function ensureLocaleMessages(locale: AppLocale): Promise<void> {
  if (loadedLocales.has(locale)) return

  const loader = LAZY_LOCALE_LOADERS[locale as LazyLocale]
  if (!loader) return

  let pending = localeLoads.get(locale)
  if (!pending) {
    pending = loader()
      .then((module) => {
        i18n.global.setLocaleMessage(locale, module.default)
        loadedLocales.add(locale)
      })
      .catch(() => {
        // Left unloaded on purpose: vue-i18n falls back to English, and a
        // later switch can try the chunk again.
      })
      .finally(() => {
        localeLoads.delete(locale)
      })
    localeLoads.set(locale, pending)
  }

  await pending
}

/**
 * Imperative locale setter. Prefer using the Pinia store or the
 * `useAppLanguage` composable in components; this is exported for
 * non-component code (e.g. router guards, API error handlers).
 *
 * Assumes `locale`'s messages are already loaded — see ensureLocaleMessages.
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
