# Backend API Requirements: Removing a Partner Template Asset

> **Status: BLOCKED ON BACKEND** — Frontend shipped. Undoing an *unsaved* pick
> works today (purely client-side). Removing an *already-saved* asset sends the
> contract below and will fail validation until the serializer accepts it.

## Overview

The partner template editor had no way to take a file back. Once an asset was
uploaded and saved there was no "remove" — a wrong cover background or a stray
decoration could only be replaced with a different file, never cleared, so a
template could never return to "this slot is empty".

The editor now offers a remove control on every file field. It resolves in two
steps, and only the second one reaches the backend:

1. **A pick that hasn't been saved yet** is dropped locally, revealing whatever
   was saved underneath. No request; nothing to implement.
2. **A saved asset** is marked for removal and sent on Save as an **empty
   string** for that field.

This mirrors the convention already documented for
`falling_effect_custom_image` (see
[FALLING_EFFECT_BACKEND_GUIDE.md](../backend-api/FALLING_EFFECT_BACKEND_GUIDE.md#clearing-the-custom-image)) —
it just needs extending to the rest of the template's file fields.

---

## Data Contract

`PATCH /api/core-data/partner-templates/{id}/` (`multipart/form-data`)

Each file field carries three distinguishable states, and the distinction is
what matters — "I didn't touch this" must not be confused with "delete this":

| Sent as | Meaning |
|---|---|
| a file part | upload / replace |
| `''` (empty string) | **delete the stored file** |
| key absent | leave the stored file untouched |

The frontend never sends `''` on create, only on update.

### Fields

All of the template's file fields, i.e. every entry in `TEMPLATE_FILE_FIELDS`
([templates.service.ts](../../src/services/api/modules/templates.service.ts)):

```
preview_image
basic_background_photo        basic_decoration_photo
top_decoration                bottom_decoration
left_decoration               right_decoration
cover_top_decoration          cover_bottom_decoration
cover_left_decoration         cover_right_decoration
guest_title_frame_left        guest_title_frame_mid        guest_title_frame_right
standard_cover_video          standard_background_video
sample_logo_1                 sample_logo_2                header_text_image
open_envelope_button
```

---

## Why it fails today

DRF's `FileField`/`ImageField` rejects an empty string outright — the request
comes back `400` with *"The submitted data was not a file. Check the encoding
type on the form."* The value never reaches the model, so nothing is cleared.

## Required change

Same shape as the existing `validate_falling_effect_custom_image` hook, applied
to every file field on the partner template serializer:

```python
FILE_FIELDS = [
    'preview_image',
    'basic_background_photo', 'basic_decoration_photo',
    'top_decoration', 'bottom_decoration', 'left_decoration', 'right_decoration',
    'cover_top_decoration', 'cover_bottom_decoration',
    'cover_left_decoration', 'cover_right_decoration',
    'guest_title_frame_left', 'guest_title_frame_mid', 'guest_title_frame_right',
    'standard_cover_video', 'standard_background_video',
    'sample_logo_1', 'sample_logo_2', 'header_text_image',
    'open_envelope_button',
]


class PartnerTemplateSerializer(serializers.ModelSerializer):
    ...

    def to_internal_value(self, data):
        # An empty string means "clear this file". Convert before the field's
        # own validation runs, which would otherwise reject it as a non-file.
        data = data.copy()
        for field in FILE_FIELDS:
            if data.get(field) == '':
                data[field] = None
        return super().to_internal_value(data)
```

Each field must also be `required=False, allow_null=True` (and the model column
`null=True, blank=True`) for `None` to persist as "no file".

Deleting the underlying file from storage is optional — nulling the column is
enough for the frontend. If orphaned files matter, `django-cleanup` handles it
without touching this serializer.

---

## Verification

1. Open a partner template that has a cover background saved.
2. Click the **×** on that field → it reverts to "Choose file", and the live
   preview drops the background immediately (the preview honours staged
   removals before they are saved).
3. Save → `PATCH` carries `basic_decoration_photo: ''`.
4. Reload the template → the field is still empty, and
   `GET /api/core-data/partner-templates/{id}/` returns
   `"basic_decoration_photo": null`.
5. Pick a new file for the same field *before* saving → the removal is taken
   back and the upload is sent instead.

---

## Related fix shipped alongside

`sample_logo_1`, `sample_logo_2` and `header_text_image` were declared on the
create/update payload type and set by the form, but omitted from the service's
file-field loop — so those three uploads were silently dropped client-side and
never reached the API at all. They are included now. If the backend has never
received them, verify the columns accept uploads as expected.
