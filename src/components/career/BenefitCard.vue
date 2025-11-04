<template>
  <div
    class="group relative bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-lg hover:-translate-y-2 hover:shadow-xl transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1e90ff] active:scale-[0.98]"
    tabindex="0"
  >
    <!-- Top accent bar -->
    <div
      class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] rounded-t-xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"
    ></div>

    <div class="relative">
      <!-- Icon -->
      <div class="relative mb-4 sm:mb-6">
        <div
          class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-100 to-sky-100 group-hover:scale-110 transition-transform"
        >
          <span class="text-2xl sm:text-3xl">{{ benefit.icon }}</span>
        </div>
      </div>

      <!-- Content -->
      <div class="space-y-3 sm:space-y-4">
        <h3
          class="text-lg sm:text-xl font-bold text-slate-900 leading-snug group-hover:bg-gradient-to-r group-hover:from-[#2ecc71] group-hover:to-[#1e90ff] group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300"
        >
          {{ benefit.title }}
        </h3>
        <p class="text-sm sm:text-base text-slate-600 leading-relaxed">
          {{ benefit.description }}
        </p>
      </div>
    </div>

    <!-- Hover effect background -->
    <div
      class="absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-sky-50/0 group-hover:from-emerald-50/30 group-hover:to-sky-50/30 rounded-xl transition-all duration-300 -z-10"
    ></div>
  </div>
</template>

<script setup lang="ts">
import type { CareerBenefit } from '@/services/api'

defineProps<{
  benefit: CareerBenefit
}>()
</script>
