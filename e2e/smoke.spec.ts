import { test, expect, waitForAppMount } from './fixtures'

/**
 * Smoke tests: prove the toolchain and the app boot.
 *
 * These must stay green without a backend running - they are the canary that
 * tells an agent "Playwright itself is fine" before it debugs anything else.
 */

test.describe('app boot', () => {
  test('renders the sign-in page without console errors', async ({
    page,
    consoleErrors,
    stubApi,
  }) => {
    await stubApi(page)
    await page.goto('/signin')
    await waitForAppMount(page)

    /* The page leads with OAuth; the email form is behind this toggle. */
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
    await page.getByRole('button', { name: 'Sign in with email' }).click()

    await expect(page.getByPlaceholder('you@example.com')).toBeVisible()
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible()
    expect(consoleErrors).toEqual([])
  })

  test('redirects the root path to /events', async ({ page, stubApi }) => {
    await stubApi(page)
    await page.goto('/')
    await waitForAppMount(page)

    await expect(page).toHaveURL(/\/events$/)
  })

  test('serves the SPA shell with the GoEvent title', async ({ page, stubApi }) => {
    await stubApi(page)
    await page.goto('/signin')

    await expect(page).toHaveTitle(/GoEvent/)
  })
})
