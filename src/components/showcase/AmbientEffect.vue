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
import {
  useAmbientCreatures,
  type AmbientCreatureType,
} from '../../composables/showcase/useAmbientCreatures'

const props = withDefaults(
  defineProps<{
    /** Creature type to render */
    type?: AmbientCreatureType
    /** Primary template color */
    primaryColor?: string
    /** Accent template color (preferred for creatures) */
    accentColor?: string
    /** When true, fades out the effect (e.g. during cover stage exit) */
    hidden?: boolean
  }>(),
  {
    type: 'mixed',
    primaryColor: '#e91e63',
    hidden: false,
  },
)

const containerRef = ref<HTMLElement>()

useAmbientCreatures(containerRef, {
  type: props.type,
  color: () => props.accentColor || props.primaryColor || '#e91e63',
  count: 6,
  speed: 'normal',
})
</script>
