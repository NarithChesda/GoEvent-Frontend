import type { Ref } from 'vue'
import { agendaService, hostsService, dressCodeService } from '@/services/api'
import { saveEventTextField } from '@/utils/eventTextUpsert'
import type { InlineEditTarget } from '@/components/showcase-preview/edit/editContext'
import type { ShowcaseData, EventData } from '@/composables/useEventShowcase'

interface UseShowcaseEditSavesOptions {
  event: Ref<EventData>
  showcaseData: Ref<ShowcaseData | null>
  currentLanguage: Ref<string>
}

/**
 * The inline-edit save switchboard for the showcase preview frames. Renderer
 * agnostic: any preview renderer (V1 stages today, V2 scroll-story later)
 * provides the returned `save` through InlineEditKey and the same four save
 * shapes apply. Saves go through the same services the management form tabs
 * use — the backend enforces permissions on every call — and on success the
 * loaded showcase data is mutated in place so the frame updates live without
 * a refetch.
 */
export function useShowcaseEditSaves(options: UseShowcaseEditSavesOptions) {
  const { event, showcaseData, currentLanguage } = options

  const save = async (target: InlineEditTarget, value: string) => {
    const eventId = event.value.id
    if (!eventId) return { success: false, message: 'Event not loaded' }

    try {
      switch (target.kind) {
        case 'eventText': {
          const texts = showcaseData.value?.event.event_texts ?? []
          return await saveEventTextField(eventId, texts, {
            textType: target.textType,
            language: currentLanguage.value,
            field: target.field,
            value,
          })
        }
        case 'host': {
          const res = await hostsService.patchHost(eventId, target.hostId, {
            [target.field]: value,
          })
          const host = showcaseData.value?.event.hosts?.find((h) => h.id === target.hostId)
          if (res.success && host) host[target.field] = value
          return res
        }
        case 'agenda': {
          const res = await agendaService.patchAgendaItem(eventId, target.agendaId, {
            title: value,
          })
          const item = showcaseData.value?.event.agenda_items?.find(
            (a) => a.id === target.agendaId,
          )
          if (res.success && item) item.title = value
          return res
        }
        case 'dressCode': {
          const res = await dressCodeService.updateDressCode(eventId, target.dressCodeId, {
            [target.field]: value,
          })
          const code = showcaseData.value?.event.dress_codes?.find(
            (d) => d.id === target.dressCodeId,
          )
          if (res.success && code) code[target.field] = value
          return res
        }
      }
    } catch (err) {
      console.warn('Inline edit save failed:', err)
      return { success: false, message: err instanceof Error ? err.message : 'Save failed' }
    }
  }

  return { save }
}
