<template>
  <section class="py-12 sm:py-16 md:py-20 bg-white relative overflow-hidden">
    <!-- Background decoration -->
    <div class="absolute inset-0 pointer-events-none">
      <div
        class="absolute top-0 left-0 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-gradient-to-br from-emerald-100/40 to-sky-100/30 rounded-full blur-3xl"
      ></div>
      <div
        class="absolute bottom-0 right-0 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-gradient-to-br from-sky-100/35 to-emerald-100/25 rounded-full blur-3xl"
      ></div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <!-- Floating Box Container -->
      <div
        class="bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 lg:p-12 shadow-2xl shadow-[#1e90ff]/20 backdrop-blur-sm border border-white/10"
      >
        <div class="text-center max-w-4xl mx-auto">
          <div
            class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-white/10 backdrop-blur-sm border border-white/20 text-white mb-4 sm:mb-6"
          >
            <Rocket class="h-3 w-3 sm:h-4 sm:w-4" />
            Start Your Journey
          </div>

          <h2
            class="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-5 md:mb-6 leading-tight tracking-tight"
          >
            Ready to
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-sky-200">
              Make an Impact?
            </span>
          </h2>

          <p class="text-base sm:text-lg md:text-xl text-[#B0E0E6] mb-6 sm:mb-8 leading-relaxed max-w-3xl mx-auto px-4">
            {{ settings.cta_text || 'Join our team of innovators and help build the future of event management' }}
          </p>

          <!-- Stats -->
          <div class="grid grid-cols-3 gap-4 mb-8 max-w-lg mx-auto">
            <div class="text-center">
              <div class="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-1">
                &lt; 48h
              </div>
              <div class="text-xs sm:text-sm text-white/80">Avg Response</div>
            </div>
            <div class="text-center">
              <div class="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-1">
                {{ openPositions }}+
              </div>
              <div class="text-xs sm:text-sm text-white/80">Open Roles</div>
            </div>
            <div class="text-center">
              <div class="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-1">
                100%
              </div>
              <div class="text-xs sm:text-sm text-white/80">Remote OK</div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              @click="scrollToPositions"
              class="bg-white hover:bg-[#E6F4FF] text-[#1e90ff] hover:text-[#1873cc] font-bold px-8 py-4 rounded-xl text-base shadow-lg transition-all hover:scale-105 min-h-[48px]"
            >
              {{ settings.cta_button_text || 'View Open Positions' }}
            </button>
            <a
              v-if="settings.career_email"
              :href="`mailto:${settings.career_email}`"
              class="bg-white/10 border-2 border-white/30 text-white font-bold px-8 py-4 rounded-xl text-base backdrop-blur-sm hover:bg-white/20 transition-all min-h-[48px] flex items-center justify-center"
            >
              Contact Us
            </a>
          </div>

          <!-- Contact Info -->
          <div class="text-white/80 text-sm space-y-1">
            <p v-if="settings.career_email">{{ settings.career_email }}</p>
            <p v-if="settings.career_phone">{{ settings.career_phone }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Rocket } from 'lucide-vue-next'
import type { CareerPageSettings } from '@/services/api'

defineProps<{
  settings: CareerPageSettings
  openPositions: number
}>()

const scrollToPositions = () => {
  document.getElementById('positions-section')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}
</script>
