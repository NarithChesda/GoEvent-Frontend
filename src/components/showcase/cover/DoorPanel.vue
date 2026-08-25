<template>
  <div
    class="door-panel"
    :class="[
      side === 'left' ? 'door-panel-left' : 'door-panel-right',
      { 'door-open-left': side === 'left' && isOpen },
      { 'door-open-right': side === 'right' && isOpen }
    ]"
  >
    <div class="door-full-content" :style="doorBackgroundStyle">
      <!-- All decorations at full screen size.
           `max-w-none` on the side pieces is load-bearing: Tailwind's preflight
           applies `img { max-width: 100% }`, and on phones taller than 9:16 the
           stage frame is flex-shrunk narrower than its 1080/1920 width, so that
           clamp squeezed the width while `h-full` held the height — the artwork
           rendered ~20% narrow. They now scale off height at their true ratio
           and let the surplus width clip against the panel. -->
      <img
        v-if="leftDecorationUrl"
        :src="leftDecorationUrl"
        alt="Left decoration"
        class="absolute top-0 bottom-0 left-0 w-auto h-full max-w-none pointer-events-none door-decoration"
        :style="{ zIndex: decorationZIndexes.left }"
        loading="eager"
        v-bind="protectionAttrs"
      />
      <img
        v-if="rightDecorationUrl"
        :src="rightDecorationUrl"
        alt="Right decoration"
        class="absolute top-0 bottom-0 right-0 w-auto h-full max-w-none pointer-events-none door-decoration"
        :style="{ zIndex: decorationZIndexes.right }"
        loading="eager"
        v-bind="protectionAttrs"
      />
      <img
        v-if="topDecorationUrl"
        :src="topDecorationUrl"
        alt="Top decoration"
        class="absolute top-0 left-0 right-0 w-full h-auto pointer-events-none door-decoration"
        :style="{ zIndex: decorationZIndexes.top }"
        loading="eager"
        v-bind="protectionAttrs"
      />
      <img
        v-if="bottomDecorationUrl"
        :src="bottomDecorationUrl"
        alt="Bottom decoration"
        class="absolute bottom-0 left-0 right-0 w-full h-auto pointer-events-none door-decoration"
        :style="{ zIndex: decorationZIndexes.bottom }"
        loading="eager"
        v-bind="protectionAttrs"
      />

      <!-- Printed-gold lighting, inside .door-full-content rather than beside
           it. That element is always the full stage (200% of a half-width open
           leaf, offset), so the band drawn here is one whole cover-sized frame
           per leaf, clipped by the panel — which is exactly how the reference
           artwork builds its doors: each is the complete lit cover plate, seen
           through half a panel. Sits under .door-content-layer (z-30) so the
           lettering stays unlit. -->
      <CoverGilding
        v-if="coverGilding"
        :config="coverGilding"
        :primary-color="primaryColor"
        :secondary-color="secondaryColor"
        :accent-color="accentColor"
        :z-index="27"
      />

      <!-- Content layer -->
      <div class="door-content-layer">
        <CoverContentRows
          :event-title="eventTitle"
          :event-logo="eventLogo"
          :sample-logo-one="sampleLogoOne"
          :sample-logo-two="sampleLogoTwo"
          :first-host-image="firstHostImage"
          :first-host-name="firstHostName"
          :first-host-id="firstHostId"
          :host-clip-style="hostClipStyle"
          :show-cover-header-text="showCoverHeaderText"
          :guest-name="guestName"
          :primary-color="primaryColor"
          :secondary-color="secondaryColor"
          :guestname-color="guestnameColor"
          :current-font="currentFont"
          :primary-font="primaryFont"
          :secondary-font="secondaryFont"
          :event-texts="eventTexts"
          :current-language="currentLanguage"
          :container-style="containerStyle"
          :row-styles="rowStyles"
          :layout-mode="layoutMode"
          :element-styles="elementStyles"
          :get-media-url="getMediaUrl"
          :display-liquid-glass="displayLiquidGlass"
          :guest-title-frame-left="guestTitleFrameLeft"
          :guest-title-frame-mid="guestTitleFrameMid"
          :guest-title-frame-right="guestTitleFrameRight"
          :guest-frame="guestFrame"
          :guest-name-max-width-percent="guestNameMaxWidthPercent"
          :show-animations="false"
        />
      </div>
    </div>

    <!-- Siblings of .door-full-content, not children: the content is 200% wide
         and overflows the panel, so an inner-edge overlay anchored inside it
         would land off-panel. These are pure light rather than a palette
         colour, so they read correctly whatever the template's colours are.

         The face turning away from the light as it swings… -->
    <div class="door-swing-shade" aria-hidden="true" />
    <!-- …and the light through the opening catching the inner edge, brightest
         mid-swing when the edge is most side-on to it. -->
    <div class="door-rim-light" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import { useAssetProtection } from '@/composables/showcase/useAssetProtection'
import type { ResolvedCoverGilding } from '@/composables/showcase/useCoverStageLayout'
import type {
  CoverElementId,
  CoverLayoutMode,
  GuestFrameConfig,
} from '@/services/api/types/template.types'
import CoverContentRows from './CoverContentRows.vue'
import CoverGilding from './CoverGilding.vue'

interface RowStyles {
  eventTitle: { height: string }
  logo: { height: string }
  inviteText: { height: string }
  guestName: { height: string }
}

interface DecorationZIndexes {
  left: number
  right: number
  top: number
  bottom: number
}

interface EventText {
  text_type: string
  language: string
  content: string
}

interface Props {
  side: 'left' | 'right'
  isOpen: boolean
  // Decoration URLs
  leftDecorationUrl?: string | null
  rightDecorationUrl?: string | null
  topDecorationUrl?: string | null
  bottomDecorationUrl?: string | null
  decorationZIndexes: DecorationZIndexes
  // Content props
  eventTitle: string
  eventLogo?: string | null
  /** Template-provided base logo (transparency). Shown in the merged logo row when showCoverHeaderText is false. */
  sampleLogoOne?: string | null
  /** Template-provided overlay logo (transparency). Its opaque shape is used as a clip mask for the first host image. */
  sampleLogoTwo?: string | null
  /** First host profile image — clipped by sample_logo_2 in the merged logo row. */
  firstHostImage?: string | null
  /** First host display name — alt text for the clipped host image. */
  firstHostName?: string
  /** First host id — routes the preview editor to the host drawer when the logo row frames that host's photo. */
  firstHostId?: number | null
  /** CSS variables driving host-clip size/offset (from cover_stage_layout). */
  hostClipStyle?: Record<string, string>
  /** Render the cover text header row; when false, the row collapses and its space is merged into the logo row. */
  showCoverHeaderText?: boolean
  guestName?: string | null
  primaryColor: string
  secondaryColor?: string | null
  /** Only used to tint the leaf's gilding; the cover copy has its own slots. */
  accentColor?: string
  guestnameColor?: string | null
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  eventTexts?: EventText[]
  currentLanguage?: string
  containerStyle: { top: string; height: string }
  rowStyles: RowStyles
  /** Forwarded straight through: the doors render the same cover blocks. */
  layoutMode?: CoverLayoutMode
  elementStyles?: Record<CoverElementId, Record<string, string>>
  getMediaUrl: (url: string) => string
  displayLiquidGlass?: boolean
  guestTitleFrameLeft?: string | null
  guestTitleFrameMid?: string | null
  guestTitleFrameRight?: string | null
  /** Which frame style wraps the guest name, and how. Unset = the 3-piece split frame. */
  guestFrame?: GuestFrameConfig | null
  /** Guest name max width as % of row container (overrides default 60) */
  guestNameMaxWidthPercent?: number
  // Door background
  backgroundColor?: string
  backgroundImageUrl?: string | null
  /** Resolved gilding config. Rendered only when the template turned it on. */
  coverGilding?: ResolvedCoverGilding | null
}

import { computed } from 'vue'

const props = withDefaults(defineProps<Props>(), {
  displayLiquidGlass: true,
  backgroundColor: '#000000',
  showCoverHeaderText: true,
})

const { protectionAttrs } = useAssetProtection()

// Compute door background style - use image if available, otherwise solid color
const doorBackgroundStyle = computed(() => {
  if (props.backgroundImageUrl) {
    return {
      backgroundImage: `url(${props.backgroundImageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }
  }
  return {
    backgroundColor: props.backgroundColor,
  }
})
</script>

<style scoped>
/* Door panel base styles */
.door-panel {
  position: absolute;
  top: 0;
  bottom: 0;
  overflow: hidden;
  backface-visibility: hidden;
  /* Promoted while the cover is just sitting there rather than at the tap. A
     leaf carries the entire cover — four full-bleed ornaments, the gilding and
     the copy — and a phone cannot rasterize that inside the first frame of the
     swing. The compositor animates the layer on time regardless and draws
     whatever tiles exist, which is where the blank / half-painted leaves came
     from. Warming both textures up front takes that cost off the animation. */
  will-change: transform;
  pointer-events: none;
}

/* Door full content */
.door-full-content {
  position: absolute;
  top: 0;
  bottom: 0;
  height: 100%;
  /* Was `transform-style: preserve-3d`, which bought nothing — no descendant
     here carries a 3D transform, the swing lives on .door-panel above — and
     cost the leaf its cacheability: preserve-3d keeps a subtree unflattened, so
     each frame of the rotation recomposited the whole cover instead of
     re-projecting one texture. `isolation` keeps the one thing preserve-3d was
     silently providing: the stacking context CoverGilding's blend layers expect
     to blend against (see the comment at the top of CoverGilding). */
  isolation: isolate;
}

/* Cast shadow lifting each ornament off the leaf behind it — see the matching
   rule in CoverDecorations.vue for why this is drop-shadow rather than
   box-shadow. The variable comes from CoverContentOverlay, which is an ancestor
   of both leaves; it is `none` unless the template switched the cover gilding
   on, so this costs every other template nothing. */
.door-decoration {
  filter: var(--cover-decoration-relief, none);
}

/* Door content layer */
.door-content-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 30;
}

/* GEOMETRY — the same closed and open
 *
 * The leaves always sit side by side, each clipping its own half of one
 * full-stage-wide copy of the cover: closed they butt together and read as the
 * single uncut cover, open they simply swing apart. Nothing about their layout
 * changes when the tap lands, so the swing is a pure transform from its first
 * frame.
 *
 * They used to be arranged the other way — left leaf at full width with the
 * right one stacked behind it at opacity 0 — which meant the tap had to resize
 * both (panel 100%→50%, content 100%→200%) and reveal a leaf that, being fully
 * transparent, had never been painted at all. That handed the compositor two
 * freshly invalidated full-screen layers to animate. A desktop GPU rasterizes
 * them inside a frame and nothing shows; a phone does not, and the opening
 * third of the swing played against blank or half-drawn leaves.
 */
.door-panel-left {
  left: 0;
  /* A pixel of lap across the seam. Two independently composited layers meeting
     at a fractional device pixel leave a hairline of whatever is behind them;
     this leaf covers it instead (it is the upper of the two). The content rule
     below hands the 2px straight back, so the artwork is still exactly one
     stage wide on both leaves — stretching one half would only move the seam
     into the artwork itself. */
  width: calc(50% + 1px);
  z-index: 2;
  transform-origin: left center;
}

.door-panel-left .door-full-content {
  width: calc(200% - 2px);
  left: 0;
}

.door-panel-right {
  right: 0;
  width: 50%;
  z-index: 1;
  transform-origin: right center;
}

.door-panel-right .door-full-content {
  width: 200%;
  left: -100%;
}

/* OPEN STATE
 *
 * The reference artwork's curtain runs two curves off one 1.65s beat: the
 * panels' outward travel on easeInOutQuart (full at 94% of the beat), and
 * their swing on easeOutBack clamped at 1.06, so the leaf overshoots to ~87deg
 * and settles back to 82. One element carries one timing function, so both
 * curves are sampled into the stops below and played linearly — that ordering
 * is the whole character: the door swings open first, *then* gathers away.
 * A single shared easing collapses it into one flat simultaneous move.
 *
 * The swing is positive on the left leaf (hinged at its left edge), which
 * turns its inner edge away from the viewer — the doors recede rather than
 * lunging forward, and at 82deg with -62% of travel each leaf has left the
 * frame entirely. Perspective comes from .door-perspective-container so both
 * leaves share one 3D scene; a per-element perspective() would give each its
 * own vanishing point.
 *
 * 1.65s is DOOR_OPEN_DURATION_MS in useDoorAnimation.ts — keep them in step,
 * along with TransitionStageDoor.vue's beats, which are timed off this swing.
 */
.door-open-left {
  animation: doorOpenLeft 1.65s linear forwards;
}

.door-open-right {
  animation: doorOpenRight 1.65s linear forwards;
}

/* For the length of the swing a leaf is a photograph of the cover being moved,
   not a surface still being lit. The gilding's travelling speculars and corner
   glints animate paint (`background-position`, and a blended opacity/scale),
   and animated paint inside a blended group is the one thing that stops the
   compositor caching the leaf — it redraws the whole cover every frame, on both
   leaves, for the entire 1.65s. Freezing them where they stand, on artwork that
   is turning edge-on and leaving the screen, is not perceivable; it is what
   lets a phone re-project a texture instead of repainting the cover sixty times
   a second. The band's fixed bevel and catch-light are untouched, so nothing
   pops at the moment the swing starts. */
.door-open-left :deep(.gild-sweep),
.door-open-right :deep(.gild-sweep),
.door-open-left :deep(.gild-flare),
.door-open-right :deep(.gild-flare) {
  animation-play-state: paused;
}

@keyframes doorOpenLeft {
  0% { transform: translateX(0) rotateY(0deg); }
  10% { transform: translateX(-0.1%) rotateY(33.5deg); }
  20% { transform: translateX(-1%) rotateY(57.9deg); }
  30% { transform: translateX(-5.2%) rotateY(74.4deg); }
  40% { transform: translateX(-16.3%) rotateY(84.4deg); }
  50% { transform: translateX(-38.3%) rotateY(86.9deg); }
  60% { transform: translateX(-53.6%) rotateY(86.9deg); }
  70% { transform: translateX(-59.9%) rotateY(86.9deg); }
  80% { transform: translateX(-61.8%) rotateY(85.8deg); }
  90% { transform: translateX(-62%) rotateY(83.2deg); }
  100% { transform: translateX(-62%) rotateY(82deg); }
}

@keyframes doorOpenRight {
  0% { transform: translateX(0) rotateY(0deg); }
  10% { transform: translateX(0.1%) rotateY(-33.5deg); }
  20% { transform: translateX(1%) rotateY(-57.9deg); }
  30% { transform: translateX(5.2%) rotateY(-74.4deg); }
  40% { transform: translateX(16.3%) rotateY(-84.4deg); }
  50% { transform: translateX(38.3%) rotateY(-86.9deg); }
  60% { transform: translateX(53.6%) rotateY(-86.9deg); }
  70% { transform: translateX(59.9%) rotateY(-86.9deg); }
  80% { transform: translateX(61.8%) rotateY(-85.8deg); }
  90% { transform: translateX(62%) rotateY(-83.2deg); }
  100% { transform: translateX(62%) rotateY(-82deg); }
}

/* Swing shading + rim light. Above the content layer (z-30) so they fall on
   the whole face, below the hinge/gap shadows (z-100/101). */
.door-swing-shade,
.door-rim-light {
  position: absolute;
  top: 0;
  bottom: 0;
  opacity: 0;
  pointer-events: none;
}

.door-swing-shade {
  left: 0;
  right: 0;
  z-index: 40;
}

.door-panel-left .door-swing-shade {
  background: linear-gradient(
    90deg,
    rgba(12, 10, 14, 0.62) 0%,
    rgba(20, 16, 20, 0.3) 55%,
    rgba(40, 30, 20, 0) 100%
  );
}

.door-panel-right .door-swing-shade {
  background: linear-gradient(
    270deg,
    rgba(12, 10, 14, 0.62) 0%,
    rgba(20, 16, 20, 0.3) 55%,
    rgba(40, 30, 20, 0) 100%
  );
}

/* Tracks the swing, not the travel: the face is turned away well before the
   leaf has finished gathering off-frame. */
.door-open-left .door-swing-shade,
.door-open-right .door-swing-shade {
  animation: doorSwingShade 1.65s linear forwards;
}

@keyframes doorSwingShade {
  0% { opacity: 0; }
  45% { opacity: 1; }
  100% { opacity: 1; }
}

.door-rim-light {
  width: 35%;
  z-index: 41;
  mix-blend-mode: screen;
}

.door-panel-left .door-rim-light {
  right: 0;
  background: linear-gradient(90deg, rgba(255, 220, 150, 0), rgba(255, 232, 180, 0.75));
}

.door-panel-right .door-rim-light {
  left: 0;
  background: linear-gradient(270deg, rgba(255, 220, 150, 0), rgba(255, 232, 180, 0.75));
}

/* sin(travel * PI) * 0.95 — brightest when the leaf is half gathered and most
   side-on to the light coming through the opening. */
.door-open-left .door-rim-light,
.door-open-right .door-rim-light {
  animation: doorRimLight 1.65s linear forwards;
}

@keyframes doorRimLight {
  0% { opacity: 0; }
  20% { opacity: 0.05; }
  30% { opacity: 0.25; }
  40% { opacity: 0.72; }
  47% { opacity: 0.95; }
  60% { opacity: 0.62; }
  70% { opacity: 0.31; }
  85% { opacity: 0.06; }
  100% { opacity: 0; }
}

/* Door edge shadow - creates depth illusion at the hinge side */
.door-panel::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 15%;
  max-width: 80px;
  min-width: 30px;
  opacity: 0;
  transition: opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  pointer-events: none;
  z-index: 100;
}

/* Center gap shadow - appears between doors when opening */
.door-panel::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 8%;
  max-width: 40px;
  min-width: 15px;
  opacity: 0;
  transition: opacity 0.6s ease-out 0.2s;
  pointer-events: none;
  z-index: 101;
}

/* Left door shadows */
.door-panel-left::before {
  left: 0;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.25) 0%,
    rgba(0, 0, 0, 0.08) 40%,
    transparent 100%
  );
}

.door-panel-left::after {
  right: 0;
  background: linear-gradient(
    to left,
    rgba(0, 0, 0, 0.35) 0%,
    rgba(0, 0, 0, 0.15) 30%,
    rgba(0, 0, 0, 0.05) 60%,
    transparent 100%
  );
}

/* Right door shadows */
.door-panel-right::before {
  right: 0;
  background: linear-gradient(
    to left,
    rgba(0, 0, 0, 0.25) 0%,
    rgba(0, 0, 0, 0.08) 40%,
    transparent 100%
  );
}

.door-panel-right::after {
  left: 0;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.35) 0%,
    rgba(0, 0, 0, 0.15) 30%,
    rgba(0, 0, 0, 0.05) 60%,
    transparent 100%
  );
}

/* Open state - show shadows */
.door-open-left::before,
.door-open-right::before {
  opacity: 0.7;
}

.door-open-left::after,
.door-open-right::after {
  opacity: 1;
}

/* Reduced motion preference — the leaves fade out where they stand rather
   than swinging. */
@media (prefers-reduced-motion: reduce) {
  .door-panel {
    transition: opacity 0.3s ease-out;
  }

  .door-open-left,
  .door-open-right {
    animation: none;
    transform: none;
    opacity: 0;
  }

  .door-swing-shade,
  .door-rim-light {
    display: none;
  }

  /* The hinge and centre-gap shadows below run on their own clocks — 0.8s and
     0.6s-after-0.2s — because they shade a leaf that is swinging for 1.65s.
     Here the leaf is not swinging; it fades out where it stands in 0.3s, so
     both of these were still fading IN a half-second after the surface they
     shade had gone. There is nothing left for them to sit on. */
  .door-panel::before,
  .door-panel::after {
    display: none;
  }
}
</style>
