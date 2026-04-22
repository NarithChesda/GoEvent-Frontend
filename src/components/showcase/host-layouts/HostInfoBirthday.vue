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

    <!-- Host Avatar: three-tier base logo (event logoUrl → template sample_logo_1 →
         recoloured temp-showcase-logo.svg) with sample_logo_2-clipped host photo
         on top when both sampleLogoTwo and the host image are available. -->
    <div
      v-if="hosts[0]?.profile_image || logoUrl || sampleLogoOne"
      :key="`avatar-${currentLanguage}`"
      class="flex justify-center mb-3 sm:mb-4"
    >
      <div
        class="avatar-container bounce-in-element"
        :style="{ ...avatarContainerStyle, animationDelay: `${animationDelays.profile}s` }"
      >
        <div class="sample-logo-stack">
          <img
            v-if="resolvedBaseLogoSrc"
            :src="resolvedBaseLogoSrc"
            :alt="`${hosts[0]?.name || ''} logo`"
            class="sample-logo sample-logo-base"
            fetchpriority="high"
          />
          <div
            v-else
            class="sample-logo-base fallback-logo-container"
            :style="fallbackLogoStyle"
          >
            <div class="fallback-logo" v-html="processedFallbackLogo" />
          </div>
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
import fallbackLogoSvg from '@/assets/temp-showcase-logo.svg?raw'

const props = defineProps<HostInfoProps>()

const ELEMENT_GAP = ANIMATION_CONSTANTS.ELEMENT_GAP

// Base-slot fallback chain — mirrors CoverContentRows: the event's primary
// logo (already media-resolved upstream as logoUrl) takes priority, then
// the template-provided sample_logo_1, then an inline recoloured copy of
// temp-showcase-logo.svg (handled in the template via processedFallbackLogo).
const resolvedBaseLogoSrc = computed<string | null>(() => {
  if (props.logoUrl) return props.logoUrl
  if (props.sampleLogoOne) return getMediaUrl(props.sampleLogoOne) ?? null
  return null
})

// Inline recoloured fallback SVG — replacing <path fill> with currentColor
// lets the container's color (primaryColor) drive the brand mark's tone.
const processedFallbackLogo = computed(() =>
  fallbackLogoSvg.replace(/<path /g, '<path fill="currentColor" '),
)

const fallbackLogoStyle = computed(() => ({
  color: props.primaryColor,
  filter: `drop-shadow(0 4px 20px ${props.primaryColor}40)`,
}))

// Detect the active base logo's natural aspect ratio so the avatar container
// matches its rendered footprint exactly — keeps the base + sample_logo_2
// overlay + clipped host image perfectly aligned. For the SVG fallback we
// can't measure via Image(), so the aspect falls back to 1 (square), which
// matches temp-showcase-logo.svg's viewBox.
const baseLogoAspect = ref<number | null>(null)
watch(
  resolvedBaseLogoSrc,
  (url, _prev, onCleanup) => {
    baseLogoAspect.value = null
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
        baseLogoAspect.value = img.naturalWidth / img.naturalHeight
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
  '--logo-aspect': `${baseLogoAspect.value ?? 1}`,
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

  return {
    welcome,
    profile,
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

/* Recoloured SVG fallback — fills the base slot when neither the event logo
   nor sample_logo_1 is available. color is set inline via fallbackLogoStyle
   so the currentColor-patched <path> fills pick up the template primary. */
.fallback-logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0.5rem;
}

.fallback-logo {
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
}

.fallback-logo :deep(svg) {
  display: block;
  width: auto !important;
  height: 100% !important;
  max-width: 90% !important;
  max-height: 100% !important;
  object-fit: contain;
  margin: 0 auto;
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
