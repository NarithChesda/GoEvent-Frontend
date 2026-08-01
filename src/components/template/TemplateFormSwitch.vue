<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    @click="emit('update:modelValue', !modelValue)"
    class="w-full flex items-center justify-between gap-3 p-3 rounded-xl text-left transition-colors duration-200"
    :class="modelValue ? 'bg-sky-50/70 hover:bg-sky-50' : 'bg-slate-50 hover:bg-slate-100'"
  >
    <span class="flex items-center gap-3 min-w-0">
      <span v-if="icon" class="flex-shrink-0 p-2 bg-white rounded-lg shadow-sm">
        <component :is="icon" class="w-4 h-4" :class="modelValue ? 'text-sky-500' : 'text-slate-400'" />
      </span>
      <span class="min-w-0">
        <span class="block text-sm font-medium text-slate-700">{{ label }}</span>
        <span v-if="description" class="block text-xs text-slate-500 leading-snug">{{ description }}</span>
      </span>
    </span>
    <span
      :class="[
        'relative h-6 w-11 rounded-full flex-shrink-0 transition-colors duration-200',
        modelValue ? 'bg-sky-500' : 'bg-slate-300',
      ]"
      aria-hidden="true"
    >
      <span
        :class="[
          'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
          modelValue ? 'translate-x-5' : 'translate-x-0',
        ]"
      />
    </span>
  </button>
</template>

<script setup lang="ts">
import type { LucideIcon } from 'lucide-vue-next'

/**
 * The §8 settings toggle row, as a component. The partner template form had this
 * markup copied out five times with slightly different paddings each time.
 */
defineProps<{
  modelValue: boolean
  label: string
  description?: string
  icon?: LucideIcon
}>()

const emit = defineEmits<{ 'update:modelValue': [boolean] }>()
</script>
