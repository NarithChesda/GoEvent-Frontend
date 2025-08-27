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

    <!-- Dark Overlay -->
    <div class="absolute inset-0 bg-black/30"></div>

    <!-- Content Overlay -->
    <div class="absolute inset-0 flex flex-col px-4 sm:px-6 md:px-8 text-center">
      <!-- Main Content Container -->
      <div class="absolute top-[25%] left-0 right-0 flex flex-col items-center max-w-5xl mx-auto">

        <!-- Event Title (Top) -->
        <div class="px-12 mb-6 sm:mb-8 md:mb-10 animate-fadeIn">
          <h1
            class="text-2xl sm:text-3xl md:text-3xl lg:text-3xl xl:text-3xl 2xl:text-3xl font-bold leading-relaxed py-2"
            :style="{
              fontFamily: primaryFont || currentFont,
              background: gradientStyle,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }"
          >
            {{ eventTitle }}
          </h1>
        </div>

        <!-- Event Logo -->
        <div
          v-if="eventLogo"
          class="py-4 sm:mb-10 md:mb-12 animate-fadeIn animation-delay-200"
        >
          <img
            :src="getMediaUrl(eventLogo)"
            :alt="eventTitle + ' logo'"
            class="event-logo-showcase mx-auto drop-shadow-2xl"
          />
        </div>

        <!-- Invite Text -->
        <div class="mb-6 sm:mb-8 md:mb-10 animate-fadeIn animation-delay-400">
          <p
            class="text-base sm:text-base md:text-base lg:text-lg xl:text-lg 2xl:text-xl leading-relaxed py-1"
            :style="{
              color: 'rgba(255, 255, 255, 0.9)',
              fontFamily: secondaryFont || currentFont
            }"
          >
            You're Invited
          </p>
        </div>

        <!-- Guest Name -->
        <div v-if="guestName" class="px-12 animate-fadeIn animation-delay-600">

          <h2
            class="text-xl sm:text-2xl md:text-2xl lg:text-2xl xl:text-2xl 2xl:text-2xl font-bold leading-relaxed whitespace-normal break-words py-2"
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
        <div class="mt-4 sm:mt-10 md:mt-12 lg:mt-14 xl:mt-16 flex justify-center animate-fadeIn animation-delay-800">
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

interface TemplateAssets {
  standard_cover_video?: string
  basic_background_photo?: string
  open_envelope_button?: string
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
  getMediaUrl: (url: string) => string
}

const props = defineProps<Props>()

defineEmits<{
  openEnvelope: []
}>()

const gradientStyle = computed(() =>
  `linear-gradient(135deg, ${props.primaryColor}, ${props.secondaryColor || props.accentColor})`
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
    width: 240px;
  }
}

@media (min-width: 1280px) {
  .envelope-button-size {
    width: 260px;
  }
}

@media (min-width: 1536px) {
  .envelope-button-size {
    width: 280px;
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
    max-height: 180px;
    max-width: 450px;
  }
}

@media (min-width: 1280px) {
  .event-logo-showcase {
    max-height: 200px;
    max-width: 500px;
  }
}

@media (min-width: 1536px) {
  .event-logo-showcase {
    max-height: 220px;
    max-width: 550px;
  }
}
</style>
