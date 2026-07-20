# Backend API Requirements: Showcase Template Version (V1 / V2)

> **Status: PENDING** — Frontend implemented behind a temporary env-only
> toggle; backend support required to select the version per template.

## Overview

The showcase now has two entirely different presentation layers:

- **V1** (default, existing): the current cover → transition → main-content
  showcase, driven by per-template design data (`template_colors`,
  `template_fonts`, `cover_stage_layout`, `falling_effect`,
  `event_details_design`, `host_info_design`, `ambient_creatures`, etc).
- **V2 "Storybook Romance"**: a new GSAP + ScrollTrigger scroll-story
  showcase (envelope cover gate → pinned 3D story chapters → timeline agenda
  → gallery → RSVP → guestbook → footer). V2 reads `template_colors` /
  `template_fonts` the same way V1 does — see
  [showcase-v2-theming.md](showcase-v2-theming.md) — falling back to a fixed
  Storybook Romance default (ivory/blush/sage/gold/charcoal, Cormorant
  Garamond + Karla) when a template doesn't define its own. It reuses only
  the *form/logic* components from V1 (RSVP, Payment, Comments, DressCode,
  YouTube), restyled with the resolved V2 palette/font props.

Right now the version is selected entirely on the frontend, with no backend
involvement:

```
VITE_SHOWCASE_TEMPLATE_VERSION=v2
```

When set, **every wedding-category event** renders V2 — the check is
`event.category_details.name.toLowerCase() === 'wedding'`, not a per-template
choice. This is a blunt rollout switch for internal visual testing only,
exactly the same starting point `falling_effect`, `event_details_design`,
and `host_info_design` had before they became template-driven fields (see
[event-details-design.md](event-details-design.md) /
[host-info-design.md](host-info-design.md) for the precedent this doc
follows).

The ask: add a per-**template** field so a partner/admin can opt a specific
template into the V2 experience, instead of an env var forcing it onto every
wedding event.

### Why per-template, not per-category

There are two different "category" concepts already in the system, and
neither is the right place for this switch:

- **Event category** (`event.category_details` / `event.category_name`) —
  chosen when the event itself is created (wedding, birthday, etc). This is
  what today's temporary heuristic keys off, which is why it's "every
  wedding event" rather than "the events that actually bought a V2 design."
- **Template's package-plan category** (`template.package_plan.category`) —
  which package tier a template is grouped under when partners browse/pick a
  template. Multiple templates can share the same category.

An event picks a **specific template** (`event.event_template` → the
`PartnerTemplate`/`EventTemplate` row, exposed as `event.template_assets`),
and that choice is independent of category on both ends — a wedding event
can pick any wedding-category template, and two wedding templates can
reasonably differ in whether they're V1 or V2. So the version has to live on
the **template row itself** (`showcase_template_version` below), not derived
from either category field. Once it's on the template, "did this event buy
a V2 template" is just `event.template_assets.showcase_template_version ===
'v2'` — no separate purchase/version-mapping table needed, since
`template_assets` is already assembled per-event from the event's chosen
template.

---

## Data Contract

### Field

Unlike `falling_effect` / `event_details_design` (small config objects), this
is a flat enum — there's no sibling data to group, so a plain string field is
enough:

| Field                      | Type   | Required | Allowed values | Default |
|-----------------------------|--------|----------|-----------------|---------|
| `showcase_template_version` | string | no       | `"v1"`, `"v2"`  | `"v1"`  |

`null` / absent / unrecognized values must all fall back to `v1` — fully
backward compatible, no migration needed for existing templates.

```json
{ "showcase_template_version": "v2" }
```

---

## Required Changes

### 1. Partner Template model

Add a `CharField`-style field (with choices) alongside the existing template
design fields:

```python
# Example (Django)
SHOWCASE_TEMPLATE_VERSION_CHOICES = [
    ("v1", "V1 — Classic"),
    ("v2", "V2 — Storybook Romance"),
]

showcase_template_version = models.CharField(
    max_length=8,
    choices=SHOWCASE_TEMPLATE_VERSION_CHOICES,
    default="v1",
    blank=True,
)
```

### 2. Validation

- Accept `"v1"` or `"v2"` only; reject anything else with a `400` and a
  field-specific error under `showcase_template_version`.
- Optional but recommended: since V2's fixed content (couple-name monogram,
  "Our Story" chapter wording, etc.) is wedding-specific, consider warning or
  soft-restricting `showcase_template_version=v2` to templates whose
  `category` is wedding. Not a hard requirement for this pass — the frontend
  today applies V2 to all wedding *events* regardless of template, and can
  keep doing that as a fallback if this restriction isn't enforced yet.

### 3. Create / Update endpoints

```
POST  /api/core-data/partner-templates/
PATCH /api/core-data/partner-templates/{id}/
```

Same `multipart/form-data` endpoints used for the other template fields.
Since this is a plain string (not JSON-in-a-string like `falling_effect`),
send/accept it as a normal form field:

```
showcase_template_version = v2
```

Treat "absent" on `PATCH` as "no change"; on `POST` default to `v1`.

### 4. Read endpoints (template)

```
GET /api/core-data/partner-templates/
GET /api/core-data/partner-templates/{id}/
```

Return `showcase_template_version` next to the other template design fields
in the serialized `PartnerTemplate`:

```json
{
  "id": 42,
  "name": "Storybook Romance — Ivory",
  "showcase_template_version": "v2",
  "cover_stage_layout": null,
  "falling_effect": null,
  "event_details_design": null,
  "host_info_design": null
}
```

(When `showcase_template_version` is `v2`, the other design fields are
harmless to include but are ignored by the frontend — no need to null them
out server-side.)

### 5. Event showcase payload (most important for rendering)

Wherever `template_assets` is assembled for an event (same place that emits
`cover_stage_layout` / `falling_effect` today), include the template's
`showcase_template_version`:

```json
{
  "event": {
    "id": "…",
    "template_assets": {
      "showcase_template_version": "v2",
      "cover_stage_layout": null,
      "falling_effect": null
    }
  }
}
```

If absent/`null`, the frontend defaults to `v1`.

> Reference — frontend consumption: **already forward-compatible.**
> [src/views/EventShowcaseRefactored.vue](../../src/views/EventShowcaseRefactored.vue)'s
> `useV2Showcase` computed checks `event.template_assets?.showcase_template_version`
> first — if the backend sends `"v1"` or `"v2"`, that decides the version for
> that event, full stop (this is the actual "did this event's purchased
> template use v1 or v2" answer, resolved per-template rather than by
> category). Only when the field is absent (i.e. today, before this ships)
> does it fall back to the env var + `category_details.name === 'wedding'`
> heuristic. No frontend change will be needed the day this field starts
> being returned — just start sending it. The env var can be deleted once
> every template that should render v2 has the field set explicitly (same
> deprecation path `VITE_SHOWCASE_ANIMATION_TYPE` is expected to follow).

---

## Acceptance Criteria

- [ ] Partner-template create accepts `showcase_template_version` (`v1` or
      `v2`) and persists it; omitted → defaults to `v1`.
- [ ] Partner-template update accepts and updates the field.
- [ ] Invalid values return `400` with a field-specific error.
- [ ] Partner-template read endpoints return the field.
- [ ] Event showcase payload exposes the field under
      `template_assets.showcase_template_version`.
- [ ] Existing templates (no value stored) continue to work and render `v1`
      — no migration/backfill required.

---

## Notes for Backend Dev

- This is a simpler sibling of `falling_effect` / `event_details_design` —
  same field location and same `template_assets` exposure, but a flat enum
  instead of a JSON config object.
- No new endpoints, no file handling, no images.
- V2's structure (which sections exist, their order, motion) is fixed on the
  frontend regardless of this field. Its **colors and fonts**, however, are
  template-driven the same way V1's are (see
  [showcase-v2-theming.md](showcase-v2-theming.md)) — no backend schema
  change needed there, it reuses the existing `template_colors` /
  `template_fonts` CRUD with a new naming convention. Once this field ships,
  the frontend will simply stop reading the env var and the hardcoded
  `category === 'wedding'` check, and switch on this field instead.
