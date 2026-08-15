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
    class="lg:hidden fixed top-0 left-0 right-0 z-40 gpu-layer glass-header border-b pt-[env(safe-area-inset-top,0px)]"
    :class="isScrolled ? 'is-scrolled border-white/30 shadow-sm' : 'border-transparent'"
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
import { ref, onMounted, onUnmounted } from 'vue'

const isScrolled = ref(false)
const handleScroll = () => {
  isScrolled.value = window.scrollY > 0
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll() // A restored scroll position must not start the bar clear.
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
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
   treatment as TopNavBar's `.glass-nav`, where the reasoning is written out. */
.glass-header {
  background: rgba(255, 255, 255, 0);
  backdrop-filter: blur(20px) saturate(100%);
  -webkit-backdrop-filter: blur(20px) saturate(100%);
  transition:
    border-color 200ms ease,
    box-shadow 200ms ease,
    backdrop-filter 200ms ease,
    -webkit-backdrop-filter 200ms ease;
}

.glass-header.is-scrolled {
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}

.glass-header::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 200ms ease;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.42) 0%,
    rgba(255, 255, 255, 0.2) 55%,
    rgba(255, 255, 255, 0.28) 100%
  );
}

.glass-header.is-scrolled::before {
  opacity: 1;
}
</style>
