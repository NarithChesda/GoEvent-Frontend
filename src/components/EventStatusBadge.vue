<template>
  <span :class="badgeClasses">
    <div v-if="type === 'live'" class="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
    <div
      v-else-if="type === 'category'"
      class="w-3 h-3 rounded-full mr-2"
      :style="{ backgroundColor: color || '#8B5CF6' }"
    ></div>
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type: 'live' | 'upcoming' | 'past' | 'category'
  label: string
  color?: string
}

const props = defineProps<Props>()

const badgeClasses = computed(() => {
  const baseClasses = 'inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-full shadow-lg'
  
  switch (props.type) {
    case 'live':
      return `${baseClasses} bg-green-500 text-white`
    case 'upcoming':
      return `${baseClasses} bg-purple-500 text-white`
    case 'past':
      return `${baseClasses} bg-slate-500 text-white`
    case 'category':
      return `${baseClasses.replace('font-bold', 'font-semibold')} text-slate-600 tracking-wide text-sm`
    default:
      return `${baseClasses} bg-slate-500 text-white`
  }
})
</script>