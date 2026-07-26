# Backend API Requirements: `public_template_assets` Missing Decoration Fields

> **Status: DONE** — Backend widened the `assets` field list; verified live
> against template id 8 (`GoEvent` commit `43e1d20`,
> "Add border/frame decoration fields to public_template_assets"). The
> frontend fallback in `ShowcasePreviewFrameView.vue` no longer needs to
> work around missing keys.

## Overview

`GET /api/core-data/event-templates/{templateId}/public_template_assets/` is a
no-auth (`AllowAny`) endpoint that returns a template's colors, fonts, and
visual assets so it can be previewed before an event owner has selected/paid
for it. The frontend now also uses it as a **preview-only fallback** on the
manage-page "Live Preview" tab: when an event has a template selected but
payment isn't confirmed yet, the real showcase endpoint
(`GET /api/events/{id}/showcase/`) intentionally returns `template_assets:
null` (see `get_template_assets` gating), so the owner's preview backfills
from this public endpoint instead so they can see the look before paying.

That fallback mostly works — colors, fonts, background/decoration photo,
layout config, and particle effects all show correctly. But the endpoint's
`assets` object is missing the **border/frame decoration fields**, so
templates that use edge decorations preview without them.

---

## What's Missing

Verified live against a real template (id 8) on the local dev backend:

```json
{
  "template_data": {
    "assets": {
      "open_envelope_button": null,
      "basic_decoration_photo": "/media/event_templates/basic_decorations_photo/12b86d9b_background.webp",
      "basic_background_photo": null,
      "standard_cover_video": null,
      "standard_background_video": null,
      "sample_logo_1": null,
      "sample_logo_2": null,
      "header_text_image": null,
      "falling_effect_custom_image": "/media/event_templates/falling_effects/21b8657d_test-petal.png"
    }
  }
}
```

The following keys are **entirely absent** from `assets` (not `null` — just
missing), even when the template has them uploaded:

| Missing key | Used for |
|---|---|
| `top_decoration` | Main-content stage border decoration |
| `bottom_decoration` | Main-content stage border decoration |
| `left_decoration` | Main-content stage border decoration |
| `right_decoration` | Main-content stage border decoration |
| `cover_top_decoration` | Cover stage corner decoration |
| `cover_bottom_decoration` | Cover stage corner decoration |
| `cover_left_decoration` | Cover stage corner decoration |
| `cover_right_decoration` | Cover stage corner decoration |
| `guest_title_frame_left` | Guest-name title frame (left piece) |
| `guest_title_frame_mid` | Guest-name title frame (middle piece) |
| `guest_title_frame_right` | Guest-name title frame (right piece) |

All eleven of these **are already returned** by the paid showcase endpoint's
`event.template_assets.assets` once payment is confirmed — this is purely
about widening `public_template_assets` to match, not adding new data to the
backend.

---

## Required Change

In whatever serializer/view builds the `assets` dict for
`public_template_assets`, add the same eleven keys already present in the
paid `template_assets.assets` payload. No new model fields, no new
permissions, no new endpoint — this view already has access to the
`EventTemplate` row; it's just serializing a narrower field list than the
paid path does.

Desired shape (same endpoint, wider `assets`):

```json
{
  "template_data": {
    "assets": {
      "open_envelope_button": null,
      "basic_decoration_photo": "...",
      "basic_background_photo": null,
      "standard_cover_video": null,
      "standard_background_video": null,
      "top_decoration": "...",
      "bottom_decoration": "...",
      "left_decoration": "...",
      "right_decoration": "...",
      "cover_top_decoration": "...",
      "cover_bottom_decoration": "...",
      "cover_left_decoration": "...",
      "cover_right_decoration": "...",
      "guest_title_frame_left": "...",
      "guest_title_frame_mid": "...",
      "guest_title_frame_right": "...",
      "sample_logo_1": null,
      "sample_logo_2": null,
      "header_text_image": null,
      "falling_effect_custom_image": "..."
    }
  }
}
```

> Reference — frontend consumption:
> [src/views/ShowcasePreviewFrameView.vue](../../src/views/ShowcasePreviewFrameView.vue)
> (`loadPreviewTemplateFallback`) fetches this endpoint and merges the result
> into the event's `template_assets` for preview purposes only; the real
> public showcase never calls it, so the payment gate stays intact for
> guests. [src/components/showcase-preview/renderers/V1PreviewFrame.vue](../../src/components/showcase-preview/renderers/V1PreviewFrame.vue)
> reads `event.template_assets.assets.top_decoration` /
> `cover_top_decoration` etc. the same way the paid showcase does.

---

## Acceptance Criteria

- [x] `GET /api/core-data/event-templates/{id}/public_template_assets/`
      returns `top_decoration`, `bottom_decoration`, `left_decoration`,
      `right_decoration` in `assets` when the template has them uploaded.
- [x] Same endpoint also returns `cover_top_decoration`,
      `cover_bottom_decoration`, `cover_left_decoration`,
      `cover_right_decoration`.
- [x] Same endpoint also returns `guest_title_frame_left`,
      `guest_title_frame_mid`, `guest_title_frame_right`.
- [x] Values match exactly what the paid showcase endpoint's
      `template_assets.assets` returns for the same template (same URLs).
- [x] Templates with no decoration images uploaded return `null` for these
      keys (not an error, not an omitted key) — matches how the other
      asset fields already behave in this response.
- [x] No change to authentication/permissions — endpoint stays `AllowAny`.

---

## Notes for Backend Dev

- This is a field-list widening only — no new model fields, no new
  migration, no new endpoint, no permission changes.
- Whatever code path already assembles the full `assets` dict for the paid
  `template_assets` response is the source of truth; `public_template_assets`
  should build its `assets` dict the same way (same field list), just without
  the payment/`event_template_enabled` gate that the showcase endpoint
  applies at the *event* level. This view is already template-scoped
  (no-auth, keyed by template id, not event id), so there's no equivalent
  gate to preserve here.
