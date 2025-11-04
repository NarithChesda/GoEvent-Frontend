<template>
  <section class="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/30 to-white relative overflow-hidden">
    <!-- Background decoration -->
    <div class="absolute inset-0 pointer-events-none opacity-50">
      <div
        class="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-emerald-200/30 to-sky-200/20 rounded-full blur-3xl"
      ></div>
      <div
        class="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-sky-200/20 to-emerald-200/30 rounded-full blur-3xl"
      ></div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <!-- Section Header -->
      <div class="text-center mb-8 sm:mb-12 md:mb-16">
        <div
          class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-[#B0E0E6] text-[#1873cc] mb-4 sm:mb-6"
        >
          <Gift class="h-3 w-3 sm:h-4 sm:h-4" />
          Benefits & Perks
        </div>
        <h2
          class="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-5 md:mb-6 leading-tight tracking-tight px-4"
        >
          What We
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]">
            Offer
          </span>
        </h2>
        <p class="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto px-4">
          Comprehensive benefits designed to support your growth, well-being, and work-life balance
        </p>
      </div>

      <!-- Benefits Grid -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
      >
        <BenefitCard v-for="benefit in benefits" :key="benefit.id" :benefit="benefit" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Gift } from 'lucide-vue-next'
import BenefitCard from './BenefitCard.vue'
import type { CareerBenefit } from '@/services/api'

defineProps<{
  benefits: CareerBenefit[]
}>()
</script>
