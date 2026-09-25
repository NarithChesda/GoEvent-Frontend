# Backend API Requirements: Cover Photo Frame (`is_cover_photo`, `cover_photo_frame_image`, `cover_photo_shape_image`)

> **Status: PENDING.** The frontend is built and reads/writes the three fields
> below. Until the backend stores them:
> - a PATCH of `is_cover_photo` succeeds with the field silently dropped. The
>   studio's cover-photo editor detects that (the response doesn't echo
>   `is_cover_photo`) and tells the organizer nothing was saved, rather than
>   pretending it was. The cover keeps showing the first host's photo, as it
>   does today.
> - the two template images are dropped on upload. Templates keep drawing the
>   frame from `sample_logo_1` / `sample_logo_2`, which is what they do today.
>
> The layout settings (`showCoverPhoto`, `coverPhoto`, `coverElements.photo`)
> live inside the existing `cover_stage_layout` JSON and need **no** backend
> change.

## The ask, in one line

Add a boolean `is_cover_photo` to **EventPhoto**, and two optional image fields
to **EventTemplate**: `cover_photo_frame_image` and `cover_photo_shape_image`.
Handle them wherever `is_featured` and `cover_host_separator_image` are already
handled.

## What it is

The cover can show a **photo frame**: one of the event's photographs, cut to a
shape the template supplies and set in the template's frame artwork. It began as
a birthday-only trick, where `sample_logo_1` was drawn as the "logo",
`sample_logo_2` was laid over it, and the first host's profile photo was clipped
to `sample_logo_2`'s opaque pixels. It is now a cover block of its own, for
every kind of event:

- **The template** supplies the artwork (`cover_photo_frame_image`) and the
  shape (`cover_photo_shape_image`), and places and sizes the frame in the
  cover's layout blob.
- **The organizer** picks which photo fills it (`is_cover_photo`) and frames it
  with the photo's existing `crop_*` fields, in the same pan-and-zoom editor
  the transition stage uses. See [featured-photo-crop.md](featured-photo-crop.md).
  **No new framing fields are needed.**

Until the organizer picks one, the frame shows the first host's profile photo,
as the birthday cover always did.

## Fields

### EventPhoto

| Field | Type | Meaning |
|---|---|---|
| `is_cover_photo` | boolean, default `false` | The photo shown in the cover's photo frame. |

**At most one photo per event** should be `true`. The frontend clears the old
one in a separate PATCH before setting the new one, as it does for
`is_featured`. Enforcing it on the backend too is a welcome safety net: when a
photo is saved with `is_cover_photo=true`, set it `false` on the event's other
photos. If two ever get through, the frontend uses the first in gallery order.

No data migration. `false` is what every existing photo means today.

While the template draws the photo frame, the cover photo leaves the
invitation's gallery, as a photo band does, so no photograph shows twice. That
is decided on the frontend (`coverFramePhotoId`); the photos endpoints still
return every photo.

### EventTemplate

| Field | Type | Meaning |
|---|---|---|
| `cover_photo_frame_image` | ImageField, nullable | The frame artwork, drawn behind or in front of the photo (a transparent PNG/SVG/WebP). |
| `cover_photo_shape_image` | ImageField, nullable | The shape: the photo shows through this image's opaque pixels. |

Treat them exactly like `sample_logo_1` / `sample_logo_2`:

- **Keep transparency** when optimising (`ImageOptimizer.optimize_logo`, not the
  photo path). The shape is a mask: flattening its alpha onto a background
  turns it into a solid rectangle and the photo stops being cut.
- **Serve them with CORS headers**, like the sample logos. The frontend reads
  the shape's pixels on a canvas to find its bounds, and CSS `mask-image`
  fetches cross-origin images in CORS mode. Without CORS the photo can't be
  cut, and the frame falls back to drawing the shape as a plain image.
- Clearing: a blank value (`''`) on a multipart update deletes the stored file,
  as for every other template image.

No data migration. Absent both, the frontend keeps using `sample_logo_1` /
`sample_logo_2` as the frame and shape for templates that carry them.

## Endpoints

| Endpoint | Needs |
|---|---|
| `GET /api/events/{id}/photos/` | return `is_cover_photo` on each photo |
| `PATCH /api/events/{id}/photos/{photoId}/` (JSON body) | accept `is_cover_photo` and **echo it in the response**. The frontend checks for it to know the save took. |
| `GET /api/events/{id}/showcase/` | return `is_cover_photo` on each photo in `photos` / `event_photos`; return both template images in `template_assets.assets` |
| `GET /api/events/{id}/` | return `is_cover_photo` on each photo, if the detail serializer embeds photos |
| Partner template read / create / update (`/api/core-data/partner-templates/…`) | read and write both template images (multipart), including `''` to clear |
| `public_template_assets` (the template try-on and the public design catalogue) | return both template images in `assets` |
| Staff template editor and Django admin | the two images beside `sample_logo_1` / `sample_logo_2` |

Only the template images sit behind the payment gate, with the rest of
`template_assets`. `is_cover_photo` is the organizer's own content, like the
gallery it comes from.

## Duplicating an event or a template

If an event copy path copies photos, copy `is_cover_photo` with them, as
`is_featured` is copied. If a template copy path copies `sample_logo_*`, copy
the two new images too.

## Frontend references

- Types: `CoverPhotoFields` in `src/services/api/types/event.types.ts`;
  `CoverPhotoConfig` and the image fields in `src/services/api/types/template.types.ts`
- Resolution (which art, which photo, the legacy inference, geometry): `src/components/showcase/cover/coverPhoto.ts`
- Renderer: `src/components/showcase/cover/CoverPhotoFrame.vue`
- Organizer editor: `src/components/showcase-preview/editors/CoverPhotoEditor.vue` (choose and crop, on the cover);
  the Cover action in `src/components/UploadMediaDrawer.vue` and the frame button on
  `src/components/MediaCard.vue` (choose only)
- Partner template form: the Photo frame block in `src/components/template/sections/CoverSection.vue`
