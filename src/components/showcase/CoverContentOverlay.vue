<template>
  <div
    class="absolute inset-0 flex items-center justify-center px-4 sm:px-6 md:px-8 text-center transition-opacity duration-500"
    :class="{ 'opacity-0 pointer-events-none': isContentHidden }"
    style="z-index: 10"
  >
    <!-- Centered Inner Container with Row Distribution -->
    <div class="inner-container-rows flex flex-col w-full max-w-5xl mx-auto" style="height: 53vh">
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
            class="scaled-header gleam-animation font-bold capitalize khmer-text-fix text-center"
            :style="headerTextStyle"
          >
            {{ coverHeader || eventTitle }}
          </h1>
        </div>
      </div>

      <!-- Event Logo Row: 38% -->
      <div
        v-if="eventLogo"
        class="content-row-logo flex items-center justify-center animate-fadeIn animation-delay-200"
        style="height: 38%"
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

      <!-- Guest Name Row: 12.5% -->
      <div
        v-if="guestName"
        class="content-row-guest flex items-center justify-center animate-fadeIn animation-delay-600"
        style="height: 12.5%"
      >
        <div
          class="guest-content-container flex items-center justify-center px-4 w-full"
          style="height: 50%"
        >
          <h2
            class="scaled-guest-name gleam-animation font-bold capitalize khmer-text-fix text-center"
            :style="guestNameTextStyle"
          >
            {{ guestName }}
          </h2>
        </div>
      </div>

      <!-- Open Envelope Button Row: 20% -->
      <div
        class="content-row-button flex items-center justify-center animate-fadeIn animation-delay-800"
        style="height: 20%"
      >
        <div class="flex items-center justify-center h-full w-full">
          <EnvelopeButton
            :shouldShowLoading="shouldShowButtonLoading"
            :hasCustomButton="hasCustomButton"
            :templateAssets="templateAssets"
            :primaryColor="primaryColor"
            :secondaryFont="secondaryFont"
            :currentFont="currentFont"
            :primaryFont="primaryFont"
            :gradientStyle="gradientStyle"
            :getMediaUrl="getMediaUrl"
            @click="$emit('openEnvelope')"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { translateRSVP, type SupportedLanguage } from '../../utils/translations'
import EnvelopeButton from './EnvelopeButton.vue'

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
}

const props = defineProps<Props>()

defineEmits<{
  openEnvelope: []
}>()

// Computed properties for styling
const gradientStyle = computed(
  () =>
    `linear-gradient(135deg, ${props.primaryColor}, ${props.secondaryColor || props.accentColor})`,
)

const headerTextStyle = computed(() => ({
  fontFamily: props.primaryFont || props.currentFont,
  background: `linear-gradient(45deg, ${props.primaryColor} 0%, ${props.secondaryColor || props.accentColor} 50%, ${props.primaryColor} 100%)`,
  backgroundSize: '200% 200%',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}))

const guestNameTextStyle = computed(() => ({
  fontFamily: props.primaryFont || props.currentFont,
  background: `linear-gradient(45deg, ${props.primaryColor} 0%, ${props.secondaryColor || props.accentColor} 50%, ${props.primaryColor} 100%)`,
  backgroundSize: '200% 200%',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}))

const inviteTextStyle = computed(() => ({
  color: props.primaryColor || 'rgba(255, 255, 255, 0.9)',
  fontFamily: props.secondaryFont || props.currentFont,
  textShadow: 'none',
}))

const hasCustomButton = computed(
  () =>
    Boolean(props.templateAssets?.open_envelope_button) &&
    props.templateAssets?.open_envelope_button?.trim() !== '',
)

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
</script>

<style scoped>
/* Import shared cover stage styles */
@import './cover-stage-styles.css';
</style>
