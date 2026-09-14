import type { Page } from '@playwright/test'
import { test, expect } from './fixtures'

/**
 * /partners and /partners/templates open in Khmer, and stay reachable in both
 * languages on a phone.
 *
 * Both are links a salesperson sends to a Cambodian shop owner who has never
 * opened the app, so the route declares `preferredLocale: 'kh'` (router meta)
 * and the language store applies it to anyone who has not chosen for
 * themselves.
 *
 * The regression this file exists for is silent and was live: the store's boot
 * sync persisted the app's own default locale, so from a visitor's SECOND load
 * onwards `hasStoredLocaleAtBoot()` reported a choice they had never made and
 * the Khmer preference stood down. Nothing throws when that breaks — the page
 * simply renders in English — which is why it is asserted rather than eyeballed.
 */

const LANG_SWITCH = /ប្តូរទៅ|Switch to/

/** The store's persistence key (APP_LOCALE_STORAGE_KEY). */
const LOCALE_KEY = 'goevent_app_locale'

const storedLocale = (page: Page) => page.evaluate((key) => localStorage.getItem(key), LOCALE_KEY)

test.describe('partner pages open in Khmer', () => {
  test.beforeEach(async ({ page, stubApi }) => {
    await stubApi(page)
  })

  test('a first-time visitor lands on /partners in Khmer', async ({ page }) => {
    await page.goto('/partners')
    await expect(page.locator('html')).toHaveAttribute('lang', 'km')
  })

  test('having opened the app elsewhere first does not cost them Khmer', async ({ page }) => {
    // The regression: /events boots the app, which used to write 'en' down as
    // though the visitor had picked it. A reload is what made that stick.
    await page.goto('/events')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
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
