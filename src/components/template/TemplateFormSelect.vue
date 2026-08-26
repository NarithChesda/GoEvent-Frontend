<template>
  <div class="space-y-1.5">
    <label v-if="label" :for="fieldId" :class="FIELD_LABEL">{{ label }}</label>
    <div class="relative">
      <select
        :id="fieldId"
        :value="modelValue === null ? '' : String(modelValue)"
        :disabled="disabled"
        :class="[FIELD, 'appearance-none pl-3 pr-9']"
        @change="onChange"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="String(option.value)"
          :value="String(option.value)"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </select>
      <ChevronDown
        class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
        aria-hidden="true"
      />
    </div>
    <p v-if="hint" :class="FIELD_HINT">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { FIELD, FIELD_HINT, FIELD_LABEL } from './templateUi'

export interface TemplateFormSelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

/**
 * A styled native select. Options come in as data rather than as a slot so the
 * component can map the DOM's always-string `value` back to the original option
 * — several of the form's selects are keyed on numeric ids (fonts, plans).
 */
const props = defineProps<{
  modelValue: string | number | null
  options: TemplateFormSelectOption[]
  label?: string
  placeholder?: string
  hint?: string
  disabled?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [string | number] }>()

const fieldId = useId()

const onChange = (event: Event): void => {
  const raw = (event.target as HTMLSelectElement).value
  const match = props.options.find((option) => String(option.value) === raw)
  if (match) emit('update:modelValue', match.value)
}
</script>
