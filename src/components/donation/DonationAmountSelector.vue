<template>
  <div class="space-y-3">
    <label class="block text-sm font-medium text-slate-700">
      Donation Amount <span class="text-red-500">*</span>
    </label>

    <!-- Preset Amount Buttons -->
    <div class="grid grid-cols-3 gap-2">
      <button
        v-for="preset in presetAmounts"
        :key="preset"
        type="button"
        @click="selectAmount(preset)"
        :class="[
          'py-3 px-2 text-sm font-semibold rounded-xl border-2 transition-all',
          modelValue === preset
            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
            : 'border-slate-200 hover:border-emerald-300 text-slate-700 hover:bg-slate-50'
        ]"
      >
        {{ formatCurrency(preset) }}
      </button>
    </div>

    <!-- Custom Amount Input -->
    <div class="relative">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">
        {{ currencySymbol }}
      </span>
      <input
        :value="modelValue"
        @input="handleInput"
        type="number"
        min="1"
        :step="currency === 'KHR' ? '1000' : '0.01'"
        placeholder="Custom amount"
        class="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
        :class="{ 'border-red-300 focus:ring-red-500 focus:border-red-500': error }"
      />
    </div>

    <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DonationCurrency } from '@/services/api/types/donation.types'

interface Props {
  modelValue?: number
  currency?: DonationCurrency
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  currency: 'USD',
  error: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

// Preset amounts based on currency
const presetAmounts = computed(() => {
  if (props.currency === 'KHR') {
    return [10000, 50000, 100000]
  }
  return [10, 50, 100]
})

const currencySymbol = computed(() => {
  return props.currency === 'KHR' ? '៛' : '$'
})

const formatCurrency = (amount: number): string => {
  if (props.currency === 'KHR') {
    return `៛${amount.toLocaleString()}`
  }
  return `$${amount.toLocaleString()}`
}

const selectAmount = (amount: number) => {
  emit('update:modelValue', amount)
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value ? parseFloat(target.value) : undefined
  emit('update:modelValue', value)
}
</script>
