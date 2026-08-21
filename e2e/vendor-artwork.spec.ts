import { test, expect, waitForAppMount } from './fixtures'

/**
 * Settings → Vendor, the two artwork rows.
 *
 * The thing worth guarding is the shape of the write, not the pixels: removing
 * a logo or a cover is a one-field multipart PATCH whose value is the empty
 * string, which is how this backend clears a nullable ImageField. A payload
 * that omitted the field, or sent the word "null", would look successful in the
 * UI and leave the image exactly where it was.
 *
 * Auth is seeded straight into `goevent_v3_*` storage rather than driven
 * through the sign-in form - see the note in tickets-tab.spec.ts.
 */

const API_ORIGIN = process.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

const b64url = (o: unknown) =>
  Buffer.from(JSON.stringify(o))
    .toString('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

const fakeJwt = () =>
  `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({
    user_id: 'u-1',
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  })}.sig`

const PROFILE = {
  id: 'v-1',
  user: 'u-1',
  user_email: 'vendor@example.com',
  business_name: 'Elite Photography',
  slug: 'elite-photography',
  description: 'Capturing your special moments',
  short_tagline: 'Weddings and portraits',
  logo: '/media/vendor_logos/logo.webp',
  cover_image: '/media/vendor_covers/cover.webp',
  phone: '',
  email: '',
  website: '',
  telegram_username: '',
  telegram_link: null,
  address: '',
  city: 'Phnom Penh',
  country: 'Cambodia',
  verification_status: 'verified',
  verified_at: '2026-01-01T00:00:00Z',
  is_featured: false,
  featured_until: null,
  listings_count: 3,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

/** A 1x1 transparent PNG, so the artwork frames render the normal way. */
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)

test.describe('settings → vendor artwork', () => {
  /** Multipart bodies of every PATCH the page sent, newest last. */
  let patchBodies: string[]

  test.beforeEach(async ({ page, stubApi }) => {
    patchBodies = []

    // Catch-all first: Playwright matches the most recently added route first.
    await stubApi(page)

    await page.route(`${API_ORIGIN}/media/**`, (route) =>
      route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL }),
    )

    await page.route(`${API_ORIGIN}/api/services/vendor-profile/me/**`, (route) => {
      const request = route.request()

      if (request.method() === 'PATCH') {
        patchBodies.push(request.postData() ?? '')
        // What the backend answers a cleared field with: the path is gone.
        const cleared = patchBodies[patchBodies.length - 1].includes('name="logo"')
          ? { logo: null }
          : { cover_image: null }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...PROFILE, ...cleared }),
        })
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(PROFILE),
      })
    })

    await page.addInitScript(
      ({ token, user }) => {
        const put = (k: string, v: string) =>
          localStorage.setItem(
            `goevent_v3_${k}`,
            JSON.stringify({ value: v, timestamp: Date.now(), version: '3.0' }),
          )
        put('access_token', token)
        put('refresh_token', token)
        put('user', JSON.stringify(user))
      },
      {
        token: fakeJwt(),
        user: {
          id: 'u-1',
          email: 'vendor@example.com',
          first_name: 'Test',
          last_name: 'Vendor',
          is_partner: false,
        },
      },
    )
  })

  test('removing the logo clears the field and the frame', async ({ page, consoleErrors }) => {
    await page.goto('/settings?tab=vendor')
    await waitForAppMount(page)

    const remove = page.getByRole('button', { name: 'Remove logo' })
    await expect(remove).toBeVisible()
    await remove.click()

    // Nothing is written until the question is answered.
    await expect(page.getByText('Remove logo?')).toBeVisible()
    expect(patchBodies).toEqual([])

    await page.getByRole('button', { name: 'Delete', exact: true }).click()

    await expect.poll(() => patchBodies.length).toBe(1)
    expect(patchBodies[0]).toContain('name="logo"')
    // The field is present and empty - not omitted, and not the string "null".
    expect(patchBodies[0]).toMatch(/name="logo"\r?\n\r?\n\r?\n/)
    expect(patchBodies[0]).not.toContain('cover_image')

    // The row falls back to the empty frame, and offers upload rather than remove.
    await expect(page.getByRole('button', { name: 'Remove logo' })).toBeHidden()
    expect(consoleErrors).toEqual([])
  })

  test('removing the cover clears its own field only', async ({ page }) => {
    await page.goto('/settings?tab=vendor')
    await waitForAppMount(page)

    await page.getByRole('button', { name: 'Remove cover image' }).click()
    await expect(page.getByText('Remove cover image?')).toBeVisible()
    await page.getByRole('button', { name: 'Delete', exact: true }).click()

    await expect.poll(() => patchBodies.length).toBe(1)
    expect(patchBodies[0]).toContain('name="cover_image"')
    expect(patchBodies[0]).not.toContain('name="logo"')

    await expect(page.getByRole('button', { name: 'Remove cover image' })).toBeHidden()
  })

  test('cancelling the confirm writes nothing', async ({ page }) => {
    await page.goto('/settings?tab=vendor')
    await waitForAppMount(page)

    await page.getByRole('button', { name: 'Remove logo' }).click()
    await page.getByRole('button', { name: 'Cancel' }).click()

    await expect(page.getByText('Remove logo?')).toBeHidden()
    expect(patchBodies).toEqual([])
    await expect(page.getByRole('button', { name: 'Remove logo' })).toBeVisible()
  })

  test('a profile with no artwork offers nothing to remove', async ({ page }) => {
    await page.route(`${API_ORIGIN}/api/services/vendor-profile/me/**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...PROFILE, logo: null, cover_image: null }),
      }),
    )

    await page.goto('/settings?tab=vendor')
    await waitForAppMount(page)

    await expect(page.getByText('Elite Photography')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Remove logo' })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Remove cover image' })).toBeHidden()
  })
})
