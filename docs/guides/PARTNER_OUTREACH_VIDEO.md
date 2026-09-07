# Partner outreach video — brief

A short vertical video for cold-DMing print shops, photo studios and event
decorators found on social media, with a public cut for GoEvent's own pages.

Everything below is sourced from the live offer, not invented: the copy comes
from [`src/i18n/locales/kh/partners.json`](../../src/i18n/locales/kh/partners.json)
and [`en/partners.json`](../../src/i18n/locales/en/partners.json), the quotes
from [`src/assets/testimonials.json`](../../src/assets/testimonials.json). If the
offer changes, this file is downstream of those — update them first.

---

## 0. The rule that outranks everything else here

**No wholesale rate, margin or saving percentage appears in this video, in
either cut.** Not "$X per invitation", not "from $X", not "save 40%".

This is the same rule `/partners` itself now follows (see CLAUDE.md, *Partner
Credit Packs*): a wholesale rate published where the public can read it is a rate
the partner's own customer can read before walking into their shop, and the
margin printed beside it is that partner's markup shown to the person paying it.
A social video is more public than the page, not less.

The money conversation happens at `/credits`, after approval, behind
`is_partner`. **The video's only job is to get the request sent.** It has plenty
to say without a figure — free to start, your own price, your logo, no monthly
fee — and every one of those is a stronger opening claim than a number anyway,
because a number invites comparison shopping and "free" invites a reply.

---

## 1. The concept

**"អ្នកឃើញផ្សាយពាណិជ្ជកម្មទាំងនេះហើយ" — You've seen these ads.**

Every print shop in Phnom Penh is watching digital-invitation ads flood their
feed, sold by companies that did not exist two years ago, to the same brides who
used to walk into their shop. They cannot build one themselves — no designer, no
developer, no platform. So they watch.

The video names that in the first three seconds, then turns it:

> You do not have to compete with digital invitations. You can be the one
> selling them. By Friday. For nothing.

The product demo is the **proof**, not the pitch. The threat is the hook, the
logo in the footer is the promise, and "free to start" is the close.

---

## 2. The offer, stripped down

The claims the video is allowed to make, and nothing else:

| Claim | Source key |
|---|---|
| They build the invitation and **set their own price**; GoEvent takes no share | `hero.subtitle`, `hero.proof.fee`, `faq.price` |
| **First two events free**, nothing bought to try it | `hero.proof.payg`, `closing.title` |
| **No monthly fee** | `hero.proof.fee` |
| **Their shop's logo** sits beside GoEvent's at the bottom of every invitation | `partner.branding` |
| **15 minutes** per event; the customer needs no account | `steps.build.time`, `faq.customer` |
| A reply **within two working days** | `hero.proof.review` |

What is deliberately absent: the pack price, the per-event cost, the retail
range, and any profit figure. See §0.

The most persuasive of these is not "free". It is that a print shop can sell a
*second* card to the same bride, with no printing cost and no new skill — a fact
the video shows rather than states, by putting the invitation next to their logo.

---

## 3. Shot list — 30-second DM cut (9:16, mute-first)

| Time | Shot | Khmer overlay |
|---|---|---|
| 0–4s | A phone feed scrolling fast. Digital-invitation ad, another, another. The repetition is the point. | `ធៀបអញ្ជើញឌីជីថល មានពេញ Facebook` |
| 4–7s | Scroll stops. Hold on one. | `អតិថិជនរបស់អ្នក ក៏ឃើញដែរ` |
| 7–10s | Cut to black, one line. A beat of silence — this is the turn. | `ឥឡូវ ហាងអ្នកក៏លក់វាបានដែរ` |
| 10–17s | Telegram message carrying a guest's name → tap → **the full cover animation, uncut.** | `ភ្ញៀវម្នាក់ — Link មួយ` |
| 17–21s | One-tap RSVP, then hard cut to the shop's guest list updating itself, counter ticking. | `បញ្ជីភ្ញៀវ ធ្វើបច្ចុប្បន្នភាពដោយខ្លួនឯង` |
| 21–24s | Slow push into the *bottom* of the invitation — the shop's logo beside GoEvent's. Hold. | `ឡូហ្គោហាងអ្នក នៅលើធៀបគ្រប់ច្បាប់` |
| 24–29s | Black card. Three lines, one at a time, nothing else moving. | `មិនបាច់រៀន Design`<br>`២ ច្បាប់ដំបូង ឥតគិតថ្លៃ`<br>`អ្នកកំណត់តម្លៃលក់ដោយខ្លួនឯង` |
| 29–32s | Logo + Telegram handle. | `ស្នើសុំសិទ្ធិជាដៃគូ` |

Every overlay is lifted from the site's own Khmer copy, so the video and the
landing page say the same words — which matters, because the video's only job is
to get them to that page.

### The one rule that outranks the table

**Do not cut inside 10–17s.** The cover→transition→main-content animation is the
best seven seconds GoEvent has. Any cut inside it turns a film into a slideshow
and throws away the only thing a competitor's static card cannot do.

---

## 4. Production notes

- **No presenter.** A talking head in a cold DM reads as an ad and gets swiped.
  A silent screen recording reads as someone showing you a thing.
- **Mute-first.** Every claim is on screen. Music optional, voice-over never.
- **Do not show real competitor ads.** Recreate the feed with blurred or generic
  cards, or scroll fast enough that nothing is legible. Using their creative
  gives them free reach inside your ad and invites a complaint.
- **Keep "free" precise.** The headline is *ចាប់ផ្តើមឥតគិតថ្លៃ* — free to
  **start**. Two events, then it is paid. Implying "free forever" wins the
  meeting and loses the partner in it.
- **Footage sources, all already in the repo:** `/partners/templates` renders
  three live phone frames of any design; the partner page's own stills live in
  `src/assets/partners/`; the demo event in `src/assets/demo-showcase-event.json`
  is populated in every section, so nothing needs a real customer's data.

---

## 5. The public cut (60s)

Same footage, one change: **drop the threat framing.** On GoEvent's own page
brides are watching too, and "print shops are losing business" reads badly to
them. Open on the invitation playing instead, and put the shop-owner ask at 0:20
once the product has earned the attention.

§0 applies here with more force, not less — this is the cut a bride will see.

That leaves room for one testimonial card. Use ស៊ុន ម៉ាលី's, because it names the
two things a shop actually decides on, and names no figure:

> តម្លៃដើមច្បាស់តាំងពីដំបូង ហើយខ្ញុំកំណត់តម្លៃលក់ដោយខ្លួនឯង។
> ទិញជាកញ្ចប់ចំណេញជាងទិញម្តងមួយៗច្រើន។

---

## 6. The DM that carries it

Video alone in a cold DM gets ignored. One line above it, naming their shop:

> សួស្តី [ហាង] — ឃើញហាងបងធ្វើកាតអាពាហ៍ពិពាហ៍។ យើងមានកម្មវិធីដៃគូ
> ឲ្យហាងបោះពុម្ពលក់ធៀបឌីជីថលបាន ដោយមិនបាច់បង់ថ្លៃដើម។
> ២ ច្បាប់ដំបូងឥតគិតថ្លៃ។ មើលវីដេអូ ៣០ វិនាទីនេះសិន។

If they ask the price in the reply, that is the conversation going well — answer
it in the DM, one shop at a time. That is a private channel, so §0 does not bind
it; a public caption under the same video is a different thing and does.

---

## 7. Worth more than the video

A real invitation takes 15 minutes to build, and the partner's logo goes in the
footer. So for the top ~20 targets: **build one with their logo already on it and
send the live link** alongside the message.

A shop owner who opens an invitation carrying their own logo has finished the
sales call by themselves. The video then only has to explain what they are
already holding. A couple of hours of work, and it will out-convert the
broadcast video by a wide margin.
