<template>
  <div class="guest-name-container" :class="{ 'english-name': isEnglishGuestName }">
    <div class="premium-name-frame" :style="frameStyle">
      <!-- Frame artwork: whichever style the template picked. This component
           knows nothing about what gets drawn — see guest-frames/index.ts. -->
      <component
        :is="frameComponent"
        :left-url="leftFrameUrl"
        :mid-url="middleFrameUrl"
        :right-url="rightFrameUrl"
        :config="resolvedGuestFrame"
      />
      <!-- Guest name positioned over the frame -->
      <h2
        ref="guestNameElementRef"
        class="scaled-guest-name font-regular khmer-text-fix text-center guest-name-single-line"
        :class="{ 'is-marquee': isOverflowing }"
        :style="[textStyle, scaleStyle, widthCapStyle]"
      >
        <!-- Hidden probe used for accurate DOM-based width measurement.
             Inherits font styles from the h2, so it reflects the exact
             rendered width (including letter-spacing and custom fonts). -->
        <span ref="measureProbeRef" class="guest-name-measure-probe" aria-hidden="true">{{ formattedGuestName }}</span>
        <template v-if="!isOverflowing">
          <template v-if="isEnglishGuestName">
            <span
              v-for="(char, index) in guestNameChars"
              :key="index"
              class="bounce-char"
              :style="{ animationDelay: `${1 + index * 0.05}s` }"
            >{{ char === ' ' ? '\u00A0' : char }}</span>
          </template>
          <template v-else>
            <span
              v-for="(word, index) in guestNameWords"
              :key="index"
              class="bounce-word"
              :style="{ animationDelay: `${1 + index * 0.15}s` }"
            >{{ word }}{{ index < guestNameWords.length - 1 ? '\u00A0' : '' }}</span>
          </template>
        </template>
        <span v-else class="marquee-track">
          <span class="marquee-item">{{ formattedGuestName }}</span>
          <span class="marquee-item" aria-hidden="true">{{ formattedGuestName }}</span>
        </span>
      </h2>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  resolveGuestFrame,
  GUEST_FRAME_DEFAULTS,
  type ResolvedGuestFrame,
} from '@/composables/showcase/useCoverStageLayout'
import type { CoverStageLayout, GuestFrameConfig } from '@/services/api/types/template.types'
import { GUEST_FRAME_COMPONENTS } from './guest-frames'

// Default liquid glass frames
import leftFramePng from '@/assets/left-frame.png'
import middleFramePng from '@/assets/middle-frame.png'
import rightFramePng from '@/assets/right-frame.png'
// Transparent fallback frames
import leftFrameTranPng from '@/assets/left-frame-tran.png'
import middleFrameTranPng from '@/assets/middle-frame-tran.png'
import rightFrameTranPng from '@/assets/right-frame-tran.png'

interface Props {
  guestName: string
  primaryColor: string
  guestnameColor?: string | null
  primaryFont?: string
  currentFont: string
  getMediaUrl: (url: string) => string
  displayLiquidGlass?: boolean
  guestTitleFrameLeft?: string | null
  guestTitleFrameMid?: string | null
  guestTitleFrameRight?: string | null
  /**
   * Which frame style to draw and how. Omitted resolves to the 3-piece split
   * frame with its original geometry, so a caller that never passes this — or a
   * template that carries no `guestFrame` — renders exactly as before.
   */
  guestFrame?: GuestFrameConfig | null
  /** External scale value (optional, for controlled scaling) */
  scale?: number
  /** Pixel cap on the guest name width (derived from template percentage) */
  maxWidthPx?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  displayLiquidGlass: true,
  scale: 1,
  maxWidthPx: null,
  guestFrame: null,
})

// resolveGuestFrame takes the whole layout, but only ever reads `guestFrame` —
// passing a one-key object keeps the fill-in rules in one place instead of
// duplicating the defaults here.
const resolvedGuestFrame = computed<ResolvedGuestFrame>(() =>
  resolveGuestFrame({ guestFrame: props.guestFrame ?? undefined } as Required<CoverStageLayout>),
)

const frameComponent = computed(
  () =>
    GUEST_FRAME_COMPONENTS[resolvedGuestFrame.value.style] ??
    GUEST_FRAME_COMPONENTS[GUEST_FRAME_DEFAULTS.style],
)

/** The bundled fallback frames only make sense as 3-piece art. */
const isSplitStyle = computed(() => resolvedGuestFrame.value.style === 'split')

// Element refs for DOM measurement
const guestNameElementRef = ref<HTMLElement | null>(null)
const measureProbeRef = ref<HTMLElement | null>(null)

// Internal overflow state — detected via DOM measurement of the probe span
const isOverflowing = ref(false)

// Check if guest name is English/Latin
const isEnglishGuestName = computed(() => {
  return /^[a-zA-Z\s\-'.,()&]+$/.test(props.guestName.trim())
})

// Title-case English names (handles ALL CAPS input like "JOHN DOE" → "John Doe")
const formattedGuestName = computed(() => {
  if (isEnglishGuestName.value) {
    return props.guestName
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }
  return props.guestName
})

const guestNameChars = computed(() => formattedGuestName.value.split(''))
const guestNameWords = computed(() => formattedGuestName.value.split(/\s+/).filter(Boolean))

// Text style.
//
// The two var()s are set by the free-placement layout only when the guest block
// explicitly picked a font or colour slot (see coverElementStyle); otherwise
// they're undefined and the fallback — this component's original rule — wins.
// Note this deliberately lets an explicit slot beat the Great Vibes override
// below: a partner who chose a font for the guest name should get that font,
// Latin script or not.
const textStyle = computed(() => {
  const fontFamily = isEnglishGuestName.value
    ? '"Great Vibes", cursive'
    : props.primaryFont || props.currentFont

  return {
    fontFamily: `var(--cover-block-font, ${fontFamily})`,
    color: `var(--cover-block-color, ${props.guestnameColor || props.primaryColor})`,
    fontWeight: isEnglishGuestName.value ? '400' : 'normal',
    background: 'none',
    backgroundColor: 'transparent',
  }
})

// Scale style
const scaleStyle = computed(() => ({
  transform: `scale(${props.scale})`,
  transformOrigin: 'center center',
}))

// Pixel max-width / width cap from parent (overrides CSS percentage constraint)
const widthCapStyle = computed(() => {
  if (props.maxWidthPx == null) return {}
  if (isOverflowing.value) {
    return {
      maxWidth: `${props.maxWidthPx}px`,
      width: `${props.maxWidthPx}px`,
    }
  }
  return {
    maxWidth: `${props.maxWidthPx}px`,
  }
})

// ---------------------------------------------------------------------------
// Overflow detection
//
// We measure the rendered width of the hidden probe span (which inherits the
// exact font-family / font-size / letter-spacing / font-weight of the h2) and
// compare it against the available content width of the h2 (maxWidthPx minus
// horizontal padding). This is more accurate than canvas measureText because:
//   - letter-spacing is applied by the browser, not by canvas
//   - padding on the h2 is included in the cap
//   - custom fonts (Great Vibes, Khmer fonts) are used once loaded
// ---------------------------------------------------------------------------

// Horizontal padding on the h2 (.guest-name-single-line has padding: 0 4px)
const H2_HORIZONTAL_PADDING_PX = 8
// Safety margin to absorb subpixel rounding and font metric jitter
const OVERFLOW_MARGIN_PX = 1

const checkOverflow = () => {
  const probe = measureProbeRef.value
  if (!probe || props.maxWidthPx == null) {
    isOverflowing.value = false
    return
  }
  const available = props.maxWidthPx - H2_HORIZONTAL_PADDING_PX - OVERFLOW_MARGIN_PX
  if (available <= 0) {
    isOverflowing.value = true
    return
  }
  // getBoundingClientRect gives subpixel-accurate width
  const probeWidth = probe.getBoundingClientRect().width
  isOverflowing.value = probeWidth > available
}

let probeResizeObserver: ResizeObserver | null = null

const scheduleCheck = () => {
  // Wait for layout to settle before measuring
  nextTick(checkOverflow)
}

onMounted(() => {
  scheduleCheck()

  // Re-check after webfonts load — initial measurement may use a fallback font
  if (typeof document !== 'undefined' && document.fonts) {
    document.fonts.ready.then(scheduleCheck).catch(() => {})
  }

  // Re-check whenever the probe resizes (font swap, name change, orientation)
  if (typeof ResizeObserver !== 'undefined' && measureProbeRef.value) {
    probeResizeObserver = new ResizeObserver(() => checkOverflow())
    probeResizeObserver.observe(measureProbeRef.value)
  }
})

onUnmounted(() => {
  if (probeResizeObserver) {
    probeResizeObserver.disconnect()
    probeResizeObserver = null
  }
})

// Re-check when inputs that affect measurement change
watch(
  () => [props.maxWidthPx, props.guestName, props.primaryFont, props.currentFont],
  () => scheduleCheck(),
)

// Frame style
const frameStyle = computed(() => ({
  '--primary-color': props.primaryColor,
  '--accent-glow': props.primaryColor,
}))

// Frame URLs, resolved once here so every style receives the same three slots
// already turned into real URLs.
//
// The bundled PNGs stand in ONLY for the split style: they are a 3-piece set, so
// substituting them into a template that asked for a one-piece or corner frame
// would draw art the partner never chose. Those styles simply render nothing for
// a slot they have no upload in.
const resolveSlot = (
  url: string | null | undefined,
  glassFallback: string,
  transparentFallback: string,
): string | null => {
  if (url) return props.getMediaUrl(url)
  if (!isSplitStyle.value) return null
  return props.displayLiquidGlass ? glassFallback : transparentFallback
}

const leftFrameUrl = computed(() =>
  resolveSlot(props.guestTitleFrameLeft, leftFramePng, leftFrameTranPng),
)

const middleFrameUrl = computed(() =>
  resolveSlot(props.guestTitleFrameMid, middleFramePng, middleFrameTranPng),
)

const rightFrameUrl = computed(() =>
  resolveSlot(props.guestTitleFrameRight, rightFramePng, rightFrameTranPng),
)

// Expose ref for parent scale calculation
defineExpose({
  guestNameElementRef,
})
</script>

<style scoped>
.guest-name-container {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  /* 70% of the row it sits in, unless a free-placed cover block overrides it —
     there the block's own width IS the intended extent, and applying a second
     70% cap on top would make the same numbers render narrower than the row
     model they were seeded from. */
  max-width: var(--guest-frame-max-width, 70%);
}

/* Premium Name Frame */
.premium-name-frame {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  padding: 0.5rem 2.5rem;
}

.guest-name-single-line {
  white-space: nowrap !important;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
  max-width: 100%;
  padding: 0 4px;
  margin: 0;
  /* Establish containing block for the absolutely-positioned measurement probe */
  position: relative;
}

/* Hidden probe used to measure the true rendered width of the guest name,
   including letter-spacing and custom fonts. Absolutely positioned so it
   has no effect on layout, but still lays out its text and reports
   getBoundingClientRect(). */
.guest-name-measure-probe {
  position: absolute;
  left: -99999px;
  top: 0;
  visibility: hidden;
  pointer-events: none;
  white-space: nowrap;
  /* Font metrics (family/size/weight/letter-spacing) are inherited from the h2,
     so measurements reflect the exact rendered glyphs. */
}

.bounce-char,
.bounce-word {
  display: inline-block;
  opacity: 0;
  animation: bounceInChar 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

/* Marquee mode: shown when guest name overflows the 60% cap */
.scaled-guest-name.is-marquee {
  display: block !important;
  overflow: hidden !important;
  white-space: nowrap !important;
  text-overflow: clip !important;
  text-align: left;
}

.marquee-track {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  animation: marquee-loop-ltr 14s linear infinite;
  will-change: transform;
}

.marquee-item {
  display: inline-block;
  flex-shrink: 0;
  padding-right: 3rem;
}

@keyframes marquee-loop-ltr {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .marquee-track {
    animation: none;
  }
}

@keyframes bounceInChar {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  30% {
    opacity: 1;
  }
  50% {
    transform: translateY(-2px);
  }
  75% {
    transform: translateY(1px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Great Vibes font enhancement */
.scaled-guest-name[style*="Great Vibes"] {
  font-size: 1.3em !important;
  letter-spacing: 0.02em;
}

/* Desktop */
@media (min-width: 1024px) {
  .scaled-guest-name {
    font-size: calc(clamp(0.65rem, 2vh, 1.2rem) * var(--cover-font-scale, 1)) !important;
  }

  .scaled-guest-name[style*="Great Vibes"] {
    font-size: calc(clamp(0.85rem, 2.6vh, 1.6rem) * var(--cover-font-scale, 1)) !important;
  }
}

/* Mobile */
@media (max-width: 640px) {
  .scaled-guest-name {
    font-size: calc(clamp(0.65rem, 2vh, 1.2rem) * var(--cover-font-scale, 1)) !important;
  }

  .scaled-guest-name[style*="Great Vibes"] {
    font-size: calc(clamp(0.85rem, 2.6vh, 1.6rem) * var(--cover-font-scale, 1)) !important;
  }

  .guest-name-container {
    gap: 0;
    max-width: var(--guest-frame-max-width, 70%);
  }

  .guest-name-container.english-name .premium-name-frame {
    padding: 0.5rem 2rem !important;
  }
}
</style>
