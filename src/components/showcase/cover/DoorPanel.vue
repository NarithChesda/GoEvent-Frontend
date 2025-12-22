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
          :guest-title-frame-left="guestTitleFrameLeft"
          :guest-title-frame-mid="guestTitleFrameMid"
          :guest-title-frame-right="guestTitleFrameRight"
          :show-animations="false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAssetProtection } from '@/composables/showcase/useAssetProtection'
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
  getMediaUrl: (url: string) => string
  displayLiquidGlass?: boolean
  guestTitleFrameLeft?: string | null
  guestTitleFrameMid?: string | null
  guestTitleFrameRight?: string | null
  // Door background
  backgroundColor?: string
  backgroundImageUrl?: string | null
}

import { computed } from 'vue'

const props = withDefaults(defineProps<Props>(), {
  displayLiquidGlass: true,
  backgroundColor: '#000000',
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

/* Inner shadow on doors when opening */
.door-panel::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50px;
  opacity: 0;
  transition: opacity 0.6s ease-out;
  pointer-events: none;
  z-index: 100;
}

.door-panel-left::before {
  right: 0;
  background: linear-gradient(
    to left,
    rgba(0, 0, 0, 0.5),
    rgba(0, 0, 0, 0)
  );
}

.door-panel-right::before {
  left: 0;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.5),
    rgba(0, 0, 0, 0)
  );
}

.door-open-left::before,
.door-open-right::before {
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
}
</style>
