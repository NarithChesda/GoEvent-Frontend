<template>
  <div class="transition-stage" :class="{ 'stage-fade-out': isStageFadingOut }">
    <!-- Content fades in after cover decorations finish animating out -->
    <div class="transition-content" :class="{ 'show': isContentVisible }">
      <!-- Event Logo -->
      <div v-if="eventLogo" class="logo-container">
        <img
          :src="getMediaUrl(eventLogo)"
          :alt="eventTitle"
          class="event-logo"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  eventTitle: string
  eventLogo?: string | null
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
const isStageFadingOut = ref(false)

let fadeInTimer: ReturnType<typeof setTimeout> | null = null
let fadeOutTimer: ReturnType<typeof setTimeout> | null = null
let completeTimer: ReturnType<typeof setTimeout> | null = null

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
// 0ms       - TransitionStage mounts (transparent overlay, cover decorations are animating out)
// 1300ms    - Content (logo + text) starts fading in (decorations fully out by 1200ms)
// ~2500ms   - Content fully visible
// 4500ms    - Content starts fading out
// 5700ms    - Content fully faded out → emit transitionComplete
onMounted(() => {
  // Wait for cover decorations to finish (0.8s animation + 0.4s max delay = 1.2s)
  fadeInTimer = setTimeout(() => {
    isContentVisible.value = true
  }, 1300)

  // After holding, start fading out the content
  fadeOutTimer = setTimeout(() => {
    isStageFadingOut.value = true
  }, 4500)

  // Emit completion after fade-out finishes
  completeTimer = setTimeout(() => {
    emit('transitionComplete')
  }, 5700)
})

onUnmounted(() => {
  if (fadeInTimer) clearTimeout(fadeInTimer)
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
  align-items: center;
  justify-content: center;
  overflow: hidden;
  pointer-events: none;
}

.transition-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 1.2s ease-out, transform 1.2s ease-out;
}

.transition-content.show {
  opacity: 1;
  transform: translateY(0);
}

/* Fade out content */
.stage-fade-out .transition-content {
  opacity: 0;
  transform: translateY(-10px);
}

.logo-container {
  width: 45vw;
  max-width: 200px;
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

.save-the-date-container {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.save-the-date-label {
  font-size: 1.5rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  margin: 0;
  font-weight: 300;
}

.event-date {
  font-size: 1.1rem;
  letter-spacing: 0.1em;
  margin: 0;
  font-weight: 400;
  opacity: 0.85;
}
</style>
