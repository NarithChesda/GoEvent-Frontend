# Backend API Requirements: Countdown + RSVP Design (a Section of Their Own)

> **Status: PENDING.** The frontend is complete and reads
> `template_assets.countdown_rsvp_design`. Until the backend ships the field the
> value is always absent. Absent means **the countdown and the RSVP stay inside
> the info card**, exactly where every event draws them today, so the frontend
> is safe to deploy first.

## Overview

The countdown and the RSVP form have always been drawn at the foot of the info
card, under the venue map, in whichever material the card is made of (see
[info-card-design.md](info-card-design.md)). A template could choose how its
date and its venue card looked, but never how its count or its reply did.

A template can now move the pair **out of the card into a section of their own**
that follows it, and choose a composition for each half. That choice is one small
JSON config named `countdown_rsvp_design`, sent inside the template package and
forwarded to the showcase exactly like `agenda_design` / `guest_invite_design`.

The backend work is two fields, both nullable and both independent of each
other:

1. **`countdown_rsvp_design`** on the partner template, identical in shape to
   `guest_invite_design`: accepted on create/update, returned on read, and
   surfaced inside the event's `template_assets`.
2. **`is_countdown_photo`** on the event photo, identical in shape to
   `is_cover_photo`: the photograph the `strips` countdown is cut from (see
   [The countdown photo](#the-countdown-photo) below).

Nothing else changes. The count is computed from the event's existing
`start_date`. The form is the existing RSVP form (the guest questionnaire for
private events, the account RSVP for public ones), unchanged. The organizer's
existing `countdown_enabled` / `rsvp_enabled` switches still decide whether
each half is shown.

---

## The designs

### `countdown`

| Value     | Description |
|-----------|-------------|
| `strips`  | One of the event's photographs across the full width of the card, cut into three tall stripes, with the days, hours and minutes set at the foot of each. |
| `flip`    | A split-flap board: each digit on its own flap, turning over when the minute changes. |
| `orbit`   | A dial: the days in the centre, the hours and minutes left as two arcs round them inside a watch bezel. |
| `typeset` | The count as print between two hairlines: the days large, hours and minutes on a line beneath. |

### `rsvp`

| Value      | Description |
|------------|-------------|
| `card`     | A printed reply card: paper, a double hairline border, an R.S.V.P. mark, the form printed on it. |
| `envelope` | That reply card coming up out of an opened envelope. |
| `glass`    | The liquid-glass panel the info card has always drawn the form on, as a card of its own. |
| `inline`   | No surface: the form set straight onto the page under a short hairline. |

**Absent / `null` keeps both inside the info card.** Existing templates need no
migration and **must not be backfilled**: backfilling any value would move the
countdown and the RSVP on every live invitation using that template.

The two keys always travel together, because they move as a pair: a countdown in
its own section with the reply left in the card would split one question (how
long until, and will you come) in two.

An unrecognised value in either key (written by a newer frontend) renders that
key's first design (`strips`, `card`), because the partner did choose the
section.

---

## Data Contract

### Config object

```json
{
  "countdown": "strips",
  "rsvp": "envelope"
}
```

| Field       | Type   | Required | Allowed values                           |
|-------------|--------|----------|------------------------------------------|
| `countdown` | string | yes      | `strips`, `flip`, `orbit`, `typeset`     |
| `rsvp`      | string | yes      | `card`, `envelope`, `glass`, `inline`    |

The editor always sends the key. Moving the pair back into the card sends an
explicit `null`, which must be stored as `null` (not treated as "leave
unchanged").

### Model field

Add to the partner template model, alongside `guest_invite_design`:

```python
countdown_rsvp_design = models.JSONField(null=True, blank=True)
```

Validate on write the same way `guest_invite_design` is validated:

- it must be an object (or `null`)
- `countdown` must be present and one of the four values above
- `rsvp` must be present and one of the four values above

```json
{
  "success": false,
  "errors": {
    "countdown_rsvp_design": ["countdown must be one of: strips, flip, orbit, typeset"]
  }
}
```

### Endpoints

`countdown_rsvp_design` goes everywhere `guest_invite_design` already appears:

1. **`POST /api/events/partner-templates/`**: accept it as a JSON-encoded string
   inside `multipart/form-data`.
2. **`PATCH/PUT /api/events/partner-templates/{id}/`**: same.
3. **`GET /api/events/partner-templates/{id}/`** and the list endpoint: return
   the parsed object (or `null`).

### Showcase payload

Put it inside the event's `template_assets` at the **top level**, next to
`guest_invite_design`:

```json
{
  "template_assets": {
    "info_card_design": { "type": "frosted", "map_style": "arch" },
    "guest_invite_design": { "type": "inscribed" },
    "countdown_rsvp_design": { "countdown": "orbit", "rsvp": "card" }
  }
}
```

This applies to every endpoint that already carries `guest_invite_design`:

- `GET /api/events/{id}/showcase/`
- the public template-assets endpoint used by the catalogue preview
  (`public_template_assets`)

---

## The countdown photo

The `strips` design is cut from one of the event's photographs, and the
organizer chooses which, in the Design Studio (tapping the strips opens a
picker, then a framing editor showing the three stripes). The choice is a
setting on the photo, exactly like `is_cover_photo`:

```json
{
  "id": 812,
  "image": "https://…/photo.webp",
  "is_featured": false,
  "is_cover_photo": false,
  "is_countdown_photo": true,
  "crop_x": 12.5, "crop_y": 0, "crop_width": 60, "crop_height": 100
}
```

| Field                | Type           | Default | Notes |
|----------------------|----------------|---------|-------|
| `is_countdown_photo` | boolean / null | `false` | At most one photo per event should carry `true`. |

```python
is_countdown_photo = models.BooleanField(default=False)
```

- **Accept it on the photo PATCH** (`PATCH /api/events/{event_id}/photos/{id}/`)
  and **return it on every photo read**: the media list, and the photos inside
  `GET /api/events/{id}/showcase/`.
- **Echo it back in the PATCH response.** The frontend treats a response
  without the field as "this server doesn't store it yet", says so, and keeps
  nothing, the same check it makes for `is_cover_photo`.
- **One per event is the frontend's job.** Choosing a new photo sends `true`
  on it first and then `false` on the old one. The backend may also enforce
  uniqueness (clearing any other photo when one is set), which is harmless.
- **The framing is the photo's existing `crop_*`.** Nothing new: one region
  per photo, shared with every other place the photo appears.
- **No migration, no backfill.** With no photo marked, the strips use the
  featured photo, then the first photo. A marked photo leaves the invitation's
  gallery while the strips draw it, as a cover-frame photo and a band photo do;
  that is decided on the client.

---

## Acceptance Criteria

- [ ] Partner-template create accepts `countdown_rsvp_design` (JSON string in
      form-data) and persists it.
- [ ] Partner-template update accepts and updates the field; sending `null`
      clears it.
- [ ] A missing or unknown `countdown` / `rsvp` returns `400` with a
      field-specific error.
- [ ] Partner-template read endpoints return the field (object or `null`).
- [ ] The event showcase payload and `public_template_assets` expose it under
      `template_assets.countdown_rsvp_design`.
- [ ] Existing templates (no value stored) keep the countdown and RSVP inside
      the info card: no migration, no backfill.
- [ ] Event photos accept `is_countdown_photo` on PATCH, echo it in the
      response, and return it on the media list and in the showcase payload.

---

## Frontend files touched (for reference)

| File | Role |
|------|------|
| [template.types.ts](../../src/services/api/types/template.types.ts) | `CountdownDesignType` / `RsvpDesignType` / `CountdownRsvpDesignConfig`, the field on `PartnerTemplate` and the create/update payload |
| [useEventShowcase.ts](../../src/composables/useEventShowcase.ts) | `countdown_rsvp_design` on `TemplateAssets` |
| [templates.service.ts](../../src/services/api/modules/templates.service.ts) | appends the JSON string on create + update |
| [countdown-rsvp/](../../src/components/showcase/countdown-rsvp/) | the section, its clock and rules (`countdownRsvp.ts`), the four countdowns and the four RSVP shells |
| [EventInfo.vue](../../src/components/showcase/EventInfo.vue) | stops drawing the countdown and RSVP while the section has them |
| [MainContentStage.vue](../../src/components/showcase/MainContentStage.vue) | places the section after the info card, and draws the RSVP form in whichever of the two is active |
| [countdownRsvpDesign.ts](../../src/components/template/config/countdownRsvpDesign.ts) | form state (`card` ↔ `null`), hydration, payload |
| [event.types.ts](../../src/services/api/types/event.types.ts) | `CountdownPhotoFields` (`is_countdown_photo`) on `EventPhoto` |
| [CoverPhotoEditor.vue](../../src/components/showcase-preview/editors/CoverPhotoEditor.vue) | the studio's picker + framing editor, with `role="countdown"` |
| [ContentSection.vue](../../src/components/template/sections/ContentSection.vue) | the **Countdown & RSVP** placement and the two design pickers |
