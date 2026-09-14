import type { BrowserContext, Page } from '@playwright/test'
import { test, expect } from './fixtures'

/**
 * `/partners/apply` — the public partner application.
 *
 * The point of the page is that the account comes second: a shop owner with no
 * GoEvent login fills the form in, and only at Send are they asked to sign in.
 * That means the answers have to cross a full navigation to `/signin` and back,
 * and the page has to finish the submit on its own once there is an account to
 * file it against. None of that is visible in a diff, so it is asserted here.
 *
 * Two things these tests must get right, both of which cost a debugging round
 * when they were wrong:
 *
 * 1. **The profile stub has to be a `page.route`, not a `context.route`.** Page
 *    routes are matched before context routes, so the fixture's catch-all
 *    answers `GET /api/auth/profile/` with an empty paginated body and
 *    `initializeAuth` writes *that* over the seeded user — `is_partner` and the
 *    whole record go with it, and the page correctly concludes it is talking to
 *    nobody in particular.
 * 2. **The locale is pinned to English**, because these assertions read the
 *    form's own copy. The partner routes prefer Khmer for a visitor who has
 *    never chosen (see partner-language.spec.ts, which asserts exactly that),
 *    so without pinning, every `getByText` here is matching the wrong language.
 */

const API = 'http://127.0.0.1:8000'
const ME = `${API}/api/payment/partner-requests/me/`
const CREATE = `${API}/api/payment/partner-requests/`
const PROFILE = `${API}/api/auth/profile/`

const DRAFT_KEY = 'goevent_partner_request_draft'

/** A user the app will accept; `is_partner` decides which screen they get. */
const user = (isPartner = false) => ({
  id: 1,
  email: 'shop@example.com',
  first_name: 'Sok',
  last_name: 'Dara',
  is_partner: isPartner,
  phone_number: '',
  telegram_link: '',
})

/** Pin the UI language — see note 2 in the file header. */
async function useEnglish(page: Page): Promise<void> {
  await page.addInitScript(() => localStorage.setItem('goevent_app_locale', 'en'))
}

/**
 * Seed a session the way `secureStorage` writes one: envelope
 * `{ value, timestamp, version: '3.0' }` under the `goevent_v3_` prefix, `value`
 * always a string (so the user record is double-encoded), and a JWT whose
 * payload merely needs a future `exp` because nothing verifies the signature.
 */
async function seedSession(page: Page, context: BrowserContext, isPartner = false): Promise<void> {
  await context.addInitScript((isP) => {
    const wrap = (value: string) => JSON.stringify({ value, timestamp: Date.now(), version: '3.0' })
    const b64 = (o: unknown) => btoa(JSON.stringify(o)).replace(/=+$/, '')
    const jwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
      user_id: 1,
      exp: Math.floor(Date.now() / 1000) + 3600,
    })}.sig`

    localStorage.setItem('goevent_v3_access_token', wrap(jwt))
    localStorage.setItem('goevent_v3_refresh_token', wrap(jwt))
    localStorage.setItem(
      'goevent_v3_user',
      wrap(
        JSON.stringify({
          id: 1,
          email: 'shop@example.com',
          first_name: 'Sok',
          last_name: 'Dara',
          is_partner: isP,
        }),
      ),
    )
  }, isPartner)

  await page.route(PROFILE, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user(isPartner)),
    }),
  )
}

/** `404` is the ordinary "this account has never applied" answer. */
async function stubNoRequest(page: Page): Promise<void> {
  await page.route(ME, (route) =>
    route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Not found.' }),
    }),
  )
}

/**
 * Put a draft on the device, exactly as the anonymous half of the flow does.
 *
 * `data` is the FORM's shape, not the API payload — the five "about your
 * business" questions are still separate fields here and are folded into
 * `message` only at submit.
 */
async function seedDraft(
  context: BrowserContext,
  data: Record<string, string>,
  pendingSubmit: boolean,
): Promise<void> {
  await context.addInitScript(
    ([key, answers, pending]) => {
      localStorage.setItem(
        `goevent_v3_${key}`,
        JSON.stringify({
          value: JSON.stringify({ data: answers, pendingSubmit: pending, savedAt: Date.now() }),
          timestamp: Date.now(),
          version: '3.0',
        }),
      )
    },
    [DRAFT_KEY, data, pendingSubmit] as const,
  )
}

const readDraft = (page: Page) =>
  page.evaluate((key) => {
    const raw = localStorage.getItem(`goevent_v3_${key}`)
    if (!raw) return null
    const outer = JSON.parse(raw)
    return JSON.parse(typeof outer?.value === 'string' ? outer.value : raw)
  }, DRAFT_KEY)

async function fillForm(page: Page): Promise<void> {
  await page.getByLabel(/Shop or business name/).fill('Dara Wedding House')
  await page.getByLabel(/Contact phone/).fill('012345678')
}

test.describe('applying with no account', () => {
  test.beforeEach(async ({ page, stubApi }) => {
    await stubApi(page)
    await stubNoRequest(page)
    await useEnglish(page)
  })

  test('the form is the first thing on the page, with no sign-in wall', async ({ page }) => {
    await page.goto('/partners/apply')

    await expect(page.getByLabel(/Shop or business name/)).toBeVisible()
    await expect(page.getByRole('button', { name: /Send request/ })).toBeVisible()
    // The promise the page makes before the button is pressed.
    await expect(page.getByText(/asked to sign in or create an account/i)).toBeVisible()
    expect(page.url()).toContain('/partners/apply')
  })

  test('Send keeps the answers and goes for an account', async ({ page }) => {
    await page.goto('/partners/apply')
    await fillForm(page)
    await page.getByRole('button', { name: /Send request/ }).click()

    await page.waitForURL(/\/signin\?redirect=/)
    expect(decodeURIComponent(page.url())).toContain('redirect=/partners/apply')

    const draft = await readDraft(page)
    expect(draft?.data?.business_name).toBe('Dara Wedding House')
    expect(draft?.data?.contact_phone).toBe('012345678')
    // The flag that separates "was typing" from "pressed Send".
    expect(draft?.pendingSubmit).toBe(true)
  })

  test('the questions are saved one by one, not folded early', async ({ page }) => {
    await page.goto('/partners/apply')
    await fillForm(page)
    await page.getByLabel(/Where are you based/).fill('Kampot')
    await page.getByLabel(/What kind of business/).selectOption('wedding_shop')
    await page.getByRole('button', { name: /Send request/ }).click()
    await page.waitForURL(/\/signin\?redirect=/)

    // The fold to `message` happens at submit and is one-way. Saving the composed
    // payload here would bring them back to a blob in the notes box with every
    // question above it blank.
    const draft = await readDraft(page)
    expect(draft?.data?.based_in).toBe('Kampot')
    expect(draft?.data?.business_type).toBe('wedding_shop')
    expect(draft?.data?.message).toBeFalsy()
  })

  test('an empty form is caught before the round trip', async ({ page }) => {
    await page.goto('/partners/apply')
    await page.getByRole('button', { name: /Send request/ }).click()

    await expect(page.getByText(/Tell us what your shop is called/)).toBeVisible()
    expect(page.url()).toContain('/partners/apply')
    expect(await readDraft(page)).toBeNull()
  })
})

test.describe('coming back from sign-in', () => {
  test('the interrupted application finishes itself', async ({ page, context, stubApi }) => {
    await stubApi(page)
    await stubNoRequest(page)
    await useEnglish(page)
    await seedSession(page, context)
    await seedDraft(
      context,
      {
        business_name: 'Dara Wedding House',
        contact_phone: '012345678',
        business_type: 'print_shop',
        based_in: 'Siem Reap',
        invitations_today: 'printed',
        heard_from: 'Sophea',
        message: 'We also do decoration.',
      },
      true,
    )

    let posted: Record<string, unknown> | null = null
    await page.route(CREATE, async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      posted = route.request().postDataJSON()
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'ok',
          request: {
            id: 'r1',
            status: 'pending',
            business_name: 'Dara Wedding House',
            contact_phone: '012345678',
            can_reapply: false,
            created_at: new Date().toISOString(),
          },
        }),
      })
    })

    await page.goto('/partners/apply')

    // No second press: the page sends it on arrival.
    await expect(page.getByText(/Request sent/i)).toBeVisible()
    // The five extra questions arrive as ONE `message` string and as no fields
    // of their own — that fold is the whole point of asking them separately.
    expect(posted).toMatchObject({
      business_name: 'Dara Wedding House',
      contact_phone: '012345678',
      message: [
        'Business: Printing shop',
        'Based in: Siem Reap',
        'Invitations today: Prints cards',
        'Referred by: Sophea',
        'Notes: We also do decoration.',
      ].join('\n'),
    })
    expect(Object.keys(posted ?? {})).not.toContain('based_in')
    expect(Object.keys(posted ?? {})).not.toContain('business_type')
    // And clears the draft, so a reload cannot file it twice.
    expect(await readDraft(page)).toBeNull()
  })

  test('a draft they never sent is restored, not submitted', async ({ page, context, stubApi }) => {
    await stubApi(page)
    await stubNoRequest(page)
    await useEnglish(page)
    await seedSession(page, context)
    await seedDraft(
      context,
      { business_name: 'Half Typed Shop', contact_phone: '011111111', based_in: 'Kampot' },
      false,
    )

    let postCount = 0
    await page.route(CREATE, async (route) => {
      if (route.request().method() === 'POST') postCount += 1
      await route.fallback()
    })

    await page.goto('/partners/apply')

    await expect(page.getByLabel(/Shop or business name/)).toHaveValue('Half Typed Shop')
    // The individual answer, back in its own box — not folded into the notes.
    await expect(page.getByLabel(/Where are you based/)).toHaveValue('Kampot')
    await expect(page.getByLabel(/In your own words/)).toHaveValue('')
    await expect(page.getByRole('button', { name: /Send request/ })).toBeVisible()
    expect(postCount).toBe(0)
  })
})

test.describe('accounts that should not see the form', () => {
  test('an application already under review shows its status', async ({
    page,
    context,
    stubApi,
  }) => {
    await stubApi(page)
    await useEnglish(page)
    await seedSession(page, context)
    await page.route(ME, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'r1',
          status: 'pending',
          business_name: 'Dara Wedding House',
          contact_phone: '012345678',
          can_reapply: false,
          created_at: new Date().toISOString(),
        }),
      }),
    )

    await page.goto('/partners/apply')

    await expect(page.getByText(/Your request is with our team/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Send request/ })).toHaveCount(0)
  })

  test('an approved partner is sent on to their credits', async ({ page, context, stubApi }) => {
    await stubApi(page)
    await stubNoRequest(page)
    await useEnglish(page)
    await seedSession(page, context, true)

    await page.goto('/partners/apply')

    await expect(page.getByText(/already a partner/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /credits/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Send request/ })).toHaveCount(0)
  })

  /**
   * The failure mode this guards is specific: an endpoint that answers 200 with
   * something that is not an application (it is still being built) used to fall
   * through to "we could not open a partner account this time". Being told you
   * were turned down when nobody has looked at anything is the one wrong answer
   * worth writing a test for.
   */
  test('an unrecognisable answer offers the form, never a rejection', async ({
    page,
    context,
    stubApi,
  }) => {
    await stubApi(page)
    await useEnglish(page)
    await seedSession(page, context)
    await page.route(ME, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
      }),
    )

    await page.goto('/partners/apply')

    await expect(page.getByRole('button', { name: /Send request/ })).toBeVisible()
    await expect(page.getByText(/could not open a partner account/i)).toHaveCount(0)
  })
})

test.describe('the partner page leads here', () => {
  test('its CTAs point at the application, not at the auth wall', async ({ page, stubApi }) => {
    await stubApi(page)
    await useEnglish(page)
    await page.goto('/partners')

    // Every "Request partner access" on the sales page is the same ask, and
    // all of them used to land on /credits, which is requiresAuth.
    const links = page.locator('a[href="/partners/apply"]')
    expect(await links.count()).toBeGreaterThan(0)
    expect(await page.locator('a[href="/credits"]').count()).toBe(0)
  })
})
