/**
 * Which real event the public design catalogue previews a design through.
 *
 * The catalogue used to render ONE bundled sample invitation for every design
 * (useDemoShowcase.ts). That is right for a wedding template and wrong for a
 * funeral one: a shop owner judging a design has to see it carrying the kind of
 * event they would sell it for, and a design catalogue that shows a wedding
 * behind every card is quietly arguing that every design is a wedding design.
 *
 * So the sample is a real published event now, flagged for the job on the
 * backend (`is_template_preview`) and picked on the axis the catalogue is
 * already organised by — the event category the template's package plan names.
 *
 * The pick is resolved HERE, in the page, and never inside a frame. Three
 * frames each choosing their own event would show three different weddings
 * side by side, which reads as three different designs; the page picks one and
 * tells every frame which (see the bridge's `preview-event`).
 *
 * Backend endpoint is PENDING — see
 * docs/backend-api-requirements/template-preview-events.md. Until it lands the
 * roster is empty, `previewEventFor` answers `null`, and the frames render the
 * bundled sample exactly as they did before this existed.
 */
import { ref } from 'vue'
import { eventsService } from '@/services/api'
import type { PaginatedResponse, TemplatePreviewEvent } from '@/services/api'

export function useTemplatePreviewEvents() {
  const previewEvents = ref<TemplatePreviewEvent[]>([])

  /**
   * One pick per category, remembered for the life of the page.
   *
   * Random is a choice made once, not on every read. Re-rolling per click would
   * swap the whole invitation underneath a visitor comparing two designs on the
   * same shelf — and then they are comparing invitations, not designs. Reload
   * the page and the roster is dealt again.
   */
  const chosenByCategory = new Map<number | 'uncategorised', string>()

  const loadTemplatePreviewEvents = async () => {
    try {
      const response = await eventsService.listTemplatePreviewEvents()
      if (!response.success || !response.data) return
      // Paginated or plain, same as the pricing plans this page also reads.
      const data = response.data as
        | TemplatePreviewEvent[]
        | PaginatedResponse<TemplatePreviewEvent>
      previewEvents.value = Array.isArray(data) ? data : (data.results ?? [])
    } catch {
      // Best effort. A catalogue with no roster still previews every design —
      // it just does it through the bundled sample.
      previewEvents.value = []
    }
  }

  /**
   * The event to preview a design of this category through, or `null` for
   * "nothing published for it — use the bundled sample".
   *
   * A flagged event with **no category** is the catch-all: it answers for every
   * type nobody has published a dedicated sample for. Deliberately the only
   * fallback — borrowing another category's event would put a wedding behind a
   * funeral design, which is precisely the failure this replaces.
   */
  const previewEventFor = (categoryId: number | null): string | null => {
    const key = categoryId ?? 'uncategorised'
    const remembered = chosenByCategory.get(key)
    if (remembered) return remembered

    const matching = previewEvents.value.filter((entry) => entry.category === categoryId)
    const pool = matching.length
      ? matching
      : previewEvents.value.filter((entry) => entry.category == null)
    if (!pool.length) return null

    const picked = pool[Math.floor(Math.random() * pool.length)].id
    chosenByCategory.set(key, picked)
    return picked
  }

  return { previewEvents, loadTemplatePreviewEvents, previewEventFor }
}
