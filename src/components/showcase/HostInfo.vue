<template>
  <div class="grid grid-cols-3 gap-6 mb-8 items-center">
    <!-- Left: First Host -->
    <div v-if="hosts.length > 0" class="text-center">
      <div class="space-y-2">
        <p class="text-xs" :style="{ color: primaryColor, opacity: '0.7' }">
          {{ hosts[0].parent_a_name || 'Father Name' }}
        </p>
        <p class="text-xs" :style="{ color: primaryColor, opacity: '0.7' }">
          {{ hosts[0].parent_b_name || 'Mother Name' }}
        </p>
        <h3 
          class="text-lg font-bold" 
          :style="{ 
            background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: currentFont
          }"
        >
          {{ hosts[0].name }}
        </h3>
      </div>
    </div>
    
    <!-- Center: Event Logo -->
    <div class="flex items-center justify-center">
      <img 
        v-if="logoUrl" 
        :src="logoUrl" 
        alt="Event Logo"
        class="h-20 w-auto max-w-full drop-shadow-lg mx-auto"
      />
      <div 
        v-else 
        class="w-16 h-16 rounded-full flex items-center justify-center mx-auto" 
        :style="{ 
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})` 
        }"
      >
        <span class="text-white font-bold text-lg">{{ eventInitial }}</span>
      </div>
    </div>
    
    <!-- Right: Second Host -->
    <div v-if="hosts.length > 1" class="text-center">
      <div class="space-y-2">
        <p class="text-xs" :style="{ color: primaryColor, opacity: '0.7' }">
          {{ hosts[1].parent_a_name || 'Father Name' }}
        </p>
        <p class="text-xs" :style="{ color: primaryColor, opacity: '0.7' }">
          {{ hosts[1].parent_b_name || 'Mother Name' }}
        </p>
        <h3 
          class="text-lg font-bold" 
          :style="{ 
            background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: currentFont
          }"
        >
          {{ hosts[1].name }}
        </h3>
      </div>
    </div>
    
    <!-- Fallback for single host - center the host info -->
    <div v-else-if="hosts.length === 1" class="col-span-1"></div>
  </div>
</template>

<script setup lang="ts">
import type { Host } from '../../composables/useEventShowcase'

interface Props {
  hosts: Host[]
  logoUrl?: string
  eventInitial: string
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  currentFont: string
}

defineProps<Props>()
</script>