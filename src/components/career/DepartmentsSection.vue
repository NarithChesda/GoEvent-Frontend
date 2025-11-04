<template>
  <section class="py-12 sm:py-16 md:py-20 bg-white relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="text-center mb-8 sm:mb-12">
        <div
          class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-[#B0E0E6] text-[#1873cc] mb-4 sm:mb-6"
        >
          <Layers class="h-3 w-3 sm:h-4 sm:w-4" />
          Our Teams
        </div>
        <h2
          class="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-5 leading-tight tracking-tight px-4"
        >
          Explore Our
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]">
            Departments
          </span>
        </h2>
        <p class="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto px-4">
          Find your perfect fit across our diverse teams
        </p>
      </div>

      <!-- Desktop Grid -->
      <div class="hidden lg:grid lg:grid-cols-4 gap-6">
        <DepartmentCard
          v-for="dept in departments"
          :key="dept.id"
          :department="dept"
          :active="selectedDepartment === dept.id"
          @click="handleDepartmentClick(dept.id)"
        />
      </div>

      <!-- Mobile/Tablet Horizontal Scroll -->
      <div class="lg:hidden">
        <div class="overflow-x-auto snap-x snap-mandatory -mx-4 px-4 scrollbar-hide">
          <div class="flex gap-4 pb-4">
            <DepartmentCard
              v-for="dept in departments"
              :key="dept.id"
              :department="dept"
              :active="selectedDepartment === dept.id"
              @click="handleDepartmentClick(dept.id)"
            />
          </div>
        </div>

        <!-- Scroll Hint -->
        <div class="flex justify-center gap-2 mt-4">
          <div
            v-for="(dept, index) in departments"
            :key="dept.id"
            class="w-2 h-2 rounded-full transition-colors"
            :class="selectedDepartment === dept.id ? 'bg-[#1e90ff]' : 'bg-slate-300'"
          ></div>
        </div>
      </div>

      <!-- Clear Filter Button -->
      <div v-if="selectedDepartment" class="text-center mt-8">
        <button
          @click="handleDepartmentClick(null)"
          class="inline-flex items-center gap-2 text-[#1e90ff] hover:text-[#1873cc] font-semibold text-sm transition-colors"
        >
          <X class="w-4 h-4" />
          Clear Department Filter
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Layers, X } from 'lucide-vue-next'
import DepartmentCard from './DepartmentCard.vue'
import type { CareerDepartment } from '@/services/api'

defineProps<{
  departments: CareerDepartment[]
  selectedDepartment?: number | null
}>()

const emit = defineEmits<{
  filter: [departmentId: number | null]
}>()

const handleDepartmentClick = (departmentId: number | null) => {
  emit('filter', departmentId)
}
</script>

<style scoped>
/* Hide scrollbar for mobile scroll */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
