<template>
  <section class="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/30 to-white relative">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="text-center mb-8 sm:mb-12">
        <div
          class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-[#B0E0E6] text-[#1873cc] mb-4 sm:mb-6"
        >
          <MessageSquare class="h-3 w-3 sm:h-4 sm:w-4" />
          Employee Stories
        </div>
        <h2
          class="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-5 leading-tight tracking-tight px-4"
        >
          Hear From Our
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]">
            Team
          </span>
        </h2>
      </div>

      <!-- Testimonials Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        <div
          v-for="testimonial in testimonials"
          :key="testimonial.id"
          class="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-200 hover:shadow-2xl transition-shadow"
        >
          <!-- Employee Photo -->
          <div class="flex justify-center mb-6">
            <div
              class="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-[#B0E0E6] shadow-lg"
            >
              <img
                v-if="testimonial.photo"
                :src="testimonial.photo"
                :alt="testimonial.employee_name"
                class="w-full h-full object-cover"
                loading="lazy"
              />
              <div
                v-else
                class="w-full h-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white text-xl font-bold"
              >
                {{ getInitials(testimonial.employee_name) }}
              </div>
            </div>
          </div>

          <!-- Quote -->
          <blockquote class="text-slate-700 text-base leading-relaxed mb-6 text-center italic">
            "{{ testimonial.quote }}"
          </blockquote>

          <!-- Employee Info -->
          <div class="text-center border-t border-slate-200 pt-4">
            <h4 class="font-bold text-slate-900 text-lg">{{ testimonial.employee_name }}</h4>
            <p class="text-[#1e90ff] font-medium text-sm">{{ testimonial.job_title }}</p>
            <p class="text-slate-500 text-xs mt-1">{{ testimonial.department_name }}</p>

            <!-- Rating -->
            <div class="flex justify-center gap-1 mt-3">
              <Star
                v-for="i in testimonial.rating"
                :key="i"
                class="w-4 h-4 fill-yellow-400 text-yellow-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { MessageSquare, Star } from 'lucide-vue-next'
import type { CareerTestimonial } from '@/services/api'

defineProps<{
  testimonials: CareerTestimonial[]
}>()

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}
</script>
