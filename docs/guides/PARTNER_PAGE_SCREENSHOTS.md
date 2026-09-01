# Regenerating the partner page screenshots

`/partners` ([src/views/PartnerProgramView.vue](../../src/views/PartnerProgramView.vue)) makes its
argument with nine checked-in screenshots in [src/assets/partners/](../../src/assets/partners/).
They are captured from the running app or a phone, not drawn, and this is how to capture them again
when the showcase or the guest list changes shape.

## Why they are checked in rather than fetched live

The page's whole audience is people who are **not** partners yet. Every endpoint that could produce
these views live is either behind `is_partner` or costs three full app boots (that is what
`/partners/templates` does, and why it is a page of its own). A landing page cannot spend that on
its first screen, so the pictures ship with the bundle. Total weight is ~390 KB of WebP, all of it
`loading="lazy"` except the three hero covers.

## The assets

| File                          | What it is                                      | Size       |
| ----------------------------- | ----------------------------------------------- | ---------- |
| `invite-cover-blush.webp`     | Cover — ivory, dark red border, Khmer gold      | 328 × 717  |
| `invite-cover-khmer.webp`     | Cover — ivory + Khmer gold, chandeliers         | 330 × 717  |
| `invite-cover-crimson.webp`   | Cover — white + gold ribbon                     | 327 × 716  |
| `invite-cover-royal.webp`     | Cover — deep red + gold, "SN" monogram          | 318 × 690  |
| `the-opening.webp`            | The shared link, as a guest receives it in chat | 587 × 1256 |
| `invite-rsvp.webp`            | Main stage, scrolled to countdown + RSVP        | 325 × 718  |
| `invite-wish.webp`            | Main stage, guest wishes and comments           | 329 × 716  |
| `dashboard-guests.webp`       | Guest list, desktop layout                      | 1500 wide  |
| `dashboard-guests-phone.webp` | Guest list, phone layout                        | 700 wide   |

The four covers are the hero fan **and** the "Browse every design" strip — deliberately the same
files, so a reader recognises three of them and the fourth reads as "and more".

**The cover filenames no longer describe their artwork.** They were replaced on 2026-09-01 with a
different set of designs, and only `khmer` still matches its name: `blush` is no longer blush rose,
`crimson` is now white and gold, `royal` is no longer royal blue. The names survive because each is
imported by name in the view and used twice. Rename them together with those imports, or leave
them — but do not trust them to tell you what you are looking at.

**Sizes are the source's, not a capture spec.** The covers and the two main-stage shots were
supplied as ~330px-wide exports rather than captured at `deviceScaleFactor: 2`, so they are roughly
1.2× for a slot that renders at up to ~275px — under-resolved on any retina screen. Re-export at
the capture settings below if they need to be sharp. `the-opening.webp` is the exception at 587px
(~2.1×).

## Capturing the invitation screenshots

**`the-opening.webp` is not one of these.** It is a phone screenshot of a real messaging app
showing the shortlink as a guest receives it — link preview, thumbnail and all — so no route
renders it and the recipe below does not apply. Reshoot it by sending a real invitation link to a
chat and capturing the thread. Two things to check before shipping the result: the shortlinks in
frame are **live URLs anyone can open**, and the names in the thread are real. Use a disposable
event and invented names, the same rule the guest list is held to.

The rest need no login. The public template-preview frame route renders one stage of a real
published event against a chosen design:

```
/template-showcase-preview-frame?stage=<cover|transition|main>&templateId=<id>&lang=<en|kh>
```

With the dev server and the local backend both up:

1. `npm run dev`
2. Drive Chromium at a **390 × 844 viewport, `deviceScaleFactor: 2`, `isMobile: true`**.
3. Give each page **~9 s** after `domcontentloaded` — the showcase loads fonts, template assets and
   decoration layers, and a shorter wait catches it mid-assembly.
4. For an interior frame, scroll the showcase's own scroller — the page itself does not scroll:

   ```js
   await page.$eval(
     '.overflow-y-auto.overscroll-contain',
     (el, t) => {
       el.scrollTop = t
     },
     900,
   )
   ```

   `900` lands on countdown + RSVP, `2277` on the schedule. Re-derive these if the event's sections
   change; the reliable way is to step the scroller in ~570px increments and pick from a contact
   sheet.

**Choosing what to shoot.** Preview events are chosen by staff via `is_template_preview`. Check
what the local backend actually has before assuming a frame will look good:

```
GET /api/core-data/event-templates/          # public, approved templates
GET /api/events/?is_template_preview=true    # the preview roster
```

Two things to avoid, both hit while capturing the current set:

- **Missing host photos** render as a large blurred silhouette. Skip any frame where the host row
  or an avatar-led cover dominates — as of this writing no local preview event has host photos.
- **Empty galleries and the comments block.** The gallery renders grey placeholders, and the
  comments section shows a "Sign in to Comment" button, which contradicts the page's own claim that
  guests need no account. Neither belongs in a marketing screenshot.

## Capturing the guest list

This one needs an authenticated session, and **the credentials in CLAUDE.md do not work** — both
`admin@goevent.com / 123123123@` (local) and the production password are rejected as of
2026-08-31. Seed the session instead, which is the pattern the E2E suite already uses (see
[PLAYWRIGHT.md](PLAYWRIGHT.md) and `e2e/tickets-tab.spec.ts`):

1. `context.addInitScript` writing `goevent_v3_access_token`, `goevent_v3_refresh_token` and
   `goevent_v3_user`. The envelope is `{ value, timestamp, version: '3.0' }`, `value` is always a
   **string**, so the user record is double-encoded. The access token only needs a parseable JWT
   payload with a future `exp` — the signature is never verified client-side.
2. Route the **backend origin** (`http://127.0.0.1:8000/**`), never a path glob — under Vite dev a
   glob like `**/api/**` matches the app's own module URLs and answers its JavaScript with JSON.
3. The fixtures the guest tab actually needs:
   - `GET /api/auth/profile/` → a real user object. The catch-all empty-list stub overwrites the
     seeded user here and knocks `isAuthenticated` back to false.
   - The event, with `can_edit: true`, `category_details.name: 'Wedding'` **and**
     `event_template_details.name`.
   - `GET /api/payment/payments/event_payments/` → one row with `status: 'confirmed'` and
     `template_name` equal to that template name. Without it the tab renders "Template Payment
     Required" instead of the guest list.
   - `.../guests/`, `.../guests/stats/`, `.../guest-groups/`, `.../tables/`.
4. Hide the contact FAB before shooting — it is a support widget, not product surface:
   `page.addStyleTag({ content: '[class*="z-[55]"] { display: none !important }' })`
5. Desktop capture at **1180 × 800, `deviceScaleFactor: 2`**; phone capture at **414 × 860,
   `deviceScaleFactor: 2`, `isMobile: true`**, then crop the bottom ~11% off the phone one — the
   mobile tab bar overlaps the last guest row.

Keep the seeded names invented. They are shipped on a public marketing page, so real guest names
and phone numbers must never end up in these files.

## Converting to WebP

There is no `sharp` or ImageMagick in this repo, and adding one for nine images would be a
dependency the build carries forever. Convert inside Chromium instead, or install `sharp` somewhere
outside the repo and drive it from there:

```js
const c = document.createElement('canvas')
c.width = Math.round(img.width * scale)
c.height = Math.round(img.height * scale)
c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
return c.toDataURL('image/webp', 0.82).split(',')[1]
```

Quality 0.82 for the phone captures and 0.85 for the dashboard holds every file under ~160 KB.
Cap the covers at 780px wide (they display at ~275px at most — the phone bezel is 17rem at `lg` — so that is a comfortable retina buffer) and
the thumbnail-only `invite-cover-royal.webp` at 500px.

## After replacing a file

- Keep the filenames. They are imported by name in the view, and three of them are used twice.
- If the aspect ratio changes, update `aspect-ratio: 390 / 844` on `.device__screen` — it holds the
  box while a lazy image decodes, and a mismatch makes the section jump.
- Re-check horizontal overflow at 320, 360 and 390px. The hero fan's footprint is about **1.93×**
  the lead card's width, because rotating a card 2.16 times taller than it is wide adds more width
  than the translate does. `overflow-hidden` on the hero section will hide a mistake here by
  cutting a card in half rather than scrolling the page.
