<template>
  <div class="relative min-h-screen">
    <!-- Background -->
    <div class="fixed inset-0 bg-gradient-to-br from-emerald-50 via-white to-sky-50 -z-10"></div>

    <!-- Desktop Sidebar -->
    <AppSidebar />

    <!-- Mobile Tab Bar -->
    <MobileTabBar />

    <!-- Main Content -->
    <div
      :class="[
        'relative min-h-screen transition-all duration-300 ease-in-out',
        'pb-20 lg:pb-0', // Add padding bottom for mobile tab bar
        isCollapsed ? 'lg:ml-24' : 'lg:ml-64'
      ]"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
import MobileTabBar from './MobileTabBar.vue'
import { useSidebar } from '../composables/useSidebar'

const { isCollapsed } = useSidebar()
</script>