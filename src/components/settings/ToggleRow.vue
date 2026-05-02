<template>
  <label
    class="flex items-start gap-4 px-4 py-3.5 cursor-pointer transition-colors"
    :class="[disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-slate-50']"
  >
    <div class="flex-1 min-w-0">
      <div class="text-sm font-medium text-slate-900">{{ label }}</div>
      <div v-if="description" class="text-xs text-slate-500 mt-0.5">
        {{ description }}
      </div>
    </div>
    <div class="flex-shrink-0 pt-0.5">
      <button
        type="button"
        role="switch"
        :aria-checked="modelValue"
        :aria-label="label"
        :disabled="disabled"
        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#2ecc71]/40 focus:ring-offset-2 disabled:cursor-not-allowed"
        :class="modelValue ? 'bg-[#2ecc71]' : 'bg-slate-300'"
        @click="toggle"
      >
        <span
          class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200"
          :class="modelValue ? 'translate-x-5' : 'translate-x-0.5'"
        />
      </button>
    </div>
  </label>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  label: string
  description?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>
