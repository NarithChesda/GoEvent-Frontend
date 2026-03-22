<template>
  <div class="transition-stage" :class="{ 'stage-fade-out': isStageFadingOut }">
    <!-- Upper content: Logo + Save the Date text -->
    <div class="transition-upper-content" :class="{ 'show': isContentVisible }">
      <!-- Event Logo -->
      <div class="logo-container">
        <img
          v-if="eventLogo"
          :src="getMediaUrl(eventLogo)"
          :alt="eventTitle"
          class="event-logo"
        />
        <div
          v-else
          class="fallback-logo"
          :style="fallbackLogoStyle"
          v-html="processedFallbackLogo"
        />
      </div>

      <!-- Save the Date Text -->
      <div class="save-the-date-container">
        <p
          class="save-the-date-label"
          :style="{
            fontFamily: secondaryFont || currentFont,
            color: accentColor || '#c9a96e',
          }"
        >
          Save the Date
        </p>
        <p
          v-if="formattedDate"
          class="event-date"
          :style="{
            fontFamily: primaryFont || currentFont,
            color: secondaryColor || primaryColor || '#fff',
          }"
        >
          {{ formattedDate }}
        </p>
      </div>
    </div>

    <!-- Couple Photo: anchored to the bottom -->
    <div
      v-if="couplePhotoUrl"
      class="couple-photo-container"
      :class="{ 'show': isCouplePhotoVisible }"
    >
      <img
        :src="couplePhotoUrl"
        :alt="eventTitle + ' couple'"
        class="couple-photo"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import fallbackLogoSvg from '@/assets/temp-showcase-logo.svg?raw'

interface Props {
  eventTitle: string
  eventLogo?: string | null
  couplePhoto?: string | null
  eventStartDate?: string | null
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  backgroundColor?: string
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  getMediaUrl: (url: string) => string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  transitionComplete: []
}>()

const isContentVisible = ref(false)
const isCouplePhotoVisible = ref(false)
const isStageFadingOut = ref(false)

let fadeInTimer: ReturnType<typeof setTimeout> | null = null
let couplePhotoTimer: ReturnType<typeof setTimeout> | null = null
let fadeOutTimer: ReturnType<typeof setTimeout> | null = null
let completeTimer: ReturnType<typeof setTimeout> | null = null

// Fallback logo SVG processing
const processedFallbackLogo = computed(() => {
  return fallbackLogoSvg.replace(/<path /g, '<path fill="currentColor" ')
})

const fallbackLogoStyle = computed(() => ({
  color: props.accentColor || props.primaryColor || '#c9a96e',
  filter: `drop-shadow(0 4px 20px ${props.accentColor || props.primaryColor || '#c9a96e'}40)`,
}))

const couplePhotoUrl = computed(() => {
  if (props.couplePhoto) {
    return props.getMediaUrl(props.couplePhoto)
  }
  // TODO: Remove test fallback once banner_image is set on events
  return '/images/test-couple-photo.png'
})

const formattedDate = computed(() => {
  if (!props.eventStartDate) return null
  try {
    const date = new Date(props.eventStartDate)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return null
  }
})

// Animation timeline:
// 0ms       - TransitionStage mounts (transparent overlay, cover decorations animating out)
// 1300ms    - Upper content (logo + text) starts fading in
// 1600ms    - Couple photo starts sliding up from bottom
// ~2800ms   - All content fully visible
// 5000ms    - Everything starts fading out
// 6200ms    - Fully faded out → emit transitionComplete
onMounted(() => {
  // Wait for cover decorations to finish (0.8s animation + 0.4s max delay = 1.2s)
  fadeInTimer = setTimeout(() => {
    isContentVisible.value = true
  }, 1300)

  // Couple photo slides up slightly after text appears
  couplePhotoTimer = setTimeout(() => {
    isCouplePhotoVisible.value = true
  }, 1600)

  // After holding, start fading out all content
  fadeOutTimer = setTimeout(() => {
    isStageFadingOut.value = true
  }, 5000)

  // Emit completion after fade-out finishes
  completeTimer = setTimeout(() => {
    emit('transitionComplete')
  }, 6200)
})

onUnmounted(() => {
  if (fadeInTimer) clearTimeout(fadeInTimer)
  if (couplePhotoTimer) clearTimeout(couplePhotoTimer)
  if (fadeOutTimer) clearTimeout(fadeOutTimer)
  if (completeTimer) clearTimeout(completeTimer)
})
</script>

<style scoped>
.transition-stage {
  position: absolute;
  inset: 0;
  z-index: 35;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  overflow: hidden;
  pointer-events: none;
}

/* Upper content: logo + save the date */
.transition-upper-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  padding-top: 25vh;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 1.2s ease-out, transform 1.2s ease-out;
  z-index: 2;
  position: relative;
}

.transition-upper-content.show {
  opacity: 1;
  transform: translateY(0);
}

/* Fade out upper content */
.stage-fade-out .transition-upper-content {
  opacity: 0;
  transform: translateY(-10px);
}

.logo-container {
  width: 35vw;
  max-width: 150px;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.event-logo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* Fallback logo styling */
.fallback-logo {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fallback-logo :deep(svg) {
  width: 100%;
  height: 100%;
}

.save-the-date-container {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.save-the-date-label {
  font-size: 1.35rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  margin: 0;
  font-weight: 300;
}

.event-date {
  font-size: 1rem;
  letter-spacing: 0.1em;
  margin: 0;
  font-weight: 400;
  opacity: 0.85;
}

/* Couple photo: anchored to bottom, scale-up reveal */
.couple-photo-container {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%) scale(0.85);
  width: 85%;
  max-width: 400px;
  opacity: 0;
  transition: opacity 1.5s ease-out, transform 1.5s ease-out;
  z-index: 1;
}

.couple-photo-container.show {
  opacity: 1;
  transform: translateX(-50%) scale(1);
}

/* Fade out couple photo */
.stage-fade-out .couple-photo-container {
  opacity: 0;
  transform: translateX(-50%) scale(1.03);
}

.couple-photo {
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
  /* Mask to fade the top edge into the background */
  mask-image: linear-gradient(to bottom, transparent 0%, black 15%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%);
}
</style>
