<template>
  <!-- Wrapper for decorations and content -->
  <div class="absolute inset-0">
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
        :get-media-url="getMediaUrl"
        :display-liquid-glass="displayLiquidGlass"
        :guest-title-frame-left="templateAssets?.guest_title_frame_left"
        :guest-title-frame-mid="templateAssets?.guest_title_frame_mid"
        :guest-title-frame-right="templateAssets?.guest_title_frame_right"
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
        :get-media-url="getMediaUrl"
        :display-liquid-glass="displayLiquidGlass"
        :guest-title-frame-left="templateAssets?.guest_title_frame_left"
        :guest-title-frame-mid="templateAssets?.guest_title_frame_mid"
        :guest-title-frame-right="templateAssets?.guest_title_frame_right"
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
      :class="[animationClasses.mainContentClasses, cursorClasses]"
      style="z-index: 30; touch-action: none;"
    >
      <CoverContentRows
        :event-title="eventTitle"
        :event-logo="eventLogo"
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
        :get-media-url="getMediaUrl"
        :display-liquid-glass="displayLiquidGlass"
        :guest-title-frame-left="templateAssets?.guest_title_frame_left"
        :guest-title-frame-mid="templateAssets?.guest_title_frame_mid"
        :guest-title-frame-right="templateAssets?.guest_title_frame_right"
        :show-animations="true"
      />

      <!-- Swipe Up Arrow Indicator -->
      <SwipeUpArrow :color="primaryColor" :bottom="swipeArrowBottom" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useOptimizedDecorations } from '@/composables/showcase/useOptimizedDecorations'
import { useCoverStageLayout } from '@/composables/showcase/useCoverStageLayout'
import { useShowcaseAnimation, type ShowcaseAnimationType } from '@/composables/showcase/useShowcaseAnimation'
import { useTouchGesture } from '@/composables/showcase/useTouchGesture'
import type { CoverStageLayout } from '@/services/api/types/template.types'
import { CoverDecorations, CoverContentRows, DoorPanel, SwipeUpArrow } from './cover'

// Local interface for template assets (component-specific subset)
interface CoverTemplateAssets {
  open_envelope_button?: string
  display_liquid_glass_background?: boolean
  guest_title_frame_left?: string | null
  guest_title_frame_mid?: string | null
  guest_title_frame_right?: string | null
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
  eventTexts?: EventText[]
  currentLanguage?: string
  shouldShowButtonLoading: boolean
  isInteractionDisabled?: boolean
  getMediaUrl: (url: string) => string
  /** @deprecated Use coverStageLayout.contentTopPosition instead */
  contentTopPosition?: number
  coverStageLayout?: CoverStageLayout
  coverTopDecoration?: string | null
  coverBottomDecoration?: string | null
  coverLeftDecoration?: string | null
  coverRightDecoration?: string | null
  animationType?: ShowcaseAnimationType
}

const props = defineProps<Props>()

const emit = defineEmits<{
  openEnvelope: []
}>()

// Optimized cover decoration image URLs
const {
  leftDecorationUrl: coverLeftDecorationUrl,
  rightDecorationUrl: coverRightDecorationUrl,
  topDecorationUrl: coverTopDecorationUrl,
  bottomDecorationUrl: coverBottomDecorationUrl,
} = useOptimizedDecorations(props, 'cover')

// Cover stage layout configuration
const {
  containerStyle,
  rowStyles,
  decorationZIndexes,
  layout,
} = useCoverStageLayout(
  computed(() => props.coverStageLayout),
  computed(() => props.contentTopPosition)
)

// Swipe arrow bottom position
const swipeArrowBottom = computed(() => layout.value.swipeArrowBottom)

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
/* Door perspective container */
.door-perspective-container {
  position: absolute;
  inset: 0;
  perspective: 1500px;
  perspective-origin: center center;
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
