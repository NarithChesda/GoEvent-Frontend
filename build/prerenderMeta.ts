/**
 * Per-route <head> prerendering for link previews.
 *
 * Link scrapers — Messenger, Telegram, WhatsApp, Slack, Twitter, Discord — do
 * not execute JavaScript. Everything this app does about meta tags happens
 * after mount (`updateMetaTags` in src/utils/metaUtils.ts, the router's
 * `document.title`), so a scraper only ever saw the generic block in
 * index.html and every shared link rendered the same GoEvent card.
 *
 * These pages are static marketing copy — one title, one description, one
 * image, the same for every visitor — so they need a second static HTML file,
 * not a render server. This plugin does two things to the built output:
 *
 *   1. rewrites the marker block in `dist/index.html` with DEFAULT_META, the
 *      card every route without one of its own is shared with; and
 *   2. writes `dist/<route>.html` — a copy of that same file carrying the
 *      route's own head — for each entry in PRERENDERED_ROUTES.
 *
 * Cloudflare Pages serves a matching static asset in preference to the
 * `/* /index.html 200` SPA fallback in _redirects, so the crawler gets the
 * route's card and the browser boots exactly the same app underneath.
 *
 * What this is NOT for: anything whose preview depends on a record — an event
 * showcase, a vendor storefront, a service listing. Those already have (or
 * need) the backend's bot-detecting meta endpoint, the pattern `/g/:code`
 * follows in _redirects.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import type { Plugin } from 'vite'

const META_START = '<!-- meta:start -->'
const META_END = '<!-- meta:end -->'

/** Where the built site is served from. Only used to absolutise `og:url` and
 *  `og:image`, both of which every scraper requires to be absolute. */
export const DEFAULT_SITE_ORIGIN = 'https://goevent.online'

export interface CardMeta {
  title: string
  /**
   * The <title> tag, when it should differ from the card's title. The card's
   * is written for a chat bubble and the tag for a browser tab, and on the
   * fallback those are not the same sentence — the router overwrites the tag
   * per route a moment after boot, so a marketing line there only flashes.
   */
  documentTitle?: string
  description: string
  /** Site-root-relative path to a 1200x630 card image in public/. */
  image: string
  imageAlt: string
  /** OpenGraph locale of the copy above, e.g. `km_KH`. */
  locale: string
}

export interface PrerenderedRoute extends CardMeta {
  /** Route path, leading slash, no trailing slash. */
  path: string
}

/**
 * The card every other route gets, written into `dist/index.html` itself —
 * the file the SPA rewrite in _redirects serves for `/events`, `/explore`,
 * `/signin` and everything else without a card of its own.
 *
 * English, because that is the app's DEFAULT_LOCALE and so what those routes
 * boot in; the two Khmer cards below front the two pages that do not.
 *
 * It carries NO `og:url` and no canonical, deliberately. One file answers
 * many URLs, so naming one of them would tell a scraper that every share of
 * every route is really a share of that page.
 */
export const DEFAULT_META: CardMeta = {
  title: 'GoEvent - Create Amazing Events',
  description:
    'Create, manage, and showcase beautiful events with GoEvent. Perfect for weddings, conferences, parties, and more.',
  documentTitle: 'GoEvent',
  image: '/og/default.png',
  imageAlt: 'GoEvent guest management and expense tracking, on a laptop and a phone',
  locale: 'en_US',
}

/**
 * The routes that get their own head.
 *
 * In Khmer, and that is not a translation choice made here — it is the
 * language these two pages open in (`preferredLocale` on their routes in
 * src/router/index.ts). A card that reads in English and then hands over to a
 * Khmer page is worse than either one alone. Copy is kept in step with the
 * pages' own strings (src/i18n/locales/kh/partners.json) by hand rather than
 * imported: a scraper gets one language whatever the visitor's is, and a card
 * is not the place for a page's full subtitle.
 */
export const PRERENDERED_ROUTES: PrerenderedRoute[] = [
  {
    path: '/partners',
    title: 'កម្មវិធីដៃគូ GoEvent',
    description:
      'អ្នករៀបចំធៀបជូនអតិថិជន ២កម្មវិធីដំបូងឥតគិតថ្លៃ។',
    image: '/og/partners.png',
    imageAlt: 'ធៀបអញ្ជើញ GoEvent បី បើកជាទម្រង់ផ្លិត',
    locale: 'km_KH',
  },
  {
    path: '/partners/templates',
    title: 'ម៉ឺនុយម៉ូតធៀប GoEvent',
    description:
      'ម៉ឺនុយម៉ូតធៀប — ជាភាសាអង់គ្លេស និងខ្មែរ។',
    image: '/og/partner-templates.png',
    imageAlt: 'ម៉ូតធៀបអញ្ជើញ GoEvent បួន',
    locale: 'km_KH',
  },
]

const escapeAttr = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function renderHead(meta: CardMeta, origin: string, canonicalPath?: string): string {
  const url = canonicalPath ? `${origin}${canonicalPath}` : null
  const image = `${origin}${meta.image}`
  const title = escapeAttr(meta.title)
  const description = escapeAttr(meta.description)
  const imageAlt = escapeAttr(meta.imageAlt)

  return [
    `<title>${escapeAttr(meta.documentTitle ?? meta.title)}</title>`,
    `<meta name="description" content="${description}">`,
    `<meta name="author" content="GoEvent">`,
    ...(url ? [`<link rel="canonical" href="${url}">`] : []),
    ``,
    `<!-- Open Graph tags (prerendered — see build/prerenderMeta.ts) -->`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    ...(url ? [`<meta property="og:url" content="${url}">`] : []),
    `<meta property="og:site_name" content="GoEvent">`,
    `<meta property="og:locale" content="${escapeAttr(meta.locale)}">`,
    `<meta property="og:image" content="${image}">`,
    `<meta property="og:image:alt" content="${imageAlt}">`,
    `<meta property="og:image:type" content="image/png">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    ``,
    `<!-- Twitter Card tags -->`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${image}">`,
    `<meta name="twitter:image:alt" content="${imageAlt}">`,
    `<meta name="twitter:site" content="@GoEvent">`,
  ].join('\n    ')
}

export function prerenderMeta(options: { origin?: string } = {}): Plugin {
  const origin = (options.origin || DEFAULT_SITE_ORIGIN).replace(/\/+$/, '')
  let outDir = ''
  let isSsr = false

  return {
    name: 'goevent:prerender-meta',
    apply: 'build',

    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
      isSsr = Boolean(config.build.ssr)
    },

    async closeBundle() {
      if (isSsr) return

      const indexPath = path.join(outDir, 'index.html')
      let html: string
      try {
        html = await readFile(indexPath, 'utf8')
      } catch {
        // No HTML entry (a library build, say). Nothing to prerender.
        return
      }

      const start = html.indexOf(META_START)
      const end = html.indexOf(META_END)
      if (start === -1 || end === -1 || end < start) {
        // Loud, not silent: without the markers every shared link quietly goes
        // back to the generic card, which is the bug this plugin exists to fix.
        throw new Error(
          `[prerender-meta] ${META_START} / ${META_END} not found in ${indexPath}. ` +
            'Restore the markers in index.html — see the comment above them.',
        )
      }

      const before = html.slice(0, start + META_START.length)
      const after = html.slice(end)
      const withHead = (head: string) => `${before}\n    ${head}\n    ${after}`

      // The fallback first, in place — every route without a card of its own
      // is served this file by the SPA rewrite.
      await writeFile(indexPath, withHead(renderHead(DEFAULT_META, origin)), 'utf8')
      this.info?.('prerendered the default head')

      for (const route of PRERENDERED_ROUTES) {
        /*
         * `<route>.html`, not `<route>/index.html`.
         *
         * Both are resolved by Cloudflare Pages, but only this one is resolved
         * for the URL people actually share. A static server asked for
         * `/partners` looks for `partners.html` and, failing that, falls
         * through to the SPA rewrite — the directory form is only found at
         * `/partners/`, with the slash. Verified against `vite preview`, which
         * behaves exactly that way and is how this can be checked locally at
         * all.
         */
        const target = path.join(outDir, `${route.path.replace(/^\//, '')}.html`)
        await mkdir(path.dirname(target), { recursive: true })
        await writeFile(target, withHead(renderHead(route, origin, route.path)), 'utf8')
        this.info?.(`prerendered head for ${route.path}`)
      }
    },
  }
}
