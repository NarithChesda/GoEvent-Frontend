<template>
  <!-- Mobile Category Toggle -->
  <div class="sm:hidden mb-4 overflow-x-auto scrollbar-hide">
    <div class="flex items-center glass-toggle rounded-full p-1 w-fit">
      <button
        v-for="category in categories"
        :key="category.id"
        @click="$emit('update:modelValue', category.id)"
        :class="[
          'px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-300 whitespace-nowrap',
          modelValue === category.id
            ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-md shadow-[#2ecc71]/20'
            : 'text-slate-600 hover:text-slate-800'
        ]"
      >
        {{ category.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ServiceCategory } from './types'

defineProps<{
  modelValue: string
  categories: ServiceCategory[]
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.glass-toggle {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.4);
}
</style>
