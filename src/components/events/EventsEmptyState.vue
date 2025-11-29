<template>
  <div class="text-center py-12 lg:py-16 px-4">
    <div
      class="w-24 h-24 lg:w-32 lg:h-32 mx-auto mb-4 lg:mb-6 bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20 rounded-full flex items-center justify-center"
    >
      <CalendarDays class="w-12 h-12 lg:w-16 lg:h-16 text-[#2ecc71]" />
    </div>
    <h3 class="text-xl lg:text-2xl font-bold text-slate-900 mb-2 lg:mb-3">
      {{ title }}
    </h3>
    <p class="text-sm lg:text-base text-slate-600 mb-5 lg:mb-6 max-w-md mx-auto">
      {{ description }}
    </p>
    <button
      v-if="showAction"
      @click="$emit('action')"
      class="px-5 py-2.5 lg:px-6 lg:py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm lg:text-base rounded-xl font-medium transition-colors"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { CalendarDays } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    title: string
    description: string
    actionLabel?: string
    showAction?: boolean
  }>(),
  {
    actionLabel: 'Create Event',
    showAction: false,
  }
)

defineEmits<{
  action: []
}>()
</script>
