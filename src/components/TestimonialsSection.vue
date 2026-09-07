<template>
  <section
    id="testimonials"
    class="tst-section relative overflow-hidden py-16 sm:py-20 md:py-24"
  >
    <!-- Ambient ground: tinted brand light, not a gradient object -->
    <div class="pointer-events-none absolute inset-0" aria-hidden="true">
      <div
        class="absolute -top-32 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[#2ecc71]/[0.07] blur-3xl"
      ></div>
      <div
        class="absolute -bottom-40 -right-24 h-[26rem] w-[26rem] rounded-full bg-[#1e90ff]/[0.07] blur-3xl"
      ></div>
    </div>

    <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <TestimonialWall :items="items" :stats="stats" align="center">
        <template #header>
          <div class="mx-auto mb-8 max-w-3xl text-center">
            <div
              class="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[#B0E0E6] px-3 py-1.5 text-xs font-medium text-[#1873cc] sm:mb-6 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
            >
              <Quote class="h-3 w-3 sm:h-4 sm:w-4" />
              Client Success Stories
            </div>
            <h2
              class="type-display-sm text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl"
            >
              Loved by organizers across
              <span
                class="clip-text-safe bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] bg-clip-text text-transparent"
              >
                Cambodia</span
              >
            </h2>
            <p class="mt-4 text-base leading-relaxed text-slate-600 sm:mt-6 sm:text-lg">
              Weddings, conferences, birthdays and family gatherings — here is what the people
              running them say, in their own words.
            </p>
          </div>
        </template>
      </TestimonialWall>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Quote } from 'lucide-vue-next'
import TestimonialWall from './TestimonialWall.vue'
import testimonialsData from '../assets/testimonials.json'

const items = testimonialsData.organizers.items
const { rating, reviews, events } = testimonialsData.organizers.stats

const stats = [
  { value: rating, label: 'average rating', star: true },
  { value: reviews, label: 'reviews' },
  { value: events, label: 'events created' },
]
</script>

<style scoped>
.tst-section {
  background: linear-gradient(to bottom, #ffffff, #f8fafc 45%, #ffffff);
}
</style>
