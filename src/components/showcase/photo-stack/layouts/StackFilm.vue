<template>
  <div
    class="stack-layout"
    :class="{ 'is-entered': entered, 'is-closed': closed, 'is-dissolving': dissolving }"
    :style="{ '--fm-h': String(stripHeight) }"
  >
    <div class="fm-rig">
      <!-- A second strip behind the first, as a real pair of strips would lie:
           mostly hidden to begin with, then fanned out from under it. -->
      <div class="fm-strip fm-strip-back" aria-hidden="true" />

      <div class="fm-strip fm-strip-front">
        <div
          v-for="(photo, k) in photos"
          :key="photo.id"
          class="fm-frame"
          :class="{ 'is-shown': k < shown }"
        >
          <div class="fm-exposure">
            <StackPhoto
              :photo="photo"
              :index="k"
              :shown="k < shown"
              :alt="eventTitle"
              :get-media-url="getMediaUrl"
            />
          </div>
          <div class="fm-develop" aria-hidden="true" />
        </div>
      </div>

      <div class="fm-tape" :style="{ '--fm-tape': accentColor }" aria-hidden="true" />
    </div>

    <div class="fm-copy">
      <slot name="copy" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import StackPhoto from '../StackPhoto.vue'
import { filmStripHeight } from '../geometry'
import type { StackLayoutProps } from '../types'

/**
 * `film` — a strip of film swings down onto the table, and its frames develop
 * one at a time, each emerging from the dark, warm, and clearing to its true
 * colours. Then the strip beneath fans out, a piece of tape pins them, and the
 * Save the Date is written underneath.
 */
const props = defineProps<StackLayoutProps>()

const stripHeight = computed(() => filmStripHeight(props.photos.length))
</script>

<style scoped>
/* The strip and the copy are one block centred in the stage: the strip's
   centre sits 0.2w above the middle, so the block — strip, 0.1w of air, and a
   ~0.3w Save the Date — is centred however many frames the strip holds.
   --fm-h is the strip's height in stage widths (filmStripHeight). */
.stack-layout {
  position: absolute;
  inset: 0;
  --fm-top: calc(50% - var(--sk-w) * 0.2 - var(--sk-w) * var(--fm-h) / 2);
}

.fm-rig {
  position: absolute;
  left: calc(50% - var(--sk-w) * 0.22);
  top: var(--fm-top);
  width: calc(var(--sk-w) * 0.44);
  height: calc(var(--sk-w) * var(--fm-h));
  opacity: 0;
  transform: translateY(calc(var(--sk-w) * -0.3)) rotate(-7deg);
}

/* Swung down onto the table, coming to rest a little off square. */
.is-entered .fm-rig {
  opacity: 1;
  transform: rotate(-2deg);
  transition:
    transform 1.2s var(--sk-ease-out),
    opacity 0.5s var(--sk-ease-out);
}

.is-dissolving .fm-rig {
  transform: rotate(-2deg) scale(0.96);
  transition: transform 1.2s var(--sk-ease-atmos);
}

/* Film base: near-black, fixed — it is reproduced artwork. Sprocket holes run
   down both edges: one hard-stopped gradient, tiled, so they cost no elements. */
.fm-strip {
  position: absolute;
  inset: 0;
  border-radius: 2px;
  background-color: #0e0d0c;
  box-shadow:
    0 2px 4px rgba(10, 8, 6, 0.3),
    0 20px 40px -16px rgba(10, 8, 6, 0.5);
}

.fm-strip::before,
.fm-strip::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: calc(var(--sk-w) * 0.05);
  background-image: linear-gradient(to bottom, rgba(236, 230, 220, 0.82) 0 45%, transparent 45% 100%);
  background-size: 40% calc(var(--sk-w) * 0.034);
  background-position: center calc(var(--sk-w) * 0.012);
  background-repeat: repeat-y;
}

.fm-strip::before {
  left: 0;
}

.fm-strip::after {
  right: 0;
}

.fm-strip-back {
  transform: translateX(3%) rotate(3deg);
  filter: brightness(0.85);
}

/* The strip beneath fans out from under the first — the closing gesture that
   gathers the two into a keepsake before the tape pins them. */
.is-closed .fm-strip-back {
  transform: translateX(10%) rotate(5.5deg);
  transition: transform 1s var(--sk-ease-in-out);
}

.fm-strip-front {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(var(--sk-w) * 0.03);
  padding: calc(var(--sk-w) * 0.045) 0;
}

.fm-frame {
  position: relative;
  width: calc(var(--sk-w) * 0.34);
  aspect-ratio: 4 / 3;
  background: #1c1a18;
  --sp-empty: #1c1a18;
}

/* Developing: the photograph comes up out of the dark slowly, under a warm
   cast that clears on its own, longer clock — so it emerges sepia and settles
   into its own colours, the way a print does in the tray. */
.fm-exposure {
  position: absolute;
  inset: 0;
  opacity: 0;
}

.is-shown .fm-exposure {
  opacity: 1;
  transition: opacity 1.4s var(--sk-ease-atmos);
}

.fm-develop {
  position: absolute;
  inset: 0;
  background: #d39a5c;
  mix-blend-mode: multiply;
  opacity: 0;
  pointer-events: none;
}

.is-shown .fm-develop {
  animation: fmDevelop 2.4s var(--sk-ease-atmos) forwards;
}

@keyframes fmDevelop {
  from {
    opacity: 0.7;
  }
  to {
    opacity: 0;
  }
}

/* Washi tape in the template's accent, torn at both ends. It presses on —
   down from a touch larger — after the strips have fanned. */
.fm-tape {
  position: absolute;
  left: 50%;
  top: calc(var(--sk-w) * -0.03);
  width: calc(var(--sk-w) * 0.26);
  height: calc(var(--sk-w) * 0.065);
  z-index: 2;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0) 45%, rgba(0, 0, 0, 0.08)),
    var(--fm-tape);
  clip-path: polygon(
    0% 8%, 3% 0%, 97% 4%, 100% 14%, 98% 30%, 100% 50%, 97% 70%, 100% 88%, 97% 100%,
    3% 96%, 0% 84%, 2% 64%, 0% 46%, 3% 28%
  );
  opacity: 0;
  transform: translateX(-50%) rotate(-5deg) scale(1.15);
}

.is-closed .fm-tape {
  opacity: 0.88;
  transform: translateX(-50%) rotate(-3deg) scale(1);
  transition:
    transform 0.45s var(--sk-ease-out) 0.6s,
    opacity 0.3s var(--sk-ease-out) 0.6s;
}

.fm-copy {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(var(--fm-top) + var(--sk-w) * var(--fm-h) + var(--sk-w) * 0.1);
  z-index: 5;
  display: flex;
  justify-content: center;
}

/* No swing, no fan, no press: the strips lie where they end up, and the
   frames, the tape and the copy fade in. */
@media (prefers-reduced-motion: reduce) {
  .fm-rig,
  .is-entered .fm-rig,
  .is-dissolving .fm-rig {
    transform: rotate(-2deg);
  }

  .fm-strip-back,
  .is-closed .fm-strip-back {
    transform: translateX(10%) rotate(5.5deg);
  }

  .fm-tape,
  .is-closed .fm-tape {
    transform: translateX(-50%) rotate(-3deg);
  }

  .is-closed .fm-tape {
    transition: opacity 0.4s ease;
  }

  .is-shown .fm-develop {
    animation: none;
  }

  .is-shown .fm-exposure {
    transition-duration: 0.5s;
  }
}
</style>
