<template>
  <div class="flex bg-slate-100 rounded-xl p-1">
    <button
      type="button"
      @click="selectType('cash')"
      :class="[
        'flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2',
        modelValue === 'cash'
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-600 hover:text-slate-900'
      ]"
    >
      <Banknote class="w-4 h-4" />
      <span>Cash</span>
    </button>
    <button
      v-if="showItemOption"
      type="button"
      @click="selectType('item')"
      :class="[
        'flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2',
        modelValue === 'item'
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-600 hover:text-slate-900'
      ]"
    >
      <Package class="w-4 h-4" />
      <span>Item</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { Banknote, Package } from 'lucide-vue-next'
import type { DonationType } from '@/services/api/types/donation.types'

interface Props {
  modelValue: DonationType
  showItemOption?: boolean
}

withDefaults(defineProps<Props>(), {
  showItemOption: true
})

const emit = defineEmits<{
  'update:modelValue': [value: DonationType]
}>()

const selectType = (type: DonationType) => {
  emit('update:modelValue', type)
}
</script>
