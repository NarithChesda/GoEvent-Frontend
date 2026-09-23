# Backend API Requirements: Cover Names, Date & Venue (`coverDetails`)

> **Status: PENDING.** One new **model field** is needed: the image
> `cover_host_separator_image` (see [§3](#3-cover_host_separator_image--the-one-new-model-field)).
> Everything else travels inside the *existing* `cover_stage_layout` JSON blob
> and needs no migration, **provided** the serializer stores that blob verbatim.
> See [§2](#2-what-to-check-first).

## Overview

The cover stage could show a guest's name, an invite line, a logo and a header,
but never the hosts themselves. Printed invitation cards usually lead with the
couple instead: the two names with an "&" between them, the date under them,
the venue at the foot. The cover now has that layout as three new blocks,
each switched on separately:

| Block | What it draws |
| --- | --- |
| `hosts` | Every host's name, in the event's host order: one, two or more. A mark sits between each pair (`&`, the word "and", a drawn motif, or the template's own uploaded image). Optionally a small line under each name (the family name, or the host's title). |
| `date` | The event's start date, as numerals (`20.10.2025`), spelled out, or the organizer's own `date_text`. |
| `location` | The organizer's `time_text` (or the start time) above their `location_text` (or the event's `location`). |

All three default **off**, so no existing template changes. A template that
switches them on usually switches the logo, invite text and guest name off. The
editor offers that as a one-tap suggestion and never does it silently.

## 1. What `cover_stage_layout` now carries

Six new keys, all optional (the sixth, `coverText`, is below):

```jsonc
{
  "cover_stage_layout": {
    // ... every existing key unchanged ...

    "showCoverGuestName": false,   // NEW. Default true. The guest-name row keeps its space when off.
    "showCoverHosts": true,        // NEW. Default false.
    "showCoverDate": true,         // NEW. Default false.
    "showCoverLocation": true,     // NEW. Default false.

    "coverDetails": {              // NEW. Every field optional; omitted = the default shown.
      "hostCount": null,           // null = every host; else 1-8, the most hosts shown
      "hostArrangement": "stacked",// "stacked" | "inline"
      "hostSubline": "surname",    // "none" | "surname" | "title"
      "capitals": true,            // spaced capitals on Latin text (never applied to Khmer)
      "separator": "ampersand",    // "ampersand" | "word" | "heart" | "rings" | "knot" | "bloom" | "none"
      "separatorScale": 1,         // 0.4-2.5, relative to the names
      "separatorColorSource": "accent", // "primary" | "secondary" | "accent" | "guestname" | "custom"
      "separatorCustomColor": null,     // "#rrggbb", read only when the source is "custom"
      "dateFormat": "numeric",     // "numeric" | "long" | "text"
      "showTime": true
    },

    // coverElements gains three keys, one per new block. Same box shape as the
    // other four (see cover-free-placement.md). Unlike those four, these are
    // read in BOTH layout modes, so they can be present while layoutMode is "rows".
    "coverElements": {
      "hosts":    { "x": 50, "y": 46,   "width": 84, "height": 20, "fontScale": 1 },
      "date":     { "x": 50, "y": 60.5, "width": 84, "height": 6,  "fontScale": 1, "colorSource": "accent" },
      "location": { "x": 50, "y": 69,   "width": 84, "height": 10, "fontScale": 1 }
    }
  }
}
```

The frontend validates every enum against its own list and falls back to the
default for a value it doesn't know, so an unrecognised value never renders as
nothing. The backend doesn't need to validate these values. If it does, please
**drop or default** a bad value rather than rejecting the whole save.

### Text styles (`coverText`)

A sixth new key sets the **font and size of each text on the cover** on its own,
in both layout modes:

```jsonc
"coverText": {
  "header":      { "fontScale": 0.8 },
  "invite":      { "fontType": "primary", "fontScale": 1.2 },
  "guest":       { "fontType": "accent", "fontScale": 1.3 },
  "hostNames":   { "fontType": "accent", "fontScale": 1.35 },
  "hostSubline": { "fontScale": 1.1 },
  "date":        { "fontScale": 0.9 },
  "location":    { "fontType": "primary" }
}
```

- Keys: `header`, `invite`, `guest`, `hostNames`, `hostSubline` (the small
  line under each name), `date`, `location` (time and venue together). All optional.
- `fontType` is one of the template's four font **slots** (`primary`,
  `secondary`, `accent`, `decorative`), never a family: fonts are set per
  language. Omitted = the text's default face.
- `fontScale` is a multiplier, 0.4–2.5. Omitted = 1.

This replaces the `fontType` / `fontScale` on a `coverElements` box as the place
a text's type is stored. The box values are still read as a **fallback**, and
only where they always rendered (every block in `free` mode), so a template
saved before this renders exactly as it did. The editor clears them from a box
the first time that block's text is restyled.

## 2. What to check first

This is the same question [cover-free-placement.md](cover-free-placement.md#what-to-check-first)
asks, with more keys:

1. **`cover_stage_layout` stored verbatim (`JSONField`, no key allow-list)**:
   nothing to do for §1, `coverText` included. Verify by saving a template with the names switched on,
   then confirm `showCoverHosts` and `coverDetails` come back on
   `GET /api/events/templates/partner/<id>/`.
2. **Validated against a key list, or rebuilt field by field**: add the five
   keys above, plus `coverText`. Also widen the `coverElements` key list from
   `{header, logo, invite, guest}` to include `hosts`, `date`, `location`.
   Otherwise the save returns `200`, the editor looks like it worked, and the
   blocks jump back to their default places on the next load.

The blob must survive both read paths:

- `GET /api/events/<id>/showcase/` → `template_assets.cover_stage_layout`
- `GET /api/events/templates/<id>/public-assets/` → `template_data.cover_stage_layout`

## 3. `cover_host_separator_image`: the one new model field

A partner can draw the mark between the names with their own artwork. That is a
**file**, so it can't live inside the JSON config. It needs a new image field on
the partner-template model, handled exactly like `host_divider_image` (see
[host-info-design.md §6](host-info-design.md)): same upload rules, same
`''`-means-delete convention, same place in the payload.

```python
# Example (Django). Mirror however host_divider_image is defined.
cover_host_separator_image = models.ImageField(upload_to='template_assets/', null=True, blank=True)
```

**Create / update** (`multipart/form-data`, the existing partner-template endpoints):

```
cover_host_separator_image = <file>   # upload / replace
cover_host_separator_image = ''       # delete the stored file
# absent                              # leave the stored file alone
```

**Template read endpoints** return it as a URL beside `host_divider_image`.

**Event showcase payload and public template assets**: it belongs **inside**
`template_assets.assets` (and `template_data.assets` on the public endpoint),
next to `sample_logo_1` and `host_divider_image`:

```json
{
  "template_assets": {
    "cover_stage_layout": { "showCoverHosts": true, "coverDetails": { "separator": "ampersand" } },
    "assets": { "cover_host_separator_image": "/media/template_assets/mark.svg" }
  }
}
```

> **Precedence:** when `cover_host_separator_image` is present, it is drawn
> **instead of** `coverDetails.separator`, never alongside it. That is why the
> separator enum has no `custom` member. Removing the file brings back the
> partner's chosen separator. The frontend applies this rule; the backend
> only has to store and return the file.

Until the field ships, the upload control in the editor sends a file the
server ignores. Everything else in this feature works without it.

## 4. What the cover reads from the event (no change needed)

No new event field. The blocks read what the showcase payload already carries:

- `hosts[]`: `id`, `name`, `title`, in array order (the same order the
  invitation's host block uses)
- `start_date` and **`timezone`**. The date and time are set in the event's own
  zone, as a printed card would give them.
- `location`, and the `date_text` / `time_text` / `location_text` event texts in
  the current language

## Frontend reference

- Types: [`template.types.ts`](../../src/services/api/types/template.types.ts):
  `CoverDetailElementId`, `CoverDetailsConfig`, `CoverHostSeparator`, `CoverDateFormat`
- Defaults and resolution: [`useCoverStageLayout.ts`](../../src/composables/showcase/useCoverStageLayout.ts):
  `COVER_DETAILS_DEFAULTS`, `COVER_DETAIL_ELEMENT_DEFAULTS`, `resolveCoverDetails`
- Text rules (host selection, name split, time zone): [`coverDetails.ts`](../../src/components/showcase/cover/coverDetails.ts)
- Rendering: [`CoverDetailBlocks.vue`](../../src/components/showcase/cover/CoverDetailBlocks.vue),
  [`HostSeparatorMark.vue`](../../src/components/showcase/cover/HostSeparatorMark.vue)
- Editor: the Cover section of [`PartnerTemplateForm.vue`](../../src/components/template/PartnerTemplateForm.vue)
