<template>
  <div
    @click="handleClick"
    @touchstart.passive="handleTouchStart"
    @touchmove.passive="handleTouchMove"
    @touchend="handleTouchEnd"
    class="absolute inset-0 flex justify-center text-center transition-all duration-700 ease-out"
    :class="{
      'swipe-up-hidden': isContentHidden,
      'cursor-pointer': !isInteractionDisabled,
      'cursor-not-allowed opacity-75': isInteractionDisabled
    }"
    style="z-index: 10; touch-action: none;"
  >
    <!-- Decoration Images -->
    <img
      v-if="coverTopDecoration"
      :src="getMediaUrl(coverTopDecoration)"
      alt="Top decoration"
      class="absolute top-0 left-0 right-0 w-full h-auto pointer-events-none z-[25]"
      loading="lazy"
    />
    <img
      v-if="coverBottomDecoration"
      :src="getMediaUrl(coverBottomDecoration)"
      alt="Bottom decoration"
      class="absolute bottom-0 left-0 right-0 w-full h-auto pointer-events-none z-[25]"
      loading="lazy"
    />
    <img
      v-if="coverLeftDecoration"
      :src="getMediaUrl(coverLeftDecoration)"
      alt="Left decoration"
      class="absolute top-0 bottom-0 left-0 w-auto h-full pointer-events-none z-[25]"
      loading="lazy"
    />
    <img
      v-if="coverRightDecoration"
      :src="getMediaUrl(coverRightDecoration)"
      alt="Right decoration"
      class="absolute top-0 bottom-0 right-0 w-auto h-full pointer-events-none z-[25]"
      loading="lazy"
    />

    <!-- Inner Container with Dynamic Top Position -->
    <div
      class="inner-container-rows flex flex-col w-full mx-auto absolute"
      style="height: 53vh"
      :style="containerStyle"
    >
      <!-- Event Title Row: 18.75% -->
      <div
        class="content-row-header flex items-center justify-center animate-fadeIn"
        style="height: 18.75%"
      >
        <div
          class="header-content-container flex items-center justify-center px-4 w-full"
          style="height: 60%"
        >
          <h1
            class="scaled-header font-regular capitalize khmer-text-fix text-center"
            :style="headerTextStyle"
          >
            {{ coverHeader || eventTitle }}
          </h1>
        </div>
      </div>

      <!-- Event Logo Row: 48% -->
      <div
        class="content-row-logo flex items-center justify-center animate-fadeIn animation-delay-200"
        style="height: 48%"
      >
        <div class="flex items-center justify-center h-full w-full px-4">
          <img
            v-if="eventLogo"
            :src="getMediaUrl(eventLogo)"
            :alt="eventTitle + ' logo'"
            class="scaled-logo mx-auto"
            fetchpriority="high"
          />
          <div
            v-else
            class="fallback-logo-container"
            :style="fallbackLogoStyle"
          >
            <div
              class="fallback-logo"
              v-html="fallbackLogoSvgContent"
            />
          </div>
        </div>
      </div>

      <!-- Invite Text Row: 8.75% -->
      <div
        v-if="guestName"
        class="content-row-invite flex items-center justify-center animate-fadeIn animation-delay-400"
        style="height: 8.75%; overflow: visible;"
      >
        <div
          class="invite-content-container flex items-center justify-center px-4 w-full"
          style="height: 60%"
        >
          <p class="scaled-invite-text khmer-text-fix text-center" :style="inviteTextStyle">
            {{ inviteText }}
          </p>
        </div>
      </div>

      <!-- Guest Name Row: 16% -->
      <div
        v-if="guestName"
        class="content-row-guest flex items-center justify-center"
        style="height: 16%; overflow: visible;"
      >
        <div
          class="guest-content-container flex items-center justify-center px-4 w-full"
        >
          <div class="guest-name-container">
            <div class="premium-name-frame" :style="premiumFrameStyle">
              <!-- Guest name content with integrated decorations -->
              <div class="guest-name-content" :style="guestNameBackdropStyle">
                <!-- Corner Decorations - Classic refined borders -->
                <div class="corner-decor corner-tl">
                  <svg viewBox="0 0 30 30" class="corner-ornament">
                    <!-- Double line border -->
                    <line x1="0" y1="30" x2="0" y2="6" stroke-width="2" class="corner-line"/>
                    <line x1="0" y1="0" x2="24" y2="0" stroke-width="2" class="corner-line"/>
                    <line x1="2" y1="28" x2="2" y2="8" stroke-width="1" class="corner-inner-line"/>
                    <line x1="2" y1="2" x2="22" y2="2" stroke-width="1" class="corner-inner-line"/>
                    <!-- Elegant corner detail -->
                    <rect x="0" y="0" width="6" height="6" class="corner-accent-square"/>
                  </svg>
                </div>
                <div class="corner-decor corner-tr">
                  <svg viewBox="0 0 30 30" class="corner-ornament">
                    <line x1="30" y1="30" x2="30" y2="6" stroke-width="2" class="corner-line"/>
                    <line x1="30" y1="0" x2="6" y2="0" stroke-width="2" class="corner-line"/>
                    <line x1="28" y1="28" x2="28" y2="8" stroke-width="1" class="corner-inner-line"/>
                    <line x1="28" y1="2" x2="8" y2="2" stroke-width="1" class="corner-inner-line"/>
                    <rect x="24" y="0" width="6" height="6" class="corner-accent-square"/>
                  </svg>
                </div>
                <div class="corner-decor corner-bl">
                  <svg viewBox="0 0 30 30" class="corner-ornament">
                    <line x1="0" y1="0" x2="0" y2="24" stroke-width="2" class="corner-line"/>
                    <line x1="0" y1="30" x2="24" y2="30" stroke-width="2" class="corner-line"/>
                    <line x1="2" y1="2" x2="2" y2="22" stroke-width="1" class="corner-inner-line"/>
                    <line x1="2" y1="28" x2="22" y2="28" stroke-width="1" class="corner-inner-line"/>
                    <rect x="0" y="24" width="6" height="6" class="corner-accent-square"/>
                  </svg>
                </div>
                <div class="corner-decor corner-br">
                  <svg viewBox="0 0 30 30" class="corner-ornament">
                    <line x1="30" y1="0" x2="30" y2="24" stroke-width="2" class="corner-line"/>
                    <line x1="30" y1="30" x2="6" y2="30" stroke-width="2" class="corner-line"/>
                    <line x1="28" y1="2" x2="28" y2="22" stroke-width="1" class="corner-inner-line"/>
                    <line x1="28" y1="28" x2="8" y2="28" stroke-width="1" class="corner-inner-line"/>
                    <rect x="24" y="24" width="6" height="6" class="corner-accent-square"/>
                  </svg>
                </div>

                <!-- Top Center Accent - Classic triple line with center medallion -->
                <div class="edge-accent edge-top">
                  <svg viewBox="0 0 60 12" class="edge-ornament">
                    <!-- Triple lines -->
                    <line x1="0" y1="6" x2="24" y2="6" stroke-width="1.5" class="edge-line"/>
                    <line x1="36" y1="6" x2="60" y2="6" stroke-width="1.5" class="edge-line"/>
                    <line x1="0" y1="9" x2="23" y2="9" stroke-width="0.5" class="edge-detail-line"/>
                    <line x1="37" y1="9" x2="60" y2="9" stroke-width="0.5" class="edge-detail-line"/>
                    <!-- Center medallion -->
                    <circle cx="30" cy="6" r="5" class="edge-medallion"/>
                    <circle cx="30" cy="6" r="3" class="edge-medallion-inner"/>
                  </svg>
                </div>

                <!-- Bottom Center Accent - Classic triple line with center medallion -->
                <div class="edge-accent edge-bottom">
                  <svg viewBox="0 0 60 12" class="edge-ornament">
                    <!-- Triple lines -->
                    <line x1="0" y1="6" x2="24" y2="6" stroke-width="1.5" class="edge-line"/>
                    <line x1="36" y1="6" x2="60" y2="6" stroke-width="1.5" class="edge-line"/>
                    <line x1="0" y1="3" x2="23" y2="3" stroke-width="0.5" class="edge-detail-line"/>
                    <line x1="37" y1="3" x2="60" y2="3" stroke-width="0.5" class="edge-detail-line"/>
                    <!-- Center medallion -->
                    <circle cx="30" cy="6" r="5" class="edge-medallion"/>
                    <circle cx="30" cy="6" r="3" class="edge-medallion-inner"/>
                  </svg>
                </div>

                <h2
                  class="scaled-guest-name font-regular khmer-text-fix text-center guest-name-single-line"
                  :style="guestNameTextStyle"
                >
                  {{ guestName }}
                </h2>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Swipe Up Arrow Indicator -->
    <div class="swipe-up-arrow animation-delay-800">
      <div class="arrow-stack">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          :stroke="primaryColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="arrow-icon arrow-1"
        >
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          :stroke="primaryColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="arrow-icon arrow-2"
        >
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { translateRSVP, type SupportedLanguage } from '../../utils/translations'
import fallbackLogoSvg from '../../assets/temp-showcase-logo.svg?raw'

interface TemplateAssets {
  open_envelope_button?: string
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
  templateAssets?: TemplateAssets | null
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
  isInteractionDisabled?: boolean // Disables tap/swipe when true
  getMediaUrl: (url: string) => string
  contentTopPosition?: number // Vertical position in vh units (0-100)
  coverTopDecoration?: string | null
  coverBottomDecoration?: string | null
  coverLeftDecoration?: string | null
  coverRightDecoration?: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  openEnvelope: []
}>()

// Touch gesture detection
const touchStartY = ref(0)
const touchEndY = ref(0)
const isTouchDevice = ref(false)
const MIN_SWIPE_DISTANCE = 50 // Minimum pixels to trigger swipe

const handleTouchStart = (e: TouchEvent) => {
  isTouchDevice.value = true
  touchStartY.value = e.touches[0].clientY
}

const handleTouchMove = (e: TouchEvent) => {
  touchEndY.value = e.touches[0].clientY

  // Note: Scrolling is prevented by CSS touch-action: none (see line 13)
  // No need to call preventDefault() here
}

const handleTouchEnd = (e: TouchEvent) => {
  const swipeDistance = touchStartY.value - touchEndY.value
  const isSwipeUp = swipeDistance > MIN_SWIPE_DISTANCE

  // Check if it's a swipe up (positive distance) and exceeds minimum distance
  // OR if it's a tap (very small movement) to support both tap and swipe
  const isTap = Math.abs(swipeDistance) < 10

  if (isSwipeUp || isTap) {
    // Prevent any default behavior to avoid interference
    e.preventDefault()

    // Only emit if interaction is not disabled
    if (!props.isInteractionDisabled) {
      emit('openEnvelope')
    }
  }

  // Reset values
  touchStartY.value = 0
  touchEndY.value = 0
}

// Click handler for non-touch devices (desktop)
const handleClick = () => {
  // Only trigger on click if it's not a touch device and interaction is not disabled
  if (!isTouchDevice.value && !props.isInteractionDisabled) {
    emit('openEnvelope')
  }
}

// Computed properties for styling
const headerTextStyle = computed(() => ({
  fontFamily: props.primaryFont || props.currentFont,
  color: props.primaryColor,
}))

const guestNameTextStyle = computed(() => {
  // Detect if guest name contains English/Latin characters
  const isEnglishText = props.guestName
    ? /^[a-zA-Z\s\-'.,]+$/.test(props.guestName.trim())
    : false

  // Use Great Vibes font for English text guest names
  const fontFamily = isEnglishText
    ? '"Great Vibes", cursive'
    : props.primaryFont || props.currentFont

  return {
    fontFamily,
    color: props.primaryColor, // Use primary color for text
    textShadow: `0 2px 8px ${props.primaryColor}40`, // Subtle glow
    fontWeight: isEnglishText ? '400' : 'normal',
    // Only capitalize English text - prevents spacing issues with Khmer/other scripts
    textTransform: (isEnglishText ? 'capitalize' : 'none') as 'capitalize' | 'none',
  }
})

const inviteTextStyle = computed(() => ({
  color: props.primaryColor || props.secondaryColor || 'rgba(255, 255, 255, 0.9)',
  fontFamily: props.secondaryFont || props.currentFont,
  textShadow: 'none',
}))

// Text content helpers
const getTextContent = (textType: string, fallback = ''): string => {
  if (props.eventTexts && props.currentLanguage) {
    const text = props.eventTexts.find(
      (text) => text.text_type === textType && text.language === props.currentLanguage,
    )
    if (text?.content) {
      return text.content
    }
  }

  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
  if (textType === 'invite_text') {
    return translateRSVP('invite_text', currentLang)
  }

  return fallback
}

const coverHeader = computed(
  () => props.eventTexts?.find((text) => text.text_type === 'cover_header')?.content,
)

const inviteText = computed(() => getTextContent('invite_text', "You're Invited"))

// Computed style for container positioning
const containerStyle = computed(() => {
  // Default to centered (23.5vh top position for 53vh content = roughly centered on 100vh screen)
  const topPosition = props.contentTopPosition ?? 23.5
  return {
    top: `${topPosition}vh`,
  }
})

// Computed property to process SVG content and add fill="currentColor"
const fallbackLogoSvgContent = computed(() => {
  // Add fill="currentColor" to all <path> elements
  return fallbackLogoSvg.replace(/<path /g, '<path fill="currentColor" ')
})

// Computed style for fallback logo with primary color
const fallbackLogoStyle = computed(() => {
  return {
    color: props.primaryColor,
    filter: `drop-shadow(0 4px 20px ${props.primaryColor}40)`,
  }
})

// Computed style for premium frame with primary color accents
const premiumFrameStyle = computed(() => {
  return {
    '--primary-color': props.primaryColor,
    '--accent-glow': `${props.primaryColor}40`,
  }
})

// Computed style for guest name backdrop - Liquid glass effect
const guestNameBackdropStyle = computed(() => {
  return {
    background: `
      linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.25) 0%,
        rgba(255, 255, 255, 0.1) 50%,
        rgba(255, 255, 255, 0.15) 100%
      )
    `,
    backdropFilter: 'blur(16px) saturate(180%)',
    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
  }
})
</script>

<style scoped>
/* Import shared cover stage styles */
@import './cover-stage-styles.css';

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
  align-items: center;
  justify-content: center;
  max-width: 100%;
}

/* Guest name content with liquid glass effect */
.guest-name-content {
  padding: 0.875rem 2rem;
  position: relative;
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  box-shadow:
    0 8px 32px 0 rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset,
    0 0 48px var(--accent-glow);

  /* Elegant entrance animation */
  animation: elegantFrameEntrance 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes elegantFrameEntrance {
  0% {
    opacity: 0;
    transform: scale(0.85);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Corner Decorations - Classic refined borders */
.corner-decor {
  position: absolute;
  width: 30px;
  height: 30px;
  z-index: 2;
  opacity: 0;
  animation: cornerSpreadOut 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.corner-ornament {
  width: 100%;
  height: 100%;
}

@keyframes cornerSpreadOut {
  0% {
    opacity: 0;
    /* Start from center of the frame */
    top: 50%;
    left: 50%;
    bottom: auto;
    right: auto;
    transform: translate(-50%, -50%) scale(0.3) rotate(45deg);
  }
  40% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    /* Final position set by individual corner classes */
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
}

.corner-line {
  stroke: var(--primary-color);
  stroke-linecap: square;
  fill: none;
  stroke-dasharray: 30;
  stroke-dashoffset: 30;
  animation: drawLine 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  animation-delay: inherit;
}

.corner-inner-line {
  stroke: var(--primary-color);
  stroke-linecap: square;
  fill: none;
  opacity: 0;
  stroke-dasharray: 30;
  stroke-dashoffset: 30;
  animation: drawLineWithOpacity 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  animation-delay: inherit;
}

.corner-accent-square {
  fill: var(--primary-color);
  stroke: none;
  opacity: 0;
  animation: fadeInSquare 0.5s ease-out forwards;
  animation-delay: inherit;
}

@keyframes drawLineWithOpacity {
  0% {
    opacity: 0;
    stroke-dashoffset: 30;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 0.6;
    stroke-dashoffset: 0;
  }
}

@keyframes drawLine {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes fadeInSquare {
  from {
    opacity: 0;
    transform: scale(0);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Corner Positions with staggered animation delays */
.corner-tl {
  top: -1px;
  left: -1px;
  animation-delay: 0.2s;
}

.corner-tr {
  top: -1px;
  right: -1px;
  animation-delay: 0.25s;
}

.corner-bl {
  bottom: -1px;
  left: -1px;
  animation-delay: 0.3s;
}

.corner-br {
  bottom: -1px;
  right: -1px;
  animation-delay: 0.35s;
}

/* Edge Accents - Classic center medallions with divider lines */
.edge-accent {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  animation: edgeSpreadOut 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes edgeSpreadOut {
  0% {
    opacity: 0;
    /* Start from vertical center */
    top: 50%;
    bottom: auto;
    transform: translateX(-50%) translateY(-50%) scale(0.2);
  }
  40% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    /* Final position set by individual edge classes */
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

.edge-top {
  top: -6px;
  animation-delay: 0.4s;
}

.edge-bottom {
  bottom: -6px;
  animation-delay: 0.45s;
}

.edge-ornament {
  width: 60px;
  height: 12px;
}

.edge-line {
  stroke: var(--primary-color);
  stroke-linecap: round;
  fill: none;
  stroke-dasharray: 30;
  stroke-dashoffset: 30;
  animation: drawEdgeLine 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  animation-delay: inherit;
}

.edge-detail-line {
  stroke: var(--primary-color);
  stroke-linecap: round;
  fill: none;
  opacity: 0;
  stroke-dasharray: 30;
  stroke-dashoffset: 30;
  animation: drawEdgeDetailLine 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  animation-delay: inherit;
}

.edge-medallion {
  fill: none;
  stroke: var(--primary-color);
  stroke-width: 1.5;
  stroke-dasharray: 32;
  stroke-dashoffset: 32;
  animation: drawCircle 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  animation-delay: inherit;
}

.edge-medallion-inner {
  fill: var(--primary-color);
  stroke: none;
  opacity: 0;
  transform-origin: center;
  animation: fillMedallion 0.5s ease-out forwards;
  animation-delay: inherit;
}

@keyframes drawEdgeLine {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes drawEdgeDetailLine {
  to {
    opacity: 0.5;
    stroke-dashoffset: 0;
  }
}

@keyframes drawCircle {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes fillMedallion {
  from {
    opacity: 0;
    transform: scale(0);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.guest-name-single-line {
  white-space: nowrap !important;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
  max-width: 100%;
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
  padding-top: 0 !important;
  margin-top: 0 !important;

  /* Elegant text reveal animation - happens after decorations spread */
  opacity: 0;
  animation: revealGuestName 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: 1s;
}

@keyframes revealGuestName {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(12px);
    letter-spacing: 0.3em;
  }
  60% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
    letter-spacing: normal;
  }
}

/* Great Vibes font enhancement for better visibility */
.scaled-guest-name[style*="Great Vibes"] {
  font-size: 1.3em !important;
  letter-spacing: 0.02em;
}

/* Desktop - reduce guest name size */
@media (min-width: 1024px) {
  .content-row-guest .scaled-guest-name {
    font-size: clamp(0.65rem, 2vh, 1.2rem) !important;
  }

  .content-row-guest .scaled-guest-name[style*="Great Vibes"] {
    font-size: clamp(0.85rem, 2.6vh, 1.6rem) !important;
  }
}

/* Mobile - reduce guest name size */
@media (max-width: 640px) {
  .content-row-guest .scaled-guest-name {
    font-size: clamp(0.65rem, 2vh, 1.2rem) !important;
  }

  .content-row-guest .scaled-guest-name[style*="Great Vibes"] {
    font-size: clamp(0.85rem, 2.6vh, 1.6rem) !important;
  }

  .guest-name-container {
    gap: 0;
    max-width: 90%;
  }

  /* Premium frame mobile adjustments */
  .guest-name-content {
    padding: 0.75rem 1.5rem;
  }

  .corner-decor {
    width: 26px;
    height: 26px;
  }

  .edge-ornament {
    width: 50px;
    height: 10px;
  }

  .edge-top {
    top: -5px;
  }

  .edge-bottom {
    bottom: -5px;
  }
}

/* Swipe Up Arrow Indicator */
.swipe-up-arrow {
  position: absolute;
  bottom: 5vh;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.arrow-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: -32px;
}

.arrow-icon {
  width: 48px;
  height: 48px;
  display: block;
  stroke-width: 3;
  margin-top: -28px;
}

.arrow-icon:first-child {
  margin-top: 0;
}

.arrow-1 {
  animation: arrowFloat1 1.5s ease-in-out infinite;
}

.arrow-2 {
  animation: arrowFloat2 1.5s ease-in-out infinite;
}

@keyframes arrowFloat1 {
  0%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  50% {
    transform: translateY(-12px);
    opacity: 1;
  }
}

@keyframes arrowFloat2 {
  0%, 100% {
    transform: translateY(0);
    opacity: 0.6;
  }
  50% {
    transform: translateY(-12px);
    opacity: 1;
  }
}

/* Responsive arrow size */
@media (max-width: 640px) {
  .arrow-icon {
    width: 40px;
    height: 40px;
    margin-top: -24px;
  }

  .arrow-icon:first-child {
    margin-top: 0;
  }

  .swipe-up-arrow {
    bottom: 3vh;
  }

  .arrow-stack {
    margin-top: -28px;
  }
}

@media (min-width: 1024px) {
  .arrow-icon {
    width: 56px;
    height: 56px;
    margin-top: -32px;
  }

  .arrow-icon:first-child {
    margin-top: 0;
  }

  .arrow-stack {
    margin-top: -36px;
  }
}

/* Swipe Up Animation */
.swipe-up-hidden {
  transform: translateY(-100%);
  opacity: 0;
  pointer-events: none;
}

/* Fallback Logo Styles */
.fallback-logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0.5rem;
}

.fallback-logo {
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
}

.fallback-logo:hover {
  transform: scale(1.05);
}

.fallback-logo :deep(svg) {
  display: block;
  width: auto !important;
  height: 100% !important;
  max-width: 90% !important;
  max-height: 100% !important;
  object-fit: contain;
  margin: 0 auto;
}
</style>
