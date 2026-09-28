# Backend API Requirements: Backdrop Behind the Invitation Text (`contentBackdrop`)

> **Status: NO NEW FIELD.** Two new keys inside the existing
> `cover_stage_layout` JSON blob. Nothing to do if that blob keeps keys it
> doesn't know; see [What to check](#what-to-check). The frontend has shipped
> against this already.

## What it is

On the invitation's main page, the event's text sits over the template's
backdrop (a photo, a video or a colour). When the text colour and the backdrop
clash, the text is hard to read. Until now the only help was the **Liquid Glass**
switch (`display_liquid_glass_background`), which frosts a card behind the text.
That card covers 85% of the screen, so the backdrop stays sharp all round it, and
the card itself is a visible box laid over the design.

Partners can now choose what sits behind the text:

| `contentBackdrop` | What it draws |
| --- | --- |
| `card` (default) | the existing Liquid Glass card, still switched by `display_liquid_glass_background`. Unchanged |
| `blur` | the **whole** backdrop behind the text is blurred; its colours are kept |
| `frost` | the whole backdrop is blurred and made lighter (for dark text) |
| `smoke` | the whole backdrop is blurred and made darker (for light text) |

`contentBackdropStrength` is how far `blur`, `frost` or `smoke` goes: an integer
from `0` to `100`, default `50`. It is not used by `card`.

```jsonc
{
  "cover_stage_layout": {
    // ... every existing key unchanged ...
    "contentBackdrop": "smoke",        // "card" | "blur" | "frost" | "smoke"
    "contentBackdropStrength": 70      // integer 0–100
  }
}
```

`display_liquid_glass_background` does not change. It still governs the cover's
glass panels whatever `contentBackdrop` is, and the card only when
`contentBackdrop` is `card`. (It also still picks the footer for a template with
no `footer_design`; see [footer-design.md](footer-design.md).)

## Defaults and validation

The frontend reads an **absent, `null` or unrecognised** `contentBackdrop` as
`card`, and clamps `contentBackdropStrength` into 0–100 (anything that isn't a
number reads as `50`). So the backend doesn't need to validate either key.

If it does validate:

- allow the four values above, and an integer 0–100 for the strength;
- **default an unrecognised value rather than rejecting the whole save**, as
  with `stackLayout`;
- if the serializer fills in defaults for known keys (it appears to; see below),
  the default must be `"card"` and `50`. **Never default to `blur`, `frost` or
  `smoke`**: `card` is what every template drew before this existed, so any other
  default would silently restyle every published invitation.

The partner editor now sends both keys on every save (as `"card"` and `50`
unless the partner changes them), the same way it already sends `contentWidth`.

## What to check

There is a real chance of silent loss here. The cover-gilding work found that
`guestFrame` was **dropped by a key allow-list** in this blob
([cover-gilding.md](cover-gilding.md)). The live data suggests keys are handled
by a list today: all 20 published templates return the same 22 core keys,
including `stackLayout` on templates saved before that key existed, so the
backend fills known keys itself. Newer optional keys (`coverDetails`,
`coverPhoto`, `coverText`) do come back on the templates that set them, which
suggests unknown keys now pass through. Please confirm which is true:

1. **Unknown keys are kept** (stored verbatim, or merged over defaults): nothing
   to do. Verify by saving a partner template with *Behind the Text* set to
   *Smoked* and *Strength* at 70, then confirming `"contentBackdrop": "smoke"`
   and `"contentBackdropStrength": 70` come back on
   `GET /api/core-data/partner-templates/<id>/`.
2. **Keys are allow-listed**: add both keys. Otherwise the save returns `200`,
   the editor looks like it worked, and on the next load the template is back
   on the card with no sign of what went wrong. If the list is still per key,
   this is the fourth blob key it has caught; allowing unknown keys through once
   would stop it catching the fifth.

The save is the existing multipart
`PATCH /api/core-data/partner-templates/<id>/`, where `cover_stage_layout`
arrives as a JSON string. The two keys must then survive both read paths:

- `GET /api/events/<id>/showcase/` → `template_assets.cover_stage_layout`
- `GET /api/core-data/event-templates/<id>/public_template_assets/` → `template_data.cover_stage_layout`

## Frontend reference

- Rules (modes, defaults, how strength maps to blur and tint): [`stageBackdrop.ts`](../../src/components/showcase/stageBackdrop.ts)
- Drawn by: [`MainContentStage.vue`](../../src/components/showcase/MainContentStage.vue) (`.stage-backdrop`)
- Editor: *Behind the Text* in the Content section of the partner template form ([`ContentSection.vue`](../../src/components/template/sections/ContentSection.vue))
- Round-trip test: `round-trips the content backdrop` in [`roundTrip.spec.ts`](../../src/components/template/config/roundTrip.spec.ts)
