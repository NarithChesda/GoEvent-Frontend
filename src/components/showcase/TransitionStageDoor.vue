<template>
  <div class="door-transition-stage" :class="{ revealing: isRevealing, blooming: isBlooming }" :style="paletteStyle">
    <!-- Manage-page preview controls: replay the reveal, and re-aim the
         featured photo's crop. Replay has to be a real button because the
         featured-photo edit region below drops the frame's normal
         click-anywhere-to-replay shield. -->
    <div v-if="editIntentCtx" class="preview-controls">
      <button
        type="button"
        class="preview-control-btn edit-region-control"
        :title="tApp('management.showcasePreview.editors.replayTransition')"
        @click.stop.prevent="replay"
      >
        <RotateCcw class="preview-control-icon" aria-hidden="true" />
      </button>

      <button
        v-if="featuredPhoto"
        type="button"
        class="preview-control-btn edit-region-control"
        :title="tApp('management.showcasePreview.editors.adjustCrop')"
        @click.stop.prevent="editIntentCtx.requestEdit({ kind: 'featuredPhoto', focus: 'crop' })"
      >
        <Crop class="preview-control-icon" aria-hidden="true" />
      </button>
    </div>

    <!-- Everything inside the dolly pushes forward through the whole stage;
         the frame and copy below sit outside it so they stay pinned. -->
    <div class="stage-rush">
      <div class="stage-camera">
        <!-- Feature photo, revealed by the parting doors. It starts at full
             opacity and blown out, settling into exposure — the doors are the
             reveal, so fading the photo in underneath them would only read as
             a cross-dissolve. -->
        <div
          v-if="featureImageUrl"
          ref="photoContainerRef"
          class="photo-layer"
        >
          <div class="kenburns-frame">
            <img
              :src="featureImageUrl"
              :alt="eventTitle"
              class="feature-photo"
              :style="photoStyle"
              @load="onPhotoLoad"
            />
          </div>

          <!-- Over-exposure settling into a normal frame: a screen-blended warm
               wash plus a hot spot where the light came through the opening.
               Fading two overlays is far cheaper than animating `filter:
               brightness()` on a full-bleed image. -->
          <div class="exposure-wash" aria-hidden="true" />
          <div class="exposure-bloom" aria-hidden="true" />
          <div class="photo-scrim" :style="scrimStyle" aria-hidden="true" />
        </div>

        <!-- Light spilling out of the seam as the doors break apart: a wide
             blurred glow plus a hard bright line, both growing outward. Sits
             over the photo and under the door panels (the stage is rendered
             inside CoverStage below the door layer). -->
        <div class="seam-glow" aria-hidden="true" />
        <div class="seam-line" aria-hidden="true" />
      </div>
    </div>

    <!-- Drifting petals in the template's accent -->
    <div ref="petalFieldRef" class="petal-field" aria-hidden="true" />

    <!-- Printed border: mat, bevelled double rule, corner diamonds, and the
         travelling specular that gives the metal its depth. -->
    <div class="frame-layer" aria-hidden="true">
      <div class="frame-mat" />
      <div class="frame-rule" />
      <div class="frame-rule-inner" />
      <span class="frame-corner frame-corner-tl" />
      <span class="frame-corner frame-corner-tr" />
      <span class="frame-corner frame-corner-bl" />
      <span class="frame-corner frame-corner-br" />
      <div class="frame-sheen" />
      <div class="frame-sheen frame-sheen-slow" />
    </div>

    <!-- Cartouche -->
    <div class="copy-block">
      <div class="copy-rule copy-rule-top">
        <OrnamentRule :gold="gold" :gold-light="goldLight" />
      </div>

      <p class="copy-label gold-text">Save the Date</p>

      <p v-if="numericDate" class="copy-date gold-text">{{ numericDate }}</p>

      <p v-if="formattedDate" class="copy-date-long gold-text">{{ formattedDate }}</p>

      <div class="copy-rule copy-rule-bottom">
        <OrnamentRule :gold="gold" :gold-light="goldLight" />
      </div>
    </div>

    <div class="stage-vignette" aria-hidden="true" />

    <!-- The hand-off: light gathers at the date, swallows the frame, and the
         stage is faded out over the main content that mounts behind it. -->
    <div class="bloom-layer" aria-hidden="true">
      <div class="bloom-wash" />
      <div class="bloom-core" />
    </div>

    <!-- Manage-page preview: change-featured-photo affordance. The stage root
         is pointer-events:none (a pure animation on the live showcase), so
         these opt back in explicitly. -->
    <EditableRegion
      v-if="editIntentCtx && featureImageUrl"
      :intent="{ kind: 'featuredPhoto' }"
      class="featured-photo-edit-region"
    />
    <div v-else-if="editIntentCtx" class="featured-photo-empty">
      <button
        type="button"
        class="edit-region-control add-featured-photo-btn"
        @click.stop.prevent="editIntentCtx.requestEdit({ kind: 'featuredPhoto' })"
      >
        ＋ {{ tApp('management.showcasePreview.editors.addFeaturedPhoto') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { RotateCcw, Crop } from 'lucide-vue-next'
import type { EventPhoto } from '@/types/showcase'
import { EditIntentKey } from '@/components/showcase-preview/edit/editContext'
import { useFeaturedPhotoGeometry } from '@/composables/showcase/useFeaturedPhotoGeometry'
import { useFallingParticles } from '@/composables/showcase/useFallingParticles'
import { useAppLanguage } from '@/composables/useAppLanguage'
import EditableRegion from '@/components/showcase-preview/edit/EditableRegion.vue'
import OrnamentRule from './transition/OrnamentRule.vue'

interface Props {
  eventTitle: string
  eventPhotos?: EventPhoto[]
  eventStartDate?: string | null
  primaryColor: string
  accentColor: string
  backgroundColor?: string
  /** The template's `blur-effect` colour — every washed layer on this stage
   *  (plate, printed mat, cartouche scrim) is made of it. See effectColor.
   *  There are deliberately no font props — see --dt-display. */
  blurEffectColor?: string
  getMediaUrl: (url: string) => string
  /** Preview-only: hold at the fully-revealed state (frame drawn + cartouche
   *  wiped in) instead of blooming out and emitting transitionComplete.
   *  Never set on the live showcase. */
  freezeAtPeak?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  transitionComplete: []
}>()

// Only provided by the editable manage-page preview frame — undefined on the
// live showcase, so the featured-photo affordances can never leak there.
const editIntentCtx = inject(EditIntentKey, undefined)
const { t: tApp } = useAppLanguage()

// ---------------------------------------------------------------------------
// Choreography. This stage mounts with the cover's leaves, which swing over
// DOOR_OPEN_DURATION_MS (1.65s, cover/DoorPanel.vue) — every beat below is
// timed against that swing, at the reference artwork's own intervals:
//   0ms    - photo already there behind the leaves, blown out; the seam breaks
//   250ms  - exposure begins settling, finishing at 2600ms
//   1000ms - the top rule draws, while the leaves are still gathering away
//   1250ms - gold frame draws in
//   1500ms - cartouche wipes open: label → date → long date → bottom rule
//   1650ms - the leaves are fully off-frame
//   2700ms - gold sheen travels across the lettering
//   5700ms - the bloom gathers at the date and swallows the frame
//   6200ms - the bloom has just covered everything: transitionComplete, and
//            the parent's leave transition dissolves it over the main content
//            that mounts behind it at that moment
// The CSS delays below are the source of truth for the beats in between; only
// the two hand-off moments need to exist in JS. Retiming the swing means
// retiming all of them.
// ---------------------------------------------------------------------------
const BLOOM_START_MS = 5700
const COMPLETE_MS = 6200

const isRevealing = ref(false)
const isBlooming = ref(false)

let bloomTimer: ReturnType<typeof setTimeout> | null = null
let completeTimer: ReturnType<typeof setTimeout> | null = null

const featuredPhoto = computed(() => props.eventPhotos?.find((p) => p.is_featured) ?? null)

const featureImageUrl = computed(() =>
  featuredPhoto.value ? props.getMediaUrl(featuredPhoto.value.image) : null,
)

// Organizer-chosen crop, laid out in pixels against the live stage size.
const { photoContainerRef, photoStyle, onPhotoLoad } = useFeaturedPhotoGeometry(featuredPhoto)

// --- Palette ---------------------------------------------------------------
// "Gold" is whatever metal the template uses; the highlight is a near-white
// specular, which is what any polished metal's hotspot looks like regardless
// of its base hue.

/**
 * Force a template colour to `#rrggbb` so the `+ alpha` concatenation below is
 * always valid. Without this a non-hex value would silently make the scrim's
 * *transparent* stops opaque and bury the photo behind a solid block.
 */
const toHex6 = (color: string | null | undefined, fallback: string): string => {
  const value = (color ?? '').trim()
  if (/^#[0-9a-f]{6}$/i.test(value)) return value
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value)
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`
  return fallback
}

/** Hex + alpha concatenation, the showcase's convention for template colours. */
const alpha = (hex6: string, hex2: string) => `${hex6}${hex2}`

const gold = computed(() => toHex6(props.accentColor || props.primaryColor, '#e0b269'))
const goldLight = '#fff6de'

/**
 * The colour every washed layer on this stage is made of: the plate behind the
 * photo, the printed mat the gold border sits on, and the scrim that carries
 * the cartouche. That's the template's `blur-effect` slot — the same one the
 * decoration stage's mist band uses — not its background/primary, which is the
 * cover's colour rather than the colour of overlays laid *over* imagery.
 */
const effectColor = computed(() =>
  toHex6(props.blurEffectColor || props.backgroundColor || props.primaryColor, '#1a1410'),
)

/**
 * Whether the washed layers came out light. `blur-effect` defaults to white
 * upstream, so most templates land here — and the cartouche's shadow stack has
 * to follow: the deep black glow that gives the lettering weight on a dark
 * plate turns into a grey smudge on a pale one.
 */
const isLightEffect = computed(() => {
  const hex = effectColor.value
  const channel = (at: number) => parseInt(hex.slice(at, at + 2), 16) / 255
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5) > 0.6
})

const paletteStyle = computed<Record<string, string>>(() => ({
  '--dt-gold': gold.value,
  '--dt-gold-soft': alpha(gold.value, '9e'),
  '--dt-gold-glow': alpha(gold.value, '66'),
  '--dt-gold-light': goldLight,
  '--dt-effect': effectColor.value,
  '--dt-copy-shadow': isLightEffect.value
    ? 'drop-shadow(0 1px 1px rgba(92, 62, 20, 0.32)) drop-shadow(0 4px 12px rgba(120, 90, 40, 0.22))'
    : 'drop-shadow(0 2px 0 rgba(60, 34, 8, 0.45)) drop-shadow(0 10px 26px rgba(0, 0, 0, 0.8))',
}))

const scrimStyle = computed(() => {
  const c = effectColor.value
  // The lower stops carry the cartouche and stay strong either way. The top one
  // is depth only — at the weight a dark plate wants it, a pale one hazes over
  // the subject's face instead.
  const top = isLightEffect.value ? '40' : '8c'
  return {
    background: `linear-gradient(180deg, ${alpha(c, top)} 0%, ${alpha(c, '00')} 26%, ${alpha(c, '00')} 34%, ${alpha(c, 'b3')} 66%, ${alpha(c, 'f0')} 100%)`,
  }
})

const eventDate = computed(() => {
  if (!props.eventStartDate) return null
  const date = new Date(props.eventStartDate)
  return Number.isNaN(date.getTime()) ? null : date
})

/** The reference's cartouche form: day · month · year, the hero of the block. */
const numericDate = computed(() => {
  const date = eventDate.value
  if (!date) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())} · ${pad(date.getMonth() + 1)} · ${date.getFullYear()}`
})

const formattedDate = computed(() => {
  const date = eventDate.value
  if (!date) return null
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

// Petals drifting through the stage, in the template's accent. Sized from the
// reference's own 16–36 against a 1080-wide composition, i.e. 1.5–3.3% of the
// stage — as flecks catching the light, not as objects competing with the
// photograph. (The composable takes plain px and snapshots them, so these are
// fixed for a ~450px-wide stage rather than tracking --dt-w.)
const petalFieldRef = ref<HTMLElement>()
useFallingParticles(petalFieldRef, {
  type: 'petals',
  intensity: 'light',
  minSize: 7,
  maxSize: 16,
  color: () => gold.value,
})

const clearTimers = () => {
  if (bloomTimer) clearTimeout(bloomTimer)
  if (completeTimer) clearTimeout(completeTimer)
  bloomTimer = null
  completeTimer = null
}

const runRevealSequence = () => {
  isRevealing.value = true

  // Preview freeze: stop at the fully-drawn frame and cartouche
  if (props.freezeAtPeak) return

  bloomTimer = setTimeout(() => {
    isBlooming.value = true
  }, BLOOM_START_MS)

  completeTimer = setTimeout(() => {
    emit('transitionComplete')
  }, COMPLETE_MS)
}

onMounted(runRevealSequence)
onUnmounted(clearTimers)

// Manage-page preview only: replay the reveal from the start. The frame's
// inert click-shield normally sends a `replay` bridge command on any click
// when the stage isn't interactive — dropped here in favor of real clicks
// once editIntentCtx exists (needed for the featured-photo button above), so
// this button restores the same capability for editors.
const replay = async () => {
  clearTimers()
  isRevealing.value = false
  isBlooming.value = false
  await nextTick()
  runRevealSequence()
}
</script>

<style scoped>
.door-transition-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  background: var(--dt-effect);

  /* The stage's own width — `.showcase-container` is min(100vw, 56.25vh).
     Every measurement below is a fraction of it, taken straight from the
     reference artwork's 1080-wide composition (the comment on each is the
     original pixel value), so the frame and cartouche keep those proportions
     on any device.

     Not `vh`: the stage is 1080:1920 only where height is the constraint. On a
     390x844 phone it's 390 wide by 844 tall, so a vh-derived size lands ~20%
     large against the width — which is most of why the chrome reads heavy and
     crowds the photo. */
  --dt-w: min(100vw, 56.25vh);
}

/* ---------- Camera ---------- */

/* Two nested wrappers so the steady dolly and the bloom's forward rush are
   separate animations rather than one fighting the other's `forwards` fill. */
.stage-rush {
  position: absolute;
  inset: 0;
  z-index: 1;
}

/* Carries the camera's last leg, 1.3 → 1.62. Multiplies the dolly's own scale
   rather than replacing it, which is why the factor here is 1.246 and not
   1.62; the translate is likewise the residual that lands the composite where
   the reference's single transform does. */
.blooming .stage-rush {
  animation: cameraRush 550ms cubic-bezier(0.4, 0, 0.6, 1) forwards;
}

@keyframes cameraRush {
  to {
    transform: scale(1.246) translateY(-2.3%);
  }
}

.stage-camera {
  position: absolute;
  inset: 0;
  transform-origin: 50% 44%;
  will-change: transform;
}

/* The reference's camera is a four-point push, not one long creep: hard into
   the frame while the leaves are still swinging (1 → 1.18 by 1.7s), then a
   slow continued travel to 1.3, then the rush into the bloom above. Each leg
   eases in-out on its own — a single ease across the whole 5.7s flattens the
   arrival, which is the beat that sells the photo "landing".
   Percentages are the reference's px against its 1920 height. */
.revealing .stage-camera {
  animation: cameraDolly 5.7s linear forwards;
}

@keyframes cameraDolly {
  0% {
    transform: scale(1) translateY(0);
    animation-timing-function: cubic-bezier(0.37, 0, 0.63, 1);
  }
  29.8% {
    transform: scale(1.18) translateY(-0.73%);
    animation-timing-function: cubic-bezier(0.37, 0, 0.63, 1);
  }
  100% {
    transform: scale(1.3) translateY(-1.25%);
  }
}

/* ---------- Photo ---------- */

.photo-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

/* Ken Burns runs on its own wrapper so it composes with the dolly above — and
   deliberately counter-moves against it: the photo eases back and drifts left
   (1.12 → 0.98, 2.2% → -2.2%, the reference's own figures) while the camera
   pushes in. Two motions in opposite directions read as depth; matching them
   would just look like one bigger zoom.
   It dips below 1 late on, but the dolly is past 1.25 by then, so the
   composite never lets the photo's edge inside the frame. */
.kenburns-frame {
  position: absolute;
  inset: 0;
  transform: scale(1.12) translateX(2.2%);
  will-change: transform;
}

.revealing .kenburns-frame {
  animation: kenburnsDrift 6.25s cubic-bezier(0.37, 0, 0.63, 1) forwards;
}

@keyframes kenburnsDrift {
  from {
    transform: scale(1.12) translateX(2.2%);
  }
  to {
    transform: scale(0.98) translateX(-2.2%);
  }
}

/* Geometry (inset/left/top/width/height) is supplied inline by photoStyle —
   either the organizer's crop laid out in pixels, or a plain full-bleed cover
   while the sizes are still being measured. */
.feature-photo {
  position: absolute;
  display: block;
  object-fit: cover;
  /* Tailwind Preflight applies `img { max-width: 100%; height: auto }`. Cropping
     works by sizing the image *larger* than the viewport and offsetting it, so
     that cap would shrink the box while photoStyle's `left`/`top` still pointed
     at the full-size layout — sliding the photo off-frame. This opts out. */
  max-width: none;
  max-height: none;
  /* Floor: even a stale measurement can never letterbox the stage. */
  min-width: 100%;
  min-height: 100%;
}

.exposure-wash {
  position: absolute;
  inset: 0;
  background: #fff4dd;
  mix-blend-mode: screen;
  opacity: 0.92;
}

.revealing .exposure-wash {
  animation: exposureSettle 2.35s cubic-bezier(0.4, 0, 0.3, 1) 0.25s forwards;
}

@keyframes exposureSettle {
  to {
    opacity: 0;
  }
}

.exposure-bloom {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    80% 55% at 50% 42%,
    rgba(255, 246, 224, 0.95),
    rgba(255, 232, 186, 0.35) 70%,
    rgba(255, 226, 170, 0) 100%
  );
  opacity: 0.8;
}

.revealing .exposure-bloom {
  animation: exposureSettle 2.1s ease-out 0.2s forwards;
}

.photo-scrim {
  position: absolute;
  inset: 0;
}

/* ---------- Seam light ---------- */

/* A fixed-width band scaled horizontally rather than an animated `width`, so
   the whole break stays on the compositor. */
.seam-glow,
.seam-line {
  position: absolute;
  left: 50%;
  z-index: 2;
  transform: translateX(-50%) scaleX(0.05);
  opacity: 0;
  mix-blend-mode: screen;
  pointer-events: none;
}

.seam-glow {
  top: -6%;
  bottom: -6%;
  width: 110%;
  background: radial-gradient(
    50% 46% at 50% 50%,
    rgba(255, 248, 228, 0.95) 0%,
    rgba(255, 226, 168, 0.5) 42%,
    rgba(255, 214, 140, 0) 100%
  );
  filter: blur(26px);
}

.seam-line {
  top: 0;
  bottom: 0;
  width: 3.4%;
  background: linear-gradient(90deg, rgba(255, 240, 200, 0), #fffbef 50%, rgba(255, 240, 200, 0));
  filter: blur(4px);
}

.revealing .seam-glow {
  animation: seamBreakGlow 1.55s cubic-bezier(0.3, 0, 0.2, 1) forwards;
}

.revealing .seam-line {
  animation: seamBreakLine 1.35s cubic-bezier(0.3, 0, 0.2, 1) forwards;
}

@keyframes seamBreakGlow {
  0% {
    transform: translateX(-50%) scaleX(0.05);
    opacity: 0;
  }
  14% {
    opacity: 1;
  }
  55% {
    opacity: 0.85;
  }
  100% {
    transform: translateX(-50%) scaleX(1);
    opacity: 0;
  }
}

@keyframes seamBreakLine {
  0% {
    transform: translateX(-50%) scaleX(0.28);
    opacity: 0;
  }
  14% {
    opacity: 1;
  }
  55% {
    opacity: 0.85;
  }
  100% {
    transform: translateX(-50%) scaleX(1);
    opacity: 0;
  }
}

/* ---------- Petals ---------- */

.petal-field {
  position: absolute;
  inset: 0;
  z-index: 3;
  overflow: hidden;
  pointer-events: none;
  opacity: 0.7;
}

/* Drawn up into the light as the bloom gathers */
.blooming .petal-field {
  animation: petalLift 900ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes petalLift {
  to {
    transform: translateY(-22%) scale(1.14);
    opacity: 0;
  }
}

/* ---------- Printed frame ---------- */

.frame-layer {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  opacity: 0;
  --dt-inset: calc(var(--dt-w) * 0.0278); /* 30 — mat band */
  --dt-inner: calc(var(--dt-w) * 0.0426); /* 46 — inner hairline */
  --dt-corner: calc(var(--dt-w) * 0.0185); /* 20 — corner diamonds */
  /* The specular rides the band between these two. Only the INNER edge keeps
     the gleam off the photograph — a ring reaching past the hairline at 46 puts
     a moving highlight on the photo itself, which reads as a smear rather than
     as light on a printed border. The outer edge has no such job, so it sits at
     the stage's own edge: the mat band (0 → 30) is part of what the light falls
     across, exactly as the reference's cover plate lights its full border band.
     Held off the edge it lit the rules alone and left the mat flat behind them. */
  /* 0px, not 0: the polygon feeds this to calc(100% - …), and a unitless zero
     against a percentage is an invalid calc that voids the whole clip-path. */
  --dt-ring-outer: 0px;
  --dt-ring-inner: calc(var(--dt-w) * 0.0482); /* 52 */
}

.revealing .frame-layer {
  animation: frameDrawIn 1.05s cubic-bezier(0.22, 1, 0.36, 1) 1.25s forwards;
}

@keyframes frameDrawIn {
  from {
    opacity: 0;
    transform: scale(1.035);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.frame-mat {
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 0 var(--dt-inset) var(--dt-effect);
}

/* A hairline, not a band: 2px at the reference's 1080 is 0.19% of the stage —
   at a phone's width that rounds to one device pixel. */
.frame-rule {
  position: absolute;
  inset: var(--dt-inset);
  border: 1px solid var(--dt-gold);
  box-shadow:
    inset 0 0 0 1px rgba(255, 246, 222, 0.45),
    0 0 calc(var(--dt-w) * 0.024) var(--dt-gold-glow),
    inset 0 0 calc(var(--dt-w) * 0.0315) rgba(0, 0, 0, 0.35);
}

.frame-rule-inner {
  position: absolute;
  inset: var(--dt-inner);
  border: 1px solid var(--dt-gold-soft);
}

.frame-corner {
  position: absolute;
  width: var(--dt-corner);
  height: var(--dt-corner);
  margin: calc(var(--dt-corner) / -2) 0 0 calc(var(--dt-corner) / -2);
  transform: rotate(45deg);
  background: linear-gradient(135deg, var(--dt-gold-light), var(--dt-gold));
  box-shadow:
    0 0 calc(var(--dt-w) * 0.013) var(--dt-gold-glow),
    inset 0 0 0 1px rgba(255, 247, 225, 0.6);
}

.frame-corner-tl {
  left: var(--dt-inset);
  top: var(--dt-inset);
}

.frame-corner-tr {
  left: calc(100% - var(--dt-inset));
  top: var(--dt-inset);
}

.frame-corner-bl {
  left: var(--dt-inset);
  top: calc(100% - var(--dt-inset));
}

.frame-corner-br {
  left: calc(100% - var(--dt-inset));
  top: calc(100% - var(--dt-inset));
}

/* Travelling specular, clipped to the border ring so the highlight only ever
   rides the metal — the same shape the reference uses. */
.frame-sheen {
  position: absolute;
  inset: 0;
  mix-blend-mode: screen;
  background: linear-gradient(
    118deg,
    rgba(255, 236, 190, 0) 38%,
    rgba(255, 238, 198, 0.26) 46%,
    rgba(255, 253, 240, 0.92) 50%,
    rgba(255, 238, 198, 0.26) 54%,
    rgba(255, 236, 190, 0) 62%
  );
  background-size: 260% 100%;
  background-position: 150% 0;
  /* An annulus: the outer rectangle, then a reversed inner rectangle punching
     the hole. The hole is what keeps the highlight off the photograph. */
  clip-path: polygon(
    var(--dt-ring-outer) var(--dt-ring-outer),
    calc(100% - var(--dt-ring-outer)) var(--dt-ring-outer),
    calc(100% - var(--dt-ring-outer)) calc(100% - var(--dt-ring-outer)),
    var(--dt-ring-outer) calc(100% - var(--dt-ring-outer)),
    var(--dt-ring-outer) var(--dt-ring-outer),
    var(--dt-ring-inner) var(--dt-ring-inner),
    var(--dt-ring-inner) calc(100% - var(--dt-ring-inner)),
    calc(100% - var(--dt-ring-inner)) calc(100% - var(--dt-ring-inner)),
    calc(100% - var(--dt-ring-inner)) var(--dt-ring-inner),
    var(--dt-ring-inner) var(--dt-ring-inner)
  );
}

.frame-sheen-slow {
  opacity: 0.55;
  background-image: linear-gradient(
    58deg,
    rgba(255, 236, 190, 0) 42%,
    rgba(255, 246, 216, 0.7) 50%,
    rgba(255, 236, 190, 0) 58%
  );
}

.revealing .frame-sheen {
  animation: sheenTravel 4.2s linear 1.6s infinite;
}

.revealing .frame-sheen-slow {
  animation: sheenTravel 6.4s linear 2.1s infinite reverse;
}

@keyframes sheenTravel {
  from {
    background-position: 150% 0;
  }
  to {
    background-position: -80% 0;
  }
}

/* ---------- Cartouche ---------- */

.copy-block {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 10%;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(var(--dt-w) * 0.024); /* 26 */
  padding: 0 6%;
  text-align: center;
  filter: var(--dt-copy-shadow);

  /* The cartouche's face is fixed rather than template-driven, the same way its
     ornament rule is a fixed drawing and the decoration stage's own label is
     fixed to 'Great Vibes'. It's the reference artwork's typeface — a
     high-contrast display serif whose weight 600 still reads light, which is
     what carries the engraved look. A workaday template serif at the same
     weight comes out blunt. Already loaded app-wide at 400/500/600 (index.html),
     so this costs no extra request; Kantumruy Pro backs it for any Khmer. */
  font-family: 'Cormorant Garamond', 'Kantumruy Pro', Georgia, serif;
}

.blooming .copy-block {
  animation: copyBloomOut 900ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes copyBloomOut {
  to {
    transform: scale(1.22);
    opacity: 0;
  }
}

/* Both rules draw outward from the centre. Width is stage-relative rather than
   a percentage of this block so the block's own padding can't widen it — 440
   of the reference's 1080. */
.copy-rule {
  width: calc(var(--dt-w) * 0.407);
  transform: scaleX(0);
  opacity: 0;
}

.revealing .copy-rule-top {
  animation: ruleDraw 700ms cubic-bezier(0.22, 1, 0.36, 1) 1s forwards;
}

.revealing .copy-rule-bottom {
  animation: ruleDraw 800ms cubic-bezier(0.22, 1, 0.36, 1) 2.8s forwards;
}

@keyframes ruleDraw {
  to {
    transform: scaleX(1);
    opacity: 1;
  }
}

/* Every line arrives on a centre-out wipe, then the sheen below travels across
   it. Both animations are declared together per line: they run on the same
   element, so two `animation` shorthands would silently drop the first. The
   negative vertical inset keeps descenders and the drop-shadow outside the
   clip. */
.copy-label,
.copy-date,
.copy-date-long {
  margin: 0;
  clip-path: inset(-40% 50% -40% 50%);
}

.revealing .copy-label {
  animation:
    copyWipe 850ms cubic-bezier(0.33, 0, 0.15, 1) 1.5s forwards,
    goldSheen 2.3s ease-in-out 2.7s forwards;
}

.revealing .copy-date {
  animation:
    copyWipe 850ms cubic-bezier(0.33, 0, 0.15, 1) 2.05s forwards,
    goldSheen 2.3s ease-in-out 2.7s forwards;
}

.revealing .copy-date-long {
  animation:
    copyWipe 800ms cubic-bezier(0.33, 0, 0.15, 1) 2.5s forwards,
    goldSheen 2.3s ease-in-out 2.7s forwards;
}

@keyframes copyWipe {
  to {
    clip-path: inset(-40% -3% -40% -3%);
  }
}

/* Sizes, tracking and weights are the reference's own, as ratios of the stage
   width (its 50 / 104 / 38 against 1080). They're tuned for the display face
   set on .copy-block — its 600 is another face's 400. */
.copy-label {
  font-size: calc(var(--dt-w) * 0.0463);
  letter-spacing: 0.34em;
  /* The tracking is trailing-only, so the block reads off-centre without a
     matching lead indent. */
  padding-left: 0.34em;
  text-transform: uppercase;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
}

.copy-date {
  font-size: calc(var(--dt-w) * 0.0963);
  letter-spacing: 0.08em;
  font-weight: 600;
  line-height: 1.15;
  white-space: nowrap;
}

.copy-date-long {
  font-size: calc(var(--dt-w) * 0.0298);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-weight: 500;
  line-height: 1.6;
}

/* Polished metal: the lettering is a gold gradient clipped to the glyphs, with
   a near-white hotspot travelling across it once the block has settled. */
.gold-text {
  background-image: linear-gradient(
    100deg,
    var(--dt-gold) 0%,
    var(--dt-gold) 38%,
    var(--dt-gold-light) 47%,
    #fffdf4 50%,
    var(--dt-gold-light) 53%,
    var(--dt-gold) 62%,
    var(--dt-gold) 100%
  );
  background-size: 260% 100%;
  background-position: 150% 0;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}

@keyframes goldSheen {
  to {
    background-position: -60% 0;
  }
}

/* ---------- Vignette + bloom ---------- */

.stage-vignette {
  position: absolute;
  inset: 0;
  z-index: 6;
  pointer-events: none;
  background: radial-gradient(
    125% 92% at 50% 45%,
    rgba(0, 0, 0, 0) 52%,
    rgba(0, 0, 0, 0.35) 100%
  );
}

.bloom-layer {
  position: absolute;
  inset: 0;
  z-index: 7;
  pointer-events: none;
  opacity: 0;
}

.blooming .bloom-layer {
  opacity: 1;
}

.bloom-wash {
  position: absolute;
  inset: 0;
  opacity: 0;
  background: radial-gradient(
    78% 52% at 50% 70%,
    #fffef8 0%,
    #fff3da 40%,
    var(--dt-gold-light) 78%,
    var(--dt-gold) 100%
  );
}

.blooming .bloom-wash {
  animation: bloomWash 700ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes bloomWash {
  from {
    opacity: 0;
    transform: scale(1);
  }
  to {
    opacity: 1;
    transform: scale(1.18);
  }
}

.bloom-core {
  position: absolute;
  left: 50%;
  top: 70%;
  width: 150vh;
  height: 150vh;
  margin: -75vh 0 0 -75vh;
  mix-blend-mode: screen;
  opacity: 0;
  transform: scale(0.3);
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 238, 196, 0.55) 38%,
    rgba(255, 226, 168, 0) 70%
  );
}

.blooming .bloom-core {
  animation: bloomCore 850ms cubic-bezier(0.3, 0, 0.2, 1) forwards;
}

@keyframes bloomCore {
  from {
    opacity: 0;
    transform: scale(0.3);
  }
  40% {
    opacity: 1;
  }
  to {
    opacity: 1;
    transform: scale(1.5);
  }
}

/* ---------- Manage-page preview: featured-photo edit chrome ---------- */
/* The stage root is pointer-events:none (a pure animation on the live
   showcase) — these opt back into pointer-events explicitly. Rendered only
   when the edit-intent context exists, never in production. */

.preview-controls {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 11;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  pointer-events: none;
}

.preview-control-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  color: #1e90ff;
  background: rgba(255, 255, 255, 0.92);
  border: 1.5px dashed rgba(30, 144, 255, 0.6);
  border-radius: 9999px;
  box-shadow: 0 1px 6px rgba(15, 23, 42, 0.18);
  cursor: pointer;
  pointer-events: auto;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.preview-control-btn:hover {
  border-color: rgba(30, 144, 255, 0.95);
  background: #ffffff;
}

.preview-control-icon {
  width: 1.125rem;
  height: 1.125rem;
}

/* Overrides EditableRegion's default (relative, no intrinsic size) so the
   region fills the photo like the other image overlays instead of collapsing
   to 0x0. Stops above the cartouche so the copy stays readable in the preview. */
.featured-photo-edit-region {
  position: absolute;
  inset: 0 0 32% 0;
  z-index: 10;
  pointer-events: auto;
}

.featured-photo-empty {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.add-featured-photo-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25em;
  padding: 0.625rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  color: #1e90ff;
  background: rgba(255, 255, 255, 0.92);
  border: 1.5px dashed rgba(30, 144, 255, 0.6);
  border-radius: 9999px;
  box-shadow: 0 1px 6px rgba(15, 23, 42, 0.18);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.add-featured-photo-btn:hover {
  border-color: rgba(30, 144, 255, 0.95);
  background: #ffffff;
}

/* ---------- Reduced motion ---------- */

@media (prefers-reduced-motion: reduce) {
  .revealing .stage-camera,
  .revealing .kenburns-frame,
  .revealing .frame-sheen,
  .revealing .frame-sheen-slow,
  .blooming .stage-rush,
  .blooming .petal-field {
    animation: none;
  }

  .kenburns-frame {
    transform: scale(1);
  }

  .petal-field {
    display: none;
  }

  .revealing .seam-glow,
  .revealing .seam-line {
    animation-duration: 0.6s;
  }

  .revealing .exposure-wash,
  .revealing .exposure-bloom {
    animation-duration: 0.8s;
    animation-delay: 0s;
  }

  .revealing .frame-layer {
    animation-duration: 0.4s;
    animation-delay: 0.4s;
  }

  /* The wash stays — it's the hand-off to the main content, and a cross-fade
     of an edgeless gradient reads as light, not movement. The flare that grows
     out of it does not. */
  .bloom-core {
    display: none;
  }

  .revealing .copy-rule-top,
  .revealing .copy-rule-bottom {
    animation-duration: 0.4s;
    animation-delay: 0.6s;
  }

  /* Wipe only — the travelling sheen is dropped entirely rather than sped up */
  .revealing .copy-label,
  .revealing .copy-date,
  .revealing .copy-date-long {
    animation: copyWipe 0.4s ease 0.6s forwards;
  }
}
</style>
