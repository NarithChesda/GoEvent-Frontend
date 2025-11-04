<template>
  <section
    class="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 overflow-hidden -mt-20"
  >
    <!-- Enhanced Background Elements -->
    <div class="absolute inset-0 pointer-events-none">
      <!-- Primary gradient overlay -->
      <div
        class="absolute inset-0 bg-gradient-to-br from-emerald-600/5 via-green-500/5 to-emerald-500/5"
      ></div>

      <!-- Animated background shapes -->
      <div
        class="absolute top-20 left-10 w-80 h-80 bg-gradient-to-br from-emerald-400/30 to-green-500/30 rounded-full mix-blend-multiply filter blur-2xl animate-pulse"
      ></div>
      <div
        class="absolute top-40 right-10 w-96 h-96 bg-gradient-to-br from-green-400/25 to-emerald-400/25 rounded-full mix-blend-multiply filter blur-2xl animate-pulse delay-1000"
      ></div>
      <div
        class="absolute -bottom-8 left-20 w-80 h-80 bg-gradient-to-br from-emerald-300/30 to-green-400/30 rounded-full mix-blend-multiply filter blur-2xl animate-pulse delay-500"
      ></div>
    </div>

    <div
      class="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 pt-20 sm:pt-28 lg:pt-32"
    >
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
        <!-- Left Column - Main Content -->
        <div class="lg:col-span-7 space-y-6 sm:space-y-8 animate-slide-in-left text-center lg:text-left">
          <div class="space-y-4 sm:space-y-6">
            <!-- Badge -->
            <div
              class="inline-flex items-center bg-gradient-to-r from-emerald-500/20 to-sky-500/20 backdrop-blur-sm border border-white/30 text-[#1873cc] text-xs sm:text-sm font-medium px-4 sm:px-6 py-2 sm:py-3 rounded-full animate-fade-in animation-delay-100 shadow-lg shadow-[#87CEEB]/30"
            >
              <Briefcase class="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Career Opportunities
            </div>

            <!-- Title -->
            <h1
              class="text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold leading-tight tracking-tight text-slate-900 animate-fade-in animation-delay-500"
            >
              {{ settings.hero_title || 'Build the Future of' }}
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]">
                {{ settings.hero_subtitle || 'Event Tech' }}
              </span>
            </h1>

            <!-- Subtitle -->
            <p
              class="text-base sm:text-lg lg:text-lg xl:text-xl text-slate-700 leading-relaxed max-w-prose animate-fade-in animation-delay-1000"
            >
              Join our mission to transform businesses through AI-driven innovation and cutting-edge
              technology.
            </p>
          </div>

          <!-- Stats -->
          <div
            class="flex flex-row gap-3 sm:gap-4 lg:gap-4 xl:gap-6 animate-fade-in animation-delay-1200 justify-center lg:justify-start"
          >
            <div
              class="flex-1 sm:flex-none bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 sm:px-6 sm:py-4 border border-white/50 shadow-lg"
            >
              <div class="text-center">
                <div class="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1e90ff]">
                  {{ stats.teamMembers }}+
                </div>
                <div class="text-xs sm:text-sm text-slate-600 font-medium">Team Members</div>
              </div>
            </div>

            <div
              class="flex-1 sm:flex-none bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 sm:px-6 sm:py-4 border border-white/50 shadow-lg"
            >
              <div class="text-center">
                <div class="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-600">
                  {{ stats.openRoles }}+
                </div>
                <div class="text-xs sm:text-sm text-slate-600 font-medium">Open Roles</div>
              </div>
            </div>

            <div
              class="flex-1 sm:flex-none bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 sm:px-6 sm:py-4 border border-white/50 shadow-lg"
            >
              <div class="text-center">
                <div class="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600">
                  {{ stats.remoteOk }}
                </div>
                <div class="text-xs sm:text-sm text-slate-600 font-medium">Remote OK</div>
              </div>
            </div>
          </div>

          <!-- CTA Buttons -->
          <div
            class="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-4 xl:gap-6 animate-fade-in animation-delay-1400 justify-center lg:justify-start"
          >
            <button
              @click="scrollToPositions"
              class="group bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold px-6 py-3 sm:px-8 sm:py-4 rounded-lg shadow-lg shadow-emerald-500/25 text-sm sm:text-base transition-all duration-200 hover:shadow-xl hover:shadow-emerald-600/30 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] active:shadow-md text-center flex-1 sm:flex-none min-h-[48px]"
            >
              {{ settings.cta_button_text || 'Explore Positions' }}
              <ArrowRight
                class="inline w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300"
              />
            </button>

            <a
              href="#why-join"
              class="flex items-center justify-center bg-white text-[#1e90ff] font-semibold px-6 py-3 sm:px-8 sm:py-4 rounded-lg border-2 border-[#87CEEB] text-sm sm:text-base shadow-sm transition-all duration-200 hover:bg-[#E6F4FF] hover:border-[#5eb3f6] hover:shadow-md hover:scale-[1.02] active:bg-[#B0E0E6] active:scale-[0.98] group flex-1 sm:flex-none min-h-[48px]"
            >
              <Users
                class="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:scale-110 transition-transform duration-300"
              />
              Learn More
            </a>
          </div>

          <!-- Department Tags (Mobile/Desktop) -->
          <div
            class="hidden lg:flex flex-wrap gap-2 animate-fade-in animation-delay-1600 justify-center lg:justify-start"
            v-if="departments.length > 0"
          >
            <span
              v-for="dept in departments.slice(0, 5)"
              :key="dept.id"
              class="inline-flex items-center gap-1.5 bg-white/60 backdrop-blur-sm border border-white/40 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700 hover:bg-white/80 transition-colors"
            >
              <span>{{ dept.icon }}</span>
              <span>{{ dept.name }}</span>
              <span
                class="bg-[#1e90ff]/10 text-[#1e90ff] px-1.5 py-0.5 rounded-full text-xs font-bold"
              >
                {{ dept.positions_count }}
              </span>
            </span>
          </div>
        </div>

        <!-- Right Column - Floating Card (Desktop Only) -->
        <div
          class="hidden lg:block lg:col-span-5 relative animate-slide-in-right animation-delay-200"
        >
          <div class="relative max-w-lg mx-auto">
            <!-- Main Card -->
            <div
              class="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl shadow-[#1e90ff]/20 p-6 lg:p-6 xl:p-8 border border-white/50"
            >
              <div class="flex items-center justify-between mb-6 xl:mb-8">
                <h3 class="text-lg xl:text-2xl font-bold text-gray-900">Join Our Team</h3>
                <div class="flex items-center space-x-2">
                  <div class="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span class="text-xs sm:text-sm text-gray-600 font-medium">Hiring Now</span>
                </div>
              </div>

              <!-- Department Stats -->
              <div class="space-y-3 mb-6 xl:mb-8">
                <div
                  v-for="dept in departments.slice(0, 3)"
                  :key="dept.id"
                  class="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-sky-50 rounded-lg hover:from-emerald-100 hover:to-sky-100 transition-colors cursor-pointer"
                >
                  <div class="flex items-center gap-3">
                    <span class="text-2xl">{{ dept.icon }}</span>
                    <div>
                      <div class="font-semibold text-slate-900 text-sm">{{ dept.name }}</div>
                      <div class="text-xs text-slate-600">{{ dept.positions_count }} positions</div>
                    </div>
                  </div>
                  <ArrowRight class="w-4 h-4 text-[#1e90ff]" />
                </div>
              </div>

              <!-- Progress Indicator -->
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-700">Hiring Progress</span>
                  <span class="text-sm font-bold text-gray-900">{{ hiringProgress }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3">
                  <div
                    class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] h-3 rounded-full transition-all duration-1000"
                    :style="{ width: `${hiringProgress}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Scroll Indicator -->
    <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
      <div class="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
        <div class="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Briefcase, Users, ArrowRight } from 'lucide-vue-next'
import type { CareerPageSettings, CareerDepartment } from '@/services/api'

interface Props {
  settings: CareerPageSettings
  stats: {
    teamMembers: number
    openRoles: number
    remoteOk: string
  }
  departments: CareerDepartment[]
}

const props = defineProps<Props>()

const hiringProgress = computed(() => {
  // Calculate based on open roles vs target
  return Math.min(Math.round((props.stats.openRoles / 10) * 100), 85)
})

const scrollToPositions = () => {
  document.getElementById('positions-section')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-fade-in {
  animation: fadeIn 1s ease-out forwards;
}

.animate-slide-in-left {
  animation: slideInLeft 1s ease-out forwards;
}

.animate-slide-in-right {
  animation: slideInRight 1s ease-out forwards;
}

.animation-delay-100 {
  animation-delay: 0.1s;
}

.animation-delay-200 {
  animation-delay: 0.2s;
}

.animation-delay-500 {
  animation-delay: 0.5s;
}

.animation-delay-1000 {
  animation-delay: 1s;
}

.animation-delay-1200 {
  animation-delay: 1.2s;
}

.animation-delay-1400 {
  animation-delay: 1.4s;
}

.animation-delay-1600 {
  animation-delay: 1.6s;
}

.delay-500 {
  animation-delay: 0.5s;
}

.delay-1000 {
  animation-delay: 1s;
}
</style>
