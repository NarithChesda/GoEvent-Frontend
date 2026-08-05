<template>
  <div class="space-y-1.5">
    <label v-if="label" :for="fieldId" class="block text-xs font-medium text-slate-600">{{ label }}</label>
    <div class="relative">
      <select
        :id="fieldId"
        :value="modelValue === null ? '' : String(modelValue)"
        :disabled="disabled"
        class="w-full appearance-none pl-3 pr-9 py-2 bg-slate-100 border border-transparent rounded-lg text-sm text-slate-700 transition-colors focus:outline-none focus:bg-white focus:border-sky-300 focus:ring-4 focus:ring-sky-100 disabled:opacity-60 disabled:cursor-not-allowed"
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
    <p v-if="hint" class="text-[0.6875rem] leading-snug text-slate-400">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

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
