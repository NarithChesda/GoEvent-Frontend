<template>
  <!-- `nav-inset-none` zeroes the bottom-chrome vars for the pages that run
       without a tab bar, so anything anchored to `--fab-bottom` sits on the
       viewport edge there instead of hovering over a bar that isn't rendered.
       A page that swaps the tab bar for bottom chrome of its own (the service
       detail CTA pill) keeps the inset: the band is still occupied, so the
       FABs and the page's own bottom pad still have to clear it. -->
  <div
    class="relative min-h-screen"
    :class="{ 'nav-inset-none': hideMobileTabBar && !hasCustomBottomBar }"
  >
    <!-- Clean Minimal Gradient Background -->
    <div class="fixed inset-0 -z-10 premium-bg"></div>

    <!-- Desktop Top Navigation Bar -->
    <TopNavBar v-if="!hideTopNav" />

    <!-- Mobile Tab Bar -->
    <MobileTabBar v-if="!hideMobileTabBar" />

    <!-- Contact Us FAB (single global instance; views configure it via props) -->
    <ContactUsFAB
      v-if="!hideContactFab"
      :has-fab-below="contactFabHasFabBelow"
      :can-edit="contactFabCanEdit"
    />

    <!-- Main Content. The pad is the bar's own footprint — `--nav-inset` is
         already 0 above the nav breakpoint and on `nav-inset-none` pages, so
         this needs no breakpoint or conditional of its own. -->
    <div
      :class="[
        'relative min-h-screen transition-all duration-300 ease-in-out pb-[var(--nav-inset)]',
        hideTopNav ? '' : 'lg:pt-16'
      ]"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import TopNavBar from './TopNavBar.vue'
import MobileTabBar from './MobileTabBar.vue'
import ContactUsFAB from './ContactUsFAB.vue'

interface Props {
  hideTopNav?: boolean
  hideMobileTabBar?: boolean
  /**
   * The page renders its own bottom chrome in the band the tab pill would
   * occupy. Only meaningful alongside `hideMobileTabBar` — it keeps
   * `--nav-inset` (and the FAB slots above it) at full height so the page's
   * own bar is not something every other fixed element has to know about.
   */
  hasCustomBottomBar?: boolean
  hideContactFab?: boolean
  contactFabHasFabBelow?: boolean
  contactFabCanEdit?: boolean
}

withDefaults(defineProps<Props>(), {
  hideTopNav: false,
  hideMobileTabBar: false,
  hasCustomBottomBar: false,
  hideContactFab: false,
  contactFabHasFabBelow: false,
  contactFabCanEdit: false
})
</script>

<style>
/*
  The bottom chrome's footprint, as three numbers everything fixed to the
  bottom of the screen positions against. Nothing may go back to hardcoding
  these: MobileTabBar is a *floating* pill, so the space it occupies is its own
  height plus the gap it floats above the edge by — and that gap is the safe
  area on a phone that has one. The real figure is 66px on Android and ~88px on
  a notched iPhone, which is why the old fixed `bottom-20` (80px) left the FABs
  tucked under the pill on the latter.

  --nav-inset   the band at the bottom of the viewport the pill occupies; also
                the pad a scrolling page needs so its last row clears the pill
  --fab-bottom  the bottom edge of the primary floating action above it
  --fab-stack-2 the slot above that one, for a secondary FAB

  Zero on desktop, where there is no pill and the FABs sit on the page edge.
*/
:root {
  /* 3.375rem tracks MobileTabBar's pill: the h-10 row, p-1.5 twice, and the
     1px border twice — the border is easy to forget and leaves content tucked
     under the pill's edge. */
  --nav-inset: calc(3.375rem + max(0.75rem, env(safe-area-inset-bottom, 0px)));
  --fab-bottom: calc(var(--nav-inset) + 0.75rem);
  /* Clears the 3rem mobile FAB below, plus the same 0.75rem gap again. */
  --fab-stack-2: calc(var(--fab-bottom) + 3.75rem);
}

.nav-inset-none {
  --nav-inset: 0px;
  --fab-bottom: 0.75rem;
  --fab-stack-2: 4.5rem;
}

@media (min-width: 1024px) {
  :root,
  .nav-inset-none {
    --nav-inset: 0px;
    --fab-bottom: 1rem;
    /* 1rem + the 3.5rem desktop FAB + a 1rem gap. */
    --fab-stack-2: 5.5rem;
  }
}

/*
  Premium minimal gradient background, lit from the top by a brand-primary
  bloom. The bloom is a radial gradient rather than a blurred element: same
  diffuse glow, but nothing extra to composite on a layer that covers every
  page. It is wider than the viewport and centred above it, so only the soft
  middle of the falloff is ever on screen — no visible arc at the edges.
*/
.premium-bg {
  background:
    radial-gradient(
      120% 26rem at 50% -4rem,
      rgba(46, 204, 113, 0.28) 0%,
      rgba(46, 204, 113, 0.1) 45%,
      rgba(46, 204, 113, 0) 75%
    ),
    linear-gradient(
      135deg,
      #f8fffe 0%,
      #f0fdf9 25%,
      #f5fbff 50%,
      #f0f9ff 75%,
      #f8fffe 100%
    );
}
</style>
