import { test, expect, waitForAppMount } from './fixtures'

/**
 * Settings → My Tickets.
 *
 * Covers the wiring that is easy to break and invisible until someone tries to
 * open a ticket: an order card opens the order *over* the list (not instead of
 * it), `?order=` keeps it deep-linkable, and Escape puts everything back.
 *
 * Auth is seeded straight into `goevent_v3_*` storage rather than driven
 * through the sign-in form — the form needs a live backend, and everything the
 * app checks on boot is a non-expired access token plus a stored user.
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

const ORDER = (over: Record<string, unknown>) => ({
  confirmation_code: 'TIX-FDAZ4BTC',
  event_title: 'GoEvent Project 1st Year Aniversary',
  buyer_email: 'buyer@example.com',
  total: '30.00',
  currency: 'USD',
  status: 'paid',
  ticket_count: 1,
  is_comp: false,
  created_at: '2026-05-06T10:00:00Z',
  confirmed_at: null,
  ...over,
})

const ORDERS = [
  ORDER({ confirmation_code: 'TIX-FDAZ4BTC', status: 'paid', ticket_count: 1 }),
  ORDER({ confirmation_code: 'TIX-SWDNR7SY', status: 'pending', ticket_count: 0 }),
  ORDER({ confirmation_code: 'TIX-ZDWPFAX7', status: 'cancelled', ticket_count: 0 }),
]

const DETAIL = {
  ...ORDERS[0],
  event: { id: 'e-1', title: ORDERS[0].event_title, slug: 'anniversary' },
  event_id: 'e-1',
  buyer: { id: 'u-1', email: 'buyer@example.com', first_name: 'Test', last_name: 'Buyer' },
  buyer_name: 'Test Buyer',
  buyer_phone: '',
  items: [
    {
      ticket_type: { id: 1, name: 'General Admission' },
      quantity: 1,
      unit_price: '30.00',
      subtotal: '30.00',
    },
  ],
  subtotal: '30.00',
  promo_code: null,
  promo_discount: '0.00',
  payment_method: null,
  payment_method_name: 'ABA Bank',
  payment_proof: null,
  transaction_reference: '',
  buyer_notes: '',
  admin_notes: '',
  confirmed_by: null,
  proof_submitted_at: null,
  refund_window_ends_at: null,
  is_refundable: false,
  tickets: [
    {
      id: 't-1',
      ticket_type: { id: 1, name: 'General Admission' },
      attendee_name: 'Test Buyer',
      attendee_email: 'buyer@example.com',
      check_in_code: 'K4M2XQ',
      qr_code: 'goevent-ticket-token-1',
      status: 'valid',
    },
  ],
  answers: [],
  refund: null,
  updated_at: '2026-05-06T10:00:00Z',
}

test.describe('settings → my tickets', () => {
  test.beforeEach(async ({ page, stubApi }) => {
    // Catch-all first: Playwright matches the most recently added route first.
    await stubApi(page)

    await page.route(`${API_ORIGIN}/api/ticket-orders/**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: ORDERS.length, next: null, previous: null, results: ORDERS }),
      }),
    )

    await page.route(/\/api\/ticket-orders\/TIX-[A-Z0-9]+\/?$/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(DETAIL),
      }),
    )

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
          email: 'buyer@example.com',
          first_name: 'Test',
          last_name: 'Buyer',
          is_partner: false,
        },
      },
    )
  })

  test('lists every order with its own state', async ({ page, consoleErrors }) => {
    await page.goto('/settings?tab=tickets')
    await waitForAppMount(page)

    await expect(page.getByText('TIX-FDAZ4BTC')).toBeVisible()
    await expect(page.getByText('TIX-SWDNR7SY')).toBeVisible()
    await expect(page.getByText('TIX-ZDWPFAX7')).toBeVisible()

    // The state each order is in drives its one call to action.
    await expect(page.getByText('Complete payment')).toBeVisible()
    await expect(page.getByText('View tickets')).toBeVisible()

    expect(consoleErrors).toEqual([])
  })

  test('an order opens over the list and Escape closes it', async ({ page }) => {
    await page.goto('/settings?tab=tickets')
    await waitForAppMount(page)

    await page.getByText('TIX-FDAZ4BTC').click()

    // The ticket itself is in the modal...
    await expect(page.getByText('K4M2XQ')).toBeVisible()
    // ...and the list is still behind it rather than replaced by it.
    await expect(page.getByText('TIX-ZDWPFAX7')).toBeVisible()
    expect(new URL(page.url()).searchParams.get('order')).toBe('TIX-FDAZ4BTC')

    await page.keyboard.press('Escape')
    await expect(page.getByText('K4M2XQ')).toBeHidden()
    expect(new URL(page.url()).searchParams.get('order')).toBeNull()
  })

  test('the list never widens the page', async ({ page }) => {
    // An order card's own content (code, status pill, price) has a wide
    // min-content floor, so the list grid has to be declared with tracks that
    // can go below it. Without that the page itself scrolls sideways.
    for (const width of [360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 })
      await page.goto('/settings?tab=tickets')
      await waitForAppMount(page)
      await expect(page.getByText('TIX-FDAZ4BTC')).toBeVisible()

      const { clientWidth, scrollWidth } = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }))
      expect(scrollWidth, `horizontal overflow at ${width}px`).toBe(clientWidth)
    }
  })

  test('an order is deep-linkable', async ({ page }) => {
    await page.goto('/settings?tab=tickets&order=TIX-FDAZ4BTC')
    await waitForAppMount(page)

    await expect(page.getByText('K4M2XQ')).toBeVisible()
  })

  test('filtering by status reloads from the server', async ({ page }) => {
    const requested: string[] = []
    page.on('request', (r) => {
      if (r.url().includes('/api/ticket-orders/')) requested.push(r.url())
    })

    await page.goto('/settings?tab=tickets')
    await waitForAppMount(page)
    await expect(page.getByText('TIX-FDAZ4BTC')).toBeVisible()

    await page.getByRole('button', { name: /Filter by status/i }).click()
    // `exact` matters: an order card's own aria-label carries its status too.
    await page.getByRole('button', { name: 'Awaiting payment', exact: true }).click()

    await expect.poll(() => requested.some((u) => u.includes('status=pending'))).toBe(true)
  })
})
