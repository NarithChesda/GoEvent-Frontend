import { test, expect, waitForAppMount } from './fixtures'

/**
 * Event manage → Budget & expenses.
 *
 * The tab's whole point is that one screen answers "what is left", "where is it
 * going" and "what have I actually spent" without opening anything. These cover
 * the parts that are easy to break silently: the hero's arithmetic, a category
 * that has been overspent, and spending in a category with no budget at all —
 * which is counted in the hero and so must have a row of its own to explain it.
 *
 * Auth is seeded into `goevent_v3_*` storage rather than driven through the
 * sign-in form, which needs a live backend.
 */

const API_ORIGIN = process.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

const b64url = (o: unknown) =>
  Buffer.from(JSON.stringify(o)).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')

const fakeJwt = () =>
  `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({
    user_id: 'u-1',
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  })}.sig`

const USER = {
  id: 'u-1',
  email: 'organizer@example.com',
  username: 'organizer',
  first_name: 'Test',
  last_name: 'Organizer',
  is_partner: false,
}

const EVENT = {
  id: 'e-1',
  title: 'Sophea & Dara',
  description: '',
  short_description: '',
  start_date: '2026-12-12T10:00:00Z',
  end_date: '2026-12-12T18:00:00Z',
  location: 'Phnom Penh',
  virtual_link: null,
  is_virtual: false,
  privacy: 'private',
  status: 'published',
  organizer: 'u-1',
  category: 1,
  category_name: 'Wedding',
  category_details: { id: 1, name: 'Wedding', description: '', color: '#ec4899', icon: 'heart' },
  can_edit: true,
  max_attendees: null,
  banner_image: null,
}

const category = (id: number, name: string, icon: string, color: string) => ({
  id,
  name,
  icon,
  color,
  is_active: true,
  created_by: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
})

const CATEGORIES = [
  category(1, 'Venue', 'fa-building', '#8b5cf6'),
  category(2, 'Catering', 'fa-utensils', '#f59e0b'),
  category(3, 'Photography', 'fa-camera', '#1e90ff'),
  category(4, 'Decor', 'fa-palette', '#ec4899'),
  category(5, 'Music', 'fa-music', '#2ecc71'),
  category(6, 'Transport', 'fa-car', '#64748b'),
]

const budget = (id: number, cat: number, planned: string, spent: string) => {
  const info = CATEGORIES.find((c) => c.id === cat)!
  const plannedNum = parseFloat(planned)
  const spentNum = parseFloat(spent)
  return {
    id,
    event: 'e-1',
    category: cat,
    category_info: { id: info.id, name: info.name, icon: info.icon, color: info.color, is_active: true },
    budgeted_amount: planned,
    currency: 'USD' as const,
    spent_amount: spent,
    // The backend clamps this to 0 once overspent — the UI must not trust it.
    remaining_amount: Math.max(plannedNum - spentNum, 0).toFixed(2),
    percentage_used: (spentNum / plannedNum) * 100,
    is_over_budget: spentNum > plannedNum,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
}

// Planned 11,500 · spent 9,000 in budgeted categories.
const BUDGETS = [
  budget(1, 1, '5000.00', '4200.00'),
  budget(2, 2, '3000.00', '3400.00'), // deliberately overspent
  budget(3, 3, '1500.00', '600.00'),
  budget(4, 4, '1200.00', '0.00'),
  budget(5, 5, '800.00', '800.00'),
]

const expense = (id: number, cat: number, description: string, amount: string) => {
  const info = CATEGORIES.find((c) => c.id === cat)!
  return {
    id,
    event: 'e-1',
    category: cat,
    category_info: { id: info.id, name: info.name, icon: info.icon, color: info.color },
    description,
    amount,
    currency: 'USD' as const,
    date: '2026-03-04',
    payment_method: 'cash' as const,
    is_public: false,
    added_by: 1,
    created_at: '2026-03-04T00:00:00Z',
    updated_at: '2026-03-04T00:00:00Z',
  }
}

// Each category's expenses sum to its `spent_amount`; Transport has 250 spent
// with no budget at all, so planned stays 11,500 and spent becomes 9,250.
const EXPENSES = [
  expense(1, 1, 'Ballroom deposit', '4200.00'),
  expense(2, 2, 'Dinner service', '3400.00'),
  expense(3, 3, 'Engagement shoot', '600.00'),
  expense(4, 5, 'Live band deposit', '800.00'),
  expense(5, 6, 'Guest shuttle', '250.00'),
]

const json = (body: unknown) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(body),
})

const paginated = (results: unknown[]) => json({ count: results.length, next: null, previous: null, results })

test.describe('event manage → budget & expenses', () => {
  test.beforeEach(async ({ page, stubApi }) => {
    // Catch-all first: Playwright matches the most recently added route first.
    await stubApi(page)

    await page.route(`${API_ORIGIN}/api/auth/profile/`, (route) => route.fulfill(json(USER)))
    await page.route(`${API_ORIGIN}/api/events/e-1/`, (route) => route.fulfill(json(EVENT)))
    await page.route(`${API_ORIGIN}/api/events/expense-categories/**`, (route) =>
      route.fulfill(paginated(CATEGORIES)),
    )
    await page.route(`${API_ORIGIN}/api/events/e-1/expense-budgets/**`, (route) =>
      route.fulfill(paginated(BUDGETS)),
    )
    await page.route(`${API_ORIGIN}/api/events/e-1/expenses/**`, (route) => route.fulfill(paginated(EXPENSES)))

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
      { token: fakeJwt(), user: USER },
    )
  })

  test('the hero states what is left, of what, and what was spent', async ({ page, consoleErrors }) => {
    await page.goto('/events/e-1/manage?tab=expenses')
    await waitForAppMount(page)

    // 11,500 planned − 9,250 spent (9,000 budgeted + 250 unbudgeted).
    await expect(page.getByText('$2,250', { exact: true })).toBeVisible()
    await expect(page.getByText('$9,250 spent of $11,500 planned')).toBeVisible()
    await expect(page.getByText('left to spend')).toBeVisible()

    expect(consoleErrors).toEqual([])
  })

  test('spending with no budget behind it is named, not silently folded in', async ({ page }) => {
    await page.goto('/events/e-1/manage?tab=expenses')
    await waitForAppMount(page)

    // The hero counts it...
    await expect(page.getByText('$250 spent in categories with no budget')).toBeVisible()
    // ...so the list has to account for it.
    await expect(page.getByText('Transport')).toBeVisible()
    await expect(page.getByText('No budget set')).toBeVisible()
  })

  test('an overspent category reads as over, not as complete', async ({ page }) => {
    await page.goto('/events/e-1/manage?tab=expenses')
    await waitForAppMount(page)

    // 3,400 spent against 3,000 planned. `remaining_amount` arrives clamped to
    // 0, so anything trusting it would render "$0.00 left" here.
    await expect(page.getByText('$400 over')).toBeVisible()
  })

  test('categories are ordered by what they cost, matching the allocation bar', async ({ page }) => {
    await page.goto('/events/e-1/manage?tab=expenses')
    await waitForAppMount(page)

    const names = await page.locator('h4.truncate').allTextContents()
    expect(names.slice(0, 5)).toEqual(['Venue', 'Catering', 'Photography', 'Decor', 'Music'])
  })

  test('a category opens to its own expenses in place', async ({ page }) => {
    await page.goto('/events/e-1/manage?tab=expenses')
    await waitForAppMount(page)

    await expect(page.getByText('Ballroom deposit')).toBeHidden()
    await page.getByText('Venue').first().click()
    await expect(page.getByText('Ballroom deposit')).toBeVisible()
  })

  /**
   * A capture, not a check — it exists so the sheet can be looked at at both
   * ends of the responsive range while the design is being worked on. Run it
   * alone with `-g "looks like"`; the images land in `test-results/`.
   */
  /* eslint-disable playwright/expect-expect, playwright/no-wait-for-timeout */
  test('looks like one sheet at phone and desktop width', async ({ page }) => {
    for (const [name, width, height] of [
      ['phone', 390, 900],
      ['desktop', 1280, 1000],
    ] as const) {
      await page.setViewportSize({ width, height })
      await page.goto('/events/e-1/manage?tab=expenses')
      await waitForAppMount(page)
      await page.waitForTimeout(900)
      await page.screenshot({ path: `test-results/budget-${name}.png`, fullPage: true })

      await page.getByText('Venue').first().click()
      await page.waitForTimeout(700)
      await page.screenshot({ path: `test-results/budget-${name}-open.png`, fullPage: true })
    }
  })
})
