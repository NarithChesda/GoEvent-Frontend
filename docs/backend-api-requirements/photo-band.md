# Backend API Requirements: Photo Bands (`band_placement`, `band_blend_color`)

> **Status: PENDING.** The frontend is built and reads/writes the two fields
> below. Until the backend stores them, a PATCH succeeds with the fields
> silently dropped; the editors detect that (the response doesn't echo
> `band_placement`) and tell the organizer nothing was saved, rather than
> pretending it was.

## The ask, in one line

Add two nullable fields to the **EventPhoto** model, `band_placement` and
`band_blend_color`. Make them readable and writable wherever `is_featured` and
the `crop_*` fields already are, including the photos returned by the
**showcase** serializer.

## What it is

A photo can be shown as a **photo band**: drawn full width on the invitation's
main content card after a section of the organizer's choosing, with its top and
bottom dissolving into the page through a blur. A photo shown as a band
**leaves the gallery**, so the invitation never shows the same photograph
twice. Any number of photos can be bands, several after one section too, drawn
in gallery order (`order`).

It is a setting on the photo, like `is_featured`. The organizer sets it in two
places:
- in the photo manager, select a photo and choose the section it appears after;
- in the Design Studio preview, by tapping the band, where they can also change
  its blend colour and framing.

Framing uses the photo's existing `crop_*` fields (see
[featured-photo-crop.md](featured-photo-crop.md)): one region per photo that
every frame it is drawn in shows. **No new framing fields are needed.**

## Fields

| Field | Type | Meaning |
|---|---|---|
| `band_placement` | string, nullable, default `NULL` | Which section the photo appears after, as a band. `NULL` (or `''`) = an ordinary gallery photo. |
| `band_blend_color` | string (7), nullable, default `NULL` | `#rrggbb` the band's edges wash into on their way out, chosen to match whatever is behind the card. `NULL` = blur only. |

`band_placement` values used today: `top`, `after_hosts`, `after_event_info`,
`after_dress_code`, `after_agenda`, `after_host_message`, `after_video`,
`after_gallery`, `after_payment`, `after_comments`. More may be added. **Please
don't restrict the field to a choice list**, e.g. a `CharField(max_length=32)`
with no `choices`. The frontend draws a value it doesn't know at a default
position rather than dropping the photo, and a new section should not need a
backend deploy.

No data migration. `NULL` is exactly what every existing photo means today (a
gallery photo), so no existing event changes.

## Endpoints

| Endpoint | Needs |
|---|---|
| `GET /api/events/{id}/photos/` | return both fields on each photo |
| `PATCH /api/events/{id}/photos/{photoId}/` (JSON body) | accept both, including `null` to clear them, and **echo them in the response**. The frontend checks for `band_placement` to know the save took. |
| `GET /api/events/{id}/showcase/` | return both fields on each photo in `photos` / `event_photos` |
| `GET /api/events/{id}/` | return both on each photo, if the detail serializer embeds photos |

Neither field is behind the payment gate: both are the organizer's own
content, like the gallery they come from.

## Validation (please)

- `band_blend_color`, when not `null`, must match `^#[0-9a-fA-F]{6}$`. The
  frontend always sends lowercase `#rrggbb`.
- `band_placement`: a short string or `null`; see above for why there's no
  choice list.
- The frontend sends `band_blend_color: null` whenever it clears
  `band_placement`. Clearing the colour on the backend too, when the placement
  is cleared, is a harmless safety net.

## Duplicating an event

If an event copy or "use as template" path copies photos, copy these two fields
with them, as `is_featured` is copied.

## Frontend references

- Types: `PhotoBandFields` / `PhotoBandPlacement` in `src/services/api/types/event.types.ts`
- Reading, and which photos the gallery keeps: `src/components/showcase/photo-band/photoBand.ts`
- Renderer: `src/components/showcase/photo-band/PhotoBand.vue` (one band), `PhotoBandSlot.vue` (one section's bands)
- Editors: the Band action in `src/components/UploadMediaDrawer.vue`, and `src/components/showcase-preview/editors/PhotoBandEditor.vue`
