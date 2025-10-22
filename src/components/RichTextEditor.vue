<template>
  <div class="rich-text-editor-wrapper">
    <QuillEditor
      v-model:content="content"
      :options="editorOptions"
      :placeholder="placeholder"
      content-type="html"
      @update:content="handleContentUpdate"
      class="rich-text-editor"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

interface Props {
  modelValue: string
  placeholder?: string
  minHeight?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Enter description...',
  minHeight: '150px'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const content = ref(props.modelValue)

// Quill editor options
const editorOptions = {
  theme: 'snow',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'header': [1, 2, 3, false] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ]
  }
}

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue !== content.value) {
    content.value = newValue
  }
})

// Handle content updates from the editor
const handleContentUpdate = (newContent: string) => {
  emit('update:modelValue', newContent)
}
</script>

<style scoped>
.rich-text-editor-wrapper {
  @apply w-full relative;
}

.rich-text-editor-wrapper :deep(.ql-container) {
  @apply border border-gray-200 rounded-b-lg bg-white/70 backdrop-blur-sm;
  min-height: v-bind(minHeight);
  font-size: 0.875rem;
}

.rich-text-editor-wrapper :deep(.ql-toolbar) {
  @apply border border-gray-200 rounded-t-lg bg-white/70 backdrop-blur-sm;
  position: relative;
  z-index: 10;
}

.rich-text-editor-wrapper :deep(.ql-editor) {
  min-height: v-bind(minHeight);
  @apply text-sm sm:text-base;
}

.rich-text-editor-wrapper :deep(.ql-editor.ql-blank::before) {
  @apply text-slate-400 italic;
  font-size: 0.875rem;
}

/* Focus state */
.rich-text-editor-wrapper :deep(.ql-container.ql-snow) {
  @apply transition-all duration-200;
}

.rich-text-editor-wrapper :deep(.ql-toolbar.ql-snow) {
  @apply transition-all duration-200;
}

/* Fix dropdown overlays - ensure they appear above other content */
.rich-text-editor-wrapper :deep(.ql-picker) {
  position: relative;
  z-index: 20;
}

.rich-text-editor-wrapper :deep(.ql-picker.ql-expanded) {
  z-index: 30;
}

.rich-text-editor-wrapper :deep(.ql-picker-options) {
  position: absolute;
  z-index: 40;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.rich-text-editor-wrapper :deep(.ql-color-picker .ql-picker-options),
.rich-text-editor-wrapper :deep(.ql-background .ql-picker-options) {
  padding: 0.5rem;
}

/* Responsive adjustments */
@media (min-width: 640px) {
  .rich-text-editor-wrapper :deep(.ql-container) {
    @apply rounded-b-xl;
  }

  .rich-text-editor-wrapper :deep(.ql-toolbar) {
    @apply rounded-t-xl;
  }
}
</style>
