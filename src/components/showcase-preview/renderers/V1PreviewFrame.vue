<template>
  <!-- Cover and Main Content both render through CoverStage, exactly like
       production (EventShowcaseRefactored.vue) — MainContentStage has no
       background of its own, it's visually layered on top of CoverStage's
       VideoContainer (rendered unconditionally inside CoverStage). Mounting
       MainContentStage standalone silently drops that background. Forcing
       current-showcase-stage picks which layer is visible, bypassing the
       redirect manager's "already seen main content" heuristic. -->
  <CoverStage
    v-if="stage === 'cover' || stage === 'main'"
    :key="videoPipelineKey"
    :template-assets="templateAssets"
    :template-colors="templateColors"
    :guest-name="guestName"
    :event-title="event.title"
    :event-logo="event.logo_one"
    :first-host-image="hosts[0]?.profile_image || null"
    :first-host-name="hosts[0]?.name || ''"
    :first-host-id="hosts[0]?.id ?? null"
    :event-video-url="eventVideoUrl"
    :background-video-url="backgroundVideoUrl"
    :primary-color="primaryColor"
    :secondary-color="secondaryColor"
    :accent-color="accentColor"
    :background-color="backgroundColor"
    :guestname-color="guestnameColor"
    :template-color="templateColor"
    :current-font="currentFont"
    :primary-font="primaryFont"
    :secondary-font="secondaryFont"
    :accent-font="accentFont"
    :decorative-font="decorativeFont"
    :event-texts="eventTexts"
    :current-language="currentLanguage"
    :current-showcase-stage="stage === 'main' ? 'main_content' : 'cover'"
    :should-skip-to-main-content="false"
    :content-top-position="event.template_assets?.cover_content_top_position"
    :cover-stage-layout="coverStageLayout"
    :cover-top-decoration="event.template_assets?.assets?.cover_top_decoration"
    :cover-bottom-decoration="event.template_assets?.assets?.cover_bottom_decoration"
    :cover-left-decoration="event.template_assets?.assets?.cover_left_decoration"
    :cover-right-decoration="event.template_assets?.assets?.cover_right_decoration"
    :animation-type="event.template_assets?.cover_stage_layout?.showcaseAnimationType"
    :ambient-creatures="event.template_assets?.ambient_creatures"
    :falling-effect="event.template_assets?.falling_effect"
    :sparks="event.template_assets?.sparks"
    :stage-modes="stageModes"
    :get-media-url="getMediaUrl"
    :disable-envelope-interaction="true"
    :show-swipe-arrow="true"
  >
    <template #main-content>
      <MainContentStage
        v-if="stage === 'main'"
        :template-assets="templateAssets"
        :event="event"
        :event-texts="eventTexts"
        :hosts="hosts"
        :agenda-items="agendaItems"
        :event-photos="eventPhotos"
        :payment-methods="paymentMethods"
        :dress-codes="dressCodes"
        :primary-color="primaryColor"
        :secondary-color="secondaryColor"
        :accent-color="accentColor"
        :background-color="backgroundColor"
        :template-color="templateColor"
        :current-font="currentFont"
        :primary-font="primaryFont"
        :secondary-font="secondaryFont"
        :is-event-past="isEventPast"
        :get-media-url="getMediaUrl"
        :available-languages="availableLanguages"
        :current-language="currentLanguage"
        :guest-name="guestName"
        :guest-shortcode="guestShortcode"
        :is-music-playing="isMusicPlaying"
        :content-loading="contentLoading"
        :top-decoration="event.template_assets?.assets?.top_decoration || event.top_decoration"
        :bottom-decoration="event.template_assets?.assets?.bottom_decoration || event.bottom_decoration"
        :left-decoration="event.template_assets?.assets?.left_decoration || event.left_decoration"
        :right-decoration="event.template_assets?.assets?.right_decoration || event.right_decoration"
        :animation-type="event.template_assets?.cover_stage_layout?.showcaseAnimationType"
        :main-stage-layout="event.template_assets?.cover_stage_layout"
        :event-details-design="event.template_assets?.event_details_design"
        :host-info-design="event.template_assets?.host_info_design"
        :info-card-design="event.template_assets?.info_card_design"
        :agenda-design="event.template_assets?.agenda_design"
        :dress-code-design="event.template_assets?.dress_code_design"
        @open-map="openGoogleMap"
        @open-photo="openPhotoModal"
        @change-language="changeLanguage"
        @music-toggle="toggleMusic"
      />
    </template>
  </CoverStage>

  <!-- Standard templates' middle stage (see the frame registry): the transition
       stage never runs for them, the event video does. -->
  <V1EventVideoStage
    v-else-if="stage === 'event_video'"
    :event-video-url="eventVideoUrl"
    :primary-color="primaryColor"
    :replay-key="replayKey"
  />

  <!-- Whichever transition the template's cover animation is paired with, same
       as the live showcase picks it (see EventShowcaseRefactored.vue). -->
  <TransitionStageDoor
    v-else-if="stage === 'transition' && isDoorTransition"
    :key="replayKey"
    :freeze-at-peak="true"
    :event-title="event.title"
    :event-photos="eventPhotos"
    :event-start-date="event.start_date"
    :primary-color="primaryColor"
    :accent-color="accentColor"
    :background-color="backgroundColor"
    :blur-effect-color="blurEffectColor"
    :falling-effect="event.template_assets?.falling_effect"
    :save-the-date-design="event.template_assets?.save_the_date_design"
    :get-media-url="getMediaUrl"
  />

  <TransitionStage
    v-else-if="stage === 'transition'"
    :key="replayKey"
    :freeze-at-peak="true"
    :event-title="event.title"
    :event-logo="event.logo_one"
    :event-photos="eventPhotos"
    :event-start-date="event.start_date"
    :primary-color="primaryColor"
    :secondary-color="secondaryColor"
    :accent-color="accentColor"
    :background-color="backgroundColor"
    :blur-effect-color="blurEffectColor"
    :falling-effect="event.template_assets?.falling_effect"
    :save-the-date-design="event.template_assets?.save_the_date_design"
    :get-media-url="getMediaUrl"
  />

  <!-- Direct-manipulation cover layout. A sibling of CoverStage rather than
       something inside it: the boxes are percentages of the whole stage, and
       this element IS the whole stage, so overlay coordinates and rendered
       coordinates are the same numbers with no conversion anywhere. -->
  <CoverLayoutEditor
    v-if="coverLayoutEdit?.active.value && stage === 'cover'"
    :elements="coverElements"
    :visible="coverElementVisibility"
    :palette="coverTextPalette"
    :selected="coverLayoutEdit.selected.value"
    @select="onCoverLayoutSelect"
    @change="onCoverLayoutChange"
    @dragging="onCoverLayoutDragging"
  />

  <!-- Only rendered once a photo has actually been opened, so its chunk is not
       part of any frame's initial load. Visually identical to rendering it
       always: the component's own root is `v-if="isOpen"`, with no enter
       transition to lose. It stays mounted afterwards so reopening is
       instant. -->
  <PhotoModal
    v-if="photoModalEverOpened"
    :is-open="isPhotoModalOpen"
    :photos="eventPhotos"
    :current-photo="currentModalPhoto"
    :get-media-url="getMediaUrl"
    @close="closePhotoModal"
    @navigate="navigateToPhoto"
  />
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import type { useEventShowcase } from '@/composables/useEventShowcase'
import { resolveStageModesForEvent } from '@/composables/showcase/useStageModes'
import {
  useCoverStageLayout,
  type CoverTextPalette,
} from '@/composables/showcase/useCoverStageLayout'
import { CoverLayoutEditKey } from '@/components/showcase-preview/edit/coverLayoutEditContext'
import {
  postCoverLayoutChangeToParent,
  postCoverLayoutSelection,
} from '@/components/showcase-preview/bridge/previewBridge'
import type {
  CoverElementBoxes,
  CoverElementId,
  CoverStageLayout,
} from '@/services/api/types/template.types'
// Every stage is a separate lazily loaded chunk — a frame renders one of them,
// so it should download one of them. See v1StageComponents.ts.
import {
  CoverStage,
  CoverLayoutEditor,
  V1EventVideoStage,
  TransitionStage,
  TransitionStageDoor,
  MainContentStage,
  PhotoModal,
} from './v1StageComponents'

interface Props {
  /** The frame shell's loaded showcase state — shared, not refetched here. */
  showcase: ReturnType<typeof useEventShowcase>
  /** Which of this renderer's declared frames to show (see the registry). */
  stage: string
  /** Bumped by the shell on a bridge `replay` command — remounts the
   *  transition stage so its whole mount animation runs again. */
  replayKey: number
}

const props = defineProps<Props>()

// Top-level refs so the template unwraps them like production does.
const {
  event,
  templateAssets,
  templateColors,
  eventTexts,
  hosts,
  agendaItems,
  eventPhotos,
  paymentMethods,
  dressCodes,
  guestName,
  guestShortcode,
  primaryColor,
  secondaryColor,
  accentColor,
  backgroundColor,
  guestnameColor,
  templateColor,
  blurEffectColor,
  currentFont,
  primaryFont,
  secondaryFont,
  accentFont,
  decorativeFont,
  isEventPast,
  eventVideoUrl,
  backgroundVideoUrl,
  availableLanguages,
  currentLanguage,
  contentLoading,
  isMusicPlaying,
  isPhotoModalOpen,
  currentModalPhoto,
  getMediaUrl,
  openGoogleMap,
  openPhotoModal,
  closePhotoModal,
  navigateToPhoto,
  changeLanguage,
  toggleMusic,
} = props.showcase

// Latches on the first photo-modal open and never resets — that's what keeps
// the modal's chunk (and the modal itself) out of the frame's initial load
// while still letting it stay mounted once the user has used it.
const photoModalEverOpened = ref(false)
watch(isPhotoModalOpen, (open) => {
  if (open) photoModalEverOpened.value = true
})

// useCoverStageVideo takes a one-off SNAPSHOT of its video URLs at CoverStage's
// setup and never re-reads them (the object CoverStage hands it is built from
// plain prop reads, not a reactive source). In the live showcase that's fine —
// the showcase endpoint delivers template_assets with the very first response.
// Here it isn't: the studio backfills an unpaid template's assets from the
// public endpoint AFTER the first load, and the Templates modal stages a
// candidate template into an already-mounted frame. Either way the URLs arrive
// late, and the video pipeline would stay pinned to the empty snapshot — a
// standard template's background video simply never plays. Remounting when the
// URLs actually change re-initializes it with the real ones. Content-only saves
// don't touch these, so this doesn't reintroduce reload-on-every-edit.
const videoPipelineKey = computed(() =>
  [
    eventVideoUrl.value || '',
    backgroundVideoUrl.value || '',
    event.value?.template_assets?.assets?.standard_cover_video || '',
  ].join('|'),
)

// ---------------------------------------------------------------------------
// Cover layout editing. Inert unless the frame shell provided the context (only
// the partner template editor asks for it), so nothing below costs the live
// showcase or a read-only preview anything.
// ---------------------------------------------------------------------------
const coverLayoutEdit = inject(CoverLayoutEditKey, undefined)

/**
 * The template's cover layout with any in-flight drag laid over it.
 *
 * The override is what makes dragging feel local: it renders the block at the
 * new position on the same frame the pointer moved, instead of waiting for the
 * value to reach the editor pane, get debounced, and come back as a template
 * push. Forcing `layoutMode: 'free'` alongside it means a partner can drag a
 * block while the template is still nominally on rows and see the result — the
 * editor pane flips the real mode when they commit.
 */
const coverStageLayout = computed<CoverStageLayout | undefined>(() => {
  const base = event.value?.template_assets?.cover_stage_layout ?? undefined
  const override = coverLayoutEdit?.override.value
  if (!override) return base
  return {
    ...(base ?? {}),
    layoutMode: 'free',
    coverElements: { ...(base?.coverElements ?? {}), ...override },
  }
})

// The same resolution the cover itself runs, so the overlay's handles are drawn
// from exactly the boxes the blocks rendered at — never a parallel calculation.
const { layout: resolvedCoverLayout, elements: coverElements } = useCoverStageLayout(
  coverStageLayout,
  computed(() => event.value?.template_assets?.cover_content_top_position),
)

/**
 * The palette the overlay's colour swatches offer, resolved exactly as the
 * cover resolves it — so a dot in the toolbar is the colour the text will
 * actually take, including whatever fallbacks the template's own palette needs.
 */
const coverTextPalette = computed<CoverTextPalette>(() => ({
  primary: primaryColor.value,
  secondary: secondaryColor.value,
  accent: accentColor.value,
  guestname: guestnameColor.value,
}))

/** Which blocks the cover is actually rendering, and so which are draggable. */
const coverElementVisibility = computed<Record<CoverElementId, boolean>>(() => ({
  header: resolvedCoverLayout.value.showCoverHeaderText,
  logo: true,
  // Both are gated on a guest name in CoverContentRows. Preview frames always
  // have one (useDefaultGuestName), but a frame opened without it shouldn't
  // offer handles for blocks that aren't on screen.
  invite: !!guestName.value,
  guest: !!guestName.value,
}))

const onCoverLayoutChange = (elements: CoverElementBoxes, commit: boolean): void => {
  if (coverLayoutEdit) coverLayoutEdit.override.value = elements
  postCoverLayoutChangeToParent(elements, commit)
}

const onCoverLayoutSelect = (id: CoverElementId | null): void => {
  if (coverLayoutEdit) coverLayoutEdit.selected.value = id
  // Only ever an iframe in practice; the guard keeps a standalone visit to the
  // frame route from posting selection messages to itself.
  if (window.parent !== window) postCoverLayoutSelection(window.parent, id)
}

const onCoverLayoutDragging = (value: boolean): void => {
  if (coverLayoutEdit) coverLayoutEdit.dragging.value = value
}

// Which transition stage this template's cover animation is paired with —
// resolved exactly as the live showcase resolves it.
const isDoorTransition = computed(
  () => event.value?.template_assets?.cover_stage_layout?.showcaseAnimationType === 'door',
)

// Resolved by the same function the live showcase uses, so the frame draws
// the backdrop, the cover exit and the hand-off its guests will actually see.
const stageModes = computed(() => resolveStageModesForEvent(event.value))
</script>
