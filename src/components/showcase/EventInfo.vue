<template>
  <div class="text-center py-6 mb-6 sm:mb-8 -space-y-2 sm:-space-y-2">
    <!-- Date Text -->
    <div class="flex items-center justify-center gap-2 sm:gap-3">
      <span
        class="text-xs sm:text-base md:text-lg font-medium leading-relaxed py-2"
        :style="{
          background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontFamily: secondaryFont || currentFont
        }"
      >
        {{ dateText || 'Date to be announced' }}
      </span>
    </div>

    <!-- Time Text -->
    <div class="flex items-center justify-center gap-2 sm:gap-3">
      <span
        class="text-xs sm:text-base md:text-lg font-medium leading-relaxed py-2"
        :style="{
          background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontFamily: secondaryFont || currentFont
        }"
      >
        {{ timeText || 'Time to be announced' }}
      </span>
    </div>

    <!-- Location Text -->
    <div class="flex items-center justify-center gap-2 sm:gap-3">
      <span
        class="text-xs sm:text-base md:text-lg font-medium leading-relaxed py-2"
        :style="{
          background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontFamily: secondaryFont || currentFont
        }"
      >
        {{ locationText || 'Location to be announced' }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Calendar, Clock, MapPin } from 'lucide-vue-next'

interface Props {
  dateText?: string
  timeText?: string
  locationText?: string
  hasGoogleMap?: boolean
  primaryColor: string
  accentColor: string
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
}

defineProps<Props>()

defineEmits<{
  openMap: []
}>()
</script>

<style scoped>
.glass-section {
  background: rgba(255, 255, 255, 0.20);
  border: 1px solid rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
</style>
