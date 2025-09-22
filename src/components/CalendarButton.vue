<template>
  <button
    @click="$emit('click')"
    class="bg-white border border-slate-200 hover:border-[#5eb3f6] hover:bg-[#E6F4FF] text-slate-700 hover:text-[#1873cc] text-xs font-medium py-2 px-3 rounded-lg transition-all duration-200 hover:scale-[1.02] flex items-center justify-center"
  >
    <Calendar v-if="icon === 'calendar'" class="w-3 h-3 mr-1" />
    <Download v-else-if="icon === 'download'" class="w-3 h-3 mr-1" />
    <Calendar v-else class="w-3 h-3 mr-1" />
    {{ provider }}
  </button>
</template>

<script setup lang="ts">
import { Calendar, Download } from 'lucide-vue-next'

interface Props {
  provider: string
  icon?: 'calendar' | 'download'
}

interface Emits {
  click: []
}

withDefaults(defineProps<Props>(), {
  icon: 'calendar',
})

defineEmits<Emits>()
</script>
