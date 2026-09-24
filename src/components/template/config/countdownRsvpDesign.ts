import {
  COUNTDOWN_DESIGN_TYPES,
  RSVP_DESIGN_TYPES,
  resolveCountdownRsvpDesign,
} from '@/components/showcase/countdown-rsvp/countdownRsvp'
import type {
  CountdownDesignType,
  CountdownRsvpDesignConfig,
  PartnerTemplate,
  RsvpDesignType,
} from '@/services/api'

/**
 * Where the countdown and the RSVP are drawn, and how.
 *
 * `card` is not a design — it stores `null`, which leaves both at the foot of
 * the info card exactly as every template drew them before the section
 * existed, and it is what every such template loads as. `section` gives them a
 * section of their own after the card, in the two designs below; the pair
 * always moves together (see CountdownRsvpDesignConfig for why).
 *
 * The two designs are remembered while the placement is `card`, so switching
 * the section off and on again in one sitting brings back what was picked.
 * They are only saved while it is `section`.
 */
export interface CountdownRsvpFormState {
  countdown_rsvp_placement: 'card' | 'section'
  countdown_design_type: CountdownDesignType
  rsvp_design_type: RsvpDesignType
}

export const defaultCountdownRsvpDesign = (): CountdownRsvpFormState => ({
  countdown_rsvp_placement: 'card',
  countdown_design_type: COUNTDOWN_DESIGN_TYPES[0],
  rsvp_design_type: RSVP_DESIGN_TYPES[0],
})

/**
 * A stored design this build doesn't know opens on the first of its kind —
 * the same design the showcase draws for it — rather than on a picker with
 * nothing selected, which a save would then write back unchanged.
 */
export function hydrateCountdownRsvpDesign(
  template: PartnerTemplate | null,
): CountdownRsvpFormState {
  const resolved = resolveCountdownRsvpDesign(template?.countdown_rsvp_design)
  if (!resolved) return defaultCountdownRsvpDesign()
  return {
    countdown_rsvp_placement: 'section',
    countdown_design_type: resolved.countdown,
    rsvp_design_type: resolved.rsvp,
  }
}

/**
 * `card` persists as `null`, never as an absent key: absent on the wire means
 * "leave this alone", so moving the pair back into the card has to be said.
 */
export const buildCountdownRsvpDesignPayload = (
  state: CountdownRsvpFormState,
): CountdownRsvpDesignConfig | null =>
  state.countdown_rsvp_placement === 'card'
    ? null
    : { countdown: state.countdown_design_type, rsvp: state.rsvp_design_type }
