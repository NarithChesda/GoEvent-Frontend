<template>
  <div class="absolute inset-0">
    <!-- Sequential Video Container - plays all videos in order -->
    <video
      ref="sequentialVideoContainer"
      v-bind="videoProtectionAttrs"
      class="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none desktop-video-sizing"
      style="z-index: -10"
      data-video-type="sequential"
      muted
      playsinline
      preload="auto"
      @ended="$emit('sequentialVideoEnded')"
      @error="$emit('sequentialVideoError')"
    />

    <!-- Hidden Event Video Preloader - stays visible as background while background video loads -->
    <video
      v-if="eventVideoUrl"
      ref="eventVideoPreloader"
      v-bind="videoProtectionAttrs"
      muted
      playsinline
      preload="none"
      class="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none desktop-video-sizing"
      style="z-index: 5"
      data-video-type="event"
      @loadeddata="$emit('eventVideoPreloaded')"
      @canplaythrough="$emit('eventVideoReady')"
      @ended="$emit('sequentialVideoEnded')"
      @error="$emit('sequentialVideoError')"
    />

    <!-- Background Video Element - will replace event video when ready -->
    <video
      v-if="backgroundVideoUrl"
      ref="backgroundVideoElement"
      v-bind="videoProtectionAttrs"
      muted
      loop
      playsinline
      preload="none"
      class="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none desktop-video-sizing"
      style="z-index: 4"
      data-video-type="background"
      @loadeddata="$emit('backgroundVideoPreloaded')"
      @canplaythrough="$emit('backgroundVideoReady')"
      @playing="handleBackgroundVideoPlaying"
    />

    <!-- COVER STAGE BACKGROUND (when decoration is visible, i.e., NOT isContentHidden) -->
    <!-- Background Color Layer for Cover Stage - templateColor or white fallback -->
    <div
      v-if="(!isContentHidden || keepDecorationBackground) && isAnimatedCover"
      class="absolute inset-0"
      :style="{ backgroundColor: decorationBackgroundColor, zIndex: -2 }"
    />

    <!-- Decoration Photo (optimized via ImageKit) - Shows in Cover Stage, swipes up to reveal main content -->
    <!-- For door animation: don't apply swipe-up, just hide instantly when content is hidden -->
    <!-- When keepDecorationBackground is true (transition stage), keep decoration photo visible -->
    <!-- When skipDecorationSlideUp is true (after transition stage), hide instantly without slide-up -->
    <div
      v-if="decorationPhotoUrl && isAnimatedCover"
      class="absolute inset-0 decoration-backdrop"
      :class="{
        'swipe-up-hidden': isContentHidden && isDecorationAnimation && !keepDecorationBackground && !skipDecorationSlideUp,
      }"
      :style="{
        zIndex: 0,
        opacity: (isContentHidden && !keepDecorationBackground && (skipDecorationSlideUp || !isDecorationAnimation)) ? 0 : 1,
      }"
    >
      <img
        :src="decorationPhotoUrl"
        alt="Decoration"
        class="w-full h-full object-cover"
        loading="eager"
        v-bind="protectionAttrs"
        @error="onPhotoError(decorationPhotoUrl)"
      />
    </div>

    <!-- MAIN CONTENT STAGE BACKGROUND (when decoration is hidden, i.e., isContentHidden) -->
    <!-- Not shown when keepDecorationBackground is true (transition stage keeps decoration photo) -->
    <!-- Background Photo Layer (optimized via ImageKit) for Main Content Stage -->
    <div
      v-if="isContentHidden && !keepDecorationBackground && backgroundPhotoUrl && isArtworkBackground"
      class="absolute inset-0"
      style="z-index: -1"
    >
      <img
        :src="backgroundPhotoUrl"
        alt="Background"
        class="w-full h-full object-cover"
        loading="eager"
        v-bind="protectionAttrs"
        @error="onPhotoError(backgroundPhotoUrl)"
      />
    </div>

    <!-- Fallback 1: Template Color for Main Content Stage when no background photo -->
    <div
      v-if="isContentHidden && !keepDecorationBackground && !backgroundPhotoUrl && templateColor && isArtworkBackground"
      class="absolute inset-0"
      :style="{ backgroundColor: templateColor, zIndex: -1 }"
    />

    <!-- Fallback 2: Use Decoration Photo when no background photo AND no templateColor -->
    <div
      v-if="isContentHidden && !keepDecorationBackground && !backgroundPhotoUrl && !templateColor && decorationPhotoUrl && isArtworkBackground"
      class="absolute inset-0"
      style="z-index: -1"
    >
      <img
        :src="decorationPhotoUrl"
        alt="Background"
        class="w-full h-full object-cover"
        loading="eager"
        v-bind="protectionAttrs"
        @error="onPhotoError(decorationPhotoUrl)"
      />
    </div>

    <!-- Fallback 3: White color when no background photo, no templateColor, and no decoration photo -->
    <div
      v-if="isContentHidden && !keepDecorationBackground && !backgroundPhotoUrl && !templateColor && !decorationPhotoUrl && isArtworkBackground"
      class="absolute inset-0"
      style="background-color: #ffffff; z-index: -1"
    />

    <!-- Standard Cover Video Loop - Only show when not in event/background phase and no decoration photo -->
    <video
      v-if="!isAnimatedCover && isCoverVideoPlaying && templateAssets?.standard_cover_video"
      ref="coverVideoElement"
      v-bind="videoProtectionAttrs"
      :src="getMediaUrl(templateAssets.standard_cover_video)"
      autoplay
      loop
      muted
      playsinline
      class="absolute inset-0 w-full h-full desktop-video-sizing"
      data-video-type="cover"
      style="z-index: -1"
      @loadeddata="$emit('coverVideoLoaded')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useOptimizedBackgrounds } from '../../composables/showcase/useOptimizedDecorations'
import { useAssetProtection } from '../../composables/showcase/useAssetProtection'
import { getAnimationType, type ShowcaseAnimationType } from '../../composables/showcase/useShowcaseAnimation'
import type { StageMode } from '../../composables/showcase/useStageModes'

// Asset protection (production-only)
const { protectionAttrs, videoProtectionAttrs } = useAssetProtection()

interface TemplateAssets {
  standard_cover_video?: string
  basic_background_photo?: string
  basic_decoration_photo?: string
}

interface TemplateColor {
  id?: number
  hex_color_code?: string
  hex_code?: string
  name?: string
}

type VideoPhase = 'none' | 'event' | 'background'

interface Props {
  templateAssets?: TemplateAssets | null
  templateColors?: TemplateColor[] | null
  templateColor?: string | null
  eventTitle: string
  eventVideoUrl?: string | null
  backgroundVideoUrl?: string | null
  isCoverVideoPlaying: boolean
  currentVideoPhase?: VideoPhase
  isContentHidden?: boolean
  getMediaUrl: (url: string) => string
  /** Animation type for cover-to-content transition */
  animationType?: ShowcaseAnimationType
  /** When true, keep decoration photo visible even when isContentHidden (used during transition stage) */
  keepDecorationBackground?: boolean
  /** When true, skip the slide-up animation for decoration photo (instant hide instead) */
  skipDecorationSlideUp?: boolean
  /**
   * How the cover presents itself. `animation` draws the decoration photo over
   * its colour ground; `video` loops `standard_cover_video` instead. Absent
   * falls back to the asset, which is exactly what this used to read.
   */
  coverMode?: StageMode
  /**
   * What sits behind the invitation. `animation` walks the artwork ladder below
   * (background photo → template colour → decoration photo → white); `video`
   * draws none of it and lets `standard_background_video` — or, with no file,
   * the showcase wrapper's own colour — show through.
   */
  backgroundMode?: StageMode
}

const props = defineProps<Props>()

// Animation type detection - only apply swipe-up for decoration animation
const isDecorationAnimation = computed(() => getAnimationType(props.animationType) === 'decoration')

/**
 * Which backdrop each stage gets.
 *
 * Every one of these layers used to be gated on `!standard_cover_video`, which
 * meant one uploaded file decided all three stages at once: a template could not
 * have a video cover and a photographed invitation backdrop, or the reverse. The
 * two modes split that decision in half. Both default to the old inference so a
 * template that declares nothing renders unchanged.
 */
const isAnimatedCover = computed(
  () => (props.coverMode ?? (props.templateAssets?.standard_cover_video ? 'video' : 'animation')) === 'animation',
)
const isArtworkBackground = computed(
  () => (props.backgroundMode ?? (props.templateAssets?.standard_cover_video ? 'video' : 'animation')) === 'animation',
)

// Optimized background/decoration photo URLs using reactive window dimensions
const { optimizedDecorationPhotoUrl, optimizedBackgroundPhotoUrl } = useOptimizedBackgrounds(
  computed(() => props.templateAssets?.basic_decoration_photo ?? null),
  computed(() => props.templateAssets?.basic_background_photo ?? null)
)

// A photo URL that exists but cannot actually load (unreachable media host, a
// deleted asset, a still-uploading file) used to be indistinguishable from a
// working one here: the layer rendered, and its presence suppressed the
// template-colour / decoration / white fallbacks below, leaving nothing but the
// stage's own flat background colour. Remembering the failure lets the same
// fallback chain that handles "no background photo" handle "background photo
// that won't load" too. Keyed by URL so a corrected asset gets a fresh try
// rather than staying written off for the life of the component.
const failedPhotoUrls = ref(new Set<string>())

const onPhotoError = (url: string | null) => {
  if (url) failedPhotoUrls.value = new Set(failedPhotoUrls.value).add(url)
}

const decorationPhotoUrl = computed(() => {
  const url = optimizedDecorationPhotoUrl.value
  return url && !failedPhotoUrls.value.has(url) ? url : null
})

const backgroundPhotoUrl = computed(() => {
  const url = optimizedBackgroundPhotoUrl.value
  return url && !failedPhotoUrls.value.has(url) ? url : null
})

// Compute the background color for decoration photo
const decorationBackgroundColor = computed(() => {
  // Use templateColor, then white as final fallback
  return props.templateColor || '#ffffff'
})

const emit = defineEmits<{
  sequentialVideoEnded: []
  sequentialVideoError: []
  eventVideoLoadStarted: []
  eventVideoPreloaded: []
  eventVideoReady: []
  backgroundVideoLoadStarted: []
  backgroundVideoPreloaded: []
  backgroundVideoReady: []
  backgroundVideoPlaying: []
  coverVideoLoaded: []
}>()

// Template refs for video elements
const sequentialVideoContainer = ref<HTMLVideoElement | null>(null)
const eventVideoPreloader = ref<HTMLVideoElement | null>(null)
const backgroundVideoElement = ref<HTMLVideoElement | null>(null)
const coverVideoElement = ref<HTMLVideoElement | null>(null)

// Handle background video playing event to ensure visibility and notify parent
const handleBackgroundVideoPlaying = () => {
  if (backgroundVideoElement.value) {
    // Ensure the video is visible when it starts playing
    backgroundVideoElement.value.style.opacity = '1'
    backgroundVideoElement.value.style.zIndex = '5' // Same level as event video to replace it
  }
  // Emit event to parent so it can change the video phase and show main content
  emit('backgroundVideoPlaying')
}

// Expose refs to parent component
defineExpose({
  sequentialVideoContainer,
  eventVideoPreloader,
  backgroundVideoElement,
  coverVideoElement,
})
</script>

<style scoped>
/* The cover backdrop's handover to the main stage's own (which mounts beneath
   it at z-index -1, so lowering this one reveals it).
   `transition-all` before, and only when the decoration slide-up was in play —
   with a transition stage the class was dropped entirely and the opacity cut
   from 1 to 0 on a single frame. That was invisible while the stage above was
   opaque at that moment; it no longer is, now that the invitation mounts under
   the dissolve. Naming the two properties means the transition can stay on
   unconditionally. */
.decoration-backdrop {
  transition: transform 0.7s var(--sc-ease-out, cubic-bezier(0.23, 1, 0.32, 1)), opacity 0.7s var(--sc-ease-out, cubic-bezier(0.23, 1, 0.32, 1));
}

@media (prefers-reduced-motion: reduce) {
  .decoration-backdrop.swipe-up-hidden {
    transform: none;
  }
}

/* Swipe Up Animation */
.swipe-up-hidden {
  transform: translateY(-100%);
  opacity: 0;
  pointer-events: none;
}

/* Responsive video sizing */
/* `dvh` fallback pairs throughout: the cover video has to fill the same visible
   box as `.showcase-container`, and `100vh` on mobile is the taller
   chrome-hidden height, which pushed the bottom of the frame off screen. */
.desktop-video-sizing {
  position: absolute;
  top: 0;
  left: 0;
  height: 100vh;
  height: 100dvh;
  object-position: center;
}

/* Mobile devices - stretch height, crop width, center video */
@media (max-width: 768px) {
  .desktop-video-sizing {
    width: 100% !important;
    height: 100vh !important;
    height: 100dvh !important;
    object-fit: cover !important;
    object-position: center center !important;
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    transform: none !important;
  }
}

/* Small laptops 13-inch (1024px-1365px) - Use mobile video sizing */
@media (min-width: 1024px) and (max-width: 1365px) {
  .desktop-video-sizing {
    width: 100% !important;
    height: 100vh !important;
    height: 100dvh !important;
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
</style>
