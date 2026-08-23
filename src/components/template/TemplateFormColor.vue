<template>
  <div class="space-y-1.5">
    <label v-if="label" :for="hexFieldId" class="block text-xs font-medium text-slate-600">{{ label }}</label>
    <div class="flex items-center gap-2">
      <input
        :value="modelValue || '#000000'"
        type="color"
        class="w-10 h-[2.375rem] p-0.5 border border-slate-200 rounded-lg cursor-pointer hover:border-sky-300 transition-colors flex-shrink-0"
        :aria-label="t('management.partnerTemplateForm.colorField.pick', { name })"
        @input="onInput"
      />
      <input
        :id="hexFieldId"
        :value="modelValue ?? ''"
        type="text"
        maxlength="7"
        :placeholder="placeholder"
        :aria-label="t('management.partnerTemplateForm.colorField.hex', { name })"
        class="flex-1 min-w-0 px-3 py-2 bg-slate-100 border border-transparent rounded-lg text-sm uppercase tabular-nums transition-colors focus:outline-none focus:bg-white focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
        @input="onInput"
      />
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Swatch + hex pair. This markup was copied out six times across the partner
 * template form, and every copy but one borrowed another section's aria-label
 * keys — so a screen reader announced the spark tint, the calendar marker and
 * the cover text colour all as "Hex", with nothing to say which colour was
 * being edited. `name` is what this particular colour is for, and both controls
 * are announced with it.
 */
withDefaults(
  defineProps<{
    /** Some slots store null until a custom colour is picked. */
    modelValue: string | null
    /** What this colour is for, e.g. "Drifting sparks". Used for both aria-labels. */
    name: string
    /** Optional visible label, when the pair isn't already under one. */
    label?: string
    placeholder?: string
  }>(),
  { placeholder: '#FFFFFF' },
)

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const { t } = useI18n()
const hexFieldId = useId()

const onInput = (event: Event): void => {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>
