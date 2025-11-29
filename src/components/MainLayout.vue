<template>
  <div class="relative min-h-screen">
    <!-- Clean Minimal Gradient Background -->
    <div class="fixed inset-0 -z-10 premium-bg"></div>

    <!-- Desktop Top Navigation Bar -->
    <TopNavBar v-if="!hideTopNav" />

    <!-- Mobile Tab Bar -->
    <MobileTabBar v-if="!hideMobileTabBar" />

    <!-- Contact Us FAB -->
    <ContactUsFAB />

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
}

withDefaults(defineProps<Props>(), {
  hideTopNav: false,
  hideMobileTabBar: false
})
</script>

<style>
/* Premium minimal gradient background */
.premium-bg {
  background: linear-gradient(
    135deg,
    #f8fffe 0%,
    #f0fdf9 25%,
    #f5fbff 50%,
    #f0f9ff 75%,
    #f8fffe 100%
  );
}
</style>
