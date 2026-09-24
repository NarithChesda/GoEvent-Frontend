<template>
  <!-- The name as it would be at the guest's seat: a folded place card. It is
       the one design with a surface, and the surface is earned — at a
       reception the card IS where your name is written. It arrives by standing
       up off the table, hinged on its bottom edge, which is the only way a
       real one ever moves. -->
  <div class="gip" :class="{ 'is-revealed': revealed }">
    <div class="gip__stand">
      <div class="gip__card">
        <div class="gip__invite"><slot name="invite" /></div>
        <div class="gip__name"><slot name="name" /></div>
      </div>
      <span class="gip__shadow" aria-hidden="true" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ revealed: boolean }>()
</script>

<style scoped>
.gip {
  display: flex;
  justify-content: center;
  width: 100%;
}

/* Perspective lives on the parent so the card itself can come to rest on
   `transform: none` — a 3D transform left on it at rest would keep its text on
   a composited layer for the whole visit. */
/* Narrower than the column on purpose: at full width it read as a content
   panel with a header strip, not as a card standing on a table. */
.gip__stand {
  position: relative;
  width: min(88%, 17.5rem);
  perspective: 700px;
}

/* The fold: a narrow band across the top in a deeper tint, parted from the
   face by a crease. That band is the back half of the card tipping away over
   the fold, and it is what makes a rectangle read as a card that stands up.
   The whole surface is ink mixed into transparency — see the contract in
   GuestInviteSection. */
.gip__card {
  position: relative;
  z-index: 1;
  padding: 1.875rem 1.5rem 1.5rem;
  border-radius: 3px;
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--gid-ink) 11%, transparent) 0 0.6rem,
    color-mix(in srgb, var(--gid-ink) 22%, transparent) 0.6rem calc(0.6rem + 1px),
    color-mix(in srgb, var(--gid-ink) 5%, transparent) calc(0.6rem + 1px)
  );
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--gid-ink) 20%, transparent);
  transform-origin: 50% 100%;
  transform: rotateX(62deg);
  opacity: 0;
  transition:
    transform 950ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 450ms var(--gid-ease-out);
}

.gip__invite {
  margin-bottom: 0.375rem;
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  line-height: 1.5;
  opacity: 0.74;
}

.gip__invite :deep(.gid-khmer) {
  font-size: 0.9375rem;
}

.gip__name {
  font-size: calc(clamp(1.5rem, 1.15rem + 1.8vw, 2.125rem) * var(--gid-name-scale, 1));
  line-height: 1.3;
}

/* A soft contact shadow on the table, not a drop shadow on the card: the card
   is standing, so its shadow falls on the surface in front of it. */
.gip__shadow {
  position: absolute;
  left: 7%;
  right: 7%;
  bottom: -0.5rem;
  height: 1rem;
  background: radial-gradient(
    closest-side,
    color-mix(in srgb, var(--gid-ink) 22%, transparent),
    transparent
  );
  opacity: 0;
  transform: scaleX(0.7);
  transition:
    opacity 700ms var(--gid-ease-out) 200ms,
    transform 950ms cubic-bezier(0.22, 1, 0.36, 1);
}

.is-revealed .gip__card {
  transform: none;
  opacity: 1;
}

.is-revealed .gip__shadow {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .gip__card,
  .gip__shadow {
    transform: none;
  }
}
</style>
