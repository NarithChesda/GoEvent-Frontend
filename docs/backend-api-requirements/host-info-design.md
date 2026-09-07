# Backend API Requirements: Host Info Design (Host Information Block)

> **Status: IN VERIFICATION** — Frontend is bound directly to
> `template_assets.host_info_design` (dev override removed). Backend implemented;
> verifying the contract below end-to-end.
>
> **PENDING (added with the `crest` design):** four new optional keys on the same
> config object — `divider_style`, `divider_scale`, `logo_scale`, `top_offset` —
> plus **one genuinely new model field**, the image `host_divider_image`. The
> keys need no migration (see §2); the image does (see §6). Everything already
> shipped is unchanged.

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

Five designs exist today:

| `type`     | Description                                                                                          |
|------------|------------------------------------------------------------------------------------------------------|
| `standard` | **Default.** Rich layout: welcome header, parent names, logo, host titles, host names, profile photos. |
| `simple`   | Minimal layout: the welcome header above large script host names stacked and joined by an ampersand. |
| `portrait` | The `standard` layout with one row moved — title, then photo, then name — so the label introduces the person, the photo shows them and the name closes. |
| `arch`     | The showcase-v2 couple-story composition: two arch-framed portraits staged on a diagonal, each host's title, name and parents stacked under their own frame. Renders no logo. |
| `crest`    | The Khmer wedding-card order, read top to bottom: the crest (logo), the two sets of parents, the invitation sentence, the couple either side of the shared centre motif, and the partner's own horizontal breakline closing the block. Renders **no** profile photos, and **no** welcome header — the invitation sentence takes that slot. |

When the field is absent / `null`, the frontend falls back to `standard`, so this
is fully backward compatible — existing templates need no migration.

---

## Data Contract

### Config object

```json
{
  "type": "portrait",
  "frame_style": "banner",
  "couple_ornament": "heart",
  "divider_style": "rule",
  "divider_scale": 100,
  "logo_scale": 100,
  "top_offset": 0
}
```

| Field  | Type   | Required | Allowed values            | Notes                                  |
|--------|--------|----------|---------------------------|----------------------------------------|
| `type` | string | yes      | `"standard"`, `"simple"`, `"portrait"`, `"arch"`, `"crest"` | Reject any other value (400). |
| `frame_style` | string | no | `"none"`, `"banner"`, `"plaque"`, `"ribbon"`, `"laurel"` | Defaults to `"none"`. |
| `couple_ornament` | string | no | `"none"`, `"heart"`, `"rings"`, `"knot"`, `"bloom"` | Defaults to `"none"`. |
| `divider_style` | string | no | `"none"`, `"rule"`, `"diamond"`, `"lotus"`, `"flourish"` | The horizontal breakline under `crest`'s couple. Defaults to `"rule"`. |
| `divider_scale` | number | no | 40–200 | **Percent** of the block's width for that breakline; 100 is half the block. Defaults to 100. |
| `logo_scale` | number | no | 40–250 | **Percent** of the breakpoint's own logo cap. Defaults to 100. Read by `standard`, `portrait` and `crest`. |
| `top_offset` | number | no | −4 to 16 | Where the host block starts, in **rem**. Defaults to 0. Read by **every** design. |

The whole `host_info_design` field may also be `null` (meaning "use the default
`standard`"). It is **not** a file and carries no images.

> **`frame_style` and `couple_ornament` are the sibling keys this doc predicted.**
> They were added exactly as the original note below anticipated — as extra keys
> on the same object, not as new fields — so there is **no new model field, no
> new migration and no new endpoint**. If your serializer already stores and
> returns `host_info_design` as an opaque JSON object, they may already work; the
> only backend change needed is validating the two new keys.

**`frame_style`** is one choice drawn twice — around the host's title *and*
around their avatar — so the pair always match. **`couple_ornament`** is the
motif drawn between the two hosts. Both are rendered by the `standard` and
`portrait` layouts only; `arch` draws its own frames and `simple` has neither a
title nor an avatar, so both ignore them (harmless — store and return unchanged
regardless of `type`).

Both default to `"none"`, which is the look every template had before these
existed — so this is fully backward compatible and **must not be backfilled**.

### `couple_ornament` is now read by `crest` too

No contract change — the same key, the same five values. It is simply drawn in
whichever position the design has for it: beside the avatars on `standard` /
`portrait`, and between the two names on `crest`, which has no avatars. `simple`
and `arch` still ignore it.

### `divider_style` is a different slot from `couple_ornament`

`couple_ornament` is the mark **between** the two hosts; `divider_style` is the
rule **under** them, closing the block. They never compete, so a `crest`
template may carry both and usually will. Store and return both regardless of
`type`.

A custom breakline image (§6) **overrides** `divider_style` on the client the
moment one is uploaded — see the note there. There is deliberately no `custom`
member of the enum.

### The three numbers, and which designs read them

Only `divider_scale` is crest-specific. The other two are about **placement**,
which every design has:

| Key | Read by | What it sizes |
|-----|---------|----------------|
| `divider_scale` | `crest` | The breakline (§6) — drawn style and uploaded artwork alike — as a share of the block's width. |
| `logo_scale` | `standard`, `portrait`, `crest` | The logo, against the breakpoint's own cap. `simple` and `arch` draw none. |
| `top_offset` | all five | Where the whole host block starts, in `rem`. May be negative. |

Both scales are **percentages of a responsive base**, not absolute sizes — the
logo cap alone runs from 100px on a small phone to 180px on a desktop, so one
absolute value would be chosen on whichever screen the partner happened to be
previewing on.

Unlike `frame_style` / `couple_ornament`, these four have **non-`none` defaults**
(`rule`, 100, 100, 0). Still do not backfill them onto stored configs: absent is
the same as the default everywhere, and writing them in only makes future
default changes impossible.

Ranges above are what the editor's sliders offer, not a validation contract —
clamp rather than reject if you validate them at all, since a stored value
outside the range still renders.

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
- When an object is provided, require `type` ∈ {`standard`, `simple`, `portrait`, `arch`, `crest`}.
- When present, require `frame_style` ∈ {`none`, `banner`, `plaque`, `ribbon`, `laurel`}
  and `couple_ornament` ∈ {`none`, `heart`, `rings`, `knot`, `bloom`}. Both are
  optional; absent means `none`.
- Reject unknown values for any of the three with a `400` and a field-specific
  error under `host_info_design`. Do **not** reject unknown *keys* — this object
  is the designated place for future design options, and rejecting extras would
  make the next one a breaking change.

```json
{
  "success": false,
  "errors": {
    "host_info_design": ["type must be one of: standard, simple, portrait, arch, crest"]
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

### 6. `host_divider_image` — the one new model field

The `crest` design closes with a **horizontal breakline** drawn under the
couple. It is normally one of the five drawn `divider_style` values, but a
partner may attach their own artwork instead. That is a **file**, so it cannot
live inside the JSON config; it is a new image field on the partner-template
model, handled exactly like `sample_logo_1` / `header_text_image` — the same
upload rules, the same `''`-means-delete convention, the same place in the
event's `template_assets`.

```python
# Example (Django) — mirror however sample_logo_1 is defined
host_divider_image = models.ImageField(upload_to='template_assets/', null=True, blank=True)
```

**Create / update** (`multipart/form-data`, same two endpoints as above):

```
host_divider_image = <file>   # upload / replace
host_divider_image = ''       # delete the stored file
# absent                      # leave the stored file alone
```

**Template read endpoints** return it as a URL beside `sample_logo_1`:

```json
{ "id": 42, "sample_logo_1": "…", "host_divider_image": "/media/template_assets/breakline.svg" }
```

**Event showcase payload** — it belongs **inside** `template_assets.assets`,
alongside `sample_logo_1` and the decorations, *not* at the top level next to the
config objects:

```json
{
  "template_assets": {
    "host_info_design": { "type": "crest", "divider_style": "lotus", "divider_scale": 120 },
    "assets": {
      "sample_logo_1": "…",
      "host_divider_image": "/media/template_assets/breakline.svg"
    }
  }
}
```

> **Precedence, so the two are never both drawn:** when `host_divider_image` is
> present the frontend draws it *instead of* `divider_style`, the same way
> `falling_effect.custom_image` overrides `falling_effect.type`. The backend
> stores the three fields independently and applies no precedence of its own —
> in particular, **do not clear `divider_style` or `divider_scale` when an image
> is uploaded or removed**: removing the image has to reveal the style the
> partner chose underneath, at the width they chose.

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
- [ ] `type: "crest"` is accepted, and the four new keys round-trip unchanged
      (including a negative `top_offset`) — on **every** `type`, not just
      `crest`: `logo_scale` and `top_offset` are read by the other designs too.
- [ ] `host_divider_image` uploads, replaces and clears (`''`) on both
      endpoints, and is returned by the template read endpoints.
- [ ] `host_divider_image` appears inside `template_assets.assets` on the event
      showcase payload.
- [ ] Uploading or clearing `host_divider_image` leaves a stored
      `divider_style` / `divider_scale` untouched.

---

## Notes for Backend Dev

- This is intentionally a near-clone of `event_details_design`. If you copy that
  field's model definition, serializer handling, form-data parsing, and
  `template_assets` assembly, you've covered everything here.
- No new endpoints. One new image field (`host_divider_image`, §6) — copy
  `sample_logo_1`'s handling for it; everything else here is JSON only.
- Three enums to enforce now: `type`, plus the optional `frame_style` and
  `couple_ornament` (see Validation). Treat the object as
  extensible (don't hard-fail on future sibling keys unless you prefer strict
  validation — current frontend only sends `type`).
- **Frontend rendering scope (FYI, not a backend task):** `simple`, `portrait`,
  `arch` and `crest` are all implemented by the **wedding** host layout only. Other
  event-type host layouts ignore `host_info_design` and always render their
  `standard` look — setting any of the four on a non-wedding template is
  harmless and simply renders standard. The backend should still store/return
  the field unchanged regardless of event type.

> The dev-only `VITE_FORCE_HOST_INFO_DESIGN` env override has been **removed**.
> The showcase now binds `:host-info-design` directly to
> `event.template_assets?.host_info_design`, so the rendered design comes solely
> from the backend-served value (falling back to `standard` when absent/`null`).
