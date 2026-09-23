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
  /**
   * The app language each test starts in, written to storage as though the
   * visitor had chosen it. `'en'` by default: the app opens in Khmer for anyone
   * who has not chosen (DEFAULT_LOCALE), and the suite's assertions are written
   * against the English strings. A test about first-visit language behaviour
   * opts out with `test.use({ appLocale: null })` and gets clean storage.
   */
  appLocale: 'en' | 'kh' | null
  /** Applies `appLocale`. Automatic — nothing asks for it by name. */
  seedAppLocale: void
}

/** The language store's persistence key (APP_LOCALE_STORAGE_KEY). */
export const APP_LOCALE_KEY = 'goevent_app_locale_v2'

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
  appLocale: ['en', { option: true }],

  seedAppLocale: [
    async ({ page, appLocale }, use) => {
      if (appLocale) {
        // Only when nothing is stored yet, so a test that switches language
        // and reloads keeps what it switched to.
        await page.addInitScript(
          ({ key, value }) => {
            if (!localStorage.getItem(key)) localStorage.setItem(key, value)
          },
          { key: APP_LOCALE_KEY, value: appLocale },
        )
      }
      await use()
    },
    { auto: true },
  ],

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
