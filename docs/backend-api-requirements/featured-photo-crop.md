# Backend API Requirements: Event Photo Crop

> **Status: PENDING** — Frontend is implemented and shipped behind a safe
> default (the whole image, which renders exactly as it did before this
> feature). The editor detects the missing fields and tells the organizer their
> crop wasn't stored, so nothing breaks and nothing lies while this is
> outstanding. Four numeric fields on the event photo model are all that's
> needed.

## Overview

The transition stage ([src/components/showcase/TransitionStage.vue](../../src/components/showcase/TransitionStage.vue))
renders the event's featured photo full-screen. The photo has to be cropped to
fit the screen, and until now it was always cropped around the dead centre.

That's wrong often enough to matter: a wedding photo where the couple stands
off-centre, or a group shot with headroom, gets its subject sliced off. The
organizer had no way to correct it short of re-cropping the image in another
tool and re-uploading.

The ask: let the organizer **draw a phone-shaped rectangle** over their photo
and have the stage render what's inside it. That's **four numbers per photo**.

## Data Contract

### Fields

All four live on the **event photo** model, alongside `caption` / `order` /
`is_featured`:

| Field         | Type            | Required | Range | Default |
|---------------|-----------------|----------|-------|---------|
| `crop_x`      | decimal / float | no       | 0–100 | `0`     |
| `crop_y`      | decimal / float | no       | 0–100 | `0`     |
| `crop_width`  | decimal / float | no       | 1–100 | `100`   |
| `crop_height` | decimal / float | no       | 1–100 | `100`   |

A rectangle expressed in **percentages of the source image**: `crop_x` /
`crop_y` are its top-left corner, `crop_width` / `crop_height` its size.

The default `0 / 0 / 100 / 100` means "the whole image", which renders
identically to the plain centre crop the stage did before. **Every existing row
is therefore already correct at the default** — no migration, no backfill.

One decimal place of precision is plenty; the frontend rounds to one decimal
before sending. `DecimalField(max_digits=4, decimal_places=1)` or a plain
`FloatField` both work.

```json
{ "crop_x": 34.6, "crop_y": 0, "crop_width": 30.8, "crop_height": 100 }
```

### Why percentages of the source, and not pixels

1. **Survives re-processing.** Uploads are resized to max 1200×1200 and
   converted to WebP (see [EVENT_PHOTO_API.md](../backend-api/EVENT_PHOTO_API.md)
   § Image Processing). Pixel coordinates would need rewriting whenever that
   pipeline changes; percentages never do.
2. **Independent of the display size.** The stage is full-screen, and phones
   differ. Percentages of the source let the frontend re-derive the layout for
   whatever viewport a guest turns up with.
3. **Non-destructive.** The original file is untouched, so the organizer can
   re-crop any number of times, and the same photo can be cropped one way
   full-screen and shown whole in the gallery.

### Why a rectangle, and not a focal point

Worth recording, because it was the first design and it doesn't work.

An anchor point (`focal_x`/`focal_y` feeding CSS `object-position`) can only
slide the photo along whichever axis overflows the screen. On a portrait phone
that is **left/right only** — a landscape photo cropped to a phone screen
already spans the full height, so there is no up/down adjustment to make. The
organizer could not choose to show the faces rather than the middle of a tall
photo.

A rectangle has three degrees of freedom instead of two — position *and* size —
and the size is what creates room to move vertically. That is inherent, not a UI
detail: at maximum size a phone-shaped box is pinned on one axis, and shrinking
it is what lets it move along the other.

### Why on the photo, not on the event

The same image is also the OpenGraph share image
([metaUtils.ts](../../src/utils/metaUtils.ts)) and a gallery thumbnail, and both
crop it too. "Where the subject is" is a property of the image, not of the stage
displaying it, so per-photo storage lets every consumer benefit and the value
follows the photo if the organizer changes which one is featured.

Accepted trade-off: one photo can't be cropped one way for the transition stage
and differently in the gallery. If that's ever wanted, a stage-level override is
additive and doesn't invalidate these fields.

The fields are **not** limited to the featured photo — any photo can carry them,
and any photo can become the featured one later.

---

## Required Changes

### 1. Model

```python
# Example (Django)
_pct = dict(max_digits=4, decimal_places=1)

crop_x = models.DecimalField(
    **_pct, default=Decimal("0.0"),
    validators=[MinValueValidator(0), MaxValueValidator(100)],
    help_text="Crop rectangle left edge, as a % of the source image width.",
)
crop_y = models.DecimalField(
    **_pct, default=Decimal("0.0"),
    validators=[MinValueValidator(0), MaxValueValidator(100)],
    help_text="Crop rectangle top edge, as a % of the source image height.",
)
crop_width = models.DecimalField(
    **_pct, default=Decimal("100.0"),
    validators=[MinValueValidator(1), MaxValueValidator(100)],
    help_text="Crop rectangle width, as a % of the source image width.",
)
crop_height = models.DecimalField(
    **_pct, default=Decimal("100.0"),
    validators=[MinValueValidator(1), MaxValueValidator(100)],
    help_text="Crop rectangle height, as a % of the source image height.",
)
```

Non-nullable with those defaults is simplest and needs no backfill. Nullable is
also fine — the frontend treats a missing *or incomplete* set as "whole image".

### 2. Update endpoint (the one the UI actually calls)

```
PATCH /api/events/{event_id}/photos/{photo_id}/
Content-Type: application/json

{ "crop_x": 34.6, "crop_y": 0, "crop_width": 30.8, "crop_height": 100 }
```

**No new endpoint is required.** This is the existing photo-update call the
frontend already uses for `caption` / `is_featured` (via
`mediaService.updateEventMedia`) — the four fields just need adding to the
serializer's writable set.

The response must echo the saved values (see § 6 — the frontend depends on it):

```json
{
  "id": 2,
  "image": "http://api.goevent.online/media/event_photos/photo2.webp",
  "caption": "Team gathering",
  "order": 1,
  "is_featured": true,
  "crop_x": 34.6,
  "crop_y": 0.0,
  "crop_width": 30.8,
  "crop_height": 100.0,
  "created_at": "2025-10-02T10:31:00Z"
}
```

### 3. Create endpoints

Accept all four as optional `multipart/form-data` fields on
`POST /api/events/{event_id}/photos/`, defaulting to the whole image when
omitted. The current UI uploads first and crops afterwards, so this isn't on the
critical path — it just avoids a special case later.

`POST /api/events/{event_id}/photos/bulk-upload/` needs no change.

### 4. Read endpoints

Return all four from:

```
GET /api/events/{event_id}/photos/
GET /api/events/{event_id}/photos/{photo_id}/
```

### 5. ⚠️ Public event-showcase payload — the one that's easy to miss

The live showcase does **not** read `/api/events/{id}/photos/`. It reads the
photos **nested inside the public event-showcase payload** (`event.photos` /
`event.event_photos`, consumed at
[useEventShowcase.ts:538](../../src/composables/useEventShowcase.ts#L538)) —
that's an unauthenticated, guest-facing endpoint.

So the fields must be added to the **nested photo serializer used by the showcase
payload as well**, not only to the photo CRUD serializer. If only the CRUD
serializer gets them, the manage-page preview will honour the organizer's crop
and every real guest will still see the old centre crop — a silent, confusing
half-working feature. Same shape of mistake that `public_template_assets` had to
fix.

```json
{
  "event": {
    "id": "…",
    "photos": [
      {
        "id": 2,
        "image": "…",
        "is_featured": true,
        "crop_x": 34.6,
        "crop_y": 0.0,
        "crop_width": 30.8,
        "crop_height": 100.0
      }
    ]
  }
}
```

### 6. Validation

- `crop_x` / `crop_y` in `0–100`; `crop_width` / `crop_height` in `1–100`.
- Reject out-of-range values with a `400` and a field-specific error, in the
  standard shape the frontend already surfaces:

```json
{ "crop_width": ["Must be between 1 and 100."] }
```

- Optional but nice: reject `crop_x + crop_width > 100` (and the same
  vertically) as a rectangle that leaves the image. The frontend clamps before
  sending and clamps again on read, so this is defence in depth rather than
  something the UI will trip over.
- Clamping server-side instead of rejecting is acceptable.

---

## Acceptance Criteria

- [ ] The four fields exist on the event photo model with whole-image defaults;
      no backfill needed for existing rows.
- [ ] `PATCH /api/events/{event_id}/photos/{photo_id}/` accepts and persists
      them, and **echoes them in the response**.
- [ ] `POST /api/events/{event_id}/photos/` accepts them optionally.
- [ ] Photo list/detail reads return them.
- [ ] **The public event-showcase payload's nested photos return them.**
- [ ] Out-of-range values return `400` with a field-specific error.
- [ ] Existing events render exactly as they do today (centre crop) with no
      stored values.

---

## Notes for Backend Dev

- Four numeric fields, no new endpoints, no file handling, no image processing,
  no template plumbing. The image itself is never modified — cropping is applied
  at render time in the browser.
- **The response echo in § 2 is load-bearing, not politeness.** DRF silently
  drops unknown keys on a PATCH, so before these fields exist the frontend's
  save returns `200` having stored nothing. The editor therefore checks whether
  the response contains the crop fields and, if not, tells the organizer their
  crop wasn't saved instead of claiming success (`responseSupportsPhotoCrop` in
  [src/utils/photoCrop.ts](../../src/utils/photoCrop.ts)). The day the fields
  ship, that warning stops appearing on its own — **no frontend change or
  release needed**, just start returning them.
- Partial data is treated as absent: the frontend requires all four fields to
  form a rectangle and falls back to the whole image otherwise, so there's no
  need to worry about half-populated rows.
- Frontend consumption is already complete and forward-compatible:
  - [src/utils/photoCrop.ts](../../src/utils/photoCrop.ts) — the contract:
    parsing, clamping, aspect-locked sizing, and the render geometry.
  - [TransitionStage.vue](../../src/components/showcase/TransitionStage.vue) —
    lays the photo out so the chosen rectangle fills the screen.
  - [PhotoCropEditor.vue](../../src/components/showcase-preview/editors/PhotoCropEditor.vue)
    — the phone-shaped crop box: drag to move, corner handles or a zoom slider
    to resize.
  - [FeaturedPhotoModal.vue](../../src/components/showcase-preview/editors/FeaturedPhotoModal.vue)
    — "Choose photo" / "Crop" tabs; saves via the § 2 PATCH.
