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
        class="text-[10px] px-1.5 py-0.5 rounded-full bg-white text-emerald-700 ring-1 ring-emerald-200 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {{ t('management.partnerTemplateForm.fileField.replace') }}
      </span>
      <input :type="'file'" :accept="accept" class="sr-only" @change="emit('change', $event)" />
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Upload, CheckCircle2, FileCheck } from 'lucide-vue-next'

const props = defineProps<{
  label: string
  accept?: string
  fileName?: string | null
  hasExistingFile?: boolean
}>()

const emit = defineEmits<{ change: [event: Event] }>()

const { t } = useI18n()

const fileIcon = computed(() => {
  if (props.fileName) return FileCheck
  if (props.hasExistingFile) return CheckCircle2
  return Upload
})

const fileStateClasses = computed(() => {
  if (props.fileName) {
    return 'ring-1 ring-sky-300 bg-sky-50 hover:bg-sky-100'
  }
  if (props.hasExistingFile) {
    return 'ring-1 ring-emerald-200 bg-emerald-50 hover:bg-emerald-100'
  }
  return 'border border-dashed border-slate-300 bg-slate-50/60 hover:border-sky-400 hover:bg-sky-50/40'
})

const iconColorClass = computed(() => {
  if (props.fileName) return 'text-sky-600'
  if (props.hasExistingFile) return 'text-emerald-600'
  return 'text-slate-400'
})

const textColorClass = computed(() => {
  if (props.fileName) return 'text-sky-700 font-medium'
  if (props.hasExistingFile) return 'text-emerald-700'
  return 'text-slate-500'
})

const fileStatusText = computed(() => {
  if (props.fileName) return props.fileName
  if (props.hasExistingFile) return t('management.partnerTemplateForm.fileField.uploaded')
  return t('management.partnerTemplateForm.fileField.choose')
})
</script>
