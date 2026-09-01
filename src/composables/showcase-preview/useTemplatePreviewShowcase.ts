/**
 * The showcase payload the PUBLIC template preview frame renders.
 *
 * One real published event — chosen by the catalogue page and handed to this
 * frame by id (see useTemplatePreviewEvents) — fetched through the very same
 * public showcase endpoint a guest's invitation link uses. That is the point of
 * doing it this way: the preview is the product, and cannot drift from it the
 * way a checked-in fixture eventually does.
 *
 * It keeps the endpoint's contract, because `useEventShowcase`'s `dataSource`
 * hook is that contract: one call answers ONE language's content, so the
 * initial load, the silent refresh and the in-place language switch downstream
 * all keep working untouched.
 *
 * The bundled sample (useDemoShowcase.ts) stays as the fallback and is used
 * whenever there is no event to fetch or the fetch fails — the flag behind the
 * roster is a new backend field, an event can be unpublished at any moment, and
 * a catalogue with no invitation in it is far worse than one showing a stand-in.
 */
import { eventsService } from '@/services/api'
import type { ShowcaseData } from '@/composables/useEventShowcase'
import { demoPreviewPartner, loadDemoShowcase } from './useDemoShowcase'

export async function loadTemplatePreviewShowcase(
  eventId: string | null,
  language: string,
): Promise<ShowcaseData> {
  if (!eventId) return loadDemoShowcase(language)

  try {
    const response = await eventsService.getEventShowcase(eventId, { lang: language })
    if (response.success && response.data) {
      const data = response.data as ShowcaseData
      // The one substitution. Everything else is the event exactly as a guest
      // would receive it; the shop at the foot of the invitation is replaced by
      // the sample's placeholder, because the caption under these frames tells
      // the visitor that mark will be theirs — see demoPreviewPartner.
      return { ...data, event: { ...data.event, ...demoPreviewPartner() } } as ShowcaseData
    }
  } catch {
    // Fall through — a preview that fails to load is worth replacing with the
    // sample, never with an error page a shop owner has to interpret.
  }

  return loadDemoShowcase(language)
}
