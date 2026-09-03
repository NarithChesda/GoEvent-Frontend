<template>
  <div class="std std-poster" :class="{ 'is-revealed': revealed }">
    <div class="poster-lines">
      <p
        v-for="(line, i) in lines"
        :key="i"
        class="poster-line std-mask-up"
        :class="[inkClass, `poster-line-${i + 1}`]"
        :style="{ '--std-line-delay': `${i * 140}ms` }"
      >
        {{ line }}
      </p>
    </div>

    <div class="std-rule poster-rule" />

    <p v-if="numericDate" class="poster-date std-rise" :class="inkClass">{{ numericDate }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SaveTheDateDesignProps } from '../types'

/**
 * `poster` — the label itself set large and stacked at tight leading, with the
 * numeric date small beneath a hairline.
 *
 * The one design in the set that isn't wedding-coded: no script, no ornament,
 * no seal. Every other option leans traditional, which leaves a template for a
 * birthday, a housewarming or a corporate evening with nothing that fits, and
 * `minimal` is a retreat rather than an answer. This is the answer — a title
 * card that reads as contemporary print.
 *
 * Its gesture is the **mask reveal**: each line is drawn in full and uncovered
 * from the baseline up, so the glyphs never move relative to each other. That
 * is the right gesture specifically because the type is large — at this size a
 * rise or a per-character bloom is a lot of pixels in motion, and the eye
 * follows the movement instead of reading the words.
 */
const props = defineProps<SaveTheDateDesignProps>()

const inkClass = computed(() => (props.ink === 'metal' ? 'std-metal' : 'std-solid'))

/**
 * Break the label into stacked lines. `Save the Date` becomes `SAVE` / `THE
 * DATE` — the first word alone, the rest together — which is the split that
 * gives the block its shape: a short line over a long one. A one-word label
 * stays on one line, and a longer one keeps everything after the first word
 * together rather than fragmenting into a paragraph.
 */
const lines = computed(() => {
  const words = props.label.trim().split(/\s+/).filter(Boolean)
  if (words.length <= 1) return words
  return [words[0], words.slice(1).join(' ')]
})
</script>

<style scoped>
.std-poster {
  gap: calc(var(--std-w) * 0.038);
  padding-inline: calc(var(--std-w) * 0.06);
}

.poster-lines {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Tight leading is the whole composition: at a normal 1.2 the two lines read as
   two headings, at 0.92 they read as one mass of type. The tracking has to come
   *down* as the size goes up — the 0.34em that gives `engraved`'s small caps
   their air would blow this apart. */
.poster-line {
  font-family: var(--std-display);
  font-size: calc(var(--std-w) * 0.135);
  line-height: 0.92;
  letter-spacing: 0.06em;
  padding-left: 0.06em;
  text-transform: uppercase;
  font-weight: 600;
  white-space: nowrap;
}

.is-revealed .poster-line {
  animation:
    stdMaskUp 900ms var(--std-ease-wipe) calc(var(--std-t0) + var(--std-line-delay)) forwards,
    stdSheen 2.2s ease-in-out calc(var(--std-t0) + 1300ms) forwards;
}

.poster-rule {
  width: calc(var(--std-w) * 0.28);
}

.is-revealed .poster-rule {
  animation: stdRuleDraw 800ms var(--std-ease-out) calc(var(--std-t0) + 700ms) forwards;
}

.poster-date {
  font-family: var(--std-display);
  font-size: calc(var(--std-w) * 0.034);
  letter-spacing: 0.3em;
  padding-left: 0.3em;
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
  opacity: 0;
}

.is-revealed .poster-date {
  animation: stdRise 900ms var(--std-ease-out) calc(var(--std-t0) + 950ms) forwards;
}

@media (prefers-reduced-motion: reduce) {
  .is-revealed .poster-line {
    animation:
      stdMaskUp 500ms ease var(--std-line-delay) forwards,
      stdSheen 1ms linear forwards;
  }

  .is-revealed .poster-rule {
    animation-duration: 400ms;
    animation-delay: 300ms;
  }

  .is-revealed .poster-date {
    animation-duration: 500ms;
    animation-delay: 450ms;
  }
}
</style>
