# Backend API Requirements: Photo Gallery Design

> **Status: PENDING** — Frontend is complete and reads
> `template_assets.gallery_design`. Until the backend ships the field the value
> is always absent, which resolves to `column` (the gallery every event renders
> today), so the frontend is safe to deploy ahead of this.

## Overview

The showcase renders the event's **photo gallery** — the photographs near the
foot of the invitation, typically 10 to 30 of them — in one of six
compositions. The chosen one is controlled per **template** by a small JSON
config named `gallery_design`, sent inside the template package and forwarded to
the showcase exactly like the existing `agenda_design` / `dress_code_design`
configs.

The backend work is identical in shape to `dress_code_design`: add one nullable
JSON field to the partner-template model, accept it on create/update (sent as a
JSON-encoded string inside `multipart/form-data`), return it on read, and
surface it inside the event's `template_assets` payload. No new file fields, and
nothing on the photo model: the designs reuse each photo's existing `crop_*`
framing.

---

## Why this field exists

The gallery was one composition: every photograph at the card's full width, one
after another. At thirty photographs that is the longest section of the
invitation by far, and it drew a wedding, a birthday and a memorial identically.
The photographs are the part of an invitation guests come back to look at, so
how they are laid out is a design decision a partner should be able to make per
template.

Each design is also an **arrival**: photographs are handed over one at a time
as the guest scrolls to them.

| `type`   | Composition | Suits |
|----------|-------------|-------|
| `column` | **Default.** One photograph after another at the card's width, uncropped. What every gallery renders today. | Anything |
| `reel`   | A horizontal strip bled to the card's edges, gently bowed, dealt in from the right one by one, then drifting on its own. Takes a swipe and a throw. The shortest at any photo count. | Anything; the most compact |
| `prints` | Instant-film prints tossed down the page in a zig-zag, each dropped onto its tilt as it scrolls in; the photo's caption written on the print's foot. | Weddings, birthdays |
| `mosaic` | Rounded tiles in two staggered columns, surfacing out of the dark. | Ceremonies, memorials |
| `booth`  | Photo-booth strips of three, each frame revealed by a flash. | Birthdays, parties |
| `film`   | A contact sheet: two strips of film, frames numbered on the edge, developing from a warm cast. | Anniversaries |

---

## Data contract

### Config object

```json
{
  "type": "reel"
}
```

| Field  | Type   | Required | Allowed values                                           | Default  |
|--------|--------|----------|----------------------------------------------------------|----------|
| `type` | string | yes      | `column`, `reel`, `prints`, `mosaic`, `booth`, `film`     | `column` |

An **object rather than a bare string**, matching the other section designs, so
a per-design option can be added later as a sibling key without a breaking
change.

The frontend treats `null`, an absent key and an unrecognised `type` all as
`column`, so an older frontend serving a guest never breaks on a value a newer
one wrote. **Do not backfill** existing templates: absent already renders
exactly what they render today.

### Model field

Add to the partner template model, alongside `dress_code_design`:

```python
gallery_design = models.JSONField(null=True, blank=True)
```

Validate on write the same way `dress_code_design` is validated:

- must be an object (or `null`)
- `type` must be present and one of the six values above
- reject unknown keys, or ignore them — match whatever `dress_code_design` does

### Endpoints

The same three places `dress_code_design` appears:

1. **`POST /api/events/partner-templates/`** — accept `gallery_design` as a
   JSON-encoded string inside `multipart/form-data`.
2. **`PATCH/PUT /api/events/partner-templates/{id}/`** — same.
3. **`GET /api/events/partner-templates/{id}/`** and the list endpoint — return
   the parsed object (or `null`).

The partner form always sends the field (the picker has no "unset" state), so a
template saved after this ships carries an explicit `{ "type": "column" }` if
the partner kept the default.

### Showcase payload

Surface it inside the event's `template_assets`, at the **top level** of that
object next to `agenda_design` and `dress_code_design` (not nested under
`assets`):

```json
{
  "template_assets": {
    "assets": { "...": "..." },
    "agenda_design": { "type": "thread" },
    "dress_code_design": { "type": "atelier" },
    "gallery_design": { "type": "reel" }
  }
}
```

This applies to every endpoint that already carries `dress_code_design`,
including `GET /api/events/{id}/showcase/` and the public template-assets
endpoint (`public_template_assets`) used by the catalogue and studio preview
frames.

---

## Frontend touchpoints

| File | Role |
|------|------|
| [template.types.ts](../../src/services/api/types/template.types.ts) | `GalleryDesignType`, `GalleryDesignConfig`, and the field on the template + payload types |
| [useEventShowcase.ts](../../src/composables/useEventShowcase.ts) | `gallery_design` on `TemplateAssets` |
| [templates.service.ts](../../src/services/api/modules/templates.service.ts) | Appends the JSON string on create and update (`TEMPLATE_JSON_CONFIG_FIELDS`) |
| [sectionDesigns.ts](../../src/components/template/config/sectionDesigns.ts) | Default, hydrate (unknown → `column`) and payload builder |
| [ContentSection.vue](../../src/components/template/sections/ContentSection.vue) | The partner's picker, under the dress code picker |
| [PhotoGallery.vue](../../src/components/showcase/PhotoGallery.vue) | The shell: header, design resolution, the colour contract |
| [gallery-designs/](../../src/components/showcase/gallery-designs/) | The six designs, the shared framed photo, the reveal composable and the layout maths |
