# Pricing plans in two languages

**Status:** requested, not implemented. The frontend ships single-language today and will
keep working unchanged until these fields land.

## What is wrong now

`PricingPlan` is the record behind the public landing page's pricing cards and the plan
summary on every in-app template card. It carries:

```python
name        = CharField()        # "Basic Plus", "Standard", "Premium"
description = TextField()        # NOT a description — see below
features    = JSONField()        # list[str]
price       = DecimalField()
```

Three separate problems, which is why this asks for a restructure rather than one more
column:

1. **No language variant anywhere.** The audience is Cambodian and the app is bilingual
   (`en` / `kh`, see [src/i18n/](../../src/i18n/)), but a plan has exactly one `name`, one
   `description` and one `features` list. Whichever language they are written in, half the
   audience reads the wrong one. Today they are Khmer, so an English visitor reads Khmer
   bullets under an English headline.

2. **`description` is not a description.** It currently holds a demo-invitation URL, which
   [PricingSection.vue](../../src/components/PricingSection.vue) renders as the card's
   "Try our demo" link. There is nowhere to put an actual sentence about the plan, and the
   field's name actively misleads anyone reading the model.

3. **A feature is really two strings, stored as one.** Each bullet has a short title and a
   sentence explaining it. Seven frontend surfaces render this array and five of them have
   room for the title only (two truncate to the first 2 or 4 entries), so the frontend
   currently packs both halves into one string separated by a spaced em dash and splits it
   client-side — see [planFeatures.ts](../../src/utils/planFeatures.ts). That works, but it
   makes a translator's job ambiguous and cannot survive a language whose punctuation
   conventions differ.

Translating in place would lock all three in.

## What is asked for

### 1. `PricingPlanFeature` — features become rows, not strings

```python
class PricingPlanFeature(models.Model):
    plan        = FK(PricingPlan, related_name='features')
    order       = PositiveIntegerField(default=0)
    is_active   = BooleanField(default=True)

    class Meta:
        ordering = ['order', 'id']


class PricingPlanFeatureTranslation(models.Model):
    feature     = FK(PricingPlanFeature, related_name='translations')
    language    = CharField(choices=[('en', 'English'), ('kh', 'Khmer')])
    title       = CharField(max_length=120)   # required
    description = TextField(blank=True)       # optional

    class Meta:
        unique_together = [('feature', 'language')]
```

Two levels, not one flat table with a `language` column on the feature itself, because the
**ordering and the identity of a feature are language-independent**: bullet 3 is bullet 3
in both languages, and a missing Khmer translation should leave a gap in one language, not
renumber the list. This mirrors how the codebase already models per-language content —
`EventText` rows per language, `EventTemplateLanguageFont` rows per language.

`title` and `description` as separate columns is what retires the em-dash convention.

### 2. Plan name and description

```python
class PricingPlanTranslation(models.Model):
    plan        = FK(PricingPlan, related_name='translations')
    language    = CharField(choices=[('en', 'English'), ('kh', 'Khmer')])
    name        = CharField(max_length=80)
    description = TextField(blank=True)   # a real description, at last

    class Meta:
        unique_together = [('plan', 'language')]
```

Leaving the plan *names* in Latin in both rows ("Basic Plus", "Standard", "Premium") is a
perfectly good answer — they read as product names to a Khmer speaker. The field exists so
that it is a **choice** rather than a constraint.

### 3. `demo_url` — free `description` from the job it is doing

```python
demo_url = URLField(blank=True)   # on PricingPlan
```

Migrate the current `description` value into it. One plan (`Basic Plus Funeral`) has an
empty one and currently falls through to a hardcoded **wedding** demo link on the card,
which is a bug the frontend cannot fix without this field existing.

### 4. Serializer shape

Accept `?lang=` on `GET /api/core-data/pricing-plans/` and return the resolved language
flat, so the public page does no merging:

```json
{
  "id": 1,
  "name": "Basic Plus",
  "description": "…",
  "demo_url": "https://…",
  "price": "85.00",
  "is_best_seller": false,
  "category": { "id": 1, "name": "Wedding", … },
  "features": [
    { "title": "…", "description": "…" },
    { "title": "…", "description": "" }
  ]
}
```

- **Default `lang` to `en`** and fall back per-string to `en` when a `kh` translation is
  missing, matching how vue-i18n treats `en` as `FALLBACK_LOCALE`. A missing translation
  must never render an empty bullet or a raw key.
- **Which language the frontend asks for** is the reader's resolved locale: their account
  preference when signed in, their device's otherwise — see
  [account-language-preference.md](account-language-preference.md). The public landing page
  has no account to read, so it sends the device locale, which is the right answer there.
- Keep the endpoint **public** — it is read without a token today and the landing page
  depends on that.
- **Keep `features` a `list[str]` when `?lang=` is absent**, joining `title` and
  `description` with ` — `. That is exactly what the field holds now, so every existing
  caller keeps working and the frontend can adopt the new shape when convenient rather than
  in the same deploy.

## Also needed, and separate: gate analytics by plan

Not an i18n change, but it is what the copy is blocked on.

`Basic Analytic` (Standard) and `Advance Analytic` (Premium) are sold as different things
and are **the same thing** in the product: [EventAnalyticsTab.vue](../../src/components/EventAnalyticsTab.vue)
gates on whether the event's template is *activated*, not on which plan it was activated
with — so a Basic Plus event reaches the identical Analytics tab too. Three tiers, one
feature.

Until the backend says which plan an event's analytics belong to, the frontend cannot
present a tier difference honestly, so
[PRICING_PLAN_FEATURES.md](../guides/PRICING_PLAN_FEATURES.md) currently lists analytics
once and Premium claims no analytics of its own.

What would make the sold distinction real:

- Expose the plan tier on the event's analytics permission, so the tab can show the basic
  set and withhold the rest.
- The agreed Premium-only additions are **sharing an analytics view** and **exporting**
  (CSV / spreadsheet). Once those exist, Premium gets its bullet back — the wording is
  already drafted in the guide.

## Frontend work once this lands

Small, and none of it blocking:

- [PricingSection.vue](../../src/components/PricingSection.vue) passes `?lang=` from
  `useAppLanguage()` and reads `feature.title` / `feature.description` directly.
- [planFeatures.ts](../../src/utils/planFeatures.ts) and its spec are deleted, along with
  the seven `planFeatureTitle(...)` call sites — the compact template cards read
  `feature.title`.
- [pricingFallback.ts](../../src/constants/pricingFallback.ts) carries both languages.
- The card footer renders `demo_url` and hides the "Try our demo" line when it is empty.
