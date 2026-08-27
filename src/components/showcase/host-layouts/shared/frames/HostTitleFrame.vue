<template>
  <span v-if="frame === 'none'" class="title-frame title-frame--none"><slot /></span>

  <span v-else class="title-frame" :class="`title-frame--${frame}`" :style="frameVars">
    <!-- Laurel is the one style whose chrome sits *outside* the text rather
         than behind it, so its sprigs are siblings of the label, not a
         background. Mirrored from one drawing — see ornamentPaths. -->
    <svg
      v-if="frame === 'laurel'"
      class="title-sprig title-sprig--left"
      :viewBox="LAUREL_VIEWBOX"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path :d="LAUREL_STEM" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      <ellipse
        v-for="([cx, cy, rx, ry, rot], i) in LAUREL_LEAVES"
        :key="i"
        :cx="cx"
        :cy="cy"
        :rx="rx"
        :ry="ry"
        :transform="`rotate(${rot} ${cx} ${cy})`"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>

    <span class="title-frame-label"><slot /></span>

    <svg
      v-if="frame === 'laurel'"
      class="title-sprig title-sprig--right"
      :viewBox="LAUREL_VIEWBOX"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path :d="LAUREL_STEM" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      <ellipse
        v-for="([cx, cy, rx, ry, rot], i) in LAUREL_LEAVES"
        :key="i"
        :cx="cx"
        :cy="cy"
        :rx="rx"
        :ry="ry"
        :transform="`rotate(${rot} ${cx} ${cy})`"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HostFrameStyle } from '@/services/api/types/template.types'
import { LAUREL_VIEWBOX, LAUREL_STEM, LAUREL_LEAVES } from './ornamentPaths'
import { frameInkVars } from './frameInk'

/**
 * Chrome around a host's title. The avatar's matching half lives in
 * HostAvatarFrame.vue — one `frame_style` drives both, so a partner cannot pair
 * a ribbon title with a laurel avatar.
 *
 * Wraps the existing title markup through a slot rather than re-rendering it:
 * the title carries per-word `bounce-word` spans with their own animation
 * delays, and an InlineEditableText target for the preview editor. Both must
 * survive being framed, which they only do if the frame never owns the text.
 */
interface Props {
  frame?: HostFrameStyle | null
  /** Template accent — the fill on `banner`/`ribbon`, the rule on the others. */
  accentColor: string
  /** Template primary — the ink on every style whose text sits on the page. */
  primaryColor: string
}

const props = withDefaults(defineProps<Props>(), { frame: 'none' })

const frame = computed<HostFrameStyle>(() => props.frame ?? 'none')

/**
 * `banner` and `ribbon` put the label *on* the accent, so their ink has to be
 * chosen against it rather than inherited — a dark accent needs light type and
 * a pale one needs dark, and nothing stops a template from picking either.
 * The hairline styles leave the text on the page, where the template's own
 * primary is already the right answer.
 */
const frameVars = computed(() =>
  frameInkVars(frame.value, props.accentColor, props.primaryColor),
)
</script>

<style scoped>
/* `none` is a bare passthrough — no wrapper box, no inherited layout — so an
   unframed title is byte-for-byte the title that shipped before this existed. */
.title-frame--none {
  display: contents;
}

.title-frame {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  min-width: 0;
}

/* The label keeps its own colour on the hairline styles and takes the frame's
   on the filled ones. `:deep` because the slotted title is the caller's markup. */
.title-frame-label {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.title-frame--banner .title-frame-label :deep(*),
.title-frame--ribbon .title-frame-label :deep(*) {
  color: var(--frame-ink) !important;
}

/* ---------- banner ----------
   A filled plate with notched ends. The notch is cut with clip-path rather than
   drawn as two pseudo-element triangles: a polygon keeps the whole shape one
   element, so the fill, the shadow and the text all share one geometry and
   cannot drift apart at a fractional width. */
.title-frame--banner {
  padding: 0.28em 1.5em;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--frame-fill) 88%, white) 0%,
    var(--frame-fill) 45%,
    color-mix(in srgb, var(--frame-fill) 88%, black) 100%
  );
  clip-path: polygon(
    0.7em 0%,
    100% 0%,
    calc(100% - 0.7em) 50%,
    100% 100%,
    0.7em 100%,
    0% 50%
  );
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.18);
}

/* ---------- plaque ----------
   Two hairlines with cut corners, the quiet option. The inner rule is drawn by
   the pseudo-element so the pair scales together with the text rather than
   needing a second hard-coded inset. */
.title-frame--plaque {
  padding: 0.3em 1.15em;
  border: 1px solid var(--frame-rule);
  clip-path: polygon(
    0.45em 0%,
    calc(100% - 0.45em) 0%,
    100% 0.45em,
    100% calc(100% - 0.45em),
    calc(100% - 0.45em) 100%,
    0.45em 100%,
    0% calc(100% - 0.45em),
    0% 0.45em
  );
}

.title-frame--plaque::before {
  content: '';
  position: absolute;
  inset: 3px;
  border: 1px solid color-mix(in srgb, var(--frame-rule) 55%, transparent);
  clip-path: polygon(
    0.35em 0%,
    calc(100% - 0.35em) 0%,
    100% 0.35em,
    100% calc(100% - 0.35em),
    calc(100% - 0.35em) 100%,
    0.35em 100%,
    0% calc(100% - 0.35em),
    0% 0.35em
  );
  pointer-events: none;
}

/* ---------- ribbon ----------
   A band with the tails folded *behind* it. The tails are pseudo-elements at a
   darker step of the fill and sit at z-index 0 under the band, which is what
   makes the fold read as a fold rather than as two arrows glued on. */
.title-frame--ribbon {
  padding: 0.28em 1.1em;
  background: var(--frame-fill);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.16);
}

.title-frame--ribbon::before,
.title-frame--ribbon::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 0.7em;
  height: 100%;
  background: color-mix(in srgb, var(--frame-fill) 72%, black);
  transform: translateY(-50%);
  z-index: -1;
}

.title-frame--ribbon::before {
  left: -0.6em;
  clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 45% 50%);
}

.title-frame--ribbon::after {
  right: -0.6em;
  clip-path: polygon(0% 0%, 100% 0%, 55% 50%, 100% 100%, 0% 100%);
}

/* ---------- laurel ----------
   No box at all — the sprigs are the frame. Sized in `em` so they track the
   title's own size on every breakpoint instead of needing their own clamp. */
.title-frame--laurel {
  gap: 0.5em;
  color: var(--frame-rule);
}

.title-sprig {
  flex: none;
  width: 1.5em;
  height: 1.5em;
  overflow: visible;
}

/* The right sprig is the left one mirrored — see ornamentPaths for why it is
   not authored twice. */
.title-sprig--right {
  transform: scaleX(-1);
}
</style>
