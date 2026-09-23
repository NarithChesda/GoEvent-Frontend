# Backend API Requirements: Photo-Stack Transition (`showcaseAnimationType: "stack"`)

> **Status: NO NEW FIELD.** One new value for a key that already travels inside
> the existing `cover_stage_layout` JSON blob, and one new key beside it in the
> same blob. Nothing to do if that blob is stored verbatim; see
> [What to check](#what-to-check).

## What it is

`cover_stage_layout.showcaseAnimationType` picks how the cover leaves and which
transition stage follows it. It had two values, and now has three:

| Value | Cover exit | Transition stage |
| --- | --- | --- |
| `decoration` (default) | decorations slide out | the Save the Date card over the featured photo |
| `door` | the cover splits into two swinging doors | the gold-framed Save the Date over the featured photo |
| **`stack`** (new) | decorations slide out | the event's photographs revealed one at a time, then gathered into a composition with the Save the Date |

How `stack` composes the photographs is a second new key, `stackLayout`, read
only when the animation type is `stack`:

| `stackLayout` | Photos | What it draws |
| --- | --- | --- |
| `pile` (default) | up to 5 | instant-film prints dealt onto a pile, which spreads out above the Save the Date |
| `split` | up to 4 | panels cut on a slanted seam, each wiping open, the Save the Date in the band between them |
| `booth` | up to 3 | a photo-booth strip whose frames flash in, the Save the Date at the card's foot |
| `mosaic` | up to 6 | staggered rounded tiles surfacing out of the dark, pulled back into a card |
| `film` | up to 4 | a taped film strip whose frames develop one by one |

```jsonc
{
  "cover_stage_layout": {
    // ... every existing key unchanged ...
    "showcaseAnimationType": "stack",   // "decoration" | "door" | "stack"
    "stackLayout": "mosaic"             // "pile" | "split" | "booth" | "mosaic" | "film"
  }
}
```

The frontend treats an unknown `showcaseAnimationType` as `decoration` and an
absent, null or unknown `stackLayout` as `pile`, so the backend doesn't need to
validate either key. If it does, add the values above. Please **default** an
unrecognised value rather than rejecting the whole save. The partner editor now
sends `stackLayout` on every save (as `"pile"` unless another layout is picked),
the same way it already sends `showcaseAnimationType`.

## Which photographs it uses (no change needed)

Only what the showcase payload already carries: the event's `photos`, with
`is_featured`, `order` and the optional `crop_*` fields (each photo's framed
region — every frame shows all of it; see [featured-photo-crop.md](featured-photo-crop.md)).
The stack takes as many
as its layout holds: the featured photos first, in `order`, then the rest of the
gallery in `order`. As on the other two transitions, an event with **no** featured
photo skips the middle stage entirely.

## What to check

1. **`cover_stage_layout` stored verbatim** (`JSONField`, no key or value
   allow-list): nothing to do. Verify by saving a partner template with the
   Opening Animation set to *Photo stack* and the Photo Layout set to *Mosaic*,
   then confirming `"showcaseAnimationType": "stack"` and `"stackLayout": "mosaic"`
   come back on `GET /api/events/templates/partner/<id>/`.
2. **Keys or values validated against a list**: add the `stackLayout` key and
   its five values, and `"stack"` to `showcaseAnimationType`. Otherwise the save
   returns `200`, the editor looks like it worked, and the template renders the
   decoration transition (or the pile) on the next load.

The value must survive both read paths:

- `GET /api/events/<id>/showcase/` → `template_assets.cover_stage_layout`
- `GET /api/core-data/event-templates/<id>/public_template_assets/` → `template_data.cover_stage_layout`

## Frontend reference

- Stage: [`TransitionStageStack.vue`](../../src/components/showcase/TransitionStageStack.vue)
- Layouts: [`photo-stack/layouts/`](../../src/components/showcase/photo-stack/layouts/)
- Photo selection, capacities and timing: [`photoStack.ts`](../../src/components/showcase/photo-stack/photoStack.ts); geometry: [`geometry.ts`](../../src/components/showcase/photo-stack/geometry.ts)
- Cover exit mapping: `coverExitOf` in [`useShowcaseAnimation.ts`](../../src/composables/showcase/useShowcaseAnimation.ts)
- Editor: the Transition section of the partner template form ([`TransitionSection.vue`](../../src/components/template/sections/TransitionSection.vue))
