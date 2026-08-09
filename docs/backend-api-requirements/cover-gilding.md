# Backend API Requirements: Cover Gilding (`coverGilding`)

> **Status: DONE (2026-08-10).** You called it: the serializer did still
> allow-list keys, so `coverGilding` was being dropped exactly as `guestFrame`
> was. Two changes landed on `unstable`:
>
> 1. **`coverGilding` is declared** on `CoverStageLayoutSerializer`
>    (`CoverGildingField` in `core_data/serializers.py`), with the permissive
>    validation asked for below — clamped, never rejected, no server-side
>    defaults, so an absent key stays absent and the frontend resolves it.
> 2. **The general fix is in.** `CoverStageLayoutField` now stores *undeclared*
>    keys verbatim instead of discarding them. Key #4 will round-trip on the day
>    the frontend ships it, with no backend change. Declaring a field is still
>    how a key earns clamping and value checks — the failure mode for an
>    undeclared key is now "stored but unvalidated", not "silently lost".
>
> One bound: undeclared keys are capped at 32 KB in total, and a payload past
> that is rejected with a `400` rather than truncated. A full layout is well
> under 4 KB, so this only exists so an unvalidated key can't be used to push
> unbounded JSON into the row.
>
> `layoutMode`/`coverElements` ([cover-free-placement.md](cover-free-placement.md))
> is confirmed round-tripping too — it has been declared since it shipped, and
> there are now tests over the real multipart path for it, `guestFrame` and
> `coverGilding` alike.
>
> Also covered: the Django admin form rebuilds this blob from its own widgets on
> save, which is a second way a key can be wiped. `coverGilding` has a "Gilded
> Cover Border" fieldset there, and blank fields store nothing rather than
> freezing a template at today's defaults.

## The failure mode, stated up front

If the key is dropped, **nothing looks broken**. The save returns `200`. The
partner template form and the live preview both run off local form state, so the
effect renders correctly for the rest of the session. It only reverts on the next
page load, which is easy to blame on something else. Test with an explicit
save-and-reload, not by eye.

## Overview

`cover_stage_layout.coverGilding` turns on **printed-gold lighting for the cover
artwork** — the effect that makes a flat decoration photo read as an ornate
border catching the light, ported from a reference animation. It renders as four
layers over the cover: a fixed bevel shadow raking a band around the artwork's
edge, two travelling speculars at different speeds and angles, and pulsing glints
on the band's four corners. A fifth setting (`decorationRelief`) casts a shadow
under the four cover decoration images so they sit above the artwork rather than
flat on it.

One setting is **not** confined to the cover: `sparkCount` drives a field of
drifting motes mounted for the life of the showcase, so it carries on into the
main content stage. That has no bearing on storage — it is still one key in this
blob — but it means the setting's blast radius is the whole showcase, which is
worth knowing if a partner reports "sparks on a page that has no cover".

It is **additive, optional, and off by default**. A template that carries no
`coverGilding` key renders byte-for-byte as it does today. This matters for the
serializer decision below: shipping this and having it dropped costs nothing
except the partner's time — it fails to *appear*, it never corrupts an existing
template.

## Shape

```jsonc
{
  "cover_stage_layout": {
    // ... every existing key is unchanged and still present ...
    "contentTopPosition": 23.5,
    "innerContainerHeight": 53,
    "showcaseAnimationType": "door",
    "guestFrame": { "style": "split", "scale": 1 },
    "layoutMode": "rows",

    // --- NEW ---
    "coverGilding": {
      "enabled": true,
      "bandOuter": 2.2,
      "bandInner": 6.9,
      "intensity": "normal",
      "decorationRelief": "soft",
      "cornerFlares": true,
      "sparkCount": 18,
      "colorSource": "accent",
      "customColor": null
    }
  }
}
```

### `coverGilding` fields

Every field is optional; the frontend fills in the default for anything absent,
so a partially-authored object is still a complete config. (In practice the form
always writes all nine.)

| Field | Type | Default | Range / values | Meaning |
| --- | --- | --- | --- | --- |
| `enabled` | boolean | `false` | | Master switch for the whole effect |
| `bandOuter` | number | `2.2` | 0–20 | Outer edge of the lit band, as % of the **stage width** |
| `bandInner` | number | `6.9` | 0.5–30 | Inner edge of the lit band, same units |
| `intensity` | string | `"normal"` | `subtle` \| `normal` \| `bright` | Scales every layer's strength at once |
| `decorationRelief` | string | `"soft"` | `none` \| `soft` \| `raised` | Cast-shadow depth under the four cover decorations |
| `cornerFlares` | boolean | `true` | | Pulsing glints at the band's four corners |
| `sparkCount` | integer | `18` | 0–40 | Drifting motes; `0` disables them. **Spans every stage**, not just the cover |
| `colorSource` | string | `"accent"` | `primary` \| `secondary` \| `accent` \| `custom` | Palette slot the sparks and corner glow are tinted from |
| `customColor` | string \| null | `null` | `#rrggbb` | Read only when `colorSource` is `custom` |

Both band edges are percentages of the **stage width** on both axes — not of each
side's own axis — so the band stays a uniform thickness all the way round on a
stage that is not 9:16.

### The one cross-field constraint

`bandInner` must be **greater than** `bandOuter`. The band is an annulus; a pair
that doesn't describe a ring would light the artwork's middle and leave its
border flat, which is the opposite of the effect. The frontend already falls back
to the default pair (`2.2` / `6.9`) when the stored pair is invalid, so this
needs no backend enforcement — it is documented because it is the one place where
two fields are not independent.

### Why `colorSource` names a slot instead of carrying a hex

Same reason as `coverElements`' `colorSource` and `falling_effect` /
`ambient_creatures` before it: `template_colors` is the template's single source
of palette, so a baked-in hex would fork it and recolouring a template would stop
propagating to the cover. `custom` + `customColor` is the escape hatch.

Note the travelling speculars deliberately do **not** take the palette — they are
a fixed near-white. Any polished surface's highlight is near-white whatever the
metal's base hue, so tinting it turns light on gold into a coloured wash sliding
over the artwork. Only the sparks and the corner glow are tinted.

## What to do

The frontend sends the whole object as one JSON string in `FormData`
([`src/services/api/modules/templates.service.ts`](../../src/services/api/modules/templates.service.ts)):

```js
formData.append('cover_stage_layout', JSON.stringify(payload.cover_stage_layout))
```

So the only question is what the serializer does with it:

1. **Stored verbatim (`JSONField`, no key allow-list)** → nothing to do, and
   please record that here so the next additive key doesn't have to re-ask.
2. **Validated against an explicit key list, or rebuilt field by field** → add
   `coverGilding` to that list. This is what `guestFrame` hit.

**Strongly preferred: fix it once, generally.** Three additive keys have now gone
into this blob and at least one was silently dropped. If the serializer still
allow-lists keys, consider storing `cover_stage_layout` verbatim (or merging
unknown keys through) rather than adding `coverGilding` and waiting for the
fourth key to hit the same wall. The blob is partner-authored presentation
config — there is nothing in it worth an allow-list's maintenance cost.

### Test procedure

1. In the partner template form, open **Cover layout → Gilded Cover Border**,
   switch it on, set `intensity` to `bright` and `sparkCount` to `30`.
2. Save. Confirm `200`.
3. **Reload the page** and reopen the same template.
4. The switch must still be on with `bright` / `30` still set. If it is off and
   back to defaults, the key was dropped.

Also confirm the blob survives **both** read paths, or a template will look right
in the partner editor and wrong to guests:

- `GET /api/events/<id>/showcase/` → `template_assets.cover_stage_layout` (paid)
- `GET /api/events/templates/<id>/public-assets/` → `template_data.cover_stage_layout`
  (the unpaid-preview fallback, see [public-template-assets-decorations.md](public-template-assets-decorations.md))

## Validation, if any is added

Keep it permissive, and prefer clamping to rejecting — the form already clamps on
every edit, so an out-of-range value means old or hand-written data, and refusing
the whole save over it costs a partner their work.

- `enabled`, `cornerFlares` — coerce to boolean.
- `bandOuter` ∈ [0, 20], `bandInner` ∈ [0.5, 30]. Do **not** reject a pair where
  `bandInner <= bandOuter`; the frontend handles it.
- `intensity` ∈ `{subtle, normal, bright}`, `decorationRelief` ∈
  `{none, soft, raised}`, `colorSource` ∈ `{primary, secondary, accent, custom}`
  — drop an unrecognised value rather than failing the save. The frontend treats
  a missing field as "use the default", which is the safe outcome.
- `sparkCount` ∈ [0, 40], rounded to an integer.
- `customColor` — `#rrggbb` or null. Only meaningful when `colorSource` is
  `custom`; harmless to store either way.

## Frontend reference

- Types: [`src/services/api/types/template.types.ts`](../../src/services/api/types/template.types.ts) —
  `CoverGildingConfig`, `CoverGildingIntensity`, `CoverGildingColorSource`,
  `CoverDecorationRelief`
- Defaults + resolution: [`src/composables/showcase/useCoverStageLayout.ts`](../../src/composables/showcase/useCoverStageLayout.ts) —
  `COVER_GILDING_DEFAULTS`, `resolveCoverGilding`, `COVER_DECORATION_RELIEF_FILTERS`
- Band lighting: [`src/components/showcase/cover/CoverGilding.vue`](../../src/components/showcase/cover/CoverGilding.vue),
  mounted by [`src/components/showcase/CoverContentOverlay.vue`](../../src/components/showcase/CoverContentOverlay.vue)
  (decoration animation) and [`src/components/showcase/cover/DoorPanel.vue`](../../src/components/showcase/cover/DoorPanel.vue)
  (one instance per door leaf)
- Sparks: [`src/components/showcase/cover/CoverSparks.vue`](../../src/components/showcase/cover/CoverSparks.vue),
  mounted once by [`src/components/showcase/CoverStage.vue`](../../src/components/showcase/CoverStage.vue)
  so the field spans every stage
- Decoration relief: [`src/components/showcase/cover/CoverDecorations.vue`](../../src/components/showcase/cover/CoverDecorations.vue)
- Editor pane: the Cover Layout section of [`src/components/template/PartnerTemplateForm.vue`](../../src/components/template/PartnerTemplateForm.vue)

## Related

- [guest-name-frame-styles.md](guest-name-frame-styles.md) — the same blob, the
  same additive design, and the serializer change this one probably needs
- [cover-free-placement.md](cover-free-placement.md) — the same blob again, still
  unverified; worth testing in the same sitting
