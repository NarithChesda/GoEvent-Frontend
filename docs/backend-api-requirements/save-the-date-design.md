# Backend API Requirements: Save the Date Design (Transition Stage Title Card)

> **Status: PENDING** — Frontend is complete and bound to
> `template_assets.save_the_date_design`. Until the backend serves the field, every
> template reads as absent, which renders each transition stage's original design —
> i.e. the showcase is unchanged, and the partner form's picker cannot persist.

## Overview

The showcase's **transition stage** — the beat between the cover and the
invitation — carries a "Save the Date" title card over the featured photograph.
There are two transition stages (`decoration` and `door`, paired with the cover
animation by `cover_stage_layout.showcaseAnimationType`), and each one used to
have its title card hard-coded.

Both now render the same **six** compositions, chosen per **template** by a small
JSON config named `save_the_date_design`, sent inside the template package and
forwarded to the showcase exactly like the existing `host_info_design` /
`event_details_design` / `info_card_design` configs.

The backend work is identical in shape to `host_info_design`: add one nullable
JSON field to the partner-template model, accept it on create/update (sent as a
JSON-encoded string inside `multipart/form-data`), return it on read, and surface
it inside the event's `template_assets` payload.

| `type`      | Description |
|-------------|-------------|
| `script`    | Italic script label blooming in letter by letter between two fine hairlines that draw outward from centre, long date tracked out beneath. **The decoration transition's original.** |
| `engraved`  | Ornament rules top and bottom bracketing a tracked uppercase label, a large `DD · MM · YYYY` numeral, and the long date, every line arriving on a centre-out wipe. **The door transition's original.** |
| `minimal`   | No rules, no ornament: a small tracked label over the long date set large. |
| `columns`   | A large day flanked by the month and year as tracked-caps labels, divided by vertical hairlines, under a tracked eyebrow, weekday beneath. |
| `medallion` | A drawn hairline ring with the day numeral inside, month and year tracked below, label above. |
| `poster`    | `SAVE` / `THE DATE` stacked large at tight leading, each line mask-revealed from below, numeric date under a hairline. |

## The one thing that differs from `host_info_design`

`host_info_design` has a **single** global default (`standard`). This field's
default is **per stage**:

| Field value | Decoration transition renders | Door transition renders |
|-------------|-------------------------------|-------------------------|
| absent / `null` | `script` | `engraved` |
| `"script"` … `"poster"` | that design | that design |

That is what makes this fully backward compatible: an existing template has no
stored value, so each stage keeps the card it shipped with and nothing about the
live showcase changes. **The backend needs no knowledge of this** — it stores and
returns the value verbatim, and `null` is a valid stored state that must survive
a round trip. The frontend's partner form models the absent state as an explicit
`Match the transition` option, which persists as `null` rather than as a type.

---

## Data Contract

### Config object

```json
{
  "type": "medallion"
}
```

| Field  | Type   | Required | Allowed values | Notes |
|--------|--------|----------|----------------|-------|
| `type` | string | yes      | `"script"`, `"engraved"`, `"minimal"`, `"columns"`, `"medallion"`, `"poster"` | Reject any other value (400). |

The whole `save_the_date_design` field may also be `null` (meaning "each stage
uses its own default"). It is **not** a file and carries no images — `type` is
the only key. Keep it an object (rather than a bare string) so future design
options can add sibling keys without a breaking change, matching the
`host_info_design` precedent.

---

## Required Changes

### 1. Partner Template model

Add a nullable JSON field on the partner-template model, alongside the existing
`host_info_design` / `info_card_design` / `event_details_design` JSON fields.

```python
# Example (Django) — mirror however host_info_design is defined
save_the_date_design = models.JSONField(null=True, blank=True, default=None)
```

No default needs to be stored — `null` already means "per-stage default" on the
client, and it is a value a partner can deliberately choose.

### 2. Validation

On create and update, validate the field when present:

- Accept `null` (clears the field → each stage uses its own default). This is a
  **deliberate, selectable state**, not just an unset one — do not coerce it to a
  type.
- When an object is provided, require `type` ∈ {`script`, `engraved`, `minimal`,
  `columns`, `medallion`, `poster`}.
- Reject unknown `type` values with a `400` and a field-specific error under
  `save_the_date_design`.

```json
{
  "success": false,
  "errors": {
    "save_the_date_design": ["type must be one of: script, engraved, minimal, columns, medallion, poster"]
  }
}
```

### 3. Create / Update endpoints

```
POST  /api/core-data/partner-templates/
PATCH /api/core-data/partner-templates/{id}/
```

These endpoints receive `multipart/form-data` (because templates carry image and
video uploads). The frontend sends `save_the_date_design` as a **JSON-encoded
string field** within the form data — exactly like `host_info_design`,
`info_card_design`, `falling_effect`, and `cover_stage_layout`:

```
save_the_date_design = '{"type":"medallion"}'
save_the_date_design = 'null'                  # the per-stage default
```

Backend must `JSON.parse` this string before validating/storing it. **Note the
literal `null` case** — the frontend always sends the field, so a partner
switching a template back to "Match the transition" sends the string `null`, and
that must clear the stored value rather than being read as "no change".

> Reference — frontend serialization (identical pattern to `host_info_design`):
> [src/services/api/modules/templates.service.ts](../../src/services/api/modules/templates.service.ts) (`createTemplate` / `updateTemplate`).

### 4. Read endpoints (template)

```
GET /api/core-data/partner-templates/
GET /api/core-data/partner-templates/{id}/
```

Return the stored value (object or `null`) as `save_the_date_design`, sitting
next to `host_info_design` and `info_card_design` in the serialized
`PartnerTemplate`:

```json
{
  "id": 42,
  "name": "Elegant Wedding",
  "event_details_design": { "type": "calendar" },
  "host_info_design": { "type": "arch" },
  "info_card_design": { "type": "engraved" },
  "save_the_date_design": { "type": "medallion" }
}
```

### 5. Event showcase payload (most important for rendering)

The showcase reads the design from the event's `template_assets`, **not** from
the partner-template endpoint. Wherever the backend assembles `template_assets`
for an event (the same place that already emits `host_info_design`), include the
template's `save_the_date_design`:

```json
{
  "event": {
    "id": "…",
    "template_assets": {
      "cover_stage_layout": { "...": "..." },
      "host_info_design": { "type": "arch" },
      "save_the_date_design": { "type": "medallion" }
    }
  }
}
```

If the template has no value, emit `null` (or omit the key) — the frontend falls
back per stage either way.

> Reference — frontend consumption:
> [src/views/EventShowcaseRefactored.vue](../../src/views/EventShowcaseRefactored.vue)
> reads `event.template_assets.save_the_date_design` and passes it to both
> `TransitionStage.vue` and `TransitionStageDoor.vue`, which hand it to
> `save-the-date/SaveTheDate.vue`.

---

## Acceptance Criteria

- [ ] Partner-template create accepts `save_the_date_design` (JSON string in
      form-data) and persists it.
- [ ] Partner-template update accepts and updates the field; sending the string
      `null` clears it, and a cleared field round-trips as `null` on the next read.
- [ ] Invalid `type` values return `400` with a field-specific error.
- [ ] Partner-template read endpoints return the field (object or `null`).
- [ ] Event showcase payload exposes the field under
      `template_assets.save_the_date_design`.
- [ ] Existing templates (no value stored) continue to work — the decoration
      transition renders `script` and the door transition renders `engraved`, as
      they do today. No migration/backfill required, and backfilling would be
      **wrong**: writing a type where there was none pins a template to one design
      across both stages.

---

## Notes for Backend Dev

- This is intentionally a near-clone of `host_info_design`. If you copy that
  field's model definition, serializer handling, form-data parsing, and
  `template_assets` assembly, you've covered everything here.
- No new endpoints, no file handling, no images.
- The only enum to enforce is the six `type` values. Treat the object as
  extensible (don't hard-fail on future sibling keys unless you prefer strict
  validation — the current frontend only sends `type`).
- **`null` is meaningful here** in a way it isn't for `host_info_design`. Don't
  normalise it away, and don't backfill it. See the table at the top.
- **Frontend rendering scope (FYI, not a backend task):** all six designs render
  on **both** transition stages, so this field is independent of
  `cover_stage_layout.showcaseAnimationType`. It has no effect on templates whose
  events never reach a transition stage (the stage requires a basic wedding
  template with a featured photo), which is harmless — store and return the field
  unchanged regardless.
