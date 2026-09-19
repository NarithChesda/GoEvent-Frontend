/**
 * GET /events/<uuid> — the public event page, served with the event's own head.
 *
 * This is an SPA: every URL used to receive the same index.html, whose head
 * says "GoEvent". Google indexed every event under that title, and a link to an
 * event shared in Messenger or Telegram — whose scrapers never run JavaScript —
 * showed the generic card. So this Function takes the app shell and rewrites
 * its head at the edge with what `GET /api/public/events/<uuid>/seo/` says.
 * How, and what happens when the API says no or says nothing, is in
 * _lib/seoPage.ts; the markup is built in src/utils/eventSeo.ts, which the app
 * shares.
 *
 * Routing: `public/_routes.json` sends `/events/*` here, but excludes the event
 * sub-pages (showcase, manage, …) by name so they never pay for an invocation.
 * A new `/events/:id/<page>` route should be added to that exclude list.
 */
import { renderEventHead, renderNoIndexHead, type EventSeo } from '../../src/utils/eventSeo'
import type { PagesContext } from '../_lib/edge'
import { serveRecordPage } from '../_lib/seoPage'

function parseEventSeo(body: unknown): EventSeo | null {
  const seo = body as Partial<EventSeo> | null
  if (
    !seo ||
    typeof seo.title !== 'string' ||
    typeof seo.url !== 'string' ||
    typeof seo.image !== 'string'
  ) {
    return null
  }
  return {
    ...seo,
    description: typeof seo.description === 'string' ? seo.description : '',
  } as EventSeo
}

export const onRequest = (context: PagesContext): Promise<Response> =>
  serveRecordPage(context, {
    apiPath: (id) => `/api/public/events/${id}/seo/`,
    parse: parseEventSeo,
    renderHead: renderEventHead,
    noIndexHead: renderNoIndexHead(),
  })
