<template>
  <div
    class="door-panel"
    :class="[
      side === 'left' ? 'door-panel-left' : 'door-panel-right',
      { 'door-open-left': side === 'left' && isOpen },
      { 'door-open-right': side === 'right' && isOpen }
    ]"
  >
    <div class="door-full-content" :style="doorBackgroundStyle">
      <!-- All decorations at full screen size -->
      <img
        v-if="leftDecorationUrl"
        :src="leftDecorationUrl"
        alt="Left decoration"
        class="absolute top-0 bottom-0 left-0 w-auto h-full pointer-events-none"
        :style="{ zIndex: decorationZIndexes.left }"
        loading="eager"
        v-bind="protectionAttrs"
      />
      <img
        v-if="rightDecorationUrl"
        :src="rightDecorationUrl"
        alt="Right decoration"
        class="absolute top-0 bottom-0 right-0 w-auto h-full pointer-events-none"
        :style="{ zIndex: decorationZIndexes.right }"
        loading="eager"
        v-bind="protectionAttrs"
      />
      <img
        v-if="topDecorationUrl"
        :src="topDecorationUrl"
        alt="Top decoration"
        class="absolute top-0 left-0 right-0 w-full h-auto pointer-events-none"
        :style="{ zIndex: decorationZIndexes.top }"
        loading="eager"
        v-bind="protectionAttrs"
      />
      <img
        v-if="bottomDecorationUrl"
        :src="bottomDecorationUrl"
        alt="Bottom decoration"
        class="absolute bottom-0 left-0 right-0 w-full h-auto pointer-events-none"
        :style="{ zIndex: decorationZIndexes.bottom }"
        loading="eager"
        v-bind="protectionAttrs"
      />

      <!-- Content layer -->
      <div class="door-content-layer">
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
          :guest-title-frame-left="guestTitleFrameLeft"
          :guest-title-frame-mid="guestTitleFrameMid"
          :guest-title-frame-right="guestTitleFrameRight"
          :guest-frame="guestFrame"
          :guest-name-max-width-percent="guestNameMaxWidthPercent"
          :show-animations="false"
        />
      </div>
    </div>

    <!-- Siblings of .door-full-content, not children: the content is 200% wide
         and overflows the panel, so an inner-edge overlay anchored inside it
         would land off-panel. These are pure light rather than a palette
         colour, so they read correctly whatever the template's colours are.

         The face turning away from the light as it swings… -->
    <div class="door-swing-shade" aria-hidden="true" />
    <!-- …and the light through the opening catching the inner edge, brightest
         mid-swing when the edge is most side-on to it. -->
    <div class="door-rim-light" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import { useAssetProtection } from '@/composables/showcase/useAssetProtection'
import type {
  CoverElementId,
  CoverLayoutMode,
  GuestFrameConfig,
} from '@/services/api/types/template.types'
import CoverContentRows from './CoverContentRows.vue'

interface RowStyles {
  eventTitle: { height: string }
  logo: { height: string }
  inviteText: { height: string }
  guestName: { height: string }
}

interface DecorationZIndexes {
  left: number
  right: number
  top: number
  bottom: number
}

interface EventText {
  text_type: string
  language: string
  content: string
}

interface Props {
  side: 'left' | 'right'
  isOpen: boolean
  // Decoration URLs
  leftDecorationUrl?: string | null
  rightDecorationUrl?: string | null
  topDecorationUrl?: string | null
  bottomDecorationUrl?: string | null
  decorationZIndexes: DecorationZIndexes
  // Content props
  eventTitle: string
  eventLogo?: string | null
  /** Template-provided base logo (transparency). Shown in the merged logo row when showCoverHeaderText is false. */
  sampleLogoOne?: string | null
  /** Template-provided overlay logo (transparency). Its opaque shape is used as a clip mask for the first host image. */
  sampleLogoTwo?: string | null
  /** First host profile image — clipped by sample_logo_2 in the merged logo row. */
  firstHostImage?: string | null
  /** First host display name — alt text for the clipped host image. */
  firstHostName?: string
  /** First host id — routes the preview editor to the host drawer when the logo row frames that host's photo. */
  firstHostId?: number | null
  /** CSS variables driving host-clip size/offset (from cover_stage_layout). */
  hostClipStyle?: Record<string, string>
  /** Render the cover text header row; when false, the row collapses and its space is merged into the logo row. */
  showCoverHeaderText?: boolean
  guestName?: string | null
  primaryColor: string
  secondaryColor?: string | null
  guestnameColor?: string | null
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  eventTexts?: EventText[]
  currentLanguage?: string
  containerStyle: { top: string; height: string }
  rowStyles: RowStyles
  /** Forwarded straight through: the doors render the same cover blocks. */
  layoutMode?: CoverLayoutMode
  elementStyles?: Record<CoverElementId, Record<string, string>>
  getMediaUrl: (url: string) => string
  displayLiquidGlass?: boolean
  guestTitleFrameLeft?: string | null
  guestTitleFrameMid?: string | null
  guestTitleFrameRight?: string | null
  /** Which frame style wraps the guest name, and how. Unset = the 3-piece split frame. */
  guestFrame?: GuestFrameConfig | null
  /** Guest name max width as % of row container (overrides default 60) */
  guestNameMaxWidthPercent?: number
  // Door background
  backgroundColor?: string
  backgroundImageUrl?: string | null
}

import { computed } from 'vue'

const props = withDefaults(defineProps<Props>(), {
  displayLiquidGlass: true,
  backgroundColor: '#000000',
  showCoverHeaderText: true,
})

const { protectionAttrs } = useAssetProtection()

// Compute door background style - use image if available, otherwise solid color
const doorBackgroundStyle = computed(() => {
  if (props.backgroundImageUrl) {
    return {
      backgroundImage: `url(${props.backgroundImageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }
  }
  return {
    backgroundColor: props.backgroundColor,
  }
})
</script>

<style scoped>
/* Door panel base styles */
.door-panel {
  position: absolute;
  top: 0;
  bottom: 0;
  overflow: hidden;
  backface-visibility: hidden;
  transform-style: preserve-3d;
  transition: transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              width 0s 0s,
              left 0s 0s,
              right 0s 0s,
              opacity 0s 0s;
  will-change: transform;
  pointer-events: none;
}

/* Door full content */
.door-full-content {
  position: absolute;
  top: 0;
  bottom: 0;
  height: 100%;
  transform-style: preserve-3d;
  transition: width 0s 0s, left 0s 0s;
}

/* Door content layer */
.door-content-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 30;
}

/* Left door - CLOSED: covers full viewport */
.door-panel-left {
  left: 0;
  width: 100%;
  z-index: 2;
  transform-origin: left center;
}

.door-panel-left .door-full-content {
  width: 100%;
  left: 0;
}

/* Right door - CLOSED: hidden behind left panel */
.door-panel-right {
  right: 0;
  width: 50%;
  z-index: 1;
  transform-origin: right center;
  opacity: 0;
}

.door-panel-right .door-full-content {
  width: 200%;
  left: -100%;
}

/* OPEN STATE */
.door-open-left {
  width: 50%;
  transform: perspective(1500px) rotateY(-105deg);
}

.door-open-left .door-full-content {
  width: 200%;
  left: 0;
}

.door-open-right {
  opacity: 1;
  transform: perspective(1500px) rotateY(105deg);
}

/* Swing shading + rim light. Above the content layer (z-30) so they fall on
   the whole face, below the hinge/gap shadows (z-100/101). */
.door-swing-shade,
.door-rim-light {
  position: absolute;
  top: 0;
  bottom: 0;
  opacity: 0;
  pointer-events: none;
}

.door-swing-shade {
  left: 0;
  right: 0;
  z-index: 40;
  transition: opacity 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.door-panel-left .door-swing-shade {
  background: linear-gradient(
    90deg,
    rgba(12, 10, 14, 0.62) 0%,
    rgba(20, 16, 20, 0.3) 55%,
    rgba(40, 30, 20, 0) 100%
  );
}

.door-panel-right .door-swing-shade {
  background: linear-gradient(
    270deg,
    rgba(12, 10, 14, 0.62) 0%,
    rgba(20, 16, 20, 0.3) 55%,
    rgba(40, 30, 20, 0) 100%
  );
}

.door-open-left .door-swing-shade,
.door-open-right .door-swing-shade {
  opacity: 1;
}

.door-rim-light {
  width: 42%;
  max-width: 190px;
  z-index: 41;
  mix-blend-mode: screen;
}

.door-panel-left .door-rim-light {
  right: 0;
  background: linear-gradient(90deg, rgba(255, 220, 150, 0), rgba(255, 232, 180, 0.75));
}

.door-panel-right .door-rim-light {
  left: 0;
  background: linear-gradient(270deg, rgba(255, 220, 150, 0), rgba(255, 232, 180, 0.75));
}

.door-open-left .door-rim-light,
.door-open-right .door-rim-light {
  animation: doorRimLight 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes doorRimLight {
  0% {
    opacity: 0;
  }
  45% {
    opacity: 0.95;
  }
  100% {
    opacity: 0;
  }
}

/* Door edge shadow - creates depth illusion at the hinge side */
.door-panel::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 15%;
  max-width: 80px;
  min-width: 30px;
  opacity: 0;
  transition: opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  pointer-events: none;
  z-index: 100;
}

/* Center gap shadow - appears between doors when opening */
.door-panel::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 8%;
  max-width: 40px;
  min-width: 15px;
  opacity: 0;
  transition: opacity 0.6s ease-out 0.2s;
  pointer-events: none;
  z-index: 101;
}

/* Left door shadows */
.door-panel-left::before {
  left: 0;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.25) 0%,
    rgba(0, 0, 0, 0.08) 40%,
    transparent 100%
  );
}

.door-panel-left::after {
  right: 0;
  background: linear-gradient(
    to left,
    rgba(0, 0, 0, 0.35) 0%,
    rgba(0, 0, 0, 0.15) 30%,
    rgba(0, 0, 0, 0.05) 60%,
    transparent 100%
  );
}

/* Right door shadows */
.door-panel-right::before {
  right: 0;
  background: linear-gradient(
    to left,
    rgba(0, 0, 0, 0.25) 0%,
    rgba(0, 0, 0, 0.08) 40%,
    transparent 100%
  );
}

.door-panel-right::after {
  left: 0;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.35) 0%,
    rgba(0, 0, 0, 0.15) 30%,
    rgba(0, 0, 0, 0.05) 60%,
    transparent 100%
  );
}

/* Open state - show shadows */
.door-open-left::before,
.door-open-right::before {
  opacity: 0.7;
}

.door-open-left::after,
.door-open-right::after {
  opacity: 1;
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .door-panel {
    transition: opacity 0.3s ease-out;
  }

  .door-open-left,
  .door-open-right {
    transform: none;
    opacity: 0;
  }

  .door-swing-shade,
  .door-rim-light {
    display: none;
  }
}
</style>
