/**
 * Preload the default locale's messages from every page.
 *
 * The app opens in Khmer (DEFAULT_LOCALE in src/i18n/index.ts), but only
 * English — the fallback — is bundled into the entry; Khmer is a lazily
 * imported chunk (~430 KB raw, ~80 KB gzipped) that main.ts awaits before the
 * first render, so no page paints a frame of English and swaps. Left to the
 * dynamic import, that request cannot start until the entry and its whole
 * static graph have downloaded and run — a second round trip, in series, on the
 * first paint of nearly every visit. A `<link rel="modulepreload">` in the HTML
 * starts it alongside the entry instead.
 *
 * Every page gets it, the guest showcase included: that page does not wait for
 * the chunk, but it still loads it in the background, so the hint only moves
 * the fetch earlier and adds no bytes. It is written into index.html here, and
 * the prerender plugin derives every other HTML file from that one.
 *
 * Build-only. If the chunk cannot be found — the module renamed, the default
 * locale changed — the build fails rather than quietly shipping without it.
 */
import type { Plugin } from 'vite'
import type { OutputChunk } from 'rollup'

/** The default locale's message bundle — see LAZY_LOCALE_LOADERS in src/i18n. */
const DEFAULT_LOCALE_MESSAGES = /\/src\/i18n\/messages\/kh\.ts$/

export function preloadDefaultLocale(): Plugin {
  return {
    name: 'goevent:preload-default-locale',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const chunks = Object.values(ctx.bundle ?? {}).filter(
          (output): output is OutputChunk => output.type === 'chunk',
        )
        const messages = chunks.find((chunk) =>
          DEFAULT_LOCALE_MESSAGES.test((chunk.facadeModuleId ?? '').replace(/\\/g, '/')),
        )
        if (!messages) {
          throw new Error(
            '[preload-default-locale] no chunk for src/i18n/messages/kh.ts — update ' +
              'DEFAULT_LOCALE_MESSAGES in build/preloadDefaultLocale.ts to the default locale.',
          )
        }

        // The chunk's own static imports, if it has any, would otherwise be a
        // third round trip.
        return [messages.fileName, ...messages.imports].map((fileName) => ({
          tag: 'link',
          attrs: { rel: 'modulepreload', crossorigin: true, href: `/${fileName}` },
          injectTo: 'head' as const,
        }))
      },
    },
  }
}
