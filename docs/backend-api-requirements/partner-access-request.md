# Backend API Requirements: Partner Access Requests

> **Status: PENDING** — the frontend is built and shipped against this contract.
> It degrades safely without it (see [What the frontend does meanwhile](#what-the-frontend-does-meanwhile)),
> so this can land whenever the backend team is ready; nothing needs to be
> un-picked on the frontend afterwards.

## The ask, in one line

Two endpoints that let a non-partner **apply** for the `is_partner` flag, and let
them see where that application stands:

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/payment/partner-requests/me/` | JWT, **any** account | The caller's latest application. `404` when they have never applied |
| `POST` | `/api/payment/partner-requests/` | JWT, **any** account | Submit an application |

Plus an admin review action that, on approval, sets `user.is_partner = True`.

**These two must not be partner-gated.** Every other endpoint under
`/api/payment/` answers `403` without the flag — these exist precisely for
accounts that do not have it, and a `403` here would make the feature
unreachable by its only audience.

## Why this exists

`is_partner` is a flag an admin sets by hand. There has never been a way for an
account to ask for it, so the credits page's "not a partner" state ended on the
sentence *"Get in touch with the GoEvent team if you would like a partner
account"* — an instruction the product then offered no way to follow. Every
prospective shop had to already know a human at GoEvent.

The page now opens an application form instead. The information it collects is
the information a reviewer actually needs to decide: who the shop is, how to
reach them, and roughly how much wholesale they will need (which decides which
pack to point them at).

There is a second, quieter reason. Once requests are records rather than
Telegram messages, the funnel is measurable — how many people reach the credits
page without an account, how many apply, how many are approved — and none of
that exists today.

## Shape

### `GET /api/payment/partner-requests/me/`

`200` with the caller's **latest** application:

```jsonc
{
  "id": "uuid",
  "status": "pending",                 // pending | approved | rejected
  "status_display": "Pending review",
  "business_name": "Angkor Wedding House",
  "contact_phone": "+855 12 345 678",
  "contact_telegram": "@angkorwedding",
  "expected_monthly_events": "6_20",   // nullable
  "message": "We do about 10 weddings a month in Siem Reap.",
  "review_note": null,                 // see below
  "can_reapply": false,                // see below
  "created_at": "2026-08-24T09:12:00Z",
  "reviewed_at": null
}
```

`404` when the account has never applied. That is the ordinary first-visit
answer, not an error — please do not return `200` with an empty body or an empty
list, and please do not `403` a non-partner here.

A single object rather than a list: only the latest application decides what the
page shows, and an account's own history of rejected attempts is not something
it needs to browse.

### `POST /api/payment/partner-requests/`

Request body — only the first two are required:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `business_name` | string | **yes** | ≤ 120 chars |
| `contact_phone` | string | **yes** | ≤ 32 chars. Free text — Cambodian numbers are written many ways and rejecting a format costs a lead |
| `contact_telegram` | string | no | ≤ 120 chars. `@handle` **or** a `t.me/…` link — accept both, normalise if you like |
| `expected_monthly_events` | string | no | One of `1_5`, `6_20`, `21_50`, `50_plus`. Buckets, not a number |
| `message` | string | no | ≤ 1000 chars |

`201` with the same envelope shape the credit-pack order endpoints use:

```jsonc
{
  "success": true,
  "message": "Your request has been received.",
  "request": { /* the object above */ }
}
```

Errors:

- **`400` with field errors** (`{"business_name": ["This field is required."]}`)
  — the frontend renders these under the field that caused them, so please key
  them by request-body field name rather than collapsing to a `detail` string.
- **`400`** when an application is already `pending`. The UI hides the button in
  that state, so this only fires on a double submit or a stale tab.
- **`400`** when the account is **already a partner**. Nothing in the UI can
  reach this, but it is worth refusing.

### The two fields that are not obvious

**`can_reapply`** — whether this account may submit a fresh application. The
frontend never infers this from `status`; only the reviewer knows whether a
rejection was final ("this is a consumer account") or an invitation to come back
("call us when you're actually trading"). Suggested default: `false` while
`pending` or `approved`, and for a rejection whatever the review action set —
with a sensible fallback such as `true` once some cooling-off period has passed.

**`review_note`** — what the reviewer wants the applicant to read. It is
rendered verbatim to the applicant, so it is **not** the place for internal
commentary; if you want both, keep `admin_notes` separate and private, the way
`ServiceListing` does. A rejection with no note must still render, so leaving it
`null` is fine.

### Approval side effects

On approval the review action must:

1. Set `user.is_partner = True`
2. Set `status = "approved"` and stamp `reviewed_at`

The frontend picks the flag up on its own — `CreditsTab` re-reads the profile
when the credits endpoints let it through while the cached account still says
non-partner, so the approval takes effect without a re-login. No extra endpoint
is needed for that. (The **Partner Credits** nav link itself is not gated on the
flag, precisely so the application is reachable; only the page's contents
change.)

A notification (email or the existing Telegram admin channel) on a new
submission would be welcome but is not required by the frontend.

## Where it should live

Under `/api/payment/`, beside the credit endpoints, rather than in the accounts
app — the request *is* an application for wholesale credit access, gated by the
same flag every other `/api/payment/` partner endpoint checks, so one app owns
"who is a partner and what may they buy". If the backend team would rather keep
account-flag mutations in the accounts app, the only thing the frontend needs is
the path: change the two constants in
[`partner-requests.service.ts`](../../src/services/api/modules/partner-requests.service.ts)
and nothing else moves.

## What the frontend does meanwhile

Nothing breaks while these endpoints do not exist, because a missing endpoint and
a never-applied account are indistinguishable over the wire and want the same
screen:

- **`GET .../me/` → `404`** is read as "no application yet", which is exactly
  what an un-deployed endpoint returns. The gated state shows the request CTA.
- **`POST` → `404`/`405`** is caught specifically and surfaced as *"Partner
  requests are not open yet. Contact the GoEvent team and we will set you up."*
  — deliberately **not** the generic failure message, which would have someone
  retrying a submission that has nowhere to land.

So today the button opens the form, the form validates, and the submit reports
honestly that the channel is not open. The day the endpoints ship, the same code
starts working with no frontend change.

## Confirming it end to end

1. As an account with `is_partner = False` and no application, `GET
   /api/payment/partner-requests/me/` → `404`. Open the profile menu, confirm
   **Partner Credits** is there (the link is not partner-gated — that is how the
   application is reached at all), follow it, and confirm the state offers
   **Request partner access**.
2. Submit the form. Confirm `201`, and that the page behind the drawer becomes
   *"Your request is with our team"* with the submission date — with no reload.
3. Reload `/credits`. The pending state must survive, and the button must be
   **gone** (this is the check that catches a `me/` that returns `404` after a
   successful create).
4. `POST` a second application while the first is `pending` → `400`.
5. Reject the application with a `review_note` and `can_reapply: true`. Reload:
   the note renders, and **Request again** appears.
6. Reject with `can_reapply: false`. Reload: the note renders and no button
   appears.
7. Approve it. Confirm `user.is_partner` flipped and that reloading `/credits`
   shows the real credits page — balance, catalogue and orders — in place of the
   application, without signing out and in again.
8. As a **partner** account, confirm `/credits` still loads with no request
   traffic at all: the frontend skips `me/` entirely for an account already
   flagged, so the network panel should show only the three credit calls.

## Frontend reference

- Types: [`src/services/api/types/partner.types.ts`](../../src/services/api/types/partner.types.ts) —
  `PartnerRequest`, `PartnerRequestStatus`, `PartnerRequestVolume`,
  `CreatePartnerRequestData`, `PartnerRequestEnvelope`
- Service: [`src/services/api/modules/partner-requests.service.ts`](../../src/services/api/modules/partner-requests.service.ts)
- State, including the `404`/unavailable handling:
  [`src/composables/settings/usePartnerRequest.ts`](../../src/composables/settings/usePartnerRequest.ts)
- The four gated shapes: [`src/components/settings/CreditsTab.vue`](../../src/components/settings/CreditsTab.vue) —
  `gatedState`, `gatedCopy`, `canRequestPartner`
- The form: [`src/components/settings/credits/PartnerRequestDrawer.vue`](../../src/components/settings/credits/PartnerRequestDrawer.vue)
- Copy: `settings.credits.request.*` in
  [`en/settings.json`](../../src/i18n/locales/en/settings.json) and
  [`kh/settings.json`](../../src/i18n/locales/kh/settings.json)
- The partner programme these requests are the front door to: the "Partner
  Credit Packs" section of [CLAUDE.md](../../CLAUDE.md), and
  [`credits.service.ts`](../../src/services/api/modules/credits.service.ts) for
  the endpoints that stay partner-gated
