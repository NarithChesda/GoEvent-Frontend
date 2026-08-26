# Backend API Requirements: Host Info Design (Host Information Block)

> **Status: IN VERIFICATION** — Frontend is bound directly to
> `template_assets.host_info_design` (dev override removed). Backend implemented;
> verifying the contract below end-to-end.

## Overview

The showcase renders the event's **host information** block in one of two visual
styles. The chosen style is controlled per **template** by a small JSON config
named `host_info_design`, sent inside the template package and forwarded to the
showcase exactly like the existing `event_details_design` / `falling_effect` /
`ambient_creatures` configs.

The backend work is identical in shape to `event_details_design`: add one
nullable JSON field to the partner-template model, accept it on create/update
(sent as a JSON-encoded string inside `multipart/form-data`), return it on read,
and surface it inside the event's `template_assets` payload.

Four designs exist today:

| `type`     | Description                                                                                          |
|------------|------------------------------------------------------------------------------------------------------|
| `standard` | **Default.** Rich layout: welcome header, parent names, logo, host titles, host names, profile photos. |
| `simple`   | Minimal layout: the welcome header above large script host names stacked and joined by an ampersand. |
| `portrait` | The `standard` layout with one row moved — title, then photo, then name — so the label introduces the person, the photo shows them and the name closes. |
| `arch`     | The showcase-v2 couple-story composition: two arch-framed portraits staged on a diagonal, each host's title, name and parents stacked under their own frame. Renders no logo. |

When the field is absent / `null`, the frontend falls back to `standard`, so this
is fully backward compatible — existing templates need no migration.

---

## Data Contract

### Config object

```json
{
  "type": "simple"
}
```

| Field  | Type   | Required | Allowed values            | Notes                                  |
|--------|--------|----------|---------------------------|----------------------------------------|
| `type` | string | yes      | `"standard"`, `"simple"`, `"portrait"`, `"arch"` | Reject any other value (400). |

The whole `host_info_design` field may also be `null` (meaning "use the default
`standard`"). It is **not** a file and carries no images — `type` is the only
key. Keep it an object (rather than a bare string) so future design options can
add sibling keys without a breaking change, matching the `event_details_design`
precedent.

---

## Required Changes

### 1. Partner Template model

Add a nullable JSON field on the partner-template model, alongside the existing
`event_details_design` / `falling_effect` / `ambient_creatures` JSON fields.

```python
# Example (Django) — mirror however event_details_design is defined
host_info_design = models.JSONField(null=True, blank=True, default=None)
```

No default design needs to be stored — `null` already means `standard` on the
client.

### 2. Validation

On create and update, validate the field when present:

- Accept `null` (clears the field → frontend uses `standard`).
- When an object is provided, require `type` ∈ {`standard`, `simple`, `portrait`, `arch`}.
- Reject unknown `type` values and unknown extra keys with a `400` and a
  field-specific error under `host_info_design`.

```json
{
  "success": false,
  "errors": {
    "host_info_design": ["type must be one of: standard, simple, portrait, arch"]
  }
}
```

### 3. Create / Update endpoints

```
POST  /api/core-data/partner-templates/
PATCH /api/core-data/partner-templates/{id}/
```

These endpoints receive `multipart/form-data` (because templates carry image and
video uploads). The frontend sends `host_info_design` as a **JSON-encoded string
field** within the form data — exactly like `event_details_design`,
`falling_effect`, `cover_stage_layout`, and `ambient_creatures`:

```
host_info_design = '{"type":"simple"}'
```

Backend must `JSON.parse` this string before validating/storing it. As with
`event_details_design`, the field is only present in the form when the frontend
includes it; treat "absent" as "no change" on PATCH and "use default" on POST.

> Reference — frontend serialization (identical pattern to `event_details_design`):
> [src/services/api/modules/templates.service.ts](../../src/services/api/modules/templates.service.ts) (`createTemplate` / `updateTemplate`).

### 4. Read endpoints (template)

```
GET /api/core-data/partner-templates/
GET /api/core-data/partner-templates/{id}/
```

Return the stored value (object or `null`) as `host_info_design`, sitting next to
`event_details_design`, `falling_effect`, and `ambient_creatures` in the
serialized `PartnerTemplate`:

```json
{
  "id": 42,
  "name": "Elegant Wedding",
  "falling_effect": { "type": "petals", "intensity": "normal" },
  "ambient_creatures": null,
  "event_details_design": { "type": "calendar" },
  "host_info_design": { "type": "simple" },
  "cover_stage_layout": { "...": "..." }
}
```

### 5. Event showcase payload (most important for rendering)

The showcase reads the design from the event's `template_assets`, **not** from
the partner-template endpoint. Wherever the backend assembles `template_assets`
for an event (the same place that already emits `cover_stage_layout`,
`falling_effect`, and `event_details_design`), include the template's
`host_info_design`:

```json
{
  "event": {
    "id": "…",
    "template_assets": {
      "cover_stage_layout": { "...": "..." },
      "falling_effect": { "type": "petals", "intensity": "normal" },
      "event_details_design": { "type": "calendar" },
      "host_info_design": { "type": "simple" }
    }
  }
}
```

If the template has no value, emit `null` (or omit the key) — the frontend
defaults to `standard` either way.

> Reference — frontend consumption:
> [src/views/EventShowcaseRefactored.vue](../../src/views/EventShowcaseRefactored.vue)
> reads `event.template_assets.host_info_design` and passes it down through
> `MainContentStage.vue` → `HostInfo.vue` → the host-layout variant.

---

## Acceptance Criteria

- [ ] Partner-template create accepts `host_info_design` (JSON string in
      form-data) and persists it.
- [ ] Partner-template update accepts and updates the field; sending `null`
      clears it.
- [ ] Invalid `type` values return `400` with a field-specific error.
- [ ] Partner-template read endpoints return the field (object or `null`).
- [ ] Event showcase payload exposes the field under
      `template_assets.host_info_design`.
- [ ] Existing templates (no value stored) continue to work and render the
      `standard` design — no migration/backfill required.

---

## Notes for Backend Dev

- This is intentionally a near-clone of `event_details_design`. If you copy that
  field's model definition, serializer handling, form-data parsing, and
  `template_assets` assembly, you've covered everything here.
- No new endpoints, no file handling, no images.
- The only enum to enforce is `type ∈ {standard, simple, portrait, arch}`. Treat the object as
  extensible (don't hard-fail on future sibling keys unless you prefer strict
  validation — current frontend only sends `type`).
- **Frontend rendering scope (FYI, not a backend task):** `simple`, `portrait`
  and `arch` are all implemented by the **wedding** host layout only. Other
  event-type host layouts ignore `host_info_design` and always render their
  `standard` look — setting any of the three on a non-wedding template is
  harmless and simply renders standard. The backend should still store/return
  the field unchanged regardless of event type.

> The dev-only `VITE_FORCE_HOST_INFO_DESIGN` env override has been **removed**.
> The showcase now binds `:host-info-design` directly to
> `event.template_assets?.host_info_design`, so the rendered design comes solely
> from the backend-served value (falling back to `standard` when absent/`null`).
