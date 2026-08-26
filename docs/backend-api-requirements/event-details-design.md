# Backend API Requirements: Event Details Design (Date & Location Block)

> **Status: PENDING** — Frontend implemented; backend support required.
>
> **Updated 2026-08-26 — three new `type` values.** If you have already built
> this field, the only change you need is **widening the `type` enum from 2
> values to 5** and **allowing the marker keys on every non-`panel` type**. The
> field name, shape, storage, form-data encoding, and `template_assets`
> plumbing are all unchanged. If you have not built it yet, just read the whole
> document — nothing below is stale.
>
> | | Before | Now |
> |---|---|---|
> | `type` | `panel`, `calendar` | `panel`, `calendar`, `flanked`, `arch`, `ticket` |
> | marker keys apply to | `calendar` only | every type except `panel` |

## Overview

The showcase renders the event's **date + location** block in one of five visual
styles. The chosen style is controlled per **template** by a small JSON config
named `event_details_design`, sent inside the template package and forwarded to
the showcase exactly like the existing `falling_effect` / `ambient_creatures`
configs.

The backend work is identical in shape to `falling_effect`: add one nullable
JSON field to the partner-template model, accept it on create/update (sent as a
JSON-encoded string inside `multipart/form-data`), return it on read, and
surface it inside the event's `template_assets` payload.

Five designs exist today:

| `type`     | Description                                                                 | Venue rendered |
|------------|-----------------------------------------------------------------------------|----------------|
| `panel`    | **Default.** Two-column framed card: stacked weekday/day/month + location.  | in the block |
| `calendar` | Full month-grid calendar with the event day circled.                        | map card header |
| `flanked`  | Engraved-invitation typography: weekday \| day numeral \| month on one baseline split by vertical hairlines, year + time beneath. No card frame. | map card header |
| `arch`     | The date set inside a hairline arch that draws itself on reveal; the arch's height follows its content. | map card header |
| `ticket`   | An admit-one stub: a die-cut rounded card split by a dashed perforation, date on the stub, weekday/time + venue beside it. | in the block |

The **Venue rendered** column is purely a client-side rendering decision and needs
no backend involvement — it is listed only so the behaviour isn't mistaken for a
bug. `calendar`, `flanked` and `arch` are date *marks*, so the location text
moves into the map card as a centred header above the Google Map; `panel` and
`ticket` set it inside the block itself. The same `location_text` event text
feeds all five.

Every design except `panel` needs a parseable event `start_date`; without one
the frontend silently falls back to `panel`. No backend action — just don't be
surprised if a `ticket` template renders as `panel` on a dateless event.

When the field is absent / `null`, the frontend falls back to `panel`, so this
is fully backward compatible — existing templates need no migration.

---

## Data Contract

### Config object

```json
{
  "type": "calendar",
  "marker_color_source": "accent",
  "marker_custom_color": "#B3261E"
}
```

| Field                 | Type           | Required | Allowed values                                       | Notes                                                                 |
|-----------------------|----------------|----------|------------------------------------------------------|-----------------------------------------------------------------------|
| `type`                | string         | yes      | `"panel"`, `"calendar"`, `"flanked"`, `"arch"`, `"ticket"` | Reject any other value (400).                                   |
| `marker_color_source` | string         | no       | `"accent"`, `"primary"`, `"secondary"`, `"custom"`   | Every type except `panel`. Defaults to `accent` when absent.           |
| `marker_custom_color` | string \| null | no       | Hex colour (`#RRGGBB`)                               | Only read when `marker_color_source` is `custom`.                      |

The whole `event_details_design` field may also be `null` (meaning "use the
default `panel`"). It is **not** a file and carries no images. Keep it an object
(rather than a bare string) so future design options can add sibling keys without
a breaking change, matching the `falling_effect` precedent.

`marker_color_source` / `marker_custom_color` control the colour of the design's
single **accent mark**. Each design spends it on exactly one element:

| `type`     | What the accent colour paints |
|------------|-------------------------------|
| `calendar` | The hand-drawn heart circling the event day, and the matching tint on the day number |
| `flanked`  | The two vertical hairlines flanking the day numeral |
| `arch`     | The arch outline |
| `ticket`   | The dashed perforation and the stub's day numeral |
| `panel`    | *(nothing — this design has no accent mark)* |

It mirrors `falling_effect.color_source` /
`falling_effect.custom_color`: the named sources resolve against the template's
own colour palette on the client, so no colour value needs storing for them. This
replaced a hardcoded red that could vanish against a red template background.

The frontend sends the marker keys for every `type` except `panel`, and treats a
missing `marker_color_source` as `accent`.

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
- When an object is provided, require `type` ∈ {`panel`, `calendar`, `flanked`,
  `arch`, `ticket`}.
- When present, require `marker_color_source` ∈ {`accent`, `primary`,
  `secondary`, `custom`} and `marker_custom_color` to be a hex colour or `null`.
  Both are optional — absent means "use the client default" (`accent`).
- Reject unknown `type` values and unknown extra keys with a `400` and a
  field-specific error under `event_details_design`.

```json
{
  "success": false,
  "errors": {
    "event_details_design": ["type must be one of: panel, calendar, flanked, arch, ticket"]
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
event_details_design = '{"type":"calendar","marker_color_source":"accent"}'
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
- [ ] All five `type` values round-trip through create, update, and both read
      paths.
- [ ] Invalid `type` values return `400` with a field-specific error.
- [ ] `marker_color_source` / `marker_custom_color` round-trip unchanged through
      create, update, and both read paths (including `template_assets`).
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
- The enums to enforce are
  `type ∈ {panel, calendar, flanked, arch, ticket}` and
  `marker_color_source ∈ {accent, primary, secondary, custom}`. Treat the object
  as extensible (don't hard-fail on future sibling keys unless you prefer strict
  validation).
- The marker keys are pure pass-through: the backend never resolves a colour
  slot to a hex value — the showcase does that against the template palette it
  already ships.
