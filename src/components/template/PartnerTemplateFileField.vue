<template>
  <div class="space-y-1">
    <label class="block text-xs font-medium text-slate-600">{{ label }}</label>
    <label class="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
      <Upload class="w-4 h-4 text-slate-400 flex-shrink-0" />
      <span class="text-xs text-slate-500 truncate">{{ fileName || 'Choose file' }}</span>
      <input :type="'file'" :accept="accept" class="sr-only" @change="emit('change', $event)" />
    </label>
  </div>
</template>

<script setup lang="ts">
import { Upload } from 'lucide-vue-next'

defineProps<{
  label: string
  accept?: string
  fileName?: string | null
}>()

const emit = defineEmits<{ change: [event: Event] }>()
</script>
