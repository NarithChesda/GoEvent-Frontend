<template>
  <div
    class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-8 border-t border-slate-200/20 bg-white/50 backdrop-blur-sm flex-shrink-0 gap-4 sm:gap-0"
  >
    <div class="text-xs sm:text-sm text-slate-600 text-center sm:text-left">
      {{ filteredCount }} template{{ filteredCount !== 1 ? 's' : '' }} found
    </div>
    <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      <button
        @click="$emit('cancel')"
        class="flex-1 sm:flex-none px-5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium order-2 sm:order-1"
        type="button"
      >
        Cancel
      </button>
      <button
        @click="$emit('confirm')"
        :disabled="!hasSelection || isSelecting"
        :class="[
          'flex-1 sm:flex-none px-6 py-2.5 text-sm rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 order-1 sm:order-2',
          hasSelection && !isSelecting
            ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed',
        ]"
        type="button"
      >
        <Loader2 v-if="isSelecting" class="w-4 h-4 animate-spin" />
        <CheckCircle v-else class="w-4 h-4" />
        {{ isSelecting ? 'Selecting...' : 'Select Template' }}
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
