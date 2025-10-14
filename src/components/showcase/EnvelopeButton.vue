<template>
  <!-- Loading Animation when video is not ready -->
  <div v-if="shouldShowLoading" class="loading-container flex items-center justify-center h-full">
    <div class="loading-spinner-wrapper">
      <div class="loading-spinner" :style="{ borderTopColor: primaryColor }"></div>
      <p
        class="loading-text mt-3 text-center"
        :style="{
          color: primaryColor,
          fontFamily: secondaryFont || currentFont,
        }"
      >
        Loading...
      </p>
    </div>
  </div>

  <!-- Open Envelope Button (shown when video is ready or no video) -->
  <button
    v-else
    @click="$emit('click')"
    class="relative flex items-center justify-center h-full transition-all duration-300 hover:scale-105 cursor-pointer"
  >
    <!-- Button image -->
    <img
      v-if="hasCustomButton && templateAssets?.open_envelope_button"
      :src="getMediaUrl(templateAssets.open_envelope_button)"
      :alt="buttonText"
      class="scaled-envelope-button transition-all duration-300"
    />

    <!-- Fallback button design -->
    <div
      v-else
      class="scaled-button-fallback rounded-full transition-all flex items-center justify-center hover:scale-105 button-bg-gradient"
      :style="fallbackButtonStyleAnimated"
    >
      <span
        class="scaled-button-text font-bold text-white text-center"
        :style="{ fontFamily: primaryFont || currentFont }"
      >
        {{ buttonText }}
      </span>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { translateRSVP, type SupportedLanguage } from '../../utils/translations'

interface TemplateAssets {
  open_envelope_button?: string
}

interface Props {
  shouldShowLoading: boolean
  hasCustomButton: boolean
  templateAssets?: TemplateAssets | null
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  secondaryFont?: string
  currentFont: string
  primaryFont?: string
  gradientStyle: string
  getMediaUrl: (url: string) => string
  currentLanguage?: string
}

const props = defineProps<Props>()

defineEmits<{
  click: []
}>()

const fallbackButtonStyle = computed(() => ({
  background: props.gradientStyle,
  backdropFilter: 'blur(10px)',
}))

const fallbackButtonStyleAnimated = computed(() => ({
  background: `linear-gradient(135deg, ${props.primaryColor}, ${props.secondaryColor || props.accentColor})`,
  backdropFilter: 'blur(10px)',
  backgroundSize: '200% 200%',
}))

const buttonText = computed(() => {
  const lang = (props.currentLanguage as SupportedLanguage) || 'en'
  return translateRSVP('open_invitation', lang)
})
</script>

<style scoped>
/* Loading Spinner Animation */
.loading-spinner-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0.9;
}

.loading-spinner {
  width: clamp(40px, 8vh, 80px);
  height: clamp(40px, 8vh, 80px);
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #3b82f6; /* Will be overridden by dynamic color */
  border-radius: 50%;
  animation: spin 1s linear infinite;
  backdrop-filter: blur(2px);
}

.loading-text {
  font-size: clamp(0.75rem, 2vh, 1rem);
  font-weight: 500;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  opacity: 0.9;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Loading container responsive sizing */
@media (max-width: 480px) {
  .loading-spinner {
    width: clamp(35px, 6vh, 60px);
    height: clamp(35px, 6vh, 60px);
    border-width: 2px;
  }

  .loading-text {
    font-size: clamp(0.625rem, 1.5vh, 0.875rem);
    margin-top: 0.5rem;
  }
}

@media (min-width: 1024px) {
  .loading-spinner {
    width: clamp(50px, 6vh, 70px);
    height: clamp(50px, 6vh, 70px);
    border-width: 4px;
  }

  .loading-text {
    font-size: clamp(0.875rem, 1.8vh, 1.1rem);
  }
}

/* Envelope Button Styles */
.scaled-envelope-button {
  max-height: 80%;
  max-width: 80%;
  height: auto;
  width: auto;
  object-fit: contain;
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.scaled-envelope-button:not(.opacity-50) {
  animation: pulse 2s infinite;
}

.scaled-envelope-button:not(.opacity-50):hover {
  transform: scale(1.1);
  animation: none;
}

.scaled-envelope-button.opacity-50 {
  animation: none;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* Gradient animation for button background */
.button-bg-gradient {
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

.scaled-button-fallback {
  /* Scale fallback button to match envelope button proportions */
  height: clamp(30px, 5vh, 120px);
  min-height: 30px;
  max-height: 120px;
  padding: 0 clamp(0.75rem, 2.5vh, 2.5rem);
  border-radius: clamp(15px, 2.5vh, 60px);
}

.scaled-button-text {
  font-size: clamp(0.5rem, 1.6vh, 1.2rem);
  line-height: 1.1;
  white-space: nowrap;
  font-weight: 600;
}

/* Responsive envelope button scaling based on viewport height only */
/* Mobile Portrait (320px - 480px) */
@media (max-width: 480px) {
  .scaled-envelope-button {
    max-width: min(25vh, 180px);
    min-height: clamp(35px, 6vh, 80px);
  }
}

/* Mobile Landscape and Small Tablets (481px - 768px) */
@media (min-width: 481px) and (max-width: 768px) {
  .scaled-envelope-button {
    max-width: min(30vh, 220px);
    min-height: clamp(40px, 7vh, 100px);
  }
}

/* Tablets and Small Desktops (769px - 1024px) */
@media (min-width: 769px) and (max-width: 1024px) {
  .scaled-envelope-button {
    max-width: min(32vh, 250px);
    min-height: clamp(45px, 8vh, 110px);
  }
}

/* Large Desktops (1025px+) - 35% size reduction */
@media (min-width: 1025px) {
  .scaled-envelope-button {
    max-width: min(19.5vh, 156px);
    min-height: clamp(29px, 5.2vh, 65px);
  }

  .scaled-button-fallback {
    height: clamp(26px, 4.55vh, 65px);
    max-height: 65px;
    padding: 0 clamp(0.65rem, 2.275vh, 1.3rem);
  }

  .scaled-button-text {
    font-size: clamp(0.49rem, 1.43vh, 0.715rem);
  }
}

/* Very Large Screens (1440px+) - 35% size reduction */
@media (min-width: 1440px) {
  .scaled-envelope-button {
    max-width: min(20.8vh, 169px);
    min-height: clamp(32.5px, 5.525vh, 71.5px);
  }

  .scaled-button-fallback {
    height: clamp(29.25px, 4.875vh, 71.5px);
    max-height: 71.5px;
  }

  .scaled-button-text {
    font-size: clamp(0.4875rem, 1.495vh, 0.7475rem);
  }
}

/* Landscape Mobile (short height) - prioritize fitting within viewport */
@media (max-height: 500px) and (orientation: landscape) {
  .scaled-envelope-button {
    max-width: min(20vh, 160px);
    min-height: clamp(30px, 5vh, 60px);
    max-height: 80%;
  }

  .scaled-button-fallback {
    height: clamp(30px, 5vh, 60px);
    min-height: 30px;
    max-height: 60px;
    border-radius: clamp(15px, 2.5vh, 30px);
  }

  .scaled-button-text {
    font-size: clamp(0.625rem, 2vh, 0.9rem);
  }
}

/* Ultra-short viewport handling */
@media (max-height: 400px) {
  .scaled-envelope-button {
    max-width: min(18vh, 140px);
    min-height: clamp(25px, 4vh, 50px);
  }

  .scaled-button-fallback {
    height: clamp(25px, 4vh, 50px);
    border-radius: clamp(12px, 2vh, 25px);
  }
}
</style>
