/**
 * Renders the 1200x630 link-preview cards into public/og/.
 *
 * Run with `npm run og:images`. Output is COMMITTED — this is not part of the
 * build. A card changes about as often as the page's headline does, and making
 * every Cloudflare build launch a browser to redraw two PNGs would be a slow,
 * flaky way to produce a file that is nearly always identical.
 *
 * Chromium (already installed for Playwright) draws the card and screenshots
 * it, so the layout is authored in the same CSS as the rest of the app instead
 * of in an image editor. Source artwork is inlined as data: URIs so the page
 * has no base-URL or file:// dependency.
 *
 * Brand rules that are not negotiable here (DESIGN.md §1.4): the gradient
 * wordmark sits on white / slate-50, never on the brand gradient itself, and
 * it is never recoloured or rebuilt in CSS.
 */
import { chromium } from '@playwright/test'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = path.join(ROOT, 'public', 'og')

const WIDTH = 1200
const HEIGHT = 630

const MIME = { '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' }

async function dataUri(relativePath) {
  const abs = path.join(ROOT, relativePath)
  const bytes = await readFile(abs)
  const mime = MIME[path.extname(abs).toLowerCase()] ?? 'application/octet-stream'
  return `data:${mime};base64,${bytes.toString('base64')}`
}

/**
 * The cards, in the order they are written.
 *
 * Each is in the language of the page it fronts — the partner pair in Khmer
 * because both open in Khmer (`preferredLocale` on their routes in
 * src/router/index.ts), the default one in English because that is the app's
 * DEFAULT_LOCALE and what every other route boots in. A card that reads in one
 * language and hands over to a page in another is worse than either alone.
 * Copy is the pages' own strings (src/i18n/locales/kh/partners.json, and
 * HomeView's hero), trimmed to poster length.
 */
const CARDS = [
  {
    /*
     * The fallback, for every route that has no card of its own — served from
     * dist/index.html by the SPA rewrite, so it fronts the whole app rather
     * than one page. Hence the product shot the landing page leads with and
     * copy that names what GoEvent is, not what any one screen does.
     */
    file: 'default.png',
    eyebrow: 'Event management platform',
    titleLead: 'Create, manage and',
    titleAccent: 'showcase your events.',
    subtitle: 'Invitations, guest lists, RSVPs and budgets — for weddings, parties and more.',
    // Latin, so the Figtree ladder rather than the Khmer one.
    latin: true,
    titleSize: 54,
    // The device shot is landscape and needs the room; the Khmer cards hand
    // their art column a phone-shaped cover instead.
    copyWidth: 548,
    art: 'devices',
    image: 'src/assets/hero-devices.webp',
  },
  {
    file: 'partners.png',
    eyebrow: 'កម្មវិធីដៃគូ',
    titleLead: 'ចាប់ផ្តើមឥតគិតថ្លៃ',
    titleAccent: 'ចំណេញកាន់តែច្រើនជាកញ្ចប់',
    subtitle: 'អ្នករៀបចំធៀបជូនអតិថិជន ហើយកំណត់តម្លៃលក់ដោយខ្លួនឯង។',
    art: 'fan',
    covers: [
      'src/assets/partners/invite-cover-khmer.webp',
      'src/assets/partners/invite-cover-crimson.webp',
      'src/assets/partners/invite-cover-blush.webp',
    ],
  },
  {
    file: 'partner-templates.png',
    eyebrow: 'ម៉ូតធៀបអញ្ជើញ',
    titleLead: 'ជ្រើសម៉ូតមួយ',
    titleAccent: 'ធៀបពិតបើកឡើងភ្លាម',
    subtitle: 'គ្រប់ម៉ូតបង្ហាញលើធៀបពិត — ជាភាសាអង់គ្លេស និងខ្មែរ។',
    art: 'deck',
    covers: [
      'src/assets/partners/invite-cover-khmer.webp',
      'src/assets/partners/invite-cover-blush.webp',
      'src/assets/partners/invite-cover-crimson.webp',
      'src/assets/partners/invite-cover-royal.webp',
    ],
  },
]

const escapeHtml = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * The art column's markup, with every source already a data: URI.
 *
 * `fan` repeats the partner hero's own geometry (--fan-x / --fan-r in
 * PartnerProgramView.vue) so the card and the page it links to read as the
 * same picture; `deck` is the catalogue as a spread hand of designs; `devices`
 * is the landing page's product shot, which is landscape and so is placed
 * against the frame rather than inside the column.
 */
async function renderArt(card) {
  if (card.art === 'devices') {
    return `<img class="devices" src="${await dataUri(card.image)}" alt="">`
  }

  const covers = await Promise.all(card.covers.map(dataUri))

  if (card.art === 'fan') {
    return `<div class="fan">
           <img class="fan__card fan__card--left" src="${covers[0]}" alt="">
           <img class="fan__card fan__card--right" src="${covers[1]}" alt="">
           <img class="fan__card fan__card--lead" src="${covers[2]}" alt="">
         </div>`
  }

  return `<div class="deck">
           ${covers.map((src, i) => `<img class="deck__card deck__card--${i}" src="${src}" alt="">`).join('\n           ')}
         </div>`
}

function renderCard(card, logo, art) {
  return `<!DOCTYPE html>
<html lang="${card.latin ? 'en' : 'km'}">
  <head>
    <meta charset="UTF-8">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&family=Kantumruy+Pro:wght@400;500;600;700&family=Noto+Serif+Khmer:wght@600;700&display=swap" rel="stylesheet">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${WIDTH}px; height: ${HEIGHT}px; }
      body {
        /* Figtree first so "GoEvent" and any Latin in the copy still set in
           the brand face; Kantumruy Pro picks up the Khmer behind it, exactly
           the stack tailwind.config.js gives the app. */
        font-family: 'Figtree', 'Kantumruy Pro', system-ui, sans-serif;
        background: #ffffff;
        overflow: hidden;
        position: relative;
      }
      /* Slate-50 wash rather than flat white: a card that is pure white
         dissolves into the chat bubble it is shown in. */
      .ground {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(120% 90% at 88% 8%, rgba(30, 144, 255, 0.10) 0%, rgba(30, 144, 255, 0) 60%),
          radial-gradient(90% 80% at 4% 96%, rgba(46, 204, 113, 0.12) 0%, rgba(46, 204, 113, 0) 62%),
          #f8fafc;
      }
      /* The one place the brand gradient appears, as a rule rather than a
         field — so the wordmark never sits on top of it. */
      .edge {
        position: absolute;
        inset: 0 0 auto 0;
        height: 10px;
        background: linear-gradient(to right, #2ecc71, #1e90ff);
      }
      .card {
        position: relative;
        display: flex;
        align-items: center;
        height: 100%;
        padding: 0 0 0 68px;
      }
      .copy { width: ${card.copyWidth ?? 596}px; flex: none; }
      .logo { display: block; width: 208px; height: auto; margin-bottom: 34px; }
      /*
        Two type ladders, picked by the card's language.

        Khmer follows the :lang(km) block in main.css rather than the Latin
        one: tracking is neutralised (Khmer writes without spaces, so the
        reader finds word boundaries by cluster shape and wide tracking pulls
        them into a picket fence), leading opens up because a cluster stacks a
        vowel sign above and a coeng below its consonant, and the headline
        swaps to Noto Serif Khmer — main.css's --font-khmer-display, and for
        its reason: Kantumruy is a UI face whose counters close up at 700 and
        whose coengs mass into a bar. Latin keeps Figtree, its wide-tracked
        uppercase eyebrow and its tight headline leading.
      */
      .eyebrow {
        display: inline-block;
        ${
          card.latin
            ? `font-family: 'Figtree', sans-serif;
        font-size: 19px;
        font-weight: 700;
        line-height: 1.4;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        margin-bottom: 20px;`
            : `font-family: 'Kantumruy Pro', 'Figtree', sans-serif;
        font-size: 21px;
        font-weight: 600;
        line-height: 1.65;
        letter-spacing: 0.01em;
        margin-bottom: 14px;`
        }
        background: linear-gradient(to right, #2ecc71, #1e90ff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      h1 {
        font-size: ${card.titleSize ?? 48}px;
        font-weight: 700;
        ${
          card.latin
            ? `font-family: 'Figtree', sans-serif;
        line-height: 1.1;
        letter-spacing: -0.025em;
        font-weight: 800;`
            : `font-family: 'Noto Serif Khmer', 'Kantumruy Pro', 'Figtree', serif;
        line-height: 1.45;
        letter-spacing: normal;`
        }
      }
      h1 .lead { display: block; color: #64748b; }
      h1 .accent { display: block; color: #0f172a; }
      p.sub {
        font-weight: 500;
        color: #475569;
        ${
          card.latin
            ? `margin-top: 24px;
        font-family: 'Figtree', sans-serif;
        font-size: 24px;
        line-height: 1.45;
        max-width: 520px;`
            : `margin-top: 18px;
        font-family: 'Kantumruy Pro', 'Figtree', sans-serif;
        font-size: 23px;
        line-height: 1.85;
        max-width: 570px;`
        }
      }
      .art { position: relative; flex: 1; height: 100%; }

      /* --- devices ---------------------------------------------------- */
      /*
        Placed against the frame, not centred in the art column: the shot is
        1200x675 landscape where the covers are 330x717, so fitting it inside
        the column would render the laptop a third of the height the phone
        covers get. It bleeds off the right edge instead — the artwork carries
        its own alpha, so the slate ground shows through around it and there is
        no white box to hide.
      */
      .devices {
        position: absolute;
        right: -66px;
        top: 50%;
        width: 730px;
        transform: translateY(-44%);
        filter: drop-shadow(0 24px 40px rgb(15 23 42 / 0.18));
      }

      /* --- fan ------------------------------------------------------- */
      /*
        222px, not the hero's own width: a cover is 330x717, so the lead card
        is 2.17x as tall as it is wide and anything past ~270px here is taller
        than the 630px card and gets sliced off top and bottom.
      */
      .fan {
        position: absolute;
        top: 50%;
        left: 47%;
        width: 222px;
        transform: translate(-50%, -50%);
      }
      .fan__card {
        display: block;
        width: 100%;
        border-radius: 26px;
        outline: 1px solid rgb(15 23 42 / 0.08);
        outline-offset: -1px;
        box-shadow:
          0 26px 52px -20px rgb(15 23 42 / 0.42),
          0 3px 10px rgb(15 23 42 / 0.08);
      }
      .fan__card--lead { position: relative; z-index: 2; }
      .fan__card--left,
      .fan__card--right { position: absolute; top: 5%; z-index: 1; width: 88%; }
      /*
        Spread wider than the hero's own --fan-x: 21%. On the page the fan is
        the width of a column and the slivers read as depth; at this size, on a
        card a reader sees at thumbnail scale in a chat list, a 21% offset just
        looks like one cover with a smudge either side.
      */
      .fan__card--left { left: 0; transform-origin: 100% 80%; transform: translateX(-36%) rotate(-7.5deg); }
      .fan__card--right { right: 0; transform-origin: 0 80%; transform: translateX(36%) rotate(7.5deg); }

      /* --- deck ------------------------------------------------------ */
      /*
        Four covers in one spread hand, the outer pair behind. Not a 2x2: a
        cover is 330x717, so four of them squared into this column shrink to
        about 100px wide and stop being legible as invitations at all.
      */
      .deck {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 460px;
        height: 374px;
        transform: translate(-50%, -50%);
      }
      .deck__card {
        position: absolute;
        width: 160px;
        border-radius: 18px;
        outline: 1px solid rgb(15 23 42 / 0.08);
        outline-offset: -1px;
        box-shadow:
          0 18px 38px -16px rgb(15 23 42 / 0.4),
          0 2px 8px rgb(15 23 42 / 0.08);
      }
      .deck__card--0 { left: 0; top: 26px; z-index: 1; transform-origin: 100% 80%; transform: rotate(-7deg); }
      .deck__card--1 { left: 100px; top: 2px; z-index: 3; transform-origin: 100% 80%; transform: rotate(-2.5deg); }
      .deck__card--2 { left: 200px; top: 2px; z-index: 4; transform-origin: 0 80%; transform: rotate(2.5deg); }
      .deck__card--3 { left: 300px; top: 26px; z-index: 2; transform-origin: 0 80%; transform: rotate(7deg); }
    </style>
  </head>
  <body>
    <div class="ground"></div>
    <div class="edge"></div>
    <div class="card">
      <div class="copy">
        <img class="logo" src="${logo}" alt="GoEvent">
        <span class="eyebrow">${escapeHtml(card.eyebrow)}</span>
        <h1>
          <span class="lead">${escapeHtml(card.titleLead)}</span>
          <span class="accent">${escapeHtml(card.titleAccent)}</span>
        </h1>
        <p class="sub">${escapeHtml(card.subtitle)}</p>
      </div>
      <div class="art">${art}</div>
    </div>
  </body>
</html>`
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const logo = await dataUri('src/assets/logo.png')

  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
    })

    for (const card of CARDS) {
      await page.setContent(renderCard(card, logo, await renderArt(card)), { waitUntil: 'load' })
      /*
       * The faces come off Google Fonts, and a webfont there is fetched only
       * once something on the page needs it — so `fonts.ready` alone can
       * resolve before the lazy fetches have even started and screenshot the
       * card in a fallback face. Naming the three explicitly makes it
       * deterministic, which matters for a file that gets committed.
       */
      await page.evaluate(async () => {
        await Promise.all([
          document.fonts.load('800 62px "Figtree"'),
          document.fonts.load('600 21px "Kantumruy Pro"'),
          document.fonts.load('700 48px "Noto Serif Khmer"'),
        ])
        await document.fonts.ready
      })
      const buffer = await page.screenshot({ type: 'png' })
      const target = path.join(OUT_DIR, card.file)
      await writeFile(target, buffer)
      console.log(`wrote ${path.relative(ROOT, target)} (${(buffer.length / 1024).toFixed(0)} KB)`)
    }
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
