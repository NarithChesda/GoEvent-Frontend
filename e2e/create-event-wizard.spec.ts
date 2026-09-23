import { test, expect, waitForAppMount } from './fixtures'
import type { Page, Request } from '@playwright/test'

/**
 * Creating an event, from the landing page to the event's own studio.
 *
 * The flow is one line on purpose: a visitor answers the wizard without being
 * asked who they are, signs in only when they press Create, and lands on the
 * new event — on its template browser when the category has designs, on its
 * Showcase tab when it doesn't. The seams worth pinning are the ones that
 * cross a route: the draft surviving the trip to sign-in, sign-in saying so,
 * and the return trip creating the event without a second press.
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

const category = (id: number, name: string) => ({
  id,
  name,
  color: '#3498db',
  icon: '',
  description: '',
  is_active: true,
})

const CATEGORIES = [
  category(10, 'Arts & Culture'),
  category(8, 'Birthday'),
  category(20, 'Housewarming Party'),
  category(9, 'Music'),
  category(1, 'Wedding'),
]

// Wedding and Birthday have designs; Housewarming has a studio but none.
const PLANS = [
  { id: 1, name: 'Basic Plus', category: { id: 1, name: 'Wedding' } },
  { id: 4, name: 'Basic Plus Birthday', category: { id: 8, name: 'Birthday' } },
  { id: 9, name: 'Housewarming', category: { id: 20, name: 'Housewarming Party' } },
]

const template = (id: number, plan: number) => ({
  id,
  name: `Design ${id}`,
  template_type: 'system',
  status: 'approved',
  package_plan: plan,
  preview_image: null,
})

const TEMPLATES = [template(1, 1), template(2, 1), template(3, 1), template(4, 4)]

const createdEvent = (id: string, categoryId: number, categoryName: string) => ({
  id,
  title: "Dara & Sophea's Wedding",
  description: '',
  short_description: '',
  start_date: '2026-12-12T10:00:00Z',
  end_date: '2026-12-12T18:00:00Z',
  location: '',
  virtual_link: '',
  is_virtual: false,
  privacy: 'private',
  status: 'draft',
  organizer: 'u-1',
  category: categoryId,
  category_name: categoryName,
  category_details: { id: categoryId, name: categoryName, description: '', color: '#3498db', icon: '' },
  can_edit: true,
  max_attendees: null,
  banner_image: null,
  photos: [],
  hosts: [],
  agenda_items: [],
})

const json = (body: unknown, status = 200) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
})

const paginated = (results: unknown[]) => json({ count: results.length, next: null, previous: null, results })

const apiPath = (path: string) => (url: URL) => url.origin === API_ORIGIN && url.pathname === path

/** The catalogue and category endpoints every test here reads. */
const stubCatalogue = async (page: Page) => {
  await page.route(apiPath('/api/core-data/event-categories/'), (route) =>
    route.fulfill(paginated(CATEGORIES)),
  )
  await page.route(apiPath('/api/core-data/pricing-plans/'), (route) => route.fulfill(paginated(PLANS)))
  await page.route(apiPath('/api/core-data/event-templates/'), (route) =>
    route.fulfill(paginated(TEMPLATES)),
  )
}

const seedSession = async (page: Page, draft?: Record<string, unknown>) => {
  await page.route(apiPath('/api/auth/profile/'), (route) => route.fulfill(json(USER)))
  await page.addInitScript(
    ({ token, user, draft }) => {
      const put = (k: string, v: string) =>
        localStorage.setItem(`goevent_v3_${k}`, JSON.stringify({ value: v, timestamp: Date.now(), version: '3.0' }))
      put('access_token', token)
      put('refresh_token', token)
      put('user', JSON.stringify(user))
      // Once only: an init script runs on every document load, and the draft
      // must be able to disappear once the event it describes exists.
      if (draft && !sessionStorage.getItem('draft-seeded')) {
        sessionStorage.setItem('draft-seeded', '1')
        put('create_event_draft', JSON.stringify({ v: 1, saved_at: Date.now(), form: draft }))
      }
    },
    { token: fakeJwt(), user: USER, draft },
  )
}

/**
 * Answers `POST /api/events/` the way the real backend does and records the
 * body it was sent; any other request to that path gets an empty list.
 *
 * **The create response has no `id`** — the backend answers through its write
 * serializer (`EventCreateUpdateSerializer`), whose field list omits it. An
 * earlier version of this stub returned one, and the wizard shipped navigating
 * to `/events/undefined/manage` with every test green. The id is only
 * findable through `/api/events/my/`, which is stubbed here with an older
 * event of the same name beside it, so the lookup has to pick the new one.
 */
const stubCreate = async (page: Page, event: ReturnType<typeof createdEvent>) => {
  const posted: Record<string, unknown>[] = []
  let created = false
  const { id, ...writeSerializerFields } = event
  const olderNamesake = { ...event, id: `${id}-older`, created_at: '2025-01-01T00:00:00Z' }

  await page.route(apiPath('/api/events/'), (route, request: Request) => {
    if (request.method() !== 'POST') return route.fulfill(paginated([]))
    posted.push(request.postDataJSON())
    created = true
    return route.fulfill(json(writeSerializerFields, 201))
  })
  await page.route(apiPath('/api/events/my/'), (route) =>
    route.fulfill(
      json({
        organized: created
          ? [olderNamesake, { ...event, created_at: new Date().toISOString() }]
          : [olderNamesake],
        collaborated: [],
      }),
    ),
  )
  await page.route(apiPath(`/api/events/${id}/`), (route) => route.fulfill(json(event)))
  return posted
}

test.describe('create event wizard', () => {
  test.beforeEach(async ({ page, stubApi }) => {
    // Catch-all first: Playwright matches the most recently added route first.
    await stubApi(page)
    await stubCatalogue(page)
  })

  test('signed out: the landing opens the wizard in place, and Create keeps the answers through sign-in', async ({
    page,
  }) => {
    await page.goto('/')
    await waitForAppMount(page)

    await page.getByRole('button', { name: 'Create Your First Event' }).click()

    // No sign-in wall first, and no trip away from the landing.
    const wizard = page.getByRole('dialog', { name: 'Create New Event' })
    await expect(wizard.getByRole('heading', { name: 'What are you planning?' })).toBeVisible()
    await expect(page).toHaveURL(/\/$/)

    // Categories with designs lead, and say so; the one with a studio but no
    // design sits with the rest.
    const wedding = wizard.getByRole('button', { name: /Wedding/ })
    await expect(wedding).toContainText('Invitation designs available')
    await expect(wizard.getByRole('button', { name: /Housewarming/ })).not.toContainText(
      'Invitation designs available',
    )

    // A tap is the answer: the page moves on by itself.
    await wedding.click()
    const name = wizard.getByLabel("What's it called?")
    await expect(name).toBeVisible()
    await expect(name).toHaveAttribute('placeholder', "e.g. Dara & Sophea's Wedding")

    const next = wizard.getByRole('button', { name: /Continue/ })
    await expect(next).toBeDisabled()
    await name.fill("Dara & Sophea's Wedding")
    await next.click()

    await expect(wizard.getByRole('heading', { name: 'When is it?' })).toBeVisible()
    await next.click()

    await expect(wizard.getByRole('heading', { name: 'Final details' })).toBeVisible()
    await expect(wizard.getByText("Dara & Sophea's Wedding")).toBeVisible()
    await expect(wizard.getByText(/Next, you'll sign in/)).toBeVisible()

    await wizard.getByRole('button', { name: 'Create Event' }).click()

    await expect(page).toHaveURL(/\/signin\?redirect=/)
    await expect(page.getByRole('heading', { name: 'Sign in to create your event' })).toBeVisible()
    await expect(page.getByText(/“Dara & Sophea's Wedding” is saved/)).toBeVisible()
  })

  test('back from sign-in: the event is created without a second press, and opens on its designs', async ({
    page,
  }) => {
    await seedSession(page, {
      title: "Dara & Sophea's Wedding",
      description: '',
      start_date: '2026-12-12T17:00',
      end_date: '2026-12-12T22:00',
      privacy: 'private',
      timezone: 'Asia/Phnom_Penh',
      category: 1,
      registration_required: false,
      registration_deadline: '',
      max_attendees: null,
      auto_populate: true,
    })
    const posted = await stubCreate(page, createdEvent('new-1', 1, 'Wedding'))

    // Where sign-in sends them (CREATE_EVENT_RESUME_PATH).
    await page.goto('/events?createEvent=resume')
    await waitForAppMount(page)

    await expect(page).toHaveURL(/\/events\/new-1\/manage\?tab=design-studio/)
    expect(posted).toHaveLength(1)
    expect(posted[0]).toMatchObject({
      title: "Dara & Sophea's Wedding",
      category: 1,
      privacy: 'private',
      auto_populate: true,
    })

    // The template browser is up, and the one-shot `open` is gone from the URL
    // so a reload won't reopen it.
    await expect(page.getByRole('dialog', { name: 'Templates' })).toBeVisible()
    await expect(page).toHaveURL(/\/events\/new-1\/manage\?tab=design-studio$/)
  })

  test('signed in, a category without designs lands on the Showcase tab with nothing over it', async ({
    page,
  }) => {
    await seedSession(page)
    const posted = await stubCreate(page, createdEvent('new-2', 9, 'Music'))

    await page.goto('/events?createEvent=true')
    await waitForAppMount(page)

    const wizard = page.getByRole('dialog', { name: 'Create New Event' })
    await wizard.getByRole('button', { name: /Music/ }).click()
    await wizard.getByLabel("What's it called?").fill('Summer Music Night')
    await wizard.getByRole('button', { name: /Continue/ }).click()
    await wizard.getByRole('button', { name: /Continue/ }).click()

    // Signed in, so Create says nothing about signing in.
    await expect(wizard.getByText(/Next, you'll sign in/)).toHaveCount(0)
    await wizard.getByRole('button', { name: 'Create Event' }).click()

    await expect(page).toHaveURL(/\/events\/new-2\/manage\?tab=design-studio$/)
    expect(posted[0]).toMatchObject({ title: 'Summer Music Night', category: 9 })
    await expect(page.getByRole('dialog', { name: 'Templates' })).toHaveCount(0)
  })
})
