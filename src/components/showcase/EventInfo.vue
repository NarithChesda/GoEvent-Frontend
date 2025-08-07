<template>
  <div class="text-center mb-8 space-y-3">
    <!-- Date Text -->
    <div v-if="dateText" class="flex items-center justify-center gap-2">
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
        {{ dateText }}
      </span>
    </div>
    
    <!-- Time Text -->
    <div v-if="timeText" class="flex items-center justify-center gap-2">
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
        {{ timeText }}
      </span>
    </div>
    
    <!-- Location Text -->
    <div v-if="locationText" class="space-y-2">
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
          {{ locationText }}
        </span>
      </div>
      
      <!-- Google Map Button -->
      <div v-if="hasGoogleMap" class="flex justify-center">
        <button
          @click="$emit('openMap')"
          class="px-4 py-2 rounded-full text-xs font-medium glass-section flex items-center gap-2 transition-all hover:scale-[1.02]"
          :style="{ 
            borderColor: primaryColor,
            color: primaryColor,
            borderWidth: '1px',
            borderStyle: 'solid'
          }"
        >
          <MapPin class="w-3 h-3" />
          View on Map
        </button>
      </div>
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