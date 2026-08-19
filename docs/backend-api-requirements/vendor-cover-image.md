# Backend API Requirements: Vendor Cover Image in the Brief Serializer

> **Status: DELIVERED (2026-08-19)** — `cover_image` is now returned by the
> vendor brief serializer. Verified against the local backend: the field is
> present on `GET /api/services/vendor-profiles/`, the frontend maps it on both
> the spotlight and the storefront, a relative `/media/...` path resolves
> correctly, and the per-vendor listing lookups the spotlight used to fire drop
> from six to zero for vendors that have a cover.
>
> **One thing still unverified:** no vendor in the local database has a cover
> uploaded, so every response is `"cover_image": null` and the render path was
> confirmed with an injected value rather than a real file. Uploading a cover
> through Settings → Vendor and loading `/services` closes that gap — see
> [Confirming it end to end](#confirming-it-end-to-end) below.

## The ask, in one line

Add `cover_image` to the vendor **brief** serializer, the one behind
`GET /api/services/vendor-profiles/`.

```diff
  {
    "id": "uuid",
    "business_name": "Elite Photography",
    "slug": "elite-photography",
    "short_tagline": "Capturing your special moments",
    "logo": "/media/vendor_logos/logo.webp",
+   "cover_image": "/media/vendor_covers/cover.webp",
    "city": "New York",
    "country": "USA",
    "telegram_link": "https://t.me/elitephoto",
    "verification_status": "verified",
    "listings_count": 5
  }
```

Same shape as `logo`: a media path or `null`. Nullable, read-only here, no
default, no backfill.

## Why this matters

`cover_image` is already a real field. It is on the model, it is in the detail
serializer ([SERVICES_API_DOCS.md](../backend-api/SERVICES_API_DOCS.md) §
Create Vendor Profile), and vendors can already upload one through
`PATCH /api/services/vendor-profile/me/` — the frontend has had an uploader for
it in Settings → Vendor for some time
([VendorProfileForm.vue](../../src/components/settings/VendorProfileForm.vue)).

Until now the uploaded image went nowhere. Every public surface that shows a
vendor large — the featured-vendor spotlight on the services page
([VendorSpotlight.vue](../../src/components/services/VendorSpotlight.vue)) and
the vendor storefront banner
([VendorStorefrontView.vue](../../src/views/VendorStorefrontView.vue)) — was
backfilling a backdrop out of the vendor's **listing cover photos** instead,
because that was the only imagery the API offered.

That substitution has three costs:

1. **Wrong crop.** A listing cover is authored at `aspect-[1.9/1]` to sit in a
   card ([ServiceCard.vue](../../src/components/services/ServiceCard.vue)). The
   spotlight band is roughly 4.7:1 on a desktop viewport. Squeezing one into
   the other slices the subject — heads and products get cut off.
2. **No say in it.** The vendor does not choose which photo represents them.
   Whichever listing the browse endpoint happens to return first becomes their
   billboard.
3. **Up to six extra requests per page load.** Because the brief carries no
   image, the services page has to fire one `browseListings` call *per featured
   vendor* purely to find a backdrop
   ([useServices.ts](../../src/composables/useServices.ts), `hydrateSpotlightImages`).

The frontend now prefers `cover_image` wherever it is available and skips the
listing lookup entirely for any vendor that has one. On the storefront that
already works today, because the detail endpoint returns the field. On the
services page it cannot, because the brief does not — so the spotlight is still
paying all three costs above for every vendor, including ones who have already
uploaded a perfectly good banner.

## What the frontend does with it

Priority is the same on both surfaces:

| Order | Source | Where it comes from |
|-------|--------|---------------------|
| 1 | `cover_image` | The vendor's own upload — used as-is, on its own |
| 2 | Photos from their services | Borrowed, rotating, only when there is no cover |
| 3 | Designed brand cover | Neither of the above |

Tier 3 is a shared component
([VendorCoverArt.vue](../../src/components/services/VendorCoverArt.vue)) — a
brand-gradient mesh carrying the vendor's initial as an oversized watermark, so
a vendor with nothing uploaded still gets a header that looks made rather than
missing. That is also where a `cover_image` that fails to load ends up, which
is acceptable: a 404 on a vendor's own upload is a broken asset, not an
expected condition.

`cover_image` is additionally used as the Open Graph image when a storefront is
shared, in place of the round logo, which crops badly in a share card.

## Notes for the implementation

- **Do not crop or re-frame server-side.** The frontend applies a width-only
  ImageKit transform (`w-1200`) precisely so the vendor's framing survives; a
  server-side fixed-ratio crop would defeat that. The existing max-5MB /
  auto-WebP pipeline is all the processing needed.
- **Return the same path shape as `logo`** (`/media/...`). The frontend runs it
  through `apiClient.getProfilePictureUrl()`, the same resolver it uses for
  logos, so anything `logo` accepts works unchanged.
- **Verified-only listing is fine.** The endpoint already filters to verified
  vendors; no extra visibility rules are needed for this field.

### Recommended guidance to vendors

The uploader hint currently says **1200×400** (3:1), which is right. Worth
knowing when reviewing uploads: that source is displayed into frames ranging
from about 1.8:1 (spotlight band on a narrow phone) to about 4.7:1 (same band
on a wide desktop), always `object-cover` and centred. Keeping the subject away
from the top and bottom edges is the practical advice. 1600×600 is a good
retina-safe upload size.

## Confirming it end to end

The contract is verified; what is left is one real file round-tripping through
storage. Upload a cover under Settings → Vendor for a vendor that is
`is_featured`, then:

1. `GET /api/services/vendor-profiles/` should show that vendor's
   `cover_image` as a `/media/...` path rather than `null`.
2. `/services` should use it as that vendor's spotlight backdrop, and fire no
   `listings/browse/?vendor=…` request for them.
3. `/services/vendors/<id>` should show it as a single, non-rotating banner.

If step 1 shows a path but 2 and 3 do not follow, the shape is wrong rather
than the field — compare it against how `logo` is serialized on the same
object, which is what the frontend's resolver expects.

## Optional follow-up, not part of this ask

The vendor **portfolio** carousel on the storefront has the same underlying
problem one level down: there is no portfolio field, so it is aggregated from
listing covers plus gallery media, costing one browse request plus up to four
listing-detail requests per storefront view
([useServices.ts](../../src/composables/useServices.ts), `fetchVendorPortfolio`).
A dedicated portfolio relation on the vendor model would collapse that to zero
extra requests and give vendors control over ordering. Worth doing eventually;
it is a real schema change and independent of the one-line fix above.
