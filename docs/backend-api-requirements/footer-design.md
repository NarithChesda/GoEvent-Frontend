# Backend API Requirements: Footer Design (`footer_design`)

> **Status: PENDING.** Frontend is complete and reads
> `template_assets.footer_design`. Until the backend ships the field the value
> is always absent, which resolves to exactly what every footer renders today,
> so the frontend is safe to deploy ahead of this.

## Overview

The footer is the last thing on the invitation: the partner's logo, GoEvent's
mark, the social links and the web address. It has had two looks, and the
template's **Liquid Glass** switch (`display_liquid_glass_background`) picked
between them as a side effect of frosting the content card: white marks on a
tinted band when on, the template's own colour on the page when off. A partner
could not choose the footer without also changing the card behind the text.

Partners now pick the footer per **template**, in a small JSON config named
`footer_design`, handled exactly like the existing `gallery_design`.

| `type` | What it draws |
| --- | --- |
| `plain` | The marks in the template's colour, straight on the page. What the switch gives when **off**. |
| `glass` | White marks on a translucent band of the template's background colour. What the switch gives when **on**. |
| `card` | The marks printed on the invitation's paper, as a card of its own (the same paper as the RSVP card). |
| `minimal` | Smaller and quieter: bare icons, the address in spaced capitals. For formal and memorial events. |

The backend work is the same shape as `gallery_design`: one nullable JSON field
on the partner template, accepted on write, returned on read, and surfaced in
the event's `template_assets`. No file fields.

---

## Data contract

### Config object

```json
{
  "type": "card"
}
```

| Field | Type | Required | Allowed values | Default |
| --- | --- | --- | --- | --- |
| `type` | string | yes | `plain`, `glass`, `card`, `minimal` | *none: see below* |

An object rather than a bare string, matching the other section designs, so a
per-design option can be added later as a sibling key without a breaking
change.

### Absent means "follow the switch". Do not backfill.

When `footer_design` is `null`, absent, or has a `type` the frontend doesn't
know, the footer is `glass` if `display_liquid_glass_background` is on and
`plain` if it is off. That is what every published template renders today.

- **Do not backfill** existing templates, and **do not give the field a
  default** such as `{"type": "glass"}`. A default would pin templates whose
  switch is off to the glass band, visibly changing published invitations.
  `null` is the correct stored value for a template nobody has set this on.
- `display_liquid_glass_background` itself is unchanged and still needed. It
  still frosts the content card and the cover's panels, and it is the
  footer's fallback.

### Model field

On the partner template model, alongside `gallery_design`:

```python
footer_design = models.JSONField(null=True, blank=True)
```

Validate on write the way `gallery_design` is validated:

- an object, or `null`;
- `type` present and one of the four values above;
- unknown keys: rejected or ignored, matching `gallery_design`. Prefer
  defaulting an unknown `type` to `null` over rejecting the whole save.

### Endpoints

The same places `gallery_design` appears:

1. **`POST /api/core-data/partner-templates/`**: accept `footer_design` as a
   JSON-encoded string inside `multipart/form-data`.
2. **`PATCH /api/core-data/partner-templates/{id}/`**: same.
3. **`GET /api/core-data/partner-templates/{id}/`** and the list: return the
   parsed object, or `null`.

The partner form always sends the field once this ships. When it opens a
template that has none, the picker is set from the Liquid Glass switch (the
footer the template already draws), so saving writes that design explicitly,
for example `{"type": "plain"}` for a template with the switch off, and
nothing on screen changes.

### Showcase payload

Return it at the **top level** of `template_assets`, next to `gallery_design`
(not nested under `assets`), on every endpoint that already carries
`gallery_design`:

- `GET /api/events/{id}/showcase/` → `template_assets.footer_design`
- `GET /api/core-data/event-templates/{id}/public_template_assets/` → `template_data.footer_design`

```json
{
  "template_assets": {
    "display_liquid_glass_background": true,
    "gallery_design": { "type": "reel" },
    "footer_design": { "type": "card" }
  }
}
```

## How to verify

1. Save a partner template with *Footer Design* set to *Paper card*, then
   confirm `"footer_design": {"type": "card"}` comes back on
   `GET /api/core-data/partner-templates/<id>/`.
2. Confirm the same object appears in both showcase payloads above.
3. Confirm a template never re-saved still returns `"footer_design": null`
   (or no key), not a default.

## Frontend reference

- Fallback rule (the only implementation): `resolveFooterDesign` in [`footerDesign.ts`](../../src/components/showcase/footer/footerDesign.ts)
- The footer: [`ShowcaseFooter.vue`](../../src/components/showcase/footer/ShowcaseFooter.vue)
- Editor: *Footer Design* in the Content section of the partner template form ([`ContentSection.vue`](../../src/components/template/sections/ContentSection.vue)); form state in [`sectionDesigns.ts`](../../src/components/template/config/sectionDesigns.ts)
