<template>
  <div class="text-center py-8 sm:py-12">
    <div class="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
      <Palette class="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
    </div>
    <h3 class="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">No Templates Found</h3>
    <p class="text-xs sm:text-sm text-slate-600 px-4">
      {{
        hasFilters
          ? 'Try adjusting your filters to see more templates.'
          : 'No templates are available at the moment.'
      }}
    </p>
    <button
      v-if="hasFilters"
      @click="$emit('clearFilters')"
      class="mt-4 sm:mt-6 px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 text-sm sm:text-base"
      type="button"
    >
      Clear Filters
    </button>
  </div>
</template>

<script setup lang="ts">
import { Palette } from 'lucide-vue-next'

interface Props {
  hasFilters: boolean
}

defineProps<Props>()

defineEmits<{
  clearFilters: []
}>()
</script>
