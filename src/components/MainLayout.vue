<template>
  <div class="relative min-h-screen">
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

    <!-- Main Content -->
    <div
      :class="[
        'relative min-h-screen transition-all duration-300 ease-in-out',
        hideMobileTabBar ? '' : 'pb-20 lg:pb-0',
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
  hideContactFab?: boolean
  contactFabHasFabBelow?: boolean
  contactFabCanEdit?: boolean
}

withDefaults(defineProps<Props>(), {
  hideTopNav: false,
  hideMobileTabBar: false,
  hideContactFab: false,
  contactFabHasFabBelow: false,
  contactFabCanEdit: false
})
</script>

<style>
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
