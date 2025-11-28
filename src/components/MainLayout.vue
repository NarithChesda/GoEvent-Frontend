<template>
  <div class="relative min-h-screen">
    <!-- Background -->
    <div class="fixed inset-0 bg-gradient-to-br from-[#2ecc71]/5 via-white to-[#1e90ff]/5 -z-10"></div>

    <!-- Desktop Sidebar (can be hidden) -->
    <AppSidebar v-if="!hideHomeSidebar" />

    <!-- Home Sidebar (shown when hamburger is clicked while hideHomeSidebar is true) -->
    <!-- This pushes content to the right instead of overlapping -->
    <AppSidebar
      v-if="hideHomeSidebar && showHomeSidebarOverlay"
      class="!flex z-40"
    />

    <!-- Mobile Tab Bar -->
    <MobileTabBar v-if="!hideMobileTabBar" />

    <!-- Main Content -->
    <div
      :class="[
        'relative min-h-screen transition-all duration-300 ease-in-out',
        hideMobileTabBar ? '' : 'pb-20 lg:pb-0',
        hideHomeSidebar
          ? (showHomeSidebarOverlay ? (isCollapsed ? 'lg:ml-24' : 'lg:ml-64') : 'lg:ml-0')
          : (isCollapsed ? 'lg:ml-24' : 'lg:ml-64')
      ]"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, provide, readonly } from 'vue'
import AppSidebar from './AppSidebar.vue'
import MobileTabBar from './MobileTabBar.vue'

interface Props {
  hideHomeSidebar?: boolean
  hideMobileTabBar?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hideHomeSidebar: false,
  hideMobileTabBar: false
})

const { isCollapsed } = useSidebar()

// State for showing home sidebar overlay
const showHomeSidebarOverlay = ref(false)

// Provide method for child components to toggle the overlay
const toggleHomeSidebarOverlay = () => {
  showHomeSidebarOverlay.value = !showHomeSidebarOverlay.value
}

provide('toggleHomeSidebarOverlay', toggleHomeSidebarOverlay)
provide('showHomeSidebarOverlay', readonly(showHomeSidebarOverlay))
provide('isCollapsed', readonly(isCollapsed))
</script>