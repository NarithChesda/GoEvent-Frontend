import type { Ref } from 'vue'
import { hostsService, dressCodeService } from '@/services/api'
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
 * provides the returned `save` through InlineEditKey and the same save
 * shapes apply. Saves go through the same services the management form tabs
 * use — the backend enforces permissions on every call.
 *
 * The local copy of `showcaseData` is mutated OPTIMISTICALLY — before the
 * request is sent, not after — and rolled back only if the request fails.
 * The caller (InlineEditableText) leaves edit mode synchronously right after
 * calling `save`, before the request settles; mutating only on success meant
 * the display briefly re-rendered the STALE value for the round-trip's
 * duration, then jumped to the new one once the request landed — a visible
 * flash on every save. Mutating first keeps both changes in the same
 * synchronous tick, so there's nothing stale left to render.
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
          const host = showcaseData.value?.event.hosts?.find((h) => h.id === target.hostId)
          const previous = host?.[target.field] ?? ''
          if (host) host[target.field] = value
          const res = await hostsService.patchHost(eventId, target.hostId, {
            [target.field]: value,
          })
          if (!res.success && host) host[target.field] = previous
          return res
        }
        case 'dressCode': {
          const code = showcaseData.value?.event.dress_codes?.find(
            (d) => d.id === target.dressCodeId,
          )
          const previous = code?.[target.field] ?? ''
          if (code) code[target.field] = value
          const res = await dressCodeService.updateDressCode(eventId, target.dressCodeId, {
            [target.field]: value,
          })
          if (!res.success && code) code[target.field] = previous
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
