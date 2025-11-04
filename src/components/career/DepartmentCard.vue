<template>
  <div
    class="group bg-white rounded-xl p-6 border-2 transition-all duration-300 cursor-pointer hover:shadow-xl active:scale-[0.98] min-h-[140px] flex flex-col justify-center min-w-[280px] snap-center"
    :class="[
      active
        ? 'border-[#1e90ff] shadow-lg shadow-[#1e90ff]/20'
        : 'border-slate-200 hover:border-[#1e90ff]',
    ]"
    @click="$emit('click')"
  >
    <div class="text-center">
      <!-- Icon -->
      <div class="text-4xl mb-3 group-hover:scale-110 transition-transform">
        {{ department.icon }}
      </div>

      <!-- Name -->
      <h3 class="text-lg font-bold text-slate-900 mb-2 group-hover:text-[#1e90ff] transition-colors">
        {{ department.name }}
      </h3>

      <!-- Position Count -->
      <div class="flex items-center justify-center gap-2">
        <span class="text-sm text-slate-600">{{ department.positions_count }}</span>
        <span
          class="text-xs font-semibold px-2 py-0.5 rounded-full"
          :class="
            active
              ? 'bg-[#1e90ff] text-white'
              : 'bg-slate-100 text-slate-700 group-hover:bg-[#1e90ff] group-hover:text-white'
          "
        >
          {{ department.positions_count === 1 ? 'position' : 'open' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CareerDepartment } from '@/services/api'

defineProps<{
  department: CareerDepartment
  active?: boolean
}>()

defineEmits<{
  click: []
}>()
</script>
