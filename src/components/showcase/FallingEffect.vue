<template>
  <div
    ref="containerRef"
    class="absolute inset-0 overflow-hidden pointer-events-none"
    style="z-index: 15"
  ></div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFallingParticles } from '../../composables/showcase/useFallingParticles'
import type { FallingEffectConfig } from '@/services/api/types/template.types'

const props = defineProps<{
  /** Falling effect configuration from the template */
  config?: FallingEffectConfig | null
  /** Primary color of the template (used when color_source is 'primary') */
  primaryColor?: string
  /** Accent color of the template (used when color_source is 'accent') */
  accentColor?: string
  /** Function to resolve media URLs (for custom_image) */
  getMediaUrl?: (url: string) => string
}>()

const containerRef = ref<HTMLElement>()

// Resolve the particle color based on the config's color_source
const particleColor = (): string => {
  const source = props.config?.color_source || 'primary'
  switch (source) {
    case 'accent':
      return props.accentColor || '#e91e63'
    case 'custom':
      return props.config?.custom_color || '#e91e63'
    case 'primary':
    default:
      return props.primaryColor || '#e91e63'
  }
}

// Resolve the custom image URL through the media URL resolver
const resolvedCustomImage = computed(() => {
  const img = props.config?.custom_image
  if (!img) return null
  return props.getMediaUrl ? props.getMediaUrl(img) : img
})

// The composable handles 'none' / null internally — returns no-ops for disabled effects
useFallingParticles(containerRef, {
  type: props.config?.type || 'none',
  customImage: resolvedCustomImage.value,
  color: particleColor,
  intensity: props.config?.intensity || 'normal',
})
</script>
