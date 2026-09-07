# Backend API Requirements: Public read on the credit-pack catalogue

> **Status: DELIVERED — 2026-08-30.** Kept as the record of what was asked for
> and what shipped; there is nothing left to do here. The live contract is the
> backend's own `PARTNER_CREDIT_API_DOCS.md` §2.

## What was asked for

Let an **unauthenticated** request read the credit-pack catalogue, so the public
partner page could quote real wholesale prices instead of numbers copied into a
locale file.

`/partners` ([PartnerProgramView.vue](../../src/views/PartnerProgramView.vue)) is
a public sales page — a link a salesperson sends to a shop owner, or opens in a
meeting instead of a slide deck. Its entire audience is people who are **not**
partners and usually not signed in at all. Yet:

```
GET /api/payment/credit-packs/        (anonymous)  → 401
GET /api/core-data/pricing-plans/     (anonymous)  → 200
```

So the one page whose job was to quote wholesale prices to prospects was the one
page that could not read them. The prices were authored by hand in
`partners.json`, which made every price change a code change in two locale files
and any drift silent — the prospect quoted one number and charged another.

## What shipped

| Method | Path | Auth |
| --- | --- | --- |
| `GET` | `/api/payment/credit-packs/` | **none** |
| `GET` | `/api/payment/credit-packs/{id}/` | **none** (non-public packs `404`) |

Every other endpoint under `/api/payment/` kept its gate. Two fields came with
it, and they answer different questions:

- **`is_public`** — whether the pack is part of the public offer. Ships **on**.
  An anonymous response is all-public by definition; a partner or staff member
  also receives packs flagged `false` (bespoke or negotiated rates). This is the
  "curated public subset" this document originally proposed as the fallback if
  wholesale pricing had to stay confidential — it landed *alongside* the public
  read rather than instead of it.
- **`is_featured`** — the "most popular" highlight, presentation only. It does
  not filter, price, or reorder anything; position is `display_order`.

Wholesale rates are therefore published. Anyone can read what partners pay,
including customers comparing against retail, and competitors. That was the
business call this document asked for, and it was answered yes.

## …and the frontend then stopped using it that way (Sept 2026)

**The public rail is gone.** `/partners` no longer prints a price of any kind,
and `usePartnerPricingTiers.ts` was deleted with it. Nothing about the endpoint
changed and nothing here is retracted: the business call above stands, and the
catalogue is still public for any caller that wants it. What changed is who we
point at it. A wholesale rate on a page built to be *opened by a stranger* is a
rate the partner's own customer can read before walking into the shop, and the
margin we printed beside it — "$825–1,450 if you sell all 25 at $60–85" — is
that partner's markup shown to the person paying it. Publishing our own
wholesale is our call to make; publishing the partner's retail markup is not.

So the ladder moved behind `is_partner`, to the credits page
([CreditsTab.vue](../../src/components/settings/CreditsTab.vue)), which is now
the only surface that prints partner pricing — and it inherited the margin maths
the rail used to carry, per pack card: what the partner keeps per event and what
the whole pack is worth sold through. §3 of `/partners` argues the offer with no
figure at all (two free events, no monthly fee, your price) and links to
`/credits`, where the router already handles the signed-out prospect.

The rest of this section describes the rail as it was, and is kept because
`is_public` / `is_featured` / `display_order` still work exactly as documented —
the credits catalogue reads all three.

## What the frontend used to do with it

`usePartnerPricingTiers.ts` (deleted) built one rail:

- **Two lead cards, always** — the free trial and pay-as-you-go, authored in
  `partners.pricing.tiers`. Pay-as-you-go is the `partner_rate` funding option
  (a percentage of the plan price), not a catalogue row, so it has nothing to
  read. The trial has a card either way, and takes its credit count and margin
  from the catalogue's free pack when there is one.
- **Then the public packs** — `is_public` and priceable (a pack with no plan
  attached has no retail price to measure a margin from, and is unorderable
  anyway), each naming the plans its credits cover — two packs can be the same
  size at the same price and still be different products ("25 Basic" and "25
  Basic Plus" are), so the card says which. Ordered by `display_order`; the first `is_featured` pack takes the
  dark card and the "most shops start here" line; "lowest rate" is measured from
  `price_per_credit` rather than assumed from position.

The fetch is a plain `onMounted` — no auth to wait for, no `403` to branch on.
`apiClient.get` attaches a token when the browser has one, which is what widens
the response for a signed-in partner; those extra `is_public: false` packs are
then filtered out here on purpose, because this page is the public offer and
should read the same to whoever opens it.

The authored wholesale ladder is **gone** from the locale files: `tiers.shop`
and `tiers.volume` keep only their `badge` strings, which label live packs. So
an empty or unreachable catalogue renders the two lead cards and stops — never a
stale price.

## Superseded ask

This document also asked for a stable `tier` (or `slug`) on the pricing plan,
because the page narrowed the catalogue to "the Basic packs" by matching the
plan name against `/basic/i`, and a plan renamed in the admin silently emptied
the section. `is_public` + `display_order` replaced that outright and are the
better answer: what belongs on the offer page is an editorial call, not a
consequence of a plan's tier. The regex is gone; no plan slug is needed.
