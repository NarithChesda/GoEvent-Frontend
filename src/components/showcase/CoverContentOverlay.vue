<template>
  <div
    @click="$emit('openEnvelope')"
    class="absolute inset-0 flex justify-center px-4 sm:px-6 md:px-8 text-center transition-opacity duration-500 cursor-pointer"
    :class="{ 'opacity-0 pointer-events-none': isContentHidden }"
    style="z-index: 10"
  >
    <!-- Inner Container with Dynamic Top Position -->
    <div
      class="inner-container-rows flex flex-col w-full max-w-5xl mx-auto absolute"
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
            class="scaled-header font-bold capitalize khmer-text-fix text-center"
            :style="headerTextStyle"
          >
            {{ coverHeader || eventTitle }}
          </h1>
        </div>
      </div>

      <!-- Event Logo Row: 48% -->
      <div
        v-if="eventLogo"
        class="content-row-logo flex items-center justify-center animate-fadeIn animation-delay-200"
        style="height: 48%"
      >
        <div class="flex items-center justify-center h-full w-full px-4">
          <img
            :src="getMediaUrl(eventLogo)"
            :alt="eventTitle + ' logo'"
            class="scaled-logo mx-auto"
            fetchpriority="high"
          />
        </div>
      </div>

      <!-- Invite Text Row: 8.75% -->
      <div
        v-if="guestName"
        class="content-row-invite flex items-center justify-center animate-fadeIn animation-delay-400"
        style="height: 8.75%"
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
            <div class="guest-name-line" :style="{ backgroundColor: primaryColor }"></div>
            <h2
              class="scaled-guest-name font-bold capitalize khmer-text-fix text-center guest-name-single-line"
              :style="guestNameTextStyle"
            >
              {{ guestName }}
            </h2>
            <div class="guest-name-line" :style="{ backgroundColor: primaryColor }"></div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { translateRSVP, type SupportedLanguage } from '../../utils/translations'

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
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  eventTexts?: EventText[]
  currentLanguage?: string
  shouldShowButtonLoading: boolean
  getMediaUrl: (url: string) => string
  contentTopPosition?: number // Vertical position in vh units (0-100)
}

const props = defineProps<Props>()

defineEmits<{
  openEnvelope: []
}>()

// Computed properties for styling
const headerTextStyle = computed(() => ({
  fontFamily: props.primaryFont || props.currentFont,
  color: props.primaryColor,
}))

const guestNameTextStyle = computed(() => ({
  fontFamily: props.primaryFont || props.currentFont,
  color: props.primaryColor,
  textShadow: 'none',
}))

const inviteTextStyle = computed(() => ({
  color: props.primaryColor || 'rgba(255, 255, 255, 0.9)',
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
</script>

<style scoped>
/* Import shared cover stage styles */
@import './cover-stage-styles.css';

.guest-name-container {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  max-width: 90%;
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
  display: block;
  width: 100%;
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
  padding-top: 0 !important;
  margin-top: 0 !important;
}

@media (max-width: 640px) {
  .guest-name-container {
    gap: 0;
  }

  .guest-name-line {
    height: 1.5px;
  }

  .guest-name-line:first-child {
    margin-bottom: 0.6rem;
  }

  .guest-name-line:last-child {
    margin-top: 0.6rem;
  }
}
</style>
