# Backend API Requirements: Event Details Design (Date & Location Block)

> **Status: PENDING** — Frontend implemented; backend support required.

## Overview

The showcase renders the event's **date + location** block in one of two visual
styles. The chosen style is controlled per **template** by a small JSON config
named `event_details_design`, sent inside the template package and forwarded to
the showcase exactly like the existing `falling_effect` / `ambient_creatures`
configs.

The backend work is identical in shape to `falling_effect`: add one nullable
JSON field to the partner-template model, accept it on create/update (sent as a
JSON-encoded string inside `multipart/form-data`), return it on read, and
surface it inside the event's `template_assets` payload.

Two designs exist today:

| `type`     | Description                                                                 |
|------------|-----------------------------------------------------------------------------|
| `panel`    | **Default.** Two-column framed card: stacked weekday/day/month + location.  |
| `calendar` | Full month-grid calendar with the event day circled; location moves into the map card as a centered header above the Google Map. |

When the field is absent / `null`, the frontend falls back to `panel`, so this
is fully backward compatible — existing templates need no migration.

---

## Data Contract

### Config object

```json
{
  "type": "calendar"
}
```

| Field  | Type   | Required | Allowed values         | Notes                                  |
|--------|--------|----------|------------------------|----------------------------------------|
| `type` | string | yes      | `"panel"`, `"calendar"`| Reject any other value (400).          |

The whole `event_details_design` field may also be `null` (meaning "use the
default `panel`"). It is **not** a file and carries no images — `type` is the
only key. Keep it an object (rather than a bare string) so future design options
can add sibling keys without a breaking change, matching the `falling_effect`
precedent.

---

## Required Changes

### 1. Partner Template model

Add a nullable JSON field on the partner-template model, alongside the existing
`falling_effect` / `ambient_creatures` JSON fields.

```python
# Example (Django) — mirror however falling_effect is defined
event_details_design = models.JSONField(null=True, blank=True, default=None)
```

No default design needs to be stored — `null` already means `panel` on the
client.

### 2. Validation

On create and update, validate the field when present:

- Accept `null` (clears the field → frontend uses `panel`).
- When an object is provided, require `type` ∈ {`panel`, `calendar`}.
- Reject unknown `type` values and unknown extra keys with a `400` and a
  field-specific error under `event_details_design`.

```json
{
  "success": false,
  "errors": {
    "event_details_design": ["type must be one of: panel, calendar"]
  }
}
```

### 3. Create / Update endpoints

```
POST  /api/core-data/partner-templates/
PATCH /api/core-data/partner-templates/{id}/
```

These endpoints receive `multipart/form-data` (because templates carry image and
video uploads). The frontend sends `event_details_design` as a **JSON-encoded
string field** within the form data — exactly like `falling_effect`,
`cover_stage_layout`, and `ambient_creatures`:

```
event_details_design = '{"type":"calendar"}'
```

Backend must `JSON.parse` this string before validating/storing it. As with
`falling_effect`, the field is only present in the form when the frontend
includes it; treat "absent" as "no change" on PATCH and "use default" on POST.

> Reference — frontend serialization (identical pattern to `falling_effect`):
> [src/services/api/modules/templates.service.ts](../../src/services/api/modules/templates.service.ts) (`createTemplate` / `updateTemplate`).

### 4. Read endpoints (template)

```
GET /api/core-data/partner-templates/
GET /api/core-data/partner-templates/{id}/
```

Return the stored value (object or `null`) as `event_details_design`, sitting
next to `falling_effect` and `ambient_creatures` in the serialized
`PartnerTemplate`:

```json
{
  "id": 42,
  "name": "Elegant Wedding",
  "falling_effect": { "type": "petals", "intensity": "normal" },
  "ambient_creatures": null,
  "event_details_design": { "type": "calendar" },
  "cover_stage_layout": { "...": "..." }
}
```

### 5. Event showcase payload (most important for rendering)

The showcase reads the design from the event's `template_assets`, **not** from
the partner-template endpoint. Wherever the backend assembles `template_assets`
for an event (the same place that already emits `cover_stage_layout` and
`falling_effect`), include the template's `event_details_design`:

```json
{
  "event": {
    "id": "…",
    "template_assets": {
      "cover_stage_layout": { "...": "..." },
      "falling_effect": { "type": "petals", "intensity": "normal" },
      "event_details_design": { "type": "calendar" }
    }
  }
}
```

If the template has no value, emit `null` (or omit the key) — the frontend
defaults to `panel` either way.

> Reference — frontend consumption:
> [src/views/EventShowcaseRefactored.vue](../../src/views/EventShowcaseRefactored.vue)
> reads `event.template_assets.event_details_design` and passes it down through
> `MainContentStage.vue` → `EventInfo.vue`.

---

## Acceptance Criteria

- [ ] Partner-template create accepts `event_details_design` (JSON string in
      form-data) and persists it.
- [ ] Partner-template update accepts and updates the field; sending `null`
      clears it.
- [ ] Invalid `type` values return `400` with a field-specific error.
- [ ] Partner-template read endpoints return the field (object or `null`).
- [ ] Event showcase payload exposes the field under
      `template_assets.event_details_design`.
- [ ] Existing templates (no value stored) continue to work and render the
      `panel` design — no migration/backfill required.

---

## Notes for Backend Dev

- This is intentionally a near-clone of `falling_effect`. If you copy that
  field's model definition, serializer handling, form-data parsing, and
  `template_assets` assembly, you've covered everything here.
- No new endpoints, no file handling, no images.
- The only enum to enforce is `type ∈ {panel, calendar}`. Treat the object as
  extensible (don't hard-fail on future sibling keys unless you prefer strict
  validation — current frontend only sends `type`).
