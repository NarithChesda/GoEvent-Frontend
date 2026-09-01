# Backend Requirement: `og:url` on the shortlink meta page must keep the guest code

> **Status: PENDING — live bug, guest-facing.** Every invitation opened from
> Facebook Messenger (and the Facebook app) loses its `g=` credential, so the
> guest can read the invitation but cannot RSVP or comment. This is a **backend**
> fix; the frontend is behaving correctly and needs no change.

## The ask, in one line

On `GET /api/events/{id}/meta/`, set `og:url` and `<link rel="canonical">` to the
**original shortlink** (`https://goevent.online/g/{code}/?lang={lang}`), not to
the meta endpoint's own URL — and carry `g={code}` through the crawler redirect
and both of the page's user-facing redirect targets.

## Symptom

Reported 2026-08-29 against the live event `bfc36d08-a973-4544-a150-d5c9542826c3`
(shortlink `https://goevent.online/g/mH8hvB?lang=kh`).

Opened from Telegram, Instagram, or any normal browser: the guest sees their name
**and** can RSVP and comment. Opened from **Facebook Messenger**: the guest sees
their name, but the main content stage behaves as though the link had no code —
the RSVP block shows the "you need an invitation link" placeholder and the
comment box is locked.

## Root cause

The shortlink has two paths, chosen by User-Agent substring:

| Caller | `GET https://api.goevent.online/g/mH8hvB/?lang=kh` → |
| --- | --- |
| Real browser (incl. Messenger's in-app WebView) | `302` → `…/showcase?guest_name=…&lang=kh&g=mH8hvB` ✅ |
| Crawler (`facebookexternalhit`, `TelegramBot`, `WhatsApp`, any UA containing "facebook") | `302` → `/api/events/{id}/meta/?guest_name=…&lang=kh` ❌ **`g` dropped** |

The crawler branch is where it breaks. That meta page currently declares itself
as its own canonical URL:

```html
<meta property="og:url"
      content="https://api.goevent.online/api/events/bfc36d08-…/meta/?guest_name=Mr.+Narith+Chesda&amp;lang=kh">
<link rel="canonical"
      href="https://api.goevent.online/api/events/bfc36d08-…/meta/?guest_name=Mr.+Narith+Chesda&amp;lang=kh">
```

Facebook aggregates a shared link onto its `og:url` — the preview card in the
conversation points at the canonical URL, not at the URL that was pasted. So the
Messenger guest never requests `/g/mH8hvB` at all; they request the **meta
endpoint**, which then forwards them to:

```
https://goevent.online/events/bfc36d08-…/showcase?lang=kh&guest_name=Mr.+Narith+Chesda
```

`guest_name` survives — which is why the name still renders — and `g` does not.
That is the entire bug.

**Why only Facebook.** Telegram and WhatsApp hit the same crawler branch and get
the same `g`-less meta page, but neither rewrites the link a user taps: the
tappable target stays the original shortlink, so their guests take the browser
path and keep the code. Facebook is the only one of the three that substitutes
the canonical URL.

Confirming that the meta endpoint discards the code unconditionally — it is
dropped even when supplied explicitly:

```
$ curl -sSI -A '<browser UA>' \
    '…/api/events/bfc36d08-…/meta/?guest_name=Mr.+Narith+Chesda&lang=kh&g=mH8hvB'
location: https://goevent.online/events/bfc36d08-…/showcase?lang=kh&guest_name=Mr.+Narith+Chesda
```

## The fix

1. **`og:url` and `rel="canonical"` → the shortlink.**
   `https://goevent.online/g/{code}/?lang={lang}`. Facebook then canonicalizes
   to the shortlink, the tap re-enters `/g/{code}/` on the browser path, and `g`
   survives. This alone fixes the reported bug.

   The current value is wrong on a second count regardless of the credential: it
   points at `api.goevent.online`, so every Like/Share on an invitation
   aggregates onto an internal API URL rather than the public link.

2. **Carry `g` through the crawler redirect**, so the meta page knows the code:
   `/api/events/{id}/meta/?guest_name=…&lang=…&g={code}`.

3. **Include `g` in both user-facing redirect targets on the meta page** — the
   `window.location.href` assignment and the "Click here if you're not
   redirected" `<a href>`. Defence in depth: the UA sniff is a loose substring
   match (any UA containing the word "facebook" trips it), so real users do
   reach this page.

4. **Fix the HTML-escaping bug in the JS redirect** while in there. The URL is
   HTML-escaped inside a JavaScript string literal:

   ```js
   window.location.href = 'https://goevent.online/events/…/showcase?lang=kh&amp;guest_name=Mr.+Narith+Chesda';
   ```

   `&amp;` is not an entity in JS, so that URL parses as `lang=kh` plus a
   parameter literally named `amp;guest_name` — the guest name would be lost too
   for anyone who reaches the JS path. (Today the server-side `302` usually fires
   first, which is why this has not been visible.) Escape for the JS/URL context,
   not for HTML.

## After deploying

- **Re-scrape existing links.** Facebook caches the canonical it has already
  resolved. Push the fixed pages through the
  [Sharing Debugger](https://developers.facebook.com/tools/debug/) (or the
  Graph API `?scrape=true`) for the affected shortlinks.
- **Invitations already delivered in Messenger cannot be repaired.** Their stored
  canonical is the `g`-less meta URL and the code is genuinely not present in it,
  so there is nothing for the backend to recover. Those guests need a re-sent
  link.
- **Verify** with:
  ```
  curl -sS -A 'facebookexternalhit/1.1' 'https://api.goevent.online/g/{code}/?lang=kh' -L \
    | grep -i 'og:url\|canonical'
  ```
  Expect `https://goevent.online/g/{code}/?lang=kh`.

## What the frontend does meanwhile

Nothing to change, and nothing to un-pick afterwards. `guestShortcode` in
[useEventShowcase.ts](../../src/composables/useEventShowcase.ts) reads `?g=` and
caches it in `sessionStorage` per event; `GuestRSVPSection` and `CommentSection`
gate on it. All three are correct — the credential simply never arrives.

There is deliberately **no** frontend recovery from `guest_name`: a name is not a
credential, and treating it as one would let anyone comment or RSVP as any guest
by guessing a name.

If the backend fix cannot land quickly, the shortlink's OG tags can be taken over
from this repo with a Cloudflare Pages Function at `functions/g/[code].js` (a
Function takes precedence over the `/g/:code` rule in
[public/_redirects](../../public/_redirects)): proxy the backend's meta HTML for
crawler UAs and rewrite the two tags with `HTMLRewriter`, pass everything else
through as today. That is a workaround, not the fix — it duplicates backend
markup — so prefer the four changes above.
