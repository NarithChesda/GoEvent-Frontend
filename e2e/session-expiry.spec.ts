import { test, expect, type Page, type BrowserContext } from './fixtures'

/**
 * The reported bug, end to end: sign in with Telegram on a phone, manage an
 * event, pay, then reload to see the confirmation — and land on the sign-in
 * page instead.
 *
 * The trigger is not Telegram. It is the clock. The backend issues a 60-minute
 * access token against a 24-hour refresh token, so any reload more than an hour
 * after the last refresh arrives with a dead access token and a perfectly good
 * refresh token. The gates used to ask `isAuthenticated()`, which only ever
 * looks at the access token, and threw away 23 hours of session. Telegram is
 * simply where it bites: that flow leaves the browser for the Telegram app, so
 * the sit-and-come-back gap is built into it.
 *
 * Auth is seeded straight into `goevent_v3_*` storage rather than driven
 * through a login form — see the note in partner-apply.spec.ts.
 */

const API_ORIGIN = process.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'
const PROFILE = `${API_ORIGIN}/api/auth/profile/`
const REFRESH = `${API_ORIGIN}/api/auth/token/refresh/`

const USER = {
  id: 1,
  email: 'telegram_123456789@telegram.user',
  username: 'dara',
  first_name: 'Dara',
  last_name: 'Sok',
  date_joined: '2026-01-01T00:00:00Z',
  is_active: true,
}

/**
 * Seed a session with tokens of independently chosen ages, the way
 * `secureStorage` writes one: envelope `{ value, timestamp, version: '3.0' }`
 * under the `goevent_v3_` prefix, `value` always a string (so the user record
 * is double-encoded), and a JWT whose payload merely needs an `exp` because
 * nothing client-side verifies the signature.
 */
async function seedSession(
  context: BrowserContext,
  accessAgeSeconds: number,
  refreshAgeSeconds: number,
): Promise<void> {
  await context.addInitScript(
    ([accessOffset, refreshOffset, user]) => {
      const wrap = (value: string) =>
        JSON.stringify({ value, timestamp: Date.now(), version: '3.0' })
      const b64 = (o: unknown) => btoa(JSON.stringify(o)).replace(/=+$/, '')
      const jwt = (expOffset: number) =>
        `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
          user_id: 1,
          exp: Math.floor(Date.now() / 1000) + (expOffset as number),
        })}.sig`

      localStorage.setItem('goevent_v3_access_token', wrap(jwt(accessOffset as number)))
      localStorage.setItem('goevent_v3_refresh_token', wrap(jwt(refreshOffset as number)))
      localStorage.setItem('goevent_v3_user', wrap(JSON.stringify(user)))
      localStorage.setItem('goevent_app_locale_v2', 'en')
    },
    [accessAgeSeconds, refreshAgeSeconds, USER] as const,
  )
}

/** The refresh endpoint, answering the way SimpleJWT does with rotation on. */
async function stubRefresh(page: Page, status: 200 | 401 | 503): Promise<string[]> {
  const calls: string[] = []

  await page.route(REFRESH, async (route) => {
    calls.push(route.request().url())

    if (status !== 200) {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Token is invalid', code: 'token_not_valid' }),
      })
      return
    }

    const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url')
    const jwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
      user_id: 1,
      exp: Math.floor(Date.now() / 1000) + 3600,
    })}.sig`

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access: jwt, refresh: jwt }),
    })
  })

  return calls
}

async function stubProfile(page: Page): Promise<void> {
  await page.route(PROFILE, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(USER) }),
  )
}

/**
 * Every assertion below compares the **pathname**, never the whole URL.
 *
 * A guard redirect is `/signin?redirect=%2Fsettings`, which carries the very
 * path it just refused — so `toHaveURL(/settings/)` passes whether the user
 * reached Settings or got bounced to sign-in, and the test proves nothing. An
 * earlier draft of this file did exactly that and passed against the unfixed
 * code.
 */

/**
 * The route from the report — `requiresAuth`, so it passes through the guard's
 * basic `isAuthenticated` gate, and deliberately *not* one of the four
 * `sensitiveRoutes`, so this covers that gate on its own.
 */
const EVENT_ID = '11111111-1111-1111-1111-111111111111'
const MANAGE = `/events/${EVENT_ID}/manage`

/** A `sensitiveRoute`, which additionally runs ensureValidToken() in the guard. */
const SETTINGS = '/settings'

test.describe('session survives a reload', () => {
  test('an hour-old access token does not sign the user out', async ({
    page,
    context,
    stubApi,
  }) => {
    await stubApi(page)
    // The state the reporter was in: access token an hour dead, refresh token
    // with 23 hours left on it.
    await seedSession(context, -60, 23 * 3600)
    await stubRefresh(page, 200)
    await stubProfile(page)

    await page.goto(MANAGE)

    // EventManageView canonicalises the URL to the event itself.
    await expect.poll(() => new URL(page.url()).pathname).toBe(`/events/${EVENT_ID}`)
  })

  test('an hour-old access token survives a sensitive route too', async ({
    page,
    context,
    stubApi,
  }) => {
    await stubApi(page)
    await seedSession(context, -60, 23 * 3600)
    await stubRefresh(page, 200)
    await stubProfile(page)

    await page.goto(SETTINGS)

    await expect.poll(() => new URL(page.url()).pathname).toBe('/settings')
  })

  test('a refresh that fails on a flaky connection keeps the session', async ({
    page,
    context,
    stubApi,
  }) => {
    await stubApi(page)
    await seedSession(context, -60, 23 * 3600)
    // A gateway error, not a rejection — exactly what a phone on a bad signal
    // gets, and what used to clear the tokens and sign the user out.
    await stubRefresh(page, 503)
    await stubProfile(page)

    await page.goto(SETTINGS)

    await expect.poll(() => new URL(page.url()).pathname).toBe('/settings')

    const refreshToken = await page.evaluate(() =>
      localStorage.getItem('goevent_v3_refresh_token'),
    )
    expect(refreshToken).not.toBeNull()
  })

  test('an expired refresh token does sign the user out, keeping the way back', async ({
    page,
    context,
    stubApi,
  }) => {
    await stubApi(page)
    // Past the 24-hour refresh lifetime: nothing left to recover with, and the
    // redirect must carry the page the user was on.
    await seedSession(context, -3600, -60)

    await page.goto(MANAGE)

    await expect.poll(() => new URL(page.url()).pathname).toBe('/signin')
    // The way back must survive the bounce.
    expect(new URL(page.url()).searchParams.get('redirect')).toBe(MANAGE)
  })
})
