<template>
  <section
    class="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-emerald-50 via-sky-50 to-emerald-50 relative"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="text-center mb-8 sm:mb-12">
        <div
          class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-gradient-to-r from-emerald-500/20 to-sky-500/20 backdrop-blur-sm border border-white/30 text-[#1873cc] mb-4 sm:mb-6"
        >
          <Star class="h-3 w-3 sm:h-4 sm:w-4 fill-current" />
          Hot Opportunities
        </div>
        <h2
          class="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-5 leading-tight tracking-tight px-4"
        >
          Featured
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]">
            Positions
          </span>
        </h2>
        <p class="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto px-4">
          Explore our hand-picked opportunities that are waiting for talented individuals like you
        </p>
      </div>

      <!-- Featured Positions Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        <div
          v-for="position in positions"
          :key="position.id"
          class="group bg-white/95 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/50 shadow-2xl shadow-[#1e90ff]/10 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer active:scale-[0.98]"
          @click="$emit('view', position.id)"
        >
          <!-- Featured Badge -->
          <div class="flex items-center gap-2 mb-4">
            <span
              class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-xs font-bold px-3 py-1 rounded-full"
            >
              FEATURED
            </span>
          </div>

          <!-- Position Title -->
          <h3
            class="text-xl sm:text-2xl font-bold text-slate-900 mb-4 group-hover:text-[#1e90ff] transition-colors"
          >
            {{ position.title }}
          </h3>

          <!-- Meta Info -->
          <div class="flex flex-wrap gap-3 mb-4">
            <span
              class="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-full"
            >
              <Briefcase class="w-3 h-3" />
              {{ position.department.name }}
            </span>
            <span
              class="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-full"
            >
              <MapPin class="w-3 h-3" />
              {{ position.location_type_display }}
            </span>
            <span
              class="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-full"
            >
              <Clock class="w-3 h-3" />
              {{ position.employment_type_display }}
            </span>
          </div>

          <!-- Short Description -->
          <p class="text-slate-600 text-sm sm:text-base mb-6 line-clamp-3">
            {{ position.short_description }}
          </p>

          <!-- Action Button -->
          <button
            class="w-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 group/btn"
            @click.stop="$emit('view', position.id)"
          >
            View Position
            <ArrowRight class="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      <!-- View All CTA -->
      <div class="text-center mt-12">
        <button
          @click="scrollToAllPositions"
          class="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-[#1e90ff] font-semibold px-8 py-4 rounded-xl border-2 border-[#1e90ff] hover:border-[#1873cc] hover:text-[#1873cc] transition-all shadow-lg hover:shadow-xl"
        >
          View All Open Positions
          <ChevronDown class="w-5 h-5" />
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Star, Briefcase, MapPin, Clock, ArrowRight, ChevronDown } from 'lucide-vue-next'
import type { CareerPosition } from '@/services/api'

defineProps<{
  positions: CareerPosition[]
}>()

defineEmits<{
  view: [positionId: number]
}>()

const scrollToAllPositions = () => {
  document.getElementById('positions-section')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
