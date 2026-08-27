<template>
  <div class="space-y-1.5">
    <p v-if="label" :class="FIELD_LABEL">{{ label }}</p>
    <div
      class="grid gap-2"
      :class="columns === 3 ? 'grid-cols-3' : columns === 1 ? 'grid-cols-1' : 'grid-cols-2'"
      role="radiogroup"
      :aria-label="label"
    >
      <button
        v-for="option in options"
        :key="String(option.value)"
        type="button"
        role="radio"
        :aria-checked="option.value === modelValue"
        class="flex flex-col gap-0.5 px-3 py-2 rounded-xl text-left"
        :class="optionClass(option.value === modelValue)"
        @click="emit('update:modelValue', option.value)"
      >
        <span class="flex items-center gap-1.5 w-full min-w-0">
          <component
            :is="option.icon"
            v-if="option.icon"
            class="w-3.5 h-3.5 flex-shrink-0 transition-colors duration-200"
            :class="optionIconClass(option.value === modelValue)"
          />
          <span
            class="text-[0.8125rem] font-medium truncate"
            :class="option.value === modelValue ? 'text-slate-900' : 'text-slate-700'"
          >{{ option.label }}</span>
          <Check
            v-if="option.value === modelValue"
            class="w-3.5 h-3.5 ml-auto flex-shrink-0 text-[#1e90ff]"
            aria-hidden="true"
          />
        </span>
        <span v-if="option.description" class="text-[0.6875rem] leading-snug text-slate-500">
          {{ option.description }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check, type LucideIcon } from 'lucide-vue-next'
import { FIELD_LABEL, optionClass, optionIconClass } from './templateUi'

export interface TemplateFormChoiceOption {
  value: string
  label: string
  description?: string
  icon?: LucideIcon
}

/**
 * Radio cards for the form's short enums (animation type, intensity, design
 * style…). These used to be `<select>`s, which hid every option but one behind a
 * click — for two- and three-way choices that describe a *look*, showing the
 * alternatives side by side is both faster and more honest about what's on offer.
 * Longer lists (fonts, particle types) stay on TemplateFormSelect.
 */
withDefaults(
  defineProps<{
    modelValue: string
    options: TemplateFormChoiceOption[]
    label?: string
    columns?: 1 | 2 | 3
  }>(),
  { columns: 2 },
)

const emit = defineEmits<{ 'update:modelValue': [string] }>()
</script>
