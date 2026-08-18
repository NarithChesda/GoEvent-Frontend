import { test as base, expect, type Page } from '@playwright/test'

/**
 * Shared E2E fixtures for GoEvent.
 *
 * Import from here instead of '@playwright/test' so every test gets console
 * error capture and the backend stub for free:
 *
 *   import { test, expect } from './fixtures'
 */

/** Console/page errors that are environmental noise, not app bugs. */
const IGNORED_ERROR_PATTERNS = [
  /favicon/i,
  /net::ERR_INTERNET_DISCONNECTED/i,
  /Failed to load resource.*fonts\.(googleapis|gstatic)\.com/i,
  /ResizeObserver loop/i,
]

const isIgnored = (message: string) => IGNORED_ERROR_PATTERNS.some((re) => re.test(message))

type GoEventFixtures = {
  /** Console errors + uncaught exceptions collected during the test. */
  consoleErrors: string[]
  /**
   * Stubs every call to the Django backend with a 200 + empty paginated body,
   * so tests are not coupled to a running API on 127.0.0.1:8000.
   * Call this FIRST and register more specific `page.route`s after it -
   * Playwright matches the most recently added route first, so a specific route
   * registered before this catch-all never gets a chance to answer.
   */
  stubApi: (page: Page) => Promise<void>
}

/**
 * Origin of the Django backend, matching VITE_API_BASE_URL.
 *
 * The stub is scoped to this ORIGIN, never to a path glob like '**\/api\/**':
 * under Vite dev the app's own modules are served from paths that contain an
 * `api` segment (e.g. /src/services/api/core/ApiClient.ts), so a path glob
 * answers the app's JavaScript with JSON and it never mounts.
 */
const API_ORIGIN = process.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

export const test = base.extend<GoEventFixtures>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error' && !isIgnored(msg.text())) {
        errors.push(msg.text())
      }
    })
    page.on('pageerror', (err) => {
      if (!isIgnored(err.message)) {
        errors.push(err.message)
      }
    })

    await use(errors)
  },

  stubApi: async ({}, use) => {
    await use(async (page: Page) => {
      const patterns = [`${API_ORIGIN}/**`, 'http://localhost:8000/**', 'http://127.0.0.1:8000/**']

      for (const pattern of new Set(patterns)) {
        await page.route(pattern, (route) =>
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
          }),
        )
      }
    })
  },
})

export { expect }

/**
 * Waits for the Vue app to actually mount, not just for the HTML shell.
 * `networkidle` is unreliable here - the showcase keeps long-lived connections.
 */
export async function waitForAppMount(page: Page) {
  await page.waitForSelector('#app > *', { state: 'attached', timeout: 30_000 })
}
