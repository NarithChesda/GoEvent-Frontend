<template>
  <div
    class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 sm:p-12 text-center"
  >
    <Users class="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3 sm:mb-4" />
    <h3 class="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">
      {{ title }}
    </h3>
    <p class="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6">
      {{ description }}
    </p>
    <button
      v-if="hasActiveFilters"
      @click="$emit('clear-filters')"
      class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 text-sm sm:text-base"
    >
      Clear Filters
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Users } from 'lucide-vue-next'

// Props
const props = defineProps<{
  hasActiveFilters: boolean
}>()

// Emits
defineEmits<{
  'clear-filters': []
}>()

// Computed
const title = computed(() => {
  return props.hasActiveFilters ? 'No registrations found' : 'No registrations yet'
})

const description = computed(() => {
  return props.hasActiveFilters
    ? 'Try adjusting your search or filter criteria.'
    : 'Share your event to start getting registrations!'
})
</script>
