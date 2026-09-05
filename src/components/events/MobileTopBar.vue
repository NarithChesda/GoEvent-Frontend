<template>
  <!--
    On phones and tablets this *is* the page header — not a second band above
    it. `PageHeaderRow` teleports itself in here below the nav breakpoint, so
    the bar carries the page's own title and controls and nothing else. It used
    to hold a logo and a search icon over a separate title row underneath:
    56px of chrome saying what the bottom tab bar already said, stacked on the
    row that did the real work.

    The bar itself only owns the surface — transparent while the page is at the
    top, frosted the moment content starts sliding underneath it.
  -->
  <header
    ref="headerRef"
    class="lg:hidden fixed top-0 left-0 right-0 z-40 gpu-layer glass-header pt-[env(safe-area-inset-top,0px)]"
  >
    <!-- `relative` keeps this row above the glass sheet `.glass-header::before`
         lays over the bar — an absolutely-positioned pseudo paints on top of
         non-positioned in-flow siblings. -->
    <div id="mobile-page-header" class="relative h-14 px-4 flex items-center"></div>
  </header>

  <!-- Spacer -->
  <div class="lg:hidden h-[calc(env(safe-area-inset-top,0px)+3.5rem)]"></div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useScrollEdge } from '@/composables/useScrollEdge'

// Same treatment as TopNavBar: the material tracks the scroll continuously
// through `--nav-edge` rather than flipping at the first pixel.
const headerRef = ref<HTMLElement>()
useScrollEdge(headerRef)
</script>

<style scoped>
/* Force GPU compositing for smooth scrolling */
.gpu-layer {
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  perspective: 1000px;
  -webkit-perspective: 1000px;
}

/* Transparent at rest, liquid glass once the page scrolls under it — the same
   treatment as TopNavBar's `.glass-nav`, where the reasoning is written out.
   Every value rides `--nav-edge`, the scroll progress `useScrollEdge` writes
   onto this element, so nothing here transitions and there is no tween for a
   reversal to have to wait out. */
.glass-header {
  --nav-edge: 0;
  background: transparent;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.glass-header::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: var(--nav-edge);
  backdrop-filter: saturate(180%);
  -webkit-backdrop-filter: saturate(180%);
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.42) 0%,
    rgba(255, 255, 255, 0.2) 55%,
    rgba(255, 255, 255, 0.28) 100%
  );
}

/* A soft scroll edge instead of the hairline and drop shadow: the bar dissolves
   into the page it is floating over rather than ruling a line across it. */
.glass-header::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  height: 1.25rem;
  pointer-events: none;
  opacity: var(--nav-edge);
  background: linear-gradient(to bottom, rgba(15, 23, 42, 0.06), rgba(15, 23, 42, 0));
}

@media (prefers-reduced-transparency: reduce) {
  .glass-header {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }

  /* Solid, but painted with the page's own gradient stack sized to the
     viewport — a flat white bar would draw the seam the translucency exists to
     avoid, since the page's bloom peaks on exactly this strip. */
  .glass-header::before {
    opacity: 1;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background: var(--premium-bg);
    background-repeat: no-repeat;
    background-size: 100vw 100vh;
  }
}

@media (prefers-contrast: more) {
  .glass-header {
    border-bottom: 1px solid rgb(100 116 139);
  }
}
</style>
