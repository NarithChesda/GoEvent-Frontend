/**
 * The create-event wizard's form, as data: its shape, its defaults, the API
 * payload it becomes, and the draft that carries it across sign-in.
 *
 * A signed-out visitor fills in the whole wizard before anyone asks who they
 * are (EventCreateDrawer). Pressing Create then sends them to /signin — a full
 * route change, sometimes a round trip through Google or Telegram — so the form
 * has to outlive the component holding it. It is written to storage at exactly
 * that moment and read back when the wizard reopens on
 * `CREATE_EVENT_RESUME_PATH`, which is where sign-in returns them.
 *
 * The draft is deliberately short-lived and single-purpose: it is saved only on
 * that Create press, cleared once the event exists or the wizard is dismissed,
 * and expires on its own after a few days. It is never a general autosave.
 */
import type { RouteLocationRaw } from 'vue-router'
import type { Event } from '@/services/api'
import { secureStorage } from '@/utils/secureStorage'
import { getUserTimezone } from '@/utils/timezones'

export interface CreateEventForm {
  title: string
  /** Sanitized rich text. Prefilled from the category's description template. */
  description: string
  /** `YYYY-MM-DDTHH:mm` in local time — the DateTimeDisclosureRow format. */
  start_date: string
  end_date: string
  privacy: 'public' | 'private'
  timezone: string
  category: number | null
  registration_required: boolean
  /** `YYYY-MM-DDTHH:mm`, or empty for no deadline. */
  registration_deadline: string
  max_attendees: number | null
  auto_populate: boolean
}

/**
 * Where sign-in sends a visitor who pressed Create while signed out. EventsView
 * reads the `resume` value, reopens the wizard on its last step with the draft,
 * and creates the event without asking a second time.
 */
export const CREATE_EVENT_RESUME_PATH = '/events?createEvent=resume'

/** Format a Date as a `datetime-local` string. `toISOString` would shift it to UTC. */
export const toLocalInputString = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const HOUR_MS = 60 * 60 * 1000

/**
 * A fresh form: starts on the first whole hour at least an hour from now, and
 * runs for two. Rounded because a start of "12:07 AM" reads as a value nobody
 * chose — which it is — and the first thing the date step shows is this value.
 */
export function createEventFormDefaults(now: Date = new Date()): CreateEventForm {
  const start = new Date(now.getTime() + HOUR_MS)
  if (start.getMinutes() || start.getSeconds() || start.getMilliseconds()) {
    start.setMinutes(60, 0, 0) // rolls over into the next hour
  }
  const end = new Date(start.getTime() + 2 * HOUR_MS)
  return {
    title: '',
    description: '',
    start_date: toLocalInputString(start),
    end_date: toLocalInputString(end),
    privacy: 'private',
    timezone: getUserTimezone(),
    category: null,
    registration_required: false,
    registration_deadline: '',
    max_attendees: null,
    auto_populate: false,
  }
}

export type CreateEventPayload = Partial<Event> & { auto_populate?: boolean }

/**
 * The body for `POST /api/events/`. Fields the wizard doesn't ask about get the
 * values the API expects rather than being left out — `virtual_link` must be an
 * empty string, not null.
 */
export function toCreateEventPayload(form: CreateEventForm): CreateEventPayload {
  const registrationDeadline =
    form.registration_required && form.registration_deadline
      ? new Date(form.registration_deadline).toISOString()
      : null

  return {
    title: form.title.trim(),
    description: form.description,
    short_description: '',
    start_date: new Date(form.start_date).toISOString(),
    end_date: new Date(form.end_date).toISOString(),
    location: '',
    is_virtual: false,
    virtual_link: '',
    privacy: form.privacy,
    category: form.category,
    max_attendees: form.registration_required ? form.max_attendees || null : null,
    registration_required: form.registration_required,
    registration_deadline: registrationDeadline,
    timezone: form.timezone || getUserTimezone(),
    ...(form.auto_populate && form.category !== null ? { auto_populate: true } : {}),
  }
}

/**
 * Where a new event opens. Always its Design Studio tab — for a category with
 * no studio that tab is the plain "Showcase" content tab — and, when the
 * category has invitation designs to choose from, with the template browser
 * already up, because choosing how it looks is the first thing to do with it.
 * EventManageView consumes `open=templates` once and strips it from the URL.
 */
export function newEventLocation(eventId: string, openTemplates: boolean): RouteLocationRaw {
  return {
    path: `/events/${eventId}/manage`,
    query: { tab: 'design-studio', ...(openTemplates ? { open: 'templates' } : {}) },
  }
}

/**
 * The id of the event a create just made, found in the organizer's own events.
 *
 * `POST /api/events/` answers through the backend's write serializer
 * (`EventCreateUpdateSerializer`), and its field list has no `id` — so the
 * response describes the new event without saying which one it is. Navigating
 * on `response.data.id` sent every new event to `/events/undefined/manage`,
 * a 404, while the event itself had been created fine. When the create
 * response carries no id, the caller fetches `/api/events/my/` and this picks
 * the newest of the organizer's events with the title just submitted — the
 * event created a moment ago, unless they made two identically named events
 * in the same instant.
 */
export function findCreatedEventId(
  created: Pick<Event, 'title'> & Partial<Pick<Event, 'start_date'>>,
  organized: Array<Pick<Event, 'id' | 'title'> & Partial<Pick<Event, 'start_date' | 'created_at'>>>,
): string | null {
  const title = created.title.trim()
  const sameTitle = organized.filter((event) => event.title.trim() === title)
  // The start date as the server echoed it narrows two same-named events down
  // to the one just made; it is only a tie-break, never required to match.
  const sameStart = created.start_date
    ? sameTitle.filter((event) => event.start_date === created.start_date)
    : []
  const candidates = sameStart.length ? sameStart : sameTitle
  if (!candidates.length) return null

  const createdAt = (event: (typeof candidates)[number]) => Date.parse(event.created_at ?? '') || 0
  return candidates.reduce((newest, event) => (createdAt(event) > createdAt(newest) ? event : newest))
    .id
}

/* ── The draft ──────────────────────────────────────────────────────────── */

const DRAFT_KEY = 'create_event_draft'
const DRAFT_VERSION = 1

/**
 * Long enough to survive someone who stops at the sign-in screen and comes back
 * the next evening; short enough that a forgotten draft does not greet them a
 * month later.
 */
const DRAFT_MAX_AGE_MS = 3 * 24 * HOUR_MS

interface StoredDraft {
  v: number
  saved_at: number
  form: CreateEventForm
}

export function saveCreateEventDraft(form: CreateEventForm): void {
  try {
    const stored: StoredDraft = { v: DRAFT_VERSION, saved_at: Date.now(), form: { ...form } }
    secureStorage.setItem(DRAFT_KEY, JSON.stringify(stored))
  } catch {
    // Private mode or a full quota. The visitor still reaches sign-in; they will
    // just find the wizard empty when they come back.
  }
}

export function clearCreateEventDraft(): void {
  try {
    secureStorage.removeItem(DRAFT_KEY)
  } catch {
    // Storage unavailable; there is nothing to clear.
  }
}

const isString = (value: unknown): value is string => typeof value === 'string'

/**
 * The saved draft, or `null` when there is none, it has expired, or it cannot be
 * read. Every field is checked on the way in and anything malformed falls back
 * to its default, so a draft written by an older build can never put the wizard
 * into a state it has no control for. Never throws.
 */
export function readCreateEventDraft(now: number = Date.now()): CreateEventForm | null {
  try {
    const raw = secureStorage.getItem(DRAFT_KEY)
    if (!raw) return null

    const stored = JSON.parse(raw) as Partial<StoredDraft>
    const age = now - Number(stored.saved_at)
    if (stored.v !== DRAFT_VERSION || !stored.form || Number.isNaN(age) || age > DRAFT_MAX_AGE_MS) {
      clearCreateEventDraft()
      return null
    }

    const saved = stored.form as Partial<Record<keyof CreateEventForm, unknown>>
    const form = createEventFormDefaults(new Date(now))
    if (!isString(saved.title) || !saved.title.trim()) {
      // A draft is only written from the last step, which cannot be reached
      // without a title — so this one is not ours.
      clearCreateEventDraft()
      return null
    }

    form.title = saved.title
    if (isString(saved.description)) form.description = saved.description
    if (isString(saved.start_date) && saved.start_date) form.start_date = saved.start_date
    if (isString(saved.end_date) && saved.end_date) form.end_date = saved.end_date
    if (saved.privacy === 'public' || saved.privacy === 'private') form.privacy = saved.privacy
    if (isString(saved.timezone) && saved.timezone) form.timezone = saved.timezone
    if (typeof saved.category === 'number') form.category = saved.category
    if (typeof saved.registration_required === 'boolean') {
      form.registration_required = saved.registration_required
    }
    if (isString(saved.registration_deadline)) {
      form.registration_deadline = saved.registration_deadline
    }
    if (typeof saved.max_attendees === 'number') form.max_attendees = saved.max_attendees
    if (typeof saved.auto_populate === 'boolean') form.auto_populate = saved.auto_populate
    return form
  } catch {
    clearCreateEventDraft()
    return null
  }
}
