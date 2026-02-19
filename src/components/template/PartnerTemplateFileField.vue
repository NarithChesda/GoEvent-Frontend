<template>
  <div class="space-y-1">
    <label class="block text-xs font-medium text-slate-600">{{ label }}</label>
    <label
      class="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all group"
      :class="fileStateClasses"
    >
      <component :is="fileIcon" class="w-4 h-4 flex-shrink-0" :class="iconColorClass" />
      <span class="text-xs truncate flex-1" :class="textColorClass">
        {{ fileStatusText }}
      </span>
      <span
        v-if="hasExistingFile && !fileName"
        class="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
      >
        Replace
      </span>
      <input :type="'file'" :accept="accept" class="sr-only" @change="emit('change', $event)" />
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Upload, CheckCircle2, FileCheck } from 'lucide-vue-next'

const props = defineProps<{
  label: string
  accept?: string
  fileName?: string | null
  hasExistingFile?: boolean
}>()

const emit = defineEmits<{ change: [event: Event] }>()

const fileIcon = computed(() => {
  if (props.fileName) return FileCheck
  if (props.hasExistingFile) return CheckCircle2
  return Upload
})

const fileStateClasses = computed(() => {
  if (props.fileName) {
    return 'border-2 border-blue-300 bg-blue-50 hover:bg-blue-100'
  }
  if (props.hasExistingFile) {
    return 'border border-green-200 bg-green-50 hover:bg-green-100'
  }
  return 'border border-slate-200 bg-white hover:bg-slate-50'
})

const iconColorClass = computed(() => {
  if (props.fileName) return 'text-blue-600'
  if (props.hasExistingFile) return 'text-green-600'
  return 'text-slate-400'
})

const textColorClass = computed(() => {
  if (props.fileName) return 'text-blue-700 font-medium'
  if (props.hasExistingFile) return 'text-green-700'
  return 'text-slate-500'
})

const fileStatusText = computed(() => {
  if (props.fileName) return props.fileName
  if (props.hasExistingFile) return 'File uploaded ✓'
  return 'Choose file'
})
</script>
