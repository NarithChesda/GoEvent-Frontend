import type { ResolvedGuestFrame } from '@/composables/showcase/useCoverStageLayout'

/**
 * The props EVERY guest-frame artwork component takes, whatever style it draws.
 *
 * Uniform on purpose: `GuestNameFrame` mounts the active style through a single
 * `<component :is>` with one `v-bind`, so a style is free to ignore the slots it
 * doesn't use (`single` reads only `midUrl`, `corners` only left/right) and
 * adding a fourth style later costs one leaf component plus one registry entry —
 * no change to the shell's wiring.
 *
 * URLs arrive already resolved through `getMediaUrl` and are `null` when the
 * template has nothing in that slot; a component must render nothing rather than
 * an empty `<img>` in that case.
 */
export interface GuestFrameArtProps {
  leftUrl: string | null
  midUrl: string | null
  rightUrl: string | null
  config: ResolvedGuestFrame
}
