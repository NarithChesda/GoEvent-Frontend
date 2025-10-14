<template>
  <div
    class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6 text-white flex-shrink-0"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
        <div
          class="w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"
        >
          <LayoutTemplate class="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
        </div>
        <div class="min-w-0 flex-1">
          <h2 class="text-base sm:text-lg md:text-xl lg:text-2xl font-bold truncate">Browse Templates</h2>
          <p class="text-white/80 text-xs sm:text-xs md:text-sm mt-0.5 sm:mt-1 hidden sm:block">
            Choose a design that matches your event style
          </p>
        </div>
      </div>
      <button
        @click="$emit('close')"
        class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200 flex-shrink-0"
        type="button"
        aria-label="Close modal"
      >
        <X class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
