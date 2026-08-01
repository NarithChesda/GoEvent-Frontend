# Backend API Requirements: Cover Free Placement (`layoutMode` + `coverElements`)

> **Status: PENDING — needs verification, and possibly one serializer change.**
> The frontend is complete and ships two new keys inside the *existing*
> `cover_stage_layout` JSON blob. If the backend stores that blob verbatim
> (`JSONField`, no key allow-list), **nothing needs to change** and this document
> is a spec for the shape now flowing through it. If the serializer validates
> `cover_stage_layout` against a fixed set of keys, or reconstructs it field by
> field, the two new keys will be silently dropped on save and free placement
> will never persist — see [What to check first](#what-to-check-first).

## Overview

`cover_stage_layout` previously described the cover as a **stack**: one
absolutely-positioned container (`contentTopPosition` + `innerContainerHeight`),
inside which the four blocks — header text, logo, invite text, guest name — were
flex rows with percentage heights. A partner could change how tall each row was
and how far down the stack started, but not *where* anything sat: order was
fixed, horizontal position was fixed at centre, blocks could not overlap, and
text size was not adjustable at all.

The template editor now offers a second model. **Free placement** gives each of
those four blocks its own rectangle on the cover, dragged and resized directly on
the live preview (`src/components/showcase-preview/edit/CoverLayoutEditor.vue`),
with numeric fields beside it for exact values. Two new keys carry it:

| Key | Type | Default | Meaning |
| --- | --- | --- | --- |
| `layoutMode` | `"rows" \| "free"` | `"rows"` | Which placement model renders |
| `coverElements` | object, see below | `{}` | Per-block rectangles, read only when `layoutMode` is `"free"` |

Both are **additive and optional**. An existing template that carries neither
renders byte-for-byte as it does today.

## Shape

```jsonc
{
  "cover_stage_layout": {
    // ... every existing key is unchanged and still present ...
    "contentTopPosition": 23.5,
    "innerContainerHeight": 53,
    "eventTitleHeight": 18.75,
    "logoHeight": 48,
    "inviteTextHeight": 8.75,
    "guestNameHeight": 16,
    "guestNameMaxWidthPercent": 60,
    "showCoverHeaderText": true,

    // --- NEW ---
    "layoutMode": "free",
    "coverElements": {
      "header": { "x": 50, "y": 33.4, "width": 100, "height": 9.9, "fontScale": 1 },
      "logo":   { "x": 50, "y": 51.1, "width": 100, "height": 25.4, "fontScale": 1 },
      "invite": { "x": 50, "y": 66.1, "width": 100, "height": 4.6, "fontScale": 1.2 },
      "guest":  { "x": 50, "y": 72.6, "width": 60,  "height": 8.5, "fontScale": 1 }
    }
  }
}
```

### `coverElements` keys

Exactly four, all optional: `header`, `logo`, `invite`, `guest`. A block omitted
from the map falls back to the rectangle the row model would have given it, so a
partially-authored map is still a complete layout. (In practice the editor always
writes all four — see [Why the frontend always writes all four](#why-the-frontend-always-writes-all-four).)

The swipe arrow is deliberately **not** in this map: it has a fixed pixel size and
its own responsive rules, and `swipeArrowBottom` already positions it identically
in both models.

### `CoverElementBox` fields

| Field | Type | Range | Meaning |
| --- | --- | --- | --- |
| `x` | number | 0–100 | Box **centre** X, as % of the cover stage width |
| `y` | number | 0–100 | Box **centre** Y, as % of the cover stage height (equivalently `vh`) |
| `width` | number | 3–200 | Box width, as % of stage width |
| `height` | number | 2–200 | Box height, as % of stage height |
| `fontScale` | number, optional | 0.1–2.5 | Multiplier on the block's own responsive font size. `1` (the default) is exactly what the row model rendered. Ignored by `logo`, which has no text. |

All values are emitted rounded to one decimal place.

Three properties of this shape are worth stating explicitly, because they are what
make it forward-compatible:

- **Centre-anchored, not top-left.** The cover is a centred composition, so
  "put this on the middle axis" is the single value `x: 50` rather than a
  width-dependent calculation, and a block stays optically in place when its
  size changes.
- **Percentages of the stage, not px and not `vh`+`vw` mixed.** The cover stage
  always fills the viewport, so one unit system covers every device.
- **`width`/`height` may exceed 100 and boxes may overlap.** That is a feature
  (a logo bleeding past the guest-name block is a legitimate design), not
  something to validate away.

## What to check first

The frontend sends the whole object as one JSON string in `FormData`
(`src/services/api/modules/templates.service.ts`):

```js
formData.append('cover_stage_layout', JSON.stringify(payload.cover_stage_layout))
```

So the only question is what the serializer does with it:

1. **`JSONField` stored verbatim** → nothing to do. Verify by saving a template
   with free placement and confirming `layoutMode` / `coverElements` come back on
   `GET /api/events/templates/partner/<id>/`.
2. **Validated against an explicit key list, or rebuilt field by field** → add
   `layoutMode` and `coverElements` to that list. Anything stricter than
   "accept the object, reject non-JSON" will drop them silently: the save will
   return `200`, the editor will look like it worked, and the layout will revert
   on the next load.

The same blob must survive **both** read paths, or a template will look right in
the partner editor and wrong to guests:

- `GET /api/events/<id>/showcase/` → `template_assets.cover_stage_layout` (paid)
- `GET /api/events/templates/<id>/public-assets/` → `template_data.cover_stage_layout`
  (the unpaid-preview fallback, see [public-template-assets-decorations.md](public-template-assets-decorations.md))

## Validation, if any is added

Keep it permissive. Suggested bounds, matching what the editor itself clamps to:

- `layoutMode` ∈ `{"rows", "free"}`; anything else should be treated as `"rows"`
  rather than rejected.
- `coverElements` keys ⊆ `{"header", "logo", "invite", "guest"}`; drop unknown
  keys rather than failing the save.
- `x`, `y` ∈ [0, 100]; `width` ∈ [3, 200]; `height` ∈ [2, 200];
  `fontScale` ∈ [0.1, 2.5].

Out-of-range numbers are safer clamped than rejected — the frontend already
clamps on every edit, so a value outside these bounds means old or hand-written
data, and refusing the whole save over it costs a partner their work.

## Why the frontend always writes all four

Storing only the block that was dragged would leave the other three implicitly
tied to `contentTopPosition` / `*Height`. Someone nudging an unrelated row
height months later would then silently move blocks they never touched. So the
first drag persists the complete map, seeded from the row geometry the template
already had — which is also why switching a tuned template to free placement is
visually a no-op until something is actually dragged.

"Reset all blocks" in the editor writes `coverElements: {}` (and leaves
`layoutMode` alone), which is a real reset: the blocks go back to *tracking* the
row numbers rather than to a frozen copy of them.

## Frontend reference

- Types: [`src/services/api/types/template.types.ts`](../../src/services/api/types/template.types.ts) —
  `CoverLayoutMode`, `CoverElementId`, `CoverElementBox`, `CoverElementBoxes`
- Resolution + row→box seeding: [`src/composables/showcase/useCoverStageLayout.ts`](../../src/composables/showcase/useCoverStageLayout.ts)
- Rendering (both models share one component): [`src/components/showcase/cover/CoverContentRows.vue`](../../src/components/showcase/cover/CoverContentRows.vue)
- Drag/resize overlay: [`src/components/showcase-preview/edit/CoverLayoutEditor.vue`](../../src/components/showcase-preview/edit/CoverLayoutEditor.vue)
- Editor pane: the Cover Layout section of [`src/components/template/PartnerTemplateForm.vue`](../../src/components/template/PartnerTemplateForm.vue)
