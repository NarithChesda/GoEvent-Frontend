<template>
  <div class="showcase-container flex items-center justify-center bg-black">
    <div class="max-w-md text-center px-8">
      <AlertTriangle class="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h1 class="text-2xl font-bold text-white mb-2">{{ title }}</h1>
      <p class="text-gray-300">{{ message }}</p>
      <button
        v-if="showRetry"
        @click="$emit('retry')"
        class="mt-4 px-6 py-2 bg-[#1e90ff] text-white rounded-lg hover:bg-[#1873cc] transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'

interface Props {
  title?: string
  message: string
  showRetry?: boolean
}

withDefaults(defineProps<Props>(), {
  title: 'Oops! Something went wrong',
  showRetry: false,
})

defineEmits<{
  retry: []
}>()
</script>

<style scoped>
.showcase-container {
  width: 100%;
  max-width: 1080px;
  height: 100vh;
  max-height: 1920px;
  position: relative;
  overflow: hidden;
  background: #000;
  margin: 0 auto;
}

/* For desktop screens, maintain aspect ratio */
@media (min-aspect-ratio: 1080/1920) {
  .showcase-container {
    width: calc(100vh * 1080 / 1920);
    height: 100vh;
  }
}
</style>
