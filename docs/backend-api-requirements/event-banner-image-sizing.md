# Backend API Requirements: Event Banner Sizing & OG Variant

> **Status: ON HOLD** — these changes were implemented on the backend and then
> reverted along with an SSR change. The frontend has been rolled back to match:
> the banner is uploaded as a single **1200x630 JPEG** again, which is what
> `og:image` serves directly.
>
> Nothing here is lost work — the analysis below still holds, and the frontend
> side is a three-constant change in
> [`src/constants/media.ts`](../../src/constants/media.ts)
> (`OUTPUT_WIDTH` / `OUTPUT_HEIGHT` / `OUTPUT_TYPE`) plus the `BANNER_WIDTHS`
> cap in [`src/utils/mediaUrl.ts`](../../src/utils/mediaUrl.ts) whenever the
> backend work is re-attempted. **Do not raise the frontend master resolution
> before Ask 2 lands**: served directly, a large master pushes `og:image` past
> the size budget and WhatsApp silently drops to a corner thumbnail — worse than
> where we started.

## Context

`banner_image` serves two audiences that were never separated:

1. **In-app display** — the event card ([EventCard.vue](../../src/components/EventCard.vue)),
   the about-page hero ([EventAboutSection.vue](../../src/components/EventAboutSection.vue)),
   the public event banner, and the full-bleed hero in
   [EventHeroSection.vue](../../src/components/EventHeroSection.vue).
2. **Link previews** — the `og:image` that WhatsApp, Telegram, Messenger,
   iMessage and LINE render when a host shares their event.

Both want **1.91:1** (Open Graph's large-card ratio), so one crop serves both
and the ratio is not changing. What does need to change is resolution and the
fact that a single file is being asked to do both jobs.

## What the frontend now does

The banner cropper ([MediaUploadsSection.vue](../../src/components/MediaUploadsSection.vue))
rasterises every banner to exactly **1200×630 JPEG @ 0.85**. That is the current
(rolled-back) state and the state this document proposes changing:

| | Today | Proposed, once Asks 1-3 land |
|---|---|---|
| Dimensions | 1200×630 | 1920×1005 (same 1.91:1) |
| Format | JPEG | WebP, falling back to JPEG where the browser's canvas can't encode WebP |
| Quality | 0.85 | 0.92 |

Ratio constants live in [`src/constants/media.ts`](../../src/constants/media.ts)
(`BANNER_IMAGE`) and `tailwind.config.js` (`aspect-banner`).

Separately — and **still live**, since it needs no backend support — source files
are no longer size-checked before cropping. The upload is always a re-encode at a
fixed size, so a 40MB camera original and a 2MB phone snap produce
byte-comparable uploads; the old 10MB client-side rejection blocked hosts for no
benefit. Oversized sources are downscaled to a 4096px working copy first,
mirroring what the event-photo flow already did. **Upload sizes reaching the
backend are unchanged (~150KB); only what hosts are allowed to pick has
widened.**

Rationale for the proposed change:

- **1920 wide** — 1200px is the OG *minimum*, and it was being used as a
  ceiling. `EventHeroSection.vue` renders the banner full-bleed with
  `object-cover`, so on a desktop or retina display a 1200px source is
  upscaled and visibly soft.
- **Quality 0.92** — the backend re-encodes to WebP at 85%. Encoding at 0.85
  first meant two stacked lossy passes at the same quality, which softens
  edges and posterises flat colour areas. The upload is a transport format,
  not the final artifact, so it should be near-transparent.

## Ask 1 — Raise the optimizer bound to 1920×1005

`ImageOptimizer.optimize_banner` is documented as bounding banners to
**1920×800** ([EVENT_SHOWCASE_FRONTEND_GUIDE.md:630](../backend-api/EVENT_SHOWCASE_FRONTEND_GUIDE.md#L630)).
That box is 2.4:1, which does not match the 1.91:1 the product actually uses.
A 1920×1005 upload fitted into a 1920×800 box comes out at **1527×800** — a
size nothing asked for, and below the 1920 the hero wants.

Please either raise the bound to `1920×1005` or make it width-bounded only.

**Also please confirm** the optimizer does a *bounded fit* (`Image.thumbnail`
or equivalent) and not a hard `Image.resize((1920, 800))`. A hard resize would
be stretching every banner to 2.4:1 today, which would be a live bug rather
than a nice-to-have — the frontend has always sent 1.91:1.

## Ask 2 — Derive a ≤300KB 1200×630 OG variant

**This is the one that affects real users.** WhatsApp is widely reported to
silently downgrade from the large link card to a small corner thumbnail when
the `og:image` exceeds roughly **300KB**. A 1920×1005 photo as WebP @85% will
frequently exceed that, so pointing `og:image` at the master will make previews
*worse* than before, not better.

Please add a derived variant alongside the master:

| Field | Size | Budget | Used by |
|---|---|---|---|
| `banner_image` (existing) | 1920×1005 | — | in-app display, ImageKit source |
| `banner_image_og` (new) | 1200×630 | tune quality to stay **under ~250KB** | `og:image` / `twitter:image` only |

1200×630 is exact-fit for Facebook/Messenger/WhatsApp/LINE and costs Twitter a
~2.4% centre crop to reach its preferred 2:1 — negligible.

Expose `banner_image_og` on the event serializer (absolute URL, same as
`banner_image`). The frontend does not need to consume it; it exists for the
bot-SSR template.

## Ask 3 — Emit the OG variant plus explicit dimensions in bot SSR

The bot-detection SSR path currently emits
([EVENT_SHOWCASE_FRONTEND_GUIDE.md:1586-1588](../backend-api/EVENT_SHOWCASE_FRONTEND_GUIDE.md#L1586-L1588)):

```html
<meta property="og:image" content="{{ absolute_banner_url }}">
<meta property="og:image:secure_url" content="{{ absolute_banner_url }}">
```

Two changes:

1. Point it at `banner_image_og`, not the master.
2. Add `og:image:width` / `og:image:height`. Without them, Facebook and
   Messenger often render the *small* card on first share and only upgrade to
   the large card after the crawler has fetched and measured the image —
   meaning the very first person a host shares with sees the worse preview.

```html
<meta property="og:image" content="{{ absolute_banner_og_url }}">
<meta property="og:image:secure_url" content="{{ absolute_banner_og_url }}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/jpeg">
```

> Note: the client-side tags in [`src/utils/metaUtils.ts`](../../src/utils/metaUtils.ts)
> already hard-code `og:image:width=1200` / `height=630`. Those are correct
> only because the OG variant is 1200×630 — keep the variant at that size, or
> update both together. (Those client-side tags do nothing for link previews
> regardless, since no crawler runs JS; the SSR path is what matters.)

## When re-attempting: verify WebP uploads are accepted

The proposed change has the frontend upload `.webp` where the browser can encode
it (today it always sends `.jpg`). This *should* be fine — `banner_image` values
are already stored as `.webp`, so `optimize_banner` demonstrably handles WebP
input on re-save — but it is a new code path for a fresh upload and needs one
explicit test before `BANNER_IMAGE.OUTPUT_TYPE` in
[`src/constants/media.ts`](../../src/constants/media.ts) is flipped.

Also worth testing whether a **WebP `og:image`** renders across clients.
Facebook and Twitter handle WebP fine now, but support is uneven in smaller
clients (LINE, older WhatsApp builds) — which is the reason the frontend
currently stays on JPEG. If any client fails, emit the OG variant as JPEG and
leave the master as WebP — hence `og:image:type` above.

## Out of scope

Whether banner framing should eventually become template-driven (a
`template_assets` ratio field, the way `showcase_animation_type` evolved) is
not part of this. 1.91:1 is correct for both current use cases; revisit only if
a template genuinely needs different framing.
