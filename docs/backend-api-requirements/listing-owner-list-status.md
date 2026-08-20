# Backend API Requirements: Management Fields on the Owner's Listing List

> **Status: PENDING** — the frontend ships a shim that works around this today
> (see [What the frontend does meanwhile](#what-the-frontend-does-meanwhile)).
> The shim costs one extra request per listing on screen and disables itself
> automatically once this lands, so nothing needs to be un-picked afterwards.

## The ask, in one line

`GET /api/services/listings/` — the owner's own list, behind
Settings → Listings — must serialize the fields that only an owner can see:
`status` above all, plus `admin_notes` and `contact_clicks_count`.

```diff
  {
    "id": "uuid",
    "title": "Wedding Photography Package",
    "slug": "wedding-photography-package",
    "short_tagline": "Capture every magical moment",
    "price_display_text": "Starting from $500",
    "price_min": "500.00",
    "price_max": "2000.00",
    "currency": "USD",
    "vendor_name": "Elite Photography",
    "category_name": "Photography",
    "cover_image_url": "/media/service_media/photo.webp",
    "is_featured": true,
    "views_count": 150,
+   "status": "draft",
+   "admin_notes": "",
+   "contact_clicks_count": 12,
    "created_at": "2025-01-15T10:30:00Z"
  }
```

`status` is the one that matters. The other two are cheap to add alongside it
and remove the rest of the shim; if only one field can be added, add `status`.

## Why

The endpoint answers with the **brief** serializer — the same shape
`/api/services/listings/browse/` returns to anonymous visitors. That is right
for a public catalogue and wrong for the owner's management screen, which is
built entirely around the fields the brief shape omits.

Concretely, with `status` absent every card computes `status === 'draft'` as
false, so:

- **A draft never offers "Submit for review."** This is how the gap was found: a
  vendor creates a listing, the card correctly shows Submit (the create flow
  holds the *full* listing it just re-read), they reload the page, and the
  button is gone — while the listing is still a draft and still unsubmitted.
  There is no way back to submitting it short of opening and re-saving it.
- **Every card reports the same state.** The status dot falls back to grey and
  the label renders empty, so live, in-review and rejected listings are
  indistinguishable at a glance — the one thing the grid exists to show.
- **The header's count line reads all zeros**, since it is computed from the
  same field.

`admin_notes` and `contact_clicks_count` are smaller but the same shape of
problem: a **rejected** listing cannot show the reviewer's note, which leaves
"what do I fix?" unanswerable, and the analytics figure has to be fetched
per listing.

Note that `status` is already an accepted **query parameter** on this endpoint
(`?status=draft`, documented in
[SERVICES_API_DOCS.md](../backend-api/SERVICES_API_DOCS.md)), so the field is
known to the view — it is filtered on but not returned.

## Suggested shape

The listing detail serializer already carries all three. The smallest change is
a dedicated serializer for the owner's list — brief plus the owner-only fields —
rather than returning the full detail payload, which would also pull
`vendor_details`, `category_details` and every `media` row into a list response
that does not need them.

Whatever the mechanism, `/api/services/listings/browse/` must **not** gain these
fields: `admin_notes` in particular is internal review commentary and belongs
only to the owner.

## What the frontend does meanwhile

[ListingsTab.vue](../../src/components/settings/ListingsTab.vue) checks each row
for `status === undefined` and, for any that lack it, re-reads the listing in
full via `GET /api/services/listings/{uuid}/` and merges the result over the
list row. That restores every management field, at the cost of one request per
listing on the page.

It is guarded on the field being absent, so the moment this requirement ships
the extra requests stop firing on their own and the shim can be deleted at
leisure.

## Confirming it end to end

1. Sign in as a verified vendor with at least one **draft** listing and one
   **rejected** listing.
2. `GET /api/services/listings/` and confirm `status` is present on every row,
   and that the rejected row carries its `admin_notes`.
3. Load Settings → Listings and confirm, on a **fresh page load** rather than
   just after a create:
   - the draft card offers "Submit for review"
   - the rejected card shows the reviewer's note under its status
   - the header line reads e.g. "3 listings · 1 live · 1 draft · 1 need attention"
4. Confirm the network panel shows **one** request for the list and no
   per-listing `GET /api/services/listings/{uuid}/` calls behind it — that is
   the shim standing down.
5. `GET /api/services/listings/browse/` as an anonymous user and confirm
   `admin_notes` is **not** in the payload.
