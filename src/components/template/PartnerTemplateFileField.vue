<template>
  <div class="space-y-1">
    <label :class="FIELD_LABEL">{{ label }}</label>
    <!-- The clear button is a SIBLING of the picker label, not a child of it:
         anything inside a <label> forwards its clicks to the label's control, so
         a nested button would open the file dialog on the way to removing the
         file. Overlaying it keeps one full-width click target for picking. -->
    <div class="relative">
      <label
        class="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all group"
        :class="[fileStateClasses, canClear ? 'pr-9' : '']"
      >
        <component :is="fileIcon" class="w-4 h-4 flex-shrink-0" :class="iconColorClass" />
        <span class="text-xs truncate flex-1" :class="textColorClass">
          {{ fileStatusText }}
        </span>
        <span
          v-if="hasExistingFile && !fileName"
          class="text-[0.625rem] px-1.5 py-0.5 rounded-full bg-white text-emerald-700 ring-1 ring-emerald-200 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {{ t('management.partnerTemplateForm.fileField.replace') }}
        </span>
        <!-- Resetting the input's value means picking the SAME file twice in a
             row still fires `change` — otherwise, choosing a file, removing it,
             and choosing it again silently did nothing. -->
        <input
          :type="'file'"
          :accept="accept"
          class="sr-only"
          @change="onChange"
        />
      </label>
      <button
        v-if="canClear"
        type="button"
        :class="[BTN_ICON_MICRO, 'absolute right-1.5 top-1/2 -translate-y-1/2 !p-1 hover:text-red-600 hover:bg-red-50']"
        :aria-label="t('management.partnerTemplateForm.fileField.remove')"
        :title="t('management.partnerTemplateForm.fileField.remove')"
        @click="emit('clear')"
      >
        <X class="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Upload, CheckCircle2, FileCheck, X } from 'lucide-vue-next'
import { BTN_ICON_MICRO, FIELD_LABEL } from './templateUi'

const props = defineProps<{
  label: string
  accept?: string
  fileName?: string | null
  hasExistingFile?: boolean
}>()

const emit = defineEmits<{
  change: [event: Event]
  /** Drop whatever this field currently holds. The owner decides what that
   *  means — undoing an unsaved pick, or marking a saved asset for removal. */
  clear: []
}>()

const { t } = useI18n()

/** Nothing to remove when the field is empty. */
const canClear = computed(() => !!props.fileName || !!props.hasExistingFile)

const onChange = (event: Event) => {
  emit('change', event)
  ;(event.target as HTMLInputElement).value = ''
}

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
