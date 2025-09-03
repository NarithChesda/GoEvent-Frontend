<template>
  <div class="absolute inset-0 z-10" :style="{ backgroundColor: primaryColor }">
    <!-- Hidden Event Video Preloader -->
    <video
      v-if="eventVideoUrl"
      ref="eventVideoPreloader"
      :src="eventVideoUrl"
      muted
      playsinline
      preload="auto"
      class="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
      style="z-index: -10;"
      @loadeddata="handleEventVideoPreloaded"
      @canplaythrough="handleEventVideoReady"
    />
    
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
    <div class="absolute inset-0 flex items-center justify-center px-4 sm:px-6 md:px-8 text-center">
      <!-- Centered Inner Container with Row Distribution -->
      <div class="inner-container-rows flex flex-col w-full max-w-5xl mx-auto" style="height: 53vh;">
        <!-- Event Title Row: 18.75% -->
        <div class="content-row-header flex items-center justify-center animate-fadeIn" style="height: 18.75%;">
          <div class="header-content-container flex items-center justify-center px-4 w-full" style="height: 60%;">
            <h1
              class="scaled-header gleam-animation font-bold uppercase khmer-text-fix text-center"
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
          style="height: 38%;"
        >
          <div class="flex items-center justify-center h-full w-full px-4">
            <img
              :src="getMediaUrl(eventLogo)"
              :alt="eventTitle + ' logo'"
              class="scaled-logo mx-auto"
            />
          </div>
        </div>

        <!-- Invite Text Row: 8.75% -->
        <div class="content-row-invite flex items-center justify-center animate-fadeIn animation-delay-400" style="height: 8.75%;">
          <div class="invite-content-container flex items-center justify-center px-4 w-full" style="height: 60%;">
            <p
              class="scaled-invite-text khmer-text-fix text-center"
              :style="inviteTextStyle"
            >
              {{ inviteText }}
            </p>
          </div>
        </div>

        <!-- Guest Name Row: 12.5% -->
        <div v-if="guestName" class="content-row-guest flex items-center justify-center animate-fadeIn animation-delay-600" style="height: 12.5%;">
          <div class="guest-content-container flex items-center justify-center px-4 w-full" style="height: 50%;">
            <h2
              class="scaled-guest-name gleam-animation font-bold uppercase khmer-text-fix text-center"
              :style="guestNameTextStyle"
            >
              {{ guestName }}
            </h2>
          </div>
        </div>

        <!-- Open Envelope Button Row: 20% -->
        <div class="content-row-button flex items-center justify-center animate-fadeIn animation-delay-800" style="height: 20%;">
          <div class="flex items-center justify-center h-full w-full">
            <button
              @click="$emit('openEnvelope')"
              class="relative flex items-center justify-center h-full transition-all duration-300"
              :class="buttonClasses"
            >

              <!-- Button image -->
              <img
                v-if="hasCustomButton && templateAssets?.open_envelope_button"
                :src="getMediaUrl(templateAssets.open_envelope_button)"
                alt="Open Invitation"
                class="scaled-envelope-button transition-all duration-300"
              />

              <!-- Fallback button design -->
              <div
                v-else
                class="scaled-button-fallback rounded-full transition-all flex items-center justify-center hover:scale-105"
                :style="fallbackButtonStyle"
              >
                <span
                  class="scaled-button-text font-bold text-white text-center"
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
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
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
  eventVideoUrl?: string | null
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  eventTexts?: EventText[]
  currentLanguage?: string
  isEnvelopeButtonReady?: boolean
  getMediaUrl: (url: string) => string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  openEnvelope: []
  coverStageReady: []
  eventVideoPreloaded: []
  eventVideoReady: []
}>()

// Template refs for preloaded video
const eventVideoPreloader = ref<HTMLVideoElement | null>(null)
const eventVideoPreloaded = ref(false)
const eventVideoReady = ref(false)

// Event video preloading handlers
const handleEventVideoPreloaded = () => {
  eventVideoPreloaded.value = true
  emit('eventVideoPreloaded')
}

const handleEventVideoReady = () => {
  eventVideoReady.value = true
  emit('eventVideoReady')
}


// Computed properties for styling
const gradientStyle = computed(() =>
  `linear-gradient(135deg, ${props.primaryColor}, ${props.secondaryColor || props.accentColor})`
)

const headerTextStyle = computed(() => ({
  fontFamily: props.primaryFont || props.currentFont,
  background: `linear-gradient(45deg, ${props.primaryColor} 0%, ${props.secondaryColor || props.accentColor} 50%, ${props.primaryColor} 100%)`,
  backgroundSize: '200% 200%',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text'
}))

const guestNameTextStyle = computed(() => ({
  fontFamily: props.primaryFont || props.currentFont,
  background: `linear-gradient(45deg, ${props.primaryColor} 0%, ${props.secondaryColor || props.accentColor} 50%, ${props.primaryColor} 100%)`,
  backgroundSize: '200% 200%',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text'
}))

const inviteTextStyle = computed(() => ({
  color: props.primaryColor || 'rgba(255, 255, 255, 0.9)',
  fontFamily: props.secondaryFont || props.currentFont,
  textShadow: 'none'
}))

const fallbackButtonStyle = computed(() => ({
  background: gradientStyle.value,
  backdropFilter: 'blur(10px)'
}))

const buttonClasses = computed(() => ({
  'hover:scale-105 cursor-pointer': true
}))

const hasCustomButton = computed(() => 
  props.templateAssets?.open_envelope_button && 
  props.templateAssets.open_envelope_button.trim() !== ''
)

// Text content helpers
const getTextContent = (textType: string, fallback = ''): string => {
  if (props.eventTexts && props.currentLanguage) {
    const text = props.eventTexts.find(text =>
      text.text_type === textType && text.language === props.currentLanguage
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

const coverHeader = computed(() =>
  props.eventTexts?.find(text => text.text_type === 'cover_header')?.content
)

const inviteText = computed(() =>
  getTextContent('invite_text', "You're Invited")
)


// Stage is always ready - no loading states
const isStageReady = computed(() => true)

// Watchers
watch(isStageReady, (ready) => {
  if (ready) {
    emit('coverStageReady')
  }
}, { immediate: true })

// No asset loading handlers needed - stage loads immediately
</script>

<style scoped>
/* Animations */
/* Gleam Animation Styles */
.gleam-animation {
  animation: gradientShift 3s ease-in-out infinite;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

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

/* Responsive envelope button scaling based on viewport height only */
/* Mobile Portrait (320px - 480px) */
@media (max-width: 480px) {
  .content-row-button .scaled-envelope-button {
    max-width: min(25vh, 180px);
    min-height: clamp(35px, 6vh, 80px);
  }
}



/* Mobile Landscape and Small Tablets (481px - 768px) */
@media (min-width: 481px) and (max-width: 768px) {
  .content-row-button .scaled-envelope-button {
    max-width: min(30vh, 220px);
    min-height: clamp(40px, 7vh, 100px);
  }
}

/* Tablets and Small Desktops (769px - 1024px) */
@media (min-width: 769px) and (max-width: 1024px) {
  .content-row-button .scaled-envelope-button {
    max-width: min(32vh, 250px);
    min-height: clamp(45px, 8vh, 110px);
  }
}

/* Large Desktops (1025px+) */
@media (min-width: 1025px) {
  .content-row-button .scaled-envelope-button {
    max-width: min(35vh, 300px);
    min-height: clamp(50px, 9vh, 120px);
  }
}

/* Very Large Screens (1440px+) */
@media (min-width: 1440px) {
  .content-row-button .scaled-envelope-button {
    max-width: min(40vh, 350px);
    min-height: clamp(55px, 10vh, 140px);
  }
}

/* Landscape Mobile (short height) - prioritize fitting within viewport */
@media (max-height: 500px) and (orientation: landscape) {
  .content-row-button .scaled-envelope-button {
    max-width: min(20vh, 160px);
    min-height: clamp(30px, 5vh, 60px);
    max-height: 80%;
  }

  .content-row-button .scaled-button-fallback {
    height: clamp(30px, 5vh, 60px);
    min-height: 30px;
    max-height: 60px;
    border-radius: clamp(15px, 2.5vh, 30px);
  }

  .content-row-button .scaled-button-text {
    font-size: clamp(0.625rem, 2vh, 0.9rem);
  }
}

/* Ultra-short viewport handling */
@media (max-height: 400px) {
  .content-row-button .scaled-envelope-button {
    max-width: min(18vh, 140px);
    min-height: clamp(25px, 4vh, 50px);
  }

  .content-row-button .scaled-button-fallback {
    height: clamp(25px, 4vh, 50px);
    border-radius: clamp(12px, 2vh, 25px);
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
  line-height: 1.6 !important;
  padding-top: 0.5em !important;
  padding-bottom: 0.5em !important;
  margin-top: 0.3em;
  margin-bottom: 0.3em;
  overflow: visible !important;
  text-overflow: visible !important;
  /* Ensure proper space for Khmer ascenders and descenders */
  min-height: 2em;
  /* Additional space for complex Khmer characters */
  box-sizing: content-box !important;
  /* Prevent container clipping */
  contain: none !important;
}

/* Override for single line Khmer text */
.khmer-text-fix.single-line-text {
  line-height: 1.4 !important;
  min-height: 1.4em !important;
  white-space: nowrap !important;
}

/* Row-based Scaling System */
.inner-container-rows {
  overflow: visible;
  /* Allow text to extend beyond container bounds for proper font rendering */
  position: relative;
}

/* Header Row (18.75% of container, content uses 60% of row) - Scale based on available space */
.content-row-header .header-content-container {
  overflow: visible;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Allow space for Khmer font extension */
  padding-top: 0.5em;
  padding-bottom: 0.5em;
}

.content-row-header .scaled-header {
  font-size: clamp(0.75rem, 3vh, 1.8rem);
  line-height: 1.1;
  max-width: 95%;
  width: auto;
  height: auto;
  max-height: none;
  display: block;
  text-align: center;
  overflow: visible;
  word-break: break-word;
  hyphens: auto;
  white-space: normal;
  /* Ensure text scales down if it doesn't fit vertically */
  box-sizing: content-box;
  padding: 0.1rem;
  /* Allow text to extend outside container if needed */
  position: relative;
  z-index: 10;
}

/* Logo Row (38% of container) - Scale to fit within row */
.content-row-logo .scaled-logo {
  max-height: 85%;
  max-width: 85%;
  width: auto;
  height: auto;
  object-fit: contain;
  object-position: center;
}

/* Invite Text Row (8.75% of container, content uses 60% of row) - Scale based on available space */
.content-row-invite .invite-content-container {
  overflow: visible;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Allow space for Khmer font extension */
  padding-top: 0.5em;
  padding-bottom: 0.5em;
}

.content-row-invite .scaled-invite-text {
  font-size: clamp(0.5rem, 1.8vh, 0.75rem);
  line-height: 1.1;
  max-width: 95%;
  width: auto;
  height: auto;
  max-height: none;
  display: block;
  text-align: center;
  overflow: visible;
  word-break: break-word;
  hyphens: auto;
  white-space: normal;
  /* Ensure text scales down if it doesn't fit vertically */
  box-sizing: content-box;
  padding: 0.1rem;
  /* Allow text to extend outside container if needed */
  position: relative;
  z-index: 10;
}

/* Guest Name Row (12.5% of container, content uses 50% of row) - Scale to fit */
.content-row-guest .guest-content-container {
  overflow: visible;
  /* Allow space for Khmer font extension */
  padding-top: 0.5em;
  padding-bottom: 0.5em;
}

.content-row-guest .scaled-guest-name {
  font-size: clamp(0.75rem, 3.5vh, 2rem);
  line-height: 1.2;
  max-width: 95%;
  width: 100%;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  word-break: break-word;
  hyphens: auto;
  /* Allow up to 2 lines, then scale down */
  white-space: normal;
  text-align: center;
  /* Allow text to extend outside container if needed */
  position: relative;
  z-index: 10;
  box-sizing: content-box;
}



.content-row-button .scaled-envelope-button {
  max-height: 80%;
  max-width: 80%;
  height: auto;
  width: auto;
  object-fit: contain;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.content-row-button .scaled-envelope-button:not(.opacity-50) {
  animation: pulse 2s infinite;
}

.content-row-button .scaled-envelope-button:not(.opacity-50):hover {
  transform: scale(1.1);
  animation: none;
}

.content-row-button .scaled-envelope-button.opacity-50 {
  animation: none;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.content-row-button .scaled-button-fallback {
  /* Scale fallback button to match envelope button proportions */
  height: clamp(40px, 8vh, 120px);
  min-height: 40px;
  max-height: 120px;
  padding: 0 clamp(1rem, 4vh, 2.5rem);
  border-radius: clamp(20px, 4vh, 60px);
}

.content-row-button .scaled-button-text {
  font-size: clamp(0.75rem, 2.5vh, 1.2rem);
  line-height: 1.1;
  white-space: nowrap;
  font-weight: 600;
}

/* Ensure all rows maintain their proportions */
.content-row-header,
.content-row-logo,
.content-row-invite,
.content-row-guest,
.content-row-button {
  flex-shrink: 0;
  overflow: hidden;
}

/* Auto-scaling text for long content */
.scaled-header,
.scaled-guest-name {
  /* CSS to ensure text fits within container */
  resize: both;
  min-height: 0;
  min-width: 0;
}

/* If text is too long for single line, allow wrapping and scale down */
.content-row-header .scaled-header {
  /* Scale down font size more aggressively if content is long */
  font-size: clamp(0.75rem, 3vh, 1.8rem);
}

.content-row-guest .scaled-guest-name {
  /* Scale down font size more aggressively if content is long */
  font-size: clamp(0.625rem, 3vh, 1.75rem);
}

/* Additional constraint for very long text */
@media (max-width: 480px) {
  .content-row-header .scaled-header {
    font-size: clamp(0.625rem, 2.5vh, 1.2rem);
    line-height: 1.05;
    max-height: 90%;
  }

  .content-row-guest .scaled-guest-name {
    font-size: clamp(0.5rem, 2.5vh, 1.25rem);
    line-height: 1.1;
  }
}

/* Responsive adjustments for very small screens */
@media (max-height: 500px) {
  .content-row-header .scaled-header {
    font-size: clamp(0.625rem, 2.5vh, 1.2rem);
    line-height: 1.05;
    max-height: 90%;
  }

  .content-row-invite .scaled-invite-text {
    font-size: clamp(0.5rem, 1.5vh, 0.65rem);
  }

  .content-row-guest .scaled-guest-name {
    font-size: clamp(0.5rem, 2.5vh, 1.25rem);
  }

  .content-row-button .scaled-button-text {
    font-size: clamp(0.75rem, 2vh, 1rem);
  }
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
    max-height: 150px;
    max-width: 375px;
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
