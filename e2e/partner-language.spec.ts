import type { Page } from '@playwright/test'
import { test, expect, APP_LOCALE_KEY } from './fixtures'

/**
 * /partners and /partners/templates open in Khmer, and stay reachable in both
 * languages on a phone.
 *
 * Both are links a salesperson sends to a Cambodian shop owner who has never
 * opened the app. Khmer is now the whole app's default (DEFAULT_LOCALE), and
 * the routes still declare `preferredLocale: 'kh'` (router meta) so they stay
 * Khmer-first should that default ever change back.
 *
 * The regression this file exists for is silent and was live: the store's boot
 * sync persisted the app's own default locale, so from a visitor's SECOND load
 * onwards `hasStoredLocaleAtBoot()` reported a choice they had never made and
 * the Khmer preference stood down. Nothing throws when that breaks — the page
 * simply renders in English — which is why it is asserted rather than eyeballed.
 */

// About first visits, so no language is seeded (see fixtures.ts).
test.use({ appLocale: null })

const LANG_SWITCH = /ប្តូរទៅ|Switch to/

const storedLocale = (page: Page) => page.evaluate((key) => localStorage.getItem(key), APP_LOCALE_KEY)

test.describe('partner pages open in Khmer', () => {
  test.beforeEach(async ({ page, stubApi }) => {
    await stubApi(page)
  })

  test('a first-time visitor lands on /partners in Khmer', async ({ page }) => {
    await page.goto('/partners')
    await expect(page.locator('html')).toHaveAttribute('lang', 'km')
  })

  test('having opened the app elsewhere first does not cost them Khmer', async ({ page }) => {
    // The regression: /events boots the app, which used to write its default
    // down as though the visitor had picked it. A reload is what made that
    // stick. Nothing may be stored by a boot on its own.
    await page.goto('/events')
    await expect(page.locator('html')).toHaveAttribute('lang', 'km')
    expect(await storedLocale(page)).toBeNull()

    await page.goto('/partners')
    await expect(page.locator('html')).toHaveAttribute('lang', 'km')
  })

  test('a visitor who switches to English keeps it across partner pages', async ({ page }) => {
    await page.goto('/partners')
    await expect(page.locator('html')).toHaveAttribute('lang', 'km')

    await page.getByRole('button', { name: LANG_SWITCH }).first().click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    expect(await storedLocale(page)).toBe('en')

    // The preference must not flip them back on the way to the catalogue,
    // which declares the same preferredLocale.
    await page.goto('/partners/templates')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })
})

test.describe('the language control is reachable on the first screen', () => {
  test.beforeEach(async ({ page, stubApi }) => {
    await stubApi(page)
  })

  test('without scrolling, on both viewports', async ({ page }) => {
    await page.goto('/partners')
    await expect(page.locator('html')).toHaveAttribute('lang', 'km')

    // No scrolling: the action pill that carries the phone's other copy is
    // deliberately not mounted until the hero CTA has left the top.
    const control = page.getByRole('button', { name: LANG_SWITCH })
    await expect(control).toHaveCount(1)
    await expect(control).toBeInViewport()
  })
})
