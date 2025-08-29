<template>
  <div class="absolute inset-0 z-10" :style="{ backgroundColor: primaryColor }">
    <!-- Standard Cover Video Loop -->
    <video
      v-if="templateAssets?.standard_cover_video"
      :src="getMediaUrl(templateAssets.standard_cover_video)"
      autoplay
      loop
      muted
      playsinline
      class="absolute inset-0 w-full h-full desktop-video-sizing"
    />

    <!-- Fallback Background Image -->
    <div v-else-if="templateAssets?.basic_background_photo" class="absolute inset-0">
      <img
        :src="getMediaUrl(templateAssets.basic_background_photo)"
        alt="Background"
        class="w-full h-full object-cover"
      />
    </div>


    <!-- Content Overlay -->
    <div class="absolute inset-0 flex flex-col px-4 sm:px-6 md:px-8 text-center">
      <!-- Main Content Container -->
      <div class="absolute top-[25%] left-0 right-0 flex flex-col items-center max-w-5xl mx-auto">

        <!-- Event Title (Top) -->
        <div class="px-12 mb-6 sm:mb-8 animate-fadeIn lg:mt-4">
          <h1
            class="text-2xl sm:text-3xl md:text-3xl lg:text-3xl  xl:text-3xl 2xl:text-3xl font-bold py-4 uppercase khmer-text-fix single-line-text"
            :style="{
              fontFamily: primaryFont || currentFont,
              background: gradientStyle,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }"
          >
            {{ coverHeader || eventTitle }}
          </h1>
        </div>

        <!-- Event Logo -->
        <div
          v-if="eventLogo"
          class="sm:mb-10 lg:mb-4 animate-fadeIn animation-delay-200  "
        >
          <img
            :src="getMediaUrl(eventLogo)"
            :alt="eventTitle + ' logo'"
            class="event-logo-showcase mx-auto drop-shadow-2xl"
          />
        </div>

        <!-- Invite Text -->
        <div class="mb-2 sm:mb-3 lg:mb-1 animate-fadeIn animation-delay-400">
          <p
            class="text-base sm:text-base md:text-base lg:text-base xl:text-base 2xl:text-lg leading-relaxed py-1"
            :style="{
              color: primaryColor || 'rgba(255, 255, 255, 0.9)',
              fontFamily: secondaryFont || currentFont
            }"
          >
            {{ inviteText }}
          </p>
        </div>

        <!-- Guest Name -->
        <div v-if="guestName" class="px-12 animate-fadeIn animation-delay-600">

          <h2
            class="text-xl sm:text-2xl md:text-2xl lg:text-2xl xl:text-2xl 2xl:text-2xl font-bold leading-relaxed whitespace-normal break-words py-4 uppercase khmer-text-fix"
            :style="{
              fontFamily: primaryFont || currentFont,
              background: gradientStyle,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              whiteSpace: 'normal',
              wordBreak: 'break-word'
            }"
          >
            {{ guestName }}
          </h2>
        </div>

        <!-- Open Envelope Button (Below Guest Name) -->
        <div class="mt-4 sm:mt-10 md:mt-12 lg:mt-8 xl:mt-8 flex justify-center animate-fadeIn animation-delay-800">
          <button
            @click="$emit('openEnvelope')"
            class="animate-pulse hover:animate-none transform hover:scale-110 transition-all duration-300"
          >
            <img
              v-if="templateAssets?.open_envelope_button"
              :src="getMediaUrl(templateAssets.open_envelope_button)"
              alt="Open Invitation"
              class="envelope-button-size h-auto cursor-pointer drop-shadow-2xl"
            />
            <div
              v-else
              class="px-6 sm:px-8 md:px-10 lg:px-12 py-3 sm:py-4 md:py-5 lg:py-6 rounded-full shadow-2xl transition-all hover:scale-105"
              :style="{
                background: gradientStyle,
                backdropFilter: 'blur(10px)'
              }"
            >
              <span
                class="text-lg sm:text-lg md:text-lg lg:text-xl xl:text-xl 2xl:text-2xl font-bold text-white"
                :style="{ fontFamily: primaryFont || currentFont }"
              >
                Open Invitation
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { translateRSVP, type SupportedLanguage } from '../../utils/translations'

interface TemplateAssets {
  standard_cover_video?: string
  basic_background_photo?: string
  open_envelope_button?: string
}

interface EventText {
  text_type: string
  language: string
  content: string
}

interface Props {
  templateAssets?: TemplateAssets | null
  guestName: string
  eventTitle: string
  eventLogo?: string | null
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  eventTexts?: EventText[]
  currentLanguage?: string
  getMediaUrl: (url: string) => string
}

const props = defineProps<Props>()

defineEmits<{
  openEnvelope: []
}>()

const gradientStyle = computed(() =>
  `linear-gradient(135deg, ${props.primaryColor}, ${props.secondaryColor || props.accentColor})`
)

// Translation function similar to RSVP section
const getTextContent = (textType: string, fallback = ''): string => {
  // First, try to get content from database (eventTexts)
  if (props.eventTexts && props.currentLanguage) {
    const text = props.eventTexts.find(text =>
      text.text_type === textType && text.language === props.currentLanguage
    )
    if (text?.content) {
      console.log(`CoverStage: Found database text for ${textType}:`, text.content)
      return text.content
    }
  }

  // Fallback to frontend translation system
  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
  console.log(`CoverStage: Using frontend translation for ${textType} in language:`, currentLang)

  if (textType === 'invite_text') {
    const translation = translateRSVP('invite_text', currentLang)
    console.log(`CoverStage: Translated invite_text to:`, translation)
    return translation
  }

  return fallback
}

const coverHeader = computed(() =>
  props.eventTexts?.find(text => text.text_type === 'cover_header')?.content
)

const inviteText = computed(() =>
  getTextContent('invite_text', "You're Invited")
)
</script>

<style scoped>
/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 1s ease-out forwards;
}

.animation-delay-200 {
  animation-delay: 200ms;
}

.animation-delay-400 {
  animation-delay: 400ms;
}

.animation-delay-600 {
  animation-delay: 600ms;
}

.animation-delay-800 {
  animation-delay: 800ms;
}

/* Extra small screens adjustment */
@media (max-width: 375px) and (max-height: 700px) {
  /* Reduce spacing for very small mobile screens */
  .mb-4 { margin-bottom: 0.75rem !important; }
  .mb-6 { margin-bottom: 1rem !important; }
}

/* Responsive video sizing */
.desktop-video-sizing {
  position: absolute;
  top: 0;
  left: 0;
  height: 100vh;
  object-position: center;
}

/* Responsive envelope button sizing */
.envelope-button-size {
  width: 198px; /* Mobile default - increased by 10% from 180px */
}

@media (min-width: 640px) {
  .envelope-button-size {
    width: 200px;
  }
}

@media (min-width: 768px) {
  .envelope-button-size {
    width: 220px;
  }
}

@media (min-width: 1024px) {
  .envelope-button-size {
    width: 200px;
  }
}

@media (min-width: 1280px) {
  .envelope-button-size {
    width: 220px;
  }
}

@media (min-width: 1536px) {
  .envelope-button-size {
    width: 240px;
  }
}

/* Mobile devices - stretch height, crop width, center video */
@media (max-width: 768px) {
  .desktop-video-sizing {
    width: 100% !important;
    height: 100vh !important;
    object-fit: cover !important;
    object-position: center center !important;
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    transform: none !important;
  }
}

/* Desktop and tablet landscape - consistent desktop treatment with 100% height */
@media (min-width: 769px) {
  .desktop-video-sizing {
    width: 100%;
    object-fit: contain;
  }
}

/* Text rendering improvements to prevent cut-off */
h1, h2, p {
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow: visible;
  padding-top: 0.1em;
  padding-bottom: 0.1em;
}

/* Single line text forcing */
.single-line-text {
  white-space: nowrap !important;
  overflow: visible !important;
  text-overflow: visible !important;
  line-height: 1.2 !important;
  display: block !important;
  width: max-content !important;
  max-width: 100% !important;
}

/* Enhanced Khmer font rendering */
.khmer-text-fix {
  line-height: 1.8 !important;
  padding-top: 0.3em !important;
  padding-bottom: 0.3em !important;
  margin-top: 0.2em;
  margin-bottom: 0.2em;
  overflow: visible !important;
  text-overflow: visible !important;
  /* Ensure proper space for Khmer ascenders and descenders */
  min-height: 1.8em;
}

/* Override for single line Khmer text */
.khmer-text-fix.single-line-text {
  line-height: 1.4 !important;
  min-height: 1.4em !important;
  white-space: nowrap !important;
}

/* Event Logo Responsive Sizing */
.event-logo-showcase {
  height: auto;
  max-height: 180px; /* Increased by 10% from 120px */
  width: auto;
  max-width: 330px; /* Increased by 10% from 300px */
  object-fit: contain;
  filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.4));
  transition: transform 0.3s ease;
}

.event-logo-showcase:hover {
  transform: scale(1.05);
}

/* Responsive adjustments for logo */
@media (min-width: 640px) {
  .event-logo-showcase {
    max-height: 140px;
    max-width: 350px;
  }
}

@media (min-width: 768px) {
  .event-logo-showcase {
    max-height: 160px;
    max-width: 400px;
  }
}

@media (min-width: 1024px) {
  .event-logo-showcase {
    max-height: 140px;
    max-width: 350px;
  }
}

@media (min-width: 1280px) {
  .event-logo-showcase {
    max-height: 160px;
    max-width: 400px;
  }
}

@media (min-width: 1536px) {
  .event-logo-showcase {
    max-height: 180px;
    max-width: 450px;
  }
}
</style>
