<template>
  <div class="flex items-center glass-toggle rounded-full p-1">
    <button
      v-for="option in options"
      :key="option.value"
      @click="$emit('update:modelValue', option.value)"
      :class="[
        'px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium rounded-full transition-all duration-300',
        modelValue === option.value
          ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-md shadow-[#2ecc71]/20'
          : 'text-slate-600 hover:text-slate-800',
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

<style scoped>
.glass-toggle {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 2px 8px rgba(46, 204, 113, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}
</style>
