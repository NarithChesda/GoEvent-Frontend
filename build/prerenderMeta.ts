/**
 * Per-route <head> (and text) prerendering, for everything that reads a page
 * without running it.
 *
 * Link scrapers — Messenger, Telegram, WhatsApp, Slack, Twitter, Discord — do
 * not execute JavaScript, and neither do Bing's first pass or most AI
 * crawlers. Everything this app does about meta tags happens after mount
 * (`updateMetaTags` in src/utils/metaUtils.ts, the router's `document.title`),
 * so they only ever saw one generic head over an empty `<div id="app">`.
 *
 * The public marketing pages are static copy — the same for every visitor —
 * so they need a second static HTML file, not a render server. This plugin
 * rewrites the built output:
 *
 *   1. `dist/app-shell.html` — the app with the generic DEFAULT_META head, the
 *      page every client route without a file of its own is rewritten to
 *      (public/_redirects) and the edge Functions build on (functions/_lib);
 *   2. `dist/index.html` — the homepage, with its own head, JSON-LD and text;
 *   3. `dist/<route>.html` for every other entry in PRERENDERED_ROUTES; and
 *   4. `dist/404.html`, the shell again plus `noindex`, which Pages serves
 *      with a 404 status for any path that is neither a file nor one of the
 *      app's routes in _redirects.
 *
 * The shell and the homepage used to be one file. That was fine while the
 * homepage said nothing about itself, and it is why they are two now: a
 * canonical in index.html would have been served to /signin, every showcase
 * and every other rewritten route, telling Google each one *is* the homepage.
 *
 * Cloudflare Pages serves a matching static asset in preference to the SPA
 * rewrites in _redirects, so the crawler gets the route's page and the browser
 * boots exactly the same app underneath.
 *
 * What this is NOT for: anything whose preview depends on a record. Event
 * pages and vendor storefronts are rendered at the edge (functions/); a
 * service listing still needs a backend endpoint to do the same.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import type { Plugin } from 'vite'
import { STATIC_BODY_STYLE, createBodyRenderer } from './prerenderBodies'

const META_START = '<!-- meta:start -->'
const META_END = '<!-- meta:end -->'
const APP_ROOT = '<div id="app"></div>'

/** Where the built site is served from. Only used to absolutise `og:url` and
 *  `og:image`, both of which every scraper requires to be absolute. */
export const DEFAULT_SITE_ORIGIN = 'https://goevent.online'

/**
 * The app shell's file, and the path it is served at — the target of every
 * rewrite in public/_redirects, and SHELL_PATH in functions/_lib/edge.ts.
 * staticRoutes.spec.ts holds all three together.
 */
export const SHELL_FILE = 'app-shell.html'
export const SHELL_PATH = '/app-shell'

export interface CardMeta {
  title: string
  /**
   * The <title> tag, when it should differ from the card's title. The card's
   * is written for a chat bubble and the tag for a browser tab. For a route
   * the router also titles, it must be that route's `meta.title`, or the tab
   * changes as the app boots (staticRoutes.spec.ts checks it).
   */
  documentTitle?: string
  description: string
  /** Site-root-relative path to a 1200x630 card image in public/. */
  image: string
  imageAlt: string
  /** OpenGraph locale of the copy above, e.g. `km_KH`. Also sets `<html lang>`. */
  locale: string
}

export interface PrerenderedRoute extends CardMeta {
  /** Route path, leading slash, no trailing slash (`/` for the homepage). */
  path: string
  /**
   * The canonical URL's path when it is another page's — this route serves a
   * duplicate of it. Defaults to `path`.
   */
  canonicalPath?: string
  /** schema.org objects for the head, given the site's origin. */
  jsonLd?: (origin: string) => object[]
}

/**
 * The card for every route without one of its own, written into the app
 * shell — the file the SPA rewrite in _redirects serves for `/events`,
 * `/signin`, every showcase and everything else not listed below.
 *
 * English, because that is the app's DEFAULT_LOCALE and so what those routes
 * boot in; the Khmer cards below front the pages that do not.
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

/** The same channels as the footer's social links (AppFooter.vue). */
const SOCIAL_PROFILES = [
  'https://t.me/goeventkh',
  'https://www.facebook.com/profile.php?id=61581851850221',
  'https://www.instagram.com/goevent.online/',
  'https://www.tiktok.com/@goevent.online',
]

/**
 * Who publishes the site, for Google's knowledge panel and the site name it
 * shows over results. The logo is the app mark rendered at 512px
 * (public/brand/): Google wants at least 112px, and the favicon is 107.
 */
const siteJsonLd = (origin: string): object[] => [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${origin}/#organization`,
    name: 'GoEvent',
    url: `${origin}/`,
    logo: `${origin}/brand/goevent-icon-512.png`,
    sameAs: SOCIAL_PROFILES,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${origin}/#website`,
    name: 'GoEvent',
    url: `${origin}/`,
    inLanguage: ['en', 'km'],
    publisher: { '@id': `${origin}/#organization` },
  },
]

/** The About page's card; `/contact` renders the same page (see below). */
const ABOUT_CARD: CardMeta = {
  title: 'About GoEvent',
  description:
    'The team behind GoEvent, and what we are building: digital invitations, guest lists and tickets for events of every size.',
  documentTitle: 'About - GoEvent',
  image: DEFAULT_META.image,
  imageAlt: DEFAULT_META.imageAlt,
  locale: 'en_US',
}

/**
 * The routes that get their own file.
 *
 * Each card is written in the language its page opens in: the partner pages
 * prefer Khmer (`preferredLocale` in src/router/index.ts), everything else
 * boots in English. A card that reads in one language and hands over to a
 * page in the other is worse than either alone. Copy is kept in step with the
 * pages' own strings by hand rather than imported: a scraper gets one
 * language whatever the visitor's is, and a card is not the place for a
 * page's full subtitle. The page *text* below the head is imported
 * (build/prerenderBodies.ts).
 */
export const PRERENDERED_ROUTES: PrerenderedRoute[] = [
  {
    /*
     * The homepage, and the one page whose words are chosen for search: what
     * people type is "wedding invitation" and ធៀបការ (a wedding card), not
     * "event management". It opens in English (the app's default locale), so
     * the card and `<html lang>` are English; the Khmer term rides along in
     * the title because that is what most of the market searches in.
     */
    path: '/',
    title: 'GoEvent — digital invitations in Khmer and English',
    documentTitle: 'GoEvent — Digital Wedding Invitations & RSVP | ធៀបការឌីជីថល',
    description:
      'Make a digital wedding invitation (ធៀបការ) in Khmer and English, send every guest their own link with their name on it, and collect RSVPs in one place.',
    image: DEFAULT_META.image,
    imageAlt: DEFAULT_META.imageAlt,
    locale: 'en_US',
    jsonLd: siteJsonLd,
  },
  {
    path: '/explore',
    title: 'Discover events on GoEvent',
    documentTitle: 'Discover Events - GoEvent',
    description:
      'Concerts, meetups, workshops and celebrations open to the public. See what is on, and open any event for where and when.',
    image: DEFAULT_META.image,
    imageAlt: DEFAULT_META.imageAlt,
    locale: 'en_US',
  },
  {
    path: '/services',
    title: 'Event services on GoEvent',
    documentTitle: 'Event Services - GoEvent',
    description:
      'Photographers, caterers, venues, decorators, makeup artists and other wedding and event services, with their work and how to reach them.',
    image: DEFAULT_META.image,
    imageAlt: DEFAULT_META.imageAlt,
    locale: 'en_US',
  },
  { path: '/about', ...ABOUT_CARD },
  {
    /*
     * The router renders the About page here too (there is no contact page
     * yet), so this URL is a duplicate and its canonical says so. It keeps a
     * tab title of its own because the router gives it one.
     */
    path: '/contact',
    ...ABOUT_CARD,
    documentTitle: 'Contact - GoEvent',
    canonicalPath: '/about',
  },
  {
    path: '/partners',
    title: 'កម្មវិធីដៃគូ GoEvent',
    description: 'អ្នករៀបចំធៀបជូនអតិថិជន ២កម្មវិធីដំបូងឥតគិតថ្លៃ។',
    image: '/og/partners.png',
    imageAlt: 'ធៀបអញ្ជើញ GoEvent បី បើកជាទម្រង់ផ្លិត',
    locale: 'km_KH',
  },
  {
    /*
     * The one of these that gets sent to a named person rather than posted —
     * it is the reply to "how do I become a partner?", so its card is read in
     * a chat thread, under the sender's own sentence. It reuses
     * `/og/partners.png` deliberately: the link goes to the same offer, and a
     * second artwork for the form would make it look like a different product
     * from the page the recipient may already have been shown.
     */
    path: '/partners/apply',
    title: 'ស្នើសុំធ្វើជាដៃគូ GoEvent',
    description: 'បំពេញព័ត៌មានហាងរបស់អ្នក — មិនទាន់ត្រូវការគណនីទេ។',
    image: '/og/partners.png',
    imageAlt: 'ធៀបអញ្ជើញ GoEvent បី បើកជាទម្រង់ផ្លិត',
    locale: 'km_KH',
  },
  {
    path: '/partners/templates',
    title: 'ម៉ឺនុយម៉ូតធៀប GoEvent',
    description: 'ម៉ឺនុយម៉ូតធៀប — ជាភាសាអង់គ្លេស និងខ្មែរ។',
    image: '/og/partner-templates.png',
    imageAlt: 'ម៉ូតធៀបអញ្ជើញ GoEvent បួន',
    locale: 'km_KH',
  },
  {
    /*
     * English: the policy text is English only (see
     * src/components/legal/privacyPolicyContent.ts) and the route has no
     * preferredLocale. It is here less for chat previews than for the review
     * bots — Google's OAuth consent screen and Meta's ad account both check this
     * URL, and a real <title> and canonical in the static HTML costs nothing.
     */
    path: '/privacy',
    title: 'GoEvent Privacy Policy',
    description: 'What GoEvent collects, why, who it is shared with, and the choices you have.',
    documentTitle: 'Privacy Policy - GoEvent',
    image: DEFAULT_META.image,
    imageAlt: DEFAULT_META.imageAlt,
    locale: 'en_US',
  },
]

const escapeAttr = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** JSON for an inline <script>: `<` escaped so no string in it can close the element. */
const inlineJson = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c')

/** `km_KH` → `km`: an HTML lang is a language tag, not an OpenGraph locale. */
export const htmlLang = (locale: string) => locale.split('_')[0]!.toLowerCase()

/**
 * The head of dist/404.html. The default card, because a link scraper still
 * draws one for a dead link, and a tab title that says what happened: the
 * router overwrites it anyway once the app boots, but a scraper never runs it.
 */
const NOT_FOUND_META: CardMeta = {
  ...DEFAULT_META,
  documentTitle: 'Page Not Found - GoEvent',
}

interface HeadOptions {
  canonicalPath?: string
  noindex?: boolean
  jsonLd?: object[]
  hasStaticBody?: boolean
}

function renderHead(
  meta: CardMeta,
  origin: string,
  { canonicalPath, noindex = false, jsonLd, hasStaticBody = false }: HeadOptions = {},
): string {
  const url = canonicalPath ? `${origin}${canonicalPath}` : null
  const image = `${origin}${meta.image}`
  const title = escapeAttr(meta.title)
  const description = escapeAttr(meta.description)
  const imageAlt = escapeAttr(meta.imageAlt)

  return [
    `<title>${escapeAttr(meta.documentTitle ?? meta.title)}</title>`,
    `<meta name="description" content="${description}">`,
    `<meta name="author" content="GoEvent">`,
    ...(noindex ? [`<meta name="robots" content="noindex">`] : []),
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
    ...(jsonLd?.length
      ? [``, `<script type="application/ld+json">${inlineJson(jsonLd)}</script>`]
      : []),
    ...(hasStaticBody ? [``, STATIC_BODY_STYLE] : []),
  ].join('\n    ')
}

export function prerenderMeta(options: { origin?: string } = {}): Plugin {
  const origin = (options.origin || DEFAULT_SITE_ORIGIN).replace(/\/+$/, '')
  let root = ''
  let outDir = ''
  let isSsr = false

  return {
    name: 'goevent:prerender-meta',
    apply: 'build',

    configResolved(config) {
      root = config.root
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
      if (!html.includes(APP_ROOT)) {
        throw new Error(`[prerender-meta] ${APP_ROOT} not found in ${indexPath}.`)
      }

      const before = html.slice(0, start + META_START.length)
      const after = html.slice(end)
      const page = (head: string, locale: string, body: string | null = null) => {
        const withHead = `${before}\n    ${head}\n    ${after}`.replace(
          /<html lang="[^"]*">/,
          `<html lang="${htmlLang(locale)}">`,
        )
        return body ? withHead.replace(APP_ROOT, `<div id="app">${body}</div>`) : withHead
      }

      // The shell first. Every route without a file of its own is served it.
      await writeFile(
        path.join(outDir, SHELL_FILE),
        page(renderHead(DEFAULT_META, origin), DEFAULT_META.locale),
        'utf8',
      )
      this.info?.(`prerendered the app shell (${SHELL_FILE})`)

      const bodyFor = createBodyRenderer(root)

      for (const route of PRERENDERED_ROUTES) {
        /*
         * `<route>.html`, not `<route>/index.html` (the homepage aside, which
         * is index.html by definition).
         *
         * Both are resolved by Cloudflare Pages, but only this one is resolved
         * for the URL people actually share. A static server asked for
         * `/partners` looks for `partners.html` and, failing that, falls
         * through to the SPA rewrite — the directory form is only found at
         * `/partners/`, with the slash. Verified against `vite preview`, which
         * behaves exactly that way and is how this can be checked locally at
         * all.
         */
        const file = route.path === '/' ? 'index.html' : `${route.path.replace(/^\//, '')}.html`
        const target = path.join(outDir, file)
        const body = bodyFor(route.path)
        await mkdir(path.dirname(target), { recursive: true })
        await writeFile(
          target,
          page(
            renderHead(route, origin, {
              canonicalPath: route.canonicalPath ?? route.path,
              jsonLd: route.jsonLd?.(origin),
              hasStaticBody: Boolean(body),
            }),
            route.locale,
            body,
          ),
          'utf8',
        )
        this.info?.(`prerendered ${route.path} (${file})`)
      }

      /*
       * Its presence is what turns Pages' SPA fallback off: with no top-level
       * 404.html, Pages answers every unknown path with index.html and a 200,
       * so every mistyped URL was a duplicate of the homepage to Google. With
       * it, only the routes listed in _redirects get the shell with a 200.
       *
       * It is the whole app shell, not an error page, so a route that was
       * forgotten in _redirects still renders for a person — the router draws
       * it — and only crawlers see the 404. The router's own catch-all draws
       * the not-found page for everything else.
       */
      await writeFile(
        path.join(outDir, '404.html'),
        page(renderHead(NOT_FOUND_META, origin, { noindex: true }), NOT_FOUND_META.locale),
        'utf8',
      )
      this.info?.('prerendered 404.html')
    },
  }
}
