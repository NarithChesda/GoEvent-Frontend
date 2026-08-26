<template>
  <div
    class="absolute inset-0 z-10 transition-opacity duration-700 ease-out"
    :class="{ 'opacity-0': shouldSkipToMainContent }"
    :style="{ backgroundColor: primaryColor }"
  >
    <!-- VideoContainer - stays visible for background -->
    <VideoContainer
      ref="videoContainerRef"
      :template-assets="templateAssets"
      :template-colors="templateColors"
      :template-color="templateColor"
      :event-title="eventTitle"
      :event-video-url="eventVideoUrl"
      :background-video-url="backgroundVideoUrl"
      :is-cover-video-playing="videoState.isCoverVideoPlaying.value"
      :current-video-phase="videoState.currentVideoPhase.value"
      :get-media-url="getMediaUrl"
      :is-content-hidden="videoState.isContentHidden.value"
      :animation-type="animationType"
      :keep-decoration-background="keepDecorationBackground"
      :skip-decoration-slide-up="skipDecorationSlideUp"
      @sequential-video-ended="videoState.handleSequentialVideoEnded"
      @sequential-video-error="videoState.handleSequentialVideoError"
      @event-video-preloaded="videoState.handleEventVideoPreloaded"
      @event-video-ready="videoState.handleEventVideoReady"
      @background-video-preloaded="videoState.handleBackgroundVideoPreloaded"
      @background-video-ready="videoState.handleBackgroundVideoReady"
      @cover-video-loaded="videoState.handleCoverVideoLoaded"
    />

    <!-- Cover Content Overlay (Stage 1) -->
    <CoverContentOverlay
      v-if="shouldShowCoverContent"
      :is-content-hidden="videoState.isContentHidden.value"
      :event-title="eventTitle"
      :event-logo="eventLogo"
      :first-host-image="firstHostImage"
      :first-host-name="firstHostName"
      :first-host-id="firstHostId"
      :guest-name="guestName || null"
      :template-assets="templateAssets"
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
      :should-show-button-loading="videoState.shouldShowButtonLoading.value"
      :is-interaction-disabled="isEnvelopeInteractionDisabled"
      :show-swipe-arrow="showSwipeArrow"
      :get-media-url="getMediaUrl"
      :content-top-position="contentTopPosition"
      :cover-stage-layout="coverStageLayout"
      :cover-top-decoration="coverTopDecoration"
      :cover-bottom-decoration="coverBottomDecoration"
      :cover-left-decoration="coverLeftDecoration"
      :cover-right-decoration="coverRightDecoration"
      :animation-type="animationType"
      :ambient-creatures="props.ambientCreatures"
      @open-envelope="handleOpenEnvelope"
    />

    <!-- Falling particle field (petals, leaves, custom image, …). Deliberately
         owned by CoverStage rather than by any one stage: CoverStage is mounted
         for the whole showcase, so a single field drifts unbroken from cover
         through the transition and on into the main content — the petals never
         restart at a stage boundary. `fallingEffectZIndex` re-layers it instead:
         above the cover artwork and the door panels while the cover is up, then
         behind the main content card once that takes over, which is where this
         effect has always sat. -->
    <FallingEffect
      :key="fallingEffectKey"
      :config="fallingEffect"
      :primary-color="primaryColor"
      :accent-color="accentColor"
      :get-media-url="getMediaUrl"
      :z-index="fallingEffectZIndex"
      :style="fallingEffectHandoffStyle"
    />

    <!-- The drifting spark field, owned here for exactly the reason the falling
         field above is: one field mounted for the life of the showcase drifts
         unbroken from the cover into the main content, where a second field
         spawned by MainContentStage would visibly restart at the boundary and
         double the density across it.

         Configured standalone via `template_assets.sparks` — it is an
         independent decoration, not a gilding layer. The gilding is still handed
         down as the legacy fallback for templates saved before that split, and
         for its band inset, which is the framing the motes have always used. The
         band lighting itself stays in CoverGilding — that is light on a surface,
         so it travels with the surface (and in door mode, off-screen with the
         leaf). -->
    <CoverSparks
      :key="sparkFieldKey"
      :config="sparks"
      :gilding="coverGilding"
      :primary-color="primaryColor"
      :secondary-color="secondaryColor"
      :accent-color="accentColor"
      :get-media-url="getMediaUrl"
      :inset="coverGilding.bandInner"
      :z-index="sparkFieldZIndex"
    />

    <!-- Main Content Overlay (Stage 3 - Background Video) -->
    <div
      v-if="shouldShowMainContent"
      class="absolute inset-0 z-20"
    >
      <slot name="main-content"></slot>
    </div>

    <!-- Transition stage layer. Deliberately *inside* CoverStage rather than a
         sibling of it: at z-25 it sits under the door panels (z-28) and over
         the main content (z-20), so the doors genuinely part to reveal it
         instead of it cross-fading on top of them. Empty (and inert) for
         templates whose transition renders as a sibling instead. -->
    <div class="absolute inset-0 z-[25] pointer-events-none">
      <slot name="transition"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useCoverStageVideo, type ShowcaseStage } from '@/composables/showcase/useCoverStageVideo'
import { useDoorAnimation, DOOR_CLEARED_MS } from '@/composables/showcase/useDoorAnimation'
import { fallingEffectKeyOf } from '@/composables/showcase/useFallingParticles'
import type {
  CoverStageLayout,
  AmbientCreaturesConfig,
  FallingEffectConfig,
  SparkFieldConfig,
} from '@/services/api/types/template.types'
import { sparkFieldKeyOf } from '@/composables/showcase/useSparkField'
import type { ShowcaseAnimationType } from '@/composables/showcase/useShowcaseAnimation'
import { useCoverStageLayout } from '@/composables/showcase/useCoverStageLayout'
import VideoContainer from './VideoContainer.vue'
import CoverContentOverlay from './CoverContentOverlay.vue'
import FallingEffect from './FallingEffect.vue'
import CoverSparks from './cover/CoverSparks.vue'

export type DisplayMode = 'basic' | 'standard'

// Local interface for template assets used by this component
interface CoverStageTemplateAssets {
  standard_cover_video?: string
  basic_background_photo?: string
  basic_decoration_photo?: string
  open_envelope_button?: string
}

interface EventText {
  text_type: string
  language: string
  content: string
}

interface TemplateColor {
  id?: number
  hex_color_code?: string
  hex_code?: string
  name?: string
}

interface Props {
  templateAssets?: CoverStageTemplateAssets | null
  templateColors?: TemplateColor[] | null
  guestName: string
  eventTitle: string
  eventLogo?: string | null
  /** First host profile image — clipped by sample_logo_2 in the merged logo row when the cover header is hidden. */
  firstHostImage?: string | null
  /** First host display name — used as the alt text for the clipped host image. */
  firstHostName?: string
  /** First host id — routes the preview editor to the host drawer when the logo row frames that host's photo. */
  firstHostId?: number | null
  eventVideoUrl?: string | null
  backgroundVideoUrl?: string | null
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  backgroundColor?: string
  guestnameColor?: string | null
  templateColor?: string | null
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  /** Forwarded only so free-placed cover blocks can point at these font slots. */
  accentFont?: string
  decorativeFont?: string
  eventTexts?: EventText[]
  currentLanguage?: string
  isEnvelopeButtonReady?: boolean
  currentShowcaseStage?: ShowcaseStage
  shouldSkipToMainContent?: boolean
  videoStatePreserved?: boolean
  getMediaUrl: (url: string) => string
  /** @deprecated Use coverStageLayout.contentTopPosition instead */
  contentTopPosition?: number
  coverStageLayout?: CoverStageLayout
  coverTopDecoration?: string | null
  coverBottomDecoration?: string | null
  coverLeftDecoration?: string | null
  coverRightDecoration?: string | null
  /** Showcase animation type from template_assets.showcase_animation_type */
  animationType?: ShowcaseAnimationType
  /** Ambient creature effect config from template_assets. Only renders when provided. */
  ambientCreatures?: AmbientCreaturesConfig | null
  /** Falling particle effect config from template_assets. Spans every stage. */
  fallingEffect?: FallingEffectConfig | null
  /** Drifting spark field config from template_assets. Spans every stage.
   *  Absent = fall back to the legacy cover-gilding spark fields. */
  sparks?: SparkFieldConfig | null
  /** True while a transition stage that runs its OWN falling field is on
   *  screen, so this one yields to it instead of drawing over the top. */
  transitionOwnsFallingField?: boolean
  /** When true, basic mode will only animate decorations out without transitioning to main content */
  useTransitionStage?: boolean
  /** Manage-page preview only: always block the open-envelope tap/swipe so
   *  the cover renders as a static "what it looks like" view instead of
   *  being interactive. Never set on the live showcase. */
  disableEnvelopeInteraction?: boolean
  /** Force the swipe-up arrow on/off, independently of whether the envelope can
   *  be opened. Unset follows the interaction state. Set to `true` by the
   *  preview so `cover_stage_layout.swipeArrowBottom` stays visible there. */
  showSwipeArrow?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  openEnvelope: []
  coverStageReady: []
  eventVideoLoadStarted: []
  eventVideoPreloaded: []
  eventVideoReady: []
  backgroundVideoLoadStarted: []
  sequentialVideoReady: []
  sequentialVideoEnded: []
  playEventVideo: []
  playBackgroundVideo: []
}>()

// Template ref for video container
const videoContainerRef = ref<InstanceType<typeof VideoContainer> | null>(null)

// Display mode based on whether standard_cover_video exists
const displayMode = computed<DisplayMode>(() => {
  return props.templateAssets?.standard_cover_video ? 'standard' : 'basic'
})

// Animation type from prop with fallback to 'decoration'
const animationType = computed<ShowcaseAnimationType>(() => {
  return props.animationType || 'decoration'
})

// Video state management composable
const videoState = useCoverStageVideo(
  {
    eventVideoPreloader: () => videoContainerRef.value?.eventVideoPreloader || null,
    sequentialVideoContainer: () => videoContainerRef.value?.sequentialVideoContainer || null,
    coverVideoElement: () => videoContainerRef.value?.coverVideoElement || null,
    backgroundVideoElement: () => videoContainerRef.value?.backgroundVideoElement || null,
  },
  {
    eventVideoUrl: props.eventVideoUrl,
    backgroundVideoUrl: props.backgroundVideoUrl,
    currentShowcaseStage: props.currentShowcaseStage,
    shouldSkipToMainContent: props.shouldSkipToMainContent,
    videoStatePreserved: props.videoStatePreserved,
    templateAssets: props.templateAssets,
    displayMode: displayMode.value,
  },
  (event, ...args) => {
    (emit as any)(event, ...args)
  },
)

// Door animation state management
const { isDoorAnimation, isDoorAnimationInProgress, startDoorAnimation, clearAfterTimeout } = useDoorAnimation({
  animationType,
  currentVideoPhase: videoState.currentVideoPhase,
})

/**
 * Mount the main-content slot while the showcase stage is still `transition`.
 *
 * Set by the parent when TransitionStage begins its dissolve, so that dissolve
 * cross-fades into the invitation instead of fading back to the cover. It has
 * to be a flag of its own: every other route to `shouldShowMainContent` runs
 * through the video state machine, whose `skipToMainContent` ends the
 * transition stage as a side effect.
 */
const isMainContentPreRevealed = ref(false)
const preRevealMainContent = () => {
  isMainContentPreRevealed.value = true
}

// Keep decoration photo background during transition stage — but hand it over
// to the main stage's own backdrop the moment the invitation is mounted, so the
// two backdrops cross-fade under the dissolve rather than swapping on the frame
// the stage unmounts.
const keepDecorationBackground = computed(() => {
  return (
    props.useTransitionStage &&
    props.currentShowcaseStage === 'transition' &&
    !isMainContentPreRevealed.value
  )
})

// Skip slide-up animation for decoration photo when using transition stage
// (after transition completes, hide instantly instead of sliding up)
const skipDecorationSlideUp = computed(() => {
  return props.useTransitionStage === true
})

// Computed visibility flags
const shouldShowCoverContent = computed(() => {
  // During door animation, keep cover content (including door panels) visible
  // so the CSS 3D rotation transition can complete, regardless of showcase stage.
  // The doors are at z-28 and will visually hide main content at z-20 behind them.
  if (isDoorAnimation.value && isDoorAnimationInProgress.value) return true
  // Hide cover once the main content stage is active
  if (props.currentShowcaseStage === 'main_content') return false
  return (videoState.currentVideoPhase.value === 'none' || isDoorAnimationInProgress.value)
    && !props.shouldSkipToMainContent
})

const shouldShowMainContent = computed(() => {
  // Always show main content when stage has already transitioned
  if (props.currentShowcaseStage === 'main_content') return true
  // Mounted early, behind a dissolving transition stage — see preRevealMainContent
  if (isMainContentPreRevealed.value) return true
  // When transition stage is responsible for revealing main content, don't render
  // main content during the door animation. The decoration-mode TransitionStage
  // sits at z-35 above CoverStage (z-10) but starts transparent, so main content
  // would show through it as the door opens; the door-mode stage renders in the
  // `transition` slot above, which likewise has nothing to reveal yet.
  if (props.useTransitionStage && isDoorAnimationInProgress.value) return false
  return videoState.currentVideoPhase.value === 'background'
    || props.shouldSkipToMainContent
    || isDoorAnimationInProgress.value
})

// Falling field layering: a single 31 for every stage. It clears everything the
// cover puts on screen — the decorations (24/25), the door panels (28), the
// ambient creatures (29) and the cover copy (30) — so petals keep drifting in
// front of the doors as they part, and it stays there once main content takes
// over so they drift in front of the main stage's decorations too.
//
// There is no value that lands *between* the main stage's own layers: its whole
// subtree renders inside the `z-20` slot wrapper below, which is a stacking
// context, so anything ≤20 is behind all of it and anything >20 is in front of
// all of it. In front therefore also means in front of the glass content card
// and the floating menu — unavoidable, and consistent with the main stage's own
// order, where the decorations (24/25) already paint over that card (20). Safe
// because FallingEffect's root and every particle are `pointer-events: none`,
// so nothing it covers stops being tappable or scrollable.
const fallingEffectZIndex = 31

// The gilding config, resolved here as well as in CoverContentOverlay: the spark
// field outlives the cover overlay, so it can't take the config through it.
const { coverGilding } = useCoverStageLayout(
  computed(() => props.coverStageLayout),
  computed(() => props.contentTopPosition),
)

// The spark field rides the same ladder as the falling field, and for the same
// reasons: 31 clears the door panels (28) and the cover copy (30) so the motes
// stay visible while the leaves part, then 15 drops them behind the main content
// card once the cover is gone. Deliberately NOT faded out with the cover — the
// whole point of hoisting this field out of CoverGilding is that it carries on.
const sparkFieldZIndex = computed(() =>
  shouldShowMainContent.value && !shouldShowCoverContent.value ? 15 : 31,
)

// Handoff to a transition stage that carries its own field (the door stage
// does — small gold flecks that get drawn up into its bloom). That stage mounts
// behind the closed doors, so its petals are hidden until the doors part: this
// field fades out over exactly the swing so the two swap at the rate the doors
// reveal, keeping one field's worth of petals on screen throughout. Left drawing
// on top instead, it would double the density the moment the doors cleared and
// then rain straight through the bloom, which its own field animates out of.
// Inline rather than a class so it merges with FallingEffect's own :style.
const fallingEffectHandoffStyle = computed(() => ({
  opacity: props.transitionOwnsFallingField ? 0 : 1,
  transition: `opacity ${DOOR_CLEARED_MS}ms ease-out`,
}))

// Remount on a config change — see fallingEffectKeyOf for why a mounted field
// can't react on its own, and why the key deliberately excludes the palette.
const fallingEffectKey = computed(() => fallingEffectKeyOf(props.fallingEffect))

// The spark field mostly reacts on its own (it renders from computeds), but a
// swapped custom image would leave mid-blink motes showing the old asset — see
// sparkFieldKeyOf. Excludes the palette for the same reason the falling key does.
const sparkFieldKey = computed(() => sparkFieldKeyOf(props.sparks))

// Disable envelope interaction in standard mode until event video is ready
// (or unconditionally, when the manage-page preview just wants to show what
// the cover looks like without letting it be opened/animated away).
const isEnvelopeInteractionDisabled = computed(() => {
  if (props.disableEnvelopeInteraction) return true
  if (displayMode.value === 'basic') {
    return false
  }
  return props.eventVideoUrl ? !videoState.eventVideoReady.value : false
})

// Handle envelope opening - different behavior based on display mode and animation type
const handleOpenEnvelope = () => {
  emit('openEnvelope')

  if (isDoorAnimation.value) {
    // Door animation: set content hidden to trigger door opening animation
    videoState.isContentHidden.value = true
    startDoorAnimation()

    if (displayMode.value === 'basic') {
      if (!props.useTransitionStage) {
        videoState.skipToMainContent()
      }
    } else {
      clearAfterTimeout()
    }
  } else {
    // Decoration animation behavior differs by display mode
    if (displayMode.value === 'basic') {
      // Basic mode: set content hidden immediately to animate decorations out
      videoState.isContentHidden.value = true

      // When using transition stage, only animate decorations out
      // Do NOT skip to main content — the transition stage handles timing
      if (!props.useTransitionStage) {
        videoState.skipToMainContent()
      }
    }
    // Standard mode: DO NOT set isContentHidden here!
    // The video will be started by parent via startEventVideo(), and
    // isContentHidden will be set AFTER the video starts playing
    // to ensure smooth animation with no visual gap
  }
}

// Expose methods for parent component
const startEventVideo = () => {
  videoState.startEventVideo()
}

// Reveal main content (used after transition stage completes)
const revealMainContent = () => {
  videoState.skipToMainContent()
}

defineExpose({
  startEventVideo,
  revealMainContent,
  preRevealMainContent,
})

// Initialize video state and notify parent
emit('coverStageReady')
videoState.initializeVideoState()

// Cleanup on unmount
onUnmounted(() => {
  videoState.cleanupAllVideoResources()
})
</script>

<style scoped>
@import './cover-stage-styles.css';
</style>
