<template>
  <template v-if="isDecorationAnimation">
    <!-- Left decoration -->
    <img
      v-if="leftUrl"
      :src="leftUrl"
      alt="Left decoration"
      class="absolute top-0 bottom-0 left-0 w-auto h-full pointer-events-none cover-decoration-left"
      :class="decorationClasses.left"
      :style="{ zIndex: zIndexes.left }"
      loading="eager"
      v-bind="protectionAttrs"
    />
    <!-- Right decoration -->
    <img
      v-if="rightUrl"
      :src="rightUrl"
      alt="Right decoration"
      class="absolute top-0 bottom-0 right-0 w-auto h-full pointer-events-none cover-decoration-right"
      :class="decorationClasses.right"
      :style="{ zIndex: zIndexes.right }"
      loading="eager"
      v-bind="protectionAttrs"
    />
    <!-- Top decoration -->
    <img
      v-if="topUrl"
      :src="topUrl"
      alt="Top decoration"
      class="absolute top-0 left-0 right-0 w-full h-auto pointer-events-none cover-decoration-top"
      :class="decorationClasses.top"
      :style="{ zIndex: zIndexes.top }"
      loading="eager"
      v-bind="protectionAttrs"
    />
    <!-- Bottom decoration -->
    <img
      v-if="bottomUrl"
      :src="bottomUrl"
      alt="Bottom decoration"
      class="absolute bottom-0 left-0 right-0 w-full h-auto pointer-events-none cover-decoration-bottom"
      :class="decorationClasses.bottom"
      :style="{ zIndex: zIndexes.bottom }"
      loading="eager"
      v-bind="protectionAttrs"
    />
  </template>
</template>

<script setup lang="ts">
import { useAssetProtection } from '@/composables/showcase/useAssetProtection'

interface ZIndexes {
  left: number
  right: number
  top: number
  bottom: number
}

interface DecorationClasses {
  left: Record<string, boolean>
  right: Record<string, boolean>
  top: Record<string, boolean>
  bottom: Record<string, boolean>
}

interface Props {
  leftUrl?: string | null
  rightUrl?: string | null
  topUrl?: string | null
  bottomUrl?: string | null
  zIndexes: ZIndexes
  decorationClasses: DecorationClasses
  isDecorationAnimation: boolean
}

defineProps<Props>()

const { protectionAttrs } = useAssetProtection()
</script>

<style scoped>
/* Decoration slide-out animations */
.cover-decoration-left,
.cover-decoration-right,
.cover-decoration-top,
.cover-decoration-bottom {
  transition: transform 0.8s ease-out, opacity 0.8s ease-out;
}

:deep(.slide-out-to-left) {
  transform: translateX(-100%);
  opacity: 0;
  transition-delay: 0.1s;
}

:deep(.slide-out-to-right) {
  transform: translateX(100%);
  opacity: 0;
  transition-delay: 0.2s;
}

:deep(.slide-out-to-top) {
  transform: translateY(-100%);
  opacity: 0;
  transition-delay: 0.3s;
}

:deep(.slide-out-to-bottom) {
  transform: translateY(100%);
  opacity: 0;
  transition-delay: 0.4s;
}
</style>
