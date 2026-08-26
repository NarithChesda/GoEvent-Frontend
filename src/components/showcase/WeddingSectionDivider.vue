<template>
  <div
    class="flex justify-center my-8 sm:my-10 laptop-sm:my-10 laptop-md:my-12 laptop-lg:my-14 desktop:my-12"
  >
    <div class="bow-tie-divider">
      <!-- Extended Left Line -->
      <div class="divider-line left-line" :style="{ backgroundColor: primaryColor }"></div>

      <!-- Bow Tie Center -->
      <div class="bow-tie-center">
        <svg
          class="bow-tie-svg"
          :style="{ color: primaryColor }"
          viewBox="0 0 40 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- Left bow -->
          <path d="M5 10 Q12 5 18 10 Q12 15 5 10 Z" fill="currentColor" opacity="0.8" />
          <!-- Right bow -->
          <path d="M35 10 Q28 5 22 10 Q28 15 35 10 Z" fill="currentColor" opacity="0.8" />
          <!-- Center knot -->
          <ellipse cx="20" cy="10" rx="3" ry="6" fill="currentColor" />
          <!-- Center highlight -->
          <ellipse cx="20" cy="10" rx="1.5" ry="4" fill="rgba(255, 255, 255, 0.3)" />
        </svg>
      </div>

      <!-- Extended Right Line -->
      <div class="divider-line right-line" :style="{ backgroundColor: primaryColor }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  primaryColor: string
}

defineProps<Props>()
</script>

<style scoped>
/* No hover state: a divider is decoration, not a control, and the one
   it had started a second infinite animation on something nobody can
   click. */
.bow-tie-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 400px;
  position: relative;
}

/* One layer. This was a solid primaryColor line at 0.4 with a
   currentColor gradient painted over it at 0.3 — two stacked lines in
   two different colours (the overlay resolved against inherited text
   colour, never the brand colour), which is what made the rule read
   muddy rather than crisp. The fade toward the outer edge is kept, as
   a mask on the one line. */
.divider-line {
  height: 1px;
  flex: 1;
  opacity: 0.45;
}

.left-line {
  margin-right: 1rem;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000);
  mask-image: linear-gradient(90deg, transparent, #000);
}

.right-line {
  margin-left: 1rem;
  -webkit-mask-image: linear-gradient(90deg, #000, transparent);
  mask-image: linear-gradient(90deg, #000, transparent);
}

.bow-tie-center {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
}

/* No idle animation. gentle-glow ran forever, on eight dividers per
   invitation, in the reader's peripheral vision, for no purpose —
   motion the reader sees constantly and never acts on. */
.bow-tie-svg {
  width: 32px;
  height: 16px;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
}

@media (min-width: 640px) {
  .bow-tie-svg {
    width: 40px;
    height: 20px;
  }

  .left-line {
    margin-right: 1.5rem;
  }

  .right-line {
    margin-left: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .bow-tie-svg {
    width: 48px;
    height: 24px;
  }

  .bow-tie-divider {
    max-width: 500px;
  }

  .left-line {
    margin-right: 2rem;
  }

  .right-line {
    margin-left: 2rem;
  }
}
</style>
