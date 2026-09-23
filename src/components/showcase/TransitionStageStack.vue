<template>
  <div class="stack-stage" :class="{ 'is-dissolving': isDissolving }">
    <!-- Manage-page preview controls: replay the montage, and re-aim the lead
         photograph. Replay has to be a real button because the photo edit
         regions drop the frame's normal click-anywhere-to-replay shield. -->
    <div v-if="editIntentCtx" class="preview-controls">
      <button
        type="button"
        class="preview-control-btn edit-region-control"
        :title="tApp('management.showcasePreview.editors.replayTransition')"
        @click.stop.prevent="replay"
      >
        <RotateCcw class="preview-control-icon" aria-hidden="true" />
      </button>

      <!-- Opens the framing editor on the lead photograph, with every other
           photograph in the stack a tap away, each in its own frame's shape.
           Tapping a photograph opens it on that one instead. -->
      <button
        v-if="leadPhoto"
        type="button"
        class="preview-control-btn edit-region-control"
        :title="tApp('management.showcasePreview.editors.adjustCrop')"
        @click.stop.prevent="
          editIntentCtx.requestEdit({
            kind: 'featuredPhoto',
            focus: 'crop',
            stackLayout: layoutType,
            photoId: leadPhoto.id,
          })
        "
      >
        <Crop class="preview-control-icon" aria-hidden="true" />
      </button>
    </div>

    <!-- Keyed so a replay rebuilds the composition from its first frame instead
         of transitioning back to it: every reveal is a transition, and clearing
         the flags would otherwise play the whole montage in reverse before
         playing it forward. -->
    <div :key="runKey" class="stack-run">
      <!-- The table. It is the cover's own backdrop artwork, racked out of
           focus — the cover's ornaments leave, and the surface they were
           printed on softens into something the photographs can lie on. Drawn
           here rather than borrowed from CoverStage's VideoContainer so the
           stage is the same picture in the preview frame, which mounts it on its
           own. The same optimized URL, so on the live showcase this is a cache
           hit. -->
      <div
        class="sk-ground"
        :class="{ show: isGroundVisible }"
        :style="{ backgroundColor: groundColor }"
        aria-hidden="true"
      >
        <img v-if="backdropUrl" :src="backdropUrl" alt="" class="sk-ground-photo" />
        <div class="sk-ground-wash" :style="{ background: washGradient }" />
      </div>

      <!-- The composition is the template's `stackLayout`; this stage supplies
           the clock it runs to and the copy it places. -->
      <component
        :is="layoutComponent"
        class="sk-layout"
        :photos="photos"
        :shown="shown"
        :entered="isGroundVisible"
        :closed="isClosed"
        :dissolving="isDissolving"
        :event-title="eventTitle"
        :accent-color="accentHex"
        :wash-color="washColor"
        :get-media-url="getMediaUrl"
      >
        <!-- Save the date. The composition is the template's choice; this stage
             supplies the ground (flat primary ink, haloed for whatever it is
             written on — the pale wash, or a printed card) and the clock.
             `script` is its fallback: handwriting is what belongs beside
             photographs. -->
        <template #copy>
          <SaveTheDate
            :design="saveTheDateDesign"
            fallback="script"
            :revealed="isCopyRevealed"
            :event-start-date="eventStartDate"
            ink="solid"
            :ink-color="inkColor"
            :ink-light-color="gleamColor"
            :hot-color="gleamCoreColor"
            :halo="copyHalo"
          />
        </template>
      </component>
    </div>

    <!-- The showcase-wide falling field lives in CoverStage and drifts over
         this stage from above it (the stage renders in CoverStage's
         `transition` slot), so on the live showcase the petals never restart.
         The preview frame mounts the stage on its own, with no CoverStage
         around it — only there does it draw its own, so the frame shows what a
         guest sees. -->
    <FallingEffect
      v-if="standalone"
      :key="fallingEffectKey"
      class="sk-falling"
      :config="fallingEffect"
      :primary-color="primaryColor"
      :accent-color="accentColor"
      :get-media-url="getMediaUrl"
      :z-index="8"
    />

    <!-- Manage-page preview: no featured photo yet — nothing to reveal. -->
    <div v-if="editIntentCtx && !leadPhoto" class="featured-photo-empty">
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
import { computed, inject, nextTick, onMounted, onUnmounted, provide, ref, watch } from 'vue'
import { RotateCcw, Crop } from 'lucide-vue-next'
import type { EventPhoto } from '@/types/showcase'
import { EditIntentKey } from '@/components/showcase-preview/edit/editContext'
import { useOptimizedBackgrounds } from '@/composables/showcase/useOptimizedDecorations'
import { fallingEffectKeyOf } from '@/composables/showcase/useFallingParticles'
import { useAppLanguage } from '@/composables/useAppLanguage'
import FallingEffect from './FallingEffect.vue'
import SaveTheDate from './save-the-date/SaveTheDate.vue'
import {
  StackLayoutKey,
  resolveStackLayout,
  stackCopyGround,
  stackPhotosFor,
  stackTimeline,
  type StackLayoutType,
} from './photo-stack/photoStack'
import StackPile from './photo-stack/layouts/StackPile.vue'
import StackSplit from './photo-stack/layouts/StackSplit.vue'
import StackBooth from './photo-stack/layouts/StackBooth.vue'
import StackMosaic from './photo-stack/layouts/StackMosaic.vue'
import StackFilm from './photo-stack/layouts/StackFilm.vue'
import type {
  FallingEffectConfig,
  SaveTheDateDesignConfig,
} from '@/services/api/types/template.types'

interface Props {
  eventTitle: string
  eventPhotos?: EventPhoto[]
  eventStartDate?: string | null
  primaryColor: string
  accentColor: string
  /** The template's `blur-effect` colour — the wash over the table is made of
   *  it, the same slot the decoration stage's mist band uses. White upstream
   *  by default. */
  blurEffectColor?: string
  /** The cover's backdrop artwork (`basic_decoration_photo`), which becomes the
   *  table. Null when the cover is a film rather than artwork — the table is
   *  then just its colour, rather than a picture the cover never showed. */
  backdropPhoto?: string | null
  /** The colour under that artwork — the template colour, white by default,
   *  exactly as VideoContainer draws it under the cover. */
  backdropColor?: string | null
  /** `cover_stage_layout.stackLayout` as the template stored it. Absent,
   *  null or unknown all mean `pile` — see resolveStackLayout. */
  layout?: string | null
  /** Falling particle effect config — drawn here only when `standalone`. */
  fallingEffect?: FallingEffectConfig | null
  /** Rendered outside CoverStage (the preview frame), so there is no shared
   *  falling field above it and it draws its own. */
  standalone?: boolean
  /**
   * Which Save the Date composition the template picked. Absent falls back to
   * `script` — see SaveTheDate.vue for why the fallback is per-stage.
   */
  saveTheDateDesign?: SaveTheDateDesignConfig | null
  getMediaUrl: (url: string) => string
  /** Preview-only: hold at the finished composition with the Save the Date
   *  written instead of dissolving and emitting transitionComplete. Never set
   *  on the live showcase. */
  freezeAtPeak?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** Fired the moment the stage starts dissolving, so the parent can mount the
   *  invitation behind it — same contract as TransitionStage's. Never fires
   *  under `freezeAtPeak`. */
  dissolveStart: []
  transitionComplete: []
}>()

// Only provided by the editable manage-page preview frame.
const editIntentCtx = inject(EditIntentKey, undefined)
const { t: tApp } = useAppLanguage()

// --- Layout ------------------------------------------------------------------

const LAYOUTS = {
  pile: StackPile,
  split: StackSplit,
  booth: StackBooth,
  mosaic: StackMosaic,
  film: StackFilm,
} as const satisfies Record<StackLayoutType, unknown>

const layoutType = computed(() => resolveStackLayout(props.layout))
const layoutComponent = computed(() => LAYOUTS[layoutType.value])
provide(StackLayoutKey, layoutType)

const photos = computed(() => stackPhotosFor(props.eventPhotos, layoutType.value))
const leadPhoto = computed(() => photos.value[0] ?? null)

/** How many photographs have been revealed so far. */
const shown = ref(0)
const isGroundVisible = ref(false)
const isClosed = ref(false)
const isCopyRevealed = ref(false)
const isDissolving = ref(false)
const runKey = ref(0)

// --- Table -------------------------------------------------------------------

const { optimizedDecorationPhotoUrl: backdropUrl } = useOptimizedBackgrounds(
  computed(() => props.backdropPhoto ?? null),
  computed(() => null),
)

const groundColor = computed(() => props.backdropColor || '#ffffff')

// --- Palette ---------------------------------------------------------------
// The same instruments the decoration stage uses for the same job — copy in the
// template's primary ink over a wash of its blur-effect colour.

/**
 * Force a template colour to `#rrggbb` so the `+ alpha` concatenation below is
 * always valid. Without this a non-hex value would silently make the wash's
 * translucent stops opaque and bury the table.
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

const mixToWhite = (hex6: string, amount: number) => {
  const channel = (at: number) => {
    const value = parseInt(hex6.slice(at, at + 2), 16)
    return Math.round(value + (255 - value) * amount)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${channel(1)}${channel(3)}${channel(5)}`
}

const inkColor = computed(() => toHex6(props.primaryColor || props.accentColor, '#b08d57'))
const gleamColor = computed(() => mixToWhite(inkColor.value, 0.45))
const gleamCoreColor = computed(() => mixToWhite(inkColor.value, 0.68))
const accentHex = computed(() => toHex6(props.accentColor || props.primaryColor, '#b08d57'))

const washColor = computed(() => toHex6(props.blurEffectColor, '#ffffff'))

/**
 * Light over the table where the photographs lie, dense at the foot. Light
 * enough at the top that the cover's artwork still reads as the surface the
 * photographs are on — the template's own colours carry through the stage — and
 * dense enough at the bottom to carry the copy without a band of its own.
 */
const WASH_STOPS: ReadonlyArray<readonly [alpha: string, position: string]> = [
  ['66', '0%'],
  ['73', '45%'],
  ['a6', '72%'],
  ['d9', '100%'],
]

const washGradient = computed(
  () =>
    `linear-gradient(to bottom, ${WASH_STOPS.map(
      ([a, position]) => `${washColor.value}${a} ${position}`,
    ).join(', ')})`,
)

/** The booth's card stock — what its copy is written on. */
const PAPER = '#f4f2ee'

/**
 * Leans away from whatever the copy is written on, as the decoration stage's
 * halo does from its band: the wash on most layouts, the printed card on the
 * booth's (see copyGround in photoStack.ts).
 */
const copyHalo = computed(() => {
  const ground = stackCopyGround(layoutType.value) === 'paper' ? PAPER : washColor.value
  return relativeLuminance(ground) > 0.6
    ? '0 1px 0 rgba(255, 255, 255, 0.65), 0 2px 6px rgba(0, 0, 0, 0.16)'
    : '0 0 10px rgba(255, 255, 255, 0.45), 0 2px 8px rgba(0, 0, 0, 0.35)'
})

const fallingEffectKey = computed(() => fallingEffectKeyOf(props.fallingEffect))

// --- Choreography ------------------------------------------------------------
// Every layout runs one clock (stackTimeline, photoStack.ts): the table racks
// out of focus under the cover's leaving ornaments, the photographs are revealed
// one at a time, the composition closes around the space for the copy, the Save
// the Date is written, and the stage dissolves over the invitation that mounts
// behind it on `dissolveStart`. Only the numbers differ per layout; for the
// default pile of five prints:
//   300ms   - table racks out of focus (1.1s)
//   400 / 1500 / 2450 / 3300 / 4100ms - prints dealt, each gap shorter
//   5000ms  - pull-back and spread (1.4s)
//   5700ms  - Save the Date
//   9700ms  - dissolve (1.2s), `dissolveStart`
//   10900ms - transitionComplete

/** When the table starts to soften, from the tap. */
const GROUND_AT_MS = 300

/**
 * Ceiling on waiting for the lead photograph to decode. A photograph that
 * arrives late is revealed as an empty frame, so the montage waits for the
 * first — and the whole schedule shifts with it, keeping every gap intact — but
 * never past here. Later ones aren't waited on: the view warms all of them while
 * the guest reads the cover, and one still in flight just fills its frame when
 * it arrives.
 */
const LEAD_PHOTO_LATEST_MS = 1400

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

/**
 * Decoded independently of whichever layout draws it, so no layout has to
 * report back to the clock. On the live showcase this is a cache hit on the
 * bitmap the view warmed during the cover.
 */
const isLeadReady = ref(false)
let leadImage: HTMLImageElement | null = null

const warmLead = () => {
  isLeadReady.value = false
  const lead = leadPhoto.value
  if (!lead) {
    isLeadReady.value = true
    return
  }
  const image = new Image()
  image.decoding = 'async'
  image.src = props.getMediaUrl(lead.image)
  leadImage = image
  // A failure counts as ready: the frame simply shows its empty ground, which
  // is better than holding the whole stage for a photograph that isn't coming.
  const done = () => {
    if (leadImage === image) isLeadReady.value = true
  }
  if (typeof image.decode === 'function') image.decode().then(done, done)
  else {
    image.onload = done
    image.onerror = done
  }
}

let timers: ReturnType<typeof setTimeout>[] = []
let stopLeadWatch: (() => void) | null = null
let startedAt = 0
/** How late the lead photograph went up; every later beat is pushed by as much. */
let shift = 0

/** Schedule `fn` at `ms` on this run's clock, net of any lead-photograph delay. */
const at = (ms: number, fn: () => void) => {
  const delay = Math.max(0, ms + shift - (performance.now() - startedAt))
  timers.push(setTimeout(fn, delay))
}

const clearTimers = () => {
  timers.forEach(clearTimeout)
  timers = []
  stopLeadWatch?.()
  stopLeadWatch = null
}

const runSequence = () => {
  startedAt = performance.now()
  shift = 0
  warmLead()
  // Read per run, not once: a guest can change the setting between visits,
  // and the preview frame re-runs this on replay.
  const reduced = prefersReducedMotion()
  const timeline = stackTimeline(photos.value.length, reduced, layoutType.value)

  const revealLead = () => {
    if (shown.value > 0) return
    stopLeadWatch?.()
    stopLeadWatch = null
    shift = Math.max(0, performance.now() - startedAt - timeline.deals[0])
    shown.value = 1

    for (let k = 1; k < timeline.deals.length; k++) {
      at(timeline.deals[k], () => {
        shown.value = k + 1
      })
    }
    at(timeline.spread, () => {
      isClosed.value = true
    })
    at(timeline.copy, () => {
      isCopyRevealed.value = true
    })

    // Preview freeze: hold on the finished composition with the copy written.
    if (props.freezeAtPeak) return

    // Start dissolving — and in the same frame, tell the parent to bring the
    // invitation up behind us, so this becomes a cross-fade into it.
    at(timeline.dissolve, () => {
      emit('dissolveStart')
      isDissolving.value = true
    })
    at(timeline.complete, () => {
      emit('transitionComplete')
    })
  }

  at(reduced ? 0 : GROUND_AT_MS, () => {
    isGroundVisible.value = true
  })

  at(timeline.deals[0], () => {
    if (isLeadReady.value) {
      revealLead()
      return
    }
    stopLeadWatch = watch(isLeadReady, (ready) => {
      if (ready) revealLead()
    })
  })

  at(LEAD_PHOTO_LATEST_MS, revealLead)
}

onMounted(runSequence)
onUnmounted(clearTimers)

// Manage-page preview only: replay the montage from the start. See the
// click-shield note on the replay button above.
const replay = async () => {
  clearTimers()
  shown.value = 0
  isGroundVisible.value = false
  isClosed.value = false
  isCopyRevealed.value = false
  isDissolving.value = false
  runKey.value++
  await nextTick()
  runSequence()
}
</script>

<style scoped>
.stack-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  /* Proportion everything to the *stage*, not the viewport — the showcase
     container is min(100vw, 56.25vh), so plain vw over-sizes a photograph on a
     short desktop window, where the stage is far narrower than the page. Every
     layout sizes itself in this unit; custom properties cross the component
     boundary. */
  --sk-w: min(100vw, 56.25vh);
  /* Strong ease-out for things arriving (a print landing, a tile surfacing);
     strong ease-in-out for things moving on screen (a pull-back, a fan);
     easeOutCubic for full-frame atmosphere (the table), where the strong curve
     lands too abruptly to read as light; and the Save the Date's own wipe curve
     for the split's panels. The chain's own curves — see §16 of the
     goevent-design skill. */
  --sk-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --sk-ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --sk-ease-atmos: cubic-bezier(0.33, 1, 0.68, 1);
  --sk-ease-wipe: cubic-bezier(0.33, 0, 0.15, 1);
  transition: opacity 1.2s var(--sk-ease-atmos);
}

@supports (height: 100dvh) {
  .stack-stage {
    --sk-w: min(100vw, 56.25dvh);
  }
}

/* The dissolve. The whole stage fades as one sheet over the invitation that
   mounted behind it on `dissolveStart`; each layout adds its own contraction. */
.stack-stage.is-dissolving {
  opacity: 0;
}

.stack-run {
  position: absolute;
  inset: 0;
}

/* ---------- Table ---------- */

.sk-ground {
  position: absolute;
  inset: 0;
  z-index: 1;
  opacity: 0;
  transition: opacity 1.1s var(--sk-ease-atmos);
}

.sk-ground.show {
  opacity: 1;
}

/* A pre-blurred copy over the sharp cover backdrop: fading its opacity reads as
   the backdrop going out of focus, where an animated `filter: blur()` on a
   full-bleed image would re-rasterise every frame. The same geometry as
   VideoContainer's backdrop (inset 0, cover), so the copy lands in register;
   the 1.1 scale hides the blur's translucent edge bleed, and doubles as the
   slight magnification a lens gives when focus is pulled. */
.sk-ground-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  filter: blur(14px) saturate(0.9);
  transform: scale(1.1);
}

.sk-ground-wash {
  position: absolute;
  inset: 0;
}

.sk-layout {
  z-index: 3;
}

/* ---------- Manage-page preview chrome ---------- */
/* The stage root is pointer-events:none (a pure animation on the live
   showcase) — these opt back in explicitly. Rendered only when the edit-intent
   context exists, never in production. */

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

.featured-photo-empty {
  position: absolute;
  inset: 0;
  z-index: 9;
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
/* Each layout carries its own; the stage's part is only to fade faster. The
   clock is shortened to match in photoStack.ts. */
@media (prefers-reduced-motion: reduce) {
  .stack-stage {
    transition-duration: 0.6s;
  }

  .sk-ground {
    transition-duration: 0.4s;
  }
}
</style>
