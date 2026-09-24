<template>
  <!-- One flap of a split-flap board. Four halves: the two that stay put (the
       new digit's top, the old digit's bottom) and, while a change is
       turning over, the two that move — the old top falling forward over the
       hinge, then the new bottom swinging down onto it. Each change re-keys
       the moving pair, which restarts their animations from the top. -->
  <span class="fd" :style="{ '--fd-delay': `${delay}ms` }" aria-hidden="true">
    <span class="fd__half fd__half--top"><span class="fd__glyph">{{ current }}</span></span>
    <span class="fd__half fd__half--bottom"><span class="fd__glyph">{{ previous }}</span></span>
    <template v-if="turns > 0 && !reducedMotion">
      <span :key="`out-${turns}`" class="fd__half fd__half--top fd__flap fd__flap--out">
        <span class="fd__glyph">{{ previous }}</span>
      </span>
      <span :key="`in-${turns}`" class="fd__half fd__half--bottom fd__flap fd__flap--in">
        <span class="fd__glyph">{{ current }}</span>
      </span>
    </template>
  </span>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{ digit: string; delay?: number }>(), { delay: 0 })

const current = ref(props.digit)
const previous = ref(props.digit)
const turns = ref(0)

// Under reduced motion the flaps are never drawn: the two static halves simply
// change to the new digit, which is the whole of the information.
const reducedMotion = ref(false)
onMounted(() => {
  reducedMotion.value = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
})

watch(
  () => props.digit,
  (next, last) => {
    if (next === current.value) return
    previous.value = reducedMotion.value ? next : last
    current.value = next
    turns.value += 1
  },
)
</script>

<style scoped>
/* Sized in em of the board's own font-size, so a design scales the whole
   board with one number. */
.fd {
  position: relative;
  display: inline-block;
  width: 1.04em;
  height: 1.44em;
  border-radius: 0.14em;
  perspective: 4em;
  box-shadow:
    0 0.18em 0.42em -0.22em rgb(0 0 0 / 0.5),
    0 0.03em 0.06em rgb(0 0 0 / 0.18);
}

/* The axle pins either side of the hinge — the detail that makes a pair of
   rounded rectangles read as a flap on a board. */
.fd::before,
.fd::after {
  content: '';
  position: absolute;
  top: calc(50% - 0.09em);
  z-index: 3;
  width: 0.06em;
  height: 0.18em;
  border-radius: 0.03em;
  background: color-mix(in srgb, var(--crs-ink) 55%, black);
}

.fd::before {
  left: -0.02em;
}

.fd::after {
  right: -0.02em;
}

.fd__half {
  position: absolute;
  left: 0;
  right: 0;
  height: 50%;
  overflow: hidden;
  backface-visibility: hidden;
}

/* The top flap catches the light a shade brighter than the bottom one. */
.fd__half--top {
  top: 0;
  border-radius: 0.14em 0.14em 0 0;
  background: color-mix(in srgb, var(--crs-ink) 90%, var(--crs-paper));
}

/* The hinge is a hairline of shadow along the bottom flap's top edge. */
.fd__half--bottom {
  bottom: 0;
  border-radius: 0 0 0.14em 0.14em;
  background: var(--crs-ink);
  box-shadow: inset 0 1px 0 rgb(0 0 0 / 0.32);
}

/* The glyph is set in a box as tall as the whole flap, so each half shows
   exactly its own half of it. */
.fd__glyph {
  position: absolute;
  left: 0;
  right: 0;
  height: 200%;
  line-height: 1.44em;
  text-align: center;
  color: var(--crs-paper);
}

.fd__half--top .fd__glyph {
  top: 0;
}

.fd__half--bottom .fd__glyph {
  bottom: 0;
}

.fd__flap {
  z-index: 2;
}

/* Two halves of one physical turn: the old flap falls away under gravity —
   accelerating, so it eases in — and the new one lands and settles, easing
   out. Together they are one ease-in-out rotation through the hinge. */
.fd__flap--out {
  transform-origin: 50% 100%;
  animation: fdOut 240ms cubic-bezier(0.55, 0, 0.9, 0.45) var(--fd-delay) both;
}

.fd__flap--in {
  transform-origin: 50% 0%;
  transform: rotateX(90deg);
  animation: fdIn 300ms cubic-bezier(0.2, 0.9, 0.3, 1) calc(var(--fd-delay) + 240ms) both;
}

@keyframes fdOut {
  from {
    transform: rotateX(0deg);
  }
  to {
    transform: rotateX(-90deg);
  }
}

@keyframes fdIn {
  from {
    transform: rotateX(90deg);
  }
  to {
    transform: rotateX(0deg);
  }
}
</style>
