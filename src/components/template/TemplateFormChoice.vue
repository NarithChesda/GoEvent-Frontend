<template>
  <div class="space-y-1.5">
    <p v-if="label" :class="FIELD_LABEL">{{ label }}</p>

    <!-- A magnitude: one track, ordered, with the chosen step capped in white. -->
    <SegmentedField
      v-if="variant === 'segmented'"
      :model-value="modelValue"
      :options="options"
      :aria-label="label"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <!-- A look: the alternatives shown side by side, each able to describe
         itself. -->
    <div
      v-else
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
import SegmentedField from '../common/SegmentedField.vue'
import { FIELD_LABEL, optionClass, optionIconClass } from './templateUi'

export interface TemplateFormChoiceOption {
  value: string
  label: string
  description?: string
  icon?: LucideIcon
}

/**
 * One choice, drawn one of two ways.
 *
 * `cards` (the default) is for a choice between *looks* — which host layout,
 * which agenda composition, artwork cover vs filmed cover. Each option can
 * carry a description and an icon, and showing them side by side is both faster
 * and more honest than a `<select>` that hides every alternative behind a
 * click. Longer lists (fonts, particle types) still belong on
 * TemplateFormSelect.
 *
 * `segmented` is for a choice of *magnitude*: light / normal / heavy, slow /
 * normal / fast, subtle / normal / bright, none / soft / raised. Eight of these
 * were drawn as three-across cards, which is the wrong shape for them twice
 * over — three separate boxes say nothing about the fact that these values are
 * ordered, and a card whose only content is one word is a card that has nothing
 * to put in it. A segmented track puts the steps on one line in their own
 * order, so the control's shape maps to what it changes (apple-design §16,
 * grouping & mapping).
 *
 * The segmented rendering delegates to the drawers' `SegmentedField` rather
 * than reimplementing a track here: it already carries the sliding cap, the
 * roving tabindex and the reduced-motion rule, and a second implementation
 * would be a second set of answers to all three.
 */
withDefaults(
  defineProps<{
    modelValue: string
    options: TemplateFormChoiceOption[]
    label?: string
    columns?: 1 | 2 | 3
    variant?: 'cards' | 'segmented'
  }>(),
  { columns: 2, variant: 'cards' },
)

const emit = defineEmits<{ 'update:modelValue': [string] }>()
</script>
