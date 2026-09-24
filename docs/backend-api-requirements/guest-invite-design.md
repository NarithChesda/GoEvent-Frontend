# Backend API Requirements: Guest Invite Design (Guest Dedication Block)

> **Status: PENDING.** The frontend is complete and reads
> `template_assets.guest_invite_design`. Until the backend ships the field, the
> value is always absent. Absent means **no block**, so every event renders
> exactly as it does today and the frontend is safe to deploy first.

## Overview

The showcase can now draw the event's **invite text** and the **name of the
guest the link was sent to** on the main content stage (the invitation), between
the host block and the date & venue. Until now only the cover did this, as rows
of its own. A template whose cover doesn't name the guest (a printed-card cover
led by the couple, or a filmed cover with no text over it) had nowhere left that
said who the invitation was for.

Whether the block is drawn, and in which of four compositions, is controlled per
**template** by a small JSON config named `guest_invite_design`. It is sent
inside the template package and forwarded to the showcase exactly like
`agenda_design` / `dress_code_design`.

The backend work is identical in shape to `agenda_design`: one nullable JSON
field on the partner-template model, accepted on create/update, returned on
read, and surfaced inside the event's `template_assets`.

**No other backend change is needed.** The invite text is the event's existing
`invite_text` event text (the one the cover reads), and the guest name is the
existing `guest_name`, resolved exactly as the cover resolves it.

---

## The four designs

| `type`       | Description |
|--------------|-------------|
| `inscribed`  | The printed Khmer card's convention: the invite text, then the name written onto a dotted line. |
| `formal`     | The invite text tracked small between two hairlines, with the name large beneath it. For ceremonies. |
| `place_card` | The name on a folded place card that stands up as it arrives. For receptions. |
| `tag`        | The name on a gift tag hung from a string. For birthdays and parties. |

**Absent / `null` means the block is not drawn.** This is the opposite of
`agenda_design`, where `null` means the default design, because this block is
additive. Existing templates need no migration and **must not be backfilled.**

An unrecognised `type` renders `inscribed`: the partner switched the block on, so
it degrades to a design rather than to nothing.

The block is only drawn when the showcase was opened for a named guest. A public
link without `guest_name` shows nothing, whatever the template says.

---

## Data Contract

### Config object

```json
{
  "type": "place_card"
}
```

| Field  | Type   | Required | Allowed values                               | Default |
|--------|--------|----------|----------------------------------------------|---------|
| `type` | string | yes      | `inscribed`, `formal`, `place_card`, `tag`   | n/a     |

It is an **object rather than a bare string**, matching the other section
designs, so a per-design option can be added later as a sibling key.

The editor always sends the key. Switching the block off sends an explicit
`null`, which must be stored as `null` (not treated as "leave unchanged").

### Model field

Add to the partner template model, alongside `agenda_design`:

```python
guest_invite_design = models.JSONField(null=True, blank=True)
```

Validate on write the same way `agenda_design` is validated:

- it must be an object (or `null`)
- `type` must be present and one of the four values above

### Endpoints

`guest_invite_design` goes everywhere `agenda_design` already appears:

1. **`POST /api/events/partner-templates/`**: accept it as a JSON-encoded string
   inside `multipart/form-data`.
2. **`PATCH/PUT /api/events/partner-templates/{id}/`**: same.
3. **`GET /api/events/partner-templates/{id}/`** and the list endpoint: return
   the parsed object (or `null`).

### Showcase payload

Put it inside the event's `template_assets` at the **top level**, next to
`agenda_design`:

```json
{
  "template_assets": {
    "agenda_design": { "type": "thread" },
    "dress_code_design": { "type": "atelier" },
    "guest_invite_design": { "type": "inscribed" }
  }
}
```

This applies to every endpoint that already carries `agenda_design`:

- `GET /api/events/{id}/showcase/`
- the public template-assets endpoint used by the catalogue preview
  (`public_template_assets`)

---

## Frontend files touched (for reference)

| File | Role |
|------|------|
| [template.types.ts](../../src/services/api/types/template.types.ts) | `GuestInviteDesignType` / `GuestInviteDesignConfig`, the field on `PartnerTemplate` and the create/update payload |
| [useEventShowcase.ts](../../src/composables/useEventShowcase.ts) | `guest_invite_design` on `TemplateAssets` |
| [templates.service.ts](../../src/services/api/modules/templates.service.ts) | appends the JSON string on create + update |
| [GuestInviteSection.vue](../../src/components/showcase/GuestInviteSection.vue) | the section: copy, name, finish, inline edit, reveal clock, design dispatch |
| [guest-invite-designs/](../../src/components/showcase/guest-invite-designs/) | the four compositions |
| [MainContentStage.vue](../../src/components/showcase/MainContentStage.vue) | places the block between the hosts and the date, gated on a design and a guest name |
| [sectionDesigns.ts](../../src/components/template/config/sectionDesigns.ts) | form state (`none` ↔ `null`), hydration, payload |
| [ContentSection.vue](../../src/components/template/sections/ContentSection.vue) | the **Guest Dedication** picker, plus a suggestion to turn it on when the cover hides the guest's name |
