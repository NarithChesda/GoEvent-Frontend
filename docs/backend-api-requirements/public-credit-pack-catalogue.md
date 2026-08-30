# Backend API Requirements: Public read on the credit-pack catalogue

> **Status: PENDING** — the frontend is built and shipped against this contract.
> It degrades safely without it (see [What the frontend does meanwhile](#what-the-frontend-does-meanwhile)),
> so this can land whenever the backend team is ready; nothing needs to be
> un-picked on the frontend afterwards.

## The ask, in one line

Let an **unauthenticated** request read the credit-pack catalogue, so the public
partner page can quote real wholesale prices instead of numbers copied into a
locale file.

| Method | Path | Auth today | Auth wanted |
| --- | --- | --- | --- |
| `GET` | `/api/payment/credit-packs/` | JWT + `is_partner` | none |
| `GET` | `/api/payment/credit-packs/{id}/` | JWT + `is_partner` | none |

Every **other** endpoint under `/api/payment/` keeps its current gate. This is a
read of a price list, not of anybody's balance, orders or codes.

## Why

`/partners` ([PartnerProgramView.vue](../../src/views/PartnerProgramView.vue)) is
a public sales page — a link a salesperson sends to a shop owner, or opens in a
meeting instead of a slide deck. Its entire audience is people who are **not**
partners and usually not signed in at all.

Verified against the running backend on 2026-08-30:

```
GET /api/payment/credit-packs/        (anonymous)  → 401
GET /api/core-data/pricing-plans/     (anonymous)  → 200
```

So the one page whose job is to quote wholesale prices to prospects is the one
page that cannot read them. The prices are currently authored by hand in
`partners.json`, which means every price change is a code change in two locale
files, and any drift between the page and the real catalogue is silent — the
prospect is quoted one number and charged another.

Note the asymmetry that already exists: **retail** prices are public
(`pricing-plans` answers 200 to anyone, which is correct — it is what a normal
customer pays). Only the wholesale side is closed.

## Is wholesale pricing confidential?

This is the question to settle, and it is a business call rather than a
technical one. Two observations:

1. The page **already publishes these numbers**, as authored copy. Whatever
   confidentiality the 401 was protecting is not being protected today; it is
   only making the published figures harder to keep correct.
2. If wholesale pricing genuinely must stay behind approval, the alternative
   ask is a **curated public subset** rather than the full catalogue — e.g. a
   `GET /api/payment/credit-packs/public/` returning only packs flagged
   `is_publicly_listed`, so staff choose what appears on the marketing page and
   the negotiated or partner-specific packs stay hidden. That shape works
   equally well for the frontend; it reads whichever endpoint is available and
   needs no other change.

Either answer is fine. What does not work is the current state, where the page
publishes hand-copied numbers that nothing keeps in sync.

## Fields the page actually reads

Already all present on `CreditPack` — no serializer additions are needed for the
full-catalogue option:

| Field | Used for |
| --- | --- |
| `id` | list key |
| `name` | card title |
| `description` | the sentence under the card (may be empty) |
| `price` | "Pay up front" |
| `credit_count` | "N invitations", and the sort order |
| `price_per_credit` | the display figure — cost per invitation |
| `applicable_plan_details[].price` | "Retail per event", as a min–max range |
| `pricing_plan_name`, `applicable_plan_names` | narrowing to the Basic plan |
| `requires_approval` | filtering the trial pack out of a wholesale pitch |
| `pricing_plan_price` | fallback when `applicable_plan_details` is absent |

A public response should **omit** nothing from this list but is free to drop
anything else (`discount_*`, `once_per_vendor`, `validity_days`, …) — the page
does not read them.

## One field that would help separately

Narrowing the catalogue to "the Basic packs" is done on the frontend by matching
the plan **name** against `/basic/i`
([usePartnerPricingTiers.ts](../../src/composables/usePartnerPricingTiers.ts)),
because that is the only signal the serializer offers. A plan renamed in the
admin silently empties the section.

A stable `tier` (or `slug`) on the pricing plan — `basic` | `standard` |
`premium`, independent of the display name — would make that filter exact. This
is worth doing whether or not the catalogue goes public, and is independent of
everything above.

## What the frontend does meanwhile

`usePartnerPricingTiers()` resolves one tier list from two sources:

- **Live** — when `getPacks()` returns packs, the cards are built from them:
  real names, real per-credit cost, real pack totals, retail read from each
  pack's own plans, and the margin computed rather than typed.
- **Authored** — on 401, 403, a network failure, an empty catalogue, or no
  matching Basic packs, the cards fall back to `partners.pricing.tiers` in the
  locale files. The section always renders; it is never blank and never errors.

The fetch waits on `isAuthenticated`, so an anonymous visitor makes no request
and sees the authored copy with no skeleton and no flash. In practice that means
**live numbers for signed-in partners, authored numbers for everyone else**,
which is exactly backwards from what the page needs — hence this document.

When the endpoint opens up, the change on the frontend is one line: replace the
auth watcher at the bottom of the composable with `onMounted(load)`. Nothing
else moves. The authored copy stays as the offline/failure fallback.

The pay-as-you-go tier stays authored either way — it is the `partner_rate`
funding option (a percentage of the plan price), not a catalogue row, so there
is nothing for it to read here.
