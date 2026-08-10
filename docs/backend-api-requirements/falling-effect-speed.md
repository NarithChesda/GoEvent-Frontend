# Backend API Requirements: Falling Effect Speed (`falling_effect.speed`)

> **Status: DONE (2026-08-10).** `speed` round-trips on both read paths.
> `falling_effect` **was** case 2 — an explicit four-key allow-list — so the
> general fix was applied here too: unrecognized keys are now stored verbatim,
> and the next additive key on this blob needs no backend change at all. One
> exception, worth knowing before you round-trip a GET response into a PATCH:
> `custom_image` is still discarded on write, because the read payload injects
> it from the `falling_effect_custom_image` file field and a stored copy would
> freeze a stale URL. The Django admin form was rebuilding this blob from its
> own widgets; it now starts from what is stored, and has a Fall Speed widget
> that stores nothing when left blank.

## The ask, in one line

Add `speed` (a number, default `1`) to whatever validates/serializes the
`falling_effect` blob, so it round-trips instead of being dropped on save.

## The failure mode, stated up front

Same trap as [`coverGilding`](cover-gilding.md): if the key is dropped,
**nothing looks broken**. The save returns `200`, and the partner template form
and its live preview both run off local form state, so the petals keep falling at
the chosen speed for the rest of the session. It only snaps back to the default
on the next page load, which is easy to blame on something else.

**Test with an explicit save-and-reload, not by eye.**

## Overview

`falling_effect` already controls *which* particle falls (`type`), *how many* are
on screen (`intensity`), and *what colour* they are (`color_source` /
`custom_color` / `custom_image`). It has never controlled *how fast* they fall —
that was a fixed 10–17s traversal baked into the renderer.

`speed` is a plain multiplier over that traversal:

- `1` — exactly today's speed. **This is the default, and it is what an absent
  key resolves to**, so every existing template renders byte-for-byte as it does
  now.
- `> 1` — faster. `2` halves the fall time.
- `< 1` — slower. `0.5` doubles it, for a slow, floating drift.

It is **additive, optional, and inert by default**: shipping the frontend before
the backend costs nothing but the partner's time — the setting fails to *persist*,
it never corrupts an existing template.

### Speed is not intensity

Worth knowing when a partner asks why the field looks unchanged in count: the
renderer rescales the **spawn interval** by the same factor. At `2` each particle
clears the stage in half the time, so it also spawns twice as often, and the
number on screen stays whatever `intensity` asked for. The two settings are
deliberately orthogonal — `intensity` is *how many*, `speed` is *how fast*.

## Shape

```jsonc
{
  "falling_effect": {
    // ... every existing key is unchanged and still present ...
    "type": "petals",
    "color_source": "primary",
    "custom_color": null,
    "custom_image": null,
    "intensity": "normal",

    // --- NEW ---
    "speed": 1.35
  }
}
```

### The new field

| Field | Type | Default | Range | Meaning |
| --- | --- | --- | --- | --- |
| `speed` | number | `1` | 0.25–3 | Fall-speed multiplier. `1` is the original speed; `>1` faster, `<1` slower |

Non-integer on purpose — the studio control is a slider with a `0.05` step, so
values like `1.35` and `0.75` are normal and must not be rounded to an integer on
the way in or out.

### Why a number and not `slow | normal | fast`

`ambient_creatures.speed` is a three-value enum, so the inconsistency is
deliberate and worth recording. Three presets is the right shape for creature
flight, where the three feel qualitatively different (a drifting firefly, a
darting dragonfly). Petal fall speed is one continuous quantity that partners tune
against their own artwork by eye, and the useful values sit close together — the
difference between `1.2` and `1.5` is visible and neither is "normal" or "fast".
A slider also gives `1` an exact meaning ("what it looked like before I touched
it"), which a preset list can't.

## What to do

The frontend sends the whole object as one JSON string in `FormData`
([`src/services/api/modules/templates.service.ts`](../../src/services/api/modules/templates.service.ts)):

```js
formData.append('falling_effect', JSON.stringify(payload.falling_effect))
```

So the only question is what the serializer does with it:

1. **Stored verbatim (`JSONField`, no key allow-list)** → nothing to do. Please
   record that here so the next additive key doesn't have to re-ask.
2. **Validated against an explicit key list, or rebuilt field by field** → add
   `speed` to that list.

The general fix noted in [cover-gilding.md](cover-gilding.md) — undeclared keys
stored verbatim rather than discarded — was applied to `cover_stage_layout`.
**`falling_effect` is a different field and may not have been covered by it.**
Please confirm which of the two cases above applies here; if `falling_effect`
still allow-lists, the same general fix is worth more than adding one key.

Also check the **Django admin form**: if it rebuilds this blob from its own
widgets on save, a template edited in admin will lose `speed` even when the API
path is correct. Blank widgets should store nothing rather than freezing a
template at today's defaults.

> **Answered.** It was case 2 — `PartnerTemplateCreateSerializer.validate_falling_effect`
> ended with `allowed_keys = {'type', 'color_source', 'custom_color', 'intensity'}`,
> so `speed` was dropped exactly as predicted. The general fix went in rather
> than one key: the allow-list is gone, `speed` is declared (coerced and clamped),
> and everything else is kept as sent under an 8 KB cap on the object. The admin
> form was also rebuilding the blob from scratch and now preserves what it has no
> widget for.

### Test procedure

1. In the partner template form, open **Background → Falling Particles**, switch
   it on, and drag **Fall Speed** to something obviously not `1` — `0.35` or
   `2.8`.
2. Save. Confirm `200`.
3. **Reload the page** and reopen the same template.
4. The slider must still read the value you set. If it reads `1×`, the key was
   dropped.

Confirm the blob survives **both** read paths, or the effect will look right in
the partner editor and wrong to guests:

- `GET /api/events/<id>/showcase/` → `template_assets.falling_effect` (paid)
- `GET /api/events/templates/<id>/public-assets/` → `template_data.falling_effect`
  (the unpaid-preview fallback, see
  [public-template-assets-decorations.md](public-template-assets-decorations.md))

## Validation, if any is added

Keep it permissive, and prefer clamping to rejecting — the form already clamps on
every edit, so an out-of-range value means old or hand-written data, and refusing
the whole save over it costs a partner their work.

- `speed` — coerce to float, clamp to `[0.25, 3]`. Do **not** round to an
  integer. A non-numeric or absent value should be dropped/left absent rather
  than failing the save: the frontend treats a missing `speed` as `1`, which is
  the safe outcome.

The frontend clamps identically on both read and write (`resolveFallingSpeed`),
so a stored value outside the range renders at the nearest bound rather than
breaking — backend clamping is defence in depth, not a correctness requirement.

## Frontend reference

- Type: [`src/services/api/types/template.types.ts`](../../src/services/api/types/template.types.ts) —
  `FallingEffectConfig.speed`
- Range, clamping and the renderer:
  [`src/composables/showcase/useFallingParticles.ts`](../../src/composables/showcase/useFallingParticles.ts) —
  `FALLING_SPEED_RANGE`, `resolveFallingSpeed`, and the `duration` / spawn-interval
  derivation
- Component: [`src/components/showcase/FallingEffect.vue`](../../src/components/showcase/FallingEffect.vue)
- Studio control: [`src/components/template/PartnerTemplateForm.vue`](../../src/components/template/PartnerTemplateForm.vue) —
  the **Fall Speed** slider in the Falling Particles section
