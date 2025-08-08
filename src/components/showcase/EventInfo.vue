<template>
  <div class="text-center mb-8 space-y-3">
    <!-- Date Text -->
    <div class="flex items-center justify-center gap-2">
      <Calendar class="w-4 h-4" :style="{ color: primaryColor }" />
      <span 
        class="text-sm font-medium" 
        :style="{ 
          background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }"
      >
        {{ dateText || 'Date to be announced' }}
      </span>
    </div>
    
    <!-- Time Text -->
    <div class="flex items-center justify-center gap-2">
      <Clock class="w-4 h-4" :style="{ color: primaryColor }" />
      <span 
        class="text-sm font-medium" 
        :style="{ 
          background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }"
      >
        {{ timeText || 'Time to be announced' }}
      </span>
    </div>
    
    <!-- Location Text -->
    <div class="flex items-center justify-center gap-2">
      <MapPin class="w-4 h-4" :style="{ color: primaryColor }" />
      <span 
        class="text-sm font-medium" 
        :style="{ 
          background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
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