<template>
  <div
    class="flex items-center gap-1.5"
    role="group"
    :aria-label="t('management.partnerTemplatesPanel.filter.ariaLabel')"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :class="[CHIP_BASE, modelValue === option.value ? OPTION_SELECTED : OPTION_IDLE]"
      :aria-pressed="modelValue === option.value"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
      <span class="ml-1 tabular-nums opacity-60">{{ option.count }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CHIP_BASE, OPTION_IDLE, OPTION_SELECTED } from './templateUi'

export type TemplateTypeValue = 'all' | 'system' | 'partner'

export interface TemplateTypeFilterOption {
  value: TemplateTypeValue
  label: string
  count: number
}

/**
 * Which author's templates the "Mine" panel is showing — system, partner, or
 * both. Staff only: a partner's list is all their own work, so the control
 * would offer one populated shelf and two empty ones.
 *
 * Chips rather than the modal's segmented switch, deliberately. Gradient fill
 * and a sliding thumb are that switch's way of saying "you are *in* this view",
 * and it is spent on Browse/Mine one row above this; a filter is one option
 * among visible alternatives, which is what `OPTION_SELECTED` (gradient tint +
 * sky ring) means everywhere else in the modal — the package plans, the rail
 * sections, the cover block chips. Two gradient-filled controls stacked in the
 * same header would also read as two levels of the same navigation.
 *
 * Each chip carries its own count, so the group doubles as the roll-up the
 * status summary gives a partner. See PartnerTemplatesPanel.
 */
defineProps<{
  modelValue: TemplateTypeValue
  options: TemplateTypeFilterOption[]
}>()

const emit = defineEmits<{ 'update:modelValue': [TemplateTypeValue] }>()

const { t } = useI18n()
</script>
