# Backend API Requirements: Font Metric Normalization (`size_adjust` + `size_scale`)

> **Status: PENDING.** The frontend ships the whole mechanism reading fields that
> do not exist yet. Every one of them defaults to "unadjusted", so until the
> backend lands them the showcase renders exactly as it does today — nothing is
> broken while this waits, and nothing needs a feature flag.

## The ask, in one line

Add four metric fields to the **font library** record (the one behind
`/api/core-data/custom-fonts/`) and one `size_scale` field to the
**template font row** (`language` × `font_type`), and echo all five on every read
path that already returns fonts.

## The failure mode, stated up front

Same trap as [`sparks`](spark-field.md) and [`coverGilding`](cover-gilding.md):
if these fields are dropped, **nothing looks broken**. The save returns `200`, the
partner template form and its live preview both run off local state, and the type
keeps rendering at the size the partner just dialled for the rest of the session.
It reverts on the next page load.

**Test with an explicit save-and-reload, not by eye.**

There is one wrinkle specific to this field. A dropped `size_scale` does not
render "wrong" in any obvious way — it renders at the font's *natural* size, which
is a plausible-looking result. The only reliable check is that the number the
partner set comes back in the payload.

## Why this exists

The showcase carries roughly **400 hard-coded `font-size` declarations** across
its cover, transition and main-content stages, and a partner chooses the typeface
those sizes render in.

Two faces set at the same `font-size: 2rem` do not look the same size. How much of
its em square a typeface's glyphs occupy is the type designer's choice, and it
varies widely — a face whose cap height is 0.70em next to one at 0.62em renders
13% larger at an identical setting. Khmer faces add a second axis: coeng
subscripts and stacked diacritics push their ascent and descent far past a Latin
face's, so the same em box needs a taller line box before anything clips.

Today the frontend compensates **downstream, at the symptom**: `rem` values
hand-tuned against one family, and a blanket `line-height: 1.8 !important` for
Khmer in `khmer-text-fix`. That only ever holds for the font it was tuned against,
which is why a partner swapping in a new font finds it lands too big in some
sections and too small in others — the very report that prompted this work.

The fix is to correct the face itself, once, where the discrepancy originates.
CSS has descriptors for exactly this — `size-adjust`, `ascent-override`,
`descent-override`, `line-gap-override` — which scale the glyphs *inside* the em
box. `2rem` still computes to 32px, no line box moves and nothing reflows, so
every existing declaration keeps working untouched.

### Why the split across two models

| | Lives on | Answers | Set by |
| --- | --- | --- | --- |
| `size_adjust` and the overrides | the **font library** record | "How much does this typeface deviate from the reference?" | measured once, per face |
| `size_scale` | the **template font row** | "How big does *this design* want its type?" | the partner, per template |

"Moul renders 12% large" is a fact about Moul, not about any template. Storing it
on the library record means every template that ever picks Moul is corrected for
free — including templates saved before the field existed, with no data
migration.

`size_scale` is the partner's taste knob on top. Because template font rows are
already per-language, it is also how a template says "Khmer a touch smaller"
without touching its English type — which is the specific control partners asked
for.

The frontend **multiplies** the two into the single `size-adjust` it emits. It
never picks one over the other: the library value says what the face does wrong,
the template value says what the design wants, and a partner who dialled a scale
on an uncalibrated face keeps their intent when that face is calibrated later.

## Shape

### 1. Font library record

The model behind `/api/core-data/custom-fonts/` — the same record that appears
nested as `font` inside a template font row.

```jsonc
{
  "id": 12,
  "name": "Moul",
  "font_file": "/media/fonts/moul.woff2",
  "size_adjust": 0.88,
  "ascent_override": 1.05,
  "descent_override": 0.35,
  "line_gap_override": null
}
```

| Field | Type | Default | Range | Meaning |
| --- | --- | --- | --- | --- |
| `size_adjust` | decimal \| null | `null` (= 1) | 0.5–2 | Glyph scale inside the em box. `1` = the face is already the reference size |
| `ascent_override` | decimal \| null | `null` | 0–3 | Ascent as a fraction of the em. `null` = keep the font's own |
| `descent_override` | decimal \| null | `null` | 0–3 | Descent as a fraction of the em |
| `line_gap_override` | decimal \| null | `null` | 0–3 | Line gap as a fraction of the em |

**These are fractions, not percentages.** `0.88` means 88%. The frontend converts
to the CSS percentage form on the way out. Please keep the stored form a plain
multiplier so it reads the same as `size_scale`.

`null` and `1` are **not** interchangeable for the three overrides: `null` means
"leave the font's own vertical metrics alone", while `1` means "force ascent to
exactly one em". For `size_adjust` they do mean the same thing, and either is
fine to store.

Suggested field definition:

```python
size_adjust = models.DecimalField(
    max_digits=4, decimal_places=3, null=True, blank=True,
    help_text="Glyph scale inside the em box. 1.0 = unadjusted. See size-adjust.",
)
```

Three decimal places is enough — the studio rounds its measurement to two, and
the third is headroom for a calibration job that wants finer.

### 2. Template font row

The model behind `/api/core-data/partner-templates/<id>/fonts/`.

```jsonc
{
  "id": 87,
  "language": "kh",
  "language_display": "Khmer",
  "font": { "id": 12, "name": "Moul", "font_file": "...", "size_adjust": 0.88 },
  "font_type": "primary",
  "font_type_display": "Primary",
  "size_scale": 0.94
}
```

| Field | Type | Default | Range | Meaning |
| --- | --- | --- | --- | --- |
| `size_scale` | decimal | `1` | 0.6–1.6 | The partner's size trim for this row |

Default `1`, **not null** — a row with no trim is a normal row, not an
unconfigured one, and `1` says so without every reader having to coalesce. The
frontend treats `null`, `""` and a missing key as `1` regardless, so either
choice is safe; `1` is just the honest one.

`size_scale` is writable on both **create** and **update** of a font row. The
frontend sends it on every save, including when it is `1`.

## Where it has to appear on read

Fonts reach the showcase through several endpoints, and the type will look right
in one place and wrong in another if any of them drops the fields. All five must
survive on:

| Endpoint | Path in the payload |
| --- | --- |
| `GET /api/events/<id>/showcase/` | `event.template_fonts[]`, and `event.template_assets.fonts[]` |
| `GET /api/core-data/event-templates/<id>/public_template_assets/` | `template_data.fonts[]` (the unpaid-preview fallback, see [public-template-assets-decorations.md](public-template-assets-decorations.md)) |
| `GET /api/core-data/partner-templates/<id>/` | `template_fonts[]` |
| `GET /api/core-data/partner-templates/<id>/fonts/` | the row list |
| `GET /api/core-data/custom-fonts/` | the library list — **the four library fields specifically** |

The last one matters more than it looks. The studio's calibrate button and its
size slider both run against the library list, so a font library that does not
expose its own `size_adjust` leaves the partner tuning against an uncorrected
face and baking the correction into `size_scale` — which then has to be redone by
hand on every template once the library is calibrated.

## Decimals as strings is fine

DRF serializes `DecimalField` as a string by default (`"0.880"`). The frontend
parses both forms and there is a test pinning that
(`src/utils/fontMetrics.spec.ts`), so `COERCE_DECIMAL_TO_STRING` can stay however
it is set project-wide. Do not, however, serialize them as **integers** — a
`size_adjust` of `0.88` rounded to `1` on the way out silently discards the whole
calibration.

## Validation, if any is added

Keep it permissive, and prefer clamping to rejecting — the studio clamps on every
edit, so an out-of-range value means old or hand-written data, and refusing the
whole save over it costs a partner their work.

- `size_adjust` — clamp to `[0.5, 2]`
- `ascent_override` / `descent_override` / `line_gap_override` — clamp to `[0, 3]`
- `size_scale` — clamp to `[0.6, 1.6]`

The frontend clamps identically on read (`resolveFontMetrics`), and clamps the
**product** of `size_adjust × size_scale` rather than each factor, so two
individually valid numbers can never combine into something illegible. Backend
clamping is defence in depth, not a correctness requirement.

## Since partners upload their own fonts, calibration is the harder half

The Aug 2026 font-library release let partners upload their own typefaces
(`POST /api/core-data/custom-fonts/`, `source=partner`). That changes the shape of
this request in one important way.

`size_adjust` lives on the library record and is **not** partner-writable — which
is right, since it is a measured fact rather than a preference. But it means every
font a partner uploads arrives uncalibrated, and there is nobody to calibrate it:
staff would have to measure each partner's private uploads by hand, one at a time,
for fonts they never see.

So for partner uploads the two fields land in very different places:

| | Partner-uploaded font | Staff-curated system font |
| --- | --- | --- |
| `size_adjust` | nobody to set it — **derive it on upload** | staff can measure it once |
| `size_scale` | the partner's only lever | the partner's taste knob |

Without derivation, a partner's own font is corrected entirely through
`size_scale`, per template, by hand — which works (the studio's **Match reference
size** button measures it in the browser) but has to be redone on every template
that uses the font, and is lost the moment they add a second language.

**Deriving `size_adjust` in the upload handler is therefore the recommendation,
not a nice-to-have.** It is also the cheapest place to do it: the file is already
open, `fontTools` reads the metrics directly, and the partner never has to know
the concept exists.

## Calibrating on upload

The four library fields can be derived rather than typed, by comparing the
uploaded face against a reference face for its script. The frontend does this in
the browser for `size_scale` (canvas `TextMetrics.actualBoundingBoxAscent` on a
single probe glyph — `H` for Latin, `ក` for Khmer — against a reference family).

Doing the same server-side at upload time, with `fontTools` reading the real
`OS/2` and `hhea` tables, would be strictly better: it reads the font's declared
metrics instead of inferring them from a raster, and it means a font arrives in
the library already correct so no partner ever has to think about it.

```python
from fontTools.ttLib import TTFont

def derive_metrics(path, reference_cap_ratio):
    f = TTFont(path)
    upm = f["head"].unitsPerEm
    cap = getattr(f["OS/2"], "sCapHeight", None) or f["OS/2"].sxHeight
    return {
        "size_adjust": round(reference_cap_ratio / (cap / upm), 3),
        "ascent_override": round(f["hhea"].ascent / upm, 3),
        "descent_override": round(abs(f["hhea"].descent) / upm, 3),
    }
```

`reference_cap_ratio` is the same ratio measured from the face the showcase's
sizes were tuned against — `Inter` for Latin scripts, `Kantumruy Pro` for Khmer
(the full map is `METRIC_REFERENCE_FAMILY` in `src/utils/fontMetrics.ts`).
Calibrating to those specifically is what keeps today's templates looking the
same: the reference face measures as `1.0` and does not move.

One caveat on the script map: it is keyed by the *language* a template row is
declared for, which the upload handler does not know — a font file arrives with no
language attached. Reading the font's own `cmap` for which script it actually
covers is the reliable way to pick the reference, and it also handles the case a
language key cannot: a face that covers both Latin and Khmer.

## What to do

1. Add the four decimal fields to the font library model, and `size_scale` to the
   template font row model. Migrations for both.
2. Expose them on the serializers listed under
   [Where it has to appear on read](#where-it-has-to-appear-on-read).
3. Accept `size_scale` on font-row create and update. Keep `size_adjust` and the
   overrides **read-only for partners** — a measured fact about a typeface is not
   a per-account preference, and `size_scale` is the lever partners are given.
4. Derive `size_adjust` (and ideally the two vertical overrides) in the
   `POST /custom-fonts/` handler, per the section above. Without it, partner
   uploads are the one case with no path to being calibrated at all.
5. Add all five to the **Django admin** for their models, so a font can be
   recalibrated without a shell. Check that the admin form does not rebuild the
   template's font rows from its own widgets on save — if it does, a template
   edited in admin will lose its `size_scale` values even when the API path is
   correct.

### Test procedure

1. In the partner template studio, open **Fonts**, pick a Khmer font, press
   **Match reference size**, then drag the **Size** slider to something obviously
   different — say `0.80`. The preview beside it must resize as you drag.
2. Save. Confirm `200`.
3. **Reload the page** and reopen the same template. The row must still read 80%.
4. Open the event's showcase as a guest
   (`GET /api/events/<id>/showcase/`) and confirm the Khmer text renders at the
   reduced size — this is the read path that actually matters and the one most
   likely to be missed, since the studio has its own.
5. Set `size_adjust` on that font's **library** record via admin, reload the
   studio, and confirm the rendered size shifts again — proving the two fields
   multiply rather than one shadowing the other.
6. Open a template saved **before** this change. Every font must render exactly
   as it did, and the studio must show its size as `1x`.

## Frontend reference

- The whole mechanism, with the reasoning:
  [`src/utils/fontMetrics.ts`](../../src/utils/fontMetrics.ts) —
  `resolveFontMetrics`, `fontMetricDescriptorCss`, `deriveSizeScale`,
  `METRIC_REFERENCE_FAMILY`
- Tests pinning the defaults, the string-decimal parsing and the clamping:
  [`src/utils/fontMetrics.spec.ts`](../../src/utils/fontMetrics.spec.ts)
- Where the descriptors are emitted:
  [`src/composables/showcase/useFontManager.ts`](../../src/composables/showcase/useFontManager.ts) —
  `injectFontFaceCSS`, `executeLoadWithRetry`
- Types:
  [`src/services/api/types/template.types.ts`](../../src/services/api/types/template.types.ts) —
  `EventTemplateFont`, `EventTemplateLanguageFont`, `CustomFont`,
  `CreateTemplateFontPayload`
- Studio controls:
  [`src/components/template/PartnerTemplateForm.vue`](../../src/components/template/PartnerTemplateForm.vue) —
  the **Fonts** section
- The preview bridge that carries the fields into the live frame:
  [`src/components/template/partnerTemplateAssets.ts`](../../src/components/template/partnerTemplateAssets.ts) —
  `toShowcaseFonts`

## Browser support, for the record

`size-adjust` and the metric overrides are Chrome/Edge 92+, Firefox 92+, Safari
17+. Safari 16 and older ignore the descriptors entirely and render today's
behaviour, so the degradation is graceful and the frontend carries no fallback
path for it. Nothing here needs a backend-side capability check.
