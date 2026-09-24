<template>
  <!-- The printed card's own convention: the invite line, then the guest's name
       on the dotted line a Khmer invitation leaves blank to be written in by
       hand. The line is always wider than the name, as the printed one is — a
       blank sized to its contents would read as an underline. -->
  <div class="gii" :class="{ 'is-revealed': revealed }">
    <div class="gii__invite"><slot name="invite" /></div>
    <div class="gii__line">
      <div class="gii__name"><slot name="name" /></div>
      <span class="gii__rule" aria-hidden="true" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ revealed: boolean }>()
</script>

<style scoped>
.gii {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 21rem;
  margin-inline: auto;
}

.gii__invite {
  font-size: 0.9375rem;
  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity 500ms var(--gid-ease-out),
    transform 500ms var(--gid-ease-out);
}

.gii__line {
  position: relative;
  width: 100%;
  margin-top: 0.375rem;
  padding: 0 0.5rem 0.625rem;
}

/* Settles onto the line rather than sliding in: the blur is what reads as ink
   landing, and it starts once the line is most of the way drawn. */
.gii__name {
  font-size: calc(clamp(1.625rem, 1.2rem + 2vw, 2.25rem) * var(--gid-name-scale, 1));
  line-height: 1.3;
  opacity: 0;
  filter: blur(6px);
  transform: translateY(5px);
  transition:
    opacity 700ms var(--gid-ease-out) 380ms,
    filter 700ms var(--gid-ease-out) 380ms,
    transform 700ms var(--gid-ease-out) 380ms;
}

/* Dots rather than `border-style: dotted`, whose dots are squares on most
   engines and whose spacing can't be set. Faded at both ends so the line reads
   as printed on the card, not as a box edge. Drawn from the centre out. */
.gii__rule {
  position: absolute;
  inset: auto 0 0;
  height: 3px;
  background-image: radial-gradient(circle, var(--gid-ink) 0 0.85px, transparent 1.2px);
  background-size: 7px 3px;
  background-repeat: repeat-x;
  background-position: center;
  opacity: 0.55;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent);
  clip-path: inset(0 50% 0 50%);
  transition: clip-path 900ms var(--gid-ease-out) 120ms;
}

.is-revealed .gii__invite {
  opacity: 0.82;
  transform: none;
}

.is-revealed .gii__name {
  opacity: 1;
  filter: blur(0);
  transform: none;
}

.is-revealed .gii__rule {
  clip-path: inset(0);
}

@media (prefers-reduced-motion: reduce) {
  .gii__invite,
  .gii__name,
  .gii__rule {
    transform: none;
    filter: none;
    clip-path: none;
  }

  .gii__rule {
    opacity: 0;
    transition: opacity 400ms ease;
  }

  .is-revealed .gii__rule {
    opacity: 0.55;
  }
}
</style>
