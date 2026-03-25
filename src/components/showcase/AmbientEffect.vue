<template>
  <div
    ref="containerRef"
    class="absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-700"
    :class="{ 'opacity-0': hidden }"
    style="z-index: 26"
  ></div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAmbientCreatures } from '../../composables/showcase/useAmbientCreatures'
import type { AmbientCreaturesConfig } from '@/services/api/types/template.types'

const props = withDefaults(
  defineProps<{
    /** Backend-driven creature configuration */
    config: AmbientCreaturesConfig
    /** Primary template color */
    primaryColor?: string
    /** Accent template color (preferred for creatures) */
    accentColor?: string
    /** When true, fades out the effect (e.g. during cover stage exit) */
    hidden?: boolean
  }>(),
  {
    primaryColor: '#e91e63',
    hidden: false,
  },
)

const containerRef = ref<HTMLElement>()

/** Resolve color based on config.color_source */
function resolveColor(): string {
  const source = props.config.color_source ?? 'accent'
  switch (source) {
    case 'custom':
      return props.config.custom_color || props.accentColor || props.primaryColor || '#e91e63'
    case 'primary':
      return props.primaryColor || '#e91e63'
    case 'accent':
    default:
      return props.accentColor || props.primaryColor || '#e91e63'
  }
}

useAmbientCreatures(containerRef, {
  creatures: props.config.creatures,
  color: resolveColor,
  count: props.config.count ?? 6,
  speed: props.config.speed ?? 'normal',
})
</script>
