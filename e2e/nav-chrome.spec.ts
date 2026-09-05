/// <reference lib="dom" />
// The e2e tsconfig has no DOM lib — Playwright's own runtime has no browser
// globals — but everything inside a `page.evaluate` callback does run in one.

import type { Page } from '@playwright/test'
import { test, expect } from './fixtures'

/**
 * The top bar's material and its selection marker.
 *
 * Both are geometry the stylesheet cannot state — the marker is measured off
 * whichever tab carries `aria-current="page"`, and the material is driven by a
 * custom property written per frame from the scroll — so both are only really
 * verifiable in a browser.
 */

const NAV = 'header[aria-label="Main navigation"]'

/**
 * Resolves once the spring has landed the marker on the tab it marks, rather
 * than after a duration guessed to outlast it. The spring has no fixed
 * duration — its settle time emerges from the parameters — so there is no
 * number here that would be correct.
 */
const markerSettled = (page: Page, rowSelector: string, markerSelector: string) =>
  page.waitForFunction(
    ([row, marker]) => {
      const container = document.querySelector(row)
      const tab = container?.querySelector('[aria-current="page"]')
      const el = container?.querySelector(marker)
      if (!tab || !el) return false
      const a = tab.getBoundingClientRect()
      const b = el.getBoundingClientRect()
      return Math.abs(a.x - b.x) < 0.6 && Math.abs(a.width - b.width) < 0.6
    },
    [rowSelector, markerSelector] as const,
  )

const navEdge = (page: Page) =>
  page.evaluate((sel) => {
    const header = document.querySelector(sel)
    return header ? parseFloat(getComputedStyle(header).getPropertyValue('--nav-edge')) : NaN
  }, NAV)

test.describe('desktop top bar', () => {
  test.skip(({ isMobile }) => !!isMobile, 'desktop chrome only')

  test('the selection capsule covers the active nav link', async ({ page, stubApi }) => {
    await stubApi(page)
    await page.goto('/explore')

    const nav = page.locator(`${NAV} nav`)
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1)
    await expect(nav.locator('.nav-capsule')).toBeVisible()

    await markerSettled(page, `${NAV} nav`, '.nav-capsule')
  })

  test('the capsule travels to the tab that was navigated to', async ({ page, stubApi }) => {
    await stubApi(page)
    await page.goto('/explore')
    await markerSettled(page, `${NAV} nav`, '.nav-capsule')

    const nav = page.locator(`${NAV} nav`)
    const startX = (await nav.locator('.nav-capsule').boundingBox())!.x

    await nav.getByRole('link', { name: /services/i }).click()
    await expect(page).toHaveURL(/\/services/)

    // It lands on the new tab...
    await markerSettled(page, `${NAV} nav`, '.nav-capsule')
    // ...and that is somewhere else, so it actually travelled.
    const endX = (await nav.locator('.nav-capsule').boundingBox())!.x
    expect(Math.abs(endX - startX)).toBeGreaterThan(10)
  })

  test('the material tracks the scroll instead of flipping at the first pixel', async ({
    page,
    stubApi,
  }) => {
    await stubApi(page)
    await page.goto('/explore')
    await expect(page.locator(NAV)).toBeVisible()

    // With the backend stubbed empty the list page is exactly one viewport tall,
    // so there is nothing to scroll. The bar's material is a function of scroll
    // position, so the page has to have some.
    await page.evaluate(() => {
      const filler = document.createElement('div')
      filler.style.height = '2000px'
      document.body.appendChild(filler)
    })

    expect(await navEdge(page)).toBe(0)

    // Part-way through the 56px ramp the bar is part-way materialised — the
    // whole point of the progress, and the thing a boolean could not express.
    await page.evaluate(() => window.scrollTo(0, 28))
    await page.waitForFunction(
      (sel) => parseFloat(getComputedStyle(document.querySelector(sel)!).getPropertyValue('--nav-edge')) > 0,
      NAV,
    )
    const mid = await navEdge(page)
    expect(mid).toBeGreaterThan(0.2)
    expect(mid).toBeLessThan(0.8)

    await page.evaluate(() => window.scrollTo(0, 400))
    await page.waitForFunction(
      (sel) =>
        parseFloat(getComputedStyle(document.querySelector(sel)!).getPropertyValue('--nav-edge')) === 1,
      NAV,
    )
  })
})

test.describe('mobile tab bar', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile chrome only')

  test('the gradient pill covers the active tab', async ({ page, stubApi }) => {
    await stubApi(page)
    await page.goto('/explore')

    const bar = page.locator('[aria-label="Mobile navigation"]')
    await expect(bar.locator('[aria-current="page"]')).toHaveCount(1)

    await markerSettled(page, '[aria-label="Mobile navigation"]', 'span.absolute.inset-y-0')
  })
})
