<template>
  <!-- Vertical rhythm is clamped against viewport height (vh) rather than fixed:
       on short laptop screens the block compresses so the page header, this state
       and AppFooter all still fit without scrolling; on tall screens the clamp
       maxima keep the original spacious sizing. -->
  <div class="text-center px-4 py-[clamp(1.5rem,4vh,3rem)]">
    <div
      class="w-[clamp(4.5rem,10vh,8rem)] h-[clamp(4.5rem,10vh,8rem)] mx-auto mb-[clamp(0.75rem,2vh,1.5rem)] bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20 rounded-full flex items-center justify-center"
    >
      <CalendarDays class="w-1/2 h-1/2 text-[#2ecc71]" />
    </div>
    <h3 class="text-xl lg:text-2xl font-bold text-slate-900 mb-2 lg:mb-3">
      {{ title }}
    </h3>
    <p
      class="text-sm lg:text-base text-slate-600 mb-[clamp(1rem,2.5vh,1.5rem)] max-w-md mx-auto"
    >
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
