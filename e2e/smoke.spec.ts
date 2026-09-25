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

  test('the root path is the landing: create, discover, and sign in to your events', async ({
    page,
    stubApi,
  }) => {
    await stubApi(page)
    await page.goto('/')
    await waitForAppMount(page)

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('button', { name: 'Create Your First Event' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Discover Events' })).toBeVisible()

    // A returning organizer's way in: it signs them in and lands on their
    // events, not on the create wizard.
    await page.getByRole('link', { name: 'Sign In' }).click()
    await expect(page).toHaveURL(/\/signin\?redirect=%2Fevents$/)
  })

  test('serves the SPA shell with the GoEvent title', async ({ page, stubApi }) => {
    await stubApi(page)
    await page.goto('/signin')

    await expect(page).toHaveTitle(/GoEvent/)
  })
})
