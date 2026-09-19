# Cloudflare setup for SEO — goevent.online

For whoever manages the goevent.online Cloudflare account. This covers what the
SEO release (September 2026) needs from the dashboard, what it does not need,
and how to check it is working. How the code works is in
[CLAUDE.md → SEO](../../CLAUDE.md) and the backend's `SEO_API_DOCS.md`.

## Summary

| | Needs you? |
|---|---|
| Build and deploy settings | **No.** Unchanged. Pages picks up the new `functions/` folder by itself. |
| Environment variables | **No.** `VITE_API_BASE_URL` is already set, and the Functions now read it too. |
| Google Search Console: verify the domain, submit the sitemap | **Yes**, once (§2). |
| Redirect `goevent-frontend.pages.dev` to goevent.online | **Recommended** (§3). |
| Managed robots.txt / AI crawl settings | **Check** (§4). |
| Cache rules, bot settings | **Don't change** without reading §5. |

**Status (checked on production, 2026-09-19, deployment of `clean-production` @ `3e2bd0ff`):**
- Routes return 200, unknown paths 404, and `robots.txt` and `sitemap.xml` are live.
- Event pages carry their own title, canonical URL and Event data; private events are `noindex`.
- Assets cache for a year.
- **§2 and §3 are still to do.**

---

## 1. What deploys automatically (no action)

Pushing `clean-production` builds with the existing settings:

| Setting | Value |
|---|---|
| Build command | `npm run build-cloudflare` |
| Build output directory | `dist` |
| Root directory | `/` (repo root). **This must stay the root**, because Pages only finds `functions/` there. |

From that build, Pages uses:

- **`functions/`** — three Pages Functions:
  - `/events/<uuid>`: fetches the event's SEO data from the API and writes the event's own title, description, preview image and Google Event data into the page.
  - `/services/vendors/<uuid>`: the same for a vendor storefront, with Google LocalBusiness data, from `GET /api/public/vendors/<uuid>/seo/`.
  - `/sitemap.xml`: serves the backend's sitemap from goevent.online.

  The build log shows `Found Functions directory at /functions`, and the deployment's **Functions** tab lists all three routes.
- **`_routes.json`** — limits the Functions to those paths. Showcase, manage, checkout and every other page are plain static files and never run a Function.
- **`_redirects`** — the app's routes, each rewritten to the app shell (`/app-shell`). Any other path returns **404**. `/home` answers **301 → `/`** (it was a second homepage), and `/favicon.ico` **301 → `/icon.png`**.
- **Prerendered pages** — `/`, `/explore`, `/services`, `/about`, `/contact`, `/privacy` and the `/partners` pages are static files with their own title, description, canonical and text. `/` also carries Organization and WebSite data.
- **`_headers`** — security headers, one-year browser caching for `/assets/*`, and `X-Robots-Tag: noindex` on `/events` (a signed-in list; signed out it repeats the homepage) and `/signin`.
- **`robots.txt`** — now a real text file.

### Environment variables

Nothing new. The event-page Function reads **`VITE_API_BASE_URL`**, the same variable the app build already uses (production: `https://api.goevent.online`). Pages passes dashboard variables to Functions at runtime as well as at build time. If the variable is missing, the Function falls back to `https://api.goevent.online`.

Do not add a `/api` suffix to it. The Function tolerates one, but the app does not.

### Functions runtime

**Settings → Functions → Runtime**: leave the compatibility date and flags as they are. The code was tested at compatibility date `2024-09-14` with no flags, and needs nothing newer.

### Usage

Each view of `/events/<uuid>` or `/services/vendors/<uuid>`, and each sitemap fetch, counts as one Functions request. On the Workers Free plan the limit is **100,000 requests a day** across the account. Guest invitation traffic (`/events/<id>/showcase`) is excluded and costs nothing. Watch **Workers & Pages → goevent-frontend → Metrics**.

---

## 2. Google Search Console (required, once)

1. Open [Search Console](https://search.google.com/search-console) → **Add property** → **Domain** → enter `goevent.online`.
   A *Domain* property, not *URL prefix*: it covers `goevent.online` and `api.goevent.online` together, and Google verifies it through DNS.
2. Google shows a `TXT` record. Either accept Cloudflare's **automatic verification** when Google offers it, or add the record by hand under **DNS → Records → Add record** (type `TXT`, name `@`, content as given). Then click **Verify**.
3. **Sitemaps** → submit `https://goevent.online/sitemap.xml`.
4. **URL inspection** → `https://goevent.online/` → **Request indexing**. Do the same for two or three event URLs from the sitemap.

Google takes days to weeks to re-crawl. The homepage and event pages previously appeared as "GoEvent" / "My Events", and those listings update as they are re-crawled.

### Link previews already cached

Facebook and Messenger cache a link's preview for about a month. To refresh an event link that was shared before this release, paste it into the [Sharing Debugger](https://developers.facebook.com/tools/debug/) and press **Scrape Again**. Telegram refreshes on its own within a day or so.

---

## 3. Redirect the `pages.dev` address (recommended)

`https://goevent-frontend.pages.dev` serves the whole production site, is not marked `noindex`, and is a full duplicate of goevent.online that Google can index. Event pages name goevent.online as their canonical URL; the other pages do not.

Cloudflare's documented fix is a Bulk Redirect. Use it **on the production hostname only**, so preview deployments keep working:

1. **Account home → Bulk Redirects → Create Bulk Redirect List**. Name: `pages-dev-to-domain`. Content: Redirect.
2. Add a URL redirect:
   - Source URL: `goevent-frontend.pages.dev`
   - Target URL: `https://goevent.online`
   - Status: **301**
   - Parameters: turn on **Preserve query string**, **Subpath matching** and **Preserve path suffix**. Leave **Include subdomains OFF**; it would also redirect every preview deployment (`<hash>.goevent-frontend.pages.dev`).
3. **Create Bulk Redirect Rule** → select that list → **Save and deploy**.
4. Check: `curl -I https://goevent-frontend.pages.dev/explore` → `301` with `location: https://goevent.online/explore`.

`www.goevent.online` currently has no DNS record, so nothing duplicates the site there. If one is ever added, redirect it to the apex the same way.

---

## 4. Managed robots.txt / AI crawl control (check)

`api.goevent.online/robots.txt` is served by Cloudflare's managed robots.txt (the long "content signals" preamble). On goevent.online it is **currently off**: on 2026-09-19 the live file matched the repo's exactly. If it is ever turned on there, Cloudflare **prepends** its text to the repo's `robots.txt`. That is harmless as long as the repo's own lines survive, above all the `Sitemap:` line. After a deploy:

```sh
curl -s https://goevent.online/robots.txt
```

It must contain `Sitemap: https://goevent.online/sitemap.xml`, and nothing in it may disallow `/` for `User-agent: *` or for `Googlebot`.

The feature is under **Security → Bots** (in newer dashboards, **AI Crawl Control**). Blocking AI *training* crawlers is fine; search crawlers must stay allowed.

---

## 5. Settings that would break this (don't change without care)

- **No "Cache Everything" cache rule for HTML on goevent.online.** HTML is deliberately `no-store`: it names the current build's fingerprinted JS files, and a cached copy from a previous deploy loads chunks that no longer exist. The event and vendor Functions cache their own API answers in the zone's edge cache (fresh for 5 minutes, then served stale for up to a day while they refresh in the background, under `/__edge-seo/…`), so an HTML cache rule adds nothing. Purging the zone's cache simply makes the next view of each page ask the API again.
- **Don't block or challenge verified bots.** Googlebot, `facebookexternalhit`, `TelegramBot`, `Twitterbot` and `WhatsApp` must reach event pages and `/events/*/showcase` without a challenge, or search results and invitation previews break. The default Bot Fight Mode allows verified bots. If previews stop appearing, check **Security → Events** for challenges against those user agents.
- **Leave the existing `/e/*` and `/g/*` rules alone.** Zone rules already send both to the backend before Pages sees the request: `/g/<code>` answers `302 → https://api.goevent.online/g/<code>`. The `/g/:code` line in `_redirects` is only the fallback for hosts outside the zone, such as `pages.dev`. Neither path is affected by this release.
- **Don't move the Pages root directory** off the repo root (§1).

---

## 6. Checking a deploy

Run after every deploy that touches routing. Expected results are on the right.

```sh
curl -sI https://goevent.online/                       # 200
curl -sI https://goevent.online/explore                 # 200
curl -sI https://goevent.online/this-does-not-exist     # 404, and the body contains <meta name="robots" content="noindex">
curl -s  https://goevent.online/robots.txt              # plain text, with the Sitemap: line
curl -sI https://goevent.online/sitemap.xml             # 200, content-type application/xml, x-robots-tag: noindex
curl -sI https://goevent.online/assets/js/<any>.js      # cache-control: public, max-age=31536000, immutable (and nothing else)
curl -sI https://goevent.online/events                  # 200, x-robots-tag: noindex
curl -sI https://goevent.online/signin                  # 200, x-robots-tag: noindex
curl -sI https://goevent.online/home                    # 301, location: /
curl -sI https://goevent.online/favicon.ico             # 301, location: /icon.png
```

Each public page has its own head and text in the HTML itself (view-source, not Inspect):

```sh
for p in / /explore /services /about /privacy; do
  curl -s https://goevent.online$p | grep -iE '<title|canonical|name="description"'
done
curl -s https://goevent.online/calendars | grep -c canonical   # 0: routes without a page of their own get the generic shell
```

Google's Rich Results Test on `https://goevent.online/` should detect an **Organization**.

For an event, pick any `/events/<uuid>` from the sitemap:

```sh
curl -s https://goevent.online/events/<uuid> | grep -E "<title|og:title|canonical|ld\+json"
```

That should show the event's own title, a canonical URL and one `application/ld+json` script. A private or draft event should instead show `<meta name="robots" content="noindex">`.

Google's [Rich Results Test](https://search.google.com/test/rich-results) on an event URL should detect an **Event**.

### If something is wrong

| Symptom | Likely cause |
|---|---|
| Event pages show the generic "GoEvent" title | The Function can't reach the API. Check `VITE_API_BASE_URL`, then that `https://api.goevent.online/api/public/events/<uuid>/seo/` answers. The page is left untouched on any API failure, unless the edge still holds that event's last good answer from the past day. |
| Vendor pages show the generic "GoEvent" title | The same checks as for events, against `https://api.goevent.online/api/public/vendors/<uuid>/seo/`. An HTML (not JSON) 404 there means the deployed backend lacks the endpoint. |
| `/signin`, a showcase or another app route carries the homepage's canonical | Its `_redirects` line targets `/` instead of `/app-shell`. `src/router/staticRoutes.spec.ts` should have caught it. |
| Every event page carries `noindex` | The API answers the SEO endpoint with a JSON 404 for events that should be public. Check the event's privacy, publish and moderation status in the backend. |
| A real page returns 404 | Its route is missing from `public/_redirects`. The page still renders for people, but crawlers see a 404. `src/router/staticRoutes.spec.ts` should have caught it. |
| `/sitemap.xml` returns 503 | The backend's sitemap is down. The 503 tells Google to retry later. |
| Anything worse | **Deployments → previous deployment → Rollback to this deployment**. This restores the previous files and Functions together, in seconds. |
