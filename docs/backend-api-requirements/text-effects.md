# Backend API Requirements: Text Effects (Metallic Lettering)

> **Status: PENDING** — Frontend is complete and reads
> `template_assets.text_effects`. Until the backend ships the field the value is
> always absent, which means no finish on any font slot, so the frontend is safe
> to deploy ahead of this. Checked 2026-09-17: the public template-assets payload
> (`/api/core-data/event-templates/{id}/public_template_assets/`) carries no
> `text_effects` key.

## Overview

A template can strike the showcase's display text in metal — gold, rose gold or
silver, either as flat **foil** (a foil-stamped card) or raised **relief** (3D
gilded lettering with an edge and a shadow). The choice is made **per font
slot** (`primary`, `secondary`, `accent`, `decorative`), and follows that slot
across every V1 stage: the cover header, invite line and guest name, the Save the
Date title card on the transition stage, the host block, the date numeral and
every section heading.

It is controlled by one nullable JSON field, `text_effects`, sent inside the
template package and forwarded to the showcase exactly like `agenda_design` /
`save_the_date_design` / `stage_modes`.

---

## Why a template field, and why per slot

- **Not per font row.** `EventTemplateLanguageFont` rows are per *language* × slot.
  A finish there would let a template gild its English headings and print the
  same headings flat in Khmer, which is not a choice any design makes — and it
  would make a partner set the same thing once per language. A slot's finish is a
  property of the design, so it lives on the template.
- **Not per section.** The showcase has dozens of headings. A field per section
  would be the same fork `font-metric-normalization.md` argues against. The slot
  is already the vocabulary partners use for "which text is this".
- **Display text only.** The same slot also draws body copy, RSVP labels, payment
  details and buttons. The frontend gilds only headings, names and the date
  numeral — real foil-printed cards do the same, and a metal gradient on 14px
  body copy reads as dirt rather than foil. The backend does not need to know
  which elements those are.

---

## Data Contract

### Config object

```json
{
  "primary": { "finish": "relief", "metal": "gold", "animation": "shimmer" },
  "secondary": { "finish": "foil", "metal": "rose_gold", "animation": "sheen" }
}
```

Top level: an object keyed by slot. Every key is optional.

| Key          | Type                   | Meaning |
|--------------|------------------------|---------|
| `primary`    | object \| `null`       | Finish for the primary slot |
| `secondary`  | object \| `null`       | Finish for the secondary slot |
| `accent`     | object \| `null`       | Finish for the accent slot (drawn only by free-placed cover blocks that pick it) |
| `decorative` | object \| `null`       | Finish for the decorative slot (same) |

Each slot object:

| Field    | Type   | Required | Allowed values                     | Default |
|----------|--------|----------|------------------------------------|---------|
| `finish` | string | yes      | `foil`, `relief`                   | —       |
| `metal`  | string | no       | `gold`, `rose_gold`, `silver`      | `gold`  |
| `animation` | string | no    | `none`, `sheen`, `shimmer`         | `sheen` |

`animation` is how light moves across the metal: `none` holds still, `sheen` is
one pass of light as the lettering arrives, `shimmer` repeats that pass every
few seconds. The frontend always sends it alongside `metal`.

The scroll-story slots (`v2-body`, `v2-display`) are deliberately **not** keys:
V2 renders none of the stages this effect is drawn on.

### Absent means "no finish" — never backfill

- The whole field absent or `null` → no finish anywhere. That is what every
  template saved before this field existed renders, so **no migration**.
- A slot key absent or `null` → that slot has no finish.
- The frontend sends only the slots that carry a finish, and sends `null` (not
  `{}`) when none does, so turning every finish off returns a template to exactly
  the pre-field state.
- An unrecognised `finish` is treated as absent (plain type); an unrecognised
  `metal` keeps the finish and falls back to `gold`, and an unrecognised or
  absent `animation` falls back to `sheen` — what every finish did before the
  key existed, so finishes saved without it need no migration either. A value
  written by a newer frontend therefore degrades safely on an older one.

### Model field

Add to the partner template model, alongside `save_the_date_design`:

```python
text_effects = models.JSONField(null=True, blank=True)
```

Validate on write the same way the other design configs are validated:

- must be an object (or `null`)
- keys limited to the four slots above
- each value `null` or an object with `finish` in the allowed set and, if
  present, `metal` and `animation` in their allowed sets

### Endpoints

The same places `save_the_date_design` appears:

1. **`POST /api/events/partner-templates/`** — accept `text_effects` as a
   JSON-encoded string inside `multipart/form-data` (the string `"null"` clears it).
2. **`PATCH/PUT /api/events/partner-templates/{id}/`** — same.
3. **`GET /api/events/partner-templates/{id}/`** and the list endpoint — return
   the parsed object (or `null`).

### Showcase payload

Surface it inside the event's `template_assets`, at the **top level** of that
object next to `save_the_date_design` (not nested under `assets`):

```json
{
  "template_assets": {
    "assets": { "...": "..." },
    "save_the_date_design": { "type": "script" },
    "stage_modes": { "cover": "animation" },
    "text_effects": { "primary": { "finish": "relief", "metal": "gold" } }
  }
}
```

This applies to every endpoint that already carries `save_the_date_design`,
including `GET /api/events/{id}/showcase/` and the public template-assets
endpoint used by the preview frames and the public design catalogue.

If the template serializer allow-lists `template_assets` keys, add this one — a
silently dropped key saves with a 200 and reverts on the next load, which is how
`guestFrame` went missing before (see `cover-gilding.md`).

---

## Frontend touchpoints

| File | Role |
|------|------|
| [template.types.ts](../../src/services/api/types/template.types.ts) | `TextEffectFinish`, `TextEffectMetal`, `TextEffectConfig`, `TextEffectsConfig`, and the field on the template + payload types |
| [useEventShowcase.ts](../../src/composables/useEventShowcase.ts) | `text_effects` on `TemplateAssets` |
| [useTextEffects.ts](../../src/composables/showcase/useTextEffects.ts) | Resolver (all the fallbacks above), provider and `fx(slot)` class helper; documents the markup contract |
| [text-effects.css](../../src/components/showcase/text-effects.css) | The three metals and two finishes |
| [templates.service.ts](../../src/services/api/modules/templates.service.ts) | Appends the JSON string on create and update |
| [PartnerTemplateForm.vue](../../src/components/template/PartnerTemplateForm.vue) | The **Text finish** panel under Fonts |
| [partnerTemplateAssets.ts](../../src/components/template/partnerTemplateAssets.ts) | Carries the draft value into the form's live preview |
