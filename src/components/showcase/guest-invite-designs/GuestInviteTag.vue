<template>
  <!-- The playful one: the name on a gift tag hung from a string, which swings
       in and comes to rest a little askew. For birthdays, housewarmings and
       parties — where "this one's for you" is the right register, and a formal
       dotted line would be the wrong one. -->
  <div class="git" :class="{ 'is-revealed': revealed }">
    <div class="git__hang">
      <!-- Runs from above the block down through the tag's eyelet. Stretched to
           whatever height the tag's top padding sets; the stroke stays a
           hairline because it doesn't scale with the box. -->
      <svg class="git__string" viewBox="0 0 24 60" preserveAspectRatio="none" aria-hidden="true">
        <path d="M12 60 C12 46 17 34 14 22 S10 6 12 0" vector-effect="non-scaling-stroke" />
      </svg>
      <div class="git__tag">
        <span class="git__eyelet" aria-hidden="true" />
        <div class="git__invite"><slot name="invite" /></div>
        <div class="git__name"><slot name="name" /></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ revealed: boolean }>()
</script>

<style scoped>
.git {
  --git-string: 2.25rem;
  --git-eyelet-top: 0.75rem;
  --git-eyelet: 0.875rem;

  display: flex;
  justify-content: center;
  width: 100%;
  /* The card's scroller is overflow-y: auto, so anything wider than it scrolls
     sideways — and a swinging tag's corners reach out at the top of each arc.
     The arc is kept small enough to stay inside a 360px phone's column; this
     only catches narrower ones, where a corner is trimmed for a moment rather
     than the whole invitation jolting sideways. `clip`, not `hidden`, so the
     string can still run up out of the block. */
  overflow-x: clip;
}

/* The pendulum: string and tag swing together about the string's top end,
   which is off the top of the block — as if tied to something above it. */
.git__hang {
  position: relative;
  width: min(88%, 15.5rem);
  padding-top: var(--git-string);
  transform-origin: 50% 0;
  transform: rotate(-2deg);
  opacity: 0;
}

.git__string {
  position: absolute;
  top: 0;
  left: 50%;
  z-index: 2;
  width: 1.5rem;
  height: calc(var(--git-string) + var(--git-eyelet-top) + var(--git-eyelet) / 2);
  transform: translateX(-50%);
  overflow: visible;
  fill: none;
  stroke: color-mix(in srgb, var(--gid-accent) 70%, transparent);
  stroke-width: 1.5;
  stroke-linecap: round;
  /* Out of nothing at the top, so the string is hung from somewhere rather
     than cut off at the block's edge. */
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 45%);
  mask-image: linear-gradient(to bottom, transparent, #000 45%);
}

.git__tag {
  position: relative;
  padding: calc(var(--git-eyelet-top) + var(--git-eyelet) + 0.75rem) 1.25rem 1.375rem;
  border-radius: 0.875rem;
  background: color-mix(in srgb, var(--gid-ink) 7%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--gid-ink) 24%, transparent);
}

/* A reinforcement ring, not a hole: the tag is a tint over the card, so a
   "hole" would show the same card through it and read as nothing. */
.git__eyelet {
  position: absolute;
  top: var(--git-eyelet-top);
  left: 50%;
  width: var(--git-eyelet);
  height: var(--git-eyelet);
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--gid-ink) 36%, transparent);
  transform: translateX(-50%);
}

.git__invite {
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  line-height: 1.5;
  opacity: 0.74;
}

.git__invite :deep(.gid-khmer) {
  font-size: 0.9375rem;
}

.git__name {
  font-size: calc(clamp(1.4rem, 1.1rem + 1.6vw, 1.875rem) * var(--gid-name-scale, 1));
  line-height: 1.3;
}

/* Released from one side, it overshoots, swings back less far each time and
   settles. Every segment eases in and out because a pendulum is fastest at the
   bottom of its arc and stops at each end. A keyframe rather than a transition
   is right here: it plays once, on arrival, and nothing can interrupt it. */
.is-revealed .git__hang {
  animation: git-swing 1600ms both;
}

@keyframes git-swing {
  0% {
    transform: rotate(10deg);
    opacity: 0;
    animation-timing-function: cubic-bezier(0.45, 0, 0.55, 1);
  }
  20% {
    opacity: 1;
  }
  38% {
    transform: rotate(-6deg);
    animation-timing-function: cubic-bezier(0.45, 0, 0.55, 1);
  }
  62% {
    transform: rotate(2.5deg);
    animation-timing-function: cubic-bezier(0.45, 0, 0.55, 1);
  }
  82% {
    transform: rotate(-3.5deg);
    animation-timing-function: cubic-bezier(0.45, 0, 0.55, 1);
  }
  100% {
    transform: rotate(-2deg);
    opacity: 1;
  }
}

/* Still hung askew — a resting angle is not motion — but it simply appears. */
@media (prefers-reduced-motion: reduce) {
  .is-revealed .git__hang {
    animation: git-fade 400ms ease both;
  }

  @keyframes git-fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
}
</style>
