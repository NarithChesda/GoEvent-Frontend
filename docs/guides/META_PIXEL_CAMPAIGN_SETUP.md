# Meta Pixel Setup for the Partner Campaign

**For:** whoever sets up the Meta (Facebook/Instagram) side of the partner campaign.
**Status as of 2026-09-18:** the website code is finished but not live yet (see [Status](#status)).

## What the campaign is and what it counts

The campaign recruits **shop partners**: wedding shops, print shops, photo studios and
event planners, who buy invitation credits wholesale. The conversion is **a partner
application** at `https://goevent.online/partners/apply`.

Two systems record each application, and they do different jobs:

| System | What it's for | Trust it for |
| --- | --- | --- |
| **Our database** | Every application records the campaign, ad set and ad that brought the applicant | Cost per lead and cost per approved partner. This is the source of truth |
| **Meta** (pixel + Conversions API) | Tells Meta a lead happened, so it can optimise delivery | Optimising ads only. Meta's numbers are modelled and windowed, so don't reconcile them with our row count |

## Status

| Piece | State |
| --- | --- |
| Website: campaign tracking, pixel, browser `Lead` event, privacy policy | Built and pushed to `main`. **Not deployed to production yet.** A developer deploys it by merging `main` into `clean-production` |
| Website: pixel switched on | **Off** until the dataset ID is set in Cloudflare Pages and the site is rebuilt (step 2 below) |
| Backend: server-side `Lead` and `PartnerApproved` (Conversions API), saving campaign data on each application | Built, **not deployed yet** |

**Until the backend is deployed, Meta receives page views only, with no `Lead`
events.** The browser sends its `Lead` only after the server confirms the application
was saved and hands back the event details. Don't launch a campaign that optimises for
`Lead` until a test application shows a `Lead` in Events Manager
(see [Testing](#testing-before-launch)).

The website is safe to deploy before the backend.

## Events Meta will receive

| Event | When | Sent from | Details sent with it |
| --- | --- | --- | --- |
| `PageView` | A visitor opens a marketing page (list below) | Browser | — |
| `Lead` | A partner application is saved | Browser **and** server, with the same event ID, so Meta counts it once | `content_name: partner_application`, `content_category`, `expected_monthly_events` |
| `PartnerApproved` (custom) | Our staff approve the application | Server only (`system_generated`) | Same as `Lead` |

**Pages that send `PageView`:** `/home`, `/about`, `/partners`, `/partners/templates`,
`/partners/apply`, and the sign-in page, except when it's sending someone back to a
page outside the partner programme. Nothing else: never invitations, event pages or anything showing a guest's details.
Invitation links carry guests' names, and that data must never reach Meta. Don't ask
for more pages to be added.

A `Lead` can also come from the `/credits` page, where a signed-in user can apply
too. Only the `Lead` fires there, not a `PageView`.

**`content_category`** is the applicant's business type (omitted when they didn't say):

| Value | Meaning |
| --- | --- |
| `wedding_shop` | Wedding shop |
| `print_shop` | Printing shop |
| `photo_video` | Photo or video studio |
| `event_planner` | Event planner |
| `decoration` | Decoration or venue |
| `other` | Something else |

**`expected_monthly_events`** is their expected volume (omitted when they didn't say):
`1_5`, `6_20`, `21_50`, `50_plus`.

On `Lead`, the server also sends hashed matching data: email (skipped for accounts
created through Telegram), phone, name, account ID, IP address, browser, and the
pixel's `_fbp`/`_fbc` cookies. Nothing about events, guests, invitations or payments is
sent.

## Setup steps

### 1. Create or choose the dataset (pixel)

In **Events Manager**, create a dataset for `goevent.online`, or pick the existing one.
You'll need its **dataset ID** (the pixel ID).

### 2. Send the dataset ID to the developers

- **Frontend developer:** sets `VITE_META_PIXEL_ID` in the Cloudflare Pages project
  (production environment), then **triggers a new deployment**. The ID is built into
  the site, so changing the variable does nothing until the next build.
- **Backend owner:** sets `META_PIXEL_ID` on the server.

The dataset ID is not a secret; it's visible in every page that loads the pixel.

### 3. Generate a Conversions API access token

Events Manager → the dataset → **Settings** → **Conversions API** → **Generate access
token**.

**This token is a secret.** Send it privately to the backend owner only, who sets it as
`META_CAPI_ACCESS_TOKEN` on the server. It must never go into Cloudflare Pages or any
`VITE_*` variable, because anything there is published in the website's code. The
server sends nothing to Meta until both `META_PIXEL_ID` and `META_CAPI_ACCESS_TOKEN`
are set.

### 4. Events Manager settings to leave alone

- **Don't add events with Meta's Event Setup Tool, Google Tag Manager, or any other tag
  or plugin.** Every event comes from the site's code, and the code turns Meta's
  automatic event detection off on purpose.
- **Keep "Automatic advanced matching" off.** Our privacy policy describes matching
  data sent from our server only. If you want it on, the privacy policy has to be
  updated first.
- **Verify the `goevent.online` domain** in Business Settings, if it isn't already.

### 5. Ad URL parameters

In Ads Manager, give every ad these **URL parameters** (ad level → Tracking → URL
parameters), so each click records exactly which ad it came from:

```
utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&fb_campaign_id={{campaign.id}}&fb_adset_id={{adset.id}}&fb_ad_id={{ad.id}}&fb_placement={{placement}}
```

- **Report on the IDs, not the names.** Names get renamed and URL-encoded; IDs don't.
- **Landing page:** `https://goevent.online/partners`. It opens in Khmer. `/partners/templates`
  (the design catalogue) and `/partners/apply` (the form) also work as landing pages.
  Don't send ads anywhere else: other pages don't report a `PageView`.
- The site keeps the first campaign that brought a browser for 90 days, so a shop owner
  who clicks on Monday and applies on Thursday is still credited to the ad. This works
  **per browser**: someone who clicks on their phone and applies on a laptop is
  recorded as organic, so expect a slight undercount, never an overcount.

### 6. Conversions to optimise and report on

- **Optimise delivery for `Lead`** (website).
- **Qualified leads:** create a **Custom Conversion** on `Lead` where `content_category`
  is one of the shop types worth paying for (e.g. `wedding_shop`, `print_shop`). The
  rule can then change in Events Manager without any code deploy.
- **`PartnerApproved`** is the strongest quality signal, because a reviewer judged the
  shop. Use it for **reporting and as a lookalike seed**, not for optimisation: there
  will be too few approvals, and Meta only credits one to an ad if the approval happens
  inside the ad's click window (7 days by default). A slow review queue loses credit.

### 7. Privacy policy URL

Wherever Meta asks for a privacy policy (ad account, lead forms, business verification),
use **`https://goevent.online/privacy`**. It describes the pixel, the Conversions API and
what is sent. It goes live with the website deployment.

## Testing before launch

Do these after both the website and the backend are deployed, and before spending
money.

**Every test creates a real partner application** that our staff will see. Tell them
it's a test so they reject it. An account can have only one pending application at a
time, so use a **fresh account** for each test.

1. **Campaign tracking (no pixel needed).**
   Open
   `https://goevent.online/partners?utm_source=facebook&utm_medium=paid&utm_campaign=test&fb_ad_id=123&fbclid=testclick`,
   go on to the application form, fill it in, and sign in with a fresh account when
   asked (the application sends itself after sign-in). Staff should then see the
   application at `https://goevent.online/admin/partner-requests` with
   **Source: `facebook / paid · test · ad 123`**.

2. **Pixel.** Install the **Meta Pixel Helper** browser extension, then repeat test 1.
   Expect:
   - a `PageView` on `/partners` and another on `/partners/apply`;
   - one `Lead` after submitting, whose event ID equals the new application's ID.

   Then open any event invitation link and check the browser's **Network** tab, not
   just the extension: there must be **no requests to facebook.com or
   facebook.net at all**.

3. **Deduplication.**
   - In Events Manager → **Test Events**, copy the test code and give it to the backend
     owner, who sets it as `META_CAPI_TEST_EVENT_CODE` on the server.
   - Open the site from the **Test browser events** box on that tab.
   - Submit one more test application. Expect **two `Lead` rows, one browser and one
     server, with the same event ID, marked deduplicated**.
   - **Ask the backend owner to clear the test code afterwards.** While it's set, real
     applications go to the Test Events tab and count toward no ad.

## Reading results

- **Our numbers:** the staff dashboard at `/admin/partner-requests` shows each
  application's business type and source. Django admin has the full campaign fields and
  filters by business type, `utm_source` and `utm_campaign`.
- **Meta's numbers:** use them to steer the campaign, not to count applications.

## Don'ts

- Don't install the pixel any other way (theme code, Tag Manager, a plugin). It's
  already in the site and loads only where it's allowed.
- Don't ask for the pixel on invitation or event pages, for any reason.
- Don't optimise for `PageView`.
- Don't send the Conversions API access token anywhere but the backend owner.
- Don't leave the test event code set after testing.

## Who does what

| Task | Who |
| --- | --- |
| Dataset ID, access token, test code, ads and URL parameters, custom conversions | Marketing |
| Set `VITE_META_PIXEL_ID` in Cloudflare Pages and deploy the website | Frontend developer |
| Deploy the backend; set `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`, and set then clear `META_CAPI_TEST_EVENT_CODE` | Backend owner |
| Reject test applications; review real ones promptly (approval must land inside the click window to be credited) | Staff reviewers |

Technical background, for developers: `FRONTEND_PARTNER_LEAD_TRACKING_GUIDE.md` and
`PARTNER_ACCESS_REQUEST_API_DOCS.md` ("Lead tracking") in the backend repo; in this repo,
[src/utils/metaPixel.ts](../../src/utils/metaPixel.ts) and
[src/utils/attribution.ts](../../src/utils/attribution.ts).
