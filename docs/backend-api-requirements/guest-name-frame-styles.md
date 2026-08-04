# Backend API Requirements: Guest Name Frame Styles (`guestFrame`)

> **Status: DONE — backend updated and manually verified (2026-08-04).**
> `guestFrame` round-trips through `cover_stage_layout` and the template editor
> keeps a saved frame style across a reload. This document is now a reference for
> the shape flowing through, not a request.
>
> It did need a backend change. On first test the key was silently dropped on
> save — the serializer was validating `cover_stage_layout` against a fixed set of
> keys — and every template snapped back to the 3-piece default after a reload.
> Worth remembering as the failure mode for the *next* additive key in this blob:
> it is invisible until you save and reload, since the editor and live preview
> both work off local form state.
>
> **Still unverified:** [cover-free-placement.md](cover-free-placement.md) ships
> `layoutMode`/`coverElements` into the same blob under the same additive design
> and has never been confirmed to round-trip. It was plausibly broken by the same
> serializer. Worth one save-and-reload test.

## Overview

The guest name on the cover stage has always been wrapped in one construction: a
**3-piece split frame** built from the three existing asset fields —
`guest_title_frame_left`, a horizontally-repeating `guest_title_frame_mid`, and
`guest_title_frame_right`. It only suits artwork that tiles horizontally.

Partners can now pick between three constructions for the same name:

| Style | What it draws | Slots it reads |
| --- | --- | --- |
| `split` (default) | Today's frame: fixed end caps, repeating middle | left + mid + right |
| `single` | One image IS the whole frame, aspect ratio preserved | `guest_title_frame_mid` |
| `corners` | Corner ornaments only, nothing along the edges | left + right |

**No new asset fields.** All three styles read the same three uploads, which is
the whole reason this needs no migration: a partner switching styles keeps the
artwork they already uploaded, and the template editor relabels the three slots
per style so the reuse is not confusing.

## Shape

```jsonc
{
  "cover_stage_layout": {
    // ... every existing key is unchanged and still present ...
    "guestNameMaxWidthPercent": 60,
    "layoutMode": "free",
    "coverElements": { "...": "..." },

    // --- NEW ---
    "guestFrame": {
      "style": "corners",        // "split" | "single" | "corners"   default "split"
      "scale": 1,                // multiplier on the artwork's size   default 1
      "cornerSize": 28,          // corner width as % of the box       default 28
      "cornerInset": 0,          // inset from the box edges, %        default 0
      "corners": {
        "topLeft":     { "source": "left"  },
        "topRight":    { "source": "right" },
        "bottomLeft":  { "source": "left",  "flipY": true },
        "bottomRight": { "source": "right", "flipY": true }
      }
    }
  }
}
```

`source` is `"left"` | `"right"` | `"none"` — which upload slot that corner
position draws, or nothing. `flipX` / `flipY` mirror it, which is how two uploads
(or one) fill four corners: corner art is symmetric under reflection, so there is
no fourth asset field and no need for one.

`cornerSize`, `cornerInset` and `corners` are only read when `style` is
`"corners"`; `scale` applies to all three styles.

**Every key is additive and optional.** A template carrying no `guestFrame` at
all — i.e. every template that exists today — resolves to the `split` style with
its original geometry and renders byte-for-byte as it does now.

## What the backend had to allow

Recorded because the same constraints apply to anything else added to this blob:

1. **`guestFrame` is a nested object**, not a scalar, and it contains a nested
   `corners` map. A flat key allow-list has to permit the whole subtree, not just
   the top-level name.
2. **Partial objects are legal.** The frontend may send only the keys the partner
   changed (e.g. `{"style": "corners"}`), and every field has a frontend default.
   Do not reject an object for missing keys, and do not fill them in server-side —
   `resolveGuestFrame` already does that, and a second set of defaults on the
   backend would be one more place for the two to disagree.

The most robust fix, and the one that stops this recurring for the *next* cover
feature, is to store the blob verbatim as a `JSONField` and validate only that it
is a JSON object. Every key in `cover_stage_layout` is presentation config that
the frontend already resolves defensively — there is nothing the backend needs to
understand about its contents.

## Verifying the round trip

The failure mode is silent — the editor and live preview both work off local
form state, so a dropped key only shows up after a save **and a reload**:

```bash
# 1. Save a template with a non-default guest frame from the editor, then:
curl -H "Authorization: Bearer $TOKEN" \
  https://<api>/api/events/partner-templates/<id>/ | jq '.cover_stage_layout.guestFrame'

# Expect the object above. `null` or a missing key means it was dropped on save.
```

Both read paths must return it too, since they are what the showcase itself
renders from:

- `GET /api/events/<id>/showcase/` → `template_assets.cover_stage_layout.guestFrame` (paid)
- `GET /api/events/templates/<id>/public-assets/` → `template_data.cover_stage_layout.guestFrame`

## Frontend reference

- Types: `GuestFrameConfig` in [src/services/api/types/template.types.ts](../../src/services/api/types/template.types.ts)
- Defaults + resolution: `resolveGuestFrame` in [src/composables/showcase/useCoverStageLayout.ts](../../src/composables/showcase/useCoverStageLayout.ts)
- Artwork components: [src/components/showcase/cover/guest-frames/](../../src/components/showcase/cover/guest-frames/)
- Editor UI: the guest-frame section of [src/components/template/PartnerTemplateForm.vue](../../src/components/template/PartnerTemplateForm.vue)
