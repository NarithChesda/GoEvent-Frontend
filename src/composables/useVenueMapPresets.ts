import { computed, type Ref } from 'vue'
import venuePresetsData from '@/assets/venue-map-presets.json'
import { useAppLanguage } from '@/composables/useAppLanguage'

export interface VenueMapPreset {
  id: string
  name: string
  nameKh?: string
  city?: string
  cityKh?: string
  embedUrl: string
}

/**
 * Curated venue presets, editable in src/assets/venue-map-presets.json — no
 * backend involved. A preset only ever writes its `embedUrl` into the event's
 * google_map_embed_link, so the stored data is identical to a hand-pasted link
 * and editing/removing a preset never breaks an already-saved event.
 */
const presets = (venuePresetsData.presets ?? []) as VenueMapPreset[]

export function useVenueMapPresets(currentLink?: Ref<string | undefined | null>) {
  const { locale } = useAppLanguage()

  const isKhmer = computed(() => locale.value === 'kh')

  const localizedPresets = computed(() =>
    presets.map((preset) => ({
      ...preset,
      displayName: (isKhmer.value && preset.nameKh) || preset.name,
      displayCity: (isKhmer.value && preset.cityKh) || preset.city || '',
    })),
  )

  /** The preset id matching the saved link, if the user picked one. */
  const activePresetId = computed(() => {
    const link = currentLink?.value
    if (!link) return null
    return presets.find((preset) => preset.embedUrl === link)?.id ?? null
  })

  return { presets: localizedPresets, activePresetId, hasPresets: presets.length > 0 }
}

/** Whether a saved link came from the curated list rather than a manual paste. */
export function isPresetUrl(link: string): boolean {
  return presets.some((preset) => preset.embedUrl === link)
}
