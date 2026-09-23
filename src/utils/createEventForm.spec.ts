// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearCreateEventDraft,
  createEventFormDefaults,
  findCreatedEventId,
  newEventLocation,
  readCreateEventDraft,
  saveCreateEventDraft,
  toCreateEventPayload,
  type CreateEventForm,
} from './createEventForm'

/**
 * The create wizard's answers have to survive a trip through sign-in — a full
 * route change, sometimes via Google or Telegram — and come back intact enough
 * to be created without asking again. These pin what the draft keeps, what it
 * refuses, and the payload it turns into.
 */

const STORED_KEY = 'goevent_v3_create_event_draft'
const DAY_MS = 24 * 60 * 60 * 1000

const filledForm = (overrides: Partial<CreateEventForm> = {}): CreateEventForm => ({
  ...createEventFormDefaults(new Date('2026-09-23T10:00:00')),
  title: "Dara & Sophea's Wedding",
  category: 1,
  start_date: '2026-12-12T17:00',
  end_date: '2026-12-12T22:00',
  auto_populate: true,
  ...overrides,
})

beforeEach(() => {
  localStorage.clear()
})

describe('the draft', () => {
  it('round-trips every answer', () => {
    const form = filledForm({
      privacy: 'public',
      description: '<p>Join us</p>',
      registration_required: true,
      registration_deadline: '2026-12-01T12:00',
      max_attendees: 150,
    })
    saveCreateEventDraft(form)
    expect(readCreateEventDraft()).toEqual(form)
  })

  it('is gone once cleared', () => {
    saveCreateEventDraft(filledForm())
    clearCreateEventDraft()
    expect(readCreateEventDraft()).toBeNull()
  })

  it('expires after three days, and removes itself when it does', () => {
    saveCreateEventDraft(filledForm())
    expect(readCreateEventDraft(Date.now() + 2 * DAY_MS)).not.toBeNull()
    expect(readCreateEventDraft(Date.now() + 4 * DAY_MS)).toBeNull()
    expect(localStorage.getItem(STORED_KEY)).toBeNull()
  })

  it('refuses a draft with no title — the last step cannot be reached without one', () => {
    saveCreateEventDraft(filledForm({ title: '   ' }))
    expect(readCreateEventDraft()).toBeNull()
  })

  it('falls back to defaults for malformed fields rather than trusting them', () => {
    localStorage.setItem(
      STORED_KEY,
      JSON.stringify({
        value: JSON.stringify({
          v: 1,
          saved_at: Date.now(),
          form: { title: 'Lina turns 30', privacy: 'everyone', category: '8', max_attendees: 'lots' },
        }),
        timestamp: Date.now(),
        version: '3.0',
      }),
    )
    const draft = readCreateEventDraft()
    expect(draft?.title).toBe('Lina turns 30')
    expect(draft?.privacy).toBe('private')
    expect(draft?.category).toBeNull()
    expect(draft?.max_attendees).toBeNull()
  })

  it('reads unreadable storage as no draft, never as an error', () => {
    localStorage.setItem(STORED_KEY, '{not json')
    expect(readCreateEventDraft()).toBeNull()
  })
})

describe('createEventFormDefaults', () => {
  it('starts on the first whole hour at least an hour away, and runs two hours', () => {
    const form = createEventFormDefaults(new Date(2026, 8, 23, 23, 7))
    expect(form.start_date).toBe('2026-09-24T01:00')
    expect(form.end_date).toBe('2026-09-24T03:00')
  })

  it('keeps an exact hour as it is', () => {
    expect(createEventFormDefaults(new Date(2026, 8, 23, 10, 0)).start_date).toBe('2026-09-23T11:00')
  })
})

describe('toCreateEventPayload', () => {
  it('sends ISO dates and the empty strings the API expects', () => {
    const payload = toCreateEventPayload(filledForm())
    expect(payload.start_date).toBe(new Date('2026-12-12T17:00').toISOString())
    expect(payload.end_date).toBe(new Date('2026-12-12T22:00').toISOString())
    expect(payload).toMatchObject({ virtual_link: '', location: '', short_description: '' })
  })

  it('trims the title', () => {
    expect(toCreateEventPayload(filledForm({ title: '  Housewarming  ' })).title).toBe('Housewarming')
  })

  it('drops the registration details when registration is off', () => {
    const payload = toCreateEventPayload(
      filledForm({
        registration_required: false,
        registration_deadline: '2026-12-01T12:00',
        max_attendees: 80,
      }),
    )
    expect(payload.registration_deadline).toBeNull()
    expect(payload.max_attendees).toBeNull()
  })

  it('asks for auto-fill only when there is a category to fill from', () => {
    expect(toCreateEventPayload(filledForm()).auto_populate).toBe(true)
    expect('auto_populate' in toCreateEventPayload(filledForm({ category: null }))).toBe(false)
    expect('auto_populate' in toCreateEventPayload(filledForm({ auto_populate: false }))).toBe(
      false,
    )
  })
})

describe('findCreatedEventId', () => {
  // The create response is the write serializer's echo: no id.
  const created = { title: 'Our Wedding', start_date: '2026-12-12T10:00:00+07:00' }

  it('picks the newest of the organizer’s events with that title', () => {
    expect(
      findCreatedEventId(created, [
        { id: 'old', title: 'Our Wedding', created_at: '2025-03-01T00:00:00Z' },
        { id: 'other', title: 'Housewarming', created_at: '2026-09-23T10:00:05Z' },
        { id: 'new', title: 'Our Wedding', created_at: '2026-09-23T10:00:00Z' },
      ]),
    ).toBe('new')
  })

  it('prefers the one whose start matches, whatever their ages', () => {
    expect(
      findCreatedEventId(created, [
        { id: 'match', title: 'Our Wedding', start_date: created.start_date, created_at: '2026-01-01T00:00:00Z' },
        { id: 'newer', title: 'Our Wedding', start_date: '2027-01-01T10:00:00+07:00', created_at: '2026-09-23T10:00:00Z' },
      ]),
    ).toBe('match')
  })

  it('ignores surrounding whitespace in the title', () => {
    expect(findCreatedEventId({ title: 'Our Wedding ' }, [{ id: 'e', title: ' Our Wedding' }])).toBe('e')
  })

  it('says so when nothing matches, rather than guessing', () => {
    expect(findCreatedEventId(created, [{ id: 'x', title: 'Something else' }])).toBeNull()
    expect(findCreatedEventId(created, [])).toBeNull()
  })
})

describe('newEventLocation', () => {
  it('opens the studio with the template browser up when there are designs', () => {
    expect(newEventLocation('abc', true)).toEqual({
      path: '/events/abc/manage',
      query: { tab: 'design-studio', open: 'templates' },
    })
  })

  it('opens the same tab, and nothing over it, when there are none', () => {
    expect(newEventLocation('abc', false)).toEqual({
      path: '/events/abc/manage',
      query: { tab: 'design-studio' },
    })
  })
})
