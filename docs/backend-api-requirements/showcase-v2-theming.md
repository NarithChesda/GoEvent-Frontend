# Backend API Requirements: Showcase V2 Theming (Colors & Fonts)

> **Status: colors — INFORMATIONAL, no schema change. Fonts — PENDING, needs
> 2 new `TemplateFontType` choices.** V2 colors read `template_colors`
> through the existing generic name-keyed endpoint, same as V1. V2 fonts
> need 2 new dedicated `font_type` choices (`v2-body`, `v2-display`) — see
> "Font naming convention" below for why they can't safely reuse V1's
> `primary`/`secondary`. See [showcase-template-version.md](showcase-template-version.md)
> for the (separate, still-pending) per-template V1/V2 selection field.

## Overview

Previously, the V2 scroll-story showcase ([src/components/showcase-v2/](../../src/components/showcase-v2/))
was visually fixed — every color and font came from a hardcoded constant
(`v2Theme.ts`) and `event.template_colors` / `event.template_fonts` were
never read. That has changed: V2 now resolves its palette and fonts from the
event's template data exactly like V1 does, falling back to a built-in
default look for any color or font a template doesn't define. This keeps
every existing wedding rendering identically until a partner deliberately
adds V2-named colors/fonts to a template.

V2 is also now organized as one **category-agnostic engine** plus a
**per-category variant** (see [CLAUDE.md](../../CLAUDE.md)'s Showcase V2
section) — today only a wedding variant exists ("Storybook Romance":
ivory/blush/sage/gold/charcoal, Cormorant Garamond + Karla), with
birthday/housewarming variants expected to follow the same shape later. The
color/font **naming convention** below is shared by every category — a
birthday variant's template still sets `v2-gold`, it just gets a different
built-in default value if unset.

Colors need no backend change at all; fonts need one small enum extension.
Both reuse the same existing endpoints:

- `TemplateColor { id, hex_color_code, name }` via
  `POST/PATCH/DELETE /api/core-data/partner-templates/{id}/colors/{id}/` —
  no change needed, `name` is already a free string.
- `TemplateFont { id, language, font_type, font }` via
  `POST/PATCH/DELETE /api/core-data/partner-templates/{id}/fonts/{id}/` —
  needs `font_type`'s choices extended with `v2-body` / `v2-display` (see
  "Font naming convention" below).

Both are already returned inside the event showcase payload as
`event.template_colors` / `event.template_fonts` (or nested under
`event.template_assets.colors` / `.fonts`) — the same fields V1 consumes.

---

## Color naming convention

V2 looks up 8 named color slots, each **prefixed `v2-`** so a template can
carry a V1 palette (`primary`/`secondary`/`accent`/…) and a V2 palette side
by side without name collisions. Lookup is case-insensitive.

| `TemplateColor.name` | V2 usage | Wedding variant default (used when name is absent) |
|---|---|---|
| `v2-ivory`      | Page/card background   | `#FAF6F0` |
| `v2-blush`      | Accent pink (petals, cover gate) | `#E8B4B8` |
| `v2-blush-deep` | Accent pink, deeper (hero date, story numerals) | `#C98A90` |
| `v2-sage`       | Accent green (petals, gallery/venue) | `#A8B5A0` |
| `v2-sage-deep`  | Accent green, deeper (secondary form color) | `#7C8B74` |
| `v2-charcoal`   | Primary text / dark surfaces | `#3E3A36` |
| `v2-gold`       | Rules, numerals, active progress dot, primary accent | `#C9A66B` |
| `v2-ink-soft`   | Secondary/subtitle text | `#5C564F` |

Any slot a template doesn't define falls back to its default independently
— a template can override just `v2-gold` and leave the other 7 at their
defaults, for example. The 8 slot *names* are a fixed contract shared by
every V2 category (a birthday variant's templates use the same `v2-gold`
name); only the *default value* used when a template omits it varies by
category — each variant defines its own defaults (e.g.
`categories/wedding.data.ts`'s `WEDDING_COLORS`).

```json
{ "hex_color_code": "#B08968", "name": "v2-gold" }
```

## Font naming convention

**V2 has exactly 2 font roles — `body` and `display`** (conceptually the
same split as V1's `primary`/`secondary`, just renamed for V2's own template
docs). Every V2 heading/chapter-title/name uses `display`; everything else
uses `body`.

Unlike colors, fonts **do** need a small backend change: `TemplateFontType`
is a closed enum (`primary | secondary | accent | decorative`), not a free
`name` string, so there's no way to invent a collision-free `v2-*` value on
the frontend alone the way `TemplateColor.name` allowed. The ask is 2 new
choices:

| `TemplateFont.font_type` (new) | V2 role | Default (used when absent) |
|---|---|---|
| `v2-body`    | Body — everything except headings | `'Karla', 'Kantumruy Pro', system-ui, sans-serif` |
| `v2-display` | Display — chapter titles, names, monogram | `'Cormorant Garamond', 'Kantumruy Pro', Georgia, serif` |

```python
# Example (Django) — extending the existing choices
TEMPLATE_FONT_TYPE_CHOICES = [
    ("primary", "Primary"),
    ("secondary", "Secondary"),
    ("accent", "Accent"),
    ("decorative", "Decorative"),
    ("v2-body", "V2 — Body"),
    ("v2-display", "V2 — Display"),
]
```

**Why V2 can't reuse `primary`/`secondary` like it first tried:** early in
this rollout V2 looked up the same `primary`/`secondary` font_type slots V1
uses, reasoning it was "one less enum to add." That broke the first time it
shipped against a real template — any template that already had V1 fonts
assigned (the common case) immediately changed V2's typography too, because
`useTemplateProcessor.getLanguageFonts`'s fallback chain auto-fills
`secondary`/`accent`/`decorative` from `primary` even when a font's
`font_type` was never explicitly set. There's no existing enum value that
avoids that cascade, so full isolation requires 2 new ones. The frontend
lookup (`findV2TemplateFont()` in `v2Theme.ts`) does **not** use that
cascading helper — no match on `v2-body`/`v2-display` means "this template
hasn't opted this role into V2," and it falls back straight to the category
variant's own default font, never to a V1 font.

Fonts remain **per-language** (`TemplateFont.language`), same as V1 — a
template can supply different display/body fonts per language. Unlike V1,
there's no cross-role fallback: if a template sets `v2-body` but not
`v2-display` for a language, `display` still falls back to the variant
default rather than borrowing the `v2-body` font.

Custom font files are uploaded once via `POST /api/core-data/custom-fonts/`
and attached to a template font slot by id — no V2-specific upload path.
Until the 2 new choices ship, any `v2-body`/`v2-display` value sent today
would be rejected by the current enum validation — V2 simply renders its
default font for every template in the meantime, which is the correct/safe
fallback behavior.

---

## What did NOT change

- No new fields on `PartnerTemplate`, `TemplateColor`, `TemplateFont`, or
  `CustomFont` — the only backend ask is 2 new `TemplateFontType` choice
  values (above), not a new field or model.
- No new endpoints — same color/font CRUD, same custom-font upload endpoint.
- Font **sizes** are still not template-driven in V1 or V2 — out of scope
  here, same as before.
- V2's section structure, ordering, and motion remain fixed regardless of
  template data — only colors and fonts are now dynamic.

## Acceptance criteria (fonts)

- [ ] `TemplateFontType` choices include `v2-body` and `v2-display` alongside
      the existing 4 values.
- [ ] Template font create/update accepts `font_type: "v2-body"` /
      `"v2-display"` and persists it, same validation/endpoints as the
      existing 4 values.
- [ ] Existing templates (no `v2-*` font rows) continue to work — V2 renders
      its category variant's default font, exactly today's behavior.
- [ ] No cross-fallback expected from backend — `v2-body` and `v2-display`
      are independent rows; the frontend does not borrow one for the other.

## Frontend implementation reference

- [src/composables/showcase-v2/v2Theme.ts](../../src/composables/showcase-v2/v2Theme.ts) —
  the generic mechanism: `resolveV2Colors(defaults, templateColors)` (name
  lookup + fallback to whichever category's `defaults` are passed in),
  `findV2TemplateFont(templateFonts, language, role)` (font_type lookup,
  deliberately independent of V1's cascading `getLanguageFonts`),
  `buildV2CssVars()`. Holds no per-category values itself.
- [src/composables/showcase-v2/categories/wedding.data.ts](../../src/composables/showcase-v2/categories/wedding.data.ts) —
  the wedding variant's default palette/fonts/translations (a future
  birthday variant would get its own `categories/birthday.data.ts` sibling).
- [src/composables/showcase-v2/useV2CategoryVariant.ts](../../src/composables/showcase-v2/useV2CategoryVariant.ts) —
  `resolveV2Variant(eventType)` picks the active category variant.
- [src/components/showcase-v2/ShowcaseV2Experience.vue](../../src/components/showcase-v2/ShowcaseV2Experience.vue) —
  resolves `palette` / `fonts` from `props.templateColors` /
  `props.templateFonts` via `useTemplateProcessor` (same composable V1
  uses) with the active variant's colors/fonts as fallback, applies them as
  CSS custom properties (`--v2-*`) on the experience root, and threads them
  as props into the reused V1 form components (DressCode, YouTube, Payment,
  FloatingActionMenu).
- [src/views/EventShowcaseRefactored.vue](../../src/views/EventShowcaseRefactored.vue) —
  passes the already-fetched `templateColors` / `templateFonts` /
  `fontsLoaded` (from `useEventShowcase()`) down into `ShowcaseV2Experience`.

## For partner-admin / template-authoring tooling

If there's an admin UI for adding template colors/fonts, consider surfacing
the `v2-*` names and font-type labels above (e.g. as suggested/autocomplete
values) when a template's `showcase_template_version` is (or will be) `v2`,
so partners don't have to know the convention from this doc alone. Not a
hard requirement — the CRUD already accepts arbitrary `name` strings.
