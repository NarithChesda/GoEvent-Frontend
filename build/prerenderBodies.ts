/**
 * The text of each prerendered page, as static HTML for the ones that never
 * run the app.
 *
 * build/prerenderMeta.ts gives these pages their own <head>, which is all a
 * link-preview card needs. Bing's first pass, AI crawlers and anything else
 * that reads HTML without executing it also want the page's *words* — and
 * before this, every page was an empty `<div id="app">`. So each gets its
 * headings, text and links written inside that div.
 *
 * Browsers never show it. `.seo-static` is `display: none` (the style is
 * written into the same head), the app's mount replaces the div's contents
 * anyway, and a `<noscript>` rule shows it only to a browser that will never
 * run the app. Google renders JavaScript and indexes what the app draws, which
 * is the same text: that parity is the rule here, not a courtesy.
 *
 * So the words come from the same place the app's do — the i18n JSON, and for
 * /privacy the policy module — never retyped. The exceptions are /about and
 * /contact, whose page (AboutView.vue) is still written in the template
 * itself; their text below is kept in step with it by hand.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
  PRIVACY_POLICY_EN,
  type LegalBlock,
} from '../src/components/legal/privacyPolicyContent'
import { FALLBACK_PRICING_PLANS } from '../src/constants/pricingFallback'

type Lang = 'en' | 'kh'
type Tree = { [key: string]: string | Tree }

export const STATIC_BODY_CLASS = 'seo-static'

/** Hides the static text from every browser that runs the app. */
export const STATIC_BODY_STYLE = [
  `<style>.${STATIC_BODY_CLASS}{display:none}</style>`,
  `<noscript><style>.${STATIC_BODY_CLASS}{display:block;max-width:42rem;margin:0 auto;padding:2rem 1rem;font:16px/1.6 system-ui,sans-serif;color:#0f172a}</style></noscript>`,
].join('')

const esc = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const tag = (name: string, text: string) => `<${name}>${esc(text)}</${name}>`
const link = (href: string, text: string) => `<a href="${esc(href)}">${esc(text)}</a>`

export function createBodyRenderer(root: string) {
  const cache = new Map<string, Tree>()
  const messages = (lang: Lang, namespace: string): Tree => {
    const key = `${lang}/${namespace}`
    if (!cache.has(key)) {
      const file = path.join(root, 'src', 'i18n', 'locales', lang, `${namespace}.json`)
      cache.set(key, JSON.parse(readFileSync(file, 'utf8')) as Tree)
    }
    return cache.get(key)!
  }

  /**
   * One message, by `namespace.path`. Loud when missing: a renamed key would
   * otherwise quietly drop a heading from the page crawlers read.
   */
  const t = (lang: Lang, key: string): string => {
    const [namespace, ...rest] = key.split('.')
    let node: string | Tree | undefined = messages(lang, namespace!)
    for (const part of rest) node = typeof node === 'object' ? node[part] : undefined
    if (typeof node !== 'string') {
      throw new Error(`[prerender-bodies] no ${lang} message at "${key}"`)
    }
    return node
  }

  /** The children of a message group that carry the given keys, in file order. */
  const entries = (lang: Lang, key: string, ...fields: string[]) => {
    const [namespace, ...rest] = key.split('.')
    let node: string | Tree | undefined = messages(lang, namespace!)
    for (const part of rest) node = typeof node === 'object' ? node[part] : undefined
    if (typeof node !== 'object') throw new Error(`[prerender-bodies] no ${lang} group at "${key}"`)
    return Object.values(node).filter(
      (child): child is Tree =>
        typeof child === 'object' && fields.every((field) => typeof child[field] === 'string'),
    ) as Array<Record<string, string>>
  }

  /** The site's public pages, in the page's own language. */
  const siteNav = (lang: Lang) =>
    `<nav><ul>${[
      ['/', t(lang, 'common.footer.home')],
      ['/explore', t(lang, 'events.landing.secondaryCta')],
      ['/services', t(lang, 'services.title')],
      ['/partners/templates', t(lang, 'events.landing.designs.title')],
      ['/partners', t(lang, 'partners.nav')],
      ['/about', t(lang, 'common.footer.aboutUs')],
      ['/privacy', t(lang, 'common.footer.privacy')],
    ]
      .map(([href, label]) => `<li>${link(href!, label!)}</li>`)
      .join('')}</ul></nav>`

  const home = () => {
    const en: Lang = 'en'
    const k = (key: string) => t(en, `events.landing.${key}`)
    const plans = FALLBACK_PRICING_PLANS.filter((plan) => plan.is_active)
    return [
      `<h1>${esc(k('headline'))} ${esc(k('headlineAccent'))}</h1>`,
      tag('p', k('subtitle')),
      `<p>${link('/explore', k('secondaryCta'))}</p>`,

      tag('h2', k('features.title')),
      tag('p', k('features.subtitle')),
      `<ul>${entries(en, 'events.landing.features', 'title', 'body')
        .map((item) => `<li>${tag('h3', item.title!)}${tag('p', item.body!)}</li>`)
        .join('')}</ul>`,

      tag('h2', k('steps.title')),
      `<ol>${entries(en, 'events.landing.steps', 'title', 'body')
        .map((item) => `<li>${tag('h3', item.title!)}${tag('p', item.body!)}</li>`)
        .join('')}</ol>`,

      tag('h2', k('designs.title')),
      tag('p', k('designs.body')),
      `<p>${link('/partners/templates', k('designs.cta'))}</p>`,
      `<p>${esc(k('designs.partner'))} ${link('/partners', k('designs.partnerCta'))}</p>`,

      // The page's own pricing comes from the API; this is the committed copy
      // of the same plans (src/constants/pricingFallback.ts), which is also
      // what the page draws when the API can't be reached.
      tag('h2', k('pricing.title')),
      tag('p', k('pricing.subtitle')),
      `<ul>${plans
        .map((plan) => {
          const category = typeof plan.category === 'object' ? `${plan.category.name}: ` : ''
          return `<li>${esc(`${category}${plan.name}, $${Number(plan.price).toFixed(0)}`)}</li>`
        })
        .join('')}</ul>`,

      tag('h2', k('faq.title')),
      entries(en, 'events.landing.faq', 'q', 'a')
        .map((item) => `${tag('h3', item.q!)}${tag('p', item.a!)}`)
        .join(''),
    ].join('')
  }

  const explore = () =>
    [
      tag('h1', t('en', 'events.landing.secondaryCta')),
      tag('p', t('en', 'discover.subtitle')),
    ].join('')

  const services = () =>
    [
      tag('h1', t('en', 'services.title')),
      tag(
        'p',
        'Photographers, videographers, caterers, venues, decorators, makeup artists and other wedding and event services, with their work and how to reach them.',
      ),
    ].join('')

  // Mirrors AboutView.vue by hand (see the header comment).
  const about = () =>
    [
      tag('h1', 'About GoEvent'),
      tag(
        'p',
        'We are on a mission to build intelligent, tech-driven solutions that redefine how businesses manage and deliver experiences.',
      ),
      tag('h2', 'Mission & Vision'),
      tag('p', 'The driving forces behind everything we do at GoEvent.'),
      `<p>${link('https://t.me/goevent_careers', 'Join our team')}</p>`,
    ].join('')

  const block = (item: LegalBlock) => {
    if (item.kind === 'paragraph') return tag('p', item.text)
    if (item.kind === 'subheading') return tag('h3', item.text)
    return `<ul>${item.items
      .map((entry) =>
        typeof entry === 'string'
          ? tag('li', entry)
          : `<li><strong>${esc(entry.term)}</strong> ${esc(entry.text)}</li>`,
      )
      .join('')}</ul>`
  }

  const privacy = () => {
    const policy = PRIVACY_POLICY_EN
    return [
      tag('h1', 'Privacy Policy'),
      tag('p', `Last updated ${policy.lastUpdated}`),
      ...policy.intro.map((text) => tag('p', text)),
      `<ul>${policy.summary.map((text) => tag('li', text)).join('')}</ul>`,
      ...policy.sections.map(
        (section) =>
          `<section id="${esc(section.id)}">${tag('h2', section.title)}${section.blocks
            .map(block)
            .join('')}</section>`,
      ),
    ].join('')
  }

  const partners = () => {
    const kh: Lang = 'kh'
    const p = (key: string) => t(kh, `partners.${key}`)
    const titled = (key: string) =>
      entries(kh, `partners.${key}`, 'title')
        .map((item) => `<li>${tag('h3', item.title!)}${item.body ? tag('p', item.body) : ''}</li>`)
        .join('')
    return [
      `<h1>${esc(p('hero.titleLead'))} ${esc(p('hero.titleAccent'))}</h1>`,
      tag('p', p('hero.subtitle')),
      `<p>${link('/partners/apply', p('hero.ctaPrimary'))}</p>`,
      tag('h2', p('steps.title')),
      tag('p', p('steps.subtitle')),
      `<ol>${titled('steps')}</ol>`,
      tag('h2', p('product.title')),
      tag('p', p('product.subtitle')),
      `<ul>${titled('product')}</ul>`,
      `<p>${link('/partners/templates', p('product.previewCta'))}</p>`,
      tag('h2', p('partner.title')),
      `<ul>${titled('partner')}</ul>`,
      tag('h2', p('faq.title')),
      entries(kh, 'partners.faq', 'q', 'a')
        .map((item) => `${tag('h3', item.q!)}${tag('p', item.a!)}`)
        .join(''),
      tag('h2', p('closing.title')),
      tag('p', p('closing.subtitle')),
      `<p>${link('/partners/apply', p('closing.cta'))}</p>`,
    ].join('')
  }

  const partnerApply = () =>
    [
      tag('h1', t('kh', 'partners.apply.title')),
      tag('p', t('kh', 'partners.apply.intro')),
      `<p>${link('/partners', t('kh', 'partners.apply.back'))}</p>`,
    ].join('')

  const partnerTemplates = () =>
    [
      tag('h1', t('kh', 'partners.templates.title')),
      tag('p', t('kh', 'partners.templates.subtitle')),
      tag('p', t('kh', 'partners.templates.note')),
      `<p>${link('/partners', t('kh', 'partners.templates.back'))}</p>`,
    ].join('')

  const BODIES: Record<string, { lang: Lang; render: () => string }> = {
    '/': { lang: 'en', render: home },
    '/explore': { lang: 'en', render: explore },
    '/services': { lang: 'en', render: services },
    '/about': { lang: 'en', render: about },
    '/contact': { lang: 'en', render: about },
    '/privacy': { lang: 'en', render: privacy },
    '/partners': { lang: 'kh', render: partners },
    '/partners/apply': { lang: 'kh', render: partnerApply },
    '/partners/templates': { lang: 'kh', render: partnerTemplates },
  }

  /** The static contents of `<div id="app">` for this route, or null for none. */
  return (routePath: string): string | null => {
    const body = BODIES[routePath]
    if (!body) return null
    return `<div class="${STATIC_BODY_CLASS}"><main>${body.render()}</main>${siteNav(body.lang)}</div>`
  }
}
