// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Which language the app boots in. Decided once, at module evaluation, from
 * storage — so each case re-imports the module against the storage it sets up.
 *
 * The app opens in Khmer for anyone who has not chosen. The old key cannot say
 * whether anyone chose: until 2026-09-14 every boot wrote the app's own English
 * default into it. So it is discarded, and only the new key counts as a choice.
 */

const bootI18n = async () => {
  vi.resetModules()
  return import('./index')
}

beforeEach(() => {
  localStorage.clear()
})

describe('the startup locale', () => {
  it('is Khmer for a visitor who has not chosen, and nothing counts as chosen', async () => {
    const { i18n, hasStoredLocaleAtBoot, DEFAULT_LOCALE } = await bootI18n()
    expect(DEFAULT_LOCALE).toBe('kh')
    expect(i18n.global.locale.value).toBe('kh')
    expect(hasStoredLocaleAtBoot()).toBe(false)
  })

  it('ignores the English the old key holds, and removes it', async () => {
    localStorage.setItem('goevent_app_locale', 'en')
    const { i18n, hasStoredLocaleAtBoot } = await bootI18n()
    expect(i18n.global.locale.value).toBe('kh')
    expect(hasStoredLocaleAtBoot()).toBe(false)
    expect(localStorage.getItem('goevent_app_locale')).toBeNull()
  })

  it('keeps English for someone who chose it', async () => {
    localStorage.setItem('goevent_app_locale_v2', 'en')
    const { i18n, hasStoredLocaleAtBoot, APP_LOCALE_STORAGE_KEY } = await bootI18n()
    expect(APP_LOCALE_STORAGE_KEY).toBe('goevent_app_locale_v2')
    expect(i18n.global.locale.value).toBe('en')
    expect(hasStoredLocaleAtBoot()).toBe(true)
  })

  it('falls back to the default for a value it does not support', async () => {
    localStorage.setItem('goevent_app_locale_v2', 'fr')
    const { i18n } = await bootI18n()
    expect(i18n.global.locale.value).toBe('kh')
  })

  it('still resolves a missing Khmer key through English, the fallback', async () => {
    const { FALLBACK_LOCALE, i18n } = await bootI18n()
    expect(FALLBACK_LOCALE).toBe('en')
    expect(i18n.global.getLocaleMessage('en')).toHaveProperty('common')
  })
})
