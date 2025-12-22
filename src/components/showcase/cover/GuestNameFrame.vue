<template>
  <div class="guest-name-container" :class="{ 'english-name': isEnglishGuestName }">
    <div class="premium-name-frame" :style="frameStyle">
      <!-- 3-part split frame -->
      <div class="split-frame-container" aria-hidden="true">
        <img :src="leftFrameUrl" alt="" class="frame-left" v-bind="protectionAttrs" />
        <div class="frame-middle-wrapper">
          <div
            class="frame-middle"
            :style="{ backgroundImage: `url(${middleFrameUrl})` }"
            v-bind="protectionAttrs"
          ></div>
        </div>
        <img :src="rightFrameUrl" alt="" class="frame-right" v-bind="protectionAttrs" />
      </div>
      <!-- Guest name positioned over the frame -->
      <h2
        ref="guestNameElementRef"
        class="scaled-guest-name font-regular khmer-text-fix text-center guest-name-single-line"
        :style="[textStyle, scaleStyle]"
      >
        <template v-if="isEnglishGuestName">
          <span
            v-for="(char, index) in guestNameChars"
            :key="index"
            class="bounce-char"
            :style="{ animationDelay: `${1 + index * 0.05}s` }"
          >{{ char === ' ' ? '\u00A0' : char }}</span>
        </template>
        <template v-else>
          <span
            v-for="(word, index) in guestNameWords"
            :key="index"
            class="bounce-word"
            :style="{ animationDelay: `${1 + index * 0.15}s` }"
          >{{ word }}{{ index < guestNameWords.length - 1 ? '\u00A0' : '' }}</span>
        </template>
      </h2>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch, onMounted, nextTick } from 'vue'
import { useAssetProtection } from '@/composables/showcase/useAssetProtection'

// Default liquid glass frames
import leftFramePng from '@/assets/left-frame.png'
import middleFramePng from '@/assets/middle-frame.png'
import rightFramePng from '@/assets/right-frame.png'
// Transparent fallback frames
import leftFrameTranPng from '@/assets/left-frame-tran.png'
import middleFrameTranPng from '@/assets/middle-frame-tran.png'
import rightFrameTranPng from '@/assets/right-frame-tran.png'

interface Props {
  guestName: string
  primaryColor: string
  guestnameColor?: string | null
  primaryFont?: string
  currentFont: string
  getMediaUrl: (url: string) => string
  displayLiquidGlass?: boolean
  guestTitleFrameLeft?: string | null
  guestTitleFrameMid?: string | null
  guestTitleFrameRight?: string | null
  /** External scale value (optional, for controlled scaling) */
  scale?: number
}

const props = withDefaults(defineProps<Props>(), {
  displayLiquidGlass: true,
  scale: 1,
})

const { protectionAttrs } = useAssetProtection()

// Element ref for external scale calculation
const guestNameElementRef = ref<HTMLElement | null>(null)

// Check if guest name is English/Latin
const isEnglishGuestName = computed(() => {
  return /^[a-zA-Z\s\-'.,()&]+$/.test(props.guestName.trim())
})

// Capitalize words for English names
const formattedGuestName = computed(() => {
  if (isEnglishGuestName.value) {
    return props.guestName.replace(/\b\w/g, (char) => char.toUpperCase())
  }
  return props.guestName
})

const guestNameChars = computed(() => formattedGuestName.value.split(''))
const guestNameWords = computed(() => formattedGuestName.value.split(/\s+/).filter(Boolean))

// Text style
const textStyle = computed(() => {
  const fontFamily = isEnglishGuestName.value
    ? '"Great Vibes", cursive'
    : props.primaryFont || props.currentFont

  return {
    fontFamily,
    color: props.guestnameColor || props.primaryColor,
    fontWeight: isEnglishGuestName.value ? '400' : 'normal',
    background: 'none',
    backgroundColor: 'transparent',
  }
})

// Scale style
const scaleStyle = computed(() => ({
  transform: `scale(${props.scale})`,
  transformOrigin: 'center center',
}))

// Frame style
const frameStyle = computed(() => ({
  '--primary-color': props.primaryColor,
  '--accent-glow': props.primaryColor,
}))

// Frame URLs with fallback logic
const leftFrameUrl = computed(() => {
  if (props.guestTitleFrameLeft) {
    return props.getMediaUrl(props.guestTitleFrameLeft)
  }
  return props.displayLiquidGlass ? leftFramePng : leftFrameTranPng
})

const middleFrameUrl = computed(() => {
  if (props.guestTitleFrameMid) {
    return props.getMediaUrl(props.guestTitleFrameMid)
  }
  return props.displayLiquidGlass ? middleFramePng : middleFrameTranPng
})

const rightFrameUrl = computed(() => {
  if (props.guestTitleFrameRight) {
    return props.getMediaUrl(props.guestTitleFrameRight)
  }
  return props.displayLiquidGlass ? rightFramePng : rightFrameTranPng
})

// Expose ref for parent scale calculation
defineExpose({
  guestNameElementRef,
})
</script>

<style scoped>
.guest-name-container {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  max-width: 95%;
}

/* Premium Name Frame */
.premium-name-frame {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  padding: 0.5rem 2.5rem;
}

/* 3-part split frame container */
.split-frame-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(100% + 40px);
  min-width: 200px;
  max-width: 500px;
  height: 75px;
  pointer-events: none;
  z-index: 0;
  opacity: 0;
  animation: frameEntrance 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  animation-delay: 0.8s;
}

.frame-left {
  flex-shrink: 0;
  height: 100%;
  width: auto;
  display: block;
  position: relative;
  z-index: 2;
  margin-right: -2px;
}

.frame-right {
  flex-shrink: 0;
  height: 100%;
  width: auto;
  display: block;
  position: relative;
  z-index: 2;
  margin-left: -2px;
}

.frame-middle-wrapper {
  flex: 1;
  height: 100%;
  overflow: hidden;
  min-width: 20px;
  z-index: 1;
}

.frame-middle {
  width: 100%;
  height: 100%;
  background-repeat: repeat-x;
  background-size: auto 100%;
  background-position: center;
}

@keyframes frameEntrance {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scaleX(0.3) scaleY(0.8);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scaleX(1.02) scaleY(1);
  }
  75% {
    transform: translate(-50%, -50%) scaleX(0.98) scaleY(1);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scaleX(1) scaleY(1);
  }
}

.guest-name-single-line {
  white-space: nowrap !important;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
  max-width: 100%;
  padding: 0 4px;
  margin: 0;
}

.bounce-char,
.bounce-word {
  display: inline-block;
  opacity: 0;
  animation: bounceInChar 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes bounceInChar {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  30% {
    opacity: 1;
  }
  50% {
    transform: translateY(-2px);
  }
  75% {
    transform: translateY(1px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Great Vibes font enhancement */
.scaled-guest-name[style*="Great Vibes"] {
  font-size: 1.3em !important;
  letter-spacing: 0.02em;
}

/* Desktop */
@media (min-width: 1024px) {
  .scaled-guest-name {
    font-size: clamp(0.65rem, 2vh, 1.2rem) !important;
  }

  .scaled-guest-name[style*="Great Vibes"] {
    font-size: clamp(0.85rem, 2.6vh, 1.6rem) !important;
  }
}

/* Laptop only */
@media (min-width: 1024px) and (max-width: 1535px) {
  .split-frame-container {
    max-width: 400px;
    height: 50px;
  }
}

/* Mobile */
@media (max-width: 640px) {
  .scaled-guest-name {
    font-size: clamp(0.65rem, 2vh, 1.2rem) !important;
  }

  .scaled-guest-name[style*="Great Vibes"] {
    font-size: clamp(0.85rem, 2.6vh, 1.6rem) !important;
  }

  .guest-name-container {
    gap: 0;
    max-width: 90%;
  }

  .guest-name-container.english-name .premium-name-frame {
    padding: 0.5rem 2rem !important;
  }

  .split-frame-container {
    height: 60px;
  }
}
</style>
