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
        class="content-row-guest flex items-center justify-center animate-fadeIn animation-delay-600"
        style="height: 16%; overflow: visible;"
      >
        <div
          class="guest-content-container flex items-center justify-center px-4 w-full"
        >
          <div class="guest-name-container">
            <div class="premium-name-frame" :style="premiumFrameStyle">
              <!-- Guest name content with integrated decorations -->
              <div class="guest-name-content" :style="guestNameBackdropStyle">
                <!-- Corner Decorations - Integrated into the box -->
                <div class="corner-decor corner-tl"></div>
                <div class="corner-decor corner-tr"></div>
                <div class="corner-decor corner-bl"></div>
                <div class="corner-decor corner-br"></div>

                <!-- Top Center Accent -->
                <div class="edge-accent edge-top">
                  <div class="accent-diamond"></div>
                </div>

                <!-- Bottom Center Accent -->
                <div class="edge-accent edge-bottom">
                  <div class="accent-diamond"></div>
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
}

/* Corner Decorations - Wrapping around the box */
.corner-decor {
  position: absolute;
  width: 24px;
  height: 24px;
  z-index: 2;
}

/* Corner brackets wrapping the box edges - Sharp corners */
.corner-decor::before,
.corner-decor::after {
  content: '';
  position: absolute;
  background-color: var(--primary-color);
  box-shadow: 0 0 10px var(--accent-glow);
}

.corner-decor::before {
  width: 2.5px;
  height: 100%;
}

.corner-decor::after {
  width: 100%;
  height: 2.5px;
}

/* Top Left */
.corner-tl {
  top: -2px;
  left: -2px;
}

.corner-tl::before {
  left: 0;
  top: 0;
}

.corner-tl::after {
  left: 0;
  top: 0;
}

/* Top Right */
.corner-tr {
  top: -2px;
  right: -2px;
}

.corner-tr::before {
  right: 0;
  top: 0;
}

.corner-tr::after {
  right: 0;
  top: 0;
}

/* Bottom Left */
.corner-bl {
  bottom: -2px;
  left: -2px;
}

.corner-bl::before {
  left: 0;
  bottom: 0;
}

.corner-bl::after {
  left: 0;
  bottom: 0;
}

/* Bottom Right */
.corner-br {
  bottom: -2px;
  right: -2px;
}

.corner-br::before {
  right: 0;
  bottom: 0;
}

.corner-br::after {
  right: 0;
  bottom: 0;
}

/* Edge Accents - Top and Bottom Center */
.edge-accent {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.edge-top {
  top: -6px;
}

.edge-bottom {
  bottom: -6px;
}

/* Accent Diamond */
.accent-diamond {
  width: 10px;
  height: 10px;
  background-color: var(--primary-color);
  transform: rotate(45deg);
  box-shadow: 0 0 12px var(--accent-glow);
  position: relative;
}

.accent-diamond::before {
  content: '';
  position: absolute;
  inset: 3px;
  background-color: rgba(255, 255, 255, 0.4);
  border-radius: 1px;
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
    width: 20px;
    height: 20px;
  }

  .corner-decor::before {
    width: 2px;
  }

  .corner-decor::after {
    height: 2px;
  }

  .accent-diamond {
    width: 8px;
    height: 8px;
  }

  .accent-diamond::before {
    inset: 2px;
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
