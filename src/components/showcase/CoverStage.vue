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
      @loadeddata="handleCoverVideoLoaded"
      @error="handleCoverVideoError"
    />

    <!-- Fallback Background Image -->
    <div v-else-if="templateAssets?.basic_background_photo" class="absolute inset-0">
      <img
        :src="getMediaUrl(templateAssets.basic_background_photo)"
        alt="Background"
        class="w-full h-full object-cover"
        @load="handleBackgroundImageLoaded"
        @error="handleBackgroundImageError"
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
              :style="{
                fontFamily: primaryFont || currentFont,
                background: `linear-gradient(45deg, ${primaryColor} 0%, ${secondaryColor || accentColor} 50%, ${primaryColor} 100%)`,
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }"
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
              class="scaled-logo mx-auto drop-shadow-2xl"
              @load="handleEventLogoLoaded"
              @error="handleEventLogoError"
            />
          </div>
        </div>

        <!-- Invite Text Row: 8.75% -->
        <div class="content-row-invite flex items-center justify-center animate-fadeIn animation-delay-400" style="height: 8.75%;">
          <div class="invite-content-container flex items-center justify-center px-4 w-full" style="height: 60%;">
            <p
              class="scaled-invite-text khmer-text-fix text-center"
              :style="{
                color: primaryColor || 'rgba(255, 255, 255, 0.9)',
                fontFamily: secondaryFont || currentFont
              }"
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
              :style="{
                fontFamily: primaryFont || currentFont,
                background: `linear-gradient(45deg, ${primaryColor} 0%, ${secondaryColor || accentColor} 50%, ${primaryColor} 100%)`,
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }"
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
              class="flex items-center justify-center h-full"
            >
              <img
                v-if="templateAssets?.open_envelope_button"
                :src="getMediaUrl(templateAssets.open_envelope_button)"
                alt="Open Invitation"
                class="scaled-envelope-button cursor-pointer"
                @load="handleOpenEnvelopeButtonLoaded"
                @error="handleOpenEnvelopeButtonError"
              />

              <div
                v-else
                class="scaled-button-fallback rounded-full transition-all hover:scale-105 flex items-center justify-center"
                :style="{
                  background: gradientStyle,
                  backdropFilter: 'blur(10px)'
                }"
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
      </div> <!-- End Centered Inner Container -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import { translateRSVP, type SupportedLanguage } from '../../utils/translations'
import { useEntranceAnimation } from '../../composables/useAdvancedAnimations'
import { ANIMATION_CONSTANTS } from '../../composables/useScrollAnimations'

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

const emit = defineEmits<{
  openEnvelope: []
  coverStageReady: []
}>()

// Enhanced entrance animations
const { triggerEntrance, triggerSequence } = useEntranceAnimation({
  type: 'elastic',
  duration: ANIMATION_CONSTANTS.DURATION.SLOW,
  easing: ANIMATION_CONSTANTS.EASING.ELASTIC,
  direction: 'up'
})

// Refs for animated elements
const eventTitleRef = ref<HTMLElement>()
const eventLogoRef = ref<HTMLElement>()
const inviteTextRef = ref<HTMLElement>()
const guestNameRef = ref<HTMLElement>()
const envelopeButtonRef = ref<HTMLElement>()

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

// Completion detection state
const assetsLoaded = ref({
  coverVideo: false,
  backgroundImage: false,
  eventLogo: false,
  openEnvelopeButton: false,
  fonts: false
})

const isStageReady = computed(() => {
  // Check if all critical assets are loaded
  const requiredAssets = []

  // Cover video or background image
  if (props.templateAssets?.standard_cover_video) {
    requiredAssets.push(assetsLoaded.value.coverVideo)
  } else if (props.templateAssets?.basic_background_photo) {
    requiredAssets.push(assetsLoaded.value.backgroundImage)
  } else {
    requiredAssets.push(true) // No background asset required
  }

  // Event logo (if present)
  if (props.eventLogo) {
    requiredAssets.push(assetsLoaded.value.eventLogo)
  } else {
    requiredAssets.push(true) // No logo required
  }

  // Open envelope button (if custom image is used)
  if (props.templateAssets?.open_envelope_button) {
    requiredAssets.push(assetsLoaded.value.openEnvelopeButton)
  } else {
    requiredAssets.push(true) // Using default button, no asset required
  }

  // Fonts are always important
  requiredAssets.push(assetsLoaded.value.fonts)

  return requiredAssets.every(loaded => loaded)
})

// Watch for completion and emit event
watch(isStageReady, (ready) => {
  if (ready) {
    console.log('🎭 CoverStage: All assets loaded, stage ready for preloading')
    emit('coverStageReady')
  }
}, { immediate: true })

// Asset loading handlers
const handleCoverVideoLoaded = () => {
  console.log('🎭 CoverStage: Cover video loaded')
  assetsLoaded.value.coverVideo = true
}

const handleCoverVideoError = () => {
  console.warn('🎭 CoverStage: Cover video failed to load')
  assetsLoaded.value.coverVideo = true // Consider it "loaded" to prevent blocking
}

const handleBackgroundImageLoaded = () => {
  console.log('🎭 CoverStage: Background image loaded')
  assetsLoaded.value.backgroundImage = true
}

const handleBackgroundImageError = () => {
  console.warn('🎭 CoverStage: Background image failed to load')
  assetsLoaded.value.backgroundImage = true // Consider it "loaded" to prevent blocking
}

const handleEventLogoLoaded = () => {
  console.log('🎭 CoverStage: Event logo loaded')
  assetsLoaded.value.eventLogo = true
}

const handleEventLogoError = () => {
  console.warn('🎭 CoverStage: Event logo failed to load')
  assetsLoaded.value.eventLogo = true // Consider it "loaded" to prevent blocking
}

const handleOpenEnvelopeButtonLoaded = () => {
  console.log('🎭 CoverStage: Open envelope button loaded')
  assetsLoaded.value.openEnvelopeButton = true
}

const handleOpenEnvelopeButtonError = () => {
  console.warn('🎭 CoverStage: Open envelope button failed to load')
  assetsLoaded.value.openEnvelopeButton = true // Consider it "loaded" to prevent blocking
}

// Font loading detection
const checkFontsLoaded = async () => {
  // Wait for fonts to be applied to the DOM
  await nextTick()

  try {
    // Check if custom fonts are loaded by comparing with fallback fonts
    await document.fonts.ready
    console.log('🎭 CoverStage: Fonts are ready')
    assetsLoaded.value.fonts = true
  } catch (error) {
    console.warn('🎭 CoverStage: Font loading check failed', error)
    assetsLoaded.value.fonts = true // Don't block on font loading issues
  }
}

// Enhanced open envelope with animation
const handleOpenEnvelope = () => {
  if (envelopeButtonRef.value) {
    envelopeButtonRef.value.style.transform = 'scale(0.95)'
    setTimeout(() => {
      if (envelopeButtonRef.value) {
        envelopeButtonRef.value.style.transform = 'scale(1)'
      }
      emit('openEnvelope')
    }, 150)
  } else {
    emit('openEnvelope')
  }
}

onMounted(() => {
  console.log('🎭 CoverStage: Initializing completion detection')

  // Check fonts after a short delay to allow font loading
  setTimeout(checkFontsLoaded, 500)

  // If no assets need loading, mark as ready immediately
  if (!props.templateAssets?.standard_cover_video &&
      !props.templateAssets?.basic_background_photo &&
      !props.eventLogo &&
      !props.templateAssets?.open_envelope_button) {
    console.log('🎭 CoverStage: No assets to load, marking as ready')
    // Will be handled by watcher when fonts are ready
  }
})
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
  transition: transform 0.3s ease;
  animation: pulse 2s infinite;
}

.content-row-button .scaled-envelope-button:hover {
  transform: scale(1.1);
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
