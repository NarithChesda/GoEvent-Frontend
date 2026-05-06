<template>
  <div class="grid grid-cols-2 gap-2">
    <button
      type="button"
      class="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      :disabled="!canRearm"
      @click="emit('rearm')"
    >
      {{ t('management.tickets.scan.actions.scanNext') }}
    </button>
    <button
      type="button"
      class="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
      :class="undoClass"
      :disabled="!canUndo || isUndoing"
      @click="emit('undo')"
    >
      <Undo2 v-if="!isUndoing" class="w-4 h-4" />
      <span
        v-else
        class="w-4 h-4 animate-spin border-2 border-current border-t-transparent rounded-full"
      ></span>
      <span class="truncate">
        <template v-if="canUndo && undoSecondsLeft > 0">
          {{ t('management.tickets.scan.actions.undoLast') }} ({{ undoSecondsLeft }}s)
        </template>
        <template v-else>
          {{ t('management.tickets.scan.actions.undoLast') }}
        </template>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Undo2 } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'

const props = defineProps<{
  canRearm: boolean
  canUndo: boolean
  undoSecondsLeft: number
  isUndoing: boolean
}>()

const emit = defineEmits<{
  rearm: []
  undo: []
}>()

const { t } = useAppLanguage()

const undoClass = computed(() =>
  props.canUndo
    ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-sm'
    : 'bg-slate-100 text-slate-400',
)
</script>
