<template>
  <!-- Wrapper for decorations and content -->
  <div class="absolute inset-0">
    <!-- DECORATION ANIMATION: Individual decoration images that slide out -->
    <template v-if="isDecorationAnimation">
      <!-- Left/Right decorations at z-[24], Top/Bottom at z-[25] so top/bottom appear above left/right -->
      <img
        v-if="coverLeftDecorationUrl"
        :src="coverLeftDecorationUrl"
        alt="Left decoration"
        class="absolute top-0 bottom-0 left-0 w-auto h-full pointer-events-none cover-decoration-left"
        :class="animationClasses.decorationClasses.left"
        :style="{ zIndex: decorationZIndexes.left }"
        loading="eager"
        v-bind="protectionAttrs"
      />
      <img
        v-if="coverRightDecorationUrl"
        :src="coverRightDecorationUrl"
        alt="Right decoration"
        class="absolute top-0 bottom-0 right-0 w-auto h-full pointer-events-none cover-decoration-right"
        :class="animationClasses.decorationClasses.right"
        :style="{ zIndex: decorationZIndexes.right }"
        loading="eager"
        v-bind="protectionAttrs"
      />
      <img
        v-if="coverTopDecorationUrl"
        :src="coverTopDecorationUrl"
        alt="Top decoration"
        class="absolute top-0 left-0 right-0 w-full h-auto pointer-events-none cover-decoration-top"
        :class="animationClasses.decorationClasses.top"
        :style="{ zIndex: decorationZIndexes.top }"
        loading="eager"
        v-bind="protectionAttrs"
      />
      <img
        v-if="coverBottomDecorationUrl"
        :src="coverBottomDecorationUrl"
        alt="Bottom decoration"
        class="absolute bottom-0 left-0 right-0 w-full h-auto pointer-events-none cover-decoration-bottom"
        :class="animationClasses.decorationClasses.bottom"
        :style="{ zIndex: decorationZIndexes.bottom }"
        loading="eager"
        v-bind="protectionAttrs"
      />
    </template>

    <!-- DOOR ANIMATION: 3D perspective container for door panels -->
    <div v-if="isDoorAnimation" class="door-perspective-container">
      <!-- Left Door Panel with full cover content (shows left half) -->
      <div
        class="door-panel door-panel-left"
        :class="{ 'door-open-left': isContentHidden }"
      >
        <!-- Full background and content - viewport shows left half -->
        <div class="door-full-content">
          <!-- All decorations at full screen size -->
          <img
            v-if="coverLeftDecorationUrl"
            :src="coverLeftDecorationUrl"
            alt="Left decoration"
            class="absolute top-0 bottom-0 left-0 w-auto h-full pointer-events-none"
            :style="{ zIndex: decorationZIndexes.left }"
            loading="eager"
            v-bind="protectionAttrs"
          />
          <img
            v-if="coverRightDecorationUrl"
            :src="coverRightDecorationUrl"
            alt="Right decoration"
            class="absolute top-0 bottom-0 right-0 w-auto h-full pointer-events-none"
            :style="{ zIndex: decorationZIndexes.right }"
            loading="eager"
            v-bind="protectionAttrs"
          />
          <img
            v-if="coverTopDecorationUrl"
            :src="coverTopDecorationUrl"
            alt="Top decoration"
            class="absolute top-0 left-0 right-0 w-full h-auto pointer-events-none"
            :style="{ zIndex: decorationZIndexes.top }"
            loading="eager"
            v-bind="protectionAttrs"
          />
          <img
            v-if="coverBottomDecorationUrl"
            :src="coverBottomDecorationUrl"
            alt="Bottom decoration"
            class="absolute bottom-0 left-0 right-0 w-full h-auto pointer-events-none"
            :style="{ zIndex: decorationZIndexes.bottom }"
            loading="eager"
            v-bind="protectionAttrs"
          />

          <!-- All content elements at full screen size -->
          <div class="door-content-layer">
            <div class="inner-container-rows flex flex-col w-full mx-auto absolute" :style="containerStyle">
              <!-- Event Title Row -->
              <div class="content-row-header flex items-center justify-center" :style="rowStyles.eventTitle">
                <div class="header-content-container flex items-center justify-center px-4 w-full" style="height: 60%">
                  <h1 class="scaled-header font-regular capitalize khmer-text-fix text-center" :style="headerTextStyle">
                    {{ coverHeader || eventTitle }}
                  </h1>
                </div>
              </div>

              <!-- Event Logo Row -->
              <div class="content-row-logo flex items-center justify-center" :style="rowStyles.logo">
                <div class="flex items-center justify-center h-full w-full px-4">
                  <img
                    v-if="eventLogo"
                    :src="getMediaUrl(eventLogo)"
                    :alt="eventTitle + ' logo'"
                    class="scaled-logo mx-auto"
                    fetchpriority="high"
                    v-bind="protectionAttrs"
                  />
                  <div
                    v-else
                    class="fallback-logo-container"
                    :style="fallbackLogoStyle"
                  >
                    <div class="fallback-logo" v-html="fallbackLogoSvgContent" />
                  </div>
                </div>
              </div>

              <!-- Invite Text Row -->
              <div v-if="guestName" class="content-row-invite flex items-center justify-center" :style="{ ...rowStyles.inviteText, overflow: 'visible' }">
                <div class="invite-content-container flex items-center justify-center px-4 w-full" style="height: 60%">
                  <p class="scaled-invite-text khmer-text-fix text-center" :style="inviteTextStyle">
                    {{ inviteText }}
                  </p>
                </div>
              </div>

              <!-- Guest Name Row -->
              <div
                v-if="guestName"
                class="content-row-guest flex items-center justify-center"
                :style="{ ...rowStyles.guestName, overflow: 'visible', zIndex: 100, position: 'relative' }"
              >
                <div class="guest-content-container flex items-center justify-center px-4 w-full">
                  <div class="guest-name-container" :class="{ 'english-name': isEnglishGuestName }">
                    <div class="premium-name-frame" :style="premiumFrameStyle">
                      <div class="split-frame-container" aria-hidden="true">
                        <img :src="computedLeftFrame" alt="" class="frame-left" v-bind="protectionAttrs" />
                        <div class="frame-middle-wrapper">
                          <div class="frame-middle" :style="{ backgroundImage: `url(${computedMiddleFrame})` }" v-bind="protectionAttrs"></div>
                        </div>
                        <img :src="computedRightFrame" alt="" class="frame-right" v-bind="protectionAttrs" />
                      </div>
                      <h2
                        class="scaled-guest-name font-regular khmer-text-fix text-center guest-name-single-line"
                        :style="[guestNameTextStyle, guestNameAutoFitStyle]"
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Door Panel with full cover content (shows right half) -->
      <div
        class="door-panel door-panel-right"
        :class="{ 'door-open-right': isContentHidden }"
      >
        <!-- Full background and content - viewport shows right half -->
        <div class="door-full-content">
          <!-- All decorations at full screen size -->
          <img
            v-if="coverLeftDecorationUrl"
            :src="coverLeftDecorationUrl"
            alt="Left decoration"
            class="absolute top-0 bottom-0 left-0 w-auto h-full pointer-events-none"
            :style="{ zIndex: decorationZIndexes.left }"
            loading="eager"
            v-bind="protectionAttrs"
          />
          <img
            v-if="coverRightDecorationUrl"
            :src="coverRightDecorationUrl"
            alt="Right decoration"
            class="absolute top-0 bottom-0 right-0 w-auto h-full pointer-events-none"
            :style="{ zIndex: decorationZIndexes.right }"
            loading="eager"
            v-bind="protectionAttrs"
          />
          <img
            v-if="coverTopDecorationUrl"
            :src="coverTopDecorationUrl"
            alt="Top decoration"
            class="absolute top-0 left-0 right-0 w-full h-auto pointer-events-none"
            :style="{ zIndex: decorationZIndexes.top }"
            loading="eager"
            v-bind="protectionAttrs"
          />
          <img
            v-if="coverBottomDecorationUrl"
            :src="coverBottomDecorationUrl"
            alt="Bottom decoration"
            class="absolute bottom-0 left-0 right-0 w-full h-auto pointer-events-none"
            :style="{ zIndex: decorationZIndexes.bottom }"
            loading="eager"
            v-bind="protectionAttrs"
          />

          <!-- All content elements at full screen size -->
          <div class="door-content-layer">
            <div class="inner-container-rows flex flex-col w-full mx-auto absolute" :style="containerStyle">
              <!-- Event Title Row -->
              <div class="content-row-header flex items-center justify-center" :style="rowStyles.eventTitle">
                <div class="header-content-container flex items-center justify-center px-4 w-full" style="height: 60%">
                  <h1 class="scaled-header font-regular capitalize khmer-text-fix text-center" :style="headerTextStyle">
                    {{ coverHeader || eventTitle }}
                  </h1>
                </div>
              </div>

              <!-- Event Logo Row -->
              <div class="content-row-logo flex items-center justify-center" :style="rowStyles.logo">
                <div class="flex items-center justify-center h-full w-full px-4">
                  <img
                    v-if="eventLogo"
                    :src="getMediaUrl(eventLogo)"
                    :alt="eventTitle + ' logo'"
                    class="scaled-logo mx-auto"
                    fetchpriority="high"
                    v-bind="protectionAttrs"
                  />
                  <div
                    v-else
                    class="fallback-logo-container"
                    :style="fallbackLogoStyle"
                  >
                    <div class="fallback-logo" v-html="fallbackLogoSvgContent" />
                  </div>
                </div>
              </div>

              <!-- Invite Text Row -->
              <div v-if="guestName" class="content-row-invite flex items-center justify-center" :style="{ ...rowStyles.inviteText, overflow: 'visible' }">
                <div class="invite-content-container flex items-center justify-center px-4 w-full" style="height: 60%">
                  <p class="scaled-invite-text khmer-text-fix text-center" :style="inviteTextStyle">
                    {{ inviteText }}
                  </p>
                </div>
              </div>

              <!-- Guest Name Row -->
              <div
                v-if="guestName"
                class="content-row-guest flex items-center justify-center"
                :style="{ ...rowStyles.guestName, overflow: 'visible', zIndex: 100, position: 'relative' }"
              >
                <div class="guest-content-container flex items-center justify-center px-4 w-full">
                  <div class="guest-name-container" :class="{ 'english-name': isEnglishGuestName }">
                    <div class="premium-name-frame" :style="premiumFrameStyle">
                      <div class="split-frame-container" aria-hidden="true">
                        <img :src="computedLeftFrame" alt="" class="frame-left" v-bind="protectionAttrs" />
                        <div class="frame-middle-wrapper">
                          <div class="frame-middle" :style="{ backgroundImage: `url(${computedMiddleFrame})` }" v-bind="protectionAttrs"></div>
                        </div>
                        <img :src="computedRightFrame" alt="" class="frame-right" v-bind="protectionAttrs" />
                      </div>
                      <h2
                        class="scaled-guest-name font-regular khmer-text-fix text-center guest-name-single-line"
                        :style="[guestNameTextStyle, guestNameAutoFitStyle]"
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Clickable overlay for door animation (invisible but captures clicks) -->
    <div
      v-if="isDoorAnimation && !isContentHidden"
      @click="handleClick"
      @touchstart.passive="handleTouchStart"
      @touchmove.passive="handleTouchMove"
      @touchend="handleTouchEnd"
      class="absolute inset-0"
      :class="{
        'cursor-pointer': !isInteractionDisabled,
        'cursor-not-allowed': isInteractionDisabled
      }"
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
      :class="[
        animationClasses.mainContentClasses,
        {
          'cursor-pointer': !isInteractionDisabled,
          'cursor-not-allowed': isInteractionDisabled
        }
      ]"
      style="z-index: 30; touch-action: none;"
    >

    <!-- Inner Container with Dynamic Top Position and Height -->
    <div
      class="inner-container-rows flex flex-col w-full mx-auto absolute"
      :style="containerStyle"
    >
      <!-- Event Title Row -->
      <div
        class="content-row-header flex items-center justify-center animate-fadeIn"
        :style="rowStyles.eventTitle"
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

      <!-- Event Logo Row -->
      <div
        class="content-row-logo flex items-center justify-center animate-fadeIn animation-delay-200"
        :style="rowStyles.logo"
      >
        <div class="flex items-center justify-center h-full w-full px-4">
          <img
            v-if="eventLogo"
            :src="getMediaUrl(eventLogo)"
            :alt="eventTitle + ' logo'"
            class="scaled-logo mx-auto"
            fetchpriority="high"
            v-bind="protectionAttrs"
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

      <!-- Invite Text Row -->
      <div
        v-if="guestName"
        class="content-row-invite flex items-center justify-center animate-fadeIn animation-delay-400"
        :style="{ ...rowStyles.inviteText, overflow: 'visible' }"
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

      <!-- Guest Name Row -->
      <div
        v-if="guestName"
        ref="guestContainerRef"
        class="content-row-guest flex items-center justify-center"
        :style="{ ...rowStyles.guestName, overflow: 'visible', zIndex: 100, position: 'relative' }"
      >
        <div
          class="guest-content-container flex items-center justify-center px-4 w-full"
        >
          <div class="guest-name-container" :class="{ 'english-name': isEnglishGuestName }">
            <div class="premium-name-frame" :style="premiumFrameStyle">
              <!-- 3-part split frame -->
              <div class="split-frame-container" aria-hidden="true">
                <img :src="computedLeftFrame" alt="" class="frame-left" v-bind="protectionAttrs" />
                <div class="frame-middle-wrapper">
                  <div
                    class="frame-middle"
                    :style="{ backgroundImage: `url(${computedMiddleFrame})` }"
                    v-bind="protectionAttrs"
                  ></div>
                </div>
                <img :src="computedRightFrame" alt="" class="frame-right" v-bind="protectionAttrs" />
              </div>
              <!-- Guest name positioned over the frame -->
              <h2
                ref="guestNameRef"
                class="scaled-guest-name font-regular khmer-text-fix text-center guest-name-single-line"
                :style="[guestNameTextStyle, guestNameAutoFitStyle]"
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
        </div>
      </div>

    </div>

    <!-- Swipe Up Arrow Indicator -->
    <div class="swipe-up-arrow animation-delay-800" :style="swipeArrowStyle">
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { translateRSVP, type SupportedLanguage } from '../../utils/translations'
import { useOptimizedDecorations } from '../../composables/showcase/useOptimizedDecorations'
import { useAssetProtection } from '../../composables/showcase/useAssetProtection'
import { useCoverStageLayout } from '../../composables/showcase/useCoverStageLayout'
import { useShowcaseAnimation, type ShowcaseAnimationType } from '../../composables/showcase/useShowcaseAnimation'
import type { CoverStageLayout } from '../../services/api/types/template.types'
import fallbackLogoSvg from '../../assets/temp-showcase-logo.svg?raw'

// Asset protection (production-only)
const { protectionAttrs } = useAssetProtection()
// Default liquid glass frames
import leftFramePng from '../../assets/left-frame.png'
import middleFramePng from '../../assets/middle-frame.png'
import rightFramePng from '../../assets/right-frame.png'
// Transparent fallback frames (when liquid glass is disabled)
import leftFrameTranPng from '../../assets/left-frame-tran.png'
import middleFrameTranPng from '../../assets/middle-frame-tran.png'
import rightFrameTranPng from '../../assets/right-frame-tran.png'

interface TemplateAssets {
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
  /** @deprecated Use coverStageLayout.contentTopPosition instead */
  contentTopPosition?: number // Vertical position in vh units (0-100)
  /** Comprehensive cover stage layout configuration from backend */
  coverStageLayout?: CoverStageLayout
  coverTopDecoration?: string | null
  coverBottomDecoration?: string | null
  coverLeftDecoration?: string | null
  coverRightDecoration?: string | null
  /** Animation type for cover-to-content transition (defaults to env variable) */
  animationType?: ShowcaseAnimationType
}

const props = defineProps<Props>()

const emit = defineEmits<{
  openEnvelope: []
}>()

// Optimized cover decoration image URLs using reactive window dimensions
const {
  leftDecorationUrl: coverLeftDecorationUrl,
  rightDecorationUrl: coverRightDecorationUrl,
  topDecorationUrl: coverTopDecorationUrl,
  bottomDecorationUrl: coverBottomDecorationUrl,
} = useOptimizedDecorations(props, 'cover')

// Cover stage layout configuration with backward compatibility
const {
  containerStyle,
  rowStyles,
  swipeArrowStyle,
  decorationZIndexes,
} = useCoverStageLayout(
  computed(() => props.coverStageLayout),
  computed(() => props.contentTopPosition) // Legacy fallback
)

// Showcase animation configuration
const animationClasses = useShowcaseAnimation({
  animationType: computed(() => props.animationType),
  isContentHidden: computed(() => props.isContentHidden),
})

// Destructure for template usage
const { isDecorationAnimation, isDoorAnimation } = animationClasses

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
    ? /^[a-zA-Z\s\-'.,()&]+$/.test(props.guestName.trim())
    : false

  // Use Great Vibes font for English text guest names
  const fontFamily = isEnglishText
    ? '"Great Vibes", cursive'
    : props.primaryFont || props.currentFont

  return {
    fontFamily,
    color: props.guestnameColor || props.primaryColor,
    fontWeight: isEnglishText ? '400' : 'normal',
    background: 'none',
    backgroundColor: 'transparent',
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

// Capitalize first letter of each word for English names
const capitalizeWords = (str: string) => {
  return str.replace(/\b\w/g, (char) => char.toUpperCase())
}

const formattedGuestName = computed(() => {
  if (!props.guestName) return ''
  const isEnglish = /^[a-zA-Z\s\-'.,()&]+$/.test(props.guestName.trim())
  return isEnglish ? capitalizeWords(props.guestName) : props.guestName
})

const guestNameChars = computed(() => formattedGuestName.value?.split('') || [])

// Split text by words (spaces) for word-level animation
const guestNameWords = computed(() => formattedGuestName.value?.split(/\s+/).filter(Boolean) || [])

// Detect if guest name is English (for character bounce animation)
const isEnglishGuestName = computed(() => {
  return props.guestName ? /^[a-zA-Z\s\-'.,()&]+$/.test(props.guestName.trim()) : false
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
    '--accent-glow': props.primaryColor,
  }
})

// Computed frame URLs with fallback logic:
// 1. Use backend title_frame if available
// 2. If liquid glass is enabled (or default), use liquid glass frames
// 3. Otherwise use transparent frames
const computedLeftFrame = computed(() => {
  // Check if backend provides a title frame
  if (props.templateAssets?.guest_title_frame_left) {
    return props.getMediaUrl(props.templateAssets.guest_title_frame_left)
  }
  // Fallback: check liquid glass setting (default to true if undefined)
  const useLiquidGlass = props.templateAssets?.display_liquid_glass_background !== false
  return useLiquidGlass ? leftFramePng : leftFrameTranPng
})

const computedMiddleFrame = computed(() => {
  // Check if backend provides a title frame
  if (props.templateAssets?.guest_title_frame_mid) {
    return props.getMediaUrl(props.templateAssets.guest_title_frame_mid)
  }
  // Fallback: check liquid glass setting (default to true if undefined)
  const useLiquidGlass = props.templateAssets?.display_liquid_glass_background !== false
  return useLiquidGlass ? middleFramePng : middleFrameTranPng
})

const computedRightFrame = computed(() => {
  // Check if backend provides a title frame
  if (props.templateAssets?.guest_title_frame_right) {
    return props.getMediaUrl(props.templateAssets.guest_title_frame_right)
  }
  // Fallback: check liquid glass setting (default to true if undefined)
  const useLiquidGlass = props.templateAssets?.display_liquid_glass_background !== false
  return useLiquidGlass ? rightFramePng : rightFrameTranPng
})

// Auto-fit text for guest name
const guestNameRef = ref<HTMLElement | null>(null)
const guestContainerRef = ref<HTMLElement | null>(null)
const guestNameScale = ref(1)

// Calculate scale to fit guest name within 75% of container width
const calculateGuestNameScale = () => {
  if (!guestNameRef.value || !guestContainerRef.value) return

  // Reset scale to measure natural width
  guestNameScale.value = 1

  nextTick(() => {
    if (!guestNameRef.value || !guestContainerRef.value) return

    const containerWidth = guestContainerRef.value.offsetWidth
    const maxWidth = containerWidth * 0.6 // 60% of container width
    const textWidth = guestNameRef.value.scrollWidth

    if (textWidth > maxWidth && textWidth > 0) {
      // Calculate scale factor to fit within maxWidth
      const scale = maxWidth / textWidth
      // Clamp scale between 0.4 and 1 to prevent text from becoming too small
      guestNameScale.value = Math.max(0.4, Math.min(1, scale))
    } else {
      guestNameScale.value = 1
    }
  })
}

// Computed style for guest name with dynamic scaling
const guestNameAutoFitStyle = computed(() => {
  return {
    transform: `scale(${guestNameScale.value})`,
    transformOrigin: 'center center',
  }
})

// ResizeObserver for responsive scaling
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  // Initial calculation after mount
  nextTick(() => {
    calculateGuestNameScale()
  })

  // Set up ResizeObserver to recalculate on container resize
  if (guestContainerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      calculateGuestNameScale()
    })
    resizeObserver.observe(guestContainerRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

// Watch for guest name changes
watch(() => props.guestName, () => {
  nextTick(() => {
    calculateGuestNameScale()
  })
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  padding: 0.5rem 2.5rem; /* Add horizontal padding for frame clearance */
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
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
  padding-top: 0 !important;
  margin-top: 0 !important;
  padding-left: 4px;
  padding-right: 4px;
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

/* Reveal animation for Khmer text (original style) */
.reveal-name {
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

/* Desktop - reduce guest name size (original styles) */
@media (min-width: 1024px) {
  .content-row-guest .scaled-guest-name {
    font-size: clamp(0.65rem, 2vh, 1.2rem) !important;
  }

  .content-row-guest .scaled-guest-name[style*="Great Vibes"] {
    font-size: clamp(0.85rem, 2.6vh, 1.6rem) !important;
  }
}

/* Laptop only - additional optimizations */
@media (min-width: 1024px) and (max-width: 1535px) {
  /* Reduce title frame box size */
  .header-content-container {
    height: 50% !important;
  }

  .split-frame-container {
    max-width: 400px;
    height: 50px;
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

  /* Extra padding for English names on mobile to accommodate longer text */
  .guest-name-container.english-name .premium-name-frame {
    padding: 0.5rem 2rem !important;
  }

  /* Reduce guest name frame height on mobile */
  .split-frame-container {
    height: 60px;
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

/* Laptop only - smaller arrow icons */
@media (min-width: 1024px) and (max-width: 1535px) {
  .arrow-icon {
    width: 36px;
    height: 36px;
    margin-top: -22px;
  }

  .arrow-icon:first-child {
    margin-top: 0;
  }

  .arrow-stack {
    margin-top: -26px;
  }
}

/* Swipe Up Animation - fade out background and content */
.swipe-up-hidden {
  transform: translateY(-100%);
  opacity: 0;
  pointer-events: none;
}

/* Decoration slide-out animations - Order: left → right → top → bottom */
.cover-decoration-left,
.cover-decoration-right,
.cover-decoration-top,
.cover-decoration-bottom {
  transition: transform 0.8s ease-out, opacity 0.8s ease-out;
}

.slide-out-to-left {
  transform: translateX(-100%);
  opacity: 0;
  transition-delay: 0.1s;
}

.slide-out-to-right {
  transform: translateX(100%);
  opacity: 0;
  transition-delay: 0.2s;
}

.slide-out-to-top {
  transform: translateY(-100%);
  opacity: 0;
  transition-delay: 0.3s;
}

.slide-out-to-bottom {
  transform: translateY(100%);
  opacity: 0;
  transition-delay: 0.4s;
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

/* ===================
   DOOR ANIMATION STYLES
   =================== */

/* 3D Perspective container for door animation */
.door-perspective-container {
  position: absolute;
  inset: 0;
  perspective: 1500px;
  perspective-origin: center center;
  z-index: 28;
  overflow: hidden;
}

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

/* Door full content - holds full viewport content */
.door-full-content {
  position: absolute;
  top: 0;
  bottom: 0;
  height: 100%;
  transform-style: preserve-3d;
  transition: width 0s 0s, left 0s 0s;
}

/* Door content layer - positions content elements */
.door-content-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 30;
}

/* ==========================================
   CLOSED STATE - Full width unified display
   ========================================== */

/* Left door - CLOSED: covers full viewport, shows complete content */
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

/* ==========================================
   OPEN STATE - Split into two halves
   ========================================== */

/* Left door opens from center to left */
.door-open-left {
  width: 50%;
  transform: perspective(1500px) rotateY(-105deg);
}

.door-open-left .door-full-content {
  width: 200%;
  left: 0;
}

/* Right door becomes visible and opens from center to right */
.door-open-right {
  opacity: 1;
  transform: perspective(1500px) rotateY(105deg);
}

/* Main content visibility for door animation */
.door-content-hidden {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease-out;
}

.door-content-reveal {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease-out 0.8s;
}

/* Inner shadow on doors when opening for depth effect */
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

  .door-perspective-container {
    perspective: none;
  }
}
</style>
