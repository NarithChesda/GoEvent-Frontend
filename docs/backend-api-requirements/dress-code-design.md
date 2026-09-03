# Backend API Requirements: Dress Code Design (Attire Block)

> **Status: PENDING** — Frontend is complete and reads
> `template_assets.dress_code_design`. Until the backend ships the field the
> value is always absent, which resolves to `portrait`, so the frontend is safe
> to deploy ahead of this.

## Overview

The showcase renders the event's **dress code** — the outfits under the
invitation on the main content stage — in one of five compositions. The chosen
one is controlled per **template** by a small JSON config named
`dress_code_design`, sent inside the template package and forwarded to the
showcase exactly like the existing `agenda_design` / `host_info_design` /
`info_card_design` configs.

The backend work is identical in shape to `agenda_design`: add one nullable JSON
field to the partner-template model, accept it on create/update (sent as a
JSON-encoded string inside `multipart/form-data`), return it on read, and
surface it inside the event's `template_assets` payload.

---

## Why this field exists

Two problems, one of them structural.

### 1. The empty state was the common state

A dress code carries a colour and an **optional** photograph. With a photograph
the block drew it in a square — fine. With no photograph it painted a 288px
square of flat colour with a generic person glyph at 30% white on top. On a dark
colour that reads as a failed image upload; on a pale one the glyph disappears
and the block is a coloured rectangle with nothing in it. Most organizers never
go and find a photograph of an outfit, so most dress code blocks looked broken.

Every design now draws a **garment silhouette** filled with the dress code's own
colour when there is no photograph, so the colour is *worn* rather than used as
a backdrop, and the shape says what kind of outfit before a word is read. **This
part is a fix, not a setting** — it applies to all five designs equally, and a
code that *has* a photograph renders it unchanged in all five.

### 2. The block navigated facts instead of showing them

On top of that sat three levels of control: a segmented tray of time periods, a
row of gender pills beneath it, and a row of colour dots beneath that. Three
navigation systems for what is typically two to four dress codes.

Two of those three hid information rather than offering a choice. The block now
follows one rule:

> **Time period and gender are conjunctive** — morning *and* evening, his *and*
> hers; all of it applies to the guest reading it, so all of it is laid out.
> **The codes inside one group are disjunctive** — black tie *or* midnight blue;
> that alone keeps a selector.

The time period tray became a heading (a tracked label between two hairlines,
one band per period, stacked). The gender pills became captions over the figures
they name. **No design has a tab.** The colour chips stayed, because they are
the one place the guest has an actual decision — and the garment now *recolours
in place* when one is tapped rather than being torn down and rebuilt.

---

## The five designs

| `type`     | Description |
|------------|-------------|
| `portrait` | **Default.** Every outfit in the period stands in its own soft square, side by side, captioned with who wears it; title, description and colour chips beneath. A single group widens to one centred square and drops the caption. The neutral, universal choice. |
| `atelier`  | The formal one: a tall hairline arch on a mount board, the dress code type tracked out in small caps under a short rule, squared-off colour tiles. The same hairline language as the `calendar` / `arch` event-detail designs and the `engraved` info card, so it reads as part of one sheet. Weddings, ceremonies, funerals. |
| `spread`   | The editorial one: the garment stands **unframed** at the leading edge of a full-width band with its copy beside it, divided by a vertical hairline, one band per person. The only design that gives the description room to be a sentence rather than a caption. |
| `palette`  | The colours are the subject: a row of large discs, one per code, each with its garment drawn on it as an outline — and the discs *are* the selector. For events that instruct a palette rather than a formality: birthdays, housewarmings, themed parties. |
| `ledger`   | Every code on one line: colour badge, title, full description, hairline rules between. No selector at all, because nothing is hidden. The answer when the description carries the actual rule ("no white", "shoes you can take off"). |

When the field is absent / `null`, the frontend falls back to `portrait`, so this
is fully backward compatible — **existing templates need no migration.** An
unrecognised `type` also falls back to `portrait` rather than rendering nothing,
so a value written by a newer frontend than the one serving a guest degrades
safely.

### What the designs do *not* decide

- **The garments.** Which silhouette is drawn comes from the dress code record's
  own `dress_code_type` and `gender` (`resolveGarments` in
  `src/components/showcase/dress-code-designs/garmentPaths.ts`), not from the
  design and not from the event category. A `gender` of `all` draws both
  silhouettes side by side rather than picking one.
- **The colours the garment is drawn in.** The fabric is the dress code's own
  `color`; the seams, bow tie and buttons are derived from that colour's
  luminance, never from the template's palette.
- **The copy.** The header and description still come from the event's
  `dress_code_header` / `dress_code_description` texts, and the type / gender /
  time period labels are still translated client-side from the enum values.

No new fields are needed on the dress code record itself.

---

## Data Contract

### Config object

```json
{
  "type": "atelier"
}
```

| Field  | Type   | Required | Allowed values                                          | Default    |
|--------|--------|----------|---------------------------------------------------------|------------|
| `type` | string | yes      | `portrait`, `atelier`, `spread`, `palette`, `ledger`     | `portrait` |

The object is deliberately an **object rather than a bare string**, matching
`agenda_design` and `host_info_design`, so future per-design options (a figure
shape, a colour source) can be added as sibling keys without a breaking change.

### Model field

Add to the partner template model, alongside `agenda_design`:

```python
dress_code_design = models.JSONField(null=True, blank=True)
```

Validate on write the same way `agenda_design` is validated:

- must be an object (or `null`)
- `type` must be present and one of the five values above
- reject unknown keys, or ignore them — match whatever `agenda_design` does

### Endpoints

Exactly the same three places `agenda_design` appears:

1. **`POST /api/events/partner-templates/`** — accept `dress_code_design` as a
   JSON-encoded string inside `multipart/form-data`.
2. **`PATCH/PUT /api/events/partner-templates/{id}/`** — same.
3. **`GET /api/events/partner-templates/{id}/`** and the list endpoint — return
   the parsed object (or `null`).

### Showcase payload

Surface it inside the event's `template_assets`, at the **top level** of that
object next to `agenda_design` and `host_info_design` (not nested under
`assets`):

```json
{
  "template_assets": {
    "assets": { "...": "..." },
    "cover_stage_layout": { "...": "..." },
    "event_details_design": { "type": "calendar" },
    "host_info_design": { "type": "portrait" },
    "info_card_design": { "type": "engraved" },
    "agenda_design": { "type": "thread" },
    "dress_code_design": { "type": "atelier" }
  }
}
```

This applies to every endpoint that already carries `agenda_design`, including
`GET /api/events/{id}/showcase/` and the public template-assets endpoint used by
the preview frames.

---

## Frontend touchpoints

| File | Role |
|------|------|
| [template.types.ts](../../src/services/api/types/template.types.ts) | `DressCodeDesignType`, `DressCodeDesignConfig`, and the field on the template + payload types |
| [useEventShowcase.ts](../../src/composables/useEventShowcase.ts) | `dress_code_design` on `TemplateAssets` |
| [templates.service.ts](../../src/services/api/modules/templates.service.ts) | Appends the JSON string on create and update |
| [DressCodeSection.vue](../../src/components/showcase/DressCodeSection.vue) | The shell: resolves the design, draws the period bands, owns the grouping, labels and the one piece of selection state |
| [dress-code-designs/](../../src/components/showcase/dress-code-designs/) | The five designs, the shared figure / copy / swatch pieces, the garment paths and the base stylesheet |
| [PartnerTemplateForm.vue](../../src/components/template/PartnerTemplateForm.vue) | The partner's picker, in the same Design panel as the agenda picker |
| [partnerTemplateAssets.ts](../../src/components/template/partnerTemplateAssets.ts) | Carries the draft value into the form's live preview |
