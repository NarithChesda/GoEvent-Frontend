<template>
  <!-- The printed reply card both the `card` and `envelope` shells set the
       form on: light stock, a second hairline border inset from the edge, and
       the R.S.V.P. mark over a small ornament. The shell decides how it
       arrives; this is only the card. -->
  <div class="rcf" :class="{ 'is-revealed': revealed }" :style="{ '--rcf-delay': `${ornamentDelay}ms` }">
    <div class="rcf__head">
      <span class="rcf__mark" :class="{ 'is-khmer': khmer }" :style="{ fontFamily: textFont }">
        {{ mark }}
      </span>
      <span class="rcf__ornament" aria-hidden="true">
        <span class="rcf__rule" />
        <span class="rcf__lozenge" />
        <span class="rcf__rule rcf__rule--end" />
      </span>
    </div>
    <div class="rcf__body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    revealed: boolean
    mark: string
    textFont: string
    khmer: boolean
    /** When the ornament draws, after the card itself has arrived. */
    ornamentDelay?: number
  }>(),
  { ornamentDelay: 520 },
)
</script>

<style scoped>
/* The invitation's one paper (stationery.ts): the calendar card's stock,
   corner and lift when the template draws one, else the shared warm white —
   so a reply card under a calendar card is the same card stock, not a second
   white beside it. The ink is the template's own unless it won't read on it. */
.rcf {
  position: relative;
  padding: 1.6rem 1.25rem var(--rcf-pad-bottom, 1.5rem);
  border-radius: var(--crs-radius, 4px);
  color: var(--crs-card-ink);
  background: var(--crs-card-paper);
}

/* The inset border — the detail that makes stock read as a printed card
   rather than a panel. */
.rcf::before {
  content: '';
  position: absolute;
  inset: 7px;
  border: 1px solid color-mix(in srgb, var(--crs-card-ink) 20%, transparent);
  /* Concentric with the card's own corner, 7px in. */
  border-radius: max(1px, calc(var(--crs-radius, 4px) - 7px));
  pointer-events: none;
}

/* The lift is its own layer, so a shell that clips the card while it arrives
   can hold the shadow back until it has landed (--rcf-shadow) rather than
   have it pop in. It is the shared paper's (its edge hairline included, which
   is why it sits over the paper, not under it: it only paints shadows). */
.rcf::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: var(
    --crs-paper-shadow,
    inset 0 0 0 1px color-mix(in srgb, currentColor 8%, transparent),
    0 1px 2px rgb(0 0 0 / 0.06),
    0 16px 36px -16px rgb(0 0 0 / 0.3)
  );
  opacity: var(--rcf-shadow, 1);
  transition: opacity 400ms ease;
  pointer-events: none;
}

.rcf__head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1.1rem;
}

.rcf__mark {
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.3em;
  /* Tracking adds space after the last letter too; this pays it back so the
     mark sits on the card's centre line. */
  margin-right: -0.3em;
  text-transform: uppercase;
  line-height: 1.4;
}

.rcf__mark.is-khmer {
  font-size: 0.9375rem;
  font-weight: 500;
  letter-spacing: 0;
  margin-right: 0;
  text-transform: none;
  line-height: 1.7;
}

.rcf__ornament {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

/* Each rule draws out from the lozenge, after the card has landed. */
.rcf__rule {
  width: 2rem;
  height: 1px;
  background: color-mix(in srgb, var(--crs-card-ink) 36%, transparent);
  transform: scaleX(0);
  transform-origin: right center;
  transition: transform 700ms cubic-bezier(0.23, 1, 0.32, 1) var(--rcf-delay);
}

.rcf__rule--end {
  transform-origin: left center;
}

.rcf__lozenge {
  width: 0.3rem;
  height: 0.3rem;
  background: var(--crs-accent);
  /* Grows from a visible seed, never from nothing. */
  opacity: 0;
  transform: rotate(45deg) scale(0.4);
  transition:
    opacity 350ms cubic-bezier(0.23, 1, 0.32, 1) calc(var(--rcf-delay) - 120ms),
    transform 450ms cubic-bezier(0.23, 1, 0.32, 1) calc(var(--rcf-delay) - 120ms);
}

.is-revealed .rcf__rule {
  transform: none;
}

.is-revealed .rcf__lozenge {
  opacity: 1;
  transform: rotate(45deg);
}

.rcf__body {
  position: relative;
}

@media (prefers-reduced-motion: reduce) {
  .rcf__rule {
    transform: none;
  }

  .rcf__lozenge {
    transform: rotate(45deg);
  }
}
</style>
