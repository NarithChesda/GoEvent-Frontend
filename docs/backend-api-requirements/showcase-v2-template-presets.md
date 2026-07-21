# Backend/Admin Reference: Showcase V2 Template Presets

> **Status: reference only, no schema change.** This doc doesn't ask for
> anything new from backend — it's a set of ready-to-enter color/font
> presets for the V2 "Storybook Romance" showcase (see
> [showcase-v2-theming.md](showcase-v2-theming.md) for the mechanism, and
> [showcase-template-version.md](showcase-template-version.md) for how a
> template opts into V2). Use it when populating `TemplateColor` /
> `TemplateFont` rows for a V2 template in the admin panel, and as source
> text for the admin panel's help copy ("which color goes where").

## Who this is for

Two audiences:

1. **Whoever is entering template data today** — six complete presets below,
   each a copy-paste-ready set of 8 hex codes + 2 font choices.
2. **Whoever builds/improves the admin panel's color/font entry UI** — the
   "What it's for" column in the [slot reference](#the-8-color-slots-what-each-one-is-for)
   is written as short, standalone help text. It's the same sentence
   regardless of preset, so it's meant to be pasted directly next to each
   color field (tooltip, inline hint, or placeholder) once, not re-written
   per template.

---

## Read this first: slot names are technical, not literal

The 8 slot names (`v2-ivory`, `v2-blush`, `v2-gold`, …) come from the
original wedding palette and are fixed — every V2 component's CSS reads
those exact 8 `--v2-*` variables, so they can't be renamed. **But the names
are just internal ids, not a promise about hue.** `v2-blush` does not have
to be pink. In the "Editorial Vow" preset below it's a warm greige. What's
fixed is each slot's **role** (background, primary accent, text color, …) —
see the table below. Pick whatever hex fits the mood of the preset for that
role.

## The 8 color slots: what each one is for

This is the canonical "which color is used where" reference — write it once
into the admin panel as help text and it stays correct for every preset.

| Slot (`TemplateColor.name`) | Role | What it's for |
|---|---|---|
| `v2-ivory` | Background | Page/card background everywhere, **and** the text color on dark surfaces (buttons, footer, the active progress dot) — it's the "light" side of every light/dark pair on the page |
| `v2-charcoal` | Primary text / dark surface | All body copy and headings, **and** the background of dark surfaces (buttons, footer, active progress dot) — it's the "dark" side of every light/dark pair. Needs strong contrast against `v2-ivory`; this is the color guests actually read |
| `v2-gold` | Primary accent | Thin rule lines, the active progress dot, borders on emphasis elements, and the gold thread/CTA highlight — the one accent color every section borrows for emphasis |
| `v2-blush` | Soft accent (backgrounds) | Scrollbar thumbs, card/petal backgrounds, focus outlines, subtle highlight fills — decorative, never carries text |
| `v2-blush-deep` | Accent text | A deeper shade of `v2-blush`, used as **text**: the RSVP section heading, host/couple names on the cover, agenda dates, footer link hover. Needs to read clearly on `v2-ivory` |
| `v2-sage` | Soft secondary accent (backgrounds) | Gradient fills, selected/active state backgrounds (e.g. a chosen payment method) — decorative, never carries text |
| `v2-sage-deep` | Secondary text | A deeper shade of `v2-sage`, used as **text**: eyebrow labels, subtitles, guestbook names, links. Needs to read clearly on `v2-ivory` |
| `v2-ink-soft` | Muted text | Captions, helper text, timestamps — the quietest text color on the page |

**Rule of thumb for picking new hex values:** `ivory`/`charcoal` must stay
high-contrast (they carry all real reading). `blush-deep`/`sage-deep` should
be noticeably darker/more saturated than their `blush`/`sage` sibling, since
one is a background wash and the other is text. `gold` and the `blush`/`sage`
pair are the 3 colors that actually differentiate one preset's *mood* from
another — spend your design effort there.

## The 2 font roles

| `TemplateFont.font_type` | Role | Used for |
|---|---|---|
| `v2-display` | Headings | Chapter titles, couple/host names, the monogram, numerals |
| `v2-body` | Body | Everything else — paragraphs, labels, form fields, buttons |

Both are **uploaded font files** (via `POST /api/core-data/custom-fonts/`,
then attached by id — see `CreateTemplateFontPayload`), not a CDN reference.
Each preset below names a real Google Font as the intended look; download
the matching `.woff2`/`.ttf` and upload that file. One file = one weight —
this system doesn't support separate regular/bold files per role, so pick a
weight that reads well both as a large heading and as small body text
(Regular or Medium; avoid Light or Black). Fonts are per-`language`, same as
V1 — a template can supply different files per language, and any language
without a `v2-display`/`v2-body` row simply renders the preset's fallback
look instead (never breaks).

---

## Presets at a glance

| # | Preset | Mood | Display font | Body font |
|---|---|---|---|---|
| 1 | Storybook Romance *(current default — already live, no action needed)* | Soft, classic, pastel romance | Cormorant Garamond | Karla |
| 2 | Editorial Vow | Modern, minimal, monochrome + one warm accent | Fraunces | Inter |
| 3 | Gilded Romance | Luxe, jewel-tone, heavy gold | Playfair Display | Lato |
| 4 | Wildflower Garden | Fresh, botanical, green-forward | EB Garamond | Mulish |
| 5 | Seaside Vow | Breezy, coastal, destination wedding | Marcellus | Poppins |
| 6 | Midnight Bloom | Moody, dramatic, dark background | Cormorant Garamond | Karla |

Presets 2–6 are new — none of them exist as templates yet. Preset 1 is
listed for completeness only; it's the frontend's hardcoded fallback and
needs no `TemplateColor`/`TemplateFont` rows at all unless you want an
explicit template that matches it exactly.

---

## 1. Storybook Romance *(existing default)*

The current built-in look. No entry required — any V2 template with no
`v2-*` colors/fonts already renders this. Listed here only so it's easy to
compare against the new presets.

| Slot | Hex | Swatch |
|---|---|---|
| `v2-ivory` | `#FAF6F0` | <span style="display:inline-block;width:14px;height:14px;background:#FAF6F0;border:1px solid #ccc;vertical-align:middle"></span> |
| `v2-blush` | `#E8B4B8` | <span style="display:inline-block;width:14px;height:14px;background:#E8B4B8;border:1px solid #ccc;vertical-align:middle"></span> |
| `v2-blush-deep` | `#C98A90` | <span style="display:inline-block;width:14px;height:14px;background:#C98A90;border:1px solid #ccc;vertical-align:middle"></span> |
| `v2-sage` | `#A8B5A0` | <span style="display:inline-block;width:14px;height:14px;background:#A8B5A0;border:1px solid #ccc;vertical-align:middle"></span> |
| `v2-sage-deep` | `#7C8B74` | <span style="display:inline-block;width:14px;height:14px;background:#7C8B74;border:1px solid #ccc;vertical-align:middle"></span> |
| `v2-charcoal` | `#3E3A36` | <span style="display:inline-block;width:14px;height:14px;background:#3E3A36;border:1px solid #ccc;vertical-align:middle"></span> |
| `v2-gold` | `#C9A66B` | <span style="display:inline-block;width:14px;height:14px;background:#C9A66B;border:1px solid #ccc;vertical-align:middle"></span> |
| `v2-ink-soft` | `#5C564F` | <span style="display:inline-block;width:14px;height:14px;background:#5C564F;border:1px solid #ccc;vertical-align:middle"></span> |

Fonts: `v2-display` → **Cormorant Garamond**, `v2-body` → **Karla**.

---

## 2. Editorial Vow

Quiet, modern, magazine-style. Neutral warm-grey palette with a single
terracotta/brass accent instead of the classic pink+green pairing — reads
as minimalist rather than "wedding-flavored," good for couples who want V2's
scroll-story motion without the storybook aesthetic.

| Slot | Hex | Swatch | Note |
|---|---|---|---|
| `v2-ivory` | `#F7F5F1` | <span style="display:inline-block;width:14px;height:14px;background:#F7F5F1;border:1px solid #ccc;vertical-align:middle"></span> | Warm off-white background |
| `v2-blush` | `#E8E3DC` | <span style="display:inline-block;width:14px;height:14px;background:#E8E3DC;border:1px solid #ccc;vertical-align:middle"></span> | Pale warm greige (was pink) |
| `v2-blush-deep` | `#8C7A63` | <span style="display:inline-block;width:14px;height:14px;background:#8C7A63;border:1px solid #ccc;vertical-align:middle"></span> | Warm taupe text accent |
| `v2-sage` | `#DCE0DC` | <span style="display:inline-block;width:14px;height:14px;background:#DCE0DC;border:1px solid #ccc;vertical-align:middle"></span> | Pale cool grey-green |
| `v2-sage-deep` | `#6B7268` | <span style="display:inline-block;width:14px;height:14px;background:#6B7268;border:1px solid #ccc;vertical-align:middle"></span> | Muted graphite-green text |
| `v2-charcoal` | `#24211D` | <span style="display:inline-block;width:14px;height:14px;background:#24211D;border:1px solid #ccc;vertical-align:middle"></span> | Near-black warm text |
| `v2-gold` | `#B08D57` | <span style="display:inline-block;width:14px;height:14px;background:#B08D57;border:1px solid #ccc;vertical-align:middle"></span> | Muted brass accent |
| `v2-ink-soft` | `#6E6A63` | <span style="display:inline-block;width:14px;height:14px;background:#6E6A63;border:1px solid #ccc;vertical-align:middle"></span> | Warm grey muted text |

Fonts: `v2-display` → **Fraunces** (high-contrast modern serif), `v2-body` →
**Inter** (clean grotesque sans).

---

## 3. Gilded Romance

Deep jewel tones on champagne cream — burgundy and emerald standing in for
pink/sage, with a richer, more saturated gold than the default. Reads as
luxury/black-tie rather than garden-party.

| Slot | Hex | Swatch | Note |
|---|---|---|---|
| `v2-ivory` | `#FBF3E4` | <span style="display:inline-block;width:14px;height:14px;background:#FBF3E4;border:1px solid #ccc;vertical-align:middle"></span> | Warm champagne cream background |
| `v2-blush` | `#E3C6C0` | <span style="display:inline-block;width:14px;height:14px;background:#E3C6C0;border:1px solid #ccc;vertical-align:middle"></span> | Dusty rose |
| `v2-blush-deep` | `#7A2E2E` | <span style="display:inline-block;width:14px;height:14px;background:#7A2E2E;border:1px solid #ccc;vertical-align:middle"></span> | Deep burgundy text accent (was pink) |
| `v2-sage` | `#C9D3C1` | <span style="display:inline-block;width:14px;height:14px;background:#C9D3C1;border:1px solid #ccc;vertical-align:middle"></span> | Soft sage |
| `v2-sage-deep` | `#2F4A3C` | <span style="display:inline-block;width:14px;height:14px;background:#2F4A3C;border:1px solid #ccc;vertical-align:middle"></span> | Deep emerald text |
| `v2-charcoal` | `#241C10` | <span style="display:inline-block;width:14px;height:14px;background:#241C10;border:1px solid #ccc;vertical-align:middle"></span> | Espresso near-black text |
| `v2-gold` | `#C9A227` | <span style="display:inline-block;width:14px;height:14px;background:#C9A227;border:1px solid #ccc;vertical-align:middle"></span> | Antique gold — richer/more saturated than default |
| `v2-ink-soft` | `#5A4F3E` | <span style="display:inline-block;width:14px;height:14px;background:#5A4F3E;border:1px solid #ccc;vertical-align:middle"></span> | Warm taupe muted text |

Fonts: `v2-display` → **Playfair Display** (high-contrast luxury serif),
`v2-body` → **Lato**.

---

## 4. Wildflower Garden

Green-forward and airy — leans into the botanical/petal motifs already in
V2's background particles. Honey gold instead of antique gold, olive-black
text instead of brown-black.

| Slot | Hex | Swatch | Note |
|---|---|---|---|
| `v2-ivory` | `#F7F8F0` | <span style="display:inline-block;width:14px;height:14px;background:#F7F8F0;border:1px solid #ccc;vertical-align:middle"></span> | Soft leaf-tinted white background |
| `v2-blush` | `#E9C7C4` | <span style="display:inline-block;width:14px;height:14px;background:#E9C7C4;border:1px solid #ccc;vertical-align:middle"></span> | Dusty rose (petals) |
| `v2-blush-deep` | `#B4676A` | <span style="display:inline-block;width:14px;height:14px;background:#B4676A;border:1px solid #ccc;vertical-align:middle"></span> | Deeper rose text accent |
| `v2-sage` | `#B7C9A8` | <span style="display:inline-block;width:14px;height:14px;background:#B7C9A8;border:1px solid #ccc;vertical-align:middle"></span> | Fresh leaf green |
| `v2-sage-deep` | `#566B45` | <span style="display:inline-block;width:14px;height:14px;background:#566B45;border:1px solid #ccc;vertical-align:middle"></span> | Deep botanical green text |
| `v2-charcoal` | `#2E3324` | <span style="display:inline-block;width:14px;height:14px;background:#2E3324;border:1px solid #ccc;vertical-align:middle"></span> | Deep olive-black text |
| `v2-gold` | `#C7A34E` | <span style="display:inline-block;width:14px;height:14px;background:#C7A34E;border:1px solid #ccc;vertical-align:middle"></span> | Honey gold accent |
| `v2-ink-soft` | `#5B6350` | <span style="display:inline-block;width:14px;height:14px;background:#5B6350;border:1px solid #ccc;vertical-align:middle"></span> | Muted green-grey text |

Fonts: `v2-display` → **EB Garamond** (organic classic serif), `v2-body` →
**Mulish** (soft rounded sans).

---

## 5. Seaside Vow

Destination/beach wedding: sandy background, coral instead of pink, seafoam
instead of sage, and a deep navy for text instead of the usual warm brown —
the one preset that shifts the *text* color's undertone, not just the accents.

| Slot | Hex | Swatch | Note |
|---|---|---|---|
| `v2-ivory` | `#FBF7EF` | <span style="display:inline-block;width:14px;height:14px;background:#FBF7EF;border:1px solid #ccc;vertical-align:middle"></span> | Sandy white background |
| `v2-blush` | `#F0BBA4` | <span style="display:inline-block;width:14px;height:14px;background:#F0BBA4;border:1px solid #ccc;vertical-align:middle"></span> | Coral |
| `v2-blush-deep` | `#C97455` | <span style="display:inline-block;width:14px;height:14px;background:#C97455;border:1px solid #ccc;vertical-align:middle"></span> | Deeper coral text accent |
| `v2-sage` | `#A9D2C8` | <span style="display:inline-block;width:14px;height:14px;background:#A9D2C8;border:1px solid #ccc;vertical-align:middle"></span> | Seafoam |
| `v2-sage-deep` | `#3E7A6C` | <span style="display:inline-block;width:14px;height:14px;background:#3E7A6C;border:1px solid #ccc;vertical-align:middle"></span> | Deep teal text |
| `v2-charcoal` | `#1F2E3A` | <span style="display:inline-block;width:14px;height:14px;background:#1F2E3A;border:1px solid #ccc;vertical-align:middle"></span> | Deep navy text (not brown-black) |
| `v2-gold` | `#D3A857` | <span style="display:inline-block;width:14px;height:14px;background:#D3A857;border:1px solid #ccc;vertical-align:middle"></span> | Warm sand gold |
| `v2-ink-soft` | `#4F5F66` | <span style="display:inline-block;width:14px;height:14px;background:#4F5F66;border:1px solid #ccc;vertical-align:middle"></span> | Slate blue-grey muted text |

Fonts: `v2-display` → **Marcellus** (elegant airy serif), `v2-body` →
**Poppins** (rounded geometric sans).

---

## 6. Midnight Bloom

The one dark preset — a dramatic evening/candlelit mood. **Ship this one
carefully**: it works by swapping which slot is "light" and which is "dark"
(`v2-ivory` becomes the dark tone, `v2-charcoal` becomes the light tone),
which is safe for the ivory/charcoal light-dark *pair* (background↔text and
button-background↔button-text both stay correctly paired), but the
`blush-deep`/`sage-deep` text colors need to be light enough to read against
a now-dark `v2-ivory` background — check this preset on an actual device
before enabling it for a real event, not just by reading the hex codes.

| Slot | Hex | Swatch | Note |
|---|---|---|---|
| `v2-ivory` | `#211C24` | <span style="display:inline-block;width:14px;height:14px;background:#211C24;border:1px solid #666;vertical-align:middle"></span> | Deep plum-black — now the *dark* background (inverted role) |
| `v2-blush` | `#4A3A44` | <span style="display:inline-block;width:14px;height:14px;background:#4A3A44;border:1px solid #666;vertical-align:middle"></span> | Muted wine, dark-mode-safe fill |
| `v2-blush-deep` | `#E3A6AE` | <span style="display:inline-block;width:14px;height:14px;background:#E3A6AE;border:1px solid #ccc;vertical-align:middle"></span> | Light rose — must read on the dark `v2-ivory` |
| `v2-sage` | `#3C4A3F` | <span style="display:inline-block;width:14px;height:14px;background:#3C4A3F;border:1px solid #666;vertical-align:middle"></span> | Deep forest, dark-mode-safe fill |
| `v2-sage-deep` | `#A9C4AC` | <span style="display:inline-block;width:14px;height:14px;background:#A9C4AC;border:1px solid #ccc;vertical-align:middle"></span> | Light sage — must read on the dark `v2-ivory` |
| `v2-charcoal` | `#F5EDE6` | <span style="display:inline-block;width:14px;height:14px;background:#F5EDE6;border:1px solid #ccc;vertical-align:middle"></span> | Warm ivory-white — now the *light* text (inverted role) |
| `v2-gold` | `#D4AF6A` | <span style="display:inline-block;width:14px;height:14px;background:#D4AF6A;border:1px solid #ccc;vertical-align:middle"></span> | Candlelight gold accent |
| `v2-ink-soft` | `#C9BFC5` | <span style="display:inline-block;width:14px;height:14px;background:#C9BFC5;border:1px solid #ccc;vertical-align:middle"></span> | Light mauve-grey muted text |

Fonts: `v2-display` → **Cormorant Garamond**, `v2-body` → **Karla** (same
pairing as the default — the drama here comes entirely from color, not
typography).

> This is the only preset that departs from the app's normal light-mode-only
> convention (see [DESIGN.md](../../DESIGN.md)) — that rule governs the
> GoEvent app UI, not guest-facing showcase content, but treat Midnight
> Bloom as opt-in/experimental rather than a default recommendation until
> someone has actually scrolled through it on a phone.

---

## Example: entering a preset via the API

One color row (repeat for all 8 slots) and one font row (repeat for both
roles, per language you want to cover) per template:

```
POST /api/core-data/partner-templates/{id}/colors/
{ "hex_color_code": "#B08D57", "name": "v2-gold" }
```

```
POST /api/core-data/custom-fonts/            # multipart/form-data, once per unique file
  name: "Fraunces"
  font_file: <Fraunces-Regular.woff2>
```

```
POST /api/core-data/partner-templates/{id}/fonts/
{ "language": "en", "font": 17, "font_type": "v2-display" }
```

(`font_type: "v2-display"` / `"v2-body"` requires the enum extension
described in [showcase-v2-theming.md](showcase-v2-theming.md) — until that
ships, V2 simply keeps rendering the current default font regardless of
what's uploaded.)

## Suggestion for the admin panel UI

Not a hard requirement, but worth considering if there's a template-authoring
screen: a "preset" dropdown that pre-fills all 8 color fields and both font
fields in one click (using the tables above), with the [slot reference](#the-8-color-slots-what-each-one-is-for)
shown as inline help text next to each field. That turns entering a V2
template's look from "know 8 hex codes and 2 font-type enum values by heart"
into "pick a preset, tweak if you like."
