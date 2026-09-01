# Regenerating the partner page screenshots

`/partners` ([src/views/PartnerProgramView.vue](../../src/views/PartnerProgramView.vue)) makes its
argument with eleven checked-in screenshots in [src/assets/partners/](../../src/assets/partners/).
They are captured from the running app or a phone, not drawn, and this is how to capture them again
when the showcase, the guest list or the analytics change shape.

## Why they are checked in rather than fetched live

The page's whole audience is people who are **not** partners yet. Every endpoint that could produce
these views live is either behind `is_partner` or costs three full app boots (that is what
`/partners/templates` does, and why it is a page of its own). A landing page cannot spend that on
its first screen, so the pictures ship with the bundle. Total weight is ~515 KB of WebP, all of it
`loading="lazy"` except the three hero covers — and the two guest-list captures are alternatives
inside one `<picture>`, so no reader downloads both.

## The assets

| File                          | What it is                                      | Size        |
| ----------------------------- | ----------------------------------------------- | ----------- |
| `invite-cover-blush.webp`     | Cover — ivory, dark red border, Khmer gold      | 328 × 717   |
| `invite-cover-khmer.webp`     | Cover — ivory + Khmer gold, chandeliers         | 330 × 717   |
| `invite-cover-crimson.webp`   | Cover — white + gold ribbon                     | 327 × 716   |
| `invite-cover-royal.webp`     | Cover — deep red + gold, "SN" monogram          | 318 × 690   |
| `the-opening.webp`            | The shared link, as a guest receives it in chat | 587 × 1256  |
| `invite-rsvp.webp`            | Main stage, scrolled to countdown + RSVP        | 325 × 718   |
| `invite-wish.webp`            | Main stage, guest wishes and comments           | 329 × 716   |
| `dashboard-guests.webp`       | Guest list panel, `2xl` one-row header          | 1500 × 1052 |
| `dashboard-guests-phone.webp` | Guest list panel, phone layout                  | 796 × 1726  |
| `dashboard-rsvp.webp`         | RSVP analytics card                             | 976 × 1318  |
| `dashboard-gifts.webp`        | Cash gift analytics card                        | 976 × 1386  |

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

## Capturing the back-office cards

`dashboard-guests.webp`, `dashboard-guests-phone.webp`, `dashboard-rsvp.webp` and
`dashboard-gifts.webp` are **cards, not screens**: an element screenshot of one panel — the guest
list's `#guests-panel`, and the two analytics cards — with the sidebar, the tab bar and the page
heading left behind. A full-window screenshot spends most of its pixels on furniture nobody is
buying, and beside a cropped card it reads as the untidy one. The page frames all four in the same
`.app-card`, which is also why the drawn browser chrome is gone: it existed to say "desk thing"
around a whole window, and there is no window left to frame.

### Text has to come out the same size in all three

Read this before changing any viewport number below. The guest panel and the two analytics cards sit
in one grid, so the app's own 14px type has to render at the same physical size in all of them —
otherwise the set looks thrown together no matter how good the grid is. That is governed by
**capture width ÷ display width**, and it is why the guest panel is shot much wider than the
analytics cards rather than all three at one width:

| Card             | Capture | Display (max) | Scale |
| ---------------- | ------- | ------------- | ----- |
| Guest panel      | 960     | ~1088         | 1.13  |
| RSVP / cash gift | 488     | ~536          | 1.10  |

Change one of those and change the other, or the layout, to match.

### The session

Both tabs need an authenticated session, and **the credentials in CLAUDE.md do not work** — both
`admin@goevent.com / 123123123@` (local) and the production password are rejected as of
2026-08-31. Seed the session instead, which is the pattern the E2E suite already uses (see
[PLAYWRIGHT.md](PLAYWRIGHT.md) and `e2e/tickets-tab.spec.ts`):

1. `context.addInitScript` writing `goevent_v3_access_token`, `goevent_v3_refresh_token` and
   `goevent_v3_user`. The envelope is `{ value, timestamp, version: '3.0' }`, `value` is always a
   **string**, so the user record is double-encoded. The access token only needs a parseable JWT
   payload with a future `exp` — the signature is never verified client-side.
2. Route the **backend origin** (`http://127.0.0.1:8000/**`), never a path glob — under Vite dev a
   glob like `**/api/**` matches the app's own module URLs and answers its JavaScript with JSON.
   Dispatch on `pathname` inside **one** handler rather than stacking globs: Playwright matches the
   most recently added route first, so `guests/**` registered after `guests/rsvp-summary/**`
   silently swallows it.

### The fixtures

Common to both tabs:

- `GET /api/auth/profile/` → a real user object. The catch-all empty-list stub overwrites the
  seeded user here and knocks `isAuthenticated` back to false.
- The event, with `can_edit: true`, `category_details.name: 'Wedding'` **and**
  `event_template_details.name`.
- `GET /api/payment/payments/event_payments/` → one row with `status: 'confirmed'` and
  `template_name` equal to that template name. Both tabs render "Template Payment Required" without
  it.
- `GET .../guest-groups/` → groups with `color` and `guest_count`. The colours draw the cash gift
  card's segmented bar, and the guest counts are the **denominator** of its participation figure
  (gifts ÷ sum of `guest_count`) — the guest list is not.
- `GET .../guests/stats/` → **`total_guests`**, `not_sent`, `sent`, `viewed`. Not `total`; a wrong
  key renders the whole stats band as zeroes and everything else still looks right.

Guest tab only:

- `GET .../guests/` → the rows on screen. **`count` must equal what you serve**: with a larger count
  the panel fetches a second page, gets the same rows back and renders the list twice.
- `GET .../tables/` → the tables `table_details` on a guest row points at.

Analytics tab only:

- `GET .../guests/?page_size=1000` → the gift rows. `CashGiftAnalytics` reads
  `cash_gift_amount`/`cash_gift_currency`/`group` off the guest list itself; there is no gift
  endpoint.
- `GET .../guests/rsvp-summary/` → `total_invited`, `status_counts`, `total_expected_attendees`,
  `pending_guests`.
- `GET .../rsvp-questions/` → an empty list is fine; the block is hidden below.

Keep every number consistent across the four files — they are one wedding: 186 guests, 113 replied,
73 pending. Two captures that disagree about a headcount is the kind of detail a shop owner notices.
Keep the seeded names invented, too. They ship on a public marketing page, so real guest names and
phone numbers must never end up here.

### Before every shot

**Sweep every fixed overlay**, not just the contact FAB. An element screenshot still paints whatever
overlaps the element's box, and at these viewports that is the mobile tab bar (`z-[70]`) and the Vue
devtools anchor the dev server injects. Sweeping by computed position catches all of them and does
not name a z-index that will change:

```js
for (const el of document.querySelectorAll('body *'))
  if (getComputedStyle(el).position === 'fixed') el.style.display = 'none'
```

**Flatten the card's own radius, border, ring and shadow.** The page draws its own `.app-card`
frame; a baked-in rounded corner shows the app's background as four tinted nubs just inside it:

```js
// on the element being shot
'border-radius:0;box-shadow:none;border-color:transparent;--tw-ring-color:transparent'
```

### The guest panel

`/events/{id}/manage?tab=guest-management`, element `#guests-panel`.

1. **Wide capture: a 1536px viewport.** That is where the panel reaches its `2xl` one-row header —
   stats band and toolbar side by side instead of stacked — which is both the most compact version
   of the card and 960px wide, the width the scale table above depends on. Serve **10 guests**; the
   list body is a `sm:max-h-[37.5rem]` scroller, so the card comes out 960 × 673 with the tenth row
   cut by the scroller's own edge, which reads as "the list goes on".
2. **Phone capture: a 430px viewport, 6 guests.** Below `sm` the list body has no max-height, so the
   row count is the only thing setting the card's height; six lands at 398 × 863.
3. **Hide the end-of-list trailer** ("All N guests loaded"). It reports the stubbed page size rather
   than the 186 in the stats band right above it, so it contradicts the picture it sits in.

### The analytics cards

`/events/{id}/manage?tab=analytics`, at a **520px viewport** (the cards come out 488 wide).

1. At that width `CashGiftAnalytics` wraps its KPI tiles to two columns and `RsvpAnalytics` puts the
   donut beside its legend — a composition that survives being rendered at ~400px in a marketing
   column. The desktop layout does not: at `lg` both cards go wide and short, and shrinking that
   into half a column reproduces the unreadable-guest-names problem the phone capture exists to
   avoid. It is also why these two need **no phone twin** — one file serves every breakpoint.
2. **One currency, not two.** A second currency adds a whole section (~250px) and leaves the gifts
   card half again taller than the RSVP one, which reads as a mistake when they sit side by side.
3. **Hide the custom-questions block** — it is an authoring UI, not a readout, and it doubles the
   card's height:

   ```js
   const p = [...document.querySelectorAll('p')].find(
     (el) => el.textContent.trim() === 'Custom questions',
   )
   p?.closest('section')?.setAttribute('style', 'display:none')
   ```

## Converting to WebP

There is no `sharp` or ImageMagick in this repo, and adding one for eleven images would be a
dependency the build carries forever. Convert inside Chromium instead, or install `sharp` somewhere
outside the repo and drive it from there:

```js
const c = document.createElement('canvas')
c.width = Math.round(img.width * scale)
c.height = Math.round(img.height * scale)
c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
return c.toDataURL('image/webp', 0.82).split(',')[1]
```

Quality 0.82 for the phone captures and 0.85 for the back-office cards holds every file under
~60 KB. Downscale on the way in, to about 1.4× the width the file is displayed at — beyond that
is bytes for nothing:

| File                          | Cap  | Because it displays at                    |
| ----------------------------- | ---- | ----------------------------------------- |
| `invite-cover-*.webp`         | 780  | ~275px (the phone bezel is 17rem at `lg`) |
| `invite-cover-royal.webp`     | 500  | thumbnail only                            |
| `dashboard-guests.webp`       | 1500 | up to ~1088px                             |
| `dashboard-guests-phone.webp` | 820  | up to ~592px (it is swapped out at `sm`)  |
| `dashboard-rsvp/gifts.webp`   | 980  | up to ~536px                              |

## After replacing a file

- Keep the filenames. They are imported by name in the view, and three of them are used twice.
- If a showcase capture's aspect ratio changes, update `aspect-ratio: 390 / 844` on
  `.device__screen` — it holds the box while a lazy image decodes, and a mismatch makes the
  section jump.
- If a back-office capture's size changes, update its `width`/`height` **attributes** in the view
  (`RUN_DAY_SHOTS` for the two analytics cards, the `<picture>` markup for the guest panel). They
  do the same job there, and a stale pair reserves the wrong height and jumps the row below it.
- Keep the two analytics captures within a few percent of each other's aspect ratio. They sit in an
  `items-start` grid, so each is its own height and a large gap between them reads as one card
  having failed to load rather than as two cards of different lengths.
- Re-check horizontal overflow at 320, 360 and 390px. The hero fan's footprint is about **1.93×**
  the lead card's width, because rotating a card 2.16 times taller than it is wide adds more width
  than the translate does. `overflow-hidden` on the hero section will hide a mistake here by
  cutting a card in half rather than scrolling the page.
