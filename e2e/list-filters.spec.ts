/// <reference lib="dom" />
// The e2e tsconfig has no DOM lib — Playwright's own runtime has no browser
// globals — but everything inside a `page.evaluate` callback does run in one.

import type { Page } from '@playwright/test'
import { test, expect } from './fixtures'

/**
 * The Events list's filter controls.
 *
 * The two things worth holding still here are the ones a stylesheet cannot
 * state: the segmented control's thumb is measured off the selected option, and
 * the mobile pill's whole job is to say what the current filter is rather than
 * hiding it behind an icon.
 *
 * Auth is seeded straight into `goevent_v3_*` storage rather than driven
 * through the sign-in form — signed out, the Events route renders its landing
 * hero instead of a list with a header.
 */

const b64url = (value: unknown) =>
  Buffer.from(JSON.stringify(value))
    .toString('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

const fakeJwt = () =>
  `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({
    user_id: 'u-1',
    exp: Math.floor(Date.now() / 1000) + 86400,
  })}.sig`

const CATEGORIES = [
  { id: 1, name: 'wedding', color: '#e11d48' },
  { id: 2, name: 'birthday', color: '#f59e0b' },
  { id: 3, name: 'funeral', color: '#64748b' },
]

const signedIn = async (page: Page) => {
  await page.addInitScript(
    ({ token, user }) => {
      const put = (key: string, value: string) =>
        localStorage.setItem(
          `goevent_v3_${key}`,
          JSON.stringify({ value, timestamp: Date.now(), version: '3.0' }),
        )
      put('access_token', token)
      put('refresh_token', token)
      put('user', JSON.stringify(user))
    },
    {
      token: fakeJwt(),
      user: { id: 'u-1', email: 'a@b.com', first_name: 'Test', last_name: 'User' },
    },
  )
  await page.route('**/event-categories/**', (route) =>
    route.fulfill({
      json: { count: CATEGORIES.length, next: null, previous: null, results: CATEGORIES },
    }),
  )
}

/** Resolves once the spring has landed the thumb on the option it marks. */
const thumbSettled = (page: Page) =>
  page.waitForFunction(() => {
    const track = document.querySelector('.lfc-track')
    const selected = track?.querySelector('[aria-current="true"]')
    const thumb = track?.querySelector('.lfc-thumb')
    if (!selected || !thumb) return false
    const a = selected.getBoundingClientRect()
    const b = thumb.getBoundingClientRect()
    return Math.abs(a.x - b.x) < 0.6 && Math.abs(a.width - b.width) < 0.6
  })

test.describe('desktop filter controls', () => {
  test.skip(({ isMobile }) => !!isMobile, 'desktop chrome only')

  test('the thumb travels to the selected option', async ({ page, stubApi }) => {
    await stubApi(page)
    await signedIn(page)
    await page.goto('/events')

    await expect(page.locator('.lfc-track')).toBeVisible()
    await thumbSettled(page)

    const startX = (await page.locator('.lfc-thumb').boundingBox())!.x

    await page.getByRole('button', { name: 'Past', exact: true }).click()
    await thumbSettled(page)

    // It landed on the new option, and that is somewhere else — so it moved
    // rather than being repainted in place.
    const endX = (await page.locator('.lfc-thumb').boundingBox())!.x
    expect(Math.abs(endX - startX)).toBeGreaterThan(10)
  })

  test('the category chip names its current value', async ({ page, stubApi }) => {
    await stubApi(page)
    await signedIn(page)
    await page.goto('/events')

    // The whole point of the chip: the state is legible without opening it.
    const chip = page.getByRole('button', { name: /filter by category/i })
    await expect(chip).toContainText('All Categories')

    await chip.click()
    await page.getByRole('menuitemradio', { name: /wedding/i }).click()

    await expect(chip).toContainText('Wedding')
    await expect(chip).not.toContainText('All Categories')
  })
})

test.describe('mobile filter control', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile chrome only')

  test('one pill states the filter and one sheet holds both axes', async ({ page, stubApi }) => {
    await stubApi(page)
    await signedIn(page)
    await page.goto('/events')

    // Not an anonymous icon: the bar says what you are looking at.
    const pill = page.getByRole('button', { name: /filter events/i })
    await expect(pill).toContainText('Recent')

    await pill.click()
    const sheet = page.getByRole('dialog', { name: /filter events/i })
    await expect(sheet).toBeVisible()

    // Both axes live in this one sheet — the pair of sheets it replaced is the
    // thing that made narrowing by time *and* category two separate trips.
    await sheet.getByRole('menuitemradio', { name: 'Past' }).click()
    await sheet.getByRole('menuitemradio', { name: /wedding/i }).click()

    // Selections apply live, so the sheet is still open and the pill already
    // reads both of them.
    await expect(sheet).toBeVisible()
    await expect(pill).toContainText('Past')
    await expect(pill).toContainText('Wedding')

    await sheet.getByRole('button', { name: 'Done' }).click()
    await expect(sheet).toBeHidden()
  })
})
