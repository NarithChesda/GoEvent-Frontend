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
              class="scaled-logo mx-auto fallback-logo"
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
            <div class="guest-name-blur-wrapper" :style="{ backgroundColor: backgroundColor || primaryColor }">
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
    color: props.guestnameColor || '#FFFFFF',
    textShadow: 'none',
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

.guest-name-blur-wrapper {
  /* Safari/iOS compatibility: -webkit prefix MUST come BEFORE standard property */
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  display: inline-block;
  max-width: 100%;
}

.guest-name-line {
  width: 100%;
  height: 2px;
}

.guest-name-line:first-child {
  margin-bottom: 0.75rem;
}

.guest-name-line:last-child {
  margin-top: 0.75rem;
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

  .guest-name-blur-wrapper {
    padding: 0.5rem 1rem;
  }

  .guest-name-line:first-child {
    height: 2px !important;
    margin-bottom: 0.6rem;
  }

  .guest-name-line:last-child {
    height: 2px !important;
    margin-top: 0.6rem;
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
  padding: 0;
}

.fallback-logo {
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 90%;
  max-height: 100%;
  width: 100%;
  height: 100%;
}

.fallback-logo:hover {
  transform: scale(1.05);
}

.fallback-logo :deep(svg) {
  display: block;
  width: auto !important;
  height: 100% !important;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>
