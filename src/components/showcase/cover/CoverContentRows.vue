<template>
  <div
    class="inner-container-rows flex flex-col w-full mx-auto absolute"
    :style="containerStyle"
  >
    <!-- Event Title Row (hidden when showCoverHeaderText is false) -->
    <div
      v-if="showCoverHeaderText"
      class="content-row-header flex items-center justify-center"
      :class="{ 'animate-fadeIn': showAnimations }"
      :style="rowStyles.eventTitle"
    >
      <div
        class="header-content-container flex items-center justify-center px-4 w-full"
      >
        <h1
          class="scaled-header font-regular capitalize khmer-text-fix text-center"
          :style="headerTextStyle"
        >
          {{ displayTitle }}
        </h1>
      </div>
    </div>

    <!-- Event Logo Row (absorbs the event title row's height when the header is hidden) -->
    <div
      class="content-row-logo flex items-center justify-center"
      :class="{ 'animate-fadeIn animation-delay-200': showAnimations }"
      :style="rowStyles.logo"
    >
      <div class="flex items-center justify-center h-full w-full px-4">
        <!-- Merged logo row: stack with a three-tier base (event logo → sample_logo_1 →
             recoloured temp SVG). sample_logo_2's opaque shape either overlays directly
             or clips the first host's profile image into the shape. -->
        <div v-if="useSampleLogos" class="sample-logo-stack">
          <img
            v-if="resolvedBaseLogoSrc"
            :src="resolvedBaseLogoSrc"
            :alt="eventTitle + ' logo'"
            class="sample-logo sample-logo-base"
            fetchpriority="high"
            v-bind="protectionAttrs"
          />
          <div
            v-else
            class="sample-logo-base fallback-logo-container"
            :style="fallbackLogoStyle"
          >
            <div class="fallback-logo" v-html="processedFallbackLogo" />
          </div>
          <!-- Host image clipped into sample_logo_2's shape. Bounds auto-detected
               from the PNG's alpha channel so the host photo fills exactly the
               opaque region of the shape, whatever its silhouette. -->
          <div
            v-if="showClippedHost"
            class="sample-logo-shape-layer"
            aria-hidden="false"
          >
            <div class="host-clip-box" :style="hostClipBoxStyle">
              <img
                :src="getMediaUrl(firstHostImage as string)"
                :alt="firstHostName || eventTitle + ' host'"
                class="clipped-host-image"
                :style="clippedHostStyle"
                fetchpriority="high"
                v-bind="protectionAttrs"
              />
            </div>
          </div>
          <!-- Fallback: render sample_logo_2 as a plain overlay when there's no
               host image or bounds detection failed (e.g. CORS-tainted canvas). -->
          <img
            v-else-if="sampleLogoTwo"
            :src="getMediaUrl(sampleLogoTwo)"
            :alt="eventTitle + ' logo overlay'"
            class="sample-logo sample-logo-overlay"
            fetchpriority="high"
            v-bind="protectionAttrs"
          />
        </div>
        <img
          v-else-if="eventLogo"
          :src="getMediaUrl(eventLogo)"
          :alt="eventTitle + ' logo'"
          class="scaled-logo mx-auto"
          fetchpriority="high"
          v-bind="protectionAttrs"
        />
        <div
          v-else
          class="fallback-logo-container"
          :style="fallbackLogoStyle"
        >
          <div class="fallback-logo" v-html="processedFallbackLogo" />
        </div>
      </div>
    </div>

    <!-- Invite Text Row -->
    <div
      v-if="guestName"
      class="content-row-invite flex items-center justify-center"
      :class="{ 'animate-fadeIn animation-delay-400': showAnimations }"
      :style="{ ...rowStyles.inviteText, overflow: 'visible' }"
    >
      <div
        class="invite-content-container flex items-center justify-center px-4 w-full"
        style="height: 60%"
      >
        <p class="scaled-invite-text khmer-text-fix text-center" :style="inviteTextStyle">
          {{ displayInviteText }}
        </p>
      </div>
    </div>

    <!-- Guest Name Row -->
    <div
      v-if="guestName"
      ref="guestContainerRef"
      class="content-row-guest flex items-center justify-center"
      :style="{ ...rowStyles.guestName, overflow: 'visible', zIndex: 100, position: 'relative' }"
    >
      <div class="guest-content-container flex items-center justify-center px-4 w-full">
        <GuestNameFrame
          ref="guestNameFrameRef"
          :guest-name="guestName || ''"
          :primary-color="primaryColor"
          :guestname-color="guestnameColor"
          :primary-font="primaryFont"
          :current-font="currentFont"
          :get-media-url="getMediaUrl"
          :display-liquid-glass="displayLiquidGlass"
          :guest-title-frame-left="guestTitleFrameLeft"
          :guest-title-frame-mid="guestTitleFrameMid"
          :guest-title-frame-right="guestTitleFrameRight"
          :max-width-px="guestNameMaxWidthPx"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { translateRSVP, type SupportedLanguage } from '@/utils/translations'
import { useAssetProtection } from '@/composables/showcase/useAssetProtection'
import { useShapeMaskBounds } from '@/composables/showcase/useShapeMaskBounds'
import GuestNameFrame from './GuestNameFrame.vue'
import fallbackLogoSvg from '@/assets/temp-showcase-logo.svg?raw'

interface RowStyles {
  eventTitle: { height: string }
  logo: { height: string }
  inviteText: { height: string }
  guestName: { height: string }
}

interface EventText {
  text_type: string
  language: string
  content: string
}

interface Props {
  eventTitle: string
  eventLogo?: string | null
  /** Template-provided base logo (transparency). Rendered in the merged logo row when showCoverHeaderText is false. */
  sampleLogoOne?: string | null
  /** Template-provided overlay logo (transparency). Its opaque shape is used as a clip mask for the first host image. */
  sampleLogoTwo?: string | null
  /** First host profile image — clipped by the sample_logo_2 shape when provided. */
  firstHostImage?: string | null
  /** First host display name — alt text for the clipped host image. */
  firstHostName?: string
  /** CSS variables from cover_stage_layout that control the clipped host image's size + offset within the shape. */
  hostClipStyle?: Record<string, string>
  /** Render the cover text header row. When false, the event title row collapses and sample logos fill the merged logo row. */
  showCoverHeaderText?: boolean
  guestName?: string | null
  primaryColor: string
  secondaryColor?: string | null
  guestnameColor?: string | null
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  eventTexts?: EventText[]
  currentLanguage?: string
  containerStyle: { top: string; height: string }
  rowStyles: RowStyles
  getMediaUrl: (url: string) => string
  displayLiquidGlass?: boolean
  guestTitleFrameLeft?: string | null
  guestTitleFrameMid?: string | null
  guestTitleFrameRight?: string | null
  /** Max width of the guest name as % of the row container (default: 60) */
  guestNameMaxWidthPercent?: number
  /** Show fade-in animations (for decoration mode) */
  showAnimations?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showAnimations: false,
  displayLiquidGlass: true,
  guestNameMaxWidthPercent: 60,
  showCoverHeaderText: true,
})

// When the cover header row is hidden, render the merged logo row as a
// stack. The base slot of that stack now resolves via a three-tier fallback
// (event primary logo → template sample_logo_1 → the recoloured
// temp-showcase-logo.svg), so the stack renders even when the template
// omits sample_logo_1.
const useSampleLogos = computed(() => !props.showCoverHeaderText)

// Resolved URL for the stack's base-image slot. Prefers the event's own
// logo (event.logo_one at the call site, passed in as eventLogo), then the
// template-provided sample_logo_1. Returns null when neither is available,
// which triggers the inline recoloured SVG fallback in the template below.
const resolvedBaseLogoSrc = computed(() => {
  if (props.eventLogo) return props.getMediaUrl(props.eventLogo)
  if (props.sampleLogoOne) return props.getMediaUrl(props.sampleLogoOne)
  return null
})

const { protectionAttrs } = useAssetProtection()

// Auto-detect the opaque bounding box of sample_logo_2 so the host photo can
// be scaled/positioned to fill exactly the shape silhouette (not the full
// image footprint). Falls back to null on CORS/tainted-canvas errors.
const sampleLogoTwoUrl = computed(() =>
  props.sampleLogoTwo ? props.getMediaUrl(props.sampleLogoTwo) : null,
)
const { bounds: shapeBounds } = useShapeMaskBounds(sampleLogoTwoUrl)

// Render the clipped host image only when every piece is available: the
// shape, the host photo, and valid detected bounds. Otherwise fall through
// to rendering sample_logo_2 as a plain overlay.
const showClippedHost = computed(
  () => !!props.sampleLogoTwo && !!props.firstHostImage && !!shapeBounds.value,
)

// Style for the masked container: matches sample_logo_2's rendered footprint
// via aspect-ratio + max-w/h (behaves like object-fit: contain in the flex
// parent), with the PNG itself as the CSS mask so only the opaque shape is
// visible. The --host-clip-offset-* vars flow through for object-position.
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

// Position the host image at the detected shape bounds inside the masked
// container so cover-scaling fills the silhouette tightly. object-position
// (from --host-clip-offset-*) lets templates pan the face within cover-crop.
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

// Refs for guest name sizing (pixel max-width derived from container width)
const guestContainerRef = ref<HTMLElement | null>(null)
const guestNameFrameRef = ref<InstanceType<typeof GuestNameFrame> | null>(null)
const guestNameMaxWidthPx = ref<number | null>(null)

// Text content helpers
const getTextContent = (textType: string, fallback = ''): string => {
  if (props.eventTexts && props.currentLanguage) {
    const text = props.eventTexts.find(
      (t) => t.text_type === textType && t.language === props.currentLanguage,
    )
    if (text?.content) {
      return text.content
    }
  }

  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
  if (textType === 'invite_text') {
    return translateRSVP('invite_text', currentLang)
  }

  return fallback
}

// Cover header from event texts
const coverHeader = computed(
  () => props.eventTexts?.find((text) => text.text_type === 'cover_header')?.content,
)

// Display title (cover header or event title)
const displayTitle = computed(() => coverHeader.value || props.eventTitle)

// Invite text
const displayInviteText = computed(() => getTextContent('invite_text', "You're Invited"))

// Header text style
const headerTextStyle = computed(() => ({
  fontFamily: props.primaryFont || props.currentFont,
  color: props.primaryColor,
  whiteSpace: 'pre-line' as const,
}))

// Invite text style
const inviteTextStyle = computed(() => ({
  color: props.primaryColor || props.secondaryColor || 'rgba(255, 255, 255, 0.9)',
  fontFamily: props.secondaryFont || props.currentFont,
  textShadow: 'none',
}))

// Process fallback logo SVG
const processedFallbackLogo = computed(() => {
  return fallbackLogoSvg.replace(/<path /g, '<path fill="currentColor" ')
})

// Fallback logo style
const fallbackLogoStyle = computed(() => ({
  color: props.primaryColor,
  filter: `drop-shadow(0 4px 20px ${props.primaryColor}40)`,
}))

// Compute pixel cap on guest name width from container width × configured percent
const updateGuestNameMaxWidth = () => {
  if (!guestContainerRef.value) return
  const percent = Math.max(1, Math.min(100, props.guestNameMaxWidthPercent ?? 60))
  guestNameMaxWidthPx.value = guestContainerRef.value.offsetWidth * (percent / 100)
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  nextTick(updateGuestNameMaxWidth)

  if (guestContainerRef.value) {
    resizeObserver = new ResizeObserver(() => updateGuestNameMaxWidth())
    resizeObserver.observe(guestContainerRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

// Re-compute max-width when the configured percent changes
watch(() => props.guestNameMaxWidthPercent, () => {
  nextTick(updateGuestNameMaxWidth)
})
</script>

<style scoped>
/* Import shared cover stage styles */
@import '../cover-stage-styles.css';

/* Fallback Logo Styles */
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

.fallback-logo:hover {
  transform: scale(1.05);
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

/* Sample logo stack — base logo fills the merged logo row, overlay sits on top at the same position. */
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
   opaque pixels, so anything absolutely positioned inside is silhouetted to
   the shape. aspect-ratio comes from the image's natural dimensions.
   IMPORTANT: width is intentionally NOT set — when both width and height are
   explicit, aspect-ratio is ignored and the mask gets stretched to fill the
   row (e.g. a circle becomes an oval). With height:100% + aspect-ratio, the
   width auto-derives; max-width:100% clamps tall containers by reducing both
   dimensions proportionally. */
.host-clip-box {
  position: relative;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  /* aspect-ratio is set inline from detected shape bounds */
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  overflow: hidden;
}

/* Host photo positioned at the detected opaque-pixel bounding box and
   cover-scaled to fill it. object-position is driven by template vars so
   face framing can be tweaked per template without breaking the clip. */
.clipped-host-image {
  position: absolute;
  object-fit: cover;
  object-position: var(--host-clip-offset-x, 50%) var(--host-clip-offset-y, 50%);
  display: block;
}

</style>
