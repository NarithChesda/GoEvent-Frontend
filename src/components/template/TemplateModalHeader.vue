<template>
  <div
    class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-4 sm:px-8 py-4 sm:py-6 text-white flex-shrink-0"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
        <div
          class="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"
        >
          <LayoutTemplate class="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div class="min-w-0 flex-1">
          <h2 class="text-lg sm:text-2xl font-bold truncate">Browse Templates</h2>
          <p class="text-white/80 text-xs sm:text-sm mt-1 hidden sm:block">
            Choose a design that matches your event style
          </p>
        </div>
      </div>
      <button
        @click="$emit('close')"
        class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200 flex-shrink-0"
        type="button"
        aria-label="Close modal"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X, LayoutTemplate } from 'lucide-vue-next'

defineEmits<{
  close: []
}>()
</script>
