<template>
  <div class="host-info-birthday" :class="{ 'khmer-text': currentLanguage === 'kh' }">
    <!-- Welcome Message -->
    <WelcomeHeader
      v-if="showWelcomeHeaderText !== false"
      :message="welcomeMessage"
      default-message="Happy Birthday!"
      :color="primaryColor"
      :font-family="primaryFont || currentFont"
      :current-language="currentLanguage"
      :animated="true"
      :base-delay="animationDelays.welcome"
    />

    <!-- Host Avatar: sample_logo_1 base + sample_logo_2-clipped host photo (same pattern as cover stage).
         Falls back to the plain circular profile picture when sample_logo_1 is not provided. -->
    <div
      v-if="hosts[0]?.profile_image || sampleLogoOne"
      :key="`avatar-${currentLanguage}`"
      class="flex justify-center mb-3 sm:mb-4"
    >
      <!-- Sample-logo overlay avatar -->
      <div
        v-if="useSampleLogos"
        class="avatar-container bounce-in-element"
        :style="{ ...avatarContainerStyle, animationDelay: `${animationDelays.profile}s` }"
      >
        <div class="sample-logo-stack">
          <img
            :src="getMediaUrl(sampleLogoOne as string)"
            :alt="`${hosts[0]?.name || ''} logo`"
            class="sample-logo sample-logo-base"
            fetchpriority="high"
          />
          <!-- Host image clipped into sample_logo_2's shape -->
          <div v-if="showClippedHost" class="sample-logo-shape-layer" aria-hidden="false">
            <div class="host-clip-box" :style="hostClipBoxStyle">
              <img
                :src="getMediaUrl(firstHostImage as string)"
                :alt="firstHostName || hosts[0]?.name || 'host'"
                class="clipped-host-image"
                :style="clippedHostStyle"
                fetchpriority="high"
              />
            </div>
          </div>
          <!-- Fallback: plain sample_logo_2 overlay when host image missing or bounds unavailable -->
          <img
            v-else-if="sampleLogoTwo"
            :src="getMediaUrl(sampleLogoTwo)"
            :alt="`${hosts[0]?.name || ''} logo overlay`"
            class="sample-logo sample-logo-overlay"
            fetchpriority="high"
          />
        </div>
      </div>
      <!-- Fallback: original gradient-ring profile picture when no sample_logo_1 is provided -->
      <div
        v-else-if="hosts[0]?.profile_image"
        class="profile-picture-large bounce-in-element"
        :style="{
          background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
          animationDelay: `${animationDelays.profile}s`,
        }"
      >
        <img
          :src="getMediaUrl(hosts[0].profile_image)"
          :alt="`${hosts[0].name} profile`"
          class="profile-image"
        />
      </div>
    </div>

    <!-- Event Details Card: two-column date + location/time/RSVP panel -->
    <div
      v-if="eventStartDate || timeText || locationText || rsvpContact"
      class="event-details-card bounce-in-element"
      :style="{
        borderColor: primaryColor,
        animationDelay: `${animationDelays.detailsCard}s`,
      }"
    >
      <!-- Left column: stacked weekday / day-number / month -->
      <div class="date-column" :style="{ color: primaryColor, fontFamily: primaryFont || currentFont }">
        <div v-if="dateParts.weekday" class="date-weekday">{{ dateParts.weekday }}</div>
        <div v-if="dateParts.day" class="date-day">{{ dateParts.day }}</div>
        <div v-if="dateParts.month" class="date-month">{{ dateParts.month }}</div>
      </div>

      <!-- Vertical divider -->
      <div class="details-divider" :style="{ backgroundColor: primaryColor }" aria-hidden="true"></div>

      <!-- Right column: time / location / RSVP contact -->
      <div class="details-column" :style="{ color: primaryColor }">
        <div
          v-if="timeText"
          class="details-time"
          :style="{ fontFamily: primaryFont || currentFont }"
        >
          {{ timeText }}
        </div>
        <div
          v-if="timeText && (locationText || rsvpContact)"
          class="details-time-divider"
          :style="{ backgroundColor: primaryColor }"
          aria-hidden="true"
        ></div>
        <div
          v-if="locationText"
          class="details-location"
          :style="{ fontFamily: secondaryFont || currentFont }"
        >
          {{ locationText }}
        </div>
        <div
          v-if="rsvpContact"
          class="details-rsvp"
          :style="{ fontFamily: secondaryFont || currentFont }"
        >
          RSVP: {{ rsvpContact }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { HostInfoProps } from '@/types/showcase'
import { useShapeMaskBounds } from '@/composables/showcase/useShapeMaskBounds'
import {
  WelcomeHeader,
  getMediaUrl,
  ANIMATION_CONSTANTS,
  getTextAnimationDuration,
} from './shared'

const props = defineProps<HostInfoProps>()

const ELEMENT_GAP = ANIMATION_CONSTANTS.ELEMENT_GAP

// Only render the sample-logo avatar when a base logo is provided by the template.
const useSampleLogos = computed(() => !!props.sampleLogoOne)

// Detect sample_logo_1's natural aspect ratio so the container matches the
// logo's rendered footprint exactly — keeps the base + sample_logo_2 overlay +
// clipped host image perfectly aligned. Without this, a square container
// letterboxes landscape logos and the absolute-positioned layers visibly
// diverge from the base logo's contain-fit bounds.
const sampleLogoOneUrl = computed<string | null>(() =>
  props.sampleLogoOne ? (getMediaUrl(props.sampleLogoOne) ?? null) : null,
)
const sampleLogoOneAspect = ref<number | null>(null)
watch(
  sampleLogoOneUrl,
  (url, _prev, onCleanup) => {
    sampleLogoOneAspect.value = null
    if (!url || typeof window === 'undefined') return
    let cancelled = false
    onCleanup(() => {
      cancelled = true
    })
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      if (cancelled) return
      if (img.naturalWidth && img.naturalHeight) {
        sampleLogoOneAspect.value = img.naturalWidth / img.naturalHeight
      }
    }
    img.src = url
  },
  { immediate: true },
)

// CSS vars: logo aspect drives container aspect-ratio; max-w/h are the bounding
// box. width/height auto-derive via aspect-ratio while both max-* constraints
// are honored (browsers scale both dims proportionally).
const avatarContainerStyle = computed<Record<string, string>>(() => ({
  '--logo-aspect': `${sampleLogoOneAspect.value ?? 1}`,
}))

// Auto-detect sample_logo_2's opaque bounding box so the host photo fills the
// shape silhouette (same approach as CoverContentRows).
const sampleLogoTwoUrl = computed<string | null>(() =>
  props.sampleLogoTwo ? (getMediaUrl(props.sampleLogoTwo) ?? null) : null,
)
const { bounds: shapeBounds } = useShapeMaskBounds(sampleLogoTwoUrl)

const showClippedHost = computed(
  () => !!props.sampleLogoTwo && !!props.firstHostImage && !!shapeBounds.value,
)

const hostClipBoxStyle = computed<Record<string, string>>(() => {
  const b = shapeBounds.value
  const url = sampleLogoTwoUrl.value
  if (!b || !url) return {} as Record<string, string>
  const maskUrl = `url("${url}")`
  return {
    aspectRatio: `${b.aspectRatio}`,
    maskImage: maskUrl,
    WebkitMaskImage: maskUrl,
    ...(props.hostClipStyle ?? {}),
  }
})

const clippedHostStyle = computed<Record<string, string>>(() => {
  const b = shapeBounds.value
  if (!b) return {} as Record<string, string>
  return {
    left: `${b.x * 100}%`,
    top: `${b.y * 100}%`,
    width: `${b.width * 100}%`,
    height: `${b.height * 100}%`,
  }
})

// Map app language codes to BCP-47 locales for Intl.DateTimeFormat. Falls back
// to the raw code when no mapping is needed (Intl tolerates most standard codes).
const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  kh: 'km-KH',
  fr: 'fr-FR',
  ja: 'ja-JP',
  ko: 'ko-KR',
  'zh-cn': 'zh-CN',
  th: 'th-TH',
  vn: 'vi-VN',
}

// Break the start date into weekday / day-number / month parts for the
// two-column event-details card. Returns empty strings when the date is
// missing or invalid so the template can render partial data gracefully.
const dateParts = computed<{ weekday: string; day: string; month: string }>(() => {
  const empty = { weekday: '', day: '', month: '' }
  if (!props.eventStartDate) return empty
  const parsed = new Date(props.eventStartDate)
  if (Number.isNaN(parsed.getTime())) return empty
  const locale = LOCALE_MAP[props.currentLanguage ?? 'en'] ?? props.currentLanguage ?? 'en-US'
  try {
    return {
      weekday: new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(parsed),
      day: new Intl.DateTimeFormat(locale, { day: 'numeric' }).format(parsed),
      month: new Intl.DateTimeFormat(locale, { month: 'long' }).format(parsed),
    }
  } catch {
    return empty
  }
})

// Animation delays calculation
const animationDelays = computed(() => {
  let currentDelay = 0.1

  const getNextDelay = (text: string | null | undefined, skipIfEmpty = true): number => {
    if (skipIfEmpty && !text) return currentDelay
    const startDelay = currentDelay
    const duration = getTextAnimationDuration(text)
    currentDelay = startDelay + duration + ELEMENT_GAP
    return startDelay
  }

  const welcome = getNextDelay(
    props.showWelcomeHeaderText === false ? undefined : (props.welcomeMessage || 'Happy Birthday!'),
  )
  const profile = currentDelay
  currentDelay += 0.45
  const detailsCard = currentDelay

  return {
    welcome,
    profile,
    detailsCard,
  }
})
</script>

<style scoped>
.host-info-birthday {
  padding: 1.5rem 0;
  width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* Title text - matches wedding parent-name-text sizes */
.birthday-title-text {
  font-size: 0.7906rem;
}

/* Sample-logo avatar container — sized to match sample_logo_1's natural
   aspect ratio (via --logo-aspect inline var) within a bounding box. Keeping
   the container's aspect equal to the base logo's aspect ensures the absolute
   positioned sample_logo_2 overlay and host-clip layers align exactly with
   the base logo's contain-fit footprint (no letterbox offset). */
.avatar-container {
  --max-w: 340px;
  --max-h: 261px;
  /* Pick whichever dimension is the binding constraint while preserving aspect. */
  width: min(var(--max-w), calc(var(--max-h) * var(--logo-aspect, 1)));
  height: min(var(--max-h), calc(var(--max-w) / var(--logo-aspect, 1)));
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Sample-logo stack — base logo fills the container, overlay sits on top at the same position. */
.sample-logo-stack {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.sample-logo {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

.sample-logo-base {
  position: relative;
  z-index: 1;
}

.sample-logo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: auto;
  z-index: 2;
  pointer-events: none;
}

/* Flex wrapper that sizes the clip box like object-fit: contain — the inner
   host-clip-box grows to fill the stack while aspect-ratio + max-w/h cap it
   to sample_logo_2's natural footprint. */
.sample-logo-shape-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 2;
}

/* Masked container: CSS mask from sample_logo_2 reveals only the shape's
   opaque pixels. Width intentionally derived from aspect-ratio so the mask
   isn't stretched when the parent is non-square. */
.host-clip-box {
  position: relative;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  overflow: hidden;
}

.clipped-host-image {
  position: absolute;
  object-fit: cover;
  object-position: var(--host-clip-offset-x, 50%) var(--host-clip-offset-y, 50%);
  display: block;
}

/* Large Profile Picture (fallback when no sample_logo_1 provided) */
.profile-picture-large {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  padding: 4px;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.profile-picture-large:hover {
  transform: scale(1.05);
}

.profile-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

/* Event details card — two-column panel with a thin border in primaryColor.
   Left column stacks weekday / day-number / month. Right column stacks
   time (with a horizontal rule below) / location / RSVP contact. */
.event-details-card {
  display: grid;
  grid-template-columns: auto 1px 1fr;
  align-items: stretch;
  gap: 1rem;
  width: 100%;
  max-width: 420px;
  margin: 0.75rem auto 0;
  padding: 1rem 1.25rem;
  border-top: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  box-sizing: border-box;
}

.date-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-width: 5.5rem;
  gap: 0.15rem;
}

.date-weekday,
.date-month {
  font-size: 0.875rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 600;
  line-height: 1.1;
}

.date-day {
  font-size: 2.75rem;
  font-weight: 700;
  line-height: 1;
  /* Slight vertical breathing room from weekday/month labels */
  padding: 0.1rem 0;
}

.details-divider {
  width: 1px;
  align-self: stretch;
  opacity: 0.8;
}

.details-column {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  min-width: 0;
}

.details-time {
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.2;
}

.details-time-divider {
  height: 1px;
  width: 100%;
  opacity: 0.6;
}

.details-location,
.details-rsvp {
  font-size: 0.8125rem;
  line-height: 1.35;
  word-break: break-word;
}

/* Responsive tuning for the details card */
@media (min-width: 640px) {
  .event-details-card {
    padding: 1.125rem 1.5rem;
  }

  .date-weekday,
  .date-month {
    font-size: 1rem;
  }

  .date-day {
    font-size: 3.25rem;
  }

  .details-time {
    font-size: 1.125rem;
  }

  .details-location,
  .details-rsvp {
    font-size: 0.9rem;
  }
}

@media (min-width: 768px) {
  .event-details-card {
    max-width: 480px;
  }

  .date-day {
    font-size: 3.5rem;
  }
}

/* Khmer text typically renders a touch taller — relax line-height so tall
   subscripts don't clip the day-number cell. */
.host-info-birthday.khmer-text .date-day {
  line-height: 1.15;
}

/* Bounce In Animation */
.bounce-in-element {
  opacity: 0;
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

/* Word-by-word reveal animation */
.bounce-word {
  display: inline-block;
  opacity: 0;
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

/* Responsive adjustments */
@media (min-width: 640px) {
  .birthday-title-text {
    font-size: 0.9344rem;
  }

  .avatar-container {
    --max-w: 352px;
    --max-h: 264px;
  }

  .profile-picture-large {
    width: 250px;
    height: 250px;
    padding: 5px;
  }
}

@media (min-width: 768px) {
  .host-info-birthday {
    padding: 2rem 0;
  }

  .birthday-title-text {
    font-size: 1.0781rem;
  }

  .avatar-container {
    --max-w: 396px;
    --max-h: 308px;
  }

  .profile-picture-large {
    width: 280px;
    height: 280px;
  }
}

/* Small laptops 13-inch (1024px - 1365px) */
@media (min-width: 1024px) and (max-width: 1365px) {
  .host-info-birthday {
    padding: 1rem 0;
  }

  .text-center.mb-6 {
    margin-bottom: 0.75rem !important;
  }

  .birthday-title-text {
    font-size: 0.55rem !important;
  }

  .host-info-birthday h3 {
    font-size: 0.85rem !important;
  }

  .avatar-container {
    --max-w: 242px;
    --max-h: 176px;
  }

  .profile-picture-large {
    width: 160px;
    height: 160px;
    padding: 3px;
  }
}

/* Medium laptops 14-15 inch (1366px - 1919px) */
@media (min-width: 1366px) and (max-width: 1919px) {
  .host-info-birthday {
    padding: 1rem 0;
  }

  .text-center.mb-6 {
    margin-bottom: 0.75rem !important;
  }

  .birthday-title-text {
    font-size: 0.55rem !important;
  }

  .host-info-birthday h3 {
    font-size: 0.85rem !important;
  }

  .avatar-container {
    --max-w: 242px;
    --max-h: 176px;
  }

  .profile-picture-large {
    width: 160px;
    height: 160px;
    padding: 3px;
  }
}

@media (min-width: 1920px) {
  .birthday-title-text {
    font-size: 1.0063rem;
  }

  .avatar-container {
    --max-w: 440px;
    --max-h: 330px;
  }

  .profile-picture-large {
    width: 300px;
    height: 300px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .profile-picture-large,
  .bounce-in-element,
  .bounce-word {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>
