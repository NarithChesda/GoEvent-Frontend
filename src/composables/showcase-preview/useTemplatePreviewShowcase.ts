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

/**
 * The three things a preview does not take from the event it draws.
 *
 * Everything else — the wording, the agenda, the photographs, the hosts — is
 * the event exactly as a guest would receive it, which is the whole point of
 * drawing a real one.
 *
 * 1. **The shop at the foot of the invitation** is always the sample's
 *    placeholder, because the caption under these frames tells the visitor that
 *    mark will be theirs; a page selling to shop owners must not stamp a
 *    competitor's logo on that promise (see demoPreviewPartner).
 * 2. **The event's own logos go**, so the cover and the host header fall
 *    through to the design's `sample_logo_1` — the mark the partner uploaded to
 *    be seen here (CoverContentRows resolves event logo → sample_logo_1 →
 *    recoloured stand-in). A real couple's monogram says nothing about the
 *    design, and it hides the one thing that does.
 * 3. **Gift details and dress code stand in from the sample when the event has
 *    none.** These are the two sections a real invitation most often leaves
 *    empty, and a design is being judged on how it renders them: without a
 *    stand-in the partner gets an empty-state card and a bare heading. Only
 *    when the event carries none of its own — an event that has them shows its
 *    own.
 */
async function applyPreviewSubstitutions(
  data: ShowcaseData,
  language: string,
): Promise<ShowcaseData> {
  const event = data.event as ShowcaseData['event'] & {
    payment_methods?: unknown[]
    dress_codes?: unknown[]
  }

  const needsPayments = !event.payment_methods?.length
  const needsDressCodes = !event.dress_codes?.length
  const sample =
    needsPayments || needsDressCodes
      ? ((await loadDemoShowcase(language)).event as typeof event)
      : null

  return {
    ...data,
    event: {
      ...event,
      ...demoPreviewPartner(),
      // undefined, not null: the field is declared optional, and every reader
      // tests it for truthiness before falling through to the sample logo.
      logo_one: undefined,
      logo_two: undefined,
      ...(needsPayments && sample ? { payment_methods: sample.payment_methods } : {}),
      ...(needsDressCodes && sample ? { dress_codes: sample.dress_codes } : {}),
    },
  } as ShowcaseData
}

export async function loadTemplatePreviewShowcase(
  eventId: string | null,
  language: string,
): Promise<ShowcaseData> {
  // The sample is substituted into as well, so a preview drawn from it and one
  // drawn from a real event differ in content and never in what is on screen.
  if (!eventId) return applyPreviewSubstitutions(await loadDemoShowcase(language), language)

  try {
    const response = await eventsService.getEventShowcase(eventId, { lang: language })
    if (response.success && response.data) {
      return applyPreviewSubstitutions(response.data as ShowcaseData, language)
    }
  } catch {
    // Fall through — a preview that fails to load is worth replacing with the
    // sample, never with an error page a shop owner has to interpret.
  }

  return applyPreviewSubstitutions(await loadDemoShowcase(language), language)
}
