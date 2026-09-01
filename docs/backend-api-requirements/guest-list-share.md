# Backend API Requirements: Shareable Guest-List Links

> **Status: PENDING** — the frontend is built and shipped against this contract.
> Nothing else in the app calls these endpoints, so the feature is simply
> unreachable until they land (the Share button opens a panel that reports a
> failure, and `/guest-list/<code>` shows its "this link does not work" card).
> No frontend rework is needed afterwards.

## The ask, in one line

Let an event organizer mint a **link** that opens their guest list for somebody
with **no GoEvent account** — read-only, or with permission to edit — where the
code in the link *is* the credential.

## Why this exists

Today the guest list is reachable only by the organizer and their
collaborators, and a collaborator needs a GoEvent account and an accepted
invitation. That is the wrong shape for the two people who actually work on a
guest list:

- **The person collecting names.** A mother, a sibling, an office
  administrator. They are given a list of relatives to chase and they need to
  add them. Making them create an account, wait for an invite email and accept
  it is three steps before the first name is typed, and most of them abandon at
  step one.
- **The person sending invitations.** Someone sitting with a phone, working
  down the list, copying each guest's personalised link into Telegram. They
  change nothing; they only need to *read* the list and *copy* from it.

Both are handed the job by the organizer in a chat message. The natural unit of
delegation is therefore a link in that same chat message — not an account.

The product already has this exact pattern and it works: a private event's RSVP
and guestbook accept a **guest shortcode** (`?g=<code>`) as the whole
credential, with no JWT anywhere. This is that idea pointed at the other side of
the invitation. `?g=` identifies **one guest** to the showcase; a share code
identifies **one delegated helper** to the guest list.

## Shape

Two groups of endpoints. The first is the organizer's, behind JWT. The second is
the recipient's and takes no JWT at all.

### Organizer side — `/api/events/{event_id}/guest-list-shares/`

Standard DRF viewset, permissions identical to the event's other management
endpoints (organizer **or** a collaborator who may manage guests).

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/events/{event_id}/guest-list-shares/` | Every share for the event, revoked ones included |
| `POST` | `/api/events/{event_id}/guest-list-shares/` | Mint one |
| `PATCH` | `/api/events/{event_id}/guest-list-shares/{id}/` | Change access, label, expiry — or revoke via `is_active` |
| `DELETE` | `/api/events/{event_id}/guest-list-shares/{id}/` | Destroy the record |

Serialized share:

```jsonc
{
  "id": 12,
  "event": "3f0c…-uuid",
  "code": "Qk3nZPvR",              // the credential — see "Code" below
  "url": "https://goevent.online/guest-list/Qk3nZPvR",
  "access": "view",                // "view" | "edit"
  "access_display": "Can view",
  "label": "Mum",                  // optional, ≤60 chars, organizer's own note
  "is_active": true,               // false once revoked
  "expires_at": null,              // ISO-8601 or null for "never"
  "is_expired": false,             // computed: expires_at is in the past
  "is_usable": true,               // computed: is_active && !is_expired
  "access_count": 14,              // how many times the link has been opened
  "last_accessed_at": "2026-09-01T08:02:11Z",
  "created_by": 7,
  "created_by_details": { "id": 7, "username": "…", "email": "…", "profile": { … } },
  "created_at": "2026-08-28T10:00:00Z",
  "updated_at": "2026-08-28T10:00:00Z"
}
```

**`url` is built by the backend, not the client.** It must be
`{FRONTEND_URL}/guest-list/{code}` — the frontend route is
`/guest-list/:code`. The organizer copies this string straight into a chat
message, so it has to be complete and correct on arrival.

**`is_usable` is a field, not a client-side `is_active && !is_expired`.** Two
booleans that must be combined the same way in every consumer is exactly the
rule that eventually gets combined differently in one of them.

`POST` body:

```jsonc
{
  "access": "view",           // required
  "label": "Mum",             // optional
  "expires_at": null          // optional; ISO-8601 or null
}
```

`PATCH` accepts any of `access`, `label`, `expires_at`, `is_active`.

### Recipient side — `/api/guest-share/{code}/…`

**No authentication. The code is the credential.** Follow the partition already
used by comments and guest-RSVP: on these endpoints the code decides, and an
`Authorization` header — which will sometimes be present, because the recipient
may happen to be signed in as somebody unrelated — is **ignored**, never
preferred and never a reason to refuse.

| Method | Path | Access needed |
| --- | --- | --- |
| `GET` | `/api/guest-share/{code}/` | any — resolves the link |
| `GET` | `/api/guest-share/{code}/guests/` | view |
| `GET` | `/api/guest-share/{code}/guests/stats/` | view |
| `POST` | `/api/guest-share/{code}/guests/` | edit |
| `PATCH` | `/api/guest-share/{code}/guests/{guest_id}/` | edit |
| `DELETE` | `/api/guest-share/{code}/guests/{guest_id}/` | edit |
| `PATCH` | `/api/guest-share/{code}/guests/{guest_id}/mark-sent/` | edit |
| `POST` | `/api/guest-share/{code}/guests/bulk-mark-sent/` | edit |
| `POST` | `/api/guest-share/{code}/guests/bulk-delete/` | edit |
| `POST` | `/api/guest-share/{code}/guests/bulk-import/` | edit |
| `GET` | `/api/guest-share/{code}/guest-groups/` | view |
| `POST` | `/api/guest-share/{code}/guest-groups/` | edit |
| `PATCH` | `/api/guest-share/{code}/guest-groups/{group_id}/` | edit |
| `DELETE` | `/api/guest-share/{code}/guest-groups/{group_id}/` | edit |

**Every one of these mirrors an existing event-scoped endpoint exactly** —
same query params, same request bodies, same response envelopes, same pagination
— with `/api/events/{event_id}/` swapped for `/api/guest-share/{code}/`. That
is deliberate and it is the cheapest thing to build: the event is resolved from
the code, and the existing view logic is reused with a different permission
class. The frontend relies on it literally — the shared page runs the *same*
Pinia store as the organizer's manage screen, with only the URL builder swapped
(`createSharedGuestTransport` in
[guest-share.service.ts](../../src/services/api/modules/guest-share.service.ts)),
so any divergence in shape shows up as a broken list rather than a graceful
degradation.

Note the endpoints **not** on that list: seating tables, RSVP questions and
answers, analytics, expenses, the event record itself. A share link is a guest
list, not a back door into the event.

### `GET /api/guest-share/{code}/` — the context

The first call the page makes. Nothing else renders until it answers, because
what the page may show depends on it.

```jsonc
{
  "code": "Qk3nZPvR",
  "access": "edit",
  "event": {
    "id": "3f0c…-uuid",
    "title": "Sokha & Dara",
    "start_date": "2026-12-14T16:00:00Z",
    "end_date": "2026-12-14T22:00:00Z",
    "location": "Sofitel Phnom Penh",
    "banner_image": "https://…/banner.jpg"
  },
  "shared_by": {
    "name": "Sokha Chan",
    "profile_picture": "https://…/avatar.jpg"
  },
  "label": "Mum",
  "expires_at": null,
  "permissions": {
    "can_view_guests": true,
    "can_copy_links": true,
    "can_edit_guests": true,
    "can_manage_groups": true,
    "can_import_guests": true
  }
}
```

**The event block is a thin summary on purpose.** The page needs enough to say
*which* event's list this is, so the recipient can tell a real link from a stray
one. A share code is not an entitlement to the full event record, and returning
one would leak the organizer's own configuration — templates, payment methods,
collaborators — to whoever the link reached.

**`shared_by.name` is load-bearing.** These links arrive in chat threads, and
"Shared by Sokha Chan" is what makes one trustworthy at a glance. Use the
creator's profile full name, falling back to their username.

**`permissions` is derived from `access` and spelled out anyway.** The client
renders from these booleans, not from the `access` string, so a third access
level later ("can add but not delete") needs no client change to be *safe* —
only to be pretty.

### Failure statuses carry the reason

The page shows a different sentence for each, because the recipient's next move
differs:

| Status | Meaning | What the page says |
| --- | --- | --- |
| `404` | No share with that code | "Check that you copied the whole link" |
| `403` | Exists, `is_active: false` | "The organizer turned this off — ask for a new one" |
| `410` | Exists, past `expires_at` | "This link has expired — ask for a fresh one" |

Please use exactly these three. A blanket `404` for all of them is the tempting
option and it is wrong here: "you pasted half a link" and "your access was
revoked" send the recipient to two different places, and only one of them is
worth bothering the organizer about.

The same three apply to **every** endpoint under `/api/guest-share/{code}/`, not
just the context call — a link can be revoked mid-session. On top of them, a
write attempted through a `view` share is a **`403`**.

## Code

- URL-safe, unguessable, generated server-side. 8–12 characters from a CSPRNG
  (`secrets.token_urlsafe`) is the right order of magnitude — the same class of
  secret as the existing guest shortcode.
- **Never derived from the event id, the organizer id, or a counter.** A
  sequential or hashed-id code turns one leaked link into an enumeration of
  every event on the platform.
- Unique across all events, not per event: the code is looked up on its own.
- Do not reuse a code after deletion.

## Behaviour worth pinning down

**Revoking keeps the row.** `is_active: false` is what the UI uses, and
`DELETE` is offered only for links that are already dead. The organizer's real
question after revoking is "is it definitely off now?", and a row that says
"Revoked · opened 14×" answers it; a row that vanished does not.

**Count opens, not requests.** `access_count` / `last_accessed_at` should
increment on the **context** call (`GET /api/guest-share/{code}/`), once per page
load, not on every guest-list page fetch — otherwise scrolling a long list
inflates the number into meaninglessness.

**`short_url` must be populated on shared guest rows.** Copying each guest's
personalised invitation link is the entire reason a *view* link exists. If the
serializer omits `short_url` on this path the feature has no purpose; the
frontend falls back to a long `/events/{id}/showcase/?guest_name=…` URL, which
skips the shortlink's bot detection, SSR meta tags and click tracking.

**Consider withholding `private_note_to_host`.** It is the one field on
`EventGuest` written *by the guest, for the organizer specifically*. Everything
else on the row — name, email, phone, group, RSVP status, cash gift, seat — is
the organizer's own data and is fair game on a link they deliberately created.
Our recommendation is to null that single field on both share endpoints. If you
would rather keep the serializer identical for simplicity, say so and we will
hide it client-side instead; what we should not do is ship it visible by
accident.

**Writes are attributed to the share, not to a user.** `EventGuest.added_by` is
a FK to a user and there is no user here. Leave it null and — if it is cheap —
record the share on the row (or in your existing audit log) so the organizer can
later tell which link added which guest. Not required for v1; the frontend
displays nothing that depends on it.

**Rate-limit the code lookup.** It is an unauthenticated endpoint keyed by a
secret, which is the exact shape brute force likes. Throttle by IP on
`/api/guest-share/{code}/` and treat a burst of `404`s from one address as
abuse.

**Expiry is an absolute timestamp, always.** The client resolves its "in 7 days"
preset to an ISO instant before sending. Please do not store a duration: an
organizer's intent is a moment, and a duration silently restarts if the row is
ever re-saved.

## What the frontend already does

All of it is in place and needs no further work once these endpoints exist:

| Piece | File |
| --- | --- |
| Types | [guest-share.types.ts](../../src/services/api/types/guest-share.types.ts) |
| Both service halves + the transport swap | [guest-share.service.ts](../../src/services/api/modules/guest-share.service.ts) |
| Organizer's share panel state | [useGuestListShares.ts](../../src/composables/invitation/useGuestListShares.ts) |
| Organizer's share panel | [ShareGuestListModal.vue](../../src/components/invitation/ShareGuestListModal.vue) — opened from the Share control on the guest-management tab |
| The recipient's page | [SharedGuestListView.vue](../../src/views/SharedGuestListView.vue) at `/guest-list/:code` |
| Read-only rendering | `canEdit` on [GuestGroupsView.vue](../../src/components/invitation/GuestGroupsView.vue) and [GuestListItem.vue](../../src/components/invitation/GuestListItem.vue) |

The recipient's page reuses the organizer's own guest panel, and the guest
management Pinia store reaches the network through a **transport** that is the
only thing swapped between the two audiences. Consequently the share endpoints'
pagination, filtering and response envelopes are not merely *similar* to the
event-scoped ones — the same client code parses both.
