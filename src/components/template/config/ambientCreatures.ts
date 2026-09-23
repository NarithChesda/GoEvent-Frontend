import type {
  AmbientCreatureEffectType,
  AmbientCreatureEntry,
  AmbientCreaturesConfig,
  PartnerTemplate,
} from '@/services/api'

export const CREATURE_TYPES: AmbientCreatureEffectType[] = [
  'butterfly',
  'dove',
  'firefly',
  'dragonfly',
  'balloon',
  'hummingbird',
]

export interface AmbientCreaturesSettings {
  creatures: AmbientCreatureEntry[]
  count: number
  speed: 'slow' | 'normal' | 'fast'
  color_source: 'primary' | 'accent' | 'custom'
  custom_color: string
}

export interface AmbientCreaturesFormState {
  ambient_creatures_enabled: boolean
  ambient_creatures: AmbientCreaturesSettings
}

export const defaultAmbientCreatureSettings = (): AmbientCreaturesSettings => ({
  creatures: [{ type: 'butterfly', weight: 1 }],
  count: 6,
  speed: 'normal',
  color_source: 'accent',
  custom_color: '#FFD700',
})

export const defaultAmbientCreatures = (): AmbientCreaturesFormState => ({
  ambient_creatures_enabled: false,
  ambient_creatures: defaultAmbientCreatureSettings(),
})

export function hydrateAmbientCreatures(
  template: PartnerTemplate | null,
): AmbientCreaturesFormState {
  const state = defaultAmbientCreatures()
  const stored = template?.ambient_creatures
  if (!stored) return state

  state.ambient_creatures_enabled = true
  state.ambient_creatures = {
    creatures:
      stored.creatures.length > 0
        ? stored.creatures.map((c) => ({
            type: c.type,
            weight: c.weight ?? 1,
            min_size: c.min_size ?? null,
            max_size: c.max_size ?? null,
          }))
        : [{ type: 'butterfly', weight: 1 }],
    count: stored.count ?? 6,
    speed: stored.speed ?? 'normal',
    color_source: stored.color_source ?? 'accent',
    custom_color: stored.custom_color ?? '#FFD700',
  }
  return state
}

export function buildAmbientCreaturesPayload(
  state: AmbientCreaturesFormState,
): AmbientCreaturesConfig | null {
  if (!state.ambient_creatures_enabled) return null
  const creatures: AmbientCreatureEntry[] = state.ambient_creatures.creatures.map((c) => {
    const entry: AmbientCreatureEntry = { type: c.type, weight: c.weight ?? 1 }
    if (c.min_size != null) entry.min_size = c.min_size
    if (c.max_size != null) entry.max_size = c.max_size
    return entry
  })
  const cfg: AmbientCreaturesConfig = {
    creatures,
    count: state.ambient_creatures.count,
    speed: state.ambient_creatures.speed,
    color_source: state.ambient_creatures.color_source,
  }
  if (state.ambient_creatures.color_source === 'custom') {
    cfg.custom_color = state.ambient_creatures.custom_color
  }
  return cfg
}
