<template>
  <div class="space-y-1.5">
    <label v-if="label" :for="hexFieldId" :class="FIELD_LABEL">{{ label }}</label>
    <div class="flex items-center gap-2">
      <input
        :value="modelValue || '#000000'"
        type="color"
        class="w-10 h-[2.375rem] p-0.5 bg-slate-100 border border-transparent rounded-lg cursor-pointer transition-[background-color,border-color] duration-200 ease-out hover:border-sky-300 flex-shrink-0"
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
        :class="[FIELD, 'flex-1 min-w-0 uppercase tabular-nums']"
        @input="onInput"
      />
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { FIELD, FIELD_LABEL } from './templateUi'

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
