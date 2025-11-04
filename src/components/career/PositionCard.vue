<template>
  <article
    class="bg-white border border-slate-200 rounded-xl p-6 hover:border-[#1e90ff] hover:shadow-lg transition-all duration-300 cursor-pointer active:scale-[0.98]"
    @click="$emit('view', position.id)"
  >
    <div class="flex justify-between items-start mb-4">
      <div class="flex-1">
        <h3 class="text-lg sm:text-xl font-bold text-slate-900 mb-2 hover:text-[#1e90ff] transition-colors">
          {{ position.title }}
        </h3>

        <div class="flex flex-wrap gap-3 text-sm text-slate-600">
          <span class="flex items-center gap-1">
            <Briefcase class="w-4 h-4" />
            {{ position.department.name }}
          </span>
          <span class="flex items-center gap-1">
            <MapPin class="w-4 h-4" />
            {{ position.location_type_display }}
          </span>
          <span class="flex items-center gap-1">
            <Clock class="w-4 h-4" />
            {{ position.employment_type_display }}
          </span>
        </div>
      </div>

      <!-- Featured badge -->
      <span
        v-if="position.featured"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ml-4"
      >
        Featured
      </span>
    </div>

    <!-- Short description -->
    <p class="text-slate-600 text-sm sm:text-base mb-4 line-clamp-2">
      {{ position.short_description }}
    </p>

    <!-- Footer -->
    <div class="flex justify-between items-center pt-4 border-t border-slate-100">
      <div class="text-xs text-slate-500">
        {{ position.applications_count }} {{ position.applications_count === 1 ? 'application' : 'applications' }}
      </div>
      <button
        class="text-[#1e90ff] hover:text-[#1873cc] font-semibold text-sm flex items-center gap-1 group min-h-[44px] px-3 -mr-3"
        @click.stop="$emit('view', position.id)"
      >
        View Details
        <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { Briefcase, MapPin, Clock, ArrowRight } from 'lucide-vue-next'
import type { CareerPosition } from '@/services/api'

defineProps<{
  position: CareerPosition
}>()

defineEmits<{
  view: [id: number]
}>()
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
