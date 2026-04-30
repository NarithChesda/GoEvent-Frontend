<template>
  <div
    ref="containerRef"
    :key="`event-info-${currentLanguage}`"
    class="text-center space-y-6 sm:space-y-8"
    :class="{ 'animate-active': isVisible }"
  >
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
          <span
            v-for="(word, index) in splitToWords(descriptionTitle)"
            :key="`title-${currentLanguage}-${index}`"
            class="bounce-word"
            :style="{ animationDelay: `${animationDelays.title + index * WORD_DELAY}s` }"
          >{{ word }}{{ index < splitToWords(descriptionTitle).length - 1 ? '\u00A0' : '' }}</span>
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
          <span
            v-for="(word, index) in splitToWords(capitalizedDescription)"
            :key="`desc-${currentLanguage}-${index}`"
            class="bounce-word"
            :style="{ animationDelay: `${animationDelays.description + index * WORD_DELAY}s` }"
          >{{ word }}{{ index < splitToWords(capitalizedDescription).length - 1 ? '\u00A0' : '' }}</span>
        </p>
      </div>
    </div>

    <!-- Stylish Event Details Card: sits ABOVE the glass card so it shows against
         the page background, styled with primaryColor (theme accent). Two-column
         panel framed with top+bottom borders. Left column: stacked weekday /
         day-number / month (from eventStartDate). Right column: locationText.
         When eventStartDate is missing, the left column and vertical divider
         collapse so locationText spans the card. -->
    <div
      v-if="hasDateParts || locationText"
      class="event-details-card bounce-in-element"
      :class="[hasDateParts ? 'has-date-column' : 'no-date-column']"
      :style="{
        color: primaryColor,
        animationDelay: `${animationDelays.date}s`,
      }"
    >
      <div
        v-if="hasDateParts"
        :class="['date-column', currentLanguage === 'kh' && 'khmer-text-fix']"
      >
        <div
          v-if="dateParts.weekday"
          class="date-weekday"
          :style="{ fontFamily: secondaryFont || currentFont }"
        >{{ dateParts.weekday }}</div>
        <div
          v-if="dateParts.day"
          class="date-day"
          :style="{ fontFamily: primaryFont || currentFont }"
        >{{ dateParts.day }}</div>
        <div
          v-if="dateParts.month"
          class="date-month"
          :style="{ fontFamily: secondaryFont || currentFont }"
        >{{ dateParts.month }}</div>
      </div>

      <div
        v-if="hasDateParts && locationText"
        class="details-divider"
        aria-hidden="true"
      ></div>

      <div v-if="locationText" class="details-column">
        <div
          :class="['details-location', currentLanguage === 'kh' && 'khmer-text-fix']"
          :style="{ fontFamily: secondaryFont || currentFont }"
        >{{ locationText }}</div>
      </div>
    </div>

    <!-- Event Details Block -->
    <div class="space-y-3">
      <div
        class="block relative gradient-stroke-container bounce-in-element"
        :style="{
          background: `${backgroundColor || primaryColor}60`,
          padding: '2px',
          borderRadius: '2rem',
          animationDelay: `${animationDelays.card}s`,
        }"
      >
        <div
          class="px-4 pt-3 pb-4 backdrop-blur-sm space-y-1 relative"
          style="border-radius: calc(2rem - 2px); border: 2px solid white"
          :style="{
           background: `${backgroundColor || primaryColor}60`,
          }"
        >
          <!-- Google Map Embed -->
          <div
            v-if="hasGoogleMap && googleMapEmbedLink"
            class="pt-2 bounce-in-element"
            :style="{ animationDelay: `${animationDelays.map}s` }"
          >
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
          <div
            v-if="countdown && showCountdown && isCountdownActive"
            class="countdown-container px-4 pt-2 pb-2 bounce-in-element"
            :style="{ animationDelay: `${animationDelays.countdown}s` }"
          >
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
                    :style="{ fontFamily: countdownNumberFont }"
                  >
                    {{ countdownDaysDisplay }}
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
                  :class="[currentLanguage === 'kh' && 'is-khmer']"
                  :style="{ fontFamily: countdownNumberFont }"
                >
                  :
                </div>

                <!-- Hours -->
                <div class="countdown-unit">
                  <div
                    class="countdown-number"
                    :style="{ fontFamily: countdownNumberFont }"
                  >
                    {{ countdownHoursDisplay }}
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
          <div
            v-if="countdown && showCountdown && isCountdownActive && showRsvp"
            class="countdown-divider bounce-in-element"
            :style="{ animationDelay: `${animationDelays.divider}s` }"
          >
            <div class="divider-line"></div>
          </div>

          <!-- RSVP Section Integrated Below Map -->
          <div
            v-if="showRsvp"
            class="bounce-in-element"
            :style="{ animationDelay: `${animationDelays.rsvp}s` }"
          >
            <slot name="rsvp"></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useCountdown } from '../../composables/useCountdown'
import {
  translateRSVP,
  getLocalizedDateParts,
  toKhmerNumerals,
  type SupportedLanguage,
} from '../../utils/translations'
import {
  splitToWords,
  splitToLines,
  ANIMATION_CONSTANTS,
  getTextAnimationDuration,
} from '@/composables/showcase/useHostInfoUtils'

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
  showCountdown?: boolean
  eventStartDate?: string
  baseDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  showRsvp: false,
  showCountdown: true,
  baseDelay: 0.1,
})

const WORD_DELAY = ANIMATION_CONSTANTS.WORD_DELAY
const ELEMENT_GAP = ANIMATION_CONSTANTS.ELEMENT_GAP

// Intersection Observer for scroll-triggered animations
const containerRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
let observer: IntersectionObserver | null = null

const setupObserver = () => {
  if (observer) {
    observer.disconnect()
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isVisible.value = true
        }
      })
    },
    {
      threshold: 0.3, // Trigger when 30% of element is visible
      rootMargin: '0px 0px -100px 0px', // Wait until element is 100px into viewport
    }
  )

  if (containerRef.value) {
    observer.observe(containerRef.value)
  }
}

onMounted(() => {
  setupObserver()
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})

// Re-setup observer and reset visibility when language changes
watch(
  () => props.currentLanguage,
  async () => {
    isVisible.value = false
    // Wait for DOM to update with new key, then re-observe
    await nextTick()
    // Additional delay to ensure the new element is fully rendered
    setTimeout(() => {
      setupObserver()
      // If element is already in view, trigger animation immediately
      if (containerRef.value) {
        const rect = containerRef.value.getBoundingClientRect()
        const windowHeight = window.innerHeight
        // Check if element is already visible in viewport
        if (rect.top < windowHeight - 100 && rect.bottom > 0) {
          isVisible.value = true
        }
      }
    }, 100)
  }
)

// Break the ISO start date into weekday / day-number / month parts so the
// card can render a stylish stacked date block instead of plain dateText.
// Delegates to getLocalizedDateParts so Khmer uses explicit translated names
// (Intl km-KH output varies across browsers).
const dateParts = computed<{ weekday: string; day: string; month: string }>(() => {
  if (!props.eventStartDate) return { weekday: '', day: '', month: '' }
  return getLocalizedDateParts(props.eventStartDate, props.currentLanguage ?? 'en')
})

// Convenience flag: drives the card's 2-column vs 1-column grid layout
// in the template (left date-column collapses when no eventStartDate).
const hasDateParts = computed(
  () => !!(dateParts.value.weekday || dateParts.value.day || dateParts.value.month),
)

// Animation delays calculation
const animationDelays = computed(() => {
  let currentDelay = props.baseDelay
  const BOUNCE_DURATION = 0.2 // Duration for bounce-in elements

  const getNextDelay = (text: string | null | undefined, skipIfEmpty = true): number => {
    if (skipIfEmpty && !text) return currentDelay
    const startDelay = currentDelay
    const duration = getTextAnimationDuration(text)
    currentDelay = startDelay + duration + ELEMENT_GAP
    return startDelay
  }

  const addBounceDelay = (): number => {
    const startDelay = currentDelay
    currentDelay += BOUNCE_DURATION
    return startDelay
  }

  const title = getNextDelay(props.descriptionTitle)
  const description = getNextDelay(props.descriptionText)
  const card = addBounceDelay()
  const date = getNextDelay(props.dateText)
  const location = getNextDelay(props.locationText)
  const map = props.hasGoogleMap && props.googleMapEmbedLink ? addBounceDelay() : currentDelay
  const countdown = props.eventStartDate ? addBounceDelay() : currentDelay
  const divider = props.eventStartDate && props.showRsvp ? addBounceDelay() : currentDelay
  const rsvp = props.showRsvp ? addBounceDelay() : currentDelay

  return {
    title,
    description,
    card,
    date,
    location,
    map,
    countdown,
    divider,
    rsvp,
  }
})

// Countdown logic
const countdown = props.eventStartDate ? useCountdown(props.eventStartDate) : null

// Hide countdown once it reaches zero (event has started/passed)
const isCountdownActive = computed(() => {
  if (!countdown) return false
  if (countdown.hasPassed.value) return false
  return !(countdown.daysRemaining.value === 0 && countdown.hoursRemaining.value === 0)
})

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

// Helper to get global word index across lines for animation delay
const getGlobalWordIndex = (lines: string[][], lineIndex: number, wordIndex: number): number => {
  let count = 0
  for (let i = 0; i < lineIndex; i++) {
    count += lines[i].length
  }
  return count + wordIndex
}

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

// Display numerals in Khmer script for the 'kh' locale; other locales keep
// Arabic digits so the Rajdhani display font renders correctly.
const countdownDaysDisplay = computed(() => {
  const raw = countdown?.formattedDays.value ?? ''
  return props.currentLanguage === 'kh' ? toKhmerNumerals(raw) : raw
})

const countdownHoursDisplay = computed(() => {
  const raw = countdown?.formattedHours.value ?? ''
  return props.currentLanguage === 'kh' ? toKhmerNumerals(raw) : raw
})

// Rajdhani has no Khmer glyphs — fall back to the showcase primary font so
// the Khmer numerals render consistently with the rest of the card.
const countdownNumberFont = computed(() =>
  props.currentLanguage === 'kh'
    ? props.primaryFont || props.currentFont
    : `'Rajdhani', sans-serif`,
)
</script>

<style scoped>
/* Stylish event details card — two-column panel framed with top+bottom borders.
   Left column stacks weekday / day-number / month; right column stacks dateText
   (time/description) + locationText, separated by a horizontal rule. When no
   eventStartDate is available, the left column and vertical divider collapse
   to a single-column layout with no-date-column. */
/* Card sits on the page background now (above the glass card), so borders and
   the vertical divider inherit from the element's color (set inline to
   primaryColor) instead of the white-on-glass palette. */
.event-details-card {
  display: grid;
  align-items: stretch;
  gap: 1rem;
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  padding: 0.75rem 0.5rem;
  /* Thin frame matched to the agenda's 1px divider weight so the card reads
     as part of the same line-based decorative system. color-mix mutes the
     alpha slightly without using opacity (which would cascade to children). */
  border-top: 1px solid color-mix(in srgb, currentColor 60%, transparent);
  border-bottom: 1px solid color-mix(in srgb, currentColor 60%, transparent);
  box-sizing: border-box;
}

/* Mobile: strict 1:2 ratio — date column gets 1/3, location 2/3. minmax(0, ...)
   lets the grid tracks ignore content-driven min-widths so the ratio is honored
   even when weekday names (e.g. Khmer) would otherwise force the left track wider. */
.event-details-card.has-date-column {
  grid-template-columns: minmax(0, 1fr) 1px minmax(0, 2fr);
}

.event-details-card.no-date-column {
  grid-template-columns: 1fr;
}

.date-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-width: 0;
  gap: 0.15rem;
}

/* Mobile: scaled down for the 1/3-width date column so "WEDNESDAY"/"SEPTEMBER"
   don't overflow or wrap. Full sizes restored at ≥640px where the column widens. */
.date-weekday,
.date-month {
  font-size: 0.6875rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-weight: 600;
  line-height: 1.1;
}

.date-day {
  font-size: 2.125rem;
  font-weight: 700;
  line-height: 1;
  padding: 0.1rem 0;
}

.details-divider {
  width: 1px;
  align-self: stretch;
  background-color: color-mix(in srgb, currentColor 60%, transparent);
}

.details-column {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  min-width: 0;
  text-align: center;
}

.details-location {
  font-size: 0.8125rem;
  line-height: 1.35;
  white-space: pre-line;
  word-break: break-word;
}

@media (min-width: 640px) {
  .event-details-card {
    max-width: 460px;
    padding: 1rem 1.25rem;
  }

  /* Above mobile, let the date column hug its content and give location the rest. */
  .event-details-card.has-date-column {
    grid-template-columns: auto 1px 1fr;
  }

  .date-column {
    min-width: 5.5rem;
  }

  .date-weekday,
  .date-month {
    font-size: 1rem;
    letter-spacing: 0.1em;
  }

  .date-day {
    font-size: 3.25rem;
  }

  .details-location {
    font-size: 0.9rem;
  }
}

@media (min-width: 768px) {
  .event-details-card {
    max-width: 500px;
  }

  .date-day {
    font-size: 3.5rem;
  }
}

/* Khmer subscripts sit lower; relax line-height so the day-number isn't clipped. */
.date-column.khmer-text-fix .date-day {
  line-height: 1.15;
}

/* Word-by-word reveal animation - only active when in view */
.bounce-word {
  display: inline-block;
  opacity: 0;
}

.animate-active .bounce-word {
  animation: revealWord 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes revealWord {
  0% {
    opacity: 0;
    transform: scale(0.85) translateY(10px);
  }
  60% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Bounce In Animation for card - only active when in view */
.bounce-in-element {
  opacity: 0;
}

.animate-active .bounce-in-element {
  animation: bounceInElement 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes bounceInElement {
  0% {
    opacity: 0;
    transform: translateY(15px);
  }
  30% {
    opacity: 1;
  }
  50% {
    transform: translateY(-3px);
  }
  75% {
    transform: translateY(1px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

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

/* Khmer fallback fonts position the colon glyph differently within its em-box
   than Rajdhani, so the baseline-alignment trick (margin-bottom) can't center
   it reliably. Switch to flex-center on the row and counter-shift upward by
   roughly half the label height so the colon sits on the number's vertical
   center instead of the whole column's center. */
.countdown-separator.is-khmer {
  align-self: center;
  margin-bottom: 0 !important;
  /* Uses em (relative to the colon's own font-size) so the upward shift
     scales with the responsive number size across breakpoints. */
  transform: translateY(-0.38em);
}

/* Desktop/laptop viewports use a shallower upward shift — at larger column
   widths and label sizes the mobile-tuned -0.38em lifts the colon above
   the Khmer digits' optical center. */
@media (min-width: 1024px) {
  .countdown-separator.is-khmer {
    transform: translateY(-0.28em);
  }
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

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .bounce-word,
  .bounce-in-element {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>
