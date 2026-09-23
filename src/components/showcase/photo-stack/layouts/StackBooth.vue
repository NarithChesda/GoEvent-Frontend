<template>
  <div class="stack-layout" :class="{ 'is-entered': entered, 'is-dissolving': dissolving }">
    <div class="bt-card">
      <div
        v-for="(photo, k) in photos"
        :key="photo.id"
        class="bt-frame"
        :class="{ 'is-shown': k < shown }"
      >
        <div class="bt-exposure">
          <StackPhoto
            :photo="photo"
            :index="k"
            :shown="k < shown"
            :alt="eventTitle"
            :get-media-url="getMediaUrl"
          />
        </div>
        <div class="bt-flash" aria-hidden="true" />
      </div>

      <div class="bt-copy">
        <slot name="copy" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import StackPhoto from '../StackPhoto.vue'
import type { StackLayoutProps } from '../types'

/**
 * `booth` — a photo-booth strip. The card rises into frame with its windows
 * empty, then each one is taken in turn: a flash, and the photograph is there
 * as it fades. The Save the Date is written at the foot of the card, where a
 * booth prints its caption.
 *
 * The one layout whose copy sits on paper rather than on the table, which is
 * why its spec in photoStack.ts says `copyGround: 'paper'`.
 */
defineProps<StackLayoutProps>()
</script>

<style scoped>
.stack-layout {
  position: absolute;
  inset: 0;
}

/* Booth stock: a cool white, fixed rather than template-driven for the pile's
   reason — it is reproduced artwork. Frames are 3:2 at 0.54w; three of them
   plus the copy make a card ~1.55w tall, 87% of a 9:16 stage. */
.bt-card {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(var(--sk-w) * 0.64);
  padding: calc(var(--sk-w) * 0.05) calc(var(--sk-w) * 0.05) calc(var(--sk-w) * 0.035);
  display: flex;
  flex-direction: column;
  gap: calc(var(--sk-w) * 0.035);
  background: linear-gradient(170deg, #f7f6f3 0%, #efede8 100%);
  border-radius: 3px;
  box-shadow:
    0 0 0 0.5px rgba(20, 18, 14, 0.1),
    0 2px 4px rgba(20, 18, 14, 0.14),
    0 18px 40px -14px rgba(20, 18, 14, 0.42);
  opacity: 0;
  transform: translate(-50%, calc(-50% + var(--sk-w) * 0.35)) rotate(3deg);
}

/* The card rises into frame, the way a strip slides out of the machine, and
   settles square. */
.is-entered .bt-card {
  opacity: 1;
  transform: translate(-50%, -50%) rotate(0deg);
  transition:
    transform 1.1s var(--sk-ease-out),
    opacity 0.4s var(--sk-ease-out);
}

.is-dissolving .bt-card {
  transform: translate(-50%, -50%) scale(0.96);
  transition: transform 1.2s var(--sk-ease-atmos);
}

.bt-frame {
  position: relative;
  aspect-ratio: 3 / 2;
  background: #d9d5cd;
  --sp-empty: #d9d5cd;
}

/* The photograph is in the window from the flash's peak, not before: the
   frame shows empty paper until it is taken. A 0s transition delayed to the
   peak, so the swap happens under a white frame and is never seen. */
.bt-exposure {
  position: absolute;
  inset: 0;
  opacity: 0;
}

.is-shown .bt-exposure {
  opacity: 1;
  transition: opacity 0s 90ms;
}

/* The flash: up in ~90ms, then a long decay that uncovers the photograph —
   revealed by uncovering rather than faded in on top. Keyframes rather than a
   transition, because it goes up and comes back down; it only ever runs once
   per frame. */
.bt-flash {
  position: absolute;
  inset: 0;
  background: #fffdf8;
  opacity: 0;
  pointer-events: none;
}

.is-shown .bt-flash {
  animation: btFlash 1.1s linear forwards;
}

@keyframes btFlash {
  0% {
    opacity: 0;
  }
  8% {
    opacity: 1;
    animation-timing-function: cubic-bezier(0.33, 1, 0.68, 1);
  }
  100% {
    opacity: 0;
  }
}

/* The Save the Date sits inside a card 0.54w across, so the whole block is set
   at 86% — overriding its own --std-w rather than scaling it, so it lays out
   at the smaller size instead of keeping its full-size box. */
.bt-copy {
  display: flex;
  justify-content: center;
}

.bt-copy :deep(.std) {
  --std-w: calc(var(--sk-w) * 0.86);
}

/* No rise and no flash: the card is simply there, and each frame fades in. */
@media (prefers-reduced-motion: reduce) {
  .bt-card,
  .is-entered .bt-card,
  .is-dissolving .bt-card {
    transform: translate(-50%, -50%);
  }

  .is-shown .bt-exposure {
    transition: opacity 0.5s ease;
  }

  .is-shown .bt-flash {
    animation: none;
  }
}
</style>
