<template>
  <div class="relative min-h-screen">
    <!-- Background -->
    <div class="fixed inset-0 bg-gradient-to-br from-[#2ecc71]/5 via-white to-[#1e90ff]/5 -z-10"></div>

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
