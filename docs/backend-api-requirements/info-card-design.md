# Backend API Requirements: Info Card Design (Venue / Map / Countdown / RSVP Block)

> **Status: PENDING** — Frontend is implemented and bound to
> `template_assets.info_card_design`. Until the backend serves the field the
> value is always absent, so every template renders the `glass` default and
> nothing changes visually. No migration or backfill is needed.

## Overview

Below the event date, the showcase renders one block carrying the **venue, the
Google Map, the countdown and the RSVP form**. It now has two visual treatments,
chosen per **template** by a small JSON config named `info_card_design`, sent
inside the template package and forwarded to the showcase exactly like the
existing `event_details_design` / `host_info_design` / `falling_effect` configs.

The backend work is identical in shape to `host_info_design`: add one nullable
JSON field to the partner-template model, accept it on create/update (sent as a
JSON-encoded string inside `multipart/form-data`), return it on read, and
surface it inside the event's `template_assets` payload.

Two designs exist today:

| `type`     | Description                                                                                                                                                 |
|------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `glass`    | **Default.** The original liquid-glass panel: 2rem radius, 2px white border, tinted translucent fill, backdrop blur, white type, large condensed countdown.   |
| `engraved` | The same content set as ink on the page ground: hairline rules instead of a card frame, everything in the template's primary colour, map mounted as a plate. |

`engraved` exists because the `calendar` / `flanked` / `arch` date designs are
drawn as *type on paper* (hairline rules, inked letterforms) while the glass
card is a *material*, and stacking the two makes them read as two documents.
It is selectable under any date design; the ones that draw their own top/bottom
rules additionally give theirs up so the two blocks share one seam.

When the field is absent / `null`, the frontend falls back to `glass`, so this
is fully backward compatible.

---

## Data Contract

### Config object

```json
{
  "type": "engraved"
}
```

| Field  | Type   | Required | Allowed values           | Notes                         |
|--------|--------|----------|--------------------------|-------------------------------|
| `type` | string | yes      | `"glass"`, `"engraved"`  | Reject any other value (400). |

The whole `info_card_design` field may also be `null` (meaning "use the default
`glass`"). It is **not** a file and carries no images — `type` is the only key.
Keep it an object rather than a bare string so future treatments can add sibling
keys without a breaking change, matching the `event_details_design` precedent.

---

## Required Changes

### 1. Partner Template model

Add a nullable JSON field on the partner-template model, alongside the existing
`event_details_design` / `host_info_design` / `falling_effect` JSON fields.

```python
# Example (Django) — mirror however host_info_design is defined
info_card_design = models.JSONField(null=True, blank=True, default=None)
```

No default needs to be stored — `null` already means `glass` on the client.

### 2. Validation

On create and update, validate the field when present:

- Accept `null` (clears the field → frontend uses `glass`).
- When an object is provided, require `type` ∈ {`glass`, `engraved`}.
- Reject unknown `type` values with a `400` and a field-specific error under
  `info_card_design`.

```json
{
  "success": false,
  "errors": {
    "info_card_design": ["type must be one of: glass, engraved"]
  }
}
```

### 3. Create / Update endpoints

```
POST  /api/core-data/partner-templates/
PATCH /api/core-data/partner-templates/{id}/
```

These endpoints receive `multipart/form-data` (templates carry image and video
uploads). The frontend sends `info_card_design` as a **JSON-encoded string
field** within the form data — exactly like `host_info_design`,
`event_details_design`, `falling_effect`, and `cover_stage_layout`:

```
info_card_design = '{"type":"engraved"}'
```

Backend must `JSON.parse` this string before validating/storing it. The field is
only present in the form when the frontend includes it; treat "absent" as "no
change" on PATCH and "use default" on POST.

> Reference — frontend serialization:
> [src/services/api/modules/templates.service.ts](../../src/services/api/modules/templates.service.ts)
> (`createTemplate` / `updateTemplate`).

### 4. Read endpoints (template)

```
GET /api/core-data/partner-templates/
GET /api/core-data/partner-templates/{id}/
```

Return the stored value (object or `null`) as `info_card_design`, sitting next
to `event_details_design` and `host_info_design` in the serialized
`PartnerTemplate`:

```json
{
  "id": 42,
  "name": "Elegant Wedding",
  "event_details_design": { "type": "calendar" },
  "host_info_design": { "type": "simple" },
  "info_card_design": { "type": "engraved" },
  "cover_stage_layout": { "...": "..." }
}
```

### 5. Event showcase payload (most important for rendering)

The showcase reads the design from the event's `template_assets`, **not** from
the partner-template endpoint. Wherever the backend assembles `template_assets`
for an event (the same place that already emits `event_details_design` and
`host_info_design`), include the template's `info_card_design`:

```json
{
  "event": {
    "id": "…",
    "template_assets": {
      "event_details_design": { "type": "calendar" },
      "host_info_design": { "type": "simple" },
      "info_card_design": { "type": "engraved" }
    }
  }
}
```

If the template has no value, emit `null` (or omit the key) — the frontend
defaults to `glass` either way.

> Reference — frontend consumption:
> [src/views/EventShowcaseRefactored.vue](../../src/views/EventShowcaseRefactored.vue)
> reads `event.template_assets.info_card_design` and passes it down through
> `MainContentStage.vue` → `EventInfo.vue`.

---

## Acceptance Criteria

- [ ] Partner-template create accepts `info_card_design` (JSON string in
      form-data) and persists it.
- [ ] Partner-template update accepts and updates the field; sending `null`
      clears it.
- [ ] Invalid `type` values return `400` with a field-specific error.
- [ ] Partner-template read endpoints return the field (object or `null`).
- [ ] Event showcase payload exposes the field under
      `template_assets.info_card_design`.
- [ ] Existing templates (no value stored) continue to work and render the
      `glass` design — no migration/backfill required.

---

## Notes for Backend Dev

- This is intentionally a near-clone of `host_info_design`. If you copy that
  field's model definition, serializer handling, form-data parsing, and
  `template_assets` assembly, you've covered everything here.
- No new endpoints, no file handling, no images.
- The only enum to enforce is `type ∈ {glass, engraved}`.
- **Frontend rendering scope (FYI, not a backend task):** `engraved` re-inks the
  slotted RSVP form (`RSVPSection` / `GuestRSVPSection`) from the info card's own
  stylesheet, so it applies to both the public and private RSVP flows without
  either component needing to know about the setting. The map iframe is Google's
  and keeps its own colours; only its frame changes.
