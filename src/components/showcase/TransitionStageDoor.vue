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

          <!-- Over-exposure settling into a normal frame, as three fading
               overlays rather than an animated `filter:` on a full-bleed image.
               Between them they carry the reference's whole settle — colour
               floods back, the warm blow-out drains, and the hot spot where the
               light came through the opening closes. Order matches the
               reference's filter, which resolves before its overlays composite. -->
          <div class="exposure-desat" aria-hidden="true" />
          <div class="exposure-wash" aria-hidden="true" />
          <div class="exposure-bloom" aria-hidden="true" />
          <div class="photo-scrim" aria-hidden="true" />
        </div>

        <!-- Light spilling out of the seam as the doors break apart: a wide
             blurred glow plus a hard bright line, both growing outward. Sits
             over the photo and under the door panels (the stage is rendered
             inside CoverStage below the door layer). -->
        <div class="seam-glow" aria-hidden="true" />
        <div class="seam-line" aria-hidden="true" />
      </div>
    </div>

    <!-- The template's falling effect, drifting through the stage. Its own
         instance rather than the shared one CoverStage owns: this stage's
         photo covers the screen and would occlude that field, so CoverStage
         fades it out over the door swing (transitionOwnsFallingField) and
         this one takes over. Same template config, so the shape/colour never
         changes across the hand-off — whatever the organizer chose on the
         cover keeps falling here. -->
    <FallingEffect
      :key="fallingEffectKey"
      class="particle-field"
      :config="fallingEffect"
      :primary-color="primaryColor"
      :accent-color="accentColor"
      :get-media-url="getMediaUrl"
      :z-index="3"
      :min-size="9"
      :max-size="20"
    />

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
      <div class="frame-shade" />
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
import { fallingEffectKeyOf } from '@/composables/showcase/useFallingParticles'
import { useAppLanguage } from '@/composables/useAppLanguage'
import EditableRegion from '@/components/showcase-preview/edit/EditableRegion.vue'
import FallingEffect from './FallingEffect.vue'
import type { FallingEffectConfig } from '@/services/api/types/template.types'
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
  /** Falling particle effect config from template_assets. */
  fallingEffect?: FallingEffectConfig | null
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

/**
 * The same two beats for a guest who asked for reduced motion.
 *
 * Their CSS block at the bottom of this file resolves every reveal by roughly
 * one second — exposure 0.8s, frame draw 0.4s after a 0.4s delay, cartouche
 * wipe 0.4s after 0.6s — and then removes everything that was still moving
 * afterwards: the dolly, the ken burns, the travelling sheen, the particles.
 * On the full timeline that left them looking at a finished, completely static
 * frame for four and a half seconds before anything else happened. Reduced
 * motion is meant to be gentler, not longer. Hold just long enough to read the
 * date, then hand off, keeping the same 500ms gap between the two beats — that
 * gap is the bloom's cover, and the bloom is what the main content mounts
 * behind.
 */
const REDUCED_BLOOM_START_MS = 1600
const REDUCED_COMPLETE_MS = 2100

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

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
 * The colour the stage's printed chrome is made of: the plate behind the photo
 * and the mat the gold border sits on. That's the template's `blur-effect`
 * slot — the same one the decoration stage's mist band uses — not its
 * background/primary, which is the cover's colour rather than the colour of
 * overlays laid *over* imagery.
 *
 * The photo scrim used to be made of it too and no longer is; see .photo-scrim
 * for why a branded wash over a photograph is the wrong instrument.
 */
const effectColor = computed(() =>
  toHex6(props.blurEffectColor || props.backgroundColor || props.primaryColor, '#1a1410'),
)

/**
 * Whether the printed chrome came out light — `blur-effect` defaults to white
 * upstream, so most templates land here. The frame's shading has to follow: the
 * near-black red that multiplies to a rich shadow on a deep mat turns into a
 * dirty stain on a pale one.
 *
 * Note this no longer governs the cartouche's shadow stack. That copy sits on
 * the photo scrim, which is near-black on every template now, so its ground is
 * fixed regardless of what this returns.
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
  // Shadow half of the frame's lighting model (see .frame-shade). The
  // reference's near-black red multiplies to a rich shadow on its maroon
  // plate, but `blur-effect` defaults to white upstream — most templates land
  // pale, where that same wash multiplies into a dirty red stain. The light
  // branch trades it for a warm graphite at half the weight, the same split
  // --dt-copy-shadow makes below.
  '--dt-frame-shade': isLightEffect.value
    ? 'linear-gradient(158deg, rgba(116, 92, 58, 0) 38%, rgba(104, 80, 46, 0.2) 100%)'
    : 'linear-gradient(158deg, rgba(40, 6, 6, 0) 38%, rgba(38, 5, 5, 0.42) 100%)',
  // Unconditional now that the cartouche's ground is the near-black photo
  // scrim rather than the blur-effect plate. It used to soften on pale
  // templates because the copy sat on a pale wash; on the scrim that branch
  // would hand a near-black ground the shadow stack meant for a light one,
  // costing the lettering the weight that reads as engraved.
  '--dt-copy-shadow':
    'drop-shadow(0 2px 0 rgba(60, 34, 8, 0.45)) drop-shadow(0 10px 26px rgba(0, 0, 0, 0.8))',
}))

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

// The 9–20px handed to <FallingEffect> above. Sized from the reference's own
// 16–36 against a 1080-wide composition, i.e. 1.5–3.3% of the stage — the
// effect belongs here as flecks catching the light, not as objects competing
// with the photograph. Each type's own sizeScale (~0.65–0.85) then lands them
// around 6–17px rendered. (The composable takes plain px and snapshots them,
// so these are fixed for a ~450px-wide stage rather than tracking --dt-w.)
const fallingEffectKey = computed(() => fallingEffectKeyOf(props.fallingEffect))

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

  // Read per run, not once at module load: a guest can change the setting
  // between visits, and the preview frame re-runs this on replay.
  const reduced = prefersReducedMotion()

  bloomTimer = setTimeout(
    () => {
      isBlooming.value = true
    },
    reduced ? REDUCED_BLOOM_START_MS : BLOOM_START_MS,
  )

  completeTimer = setTimeout(
    () => {
      emit('transitionComplete')
    },
    reduced ? REDUCED_COMPLETE_MS : COMPLETE_MS,
  )
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
  /* `dvh` for the same reason `.showcase-container` uses it: `vh` is the
     chrome-hidden height, so with the URL bar up this over-measured the stage. */
  --dt-w: min(100vw, 56.25dvh);
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

/* The reference's `saturate(1 - over * 0.5)`: its photo opens near-colourless
   and floods back as the exposure settles. The warm wash below reproduces the
   brightness lift and, by raising the blacks, the contrast drop — but a screen
   blend can't drain colour, so without this the settle was missing a third of
   itself. A grey plate blended on `saturation` takes its own saturation (zero)
   with the backdrop's hue and luminosity, so fading it from 0.5 rides the same
   curve the filter would, and stays off the compositor's slow path. */
.exposure-desat {
  position: absolute;
  inset: 0;
  background: #808080;
  mix-blend-mode: saturation;
  opacity: 0.5;
}

.revealing .exposure-desat {
  animation: exposureSettle 2.35s cubic-bezier(0.4, 0, 0.3, 1) 0.25s forwards;
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

/* The wash over the photograph, and the one layer on this stage that is NOT
   made of the template's blur-effect colour — these are the reference's own
   values. A scrim tints everything beneath it, so a branded one drains the
   photograph's colour rather than seating it, and `blur-effect` defaults to
   white upstream, which hazed the image over instead of lifting it. Near-black
   leaves the photo its own colour and gives the gold cartouche below the
   darkest ground to read against. Warm rather than neutral so the shadows stay
   in the same family as the gold. */
.photo-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(50, 8, 8, 0.58) 0%,
    rgba(0, 0, 0, 0) 24%,
    rgba(0, 0, 0, 0) 30%,
    rgba(38, 5, 5, 0.72) 64%,
    rgba(24, 3, 3, 0.94) 100%
  );
}

/* ---------- Seam light ---------- */

/* A fixed-width band scaled horizontally rather than an animated `width`, so
   the whole break stays on the compositor.
   `will-change` matters more here than the usual hint: both of these carry a
   `filter: blur()`, and a blurred element whose transform animates is
   re-rasterized at each new scale unless it is promoted — a full-screen 26px
   blur redrawn every frame, over the same second and a half the cover's doors
   are swinging. Promoted, the blur is rastered once and the compositor scales
   the result. */
.seam-glow,
.seam-line {
  position: absolute;
  left: 50%;
  z-index: 2;
  transform: translateX(-50%) scaleX(0.05);
  opacity: 0;
  mix-blend-mode: screen;
  pointer-events: none;
  will-change: transform, opacity;
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

/* ---------- Falling particles ---------- */

/* Position/overflow/pointer-events come from FallingEffect's own root classes;
   the stacking order comes from its :z-index prop, which it applies inline and
   would win over anything set here. */
.particle-field {
  opacity: 0.7;
}

/* Drawn up into the light as the bloom gathers */
.blooming .particle-field {
  animation: particleLift 900ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes particleLift {
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
  /* The lighting layers ride the band between these two and nothing beyond it,
     at either end. Past the inner hairline (46) a moving highlight lands on the
     photograph and reads as a smear; run out to the stage edge instead and it
     lights the mat's outer margin, which spreads the gleam over dead space and
     costs the frame its definition. Keeping both edges tight is what makes it
     read as light on the frame itself. */
  --dt-ring-outer: calc(var(--dt-w) * 0.0222); /* 24 */
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

/* The frame's two lighting layers, on one shared annulus so the shadow and the
   highlight stay registered as light on a single surface. The clip is an outer
   rectangle with a reversed inner rectangle punching the hole; the hole is what
   keeps both of them off the photograph. */
.frame-shade,
.frame-sheen {
  position: absolute;
  inset: 0;
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

/* Fixed shadow raking down the lower-right of the band. This is what makes the
   border read as a raised, lit surface instead of flat print — the specular
   alone gives brightness with no side for the light to be coming from. Sits
   under the sheen so the travelling highlight still blows through it. */
.frame-shade {
  mix-blend-mode: multiply;
  background: var(--dt-frame-shade);
}

/* Travelling specular, riding the same band as the shade above. */
.frame-sheen {
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

/* The wash has a job beyond looking like light: it has to be opaque by the
   time `transitionComplete` fires 500ms in, because that is the frame the main
   content mounts behind it. Material's standard ease-in-out spent its slow half
   exactly where coverage was needed, reaching ~95% at the hand-off and leaving
   a thin window for the mount to show through. A strong ease-out front-loads
   the same 700ms and is ~99.6% covered at 500ms — and an entering element wants
   ease-out regardless. */
.blooming .bloom-wash {
  animation: bloomWash 700ms cubic-bezier(0.23, 1, 0.32, 1) forwards;
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
  .blooming .particle-field {
    animation: none;
  }

  .kenburns-frame {
    transform: scale(1);
  }

  .particle-field {
    display: none;
  }

  .revealing .seam-glow,
  .revealing .seam-line {
    animation-duration: 0.6s;
  }

  /* Shortened, never disabled: these resolve TO zero, so killing the animation
     would strand the photo blown out and colourless. */
  .revealing .exposure-desat,
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
