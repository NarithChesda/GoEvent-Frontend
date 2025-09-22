<template>
  <div class="text-center py-12">
    <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <Palette class="w-8 h-8 text-slate-400" />
    </div>
    <h3 class="text-lg font-semibold text-slate-900 mb-2">No Templates Found</h3>
    <p class="text-slate-600">
      {{
        hasFilters
          ? 'Try adjusting your filters to see more templates.'
          : 'No templates are available at the moment.'
      }}
    </p>
    <button
      v-if="hasFilters"
      @click="$emit('clearFilters')"
      class="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-500/25"
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
