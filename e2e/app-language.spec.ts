import type { Page } from '@playwright/test'
import { test, expect, APP_LOCALE_KEY, waitForAppMount } from './fixtures'

/**
 * The app opens in Khmer for anyone who has not chosen a language.
 *
 * DEFAULT_LOCALE is 'kh', and the choice is stored under a fresh key
 * (`goevent_app_locale_v2`): the old key was written with the app's own
 * English default on every boot until 2026-09-14, so it says nothing about
 * what anyone chose and is discarded — everyone starts in Khmer once, and a
 * visitor who switches to English keeps it from then on.
 *
 * And a guest's invitation does not wait for the app's Khmer strings: the
 * showcase speaks the event's language, not the app's, so main.ts only blocks
 * the first paint on that chunk for everything else.
 */

// About first visits, so no language is seeded (see fixtures.ts).
test.use({ appLocale: null })

const stored = (page: Page, key: string) => page.evaluate((k) => localStorage.getItem(k), key)

/** The Khmer message bundle, as the dev server serves it. */
const isKhmerBundle = (url: URL) => url.pathname.endsWith('/src/i18n/messages/kh.ts')

test.describe('the app language', () => {
  test.beforeEach(async ({ page, stubApi }) => {
    await stubApi(page)
  })

  test('a first visit opens the homepage in Khmer, and stores nothing', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'km')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('កម្មវិធីដ៏អស្ចារ្យ')
    expect(await stored(page, APP_LOCALE_KEY)).toBeNull()
  })

  test('the English the old key held is not taken for a choice, and is cleared', async ({ page }) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('seeded')) {
        sessionStorage.setItem('seeded', '1')
        localStorage.setItem('goevent_app_locale', 'en')
      }
    })
    await page.goto('/explore')
    await expect(page.locator('html')).toHaveAttribute('lang', 'km')
    expect(await stored(page, 'goevent_app_locale')).toBeNull()
  })

  test('a guest’s invitation mounts without waiting for the Khmer strings', async ({ page }) => {
    // Hold the Khmer bundle far longer than the assertion below waits. If the
    // showcase still blocked its first paint on it, #app would stay empty.
    let release: () => void = () => {}
    const held = new Promise<void>((resolve) => (release = resolve))
    await page.route(isKhmerBundle, async (route) => {
      await held
      await route.continue()
    })

    await page.goto('/events/e-1/showcase')
    await waitForAppMount(page)
    release()

    // The rest of the app still waits, so no page flashes English first.
    await page.goto('/explore')
    await expect(page.locator('html')).toHaveAttribute('lang', 'km')
  })
})

test.describe('the app language, on the desktop bar', () => {
  // The signed-out language menu is desktop chrome, so both projects run this
  // one at desktop width.
  test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false })

  test.beforeEach(async ({ page, stubApi }) => {
    await stubApi(page)
  })

  test('choosing English sticks across a reload', async ({ page }) => {
    await page.goto('/explore')
    await expect(page.locator('html')).toHaveAttribute('lang', 'km')

    await page.getByRole('button', { name: 'Change language' }).click()
    await page.getByRole('button', { name: 'English' }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    expect(await stored(page, APP_LOCALE_KEY)).toBe('en')

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })
})
