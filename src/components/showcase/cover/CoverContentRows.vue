<template>
  <div
    class="inner-container-rows flex flex-col w-full mx-auto absolute"
    :style="containerStyle"
  >
    <!-- Event Title Row -->
    <div
      class="content-row-header flex items-center justify-center"
      :class="{ 'animate-fadeIn': showAnimations }"
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
          {{ displayTitle }}
        </h1>
      </div>
    </div>

    <!-- Event Logo Row -->
    <div
      class="content-row-logo flex items-center justify-center"
      :class="{ 'animate-fadeIn animation-delay-200': showAnimations }"
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
          <div class="fallback-logo" v-html="processedFallbackLogo" />
        </div>
      </div>
    </div>

    <!-- Invite Text Row -->
    <div
      v-if="guestName"
      class="content-row-invite flex items-center justify-center"
      :class="{ 'animate-fadeIn animation-delay-400': showAnimations }"
      :style="{ ...rowStyles.inviteText, overflow: 'visible' }"
    >
      <div
        class="invite-content-container flex items-center justify-center px-4 w-full"
        style="height: 60%"
      >
        <p class="scaled-invite-text khmer-text-fix text-center" :style="inviteTextStyle">
          {{ displayInviteText }}
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
      <div class="guest-content-container flex items-center justify-center px-4 w-full">
        <GuestNameFrame
          ref="guestNameFrameRef"
          :guest-name="guestName"
          :primary-color="primaryColor"
          :guestname-color="guestnameColor"
          :primary-font="primaryFont"
          :current-font="currentFont"
          :get-media-url="getMediaUrl"
          :display-liquid-glass="displayLiquidGlass"
          :guest-title-frame-left="guestTitleFrameLeft"
          :guest-title-frame-mid="guestTitleFrameMid"
          :guest-title-frame-right="guestTitleFrameRight"
          :scale="guestNameScale"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { translateRSVP, type SupportedLanguage } from '@/utils/translations'
import { useAssetProtection } from '@/composables/showcase/useAssetProtection'
import GuestNameFrame from './GuestNameFrame.vue'
import fallbackLogoSvg from '@/assets/temp-showcase-logo.svg?raw'

interface RowStyles {
  eventTitle: { height: string }
  logo: { height: string }
  inviteText: { height: string }
  guestName: { height: string }
}

interface EventText {
  text_type: string
  language: string
  content: string
}

interface Props {
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
  /** Show fade-in animations (for decoration mode) */
  showAnimations?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showAnimations: false,
  displayLiquidGlass: true,
})

const { protectionAttrs } = useAssetProtection()

// Refs for guest name scaling
const guestContainerRef = ref<HTMLElement | null>(null)
const guestNameFrameRef = ref<InstanceType<typeof GuestNameFrame> | null>(null)
const guestNameScale = ref(1)

// Text content helpers
const getTextContent = (textType: string, fallback = ''): string => {
  if (props.eventTexts && props.currentLanguage) {
    const text = props.eventTexts.find(
      (t) => t.text_type === textType && t.language === props.currentLanguage,
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

// Cover header from event texts
const coverHeader = computed(
  () => props.eventTexts?.find((text) => text.text_type === 'cover_header')?.content,
)

// Display title (cover header or event title)
const displayTitle = computed(() => coverHeader.value || props.eventTitle)

// Invite text
const displayInviteText = computed(() => getTextContent('invite_text', "You're Invited"))

// Header text style
const headerTextStyle = computed(() => ({
  fontFamily: props.primaryFont || props.currentFont,
  color: props.primaryColor,
}))

// Invite text style
const inviteTextStyle = computed(() => ({
  color: props.primaryColor || props.secondaryColor || 'rgba(255, 255, 255, 0.9)',
  fontFamily: props.secondaryFont || props.currentFont,
  textShadow: 'none',
}))

// Process fallback logo SVG
const processedFallbackLogo = computed(() => {
  return fallbackLogoSvg.replace(/<path /g, '<path fill="currentColor" ')
})

// Fallback logo style
const fallbackLogoStyle = computed(() => ({
  color: props.primaryColor,
  filter: `drop-shadow(0 4px 20px ${props.primaryColor}40)`,
}))

// Guest name scale calculation
const calculateGuestNameScale = () => {
  if (!guestContainerRef.value || !guestNameFrameRef.value?.guestNameElementRef) return

  guestNameScale.value = 1

  nextTick(() => {
    if (!guestContainerRef.value || !guestNameFrameRef.value?.guestNameElementRef) return

    const containerWidth = guestContainerRef.value.offsetWidth
    const maxWidth = containerWidth * 0.6
    const textWidth = guestNameFrameRef.value.guestNameElementRef.scrollWidth

    if (textWidth > maxWidth && textWidth > 0) {
      const scale = maxWidth / textWidth
      guestNameScale.value = Math.max(0.4, Math.min(1, scale))
    } else {
      guestNameScale.value = 1
    }
  })
}

// ResizeObserver for responsive scaling
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  nextTick(() => {
    calculateGuestNameScale()
  })

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
@import '../cover-stage-styles.css';

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
