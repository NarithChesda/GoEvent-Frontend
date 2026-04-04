<template>
  <div class="transition-stage" :class="{ 'stage-fade-out': isStageFadingOut }">
    <!-- Feature Image: fills the viewport -->
    <div
      v-if="featureImageUrl"
      class="couple-photo-container"
      :class="[{ 'show': isCouplePhotoVisible }, { 'door-mode': animationType === 'door' }]"
    >
      <img
        :src="featureImageUrl"
        :alt="eventTitle"
        class="couple-photo"
      />
    </div>

    <!-- Cloud blur footer overlay -->
    <div class="cloud-footer" :class="{ 'show': isContentVisible }">
      <!-- Blur layer: blurs the couple photo behind it -->
      <div class="cloud-blur-layer" />
      <!-- Gradient mist overlay for the cloudy feel -->
      <div
        class="cloud-mist-layer"
        :style="cloudMistStyle"
      />

      <!-- Save the Date text on top of the cloud -->
      <div class="save-the-date-container">
        <!-- Decorative flourish above -->
        <div class="flourish" :style="{ color: accentColor || '#c9a96e' }">
          &#8212;&thinsp;&#10045;&thinsp;&#8212;
        </div>
        <p
          class="save-the-date-label"
          :style="{
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
            color: secondaryColor || primaryColor || '#333',
          }"
        >
          {{ formattedDate }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { EventPhoto } from '@/types/showcase'

interface Props {
  eventTitle: string
  eventLogo?: string | null
  eventPhotos?: EventPhoto[]
  eventStartDate?: string | null
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  backgroundColor?: string
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  getMediaUrl: (url: string) => string
  /** Controls animation timing. Door mode starts photo immediately so it's visible as the door opens. */
  animationType?: 'decoration' | 'door'
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

const featureImageUrl = computed(() => {
  const featuredPhoto = props.eventPhotos?.find((p) => p.is_featured)
  if (featuredPhoto) {
    return props.getMediaUrl(featuredPhoto.image)
  }
  return null
})

const cloudMistStyle = computed(() => {
  return {
    background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.3) 25%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.92) 70%, #fff 85%)',
  }
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

// Animation timelines:
//
// Decoration mode (default):
//   0ms    - TransitionStage mounts (cover decorations animating out)
//   1000ms - Couple photo starts fading/scaling in
//   1500ms - Cloud footer + save the date text fades in
//   5000ms - Everything starts fading out
//   6200ms - Fully faded out → emit transitionComplete
//
// Door mode:
//   0ms    - TransitionStage mounts simultaneously as door starts opening (1.2s)
//   0ms    - Couple photo starts fading in immediately (visible as door swings open)
//   900ms  - Cloud footer fades in (door is ~75% open at this point)
//   4500ms - Everything starts fading out
//   5700ms - Fully faded out → emit transitionComplete
onMounted(() => {
  const isDoor = props.animationType === 'door'

  // Photo appears first — immediately for door so it's revealed as the door opens,
  // delayed for decoration so it appears after decorations have slid out
  couplePhotoTimer = setTimeout(() => {
    isCouplePhotoVisible.value = true
  }, isDoor ? 0 : 1000)

  // Cloud footer with text
  fadeInTimer = setTimeout(() => {
    isContentVisible.value = true
  }, isDoor ? 900 : 1500)

  // Start fading out
  fadeOutTimer = setTimeout(() => {
    isStageFadingOut.value = true
  }, isDoor ? 4500 : 5000)

  // Emit completion after fade-out finishes
  completeTimer = setTimeout(() => {
    emit('transitionComplete')
  }, isDoor ? 5700 : 6200)
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
  justify-content: flex-end;
  overflow: hidden;
  pointer-events: none;
}

/* Couple photo: fills entire stage, centered with cover */
.couple-photo-container {
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: scale(1.05);
  transition: opacity 1.5s ease-out, transform 1.5s ease-out;
  z-index: 1;
}

.couple-photo-container.show {
  opacity: 1;
  transform: scale(1);
}

/* Door mode: photo fades in over the door animation duration (1.2s),
   so it's fully visible by the time the door completes */
.couple-photo-container.door-mode {
  transition: opacity 1.2s ease-in-out, transform 1.2s ease-out;
}

.stage-fade-out .couple-photo-container {
  opacity: 0;
  transform: scale(1.03);
  transition: opacity 1.2s ease-out, transform 1.2s ease-out;
}

.couple-photo {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
}

/* Cloud blur footer: overlays the bottom of the couple photo */
.cloud-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 38vh;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 8vh;
  opacity: 0;
  /* Small translateY avoids the snap-to-place visible with larger distances */
  transform: translateY(6px);
  /* ease-in-out decelerates gently into final position; avoids the hard stop of ease-out */
  transition: opacity 1.6s ease-in-out, transform 1.6s ease-in-out;
  will-change: opacity, transform;
}

.cloud-footer.show {
  opacity: 1;
  transform: translateY(0);
}

.stage-fade-out .cloud-footer {
  opacity: 0;
  /* Match the incoming translateY so fade-out is the mirror of fade-in */
  transform: translateY(6px);
  transition: opacity 1.2s ease-in-out, transform 1.2s ease-in-out;
}

/* Backdrop blur layer: creates the frosted glass effect over the photo */
.cloud-blur-layer {
  position: absolute;
  inset: 0;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  /* Gradient mask: transparent at top → opaque at bottom, so blur fades in smoothly */
  mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.9) 65%, black 80%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.9) 65%, black 80%);
  /* Promote to its own layer so GPU handles blur independently from opacity animation */
  will-change: transform;
  transform: translateZ(0);
}

/* Mist overlay: adds colored fog/cloud feeling */
.cloud-mist-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* Save the date text */
.save-the-date-container {
  position: relative;
  z-index: 3;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
}

/* Decorative flourish */
.flourish {
  font-size: 0.85rem;
  letter-spacing: 0.3em;
  opacity: 0.7;
  margin-bottom: 0.1rem;
}

/* Elegant script for "Save the Date" */
.save-the-date-label {
  font-family: 'Great Vibes', cursive;
  font-size: 2.4rem;
  line-height: 1.2;
  margin: 0;
  font-weight: 400;
}

/* Clean, readable date */
.event-date {
  font-size: 0.85rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin: 0;
  font-weight: 500;
  opacity: 0.75;
  margin-top: 0.15rem;
}
</style>
