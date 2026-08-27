<template>
  <div class="std std-script" :class="{ 'is-revealed': revealed }">
    <!-- Two hairlines, not one. One alone reads as an underline under a
         heading, which is not what this block is — the pair frames the copy
         into a cartouche. The top one leads the script rather than trailing it:
         a strong ease-out is ~97% done by 0.6s, so it lands first and the
         letters bloom into a finished frame. -->
    <div class="std-rule script-rule script-rule-top" />

    <!-- The label blooms in letter by letter, then one pass of light crosses
         it. The gleam is a second copy of the same words stacked on the first:
         the letters underneath animate per-character opacity and blur, and
         `background-clip: text` on that same element would have to paint the
         gradient for all of them at once, which kills the bloom. Overlaying it
         keeps the two independent — the base copy is untouched, and the gleam
         is purely additive. -->
    <div class="script-stack">
      <p class="script-label std-solid">
        <span
          v-for="(char, i) in chars"
          :key="i"
          class="script-char"
          :style="{ '--std-char-delay': `${400 + i * 65}ms` }"
          >{{ char === ' ' ? " " : char }}</span
        >
      </p>
      <p class="script-label script-gleam" aria-hidden="true">{{ label }}</p>
    </div>

    <p v-if="longDate" class="std-longdate script-date std-solid">{{ longDate }}</p>

    <!-- Draws last, once the date has settled, so the frame closes around
         finished copy rather than around copy still arriving. -->
    <div class="std-rule script-rule script-rule-bottom" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SaveTheDateDesignProps } from '../types'

/**
 * `script` — the decoration transition's original composition, unchanged.
 *
 * Its gesture is the **per-character bloom**: each letter arrives out of blur
 * and a short rise, 65ms behind the one before it, so the words are written
 * rather than shown. No other design in the set touches per-character timing.
 *
 * The one design that ignores `ink` and is always solid. The bloom needs each
 * letter to be its own box animating its own opacity, and a `background-clip:
 * text` fill paints from the *parent* — so on a metal-ink stage the spans
 * inherit `-webkit-text-fill-color: transparent`, have no background of their
 * own, and the label renders as nothing at all. It loses no light for it: the
 * gleam overlay below is additive and draws its hotspot from the same
 * `--std-ink-lit` / `--std-hot` pair the metal fill would have used, so on the
 * door stage the words still catch a near-white pass.
 */
const props = defineProps<SaveTheDateDesignProps>()
const chars = computed(() => props.label.split(''))
</script>

<style scoped>
/* Sized against the stage rather than the viewport — see --std-w. */
.std-script {
  gap: calc(var(--std-w) * 0.022);
  padding-inline: calc(var(--std-w) * 0.05);
}

.script-rule {
  width: calc(var(--std-w) * 0.36);
}

.is-revealed .script-rule-top {
  animation: stdRuleDraw 0.9s var(--std-ease-out) calc(var(--std-t0) + 100ms) forwards;
}

/* The date finishes its tracking settle 2.65s in, and the host stage begins
   dissolving at 4.0s. Drawing here closes the frame just as the copy stops
   moving and still leaves ~600ms of settled, finished block to read. */
.is-revealed .script-rule-bottom {
  animation: stdRuleDraw 0.9s var(--std-ease-out) calc(var(--std-t0) + 2500ms) forwards;
}

/* Sizes itself to the base copy, so the gleam laid over it with inset: 0 lands
   on exactly the same glyphs. */
.script-stack {
  position: relative;
}

.script-label {
  font-family: var(--std-script);
  font-size: clamp(1.9rem, calc(var(--std-w) * 0.107), 3.1rem);
  line-height: 1.25;
  font-weight: 400;
  white-space: nowrap;
}

.script-char {
  display: inline-block;
  opacity: 0;
  filter: blur(6px);
  transform: translateY(8px);
}

.is-revealed .script-char {
  animation: scriptBloom 0.9s cubic-bezier(0.22, 1, 0.36, 1)
    calc(var(--std-t0) + var(--std-char-delay)) forwards;
}

@keyframes scriptBloom {
  to {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0);
  }
}

/* The pass of light. The band is transparent either side of the hotspot, so
   everywhere but the highlight the copy underneath shows through completely
   untouched.

   No text-shadow here: the fill is transparent, and the halo the base copy
   carries would otherwise paint over the inside of the glyphs rather than
   behind them. */
.script-gleam {
  position: absolute;
  inset: 0;
  pointer-events: none;
  text-shadow: none;
  background-image: linear-gradient(
    100deg,
    transparent 38%,
    var(--std-ink-lit) 47%,
    var(--std-hot) 50%,
    var(--std-ink-lit) 53%,
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
   finished words rather than words still arriving. Linear because a pass of
   light travels at a constant speed — an eased sweep hesitates in the middle,
   which is the part being watched. The opacity envelope keeps the band from
   popping on at full strength at one edge and cutting off at the other. */
.is-revealed .script-gleam {
  animation: scriptGleam 1.5s linear calc(var(--std-t0) + 2200ms) forwards;
}

@keyframes scriptGleam {
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

/* This design's date is tighter and a touch smaller than the shared role, which
   is tuned for `engraved`'s heavier block. */
.script-date {
  font-size: clamp(0.62rem, calc(var(--std-w) * 0.029), 0.85rem);
  letter-spacing: 0.18em;
  line-height: 1.4;
  /* letter-spacing also adds a trailing space after the *last* glyph, so a
     centred line sits half a space left of true centre — by a changing amount
     while the tracking settles, which makes the date creep sideways as it
     arrives. The matching negative margin cancels it at every frame, so it is
     animated alongside rather than set once. */
  padding-left: 0;
  margin-right: -0.18em;
  opacity: 0;
}

.is-revealed .script-date {
  animation: scriptDateTrackIn 1.2s var(--std-ease-out) calc(var(--std-t0) + 1450ms) forwards;
}

@keyframes scriptDateTrackIn {
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

@media (prefers-reduced-motion: reduce) {
  /* Pure decoration, and pure movement — nothing is lost by removing it. */
  .script-gleam {
    display: none;
  }

  .script-char {
    filter: none;
    transform: none;
  }

  .is-revealed .script-char {
    animation: scriptBloom 0.6s ease forwards;
    animation-delay: 0s;
  }

  .is-revealed .script-rule-top,
  .is-revealed .script-rule-bottom {
    animation-duration: 0.5s;
    animation-delay: 0s;
  }

  /* Still last, but it no longer waits out a tracking settle that was removed
     from this branch — the date fades in place here. */
  .is-revealed .script-rule-bottom {
    animation-delay: 0.9s;
  }

  .is-revealed .script-date {
    animation: scriptDateFadeIn 0.6s ease 0.3s forwards;
  }
}

/* Reduced-motion stand-in for scriptDateTrackIn: the same settled opacity, no
   tracking travel. Declared outside the media block so the scoped-style
   keyframe rename never has to reach into an at-rule. */
@keyframes scriptDateFadeIn {
  to {
    opacity: 0.8;
  }
}
</style>
