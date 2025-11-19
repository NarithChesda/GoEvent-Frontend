<template>
  <div class="text-center space-y-6 sm:space-y-8">
    <!-- Primary Content Block -->
    <div v-if="descriptionTitle || descriptionText" class="space-y-4">
      <!-- Description Title -->
      <div v-if="descriptionTitle">
        <h2
          :class="[
            'text-base sm:text-lg md:text-xl lg:text-2xl font-regular leading-tight capitalize',
            currentLanguage === 'kh' && 'khmer-text-fix',
          ]"
          :style="{
            fontFamily: primaryFont || currentFont,
            color: primaryColor,
          }"
        >
          {{ descriptionTitle }}
        </h2>
      </div>

      <!-- Description Text -->
      <div v-if="descriptionText">
        <p
          :class="[
            'text-sm sm:text-base leading-normal text-center max-w-full break-words whitespace-pre-wrap opacity-90 px-4',
            currentLanguage === 'kh' && 'khmer-text-fix',
          ]"
          :style="{
            fontFamily: secondaryFont || currentFont,
            color: primaryColor,
            wordWrap: 'break-word',
            hyphens: 'auto',
          }"
        >
          {{ capitalizedDescription }}
        </p>
      </div>
    </div>

    <!-- Event Details Block -->
    <div class="space-y-3">
      <div
        class="block relative gradient-stroke-container"
        :style="{
          background: `${backgroundColor || primaryColor}60`,
          padding: '2px',
          borderRadius: '2rem',
        }"
      >
        <div
          class="px-4 pt-3 pb-4 backdrop-blur-sm space-y-2 relative"
          style="border-radius: calc(2rem - 2px); border: 2px solid white"
          :style="{
           background: `${backgroundColor || primaryColor}60`,
          }"
        >
          <!-- Date Text -->
          <div class="text-sm sm:text-base font-medium leading-snug" v-if="dateText">
            <span
              :class="['text-white', currentLanguage === 'kh' && 'khmer-text-fix']"
              :style="{
                fontFamily: secondaryFont || currentFont,
              }"
            >
              {{ dateText }}
            </span>
          </div>

          <!-- Location Text -->
          <div class="text-sm sm:text-base font-medium leading-snug" v-if="locationText">
            <span
              :class="['text-white', currentLanguage === 'kh' && 'khmer-text-fix']"
              :style="{
                fontFamily: secondaryFont || currentFont,
              }"
            >
              {{ locationText }}
            </span>
          </div>

          <!-- Google Map Embed -->
          <div v-if="hasGoogleMap && googleMapEmbedLink" class="pt-2">
            <div
              class="aspect-video overflow-hidden"
              :style="{
                border: `1px solid rgba(255, 255, 255, 0.3)`,
                borderRadius: '1rem',
              }"
            >
              <iframe
                :src="googleMapEmbedLink"
                width="100%"
                height="100%"
                style="border: 0"
                :allowfullscreen="false"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <!-- Countdown Display - Below Map, Above RSVP -->
          <div v-if="countdown" class="countdown-container px-4 pt-2 pb-2">
            <div class="countdown-wrapper">
              <!-- Countdown Header -->
              <div
                class="countdown-header text-sm sm:text-base font-medium leading-snug mb-2"
                :class="[currentLanguage === 'kh' && 'khmer-text-fix']"
                :style="{
                  fontFamily: secondaryFont || currentFont,
                  color: 'white',
                }"
              >
                {{ countdownHeader }}
              </div>

              <!-- Time display with individual labels -->
              <div class="countdown-time-row">
                <!-- Days -->
                <div class="countdown-unit">
                  <div
                    class="countdown-number"
                    style="font-family: 'Rajdhani', sans-serif;"
                  >
                    {{ countdown.formattedDays }}
                  </div>
                  <div
                    class="countdown-unit-label"
                    :class="[currentLanguage === 'kh' && 'khmer-text-fix']"
                    :style="{
                      fontFamily: secondaryFont || currentFont,
                    }"
                  >
                    {{ dayLabel }}
                  </div>
                </div>

                <!-- Separator -->
                <div
                  class="countdown-separator"
                  style="font-family: 'Rajdhani', sans-serif;"
                >
                  :
                </div>

                <!-- Hours -->
                <div class="countdown-unit">
                  <div
                    class="countdown-number"
                    style="font-family: 'Rajdhani', sans-serif;"
                  >
                    {{ countdown.formattedHours }}
                  </div>
                  <div
                    class="countdown-unit-label"
                    :class="[currentLanguage === 'kh' && 'khmer-text-fix']"
                    :style="{
                      fontFamily: secondaryFont || currentFont,
                    }"
                  >
                    {{ hourLabel }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Divider between Countdown and RSVP -->
          <div v-if="countdown && showRsvp" class="countdown-divider">
            <div class="divider-line"></div>
          </div>

          <!-- RSVP Section Integrated Below Map -->
          <div v-if="showRsvp">
            <slot name="rsvp"></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCountdown } from '../../composables/useCountdown'
import { translateRSVP, type SupportedLanguage } from '../../utils/translations'

interface Props {
  descriptionTitle?: string
  descriptionText?: string
  dateText?: string
  timeText?: string
  locationText?: string
  hasGoogleMap?: boolean
  googleMapEmbedLink?: string
  primaryColor: string
  secondaryColor?: string
  accentColor: string
  backgroundColor?: string
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  currentLanguage?: string
  showRsvp?: boolean
  eventStartDate?: string
}

const props = withDefaults(defineProps<Props>(), {
  showRsvp: false
})

// Countdown logic
const countdown = props.eventStartDate ? useCountdown(props.eventStartDate) : null

defineEmits<{
  openMap: []
}>()

// Computed property to ensure description starts with capital letter
const capitalizedDescription = computed(() => {
  if (!props.descriptionText) return ''
  const text = props.descriptionText.trim()
  if (text.length === 0) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
})

// Countdown header and labels
const countdownHeader = computed(() => {
  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
  return translateRSVP('countdown_header', currentLang)
})

const dayLabel = computed(() => {
  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
  return translateRSVP('countdown_day', currentLang)
})

const hourLabel = computed(() => {
  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
  return translateRSVP('countdown_hour', currentLang)
})
</script>

<style scoped>
.glass-section {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.25);
  /* Safari/iOS compatibility: -webkit prefix MUST come BEFORE standard property */
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}

/* Countdown styles */
.countdown-container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.countdown-wrapper {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.countdown-time-row {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 0.75rem;
}

.countdown-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  min-width: 0;
}

.countdown-number {
  font-weight: 700;
  color: white;
  text-align: center;
  line-height: 1;
  letter-spacing: 0.05em;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  /* Fixed width for consistent alignment - minimum 2 characters */
  min-width: 2ch;
  /* Responsive font size based on container width */
  font-size: clamp(3.5rem, 15vw, 8rem);
}

.countdown-separator {
  font-weight: 700;
  color: white;
  text-align: center;
  line-height: 1;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  /* Match the number size */
  font-size: clamp(3.5rem, 15vw, 8rem);
  /* Align with numbers - needs to account for the unit label height */
  margin-bottom: 0.875rem;
  flex-shrink: 0;
}

.countdown-unit-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-align: center;
  white-space: nowrap;
}

/* Divider between Countdown and RSVP */
.countdown-divider {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 0 0.75rem 0;
}

.divider-line {
  width: 60%;
  max-width: 200px;
  height: 1px;
  background: white;
  opacity: 0.3;
}

/* Khmer text fix now defined globally in src/assets/main.css */

/* Mobile and Tablet adjustments */
@media (max-width: 1023px) {
  .countdown-number {
    font-size: clamp(4rem, 18vw, 8rem);
  }

  .countdown-separator {
    font-size: clamp(4rem, 18vw, 8rem);
    margin-bottom: 0.875rem;
  }

  .countdown-unit-label {
    font-size: 0.875rem;
  }

  .countdown-time-row {
    gap: 0.5rem;
  }
}

/* Small laptops 13-inch (1024px-1365px) - Match mobile base scale */
@media (min-width: 1024px) and (max-width: 1365px) {
  .countdown-number {
    font-size: clamp(1.89rem, 7.56vw, 3.465rem); /* Reduced by 30% from original */
  }

  .countdown-separator {
    font-size: clamp(1.89rem, 7.56vw, 3.465rem); /* Reduced by 30% from original */
    margin-bottom: 0.875rem;
  }

  .countdown-unit-label {
    font-size: 0.6rem !important; /* Match countdown header text size */
  }

  .countdown-time-row {
    gap: 0.65rem;
  }

  /* Title - match host name text size */
  h2 {
    font-size: 0.7rem !important; /* 11.2px - match HostInfoWedding host name text */
    line-height: 1.25rem !important; /* tight leading */
  }

  /* Description text - slightly larger than host title text */
  p,
  p.text-sm,
  p.sm\:text-base {
    font-size: 0.6rem !important; /* 9.6px - slightly larger than host title (0.55rem) */
    line-height: 1.125rem !important; /* normal leading */
  }

  /* Details text inside card (date, time, location) - match description text size */
  .text-sm {
    font-size: 0.6rem !important; /* 9.6px - match description text size */
    line-height: 1.125rem !important; /* match description line-height */
  }

  /* Override leading-snug for date and location text */
  .leading-snug {
    line-height: 1.125rem !important; /* match description line-height */
  }

  /* Countdown header text - match description text size */
  .countdown-header {
    font-size: 0.6rem !important; /* 9.6px - match description text size */
  }

  /* Scale spacing to match mobile base - reduced for tighter layout */
  .space-y-6 > * + * {
    margin-top: 1rem !important; /* Reduced from 1.5rem */
  }

  .space-y-8 > * + * {
    margin-top: 1rem !important; /* Reduced from 1.5rem */
  }

  .space-y-4 > * + * {
    margin-top: 0.25rem !important; /* Reduced from 1rem */
  }

  .space-y-3 > * + * {
    margin-top: 0.5rem !important; /* Reduced from 0.75rem */
  }

  .space-y-2 > * + * {
    margin-top: 0.35rem !important; /* Reduced from 0.5rem */
  }

  /* Padding - reduced for tighter layout */
  .px-4 {
    padding-left: 0.75rem !important; /* Reduced from 1rem */
    padding-right: 0.75rem !important;
  }

  .pt-3 {
    padding-top: 0.5rem !important; /* Reduced from 0.75rem */
  }

  .pb-4 {
    padding-bottom: 0.75rem !important; /* Reduced from 1rem */
  }

  .pt-2 {
    padding-top: 0.35rem !important; /* Reduced from 0.5rem */
  }

  .pt-4 {
    padding-top: 0.75rem !important; /* Reduced from 1rem */
  }

  .pb-2 {
    padding-bottom: 0.35rem !important; /* Reduced for countdown */
  }

  /* Border radius and stroke - reduce to match mobile more closely */
  .gradient-stroke-container {
    border-radius: 1.5rem !important; /* Reduced from 2rem */
    padding: 1.5px !important; /* Reduced from 2px */
  }

  /* Adjust inner border radius to match new outer radius */
  .gradient-stroke-container > div {
    border-radius: calc(1.5rem - 1.5px) !important; /* Match new stroke size */
  }

  /* Map container - maintain aspect ratio */
  .aspect-video {
    aspect-ratio: 16 / 9; /* Standard video aspect ratio */
  }

  /* Countdown spacing adjustments */
  .countdown-container {
    padding-top: 0.35rem !important;
    padding-bottom: 0.35rem !important;
  }

  .countdown-wrapper {
    gap: 0.1rem !important; /* Reduced from 0.2rem - space between header and numbers */
  }

  /* Reduce gap between countdown number and label */
  .countdown-unit {
    gap: -0.35rem !important; /* Increased negative gap to bring label even closer to number */
  }

  /* Adjust separator alignment */
  .countdown-separator {
    margin-bottom: 0.65rem !important; /* Reduced to align with labels */
  }

  /* Countdown divider spacing */
  .countdown-divider {
    padding-bottom: 0.5rem !important; /* Reduced from 0.75rem */
  }
}

/* Medium laptops 14-15 inch (1366px+) */
@media (min-width: 1366px) {
  .countdown-number {
    font-size: clamp(3.15rem, 13.5vw, 7.2rem);
  }

  .countdown-separator {
    font-size: clamp(3.15rem, 13.5vw, 7.2rem);
    margin-bottom: 0.7rem !important;
  }

  .countdown-unit-label {
    font-size: 0.75rem !important; /* Reduced from 0.875rem */
  }

  .countdown-header {
    font-size: 0.875rem !important; /* Reduced from 1rem */
  }

  .countdown-wrapper {
    gap: 0.15rem !important; /* Reduced spacing between header and numbers */
  }

  .countdown-unit {
    gap: -0.3rem !important; /* Bring label even closer to number */
  }

  h2 {
    font-size: 1rem !important; /* Restore original size for medium laptops */
  }

  p,
  p.text-sm,
  p.sm\:text-base {
    font-size: 0.875rem !important; /* Restore original size for medium laptops */
  }

  .text-sm {
    font-size: 0.875rem !important; /* Reduced from 1rem */
  }
}

/* Large laptops 16+ inch (1536px+) */
@media (min-width: 1536px) {
  .countdown-number {
    font-size: clamp(3.15rem, 13.5vw, 7.2rem);
  }

  .countdown-separator {
    font-size: clamp(3.15rem, 13.5vw, 7.2rem);
    margin-bottom: 0.75rem !important;
  }

  .countdown-unit-label {
    font-size: 0.875rem !important; /* Reduced from 1rem */
  }

  .countdown-header {
    font-size: 1rem !important; /* Reduced from 1.125rem */
  }

  .countdown-wrapper {
    gap: 0.2rem !important; /* Reduced spacing between header and numbers */
  }

  .countdown-unit {
    gap: -0.25rem !important; /* Bring label even closer to number */
  }

  h2 {
    font-size: 1.25rem !important; /* Restore original size for large laptops/desktop */
  }

  p,
  p.text-sm,
  p.sm\:text-base {
    font-size: 0.875rem !important; /* Restore original size for large laptops/desktop */
  }

  .text-sm {
    font-size: 0.875rem !important; /* Reduced from 1rem */
  }
}
</style>
