import type { Ref } from 'vue'
import { hostsService, dressCodeService, type HostTranslation } from '@/services/api'
import { saveEventTextField } from '@/utils/eventTextUpsert'
import type { InlineEditTarget } from '@/components/showcase-preview/edit/editContext'
import type { ShowcaseData, EventData } from '@/composables/useEventShowcase'

interface UseShowcaseEditSavesOptions {
  event: Ref<EventData>
  showcaseData: Ref<ShowcaseData | null>
  currentLanguage: Ref<string>
}

type HostTextField = Extract<InlineEditTarget, { kind: 'host' }>['field']
type WritableHostTranslation = Omit<HostTranslation, 'id' | 'host' | 'created_at' | 'updated_at'>

/**
 * The language a host's own fields are written in. Every other language is a
 * row in its `translations[]` — EditHostDrawer's split exactly: an English card
 * over the base fields, one card per translation, and no way to add an `en` row.
 */
const HOST_BASE_LANGUAGE = 'en'

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

  // One write chain per host. A translated edit rewrites the host's whole
  // translations array (the API replaces it wholesale), so two edits in flight
  // on one host — the name, then the title before the name has landed — would
  // both read the same array, and the second PATCH would undo the first.
  const hostWrites = new Map<number, Promise<unknown>>()

  /**
   * Writes one host field in the language the preview is showing.
   *
   * The showcase hands this frame hosts already flattened to that language — a
   * translation row, when one exists, replaces the base fields wholesale — so a
   * PATCH of the bare field always wrote the English base, whatever was on
   * screen. Every other language goes through `translations[]`, read from the
   * host itself because the showcase copy doesn't carry it.
   */
  const writeHostField = (
    eventId: string,
    hostId: number,
    field: HostTextField,
    value: string,
    language: string,
  ) => {
    const write = async () => {
      if (language === HOST_BASE_LANGUAGE) {
        return hostsService.patchHost(eventId, hostId, { [field]: value })
      }

      const current = await hostsService.getHost(eventId, hostId)
      if (!current.success || !current.data) return current
      const host = current.data

      const translations: WritableHostTranslation[] = (host.translations ?? []).map((t) => ({
        language: t.language,
        name: t.name ?? '',
        parent_a_name: t.parent_a_name ?? '',
        parent_b_name: t.parent_b_name ?? '',
        title: t.title ?? '',
        bio: t.bio ?? '',
      }))

      const existing = translations.find((t) => t.language === language)
      if (existing) {
        existing[field] = value
      } else {
        // Seeded from the base fields, because that is what this language was
        // showing: with no row of its own it falls back to the base host. A row
        // holding only this edit would blank every other field the moment it
        // exists, since a translation replaces them all.
        translations.push({
          language,
          name: host.name ?? '',
          parent_a_name: host.parent_a_name ?? '',
          parent_b_name: host.parent_b_name ?? '',
          title: host.title ?? '',
          bio: host.bio ?? '',
          [field]: value,
        })
      }

      return hostsService.patchHost(eventId, hostId, { translations })
    }

    const queued = (hostWrites.get(hostId) ?? Promise.resolve()).then(write)
    hostWrites.set(hostId, queued.catch(() => undefined))
    return queued
  }

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
          // Read now, not after the queue: a language switch while this write
          // waits its turn must not move it onto the new language.
          const res = await writeHostField(
            eventId,
            target.hostId,
            target.field,
            value,
            currentLanguage.value,
          )
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
