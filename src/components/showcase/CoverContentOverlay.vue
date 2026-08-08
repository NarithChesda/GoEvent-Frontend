<template>
  <!-- Wrapper for decorations and content.
       `slotVarStyle` publishes the template's four font families and four
       palette entries as CSS variables here — the highest element that has all
       of them and contains every cover block, including the two rendered inside
       DoorPanel. Free-placed blocks reference these by name (see
       coverElementStyle), which is what lets a partner point a block at a font
       or colour slot without a prop being threaded down for it. -->
  <div class="absolute inset-0" :style="slotVarStyle">
    <!-- DECORATION ANIMATION: Individual decoration images that slide out -->
    <CoverDecorations
      :left-url="coverLeftDecorationUrl"
      :right-url="coverRightDecorationUrl"
      :top-url="coverTopDecorationUrl"
      :bottom-url="coverBottomDecorationUrl"
      :z-indexes="decorationZIndexes"
      :decoration-classes="animationClasses.decorationClasses.value"
      :is-decoration-animation="isDecorationAnimation"
    />

    <!-- Ambient creature effect (butterflies hovering near decorations) — only when template has config -->
    <AmbientEffect
      v-if="ambientCreatures"
      :key="ambientCreaturesKey"
      :config="ambientCreatures"
      :primary-color="primaryColor"
      :accent-color="accentColor"
      :hidden="isContentHidden"
    />

    <!-- DOOR ANIMATION: 3D perspective container for door panels -->
    <div v-if="isDoorAnimation" class="door-perspective-container">
      <!-- Left Door Panel -->
      <DoorPanel
        side="left"
        :is-open="isContentHidden"
        :left-decoration-url="coverLeftDecorationUrl"
        :right-decoration-url="coverRightDecorationUrl"
        :top-decoration-url="coverTopDecorationUrl"
        :bottom-decoration-url="coverBottomDecorationUrl"
        :decoration-z-indexes="decorationZIndexes"
        :event-title="eventTitle"
        :event-logo="eventLogo"
        :sample-logo-one="sampleLogoOne"
        :sample-logo-two="sampleLogoTwo"
        :first-host-image="firstHostImage"
        :first-host-name="firstHostName"
        :first-host-id="firstHostId"
        :host-clip-style="hostClipStyle"
        :show-cover-header-text="showCoverHeaderText"
        :guest-name="guestName"
        :primary-color="primaryColor"
        :secondary-color="secondaryColor"
        :guestname-color="guestnameColor"
        :current-font="currentFont"
        :primary-font="primaryFont"
        :secondary-font="secondaryFont"
        :event-texts="eventTexts"
        :current-language="currentLanguage"
        :container-style="containerStyle"
        :row-styles="rowStyles"
        :layout-mode="layoutMode"
        :element-styles="elementStyles"
        :get-media-url="getMediaUrl"
        :display-liquid-glass="displayLiquidGlass"
        :guest-title-frame-left="templateAssets?.guest_title_frame_left"
        :guest-title-frame-mid="templateAssets?.guest_title_frame_mid"
        :guest-title-frame-right="templateAssets?.guest_title_frame_right"
        :guest-frame="guestFrame"
        :guest-name-max-width-percent="guestNameMaxWidthPercent"
        :background-color="backgroundColor"
        :background-image-url="doorBackgroundImageUrl"
      />

      <!-- Right Door Panel -->
      <DoorPanel
        side="right"
        :is-open="isContentHidden"
        :left-decoration-url="coverLeftDecorationUrl"
        :right-decoration-url="coverRightDecorationUrl"
        :top-decoration-url="coverTopDecorationUrl"
        :bottom-decoration-url="coverBottomDecorationUrl"
        :decoration-z-indexes="decorationZIndexes"
        :event-title="eventTitle"
        :event-logo="eventLogo"
        :sample-logo-one="sampleLogoOne"
        :sample-logo-two="sampleLogoTwo"
        :first-host-image="firstHostImage"
        :first-host-name="firstHostName"
        :first-host-id="firstHostId"
        :host-clip-style="hostClipStyle"
        :show-cover-header-text="showCoverHeaderText"
        :guest-name="guestName"
        :primary-color="primaryColor"
        :secondary-color="secondaryColor"
        :guestname-color="guestnameColor"
        :current-font="currentFont"
        :primary-font="primaryFont"
        :secondary-font="secondaryFont"
        :event-texts="eventTexts"
        :current-language="currentLanguage"
        :container-style="containerStyle"
        :row-styles="rowStyles"
        :layout-mode="layoutMode"
        :element-styles="elementStyles"
        :get-media-url="getMediaUrl"
        :display-liquid-glass="displayLiquidGlass"
        :guest-title-frame-left="templateAssets?.guest_title_frame_left"
        :guest-title-frame-mid="templateAssets?.guest_title_frame_mid"
        :guest-title-frame-right="templateAssets?.guest_title_frame_right"
        :guest-frame="guestFrame"
        :guest-name-max-width-percent="guestNameMaxWidthPercent"
        :background-color="backgroundColor"
        :background-image-url="doorBackgroundImageUrl"
      />
    </div>

    <!-- Clickable overlay for door animation -->
    <div
      v-if="isDoorAnimation && !isContentHidden"
      @click="handleClick"
      @touchstart.passive="handleTouchStart"
      @touchmove.passive="handleTouchMove"
      @touchend="handleTouchEnd"
      class="absolute inset-0"
      :class="cursorClasses"
      style="z-index: 29; touch-action: none; background: transparent;"
    ></div>

    <!-- Main Content Container (for decoration animation only) -->
    <div
      v-if="isDecorationAnimation"
      @click="handleClick"
      @touchstart.passive="handleTouchStart"
      @touchmove.passive="handleTouchMove"
      @touchend="handleTouchEnd"
      class="absolute inset-0 flex justify-center text-center transition-all duration-700 ease-out"
      :class="[animationClasses.mainContentClasses.value, cursorClasses]"
      style="z-index: 30; touch-action: none;"
    >
      <CoverContentRows
        :event-title="eventTitle"
        :event-logo="eventLogo"
        :sample-logo-one="sampleLogoOne"
        :sample-logo-two="sampleLogoTwo"
        :first-host-image="firstHostImage"
        :first-host-name="firstHostName"
        :first-host-id="firstHostId"
        :host-clip-style="hostClipStyle"
        :show-cover-header-text="showCoverHeaderText"
        :guest-name="guestName"
        :primary-color="primaryColor"
        :secondary-color="secondaryColor"
        :guestname-color="guestnameColor"
        :current-font="currentFont"
        :primary-font="primaryFont"
        :secondary-font="secondaryFont"
        :event-texts="eventTexts"
        :current-language="currentLanguage"
        :container-style="containerStyle"
        :row-styles="rowStyles"
        :layout-mode="layoutMode"
        :element-styles="elementStyles"
        :get-media-url="getMediaUrl"
        :display-liquid-glass="displayLiquidGlass"
        :guest-title-frame-left="templateAssets?.guest_title_frame_left"
        :guest-title-frame-mid="templateAssets?.guest_title_frame_mid"
        :guest-title-frame-right="templateAssets?.guest_title_frame_right"
        :guest-frame="guestFrame"
        :guest-name-max-width-percent="guestNameMaxWidthPercent"
        :show-animations="true"
      />

      <!-- Swipe Up Arrow Indicator. Hidden by default when the envelope can't
           actually be opened, but `showSwipeArrow` overrides that so a preview
           can still show where `swipeArrowBottom` puts it. -->
      <SwipeUpArrow v-if="shouldShowSwipeArrow" :color="primaryColor" :bottom="swipeArrowBottom" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useOptimizedDecorations, useOptimizedBackgrounds } from '@/composables/showcase/useOptimizedDecorations'
import {
  COVER_COLOR_SLOT_VARS,
  COVER_FONT_SLOT_VARS,
  useCoverStageLayout,
} from '@/composables/showcase/useCoverStageLayout'
import { useShowcaseAnimation, type ShowcaseAnimationType } from '@/composables/showcase/useShowcaseAnimation'
import { useTouchGesture } from '@/composables/showcase/useTouchGesture'
import type { CoverStageLayout, AmbientCreaturesConfig } from '@/services/api/types/template.types'
import { CoverDecorations, CoverContentRows, DoorPanel, SwipeUpArrow } from './cover'
import AmbientEffect from './AmbientEffect.vue'

// Local interface for template assets (component-specific subset)
interface CoverTemplateAssets {
  open_envelope_button?: string
  display_liquid_glass_background?: boolean
  guest_title_frame_left?: string | null
  guest_title_frame_mid?: string | null
  guest_title_frame_right?: string | null
  basic_decoration_photo?: string | null
  sample_logo_1?: string | null
  sample_logo_2?: string | null
  header_text_image?: string | null
}

interface EventText {
  text_type: string
  language: string
  content: string
}

interface Props {
  isContentHidden: boolean
  eventTitle: string
  eventLogo?: string | null
  /** First host profile image — clipped by sample_logo_2 in the merged logo row when the cover header is hidden. */
  firstHostImage?: string | null
  /** First host display name — used as the alt text for the clipped host image. */
  firstHostName?: string
  /** First host id — routes the preview editor to the host drawer when the logo row frames that host's photo. */
  firstHostId?: number | null
  guestName?: string | null
  templateAssets?: CoverTemplateAssets | null
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  backgroundColor?: string
  guestnameColor?: string | null
  templateColor?: string | null
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  /** Only used to publish the font slot variables (see slotVarStyle). */
  accentFont?: string
  decorativeFont?: string
  eventTexts?: EventText[]
  currentLanguage?: string
  shouldShowButtonLoading: boolean
  isInteractionDisabled?: boolean
  /** Force the swipe arrow on/off. Unset means "show it whenever the envelope
   *  is interactive" — the live showcase's behaviour. */
  showSwipeArrow?: boolean
  getMediaUrl: (url: string) => string
  /** @deprecated Use coverStageLayout.contentTopPosition instead */
  contentTopPosition?: number
  coverStageLayout?: CoverStageLayout
  coverTopDecoration?: string | null
  coverBottomDecoration?: string | null
  coverLeftDecoration?: string | null
  coverRightDecoration?: string | null
  animationType?: ShowcaseAnimationType
  /** Ambient creature effect config from template. Only renders when provided. */
  ambientCreatures?: AmbientCreaturesConfig | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  openEnvelope: []
}>()

// AmbientEffect snapshots its config during setup exactly the way FallingEffect
// does (useAmbientCreatures destructures its options into plain locals), so a
// mounted instance can't see a changed creature list, count or speed. The `v-if`
// only covers turning the effect on and off wholesale; everything else needs a
// remount. Same rationale as MainContentStage's fallingEffectKey — no-op for
// guests, required for the partner template studio's live preview. Colors stay
// out of the key for the same reason: they resolve through a per-creature
// callback that already picks up palette edits.
const ambientCreaturesKey = computed(() => {
  const config = props.ambientCreatures
  if (!config) return 'none'
  return [
    config.creatures
      .map((creature) => `${creature.type}:${creature.weight ?? 1}:${creature.min_size ?? ''}:${creature.max_size ?? ''}`)
      .join(','),
    config.count ?? 6,
    config.speed ?? 'normal',
    config.color_source ?? 'accent',
    config.custom_color ?? '',
  ].join('|')
})

// Optimized cover decoration image URLs
const {
  leftDecorationUrl: coverLeftDecorationUrl,
  rightDecorationUrl: coverRightDecorationUrl,
  topDecorationUrl: coverTopDecorationUrl,
  bottomDecorationUrl: coverBottomDecorationUrl,
} = useOptimizedDecorations(props, 'cover')

// Optimized decoration photo URL for door panel background
const { optimizedDecorationPhotoUrl: doorBackgroundImageUrl } = useOptimizedBackgrounds(
  computed(() => props.templateAssets?.basic_decoration_photo ?? null),
  computed(() => null) // We don't need background photo here
)

// Cover stage layout configuration
const {
  containerStyle,
  rowStyles,
  layoutMode,
  elementStyles,
  guestFrame,
  decorationZIndexes,
  layout,
} = useCoverStageLayout(
  computed(() => props.coverStageLayout),
  computed(() => props.contentTopPosition)
)

/**
 * The template's font and colour slots, published as CSS variables for
 * free-placed blocks to reference by name.
 *
 * Every entry falls back the way the showcase itself already falls back
 * (accent → primary, decorative → accent, and so on), so a block pointed at a
 * slot this template doesn't fill renders in something sensible rather than in
 * the browser default.
 */
const slotVarStyle = computed<Record<string, string>>(() => {
  const body = props.primaryFont || props.currentFont
  const accentFont = props.accentFont || body
  return {
    [COVER_FONT_SLOT_VARS.primary]: body,
    [COVER_FONT_SLOT_VARS.secondary]: props.secondaryFont || body,
    [COVER_FONT_SLOT_VARS.accent]: accentFont,
    [COVER_FONT_SLOT_VARS.decorative]: props.decorativeFont || accentFont,
    [COVER_COLOR_SLOT_VARS.primary]: props.primaryColor,
    [COVER_COLOR_SLOT_VARS.secondary]: props.secondaryColor || props.primaryColor,
    [COVER_COLOR_SLOT_VARS.accent]: props.accentColor || props.primaryColor,
    [COVER_COLOR_SLOT_VARS.guestname]: props.guestnameColor || props.primaryColor,
  }
})

// Swipe arrow bottom position
const swipeArrowBottom = computed(() => layout.value.swipeArrowBottom)

// The arrow is an affordance for a gesture, so it goes away with the gesture —
// unless a caller asks for it explicitly. The template studio does: without the
// arrow on screen its `swipeArrowBottom` slider moves nothing.
const shouldShowSwipeArrow = computed(
  () => props.showSwipeArrow ?? !props.isInteractionDisabled
)

// Guest name max width (% of container width), configurable per template
const guestNameMaxWidthPercent = computed(() => layout.value.guestNameMaxWidthPercent)

// Whether to render the cover text header row (template-controlled)
const showCoverHeaderText = computed(() => layout.value.showCoverHeaderText)

// Sample logos from template_assets — used in place of the event logo when
// the cover header row is hidden (sample_logo_1 as base, sample_logo_2 overlaid).
const sampleLogoOne = computed(() => props.templateAssets?.sample_logo_1 ?? null)
const sampleLogoTwo = computed(() => props.templateAssets?.sample_logo_2 ?? null)

// Panning of the host image within sample_logo_2's shape, exposed as CSS
// variables so per-template overrides from cover_stage_layout flow straight
// into CoverContentRows without extra props on every element.
const hostClipStyle = computed<Record<string, string>>(() => ({
  '--host-clip-offset-x': `${layout.value.hostClipOffsetX}%`,
  '--host-clip-offset-y': `${layout.value.hostClipOffsetY}%`,
}))

// Showcase animation configuration
const animationClasses = useShowcaseAnimation({
  animationType: computed(() => props.animationType),
  isContentHidden: computed(() => props.isContentHidden),
})

const { isDecorationAnimation, isDoorAnimation } = animationClasses

// Touch gesture handling
const { handleTouchStart, handleTouchMove, handleTouchEnd, handleClick } = useTouchGesture({
  onSwipeUpOrTap: () => emit('openEnvelope'),
  isDisabled: () => props.isInteractionDisabled ?? false,
})

// Cursor classes
const cursorClasses = computed(() => ({
  'cursor-pointer': !props.isInteractionDisabled,
  'cursor-not-allowed': props.isInteractionDisabled,
}))

// Liquid glass display setting
const displayLiquidGlass = computed(() =>
  props.templateAssets?.display_liquid_glass_background !== false
)
</script>

<style scoped>
/* Door perspective container. Both leaves share this one 3D scene — they carry
   no perspective() of their own, which would give each its own vanishing point.
   1.76x the stage's width and an origin slightly above centre are the
   reference artwork's (1900 against its 1080, at 50% 44%); a fixed 1500px was
   ~3.3x the width of a phone-shaped stage, which flattened the swing almost
   to a horizontal squash. */
.door-perspective-container {
  position: absolute;
  inset: 0;
  perspective: calc(min(100vw, 56.25vh) * 1.76);
  perspective-origin: 50% 44%;
  z-index: 28;
  overflow: hidden;
}

/* Swipe Up Animation */
.swipe-up-hidden {
  transform: translateY(-100%);
  opacity: 0;
  pointer-events: none;
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .door-perspective-container {
    perspective: none;
  }
}
</style>
