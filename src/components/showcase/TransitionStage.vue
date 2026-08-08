<template>
  <div class="transition-stage" :class="{ 'stage-fade-out': isStageFadingOut }">
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

      <!-- Re-frame the photo that's already featured. Separate from the
           whole-photo region below (which swaps which photo is used) — the crop
           UI itself can't live in here: this frame is a 390x844 iframe scaled
           down, so dragging a crop box at that size would be guesswork. -->
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

    <!-- Feature Image: fills the viewport with a slow Ken Burns drift.
         Geometry comes from the organizer's stored crop rectangle (photoStyle),
         which lays the image out so the chosen region fills the viewport. With
         no stored crop that resolves to the whole image, i.e. exactly the
         plain centre `cover` this stage has always used. -->
    <div
      v-if="featureImageUrl"
      ref="photoContainerRef"
      class="couple-photo-container"
      :class="{ 'show': isCouplePhotoVisible }"
    >
      <div class="kenburns-frame">
        <img
          :src="featureImageUrl"
          :alt="eventTitle"
          class="couple-photo"
          :style="photoStyle"
          @load="onPhotoLoad"
        />
        <!-- Veil copy: identical image, pre-blurred and bright; fades away to
             "lift the veil". Its 4%-larger scale (which hides the blur's
             translucent edge bleed) lives on this wrapper rather than on the
             img, so it scales about the *viewport* centre — on the img it
             would scale about the cropped image's own centre, which sits
             off-screen and would slide the veil out of register with the
             sharp copy beneath it. -->
        <div class="veil-frame">
          <img
            :src="featureImageUrl"
            alt=""
            aria-hidden="true"
            class="couple-photo couple-photo-veil"
            :style="photoStyle"
          />
        </div>
      </div>

      <!-- One-time soft light sweep across the photo after it sharpens -->
      <div class="light-sweep" />

      <!-- Cinematic vignette hugging the edges -->
      <div class="photo-vignette" />

      <!-- Manage-page preview: change-featured-photo affordance, covering the
           whole photo like other image edit regions (dashed outline + corner
           badge, hover-only). The stage root is pointer-events:none (it's
           just an animation on the live showcase), so this opts back in
           explicitly via edit-region-control. -->
      <EditableRegion
        v-if="editIntentCtx"
        :intent="{ kind: 'featuredPhoto' }"
        class="featured-photo-edit-region"
      />
    </div>

    <!-- Manage-page preview: no featured photo set yet — same affordance,
         centered where the photo would be. -->
    <div v-else-if="editIntentCtx" class="featured-photo-empty">
      <button
        type="button"
        class="edit-region-control add-featured-photo-btn"
        @click.stop.prevent="editIntentCtx.requestEdit({ kind: 'featuredPhoto' })"
      >
        ＋ {{ tApp('management.showcasePreview.editors.addFeaturedPhoto') }}
      </button>
    </div>

    <!-- Floating bokeh particles in template accent color -->
    <div
      class="bokeh-field"
      :class="{ 'show': isCouplePhotoVisible }"
      :style="{ '--bokeh-accent': bokehAccentColor }"
      aria-hidden="true"
    >
      <span
        v-for="particle in bokehParticles"
        :key="particle.id"
        class="bokeh"
        :style="particle.style"
      />
    </div>

    <!-- Footer scrim. Split out of .cloud-footer so the falling field can sit
         between the two: the mist is blur-effect colour at up to 90% alpha, so
         anything behind it is washed to that colour — which is exactly what
         petals must not be. -->
    <div class="cloud-scrim" :class="{ 'show': isContentVisible }" aria-hidden="true">
      <!-- Soft blur band, lighter than before so the photo stays present -->
      <div class="cloud-blur-layer" />
      <!-- Gradient mist for text legibility -->
      <div class="cloud-mist-layer" />
    </div>

    <!-- The showcase-wide falling field lives inside CoverStage, and this stage
         is a sibling rendering *above* CoverStage entirely (z-35), so nothing
         in there can paint over this one — the shared field can't carry through
         and this stage runs its own.

         What keeps that from reading as two fields: this one rides exactly the
         photo's opacity ramp. The photo is what occludes the shared field, so
         as it fades in and takes the shared petals away, these fade in at the
         same rate to replace them — and on the way out the reverse. Un-ramped,
         both fields drew at full strength for the ~2.4s before the photo goes
         opaque and the ~1.2s while it dissolves, at visibly doubled density.

         Layered above the photo, the bokeh and the scrim so the petals keep
         their template colour, below the save-the-date copy — the same order
         the cover uses. -->
    <FallingEffect
      :key="fallingEffectKey"
      class="transition-petals"
      :class="{ show: isCouplePhotoVisible }"
      :config="fallingEffect"
      :primary-color="primaryColor"
      :accent-color="accentColor"
      :get-media-url="getMediaUrl"
      :z-index="6"
    />

    <!-- Save the date -->
    <div class="cloud-footer" :class="{ 'show': isContentVisible }">
      <div class="save-the-date-container">
        <!-- Fine line drawing outward from center -->
        <div class="reveal-line" :style="{ background: revealLineGradient }" />

        <!-- "Save the Date" blooms in letter by letter -->
        <p class="save-the-date-label" :style="{ color: saveDateTextColor }">
          <span
            v-for="(char, i) in saveTheDateChars"
            :key="i"
            class="std-char"
            :style="{ animationDelay: `${i * 65}ms` }"
            >{{ char === ' ' ? ' ' : char }}</span
          >
        </p>

        <p
          v-if="formattedDate"
          class="event-date"
          :style="{
            fontFamily: primaryFont || currentFont,
            color: dateTextColor,
          }"
        >
          {{ formattedDate }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, inject } from 'vue'
import { RotateCcw, Crop } from 'lucide-vue-next'
import type { EventPhoto } from '@/types/showcase'
import { EditIntentKey } from '@/components/showcase-preview/edit/editContext'
import { useFeaturedPhotoGeometry } from '@/composables/showcase/useFeaturedPhotoGeometry'
import { useAppLanguage } from '@/composables/useAppLanguage'
import EditableRegion from '@/components/showcase-preview/edit/EditableRegion.vue'
import FallingEffect from './FallingEffect.vue'
import type { FallingEffectConfig } from '@/services/api/types/template.types'

interface Props {
  eventTitle: string
  eventLogo?: string | null
  eventPhotos?: EventPhoto[]
  eventStartDate?: string | null
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  backgroundColor?: string
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  getMediaUrl: (url: string) => string
  /** Falling particle effect config from template_assets. */
  fallingEffect?: FallingEffectConfig | null
  /** Preview-only: hold at the fully-revealed state (photo sharp + "Save the
   *  Date" bloomed) instead of fading out and emitting transitionComplete.
   *  Never set on the live showcase. */
  freezeAtPeak?: boolean
}

const props = defineProps<Props>()

// Remount on a config change — see the matching note in CoverStage.vue for why
// the key covers the effect's own fields but deliberately not the palette.
const fallingEffectKey = computed(() => {
  const config = props.fallingEffect
  if (!config) return 'none'
  return [
    config.type,
    config.intensity ?? 'normal',
    config.color_source ?? 'primary',
    config.custom_color ?? '',
    config.custom_image ?? '',
  ].join('|')
})

const emit = defineEmits<{
  transitionComplete: []
}>()

// Only provided by the editable manage-page preview frame — undefined on the
// live showcase, so the featured-photo affordances can never leak there.
const editIntentCtx = inject(EditIntentKey, undefined)
const { t: tApp } = useAppLanguage()

const isContentVisible = ref(false)
const isCouplePhotoVisible = ref(false)
const isStageFadingOut = ref(false)

let fadeInTimer: ReturnType<typeof setTimeout> | null = null
let couplePhotoTimer: ReturnType<typeof setTimeout> | null = null
let fadeOutTimer: ReturnType<typeof setTimeout> | null = null
let completeTimer: ReturnType<typeof setTimeout> | null = null

const featuredPhoto = computed(() => props.eventPhotos?.find((p) => p.is_featured) ?? null)

const featureImageUrl = computed(() =>
  featuredPhoto.value ? props.getMediaUrl(featuredPhoto.value.image) : null,
)

// Organizer-chosen crop, laid out in pixels against the live stage size.
const { photoContainerRef, photoStyle, onPhotoLoad } = useFeaturedPhotoGeometry(featuredPhoto)

const flourishColor = computed(() => props.accentColor || props.primaryColor || '#b08d57')

const revealLineGradient = computed(
  () =>
    `linear-gradient(to right, transparent 0%, ${flourishColor.value} 25%, ${flourishColor.value} 75%, transparent 100%)`,
)

// The save-the-date block reads as one unit with the flourish line above it, so
// it takes the same accent slot. On primary it collided with the mist scrim
// behind it — templates commonly point `primary` and `blur-effect` at the same
// deep colour, which left the copy near-invisible against its own backdrop.
const saveDateTextColor = flourishColor

const dateTextColor = flourishColor

const saveTheDateChars = computed(() => 'Save the Date'.split(''))

// Drifting bokeh sparkles: randomized once per mount so each viewing feels organic
interface BokehParticle {
  id: number
  style: Record<string, string>
}

const bokehParticles = ref<BokehParticle[]>([])

// Only the randomized geometry is frozen at reveal time — the colour is left to
// a CSS var set on the field so it stays live. The manage-page preview can swap
// the template underneath an already-revealed stage (trying one on from the
// Templates modal), and baking the accent into each particle at generate time
// left the sparkles glowing in the previous template's colour until remount.
const bokehAccentColor = computed(() => props.accentColor || props.primaryColor || '#ffffff')

const generateBokeh = () => {
  const particles: BokehParticle[] = []
  const count = 14
  for (let i = 0; i < count; i++) {
    const size = 4 + Math.random() * 10
    particles.push({
      id: i,
      style: {
        '--bokeh-color': i % 3 === 0 ? '#ffffff' : 'var(--bokeh-accent)',
        left: `${Math.random() * 100}%`,
        bottom: `${-5 + Math.random() * 55}%`,
        width: `${size}px`,
        height: `${size}px`,
        '--drift-x': `${-30 + Math.random() * 60}px`,
        '--float-duration': `${7 + Math.random() * 7}s`,
        animationDelay: `${Math.random() * 4}s`,
        opacity: `${0.25 + Math.random() * 0.4}`,
      },
    })
  }
  bokehParticles.value = particles
}

const formattedDate = computed(() => {
  if (!props.eventStartDate) return null
  try {
    const date = new Date(props.eventStartDate)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return null
  }
})

// Animation timeline (this stage backs the `decoration` animation type; door
// templates get TransitionStageDoor.vue instead):
//   0ms    - TransitionStage mounts (cover decorations animating out)
//   1000ms - Photo starts: veil-blurred + bright, sharpening over ~2.4s while Ken Burns drifts
//   1800ms - Footer scrim rises; line draws; "Save the Date" blooms letter by letter; date tracks in
//   ~3400ms- Light sweep passes across the sharpened photo
//   5800ms - Everything starts fading out
//   7000ms - Fully faded out → emit transitionComplete
const clearTimers = () => {
  if (fadeInTimer) clearTimeout(fadeInTimer)
  if (couplePhotoTimer) clearTimeout(couplePhotoTimer)
  if (fadeOutTimer) clearTimeout(fadeOutTimer)
  if (completeTimer) clearTimeout(completeTimer)
  fadeInTimer = null
  couplePhotoTimer = null
  fadeOutTimer = null
  completeTimer = null
}

const runRevealSequence = () => {
  generateBokeh()

  // Photo appears first, once the cover decorations have slid out
  couplePhotoTimer = setTimeout(() => {
    isCouplePhotoVisible.value = true
  }, 1000)

  // Footer scrim with text
  fadeInTimer = setTimeout(() => {
    isContentVisible.value = true
  }, 1800)

  // Preview freeze: stop here — photo and text stay at full reveal
  if (props.freezeAtPeak) return

  // Start fading out
  fadeOutTimer = setTimeout(() => {
    isStageFadingOut.value = true
  }, 5800)

  // Emit completion after fade-out finishes
  completeTimer = setTimeout(() => {
    emit('transitionComplete')
  }, 7000)
}

onMounted(runRevealSequence)

onUnmounted(clearTimers)

// Manage-page preview only: replay the reveal from the start. The frame's
// inert click-shield normally sends a `replay` bridge command on any click
// when the stage isn't interactive — dropped here in favor of real clicks
// once editIntentCtx exists (needed for the featured-photo button below), so
// this button restores the same capability for editors.
const replay = async () => {
  clearTimers()
  isCouplePhotoVisible.value = false
  isContentVisible.value = false
  isStageFadingOut.value = false
  await nextTick()
  runRevealSequence()
}
</script>

<style scoped>
.transition-stage {
  position: absolute;
  inset: 0;
  z-index: 35;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  overflow: hidden;
  pointer-events: none;
}

/* ---------- Photo: veil reveal + Ken Burns ---------- */

.couple-photo-container {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 1.4s ease-out;
  z-index: 1;
}

.couple-photo-container.show {
  opacity: 1;
}

.stage-fade-out .couple-photo-container {
  opacity: 0;
  transition: opacity 1.2s ease-out;
}

/* Ken Burns drift runs on a wrapper so it composes with the container's opacity fade */
.kenburns-frame {
  position: absolute;
  inset: 0;
  transform: scale(1.14);
  will-change: transform;
}

.show .kenburns-frame {
  animation: kenburns 9s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
}

@keyframes kenburns {
  from {
    transform: scale(1.14) translateY(0.6%);
  }
  to {
    transform: scale(1.02) translateY(-0.6%);
  }
}

/* Geometry (inset/left/top/width/height) is supplied inline by photoStyle —
   either the organizer's crop laid out in pixels, or a plain full-bleed cover
   while the sizes are still being measured. */
.couple-photo {
  position: absolute;
  display: block;
  object-fit: cover;
  /* Tailwind Preflight applies `img { max-width: 100%; height: auto }`. Cropping
     works by sizing the image *larger* than the viewport and offsetting it, so
     that cap would shrink the box while photoStyle's `left`/`top` still pointed
     at the full-size layout — sliding the photo off-frame and leaving the stage
     mostly empty. This opts out. */
  max-width: none;
  max-height: none;
  /* Floor: even if a measurement is stale or wrong, the photo can never be
     smaller than the stage, so the transition can't letterbox. `cover` keeps it
     undistorted either way. */
  min-width: 100%;
  min-height: 100%;
}

.veil-frame {
  position: absolute;
  inset: 0;
  overflow: hidden;
  transform: scale(1.04); /* hide the blur's translucent edge bleed */
}

/* Veil copy: pre-blurred and luminous, stacked on the sharp photo.
   Fading its opacity (cheap) reads as the photo sharpening (a blur()
   transition on a fullscreen image would be far more expensive).

   Masked so it lies thin over the upper frame and full over the lower. The
   hosts' faces sit high in a portrait crop, and an even veil spent its whole
   fade blurring exactly the part of the photo people are trying to read — the
   faces only resolved once the entire veil had gone. Weighted this way they
   are legible from the first frame and the reveal still runs, reading as mist
   lifting off the bottom of the frame rather than a sheet coming off the lot.
   The fade is shorter for the same reason: it used to finish at 3400ms against
   a stage that starts dissolving at 5800ms, leaving the photo truly sharp for
   2.4s of its 7s life. */
.couple-photo-veil {
  filter: blur(16px) brightness(1.18) saturate(0.92);
  opacity: 1;
  transition: opacity 1.8s ease-in-out;
  mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.25) 0%,
    rgba(0, 0, 0, 0.6) 42%,
    #000 78%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.25) 0%,
    rgba(0, 0, 0, 0.6) 42%,
    #000 78%
  );
}

.show .couple-photo-veil {
  opacity: 0;
}

/* One-time soft sheen sweeping diagonally across after the veil lifts */
.light-sweep {
  position: absolute;
  inset: -20%;
  z-index: 2;
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(255, 255, 255, 0.18) 48%,
    rgba(255, 255, 255, 0.32) 50%,
    rgba(255, 255, 255, 0.18) 52%,
    transparent 60%
  );
  transform: translateX(-100%);
  opacity: 0;
}

.show .light-sweep {
  animation: lightSweep 2.6s ease-in-out 2.4s 1 forwards;
}

@keyframes lightSweep {
  0% {
    transform: translateX(-100%);
    opacity: 1;
  }
  100% {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* Cinematic vignette: draws the eye to the couple */
.photo-vignette {
  position: absolute;
  inset: 0;
  z-index: 3;
  background: radial-gradient(
    ellipse 130% 110% at center 42%,
    transparent 55%,
    rgba(0, 0, 0, 0.12) 78%,
    rgba(0, 0, 0, 0.32) 100%
  );
  opacity: 0;
  transition: opacity 2.2s ease-in-out 0.8s;
}

.show .photo-vignette {
  opacity: 1;
}

/* ---------- Manage-page preview: featured-photo edit chrome ---------- */
/* The stage root is pointer-events:none (a pure animation on the live
   showcase) — these opt back into pointer-events explicitly. Rendered only
   when the edit-intent context exists, never in production. */

.preview-controls {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
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
   empty-slot region fills the photo like the other overlays instead of
   collapsing to 0x0 — its dashed outline + corner badge then read as "hover
   the photo to edit it", matching every other image edit region in the app. */
.featured-photo-edit-region {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: auto;
}

.featured-photo-empty {
  position: absolute;
  inset: 0;
  z-index: 1;
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

/* ---------- Bokeh particles ---------- */

.bokeh-field {
  position: absolute;
  inset: 0;
  z-index: 4;
  opacity: 0;
  transition: opacity 2s ease-in-out 1s;
}

.bokeh-field.show {
  opacity: 1;
}

.stage-fade-out .bokeh-field {
  opacity: 0;
  transition: opacity 1s ease-out;
}

.bokeh {
  position: absolute;
  border-radius: 50%;
  background: var(--bokeh-color);
  filter: blur(2px);
  box-shadow: 0 0 8px var(--bokeh-color);
  animation: bokehFloat var(--float-duration) ease-in-out infinite;
}

@keyframes bokehFloat {
  0% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(calc(var(--drift-x) * 0.6), -45vh);
  }
  100% {
    transform: translate(var(--drift-x), -90vh);
  }
}

/* Handoff ramp from the shared CoverStage field — deliberately the same
   durations and easings as .couple-photo-container, since that photo is what
   hides the shared field. Scoped styles reach this element because a child
   component's root inherits the parent's scope id. */
.transition-petals {
  opacity: 0;
  transition: opacity 1.4s ease-out;
}

.transition-petals.show {
  opacity: 1;
}

.stage-fade-out .transition-petals {
  opacity: 0;
  transition: opacity 1.2s ease-out;
}

/* ---------- Footer scrim + text ---------- */

/* Scrim band and copy share one box and one reveal, but sit either side of the
   falling field: scrim below it (5), copy above it (7). */
.cloud-scrim,
.cloud-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 38vh;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 1.6s ease-in-out, transform 1.6s ease-in-out;
  will-change: opacity, transform;
}

.cloud-scrim {
  z-index: 5;
}

.cloud-footer {
  z-index: 7;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 8vh;
}

.cloud-scrim.show,
.cloud-footer.show {
  opacity: 1;
  transform: translateY(0);
}

.stage-fade-out .cloud-scrim,
.stage-fade-out .cloud-footer {
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 1.2s ease-in-out, transform 1.2s ease-in-out;
}

/* Lighter frosted band than before so the photo remains present behind the text */
.cloud-blur-layer {
  position: absolute;
  inset: 0;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  mask-image: linear-gradient(to bottom, transparent 0%, black 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 100%);
  will-change: transform;
  transform: translateZ(0);
}

/* Near-black warm, not the template's blur-effect slot. A scrim tints whatever
   it covers, so a branded one drains the photograph instead of seating it —
   and `blur-effect` defaults to white upstream, which hazed the image over.
   Worse, templates commonly point `blur-effect` and `primary` at the same deep
   colour, which left the save-the-date copy painting itself onto its own
   backdrop. Darkening progressively toward the base (the reference's own
   rgb(50,8,8) → rgb(38,5,5) → rgb(24,3,3)) gives the gold copy the darkest
   ground where it actually sits. Density ramp is this stage's own, tuned to
   the band's 38vh rather than the reference's full-height gradient. */
.cloud-mist-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    rgba(50, 8, 8, 0) 0%,
    rgba(50, 8, 8, 0.3) 35%,
    rgba(38, 5, 5, 0.6) 60%,
    rgba(32, 4, 4, 0.8) 80%,
    rgba(24, 3, 3, 0.94) 100%
  );
}

.save-the-date-container {
  position: relative;
  z-index: 3;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

/* Fine line that draws outward from the center */
.reveal-line {
  width: 140px;
  height: 1px;
  transform: scaleX(0);
  opacity: 0;
}

.show .reveal-line {
  animation: lineDraw 1.1s cubic-bezier(0.4, 0, 0.2, 1) 0.2s forwards;
}

@keyframes lineDraw {
  from {
    transform: scaleX(0);
    opacity: 0;
  }
  to {
    transform: scaleX(1);
    opacity: 0.9;
  }
}

/* Elegant script, revealed letter by letter */
.save-the-date-label {
  font-family: 'Great Vibes', cursive;
  font-size: 2.6rem;
  line-height: 1.25;
  margin: 0;
  font-weight: 400;
  white-space: nowrap;
}

.std-char {
  display: inline-block;
  opacity: 0;
  filter: blur(6px);
  transform: translateY(8px);
}

.show .std-char {
  animation: charBloom 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  /* per-character stagger applied inline via animation-delay */
}

@keyframes charBloom {
  to {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0);
  }
}

/* Date tracks in: letter-spacing settles as it fades up */
.event-date {
  font-size: 0.85rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin: 0;
  font-weight: 500;
  opacity: 0;
}

.show .event-date {
  animation: dateTrackIn 1.4s ease-out 1.2s forwards;
}

@keyframes dateTrackIn {
  from {
    opacity: 0;
    letter-spacing: 0.42em;
  }
  to {
    opacity: 0.8;
    letter-spacing: 0.18em;
  }
}

/* ---------- Reduced motion ---------- */

@media (prefers-reduced-motion: reduce) {
  .show .kenburns-frame {
    animation: none;
    transform: scale(1.02);
  }

  .couple-photo-veil {
    transition-duration: 0.8s;
  }

  .show .light-sweep,
  .bokeh {
    animation: none;
  }

  .bokeh-field {
    display: none;
  }

  .std-char {
    filter: none;
    transform: none;
  }

  .show .std-char {
    animation: charBloom 0.6s ease forwards;
    animation-delay: 0s !important;
  }

  .show .reveal-line {
    animation-duration: 0.5s;
  }

  .show .event-date {
    animation-duration: 0.6s;
    animation-delay: 0.3s;
  }
}
</style>
