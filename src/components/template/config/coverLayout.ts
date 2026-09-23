import {
  resolveCoverDetails,
  resolveCoverGilding,
  resolveGuestFrame,
  type ResolvedCoverDetails,
  type ResolvedCoverGilding,
  type ResolvedGuestFrame,
} from '@/composables/showcase/useCoverStageLayout'
import type { CoverStageLayout, PartnerTemplate } from '@/services/api'

/**
 * The form always holds a FULLY populated guest frame config.
 *
 * `Required<CoverStageLayout>` only guarantees the `guestFrame` key exists, not
 * the fields inside it, but every control binds straight to one of those fields
 * with `v-model` — so the form's copy resolves them up front (the same way the
 * showcase's `resolveGuestFrame` does) rather than making each control cope with
 * `undefined`.
 */
export type CoverStageLayoutFormState = Required<CoverStageLayout> & {
  guestFrame: ResolvedGuestFrame
  coverGilding: ResolvedCoverGilding
  coverDetails: ResolvedCoverDetails
}

export interface CoverLayoutFormState {
  cover_stage_layout: CoverStageLayoutFormState
}

export const defaultCoverStageLayout = (): CoverStageLayoutFormState => ({
  layoutMode: 'rows',
  coverElements: {},
  guestFrame: resolveGuestFrame({} as Required<CoverStageLayout>),
  coverGilding: resolveCoverGilding({} as Required<CoverStageLayout>),
  coverDetails: resolveCoverDetails({} as Required<CoverStageLayout>),
  coverText: {},
  contentTopPosition: 23.5,
  innerContainerHeight: 53,
  eventTitleHeight: 18.75,
  logoHeight: 48,
  inviteTextHeight: 8.75,
  guestNameHeight: 16,
  guestNameMaxWidthPercent: 60,
  swipeArrowBottom: 5,
  showWelcomeHeaderText: true,
  showCoverHeaderText: true,
  showCoverLogo: true,
  showCoverInviteText: true,
  showCoverGuestName: true,
  showCoverHosts: false,
  showCoverDate: false,
  showCoverLocation: false,
  showHostNameUnderLogo: true,
  hostClipScale: 60,
  hostClipOffsetX: 50,
  hostClipOffsetY: 50,
  leftDecorationZIndex: 24,
  rightDecorationZIndex: 24,
  topDecorationZIndex: 25,
  bottomDecorationZIndex: 25,
  showcaseAnimationType: 'decoration',
  contentWidth: 'standard',
})

export const defaultCoverLayout = (): CoverLayoutFormState => ({
  cover_stage_layout: defaultCoverStageLayout(),
})

export function hydrateCoverLayout(template: PartnerTemplate | null): CoverLayoutFormState {
  const layout = defaultCoverStageLayout()
  const stored = template?.cover_stage_layout
  if (!stored) return { cover_stage_layout: layout }

  Object.assign(layout, stored)
  // Re-resolve after the assign: a stored `guestFrame` is free to carry only
  // the keys the partner changed (and templates saved before this feature carry
  // none at all), and Object.assign would drop the rest of the object wholesale
  // rather than merging into it. Same reason for the other two.
  const required = stored as Required<CoverStageLayout>
  layout.guestFrame = resolveGuestFrame(required)
  layout.coverGilding = resolveCoverGilding(required)
  layout.coverDetails = resolveCoverDetails(required)
  return { cover_stage_layout: layout }
}

/**
 * The cover layout is stored as the form holds it — it is already in its API
 * shape, which is why it has no transform of its own. It still goes through a
 * builder so that every config reaches the payload the same way, and so there
 * is somewhere obvious to put a transform the day one is needed.
 */
export const buildCoverLayoutPayload = (state: CoverLayoutFormState): CoverStageLayout =>
  state.cover_stage_layout
