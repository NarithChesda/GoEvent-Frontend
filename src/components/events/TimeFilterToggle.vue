<template>
  <div class="flex items-center bg-slate-100 rounded-full p-1">
    <button
      v-for="option in options"
      :key="option.value"
      @click="$emit('update:modelValue', option.value)"
      :class="[
        'px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium rounded-full transition-all duration-200',
        modelValue === option.value
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-600 hover:text-slate-900',
      ]"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
export interface FilterOption {
  value: string
  label: string
}

withDefaults(
  defineProps<{
    modelValue: string
    options: FilterOption[]
  }>(),
  {}
)

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
