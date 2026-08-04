import type { Component } from 'vue'
import type { GuestFrameStyle } from '@/services/api/types/template.types'
import SplitFrame from './SplitFrame.vue'
import SingleFrame from './SingleFrame.vue'
import CornerFrame from './CornerFrame.vue'

export { SplitFrame, SingleFrame, CornerFrame }
export type { GuestFrameArtProps } from './types'

/**
 * The style registry `GuestNameFrame` mounts from.
 *
 * Adding a style means writing one leaf component against `GuestFrameArtProps`
 * and adding it here — the shell holds the name, the measurement and the colour
 * slots, and never learns what any particular style draws.
 */
export const GUEST_FRAME_COMPONENTS: Record<GuestFrameStyle, Component> = {
  split: SplitFrame,
  single: SingleFrame,
  corners: CornerFrame,
}
