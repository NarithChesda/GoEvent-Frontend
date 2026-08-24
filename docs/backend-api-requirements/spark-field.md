# Backend API Requirements: Standalone Spark Field (`sparks` + `spark_custom_image`)

> **Status: DONE (2026-08-16).** Both fields exist on `EventTemplate`
> (migration `core_data/0037_eventtemplate_spark_custom_image_and_more`) and
> round-trip on every read path — the partner detail read, the paid showcase
> (`template_assets.sparks`) and the unpaid-preview fallback
> (`template_data.sparks`). Specifically:
>
> - **`enabled: false` is stored**, never normalised into a missing blob, and
>   the rest of the settings ride along on a disabled blob. `null` still means
>   "no standalone config" and hands the field back to the gilding.
> - **Unknown keys are stored verbatim** (no allow-list), so the next additive
>   key on this blob needs no backend change. `custom_image` is the one key
>   discarded on write — it is injected on read from `spark_custom_image`.
> - **Numbers are clamped, never rounded or rejected**; junk numbers and unknown
>   `shape` / `color_source` / `intensity` values are dropped rather than failing
>   the save. An inverted size pair is stored as sent for the renderer to
>   discard.
> - **The legacy gilding fields are untouched** — `sparkCount`, `colorSource`
>   and `customColor` still round-trip through `CoverGildingField`.
> - **The Django admin** gained a "Drifting Sparks" section rather than being
>   left to rebuild the blob away. Its master switch is tri-state: blank stores
>   nothing (legacy fallback), "Off" stores `{"enabled": false}`.
>
> One caveat on the custom image, inherited from `falling_effect_custom_image`
> and not changed here: the shared image validator allows
> `.jpg/.jpeg/.png/.gif/.webp/.bmp` only, so an **SVG upload is rejected** with a
> 400 despite what the hint text on both fields says. Use PNG. Widening the
> validator is its own request.

## The ask, in one line

Add a `sparks` JSON blob and a `spark_custom_image` file field to the partner
template, alongside the existing `falling_effect` / `falling_effect_custom_image`
pair they are modelled on.

## The failure mode, stated up front

Same trap as [`coverGilding`](cover-gilding.md) and
[`falling_effect.speed`](falling-effect-speed.md): if the field is dropped,
**nothing looks broken**. The save returns `200`, and the partner template form
and its live preview both run off local form state, so the sparks keep rendering
as configured for the rest of the session. It only reverts on the next page load.

**Test with an explicit save-and-reload, not by eye.**

There is one extra wrinkle here, because this field replaces an older one — see
[Legacy behaviour](#legacy-behaviour-do-not-skip). If `sparks` is dropped, the
frontend does not fall back to "off", it falls back to the **legacy gilding
fields**. A partner who switches sparks off will see them come back on reload if
their template also has gilding enabled.

## Why this exists

The drifting spark motes used to be configured inside `cover_stage_layout.coverGilding`,
as `sparkCount` / `colorSource` / `customColor`. That tied them to a cover-band
lighting effect they never belonged to:

- The spark field is mounted by `CoverStage` for the **life of the showcase** and
  drifts on through the transition into the main content stage. Every other
  gilding setting is confined to the cover's printed border.
- Gating them on `coverGilding.enabled` meant a template that wanted ambient
  sparkle had to switch on band lighting it may have had no border to catch — and
  a template that wanted the border lit but no sparkle had to set `sparkCount: 0`.

So sparks are now an independent decoration with the same standalone shape
`falling_effect` and `ambient_creatures` already have, and they gain the
customisation those have: blink speed, size range, count, colour, a choice of
built-in shape, and a custom image upload.

## Shape

```jsonc
{
  "sparks": {
    "enabled": true,
    "count": 18,
    "blink_speed": 1.4,
    "min_size": 0.46,
    "max_size": 1.94,
    "shape": "sparkle",
    "color_source": "accent",
    "custom_color": null,
    "intensity": "normal"
  }
}
```

`custom_image` is **not** sent on write. Like `falling_effect.custom_image`, it is
injected into the read payload from the `spark_custom_image` file field — storing
a copy in the blob would freeze a stale URL.

### The fields

| Field | Type | Default | Range / values | Meaning |
| --- | --- | --- | --- | --- |
| `enabled` | bool | `true` when the blob exists | — | Master switch. See the note below — **`false` must round-trip** |
| `count` | int | `18` | 0–60 | How many motes. `0` is off |
| `blink_speed` | number | `1` | 0.25–4 | Pulse-rate multiplier. `1` is the original 12s cycle |
| `min_size` | number | `0.46` | 0.1–8 | Smallest mote, as a **% of stage width** |
| `max_size` | number | `1.94` | 0.1–8 | Largest mote, same units |
| `shape` | string | `"glow"` | `glow`, `sparkle`, `star`, `diamond`, `cross`, `dot` | Built-in shape. Ignored when a custom image is set |
| `color_source` | string | `"accent"` | `primary`, `secondary`, `accent`, `custom` | Which palette slot tints the motes |
| `custom_color` | string\|null | `null` | hex | Read only when `color_source` is `custom` |
| `intensity` | string | `"normal"` | `subtle`, `normal`, `bright` | Overall brightness |

Sizes are **percentages of the stage width, not pixels**, and are non-integer on
purpose (the studio control steps by `0.02`). The showcase stage is
`min(100vw, 56.25vh)`, so a pixel size tuned on a desktop lands twice as heavy on
a phone; percent keeps the motes proportional on any screen. Do not round these
to integers on the way in or out.

`blink_speed` is likewise non-integer — the slider steps by `0.05`.

### `enabled: false` must be stored, not normalised to a missing blob

The frontend deliberately sends the whole object even when the effect is off,
as `{"enabled": false, ...}`, rather than sending `null`. This is load-bearing:
`null` means "no standalone config", which the renderer reads as the instruction
to fall back to the legacy gilding fields. For a template that has gilding
enabled, normalising `enabled: false` into a null/absent blob would turn the
sparks the partner just switched off straight back on.

The rest of the settings ride along on a disabled blob so toggling the effect back
on restores what was there. Please store them.

## Legacy behaviour (do not skip)

Every template saved before this change has no `sparks` blob. Those must keep
rendering exactly as they do today, so the frontend falls back to the gilding
fields when `sparks` is absent (`resolveSparkField` in `useSparkField.ts`):

| Absent `sparks` field | Falls back to |
| --- | --- |
| `enabled` | `coverGilding.enabled` |
| `count` | `coverGilding.sparkCount` |
| `color_source` | `coverGilding.colorSource` |
| `custom_color` | `coverGilding.customColor` |
| `intensity` | `coverGilding.intensity` |

**`coverGilding.sparkCount`, `colorSource` and `customColor` therefore must keep
round-tripping.** They are marked `@deprecated` in the TypeScript types, but they
are still the live source of truth for every already-published template. Do not
drop them from `cover_stage_layout`.

The partner form seeds its new controls from those same legacy values when it
opens a template with no `sparks` blob, so a partner who opens an old template and
saves it writes the values forward — the migration happens naturally, per
template, with no data migration needed.

## The custom image

`spark_custom_image` is a new file field, behaving **exactly** like
`falling_effect_custom_image`:

- A `File` in the `FormData` uploads and replaces.
- An empty string `''` is the explicit delete instruction.
- An absent key leaves the stored file alone.

Its URL must be injected into the read payload as `sparks.custom_image` — the
same way `falling_effect_custom_image` becomes `falling_effect.custom_image` —
since the frontend reads the image off the config blob, not off a sibling field.

Recommended specs (documented in the studio's own hint text): transparent PNG or
SVG, 64×64 to 128×128, under 20 KB.

## What to do

The frontend sends the blob as one JSON string in `FormData`
([`src/services/api/modules/templates.service.ts`](../../src/services/api/modules/templates.service.ts)):

```js
formData.append('sparks', JSON.stringify(payload.sparks))
formData.append('spark_custom_image', payload.spark_custom_image) // File or ''
```

Both are new, so unlike the previous two requests there is no allow-list to
loosen — just declare them. Please follow the precedent set by the
`falling_effect` fix and **store unrecognized keys verbatim** rather than
allow-listing, so the next additive key on this blob needs no backend change.

Also check the **Django admin form**: if it rebuilds template blobs from its own
widgets on save, a template edited in admin will lose `sparks` even when the API
path is correct.

### Test procedure

1. In the partner template form, open **Background → Drifting Sparks**, switch it
   on, and change several settings away from their defaults — set **Blink speed**
   to `2.5`, **Spark shape** to *Star*, and **Spark count** to `40`.
2. Save. Confirm `200`.
3. **Reload the page** and reopen the same template. Every value must survive.
4. Switch sparks **off**, save, reload. They must still be off — on a template
   with *Gilded Cover Border* enabled, this is the case that catches an
   `enabled: false` normalised into a dropped blob.
5. Upload a custom spark image, save, reload. Confirm it renders, then remove it
   and confirm the built-in shape picker comes back.
6. Open a template saved **before** this change that has gilding enabled. Its
   sparks must render as they always did, and the form must show the legacy count
   and tint rather than the defaults.

Confirm the blob survives **both** read paths, or the effect will look right in
the partner editor and wrong to guests:

- `GET /api/events/<id>/showcase/` → `template_assets.sparks` (paid)
- `GET /api/events/templates/<id>/public-assets/` → `template_data.sparks`
  (the unpaid-preview fallback, see
  [public-template-assets-decorations.md](public-template-assets-decorations.md))

## Validation, if any is added

Keep it permissive, and prefer clamping to rejecting — the form already clamps on
every edit, so an out-of-range value means old or hand-written data, and refusing
the whole save over it costs a partner their work.

- `count` — coerce to int, clamp to `[0, 60]`
- `blink_speed` — coerce to float, clamp to `[0.25, 4]`. Do **not** round
- `min_size` / `max_size` — coerce to float, clamp to `[0.1, 8]`. Do **not**
  round. An inverted pair (`min > max`) is discarded by the renderer in favour of
  the defaults, so it need not be rejected
- `shape`, `color_source`, `intensity` — unknown values should be dropped rather
  than failing the save; the frontend falls back to its own defaults

The frontend clamps identically on both read and write (`resolveSparkField`), so
a stored value outside the range renders at the nearest bound — backend clamping
is defence in depth, not a correctness requirement.

## Frontend reference

- Types: [`src/services/api/types/template.types.ts`](../../src/services/api/types/template.types.ts) —
  `SparkFieldConfig`, `SparkShape`, `SparkColorSource`
- Ranges, defaults, resolution and the legacy fallback:
  [`src/composables/showcase/useSparkField.ts`](../../src/composables/showcase/useSparkField.ts) —
  `resolveSparkField`, `SPARK_BLINK_SPEED_RANGE`, `SPARK_SIZE_RANGE`, `SPARK_MAX_COUNT`
- Tests pinning the legacy fallback:
  [`src/composables/showcase/useSparkField.spec.ts`](../../src/composables/showcase/useSparkField.spec.ts)
- Component: [`src/components/showcase/cover/CoverSparks.vue`](../../src/components/showcase/cover/CoverSparks.vue)
- Mounted once for every stage by
  [`src/components/showcase/CoverStage.vue`](../../src/components/showcase/CoverStage.vue)
- Studio controls: [`src/components/template/PartnerTemplateForm.vue`](../../src/components/template/PartnerTemplateForm.vue) —
  the **Drifting Sparks** section
- The deprecated fields it replaces: `CoverGildingConfig.sparkCount` /
  `colorSource` / `customColor`, see [cover-gilding.md](cover-gilding.md)
