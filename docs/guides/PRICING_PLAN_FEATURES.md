# Pricing plan features — the copy, and where it goes

The feature bullets on every plan are **backend data**, not frontend strings. They live on
the `PricingPlan` record as a flat `features: string[]` and are edited in
**Admin → Pricing Plans → (a plan) → Features**, one feature per line in the textarea.

This file is the source text. Paste a block below into that textarea to publish it.

> **Which language do I paste today?** Only one, because the backend holds one list per
> plan. Paste the **Khmer** block — the paying customers are local. The English block is
> written and ready for the moment the bilingual fields land; see
> [pricing-plan-i18n.md](../backend-api-requirements/pricing-plan-i18n.md).

## The `title — description` convention

One `features` array is rendered in **seven** places with very different amounts of room:

| Surface | Draws |
| --- | --- |
| [PricingSection.vue](../../src/components/PricingSection.vue) (public landing page) | Both halves, two lines per item |
| [TemplateDisplayCard.vue](../../src/components/template/TemplateDisplayCard.vue) | Title only, as pills |
| [TemplateActivationCard.vue](../../src/components/template/TemplateActivationCard.vue) | Title only, as pills |
| [TemplateOverview.vue](../../src/components/template/TemplateOverview.vue) | Title only |
| [TemplatePreview.vue](../../src/components/template/TemplatePreview.vue) | Title only |
| [TemplateSelector.vue](../../src/components/template/TemplateSelector.vue) | Title only, **first 2** |
| [TemplateStatusCards.vue](../../src/components/template/TemplateStatusCards.vue) | Title only, **first 4** |

So each line carries both halves in one string, split on a **spaced em dash**:

```
តំណអញ្ជើញផ្ទាល់ខ្លួនរបស់ភ្ញៀវម្នាក់ៗ — ឈ្មោះភ្ញៀវបង្ហាញនៅលើកាត…
└──────────── title ────────────┘   └──────── description ────────┘
```

[planFeatures.ts](../../src/utils/planFeatures.ts) is the only implementation of that
split, and [planFeatures.spec.ts](../../src/utils/planFeatures.spec.ts) pins its edges.

**Writing rules that follow from the table:**

- The **title must stand alone** — it is all most surfaces ever show, and on two of them
  only the first two or four titles appear at all. Put the most distinctive features first.
- Keep titles short enough not to wrap inside a pill (roughly 3–6 Khmer words).
- A line with **no** dash is still valid and renders as a title alone. Every feature
  written before this convention is one of those, so nothing had to be migrated.
- Don't use a spaced dash inside a title — the first one splits the line.

This convention is a workaround for a `list[str]` column, and it goes away when features
become real rows with real `title` / `description` fields. That is request 1 of
[pricing-plan-i18n.md](../backend-api-requirements/pricing-plan-i18n.md).

---

## Basic Plus — Wedding ($85) and Birthday ($50)

Both plans carry the identical list; they are the same product at two prices.

### English

```
30+ ready-made invitation designs — pick a look you like, then change the words, photos and colours to suit your event
A personal invitation link for every guest — their name appears on the card and in the link preview on Telegram or Facebook, and you can see who has opened theirs
Guest groups — organise by family, side of the event or circle of friends, and read the numbers for each group separately
RSVP replies — guests say whether they are coming, how many they are bringing, leave a private message for you, and answer questions you set yourself
Share your guest list — send a link to a parent or your planner so they can view or edit the list with you, no account needed, and take it back whenever you like
Table seating — drag guests onto tables, and each guest sees their own table number on their invitation
Cash gifts and expenses — record gifts guest by guest in any currency, and track the event budget against what you have spent
Map, video and guestbook — Google Maps, an add-to-calendar reminder, a YouTube video, and somewhere for guests to leave their wishes
Two languages on one invitation — Khmer and English, and the guest chooses
Live forever — pay once, with no expiry date and no monthly fee
```

### ខ្មែរ

```
ទម្រង់កាតអញ្ជើញជាង ៣០ បែប — ជ្រើសរើសម៉ូដដែលពេញចិត្ត រួចប្ដូរអក្សរ រូបភាព និងពណ៌បានតាមចិត្ត
តំណអញ្ជើញផ្ទាល់ខ្លួនរបស់ភ្ញៀវម្នាក់ៗ — ឈ្មោះភ្ញៀវបង្ហាញនៅលើកាត និងក្នុងតំណពេលផ្ញើតាម Telegram ឬ Facebook ហើយអ្នកដឹងថាអ្នកណាបានបើកមើលរួចហើយ
គ្រប់គ្រងបញ្ជីភ្ញៀវជាក្រុម — បែងចែកតាមក្រុមគ្រួសារ ភាគីកម្មវិធី ឬមិត្តភក្ដិ ព្រមទាំងមើលស្ថិតិដាច់ដោយឡែកតាមក្រុមនីមួយៗ
ការឆ្លើយតបចូលរួម (RSVP) — ភ្ញៀវឆ្លើយថាមក ឬមិនមក ប្រាប់ចំនួនអ្នកទៅជាមួយ ផ្ញើសារដល់ម្ចាស់កម្មវិធី និងឆ្លើយសំណួរដែលអ្នកកំណត់ខ្លួនឯង
ចែករំលែកបញ្ជីភ្ញៀវ — ផ្ញើតំណឱ្យឪពុកម្ដាយ ឬអ្នករៀបចំកម្មវិធី មើល ឬកែបញ្ជីជាមួយគ្នា ដោយមិនចាំបាច់មានគណនី ហើយអាចដកហូតតំណវិញពេលណាក៏បាន
រៀបចំតុ និងកន្លែងអង្គុយ — អូសដាក់ភ្ញៀវតាមតុនីមួយៗ ហើយភ្ញៀវឃើញលេខតុរបស់ខ្លួននៅលើកាតអញ្ជើញផ្ទាល់
កត់ត្រាប្រាក់អំណោយ និងចំណាយ — កត់ត្រាអំណោយតាមភ្ញៀវម្នាក់ៗ បានច្រើនរូបិយប័ណ្ណ ព្រមទាំងតាមដានថវិកាចំណាយរបស់កម្មវិធី
ផែនទី វីដេអូ និងសៀវភៅជូនពរ — Google Map ប៊ូតុងរំលឹកដាក់ក្នុងប្រតិទិន វីដេអូ YouTube និងកន្លែងឱ្យភ្ញៀវសរសេរជូនពរ
ពីរភាសាក្នុងកាតតែមួយ — ខ្មែរ និងអង់គ្លេស ភ្ញៀវជ្រើសរើសភាសាដោយខ្លួនឯង
នៅដំណើរការជារៀងរហូត — បង់តែម្ដងគត់ គ្មានថ្ងៃផុតកំណត់ និងគ្មានការបង់ប្រចាំខែ
```

---

## Standard — Wedding and Birthday ($150)

### English

```
Everything in Basic Plus — all of the guest and invitation features above, included in full
Animated invitation designs — the card opens like a door or the decorations drift away, with a Save the Date scene and petals or light falling across the screen
Your own opening film — upload a video that plays as the guest opens the invitation
A gallery of up to 20 photos — your photographs inside the invitation, tappable to full screen
Event analytics — response rate, who has not replied yet, the results of your custom questions, and gifts broken down by group
Support when you need it — our team answers your questions and helps you sort out anything that goes wrong
```

### ខ្មែរ

```
មុខងារ Basic Plus ទាំងអស់ — គ្រប់មុខងារគ្រប់គ្រងភ្ញៀវ និងកាតអញ្ជើញខាងលើ រួមបញ្ចូលទាំងស្រុង
ទម្រង់កាតមានចលនា — កាតបើកចេញដូចទ្វារ ឬគ្រឿងតុបតែងរសាត់ចេញ មានឈុត Save the Date និងផ្កា ឬពន្លឺរសាត់ពេញអេក្រង់
វីដេអូផ្ទាល់ខ្លួនពេលបើកកាត — ដាក់វីដេអូរបស់អ្នកឱ្យលេងនៅពេលភ្ញៀវបើកកាតអញ្ជើញ
វិចិត្រសាលរូបភាពរហូតដល់ ២០ សន្លឹក — រូបភាពរបស់អ្នកបង្ហាញក្នុងកាតអញ្ជើញ ចុចមើលពេញអេក្រង់បាន
ស្ថិតិកម្មវិធី — អត្រាឆ្លើយតប បញ្ជីអ្នកមិនទាន់ឆ្លើយ លទ្ធផលសំណួរផ្ទាល់ខ្លួន និងអំណោយបែងចែកតាមក្រុម
ជំនួយពីក្រុមការងារ — មានក្រុមការងារជួយឆ្លើយសំណួរ និងដោះស្រាយបញ្ហាឱ្យអ្នក ពេលអ្នកត្រូវការ
```

---

## Premium — Wedding ($200)

Five bullets, not six: Premium carries **no analytics line of its own**, because Premium
and Standard reach the identical Analytics tab today. The opening "everything in Standard"
line already covers it, and a separate "detailed analytics" bullet would claim a difference
the product does not make. The line to add back once sharing and export ship is drafted
under [Analytics](#analytics-one-feature-sold-as-two) below.

### English

```
Everything in Standard — the animated designs, the opening film and the analytics above
A design made only for you — a new design for your event alone: colours, typefaces, layout and motion
A designer of your own, 24/7 — someone to adjust the design until you are happy with it
A gallery of up to 30 photos — room for a full pre-wedding set
Support when you need it — our team answers your questions and helps you sort out anything that goes wrong
```

### ខ្មែរ

```
មុខងារ Standard ទាំងអស់ — រួមបញ្ចូលទម្រង់មានចលនា វីដេអូបើកកាត និងស្ថិតិទាំងអស់ខាងលើ
ទម្រង់រចនាផ្ទាល់ខ្លួនទាំងស្រុង — រចនាថ្មីសម្រាប់កម្មវិធីរបស់អ្នកដោយឡែក ទាំងពណ៌ ពុម្ពអក្សរ ទម្រង់ និងចលនា
ក្រុមអ្នករចនាឧទ្ទិសជូន ២៤/៧ — មានអ្នករចនាជួយកែតម្រូវរហូតដល់អ្នកពេញចិត្ត
វិចិត្រសាលរូបភាពរហូតដល់ ៣០ សន្លឹក — កន្លែងគ្រប់គ្រាន់សម្រាប់រូបភាព Pre-wedding ពេញលេញ
ជំនួយពីក្រុមការងារ — មានក្រុមការងារជួយឆ្លើយសំណួរ និងដោះស្រាយបញ្ហាឱ្យអ្នក ពេលអ្នកត្រូវការ
```

---

## Basic Plus Funeral ($50)

Currently a single line reading `All Feautre Included`, which sells nothing and misspells
"feature". A funeral is the same machinery with none of the celebration in the words — a
notice rather than an invitation, contributions rather than gifts, and a programme that
runs over several days — so this is its own list rather than Basic Plus with two nouns
swapped.

### English

```
A choice of announcement designs — pick a fitting design, then change the words, photographs and colours
A personal link for every guest — their name appears on the announcement, and you can see who has opened theirs
Guest groups — organise by family, relatives or neighbours, and read the numbers for each group
Attendance replies — know in advance how many people are coming, so you can prepare enough
Share your guest list — send a link to family members so they can help fill in or correct the list, no account needed
Record contributions — recorded person by person, in any currency, with totals by group
A programme for each day — the schedule of every ceremony, by day and by hour
Map and remembrance book — Google Maps, an add-to-calendar reminder, and somewhere for guests to send condolences
Two languages on one announcement — Khmer and English
Live forever — pay once, with no expiry date
```

### ខ្មែរ

```
ទម្រង់សេចក្ដីជូនដំណឹងច្រើនបែប — ជ្រើសរើសទម្រង់សមរម្យ រួចប្ដូរអក្សរ រូបភាព និងពណ៌តាមតម្រូវការ
តំណផ្ទាល់ខ្លួនរបស់ភ្ញៀវម្នាក់ៗ — ឈ្មោះភ្ញៀវបង្ហាញនៅលើសេចក្ដីជូនដំណឹង ហើយអ្នកដឹងថាអ្នកណាបានបើកមើលរួចហើយ
គ្រប់គ្រងបញ្ជីភ្ញៀវជាក្រុម — បែងចែកតាមក្រុមគ្រួសារ សាច់ញាតិ ឬអ្នកជិតខាង ព្រមទាំងមើលស្ថិតិតាមក្រុម
ការឆ្លើយតបចូលរួម — ដឹងជាមុនថាមានភ្ញៀវប៉ុន្មាននាក់នឹងអញ្ជើញមកចូលរួម ដើម្បីរៀបចំបានគ្រប់គ្រាន់
ចែករំលែកបញ្ជីភ្ញៀវ — ផ្ញើតំណឱ្យសមាជិកគ្រួសារជួយបំពេញ ឬកែបញ្ជីជាមួយគ្នា ដោយមិនចាំបាច់មានគណនី
កត់ត្រាការឧបត្ថម្ភ — កត់ត្រាតាមអ្នកឧបត្ថម្ភម្នាក់ៗ បានច្រើនរូបិយប័ណ្ណ និងមើលសរុបតាមក្រុម
កម្មវិធីបុណ្យតាមថ្ងៃ — បង្ហាញកាលវិភាគពិធីនីមួយៗ តាមថ្ងៃ និងតាមម៉ោង
ផែនទី និងសៀវភៅរំលឹក — Google Map ប៊ូតុងរំលឹកដាក់ក្នុងប្រតិទិន និងកន្លែងឱ្យភ្ញៀវផ្ញើសាររំលែកទុក្ខ
ពីរភាសាក្នុងសេចក្ដីជូនដំណឹងតែមួយ — ខ្មែរ និងអង់គ្លេស
នៅដំណើរការជារៀងរហូត — បង់តែម្ដងគត់ គ្មានថ្ងៃផុតកំណត់
```

---

## What changed, and why

The previous lists were written before roughly a year of shipping and named none of it.
Everything added is a feature that is in the product today; each was checked against the
code before it was written down.

| New claim | Where it lives |
| --- | --- |
| A personal link per guest, name in the link preview | `EventGuest.short_url` / `showcase_link`, per-language copy in [GuestListItem.vue](../../src/components/invitation/GuestListItem.vue) |
| Knowing who opened their invitation | `invitation_status`: `not_sent` → `sent` → `viewed` |
| Sharing the guest list with someone who has no account | [guest-share.service.ts](../../src/services/api/modules/guest-share.service.ts) — view/edit, expiry, revoke, open count |
| RSVP with plus-ones, a private note, and custom questions | [GuestRSVPSection.vue](../../src/components/showcase/GuestRSVPSection.vue), [RsvpQuestionsSection.vue](../../src/components/invitation/RsvpQuestionsSection.vue) |
| Table seating, and the guest seeing their own table | [SeatingTablesView.vue](../../src/components/invitation/SeatingTablesView.vue) + the seat ticket in `GuestRSVPSection` |
| Analytics: response rate, who to chase, question results, gifts by group | [RsvpAnalytics.vue](../../src/components/invitation/RsvpAnalytics.vue), [CashGiftAnalytics.vue](../../src/components/invitation/CashGiftAnalytics.vue) |
| Both languages in one invitation, guest picks | event texts per language + the showcase language switch |
| A film that plays as the card opens (Standard) | `event_video`; the upload slot is gated on a `standard` package plan in [MediaUploadsSection.vue](../../src/components/MediaUploadsSection.vue) |

Two older claims were **kept as written**, because they are commercial promises rather than
code paths: *Dedicated Designer Support 24/7* and *Fully Custom Animation Template*.

### "Extra Services Access" became "Support when you need it"

The old wording was read here as access to the vendor marketplace, which is what the
phrase sounds like. It is not: it means **the team helping a customer who is stuck**. The
bullet now says so plainly, and it stays on both Standard and Premium because it is the
same promise on both — Premium's extra is the dedicated designer, which is its own line.

### Analytics: one feature sold as two

`Basic Analytic` (Standard) and `Advance Analytic` (Premium) are sold as different things
and are the same thing in the product. [EventAnalyticsTab.vue](../../src/components/EventAnalyticsTab.vue)
gates on whether the event's template is *activated*, not on which plan activated it — so a
**Basic Plus** event reaches the identical Analytics tab as well. Three tiers, one feature.

So the copy above names analytics once, on Standard, and Premium claims none of its own.
Restoring a Premium line needs two things, in this order:

1. The backend gating the tab by plan tier — request 5 of
   [pricing-plan-i18n.md](../backend-api-requirements/pricing-plan-i18n.md).
2. The agreed Premium-only additions shipping: **sharing an analytics view** and
   **exporting** it.

When both are true, this is the bullet to add back to Premium:

```
Share and export your analytics — send a read-only view to whoever needs it, or export the responses as a spreadsheet
ចែករំលែក និងនាំចេញស្ថិតិ — ផ្ញើតំណមើលស្ថិតិឱ្យអ្នកដែលត្រូវការ ឬនាំចេញចម្លើយទាំងអស់ជាឯកសារតារាង
```

## Known content bug

`Basic Plus Funeral` has an empty `description`, and the card footer falls through to a
hardcoded **wedding** demo link — so a funeral customer is sent to a wedding invitation.
The frontend cannot fix this without somewhere to put a real per-plan demo URL; that is
request 3 of [pricing-plan-i18n.md](../backend-api-requirements/pricing-plan-i18n.md).
Until then, either supply a funeral demo event id or the footer line should be hidden for
that plan.

## Keeping the fallback in step

[pricingFallback.ts](../../src/constants/pricingFallback.ts) holds the Khmer copy. It is
what the landing page renders when `/api/core-data/pricing-plans/` cannot be reached —
previously a verbatim copy of another company's chat-subscription tiers, which is the bug
that file exists to prevent. **When a plan is edited in Admin, update that file too**, or
the fallback slowly starts advertising a price nobody sells.
