<template>
  <!-- Contact Us FAB - Telegram Link -->
  <a
    :href="telegramLink"
    target="_blank"
    rel="noopener noreferrer"
    :class="fabPositionClass"
    class="fixed right-6 z-[60] bg-gradient-to-r from-[#0088cc] to-[#229ED9] hover:from-[#006ca8] hover:to-[#1c7fb5] text-white rounded-full shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 flex items-center justify-center h-12 w-12 lg:h-14 lg:w-14 hover:scale-110"
    aria-label="Contact support"
  >
    <MessageCircleQuestion class="w-5 h-5 lg:w-6 lg:h-6" />
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MessageCircleQuestion } from 'lucide-vue-next'

interface Props {
  smartFabVisible: boolean
}

const props = defineProps<Props>()

// Get Telegram bot username from environment variable
const telegramBotUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'GoEventBot'

// Create Telegram link
const telegramLink = computed(() => {
  return `https://t.me/goeventkh`
})

// Dynamic positioning based on smart FAB visibility
const fabPositionClass = computed(() => {
  if (props.smartFabVisible) {
    // Smart FAB is visible, position above it (with 12px gap)
    // Mobile: 96px (bottom-24) + 56px (Smart FAB height) + 12px (gap) = 164px
    // Desktop: 32px (bottom-8) + 56px (Smart FAB height) + 12px (gap) = 100px
    return 'bottom-[164px] lg:bottom-[100px]'
  } else {
    // Smart FAB is hidden, take its place
    return 'bottom-24 lg:bottom-8'
  }
})
</script>

<style scoped>
/* Telegram brand colors and smooth transitions */
</style>
