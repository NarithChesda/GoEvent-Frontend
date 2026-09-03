# Backend API Requirements: Agenda Design (Event Schedule Block)

> **Status: PENDING** — Frontend is complete and reads
> `template_assets.agenda_design`. Until the backend ships the field the value is
> always absent, which resolves to `rail` — the composition every agenda renders
> today — so the frontend is safe to deploy ahead of this.

## Overview

The showcase renders the event's **agenda** — the list of activities under the
day tabs on the main content stage — in one of five compositions. The chosen one
is controlled per **template** by a small JSON config named `agenda_design`, sent
inside the template package and forwarded to the showcase exactly like the
existing `host_info_design` / `info_card_design` / `event_details_design`
configs.

The backend work is identical in shape to `host_info_design`: add one nullable
JSON field to the partner-template model, accept it on create/update (sent as a
JSON-encoded string inside `multipart/form-data`), return it on read, and surface
it inside the event's `template_assets` payload.

### Why this field exists

Before it, the agenda picked its look from the **event category**. Four layout
components — `AgendaWedding`, `AgendaBirthday`, `AgendaFuneral`, `AgendaDefault`
— were selected by a `layoutMap` keyed on the category name. They were four
copies of the same file, differing only in a container class name, a header
translation key and comment drift; all four rendered the identical card.

That meant a partner selling a wedding design and a birthday design shipped the
**same** agenda in both, and could change neither. This config moves the choice
where every other look-and-feel decision already lives: the template.

**The category still decides the words.** `agenda_header_wedding` /
`agenda_header_birthday` / `agenda_header_funeral` and
`agenda_description_wedding` are still resolved from the event's category, so no
live event's copy changes. Only the drawing is now the template's call.

---

## The five designs

| `type`      | Description |
|-------------|-------------|
| `rail`      | **Default.** A continuous hairline spine down the leading edge with an icon medallion per item on it; the time as a tracked overline closed by a fading rule, the title beneath. This is byte-for-byte what every agenda renders today. |
| `thread`    | Items alternate sides down the page — icon roundel and copy mirrored against the row before — joined by a dotted thread that swings between the two roundels. Borderless. |
| `milestone` | Every item centred on one axis: roundel, tracked time eyebrow, title, with a short hairline drop between stops. Gives the title the full column, so it is the design for long titles and for Khmer. |
| `ledger`    | An order of service: time in tabular numerals in a fixed leading column, title beside it under one hairline rule per row, the icon reduced to a small inline glyph. The densest — a 12-item day still fits a phone. |
| `stack`     | Each item a soft-tinted rounded card with a filled icon badge and the time on a solid pill. The only design with a material of its own; the birthday answer. |

When the field is absent / `null`, the frontend falls back to `rail`, so this is
fully backward compatible — **existing templates need no migration.** An
unrecognised `type` also falls back to `rail` rather than rendering nothing, so a
value written by a newer frontend than the one serving a guest degrades safely.

---

## Data Contract

### Config object

```json
{
  "type": "thread"
}
```

| Field  | Type   | Required | Allowed values                                          | Default |
|--------|--------|----------|---------------------------------------------------------|---------|
| `type` | string | yes      | `rail`, `thread`, `milestone`, `ledger`, `stack`         | `rail`  |

The object is deliberately kept an **object rather than a bare string**, matching
`host_info_design`, so future per-design options (a connector style, a marker
colour source) can be added as sibling keys without a breaking change.

### Model field

Add to the partner template model, alongside `host_info_design`:

```python
agenda_design = models.JSONField(null=True, blank=True)
```

Validate on write the same way `host_info_design` is validated:

- must be an object (or `null`)
- `type` must be present and one of the five values above
- reject unknown keys, or ignore them — match whatever `host_info_design` does

### Endpoints

Exactly the same three places `host_info_design` appears:

1. **`POST /api/events/partner-templates/`** — accept `agenda_design` as a
   JSON-encoded string inside `multipart/form-data`.
2. **`PATCH/PUT /api/events/partner-templates/{id}/`** — same.
3. **`GET /api/events/partner-templates/{id}/`** and the list endpoint — return
   the parsed object (or `null`).

### Showcase payload

Surface it inside the event's `template_assets`, at the **top level** of that
object next to `host_info_design` and `info_card_design` (not nested under
`assets`):

```json
{
  "template_assets": {
    "assets": { "...": "..." },
    "cover_stage_layout": { "...": "..." },
    "event_details_design": { "type": "calendar" },
    "host_info_design": { "type": "portrait" },
    "info_card_design": { "type": "engraved" },
    "agenda_design": { "type": "thread" }
  }
}
```

This applies to every endpoint that already carries `host_info_design`:

- `GET /api/events/{id}/showcase/`
- the public template-assets endpoint used by the catalogue preview
  (`getPublicTemplateAssets`)

---

## Frontend files touched (for reference)

| File | Role |
|------|------|
| [template.types.ts](../../src/services/api/types/template.types.ts) | `AgendaDesignType` / `AgendaDesignConfig`, plus the field on `PartnerTemplate` and the create/update payload |
| [useEventShowcase.ts](../../src/composables/useEventShowcase.ts) | `agenda_design` on `TemplateAssets` |
| [templates.service.ts](../../src/services/api/modules/templates.service.ts) | appends the JSON string on create + update |
| [AgendaSection.vue](../../src/components/showcase/AgendaSection.vue) | the section shell; resolves the design and owns header / tabs / reveal / edit chrome |
| [agenda-designs/](../../src/components/showcase/agenda-designs/) | the five compositions, the shared item frame and the CSS contract |
| [PartnerTemplateForm.vue](../../src/components/template/PartnerTemplateForm.vue) | the **Agenda Design** picker in the design section |
| [partnerTemplateAssets.ts](../../src/components/template/partnerTemplateAssets.ts) | carries the unsaved choice into the live preview |
