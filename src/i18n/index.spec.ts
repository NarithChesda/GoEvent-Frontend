import { describe, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ensureLocaleMessages, i18n, SUPPORTED_LOCALES } from './index'
import { useLanguageStore } from '@/stores/language'

/**
 * Only the fallback locale ships in the entry chunk; every other locale is a
 * lazily fetched chunk merged in at runtime (see the note in ./index.ts). That
 * split is invisible when it works and produces a UI full of raw key paths when
 * it doesn't, so the guarantee worth pinning down is the ordering one: nothing
 * switches the active locale until that locale's messages have actually landed.
 */
describe('lazy locale messages', () => {
  it('bundles the fallback locale so the first render never waits', () => {
    expect(i18n.global.availableLocales).toContain('en')
    expect(i18n.global.getLocaleMessage('en')).toHaveProperty('common')
  })

  it('merges a lazily loaded locale into the runtime', async () => {
    await ensureLocaleMessages('kh')

    const messages = i18n.global.getLocaleMessage('kh')
    // Namespace-complete, not just present: a partial merge would leave whole
    // sections of the app falling back to English with no visible failure.
    expect(Object.keys(messages).sort()).toEqual(
      Object.keys(i18n.global.getLocaleMessage('en')).sort(),
    )
  })

  it('is idempotent and shares one load between concurrent callers', async () => {
    // main.ts and the language store can both ask at once on a Khmer session.
    await Promise.all([ensureLocaleMessages('kh'), ensureLocaleMessages('kh')])
    expect(i18n.global.getLocaleMessage('kh')).toHaveProperty('management')
  })

  it('has a loader registered for every supported non-fallback locale', async () => {
    // Guards the failure mode of adding a locale to SUPPORTED_LOCALES and
    // forgetting its bundle: the switch would silently no-op to English.
    for (const locale of SUPPORTED_LOCALES) {
      await ensureLocaleMessages(locale)
      expect(i18n.global.availableLocales).toContain(locale)
    }
  })

  /**
   * vue-i18n compiles a message the first time it is rendered, not at build
   * time, so a message with bad syntax is a *runtime* exception in whichever
   * component happens to use it — and it is invisible to type-checking, to the
   * build, and to every test that does not render that one component.
   *
   * The trap that produced this test: `@` opens vue-i18n's linked-message
   * syntax, so a Telegram placeholder written as `"@username or link"` threw
   * `Invalid linked format` and took down the whole drawer that rendered it.
   * The repo convention is to escape it as `{'@'}` — 8 messages already did,
   * and the ninth did not. `|` (plural separator) and `{}` (interpolation) are
   * the same class of hazard.
   *
   * Rendering every message is the only way to find these, so that is what this
   * does. It is cheap: compilation is memoized, so this also warms the cache
   * the rest of the suite renders against.
   */
  it('compiles every message in every locale', async () => {
    for (const locale of SUPPORTED_LOCALES) await ensureLocaleMessages(locale)

    const broken: string[] = []

    const render = (node: unknown, path: string, locale: string): void => {
      if (typeof node === 'string') {
        try {
          i18n.global.t(path, {}, { locale })
        } catch (error) {
          broken.push(`[${locale}] ${path} — ${(error as Error).message}`)
        }
        return
      }
      if (node && typeof node === 'object') {
        for (const [key, value] of Object.entries(node)) {
          render(value, path ? `${path}.${key}` : key, locale)
        }
      }
    }

    for (const locale of SUPPORTED_LOCALES) {
      render(i18n.global.getLocaleMessage(locale), '', locale)
    }

    expect(broken).toEqual([])
  })

  it('only switches the active locale once its messages are loaded', async () => {
    setActivePinia(createPinia())
    const store = useLanguageStore()

    await store.setLocale('kh')

    expect(store.locale).toBe('kh')
    expect(i18n.global.locale.value).toBe('kh')
    // The point of awaiting: had the switch landed first, this key would have
    // rendered as its own path until the chunk arrived.
    expect(i18n.global.t('common.actions.save')).not.toBe('common.actions.save')
  })
})
