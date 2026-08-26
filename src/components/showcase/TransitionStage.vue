<template>
  <div
    class="transition-stage"
    :class="{ 'stage-fade-out': isStageFadingOut }"
    :style="paletteStyle"
  >
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
          @load="handlePhotoLoad"
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

    <!-- Footer scrim. Split out of .cloud-footer so the falling field can sit
         between the two: the mist is blur-effect colour at up to 94% alpha, so
         anything behind it is washed to that colour — which is exactly what
         petals must not be. -->
    <div class="cloud-scrim" :class="{ 'show': isContentVisible }" aria-hidden="true">
      <!-- Soft blur band, lighter than before so the photo stays present -->
      <div class="cloud-blur-layer" />
      <!-- Gradient mist for text legibility -->
      <div class="cloud-mist-layer" :style="{ background: mistGradient }" />
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

         Layered above the photo and the scrim so the petals keep their
         template colour, below the save-the-date copy — the same order the
         cover uses. -->
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
        <!-- Fine lines drawing outward from centre. Two of them: one alone
             reads as an underline under a heading, which is not what this block
             is — the pair frames the copy into a cartouche, the way the door
             transition's two ornament rules bracket its lettering. -->
        <div class="reveal-line reveal-line-top" :style="{ background: revealLineGradient }" />

        <!-- "Save the Date" blooms in letter by letter, then one pass of light
             crosses it. The gleam is a second copy of the same words stacked on
             the first: the letters underneath animate per-character opacity and
             blur, and `background-clip: text` on that same element would have
             to paint the gradient for all of them at once, which kills the
             bloom. Overlaying it keeps the two independent — the base copy is
             untouched, and the gleam is purely additive. -->
        <div class="label-stack">
          <p class="save-the-date-label" :style="{ color: saveDateTextColor }">
            <span
              v-for="(char, i) in saveTheDateChars"
              :key="i"
              class="std-char"
              :style="{ animationDelay: `${STD_CHAR_BASE_DELAY_MS + i * 65}ms` }"
              >{{ char === ' ' ? ' ' : char }}</span
            >
          </p>
          <p class="save-the-date-label save-the-date-gleam" aria-hidden="true">
            {{ SAVE_THE_DATE_TEXT }}
          </p>
        </div>

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

        <!-- Draws last, once the date has settled, so the frame closes around
             finished copy rather than around copy still arriving. -->
        <div class="reveal-line reveal-line-bottom" :style="{ background: revealLineGradient }" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, inject, watch } from 'vue'
import { RotateCcw, Crop } from 'lucide-vue-next'
import type { EventPhoto } from '@/types/showcase'
import { EditIntentKey } from '@/components/showcase-preview/edit/editContext'
import { useFeaturedPhotoGeometry } from '@/composables/showcase/useFeaturedPhotoGeometry'
import { fallingEffectKeyOf } from '@/composables/showcase/useFallingParticles'
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
  /** The template's `blur-effect` colour — the footer mist band is made of it,
   *  the same slot the door transition's printed chrome uses. Defaults to white
   *  upstream, which is the intended look for the band. */
  blurEffectColor?: string
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

// Remount on a config change — see fallingEffectKeyOf for why the key covers
// the effect's own fields but deliberately not the palette.
const fallingEffectKey = computed(() => fallingEffectKeyOf(props.fallingEffect))

const emit = defineEmits<{
  /** Fired the moment the stage starts dissolving, so the parent can mount the
   *  invitation behind it and let this fade become a cross-fade into it rather
   *  than a fade back to the cover. Never fires under `freezeAtPeak`, which
   *  returns before the fade-out timer is armed. */
  dissolveStart: []
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
let photoLatestTimer: ReturnType<typeof setTimeout> | null = null
let fadeOutTimer: ReturnType<typeof setTimeout> | null = null
let completeTimer: ReturnType<typeof setTimeout> | null = null

const featuredPhoto = computed(() => props.eventPhotos?.find((p) => p.is_featured) ?? null)

const featureImageUrl = computed(() =>
  featuredPhoto.value ? props.getMediaUrl(featuredPhoto.value.image) : null,
)

// Organizer-chosen crop, laid out in pixels against the live stage size.
const { photoContainerRef, photoStyle, onPhotoLoad } = useFeaturedPhotoGeometry(featuredPhoto)

/** Whether the featured photo has actually decoded — see runRevealSequence. */
const isPhotoDecoded = ref(false)
const handlePhotoLoad = (event: globalThis.Event) => {
  onPhotoLoad(event)
  isPhotoDecoded.value = true
}

// --- Palette ---------------------------------------------------------------

/**
 * Force a template colour to `#rrggbb` so the `+ alpha` concatenation below is
 * always valid. Without this a non-hex value would silently make the mist's
 * *transparent* stops opaque and bury the photo behind a solid block.
 */
const toHex6 = (color: string | null | undefined, fallback: string): string => {
  const value = (color ?? '').trim()
  if (/^#[0-9a-f]{6}$/i.test(value)) return value
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value)
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`
  return fallback
}

const relativeLuminance = (hex6: string) => {
  const channel = (at: number) => parseInt(hex6.slice(at, at + 2), 16) / 255
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

// The cartouche — flourish line, "Save the Date", and the date — is the
// template's primary colour, and reads as one unit in it.
const flourishColor = computed(() =>
  toHex6(props.primaryColor || props.accentColor, '#b08d57'),
)

const revealLineGradient = computed(
  () =>
    `linear-gradient(to right, transparent 0%, ${flourishColor.value} 25%, ${flourishColor.value} 75%, transparent 100%)`,
)

/**
 * The gleam's hotspot. Deliberately a lightened flourish colour rather than the
 * near-white the door transition uses: that cartouche sits on a near-black photo
 * scrim where white is the brightest thing available, but this copy sits on a
 * pale vellum mist band, and a white hotspot there erases the letters into the
 * band for the length of the pass. Lifting the copy's own hue keeps the words
 * legible through the highlight, which is what separates a gleam from a gap.
 */
const mixToWhite = (hex6: string, amount: number) => {
  const channel = (at: number) => {
    const value = parseInt(hex6.slice(at, at + 2), 16)
    return Math.round(value + (255 - value) * amount)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${channel(1)}${channel(3)}${channel(5)}`
}

const gleamColor = computed(() => mixToWhite(flourishColor.value, 0.45))
const gleamCoreColor = computed(() => mixToWhite(flourishColor.value, 0.68))

const saveDateTextColor = flourishColor

const dateTextColor = flourishColor

/**
 * The colour the footer band is made of: the template's `blur-effect` slot, the
 * same one the door transition's printed chrome uses — not background/primary,
 * which is the cover's colour rather than the colour of a wash laid *over*
 * imagery. Defaults to white upstream (useTemplateProcessor), so a template
 * that doesn't define the slot gets a white vellum band.
 */
const mistColor = computed(() => toHex6(props.blurEffectColor, '#ffffff'))

/** Density ramp across the band's 38vh; alphas are hex pairs so they can be
 *  concatenated onto the 6-digit colour, the showcase's convention. */
const MIST_STOPS: ReadonlyArray<readonly [alpha: string, position: string]> = [
  ['00', '0%'],
  ['4d', '35%'],
  ['99', '60%'],
  ['cc', '80%'],
  ['f0', '100%'],
]

const mistGradient = computed(
  () =>
    `linear-gradient(to bottom, ${MIST_STOPS.map(
      ([a, position]) => `${mistColor.value}${a} ${position}`,
    ).join(', ')})`,
)

/**
 * Legibility guard first, dimension second. The copy is the template's primary
 * colour and the band is its `blur-effect` colour, and nothing stops a template
 * from pointing both slots at the same hue — so the stack always leans away from
 * the band: light band gets a dark cast, dark band gets a light glow.
 *
 * Two layers rather than one, which is what the door transition's cartouche does
 * with its `drop-shadow(0 2px 0 …) drop-shadow(0 10px 26px …)` pair — a tight
 * contact edge that separates the glyph from its ground, then a wider soft cast
 * that puts air under it. One layer can only do one of those, which is why the
 * script read flat next to the door's engraved lettering.
 *
 * The values are this stage's, not the door's. The door's are tuned for near-
 * black photo scrim and would smother a pale vellum band; here the light branch
 * leads with a white contact highlight (letterpress lift on a pale ground) and
 * keeps the cast well under the door's weight.
 */
const copyHalo = computed(() =>
  relativeLuminance(mistColor.value) > 0.6
    ? '0 1px 0 rgba(255, 255, 255, 0.65), 0 2px 6px rgba(0, 0, 0, 0.16)'
    : '0 0 10px rgba(255, 255, 255, 0.45), 0 2px 8px rgba(0, 0, 0, 0.35)',
)

const paletteStyle = computed<Record<string, string>>(() => ({
  '--ts-copy-halo': copyHalo.value,
  '--ts-gleam': gleamColor.value,
  '--ts-gleam-core': gleamCoreColor.value,
}))

/** Holds the script back until the flourish line above it has finished drawing;
 *  the 65ms per-character stagger runs on top of this. Folded into the inline
 *  delay because each character's own delay is inline, and inline beats the
 *  stylesheet. */
const STD_CHAR_BASE_DELAY_MS = 400

const SAVE_THE_DATE_TEXT = 'Save the Date'
const saveTheDateChars = computed(() => SAVE_THE_DATE_TEXT.split(''))

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

/**
 * When the photograph starts rising, measured from the envelope tap — this
 * stage mounts *on* the tap, so its clock and the cover's exit clock are one.
 *
 * The cover's ornaments run 100→1200ms (0.8s each, staggered 0.1/0.2/0.3/0.4)
 * and, on the strong curve the whole chain shares, have visibly cleared by
 * ~900ms. At the old 1000ms the photograph therefore began *after* the cover
 * had gone: the ornaments left, the screen held on the bare backdrop for a
 * beat, and only then did a photo start bleeding in — three events read as
 * three. Starting at 400ms makes the photograph the fifth beat of that same
 * stagger: it begins with the last ornament and takes the same 0.8s, so the
 * two land together at 1200ms and the frame changes hands once. The music then
 * cues at `coverExitDurationMs` (1400ms) onto a photograph that is already
 * there, rather than onto one still a third of the way in.
 */
const PHOTO_REVEAL_AT_MS = 400

/**
 * Ceiling on waiting for the image to decode. A photograph that arrives late
 * doesn't join the ornaments' exit — it pops in over the middle of its own
 * fade, which is the one thing this beat exists to avoid. So the reveal waits
 * for the decode, but never past here: a slow or broken image delays the
 * handover rather than stalling the stage.
 */
const PHOTO_REVEAL_LATEST_MS = 1400

let stopPhotoDecodeWatch: (() => void) | null = null

const revealPhoto = () => {
  stopPhotoDecodeWatch?.()
  stopPhotoDecodeWatch = null
  isCouplePhotoVisible.value = true
}

// Animation timeline (this stage backs the `decoration` animation type; door
// templates get TransitionStageDoor.vue instead):
//   0ms    - Envelope tapped. This stage mounts; the cover's copy leaves (0.7s),
//            its gilding and creatures fade (0.7s), its ornaments slide out
//            (staggered, last one clears at 1200ms)
//   400ms  - Photograph rises *veiled*, opening outward with the parting frame
//            (scale 0.94→1, 0.8s → 1200ms)
//            — the fifth beat of the cover's own 0.8s stagger. The veil starts
//            its single 2.2s hold-then-release here too. The vignette frames the
//            photograph on the way in (0.1s behind, → 1600ms); the petal field
//            hands off on the photograph's own ramp; Ken Burns starts its 9s drift
//   1200ms - The photograph has the frame; last cover ornament clears. The veil
//            has been dissolving since 400ms but holds ~85% to here, then
//            releases and drifts upward off the photograph (→2600ms)
//   1400ms - The view cues music here
//   1800ms - Footer scrim rises
//   1900ms - Flourish line draws outward from centre (lands ~2800ms)
//   2200ms - "Save the Date" blooms letter by letter, 65ms apart (last letter ~3900ms)
//   2600ms - Veil fully lifted
//            on that same frame (clears ~4800ms)
//   3250ms - Date tracks in (settles ~4450ms), then a ~1.3s hold to read it
//   5800ms - Everything starts dissolving (1.2s) — and `dissolveStart` fires, so
//            the invitation mounts behind and assembles under the dissolve. The
//            photograph recedes as it goes (scale 1→0.985), converging with the
//            invitation's ornaments flying inward, which land at 7000ms too
//   7000ms - Fully faded out → emit transitionComplete
const clearTimers = () => {
  if (fadeInTimer) clearTimeout(fadeInTimer)
  if (couplePhotoTimer) clearTimeout(couplePhotoTimer)
  if (photoLatestTimer) clearTimeout(photoLatestTimer)
  if (fadeOutTimer) clearTimeout(fadeOutTimer)
  if (completeTimer) clearTimeout(completeTimer)
  stopPhotoDecodeWatch?.()
  stopPhotoDecodeWatch = null
  fadeInTimer = null
  couplePhotoTimer = null
  photoLatestTimer = null
  fadeOutTimer = null
  completeTimer = null
}

const runRevealSequence = () => {
  // The photograph rises through the tail of the cover's exit — but only once
  // the image is actually on screen to rise. See the two constants above.
  couplePhotoTimer = setTimeout(() => {
    if (isPhotoDecoded.value || !featureImageUrl.value) {
      revealPhoto()
      return
    }
    stopPhotoDecodeWatch = watch(isPhotoDecoded, (decoded) => {
      if (decoded) revealPhoto()
    })
  }, PHOTO_REVEAL_AT_MS)

  photoLatestTimer = setTimeout(revealPhoto, PHOTO_REVEAL_LATEST_MS)

  // Footer scrim with text
  fadeInTimer = setTimeout(() => {
    isContentVisible.value = true
  }, 1800)

  // Preview freeze: stop here — photo and text stay at full reveal
  if (props.freezeAtPeak) return

  // Start fading out — and in the same frame, tell the parent to bring the
  // invitation up behind us. Its own entry (card 0.8s, ornaments staggered to
  // 1.2s) then plays out underneath this 1.2s dissolve and lands with it.
  fadeOutTimer = setTimeout(() => {
    emit('dissolveStart')
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
  /* Proportion the copy to the *stage*, not the viewport: .showcase-container
     is min(100vw, 56.25vh), so plain vw over-sizes chrome on a short desktop
     window, where the stage is far narrower than the page. */
  --ts-w: min(100vw, 56.25vh);
  /* Strong ease-out for drawn chrome and copy; easeOutCubic for the full-frame
     image layers, where the strong curve lands too abruptly to read as
     atmosphere. Both replace built-in easings, which are too weak to shape a
     multi-second reveal — and `ease-in-out`, which holds an entrance back at
     exactly the moment the eye arrives. */
  --ts-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ts-ease-atmos: cubic-bezier(0.33, 1, 0.68, 1);
  /* Strong ease-in-out, for the veil alone. Both curves above decelerate to a
     stop, which is right for something arriving — but the veil has to stay put
     while the photograph arrives and only then release, and chaining a second
     decelerating ramp behind the first to get that put a visible stop in the
     middle of the reveal. One transition on a hold-then-release curve does the
     same job as one motion. */
  --ts-ease-veil: cubic-bezier(0.77, 0, 0.175, 1);
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
  /* THE ARC. Across the whole showcase the frame opens outward and then closes
     inward, and the photograph is the middle of that one gesture — so its scale
     carries the direction, not just its opacity.

     In: 0.94 → 1, expanding. The cover's four ornaments leave *outward* — left
     and right to ±100%, top and bottom to ∓100% — which at the frame level is
     one outward gesture, so the photograph blooming open into the space they
     vacate continues their direction instead of working against it. (It used to
     contract 1.03 → 1, which is a fine "camera settling" on its own and exactly
     backwards here: the frame opened while the photograph closed.)

     Out: 1 → 0.985, contracting — see .stage-fade-out below.

     0.8s from 400ms makes the photograph the fifth beat of the cover's own
     stagger: the ornaments start at 100/200/300/400ms and each takes 0.8s, so
     this starts with the last of them and lands with it at 1200ms. Same clock,
     same duration; only the curve differs, and deliberately — the ornaments
     leave on the chain's strong curve because they are objects being pulled
     off, the photograph arrives on the gentler atmospheric one because it is
     light filling a frame. Matching the curve too would make it slam.

     Every scale here composes with .kenburns-frame's own drift (1.14 → 1.02)
     rather than replacing it, so the composite — not either value alone — is
     what has to stay above 1 or an edge shows inside the frame. Going in that
     is comfortable (0.94 × 1.14 = 1.07). Going out it is the tight end, and
     the budget is worth writing down, because it is why the exit is 1.5% and
     not more:

       Ken Burns is at ~1.039 when the dissolve starts and ~1.030 when it ends
       (it is 6.6s into a 9s drift by then), i.e. ~1.5% of overhang a side. It
       also translates the photo up 0.6% by that point, which is spent entirely
       out of the *bottom* overhang. A contraction costs half its value per
       side, so 1.5% leaves roughly 1.5 − 0.75 − 0.6 ≈ 0.15% at the bottom on
       the final frame — a pixel or so, and that frame is at opacity 0, since
       the scale and the fade share a duration and a curve.

     A translate would have been the obvious way to carry the same recede and
     is twice as expensive here: it spends its whole value on one edge. */
  transform: scale(0.94);
  transition: opacity 0.8s var(--ts-ease-atmos), transform 0.8s var(--ts-ease-atmos);
  z-index: 1;
}

.couple-photo-container.show {
  opacity: 1;
  transform: scale(1);
}

/* Out: the photograph recedes as it dissolves, so the motion hands off instead
   of simply stopping. Underneath it the invitation is already assembling — its
   four ornaments fly *inward* from the edges (0.1/0.2/0.3/0.4 staggered, 0.8s
   each, so 1.2s in total, matched to this dissolve) and its card rises. A
   photograph pulling back with them makes everything on screen converge on the
   centre as one move; a photograph that only faded left the incoming frame to
   close over a still image. This is the exact mirror of the arrival above, and
   the two together are what make the cover's exit and the invitation's entrance
   read as one continuous opening and closing. */
.stage-fade-out .couple-photo-container {
  opacity: 0;
  transform: scale(0.985);
  transition: opacity 1.2s var(--ts-ease-atmos), transform 1.2s var(--ts-ease-atmos);
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

/* The veil is drawn up and away rather than dissolving in place — the same
   upward direction the cover's copy leaves on, so the whole sequence reads as
   one gesture: everything lifts off, the photograph stays. Transform only, on
   the same 2.2s ramp as the veil's opacity, so the two are one move.

   The oversize is 10%, not the 4% it needs merely to hide the blur's
   translucent edge bleed: the lift spends 2.5% of the bottom overhang, and what
   is left (2.5% ≈ 21px on a 844px frame) still has to cover a 16px blur. It
   scales about the viewport centre for the reason the original comment gives —
   on the img it would scale about the cropped image's off-screen centre. */
.veil-frame {
  position: absolute;
  inset: 0;
  overflow: hidden;
  transform: scale(1.1);
  transition: transform 2.2s var(--ts-ease-veil);
}

.show .veil-frame {
  transform: scale(1.1) translateY(-2.5%);
}

/* Veil copy: pre-blurred and luminous, stacked on the sharp photo.
   Fading its opacity (cheap) reads as the photo sharpening (a blur()
   transition on a fullscreen image would be far more expensive).

   THE VEIL IS THE BLENDER, so it has to be near-solid while the photograph is
   arriving. The mask used to open at alpha 0.25, which left the top quarter of
   the frame 75% *sharp* during the crossfade — a sharp couple photo dissolving
   over a sharp cover, at the top of the frame, which is exactly where the cover
   still has its title and its top ornament sliding out. That double exposure is
   what stopped the reveal blending with the rest of the stage. It now opens at
   0.72: nearly even, so what crosses over the departing cover is soft over
   sharp everywhere, and only then resolves.

   Still bottom-weighted, for the reason it always was — the hosts' faces sit
   high in a portrait crop, and an even veil spends its whole fade blurring the
   one thing people are trying to read, so the top clears first. 0.72 → 1.0 is
   enough tilt to do that now that the lift runs on a front-loaded curve; the
   old 0.25 was tuned against an `ease-in-out` that no longer applies.

   It runs as ONE ramp across the whole reveal (400→2600ms), shaped rather than
   delayed. A 0.7s delay bought the same hold, but at the cost of two ramps back
   to back — the photograph's arrival decelerating to a full stop at ~900ms, a
   beat of stillness, then the veil starting up. That stop is what read as a
   two-part reveal. On --ts-ease-veil the veil is still ~98% at 800ms and ~85%
   at 1200ms, so it holds through the arrival exactly as the delay did, then
   releases through 1300→2600ms without the join. Nothing in the reveal ever
   comes to rest until the whole thing is over. */
.couple-photo-veil {
  filter: blur(16px) brightness(1.18) saturate(0.92);
  opacity: 1;
  transition: opacity 2.2s var(--ts-ease-veil);
  mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.72) 0%,
    rgba(0, 0, 0, 0.88) 45%,
    #000 80%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.72) 0%,
    rgba(0, 0, 0, 0.88) 45%,
    #000 80%
  );
}

.show .couple-photo-veil {
  opacity: 0;
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
  /* Arrives *with* the photograph (0.1s behind it, over 1.1s), not 2.2s after.
     This is most of what made the reveal read as a square: a full-bleed
     rectangle crossfading in with bright hard corners is a slab, and every
     other element in this stage — the veil, the mist band — is soft and
     graded. Landing the vignette on the arrival means the photograph is
     edge-softened from the first frame it is visible, so it reads as a framed
     photograph resolving rather than a plate laid over the cover. Its opacity
     also multiplies with the container's own ramp, so it comes up gently. */
  transition: opacity 1.1s var(--ts-ease-atmos) 0.1s;
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


/* Handoff ramp from the shared CoverStage field — deliberately the same
   durations and easings as .couple-photo-container, since that photo is what
   hides the shared field. Scoped styles reach this element because a child
   component's root inherits the parent's scope id. */
.transition-petals {
  opacity: 0;
  transition: opacity 0.8s var(--ts-ease-atmos);
}

.transition-petals.show {
  opacity: 1;
}

.stage-fade-out .transition-petals {
  opacity: 0;
  transition: opacity 1.2s var(--ts-ease-atmos);
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
  transition: opacity 1.6s var(--ts-ease-atmos), transform 1.6s var(--ts-ease-atmos);
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
  transition: opacity 1.2s var(--ts-ease-atmos), transform 1.2s var(--ts-ease-atmos);
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

/* The template's blur-effect colour, white by default — one instrument with the
   frosted layer beneath it, so the band reads as the photograph misting over
   rather than as a separate dark plate dropped on top of it. The gradient is
   supplied inline (mistGradient); the density ramp is tuned to this band's
   38vh rather than a full-height one. */
.cloud-mist-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.save-the-date-container {
  position: relative;
  z-index: 3;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(var(--ts-w) * 0.022);
  padding-inline: calc(var(--ts-w) * 0.05);
}

/* Fine lines that draw outward from the centre. The width was a flat 140px
   while everything around it — the date's size, the container's padding — was
   already a ratio of the stage. At 0.36 it measures the same 140px on the
   390px phone it was tuned against, and now holds that proportion everywhere
   else instead of growing stubby on a wide stage. */
.reveal-line {
  width: calc(var(--ts-w) * 0.36);
  height: 1px;
  transform: scaleX(0);
  opacity: 0;
}

/* The flourish leads the script instead of trailing it. It used to start 200ms
   *after* the letters — which begin the instant .show lands — and was still
   drawing when the name was half written, so the line read as a late underline
   rather than as a frame being set. Now it lands first (a strong ease-out is
   ~97% done by 0.6s) and the letters bloom into a finished frame. */
.show .reveal-line-top {
  animation: lineDraw 0.9s var(--ts-ease-out) 0.1s forwards;
}

/* 2.5s: the date finishes its tracking settle at 2.65s, and the stage begins
   dissolving at 4.0s from .show. Drawing here closes the frame just as the copy
   stops moving and still leaves ~600ms of settled, finished block to read. */
.show .reveal-line-bottom {
  animation: lineDraw 0.9s var(--ts-ease-out) 2.5s forwards;
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

/* Elegant script, revealed letter by letter.
   The size was a flat 2.6rem while .event-date directly below it was already
   clamped against --ts-w — so the two drifted apart on any stage that wasn't
   the ~390px phone they were eyeballed on, the script staying put while the
   date grew or shrank under it. 0.107 reproduces 2.6rem at 390px exactly, so
   the common case is untouched; the clamps stop a very narrow stage from
   overflowing the nowrap line and a very wide one from turning the script into
   a banner. */
.save-the-date-label {
  font-family: 'Great Vibes', cursive;
  font-size: clamp(1.9rem, calc(var(--ts-w) * 0.107), 3.1rem);
  line-height: 1.25;
  margin: 0;
  font-weight: 400;
  white-space: nowrap;
  text-shadow: var(--ts-copy-halo);
}

/* Sizes itself to the base copy, so the gleam laid over it with inset: 0
   lands on exactly the same glyphs. */
.label-stack {
  position: relative;
}

/* The pass of light. Same geometry as the door transition's goldSheen — a
   260%-wide gradient travelling 150% -> -60% — so the two stages' lettering
   catches light the same way. The band is transparent either side of the
   hotspot, so everywhere but the highlight the copy underneath shows through
   completely untouched.

   No text-shadow here: the fill is transparent, and the halo the base copy
   carries would otherwise paint over the inside of the glyphs rather than
   behind them. */
.save-the-date-gleam {
  position: absolute;
  inset: 0;
  pointer-events: none;
  text-shadow: none;
  background-image: linear-gradient(
    100deg,
    transparent 38%,
    var(--ts-gleam) 47%,
    var(--ts-gleam-core) 50%,
    var(--ts-gleam) 53%,
    transparent 62%
  );
  background-size: 260% 100%;
  background-position: 150% 0;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  opacity: 0;
}

/* 2.2s: the last letter finishes blooming at ~2.08s, so the light crosses
   finished words rather than words still arriving. It clears at 3.7s, ahead
   of the 4.0s dissolve. Linear because a pass of light travels at a constant
   speed — an eased sweep hesitates in the middle, which is the part being
   watched. The opacity envelope keeps the band from popping on at full
   strength at one edge and cutting off at the other. */
.show .save-the-date-gleam {
  animation: labelGleam 1.5s linear 2.2s forwards;
}

@keyframes labelGleam {
  0% {
    background-position: 150% 0;
    opacity: 0;
  }
  18% {
    opacity: 1;
  }
  82% {
    opacity: 1;
  }
  100% {
    background-position: -60% 0;
    opacity: 0;
  }
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

/* Sized against the stage, and never allowed to wrap. At a fixed 0.85rem the
   widest en-US long date ("Wednesday, September 30, 2026") measures ~400px at
   its opening tracking — wider than a 390px phone. So it wrapped to two lines,
   then snapped back to one partway through the settle, jerking "Save the Date"
   down and back up as the tracking closed. */
.event-date {
  font-size: clamp(0.62rem, calc(var(--ts-w) * 0.029), 0.85rem);
  white-space: nowrap;
  letter-spacing: 0.18em;
  /* letter-spacing also adds a trailing space after the *last* glyph, so a
     centred line sits half a space left of true centre — by a changing amount
     while the tracking settles, which makes the date creep sideways as it
     arrives. The matching negative margin cancels it at every frame. */
  margin: 0 -0.18em 0 0;
  text-transform: uppercase;
  font-weight: 500;
  opacity: 0;
  text-shadow: var(--ts-copy-halo);
}

.show .event-date {
  animation: dateTrackIn 1.2s var(--ts-ease-out) 1.45s forwards;
}

@keyframes dateTrackIn {
  from {
    opacity: 0;
    letter-spacing: 0.36em;
    margin-right: -0.36em;
  }
  to {
    opacity: 0.8;
    letter-spacing: 0.18em;
    margin-right: -0.18em;
  }
}

/* ---------- Reduced motion ---------- */

@media (prefers-reduced-motion: reduce) {
  .show .kenburns-frame {
    animation: none;
    transform: scale(1.02);
  }

  /* The photograph neither opens nor recedes, and the veil dissolves in place
     instead of being drawn up. Everything still fades, which is the reveal. */
  .couple-photo-container,
  .couple-photo-container.show,
  .stage-fade-out .couple-photo-container {
    transform: none;
  }

  .veil-frame,
  .show .veil-frame {
    transform: scale(1.1);
  }

  .couple-photo-veil {
    transition: opacity 0.8s ease;
  }

  /* Pure decoration, and pure movement — nothing is lost by removing it. */
  .save-the-date-gleam {
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

  .show .reveal-line-top,
  .show .reveal-line-bottom {
    animation-duration: 0.5s;
  }

  /* Still last, but it no longer waits out a tracking settle that was removed
     from this branch — the date fades in place here. */
  .show .reveal-line-bottom {
    animation-delay: 0.9s;
  }

  /* No lift on the band and no tracking settle on the date — both are position
     changes. Everything still fades, which is what carries the sequence. */
  .cloud-scrim,
  .cloud-footer,
  .stage-fade-out .cloud-scrim,
  .stage-fade-out .cloud-footer {
    transform: none;
  }

  .show .event-date {
    animation: dateFadeIn 0.6s ease 0.3s forwards;
  }
}

/* Reduced-motion stand-in for dateTrackIn: the same settled opacity, no
   tracking travel. Declared outside the media block so the scoped-style
   keyframe rename never has to reach into an at-rule. */
@keyframes dateFadeIn {
  to {
    opacity: 0.8;
  }
}
</style>
