<template>
  <div
    class="flex flex-row items-center justify-between p-4 sm:p-6 border-t border-slate-200/20 bg-white/50 backdrop-blur-sm flex-shrink-0 gap-3"
  >
    <div class="text-xs sm:text-sm text-slate-600">
      {{ filteredCount }} template{{ filteredCount !== 1 ? 's' : '' }} found
    </div>
    <div class="flex flex-row gap-2 sm:gap-3">
      <button
        @click="$emit('cancel')"
        class="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
        type="button"
      >
        Cancel
      </button>
      <button
        @click="$emit('confirm')"
        :disabled="!hasSelection || isSelecting"
        :class="[
          'px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 sm:gap-2',
          hasSelection && !isSelecting
            ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed',
        ]"
        type="button"
      >
        <Loader2 v-if="isSelecting" class="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
        <CheckCircle v-else class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span class="hidden sm:inline">{{ isSelecting ? 'Selecting...' : 'Select Template' }}</span>
        <span class="sm:hidden">{{ isSelecting ? 'Selecting...' : 'Select' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loader2, CheckCircle } from 'lucide-vue-next'

interface Props {
  filteredCount: number
  hasSelection: boolean
  isSelecting: boolean
}

defineProps<Props>()

defineEmits<{
  cancel: []
  confirm: []
}>()
</script>
