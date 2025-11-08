<template>
  <MainLayout>
    <div class="min-h-screen">

    <!-- Hero Section -->
    <section
      id="hero"
      class="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 overflow-hidden -mt-20"
    >
      <!-- Optimized Background Elements -->
      <div class="absolute inset-0 pointer-events-none">
        <!-- Primary gradient overlay -->
        <div
          class="absolute inset-0 bg-gradient-to-br from-emerald-600/5 via-green-500/5 to-emerald-500/5"
        ></div>

        <!-- Reduced animated background shapes for better performance -->
        <div
          class="absolute top-20 left-10 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-green-500/20 rounded-full mix-blend-multiply hero-blur-shape animate-float"
        ></div>
        <div
          class="absolute top-40 right-10 w-96 h-96 bg-gradient-to-br from-green-400/15 to-emerald-400/15 rounded-full mix-blend-multiply hero-blur-shape animate-float-delayed"
        ></div>
        <div
          class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-emerald-200/8 to-green-300/8 rounded-full mix-blend-multiply hero-blur-large"
        ></div>
      </div>

      <div
        class="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 pt-20 sm:pt-28 lg:pt-32"
      >


        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-8 xl:gap-12 items-center">
          <div class="space-y-6 sm:space-y-8 animate-slide-in-left text-center lg:text-left">
            <div class="space-y-4 sm:space-y-6">
              <div
                class="inline-flex items-center bg-gradient-to-r from-emerald-500/20 to-sky-500/20 backdrop-blur-sm border border-white/30 text-[#1873cc] text-xs sm:text-sm font-medium px-4 sm:px-6 py-2 sm:py-3 rounded-full animate-fade-in animation-delay-100 shadow-lg shadow-[#87CEEB]/30"
              >
                <Sparkles class="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                #1 Event Management Platform
              </div>
              <div class="flex justify-center lg:justify-start animate-fade-in animation-delay-500 my-6 sm:my-8 lg:my-0">
                <img :src="LogoPng" alt="Create Unforgettable Events" class="h-20 sm:h-24 md:h-28 lg:h-32 xl:h-36 2xl:h-40 w-auto" />
              </div>
              <p
                class="text-base sm:text-lg lg:text-lg xl:text-xl text-slate-700 leading-relaxed max-w-prose animate-fade-in animation-delay-1000"
              >
                Streamline your event management with our comprehensive platform. From planning to execution, we've got you covered.
              </p>
            </div>

            <div
              class="flex flex-row gap-2 sm:gap-4 lg:gap-4 xl:gap-6 animate-fade-in animation-delay-1200"
            >
              <button
                @click="handleStartCreatingEvents"
                class="group bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold px-4 py-3 sm:px-8 sm:py-4 rounded-full shadow-lg shadow-emerald-500/25 text-sm sm:text-base transition-all duration-200 hover:shadow-xl hover:shadow-emerald-600/30 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] active:shadow-md text-center flex-1 sm:flex-none"
              >
                <span class="hidden sm:inline">Start Creating Events</span><span class="sm:hidden">Create Events</span>
                <ArrowRight
                  class="inline w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 ml-1 sm:ml-2 group-hover:translate-x-1 transition-transform duration-300"
                />
              </button>
              <button
                @click="scrollToDemo"
                class="flex items-center justify-center bg-white text-[#1e90ff] font-semibold px-4 py-3 sm:px-8 sm:py-4 rounded-full border-2 border-[#87CEEB] text-sm sm:text-base shadow-sm transition-all duration-200 hover:bg-[#E6F4FF] hover:border-[#5eb3f6] hover:shadow-md hover:scale-[1.02] active:bg-[#B0E0E6] active:scale-[0.98] group flex-1 sm:flex-none"
              >
                <Play
                  class="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2 group-hover:scale-110 transition-transform duration-300"
                />
                <span class="hidden sm:inline">Watch Demo</span><span class="sm:hidden">Demo</span>
              </button>
            </div>

            <div
              class="hidden lg:flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 lg:gap-8 text-xs sm:text-sm animate-fade-in animation-delay-1400"
            >
              <div class="flex items-center space-x-2 text-gray-600">
                <div
                  class="w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <Check class="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                </div>
                <span class="font-medium">Free to use platform</span>
              </div>
              <div class="flex items-center space-x-2 text-gray-600">
                <div
                  class="w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <Check class="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                </div>
                <span class="font-medium">No credit card required</span>
              </div>

            </div>
          </div>

          <div class="hidden lg:block relative animate-slide-in-right animation-delay-200">
            <div class="relative w-full lg:scale-125 lg:origin-center lg:translate-y-8">
              <!-- Hero Image - Phone and Laptop -->
              <img
                :src="HeroDevicesImg"
                alt="GoEvent platform on laptop and mobile devices showing guest management and analytics"
                class="w-full h-auto drop-shadow-2xl hover:drop-shadow-3xl transition-all duration-300"
                loading="eager"
              />
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

    <!-- Features Section -->
    <section
      id="features"
      ref="featuresSection"
      class="py-12 sm:py-16 md:py-20 scroll-animate features-bg"
      :class="{ 'animate-fade-in-up': isVisible.features }"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12 sm:mb-16 md:mb-20">
          <div
            class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-[#B0E0E6] text-[#1873cc] mb-4 sm:mb-6"
          >
            <Star class="h-3 w-3 sm:h-4 sm:w-4" />
            Features That Matter
          </div>
          <h2
            class="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-5 md:mb-6 leading-tight tracking-tight px-4"
          >
            Everything You Need to
            <span
              class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] bg-clip-text text-transparent"
            >
              Succeed</span
            >
          </h2>
          <p class="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-4">
            Powerful features designed to make event planning effortless, engaging, and memorable
            for both organizers and attendees.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          <div
            v-for="(feature, index) in features"
            :key="feature.title"
            class="group relative bg-white rounded-xl border border-slate-200 p-6 sm:p-7 md:p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:ring-offset-2"
            :class="index === 1 ? 'md:scale-105 md:z-10 border-[#B0E0E6]' : ''"
          >
            <!-- Top accent bar -->
            <div
              class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] rounded-t-xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"
            ></div>

            <div class="relative">
              <!-- Icon with design guide styling -->
              <div class="relative mb-4 sm:mb-5 md:mb-6">
                <div
                  class="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  :class="feature.bgColor"
                >
                  <component
                    :is="feature.icon"
                    class="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 transition-all duration-300"
                    :class="feature.iconColor"
                  />
                </div>
                <!-- Floating accent -->
                <div
                  class="absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100"
                ></div>
              </div>

              <!-- Content with design guide typography -->
              <div class="space-y-3 sm:space-y-3.5 md:space-y-4">
                <h3
                  class="text-lg sm:text-xl md:text-xl font-bold text-slate-900 leading-snug group-hover:bg-gradient-to-r group-hover:from-[#2ecc71] group-hover:to-[#1e90ff] group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300"
                >
                  {{ feature.title }}
                </h3>
                <p class="text-sm sm:text-base md:text-base text-slate-700 leading-relaxed">
                  {{ feature.description }}
                </p>
              </div>
            </div>

            <!-- Hover effect background -->
            <div
              class="absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-sky-50/0 group-hover:from-emerald-50/30 group-hover:to-sky-50/30 rounded-xl transition-all duration-300 -z-10"
            ></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section
      v-if="showTestimonials"
      id="testimonials"
      ref="testimonialsSection"
      class="py-12 sm:py-16 md:py-20 relative overflow-hidden scroll-animate"
      :class="{ 'animate-fade-in-up': isVisible.testimonials }"
    >
      <!-- Background gradient -->
      <div class="absolute inset-0 pointer-events-none testimonials-bg"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div class="text-center mb-12 sm:mb-16 md:mb-20">
          <div
            class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-[#B0E0E6] text-[#1873cc] mb-4 sm:mb-6"
          >
            <MessageCircle class="h-3 w-3 sm:h-4 sm:w-4" />
            Client Success Stories
          </div>
          <h2
            class="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-5 md:mb-6 leading-tight tracking-tight px-4"
          >
            Loved by
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]"
              >10,000+</span
            >
            organizers
          </h2>
          <p class="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-4">
            From intimate gatherings to large-scale conferences, see how GoEvent transforms event
            planning
          </p>
        </div>

        <!-- Swipe Indicator (Mobile Only) -->
        <div class="md:hidden text-center mb-4 px-4">
          <div class="inline-flex items-center gap-2 text-slate-600 text-sm animate-pulse">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            <span>Swipe to see reviews</span>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>

        <!-- Testimonials Grid -->
        <div class="md:grid md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-12 sm:mb-16 md:mb-20 overflow-x-auto md:overflow-visible snap-x snap-mandatory scrollbar-hide flex md:flex-none -mx-4 px-4 md:mx-0 md:px-0 py-2">
          <div
            v-for="(testimonial, index) in testimonials"
            :key="testimonial.name"
            class="group relative bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl p-6 sm:p-7 md:p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 w-[85vw] md:w-full flex-shrink-0 md:flex-shrink snap-center"
            :class="index === 1 ? 'md:scale-105 md:z-10' : ''"
          >
            <!-- Quote icon -->
            <div
              class="absolute -top-2 -left-2 sm:-top-3 sm:-left-3 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] rounded-full flex items-center justify-center text-white text-sm sm:text-base md:text-lg font-bold"
            >
              "
            </div>

            <!-- Rating stars -->
            <div class="flex gap-0.5 sm:gap-1 text-yellow-400 mb-4 sm:mb-5 md:mb-6">
              <Star v-for="i in 5" :key="i" class="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 fill-current" />
            </div>

            <!-- Testimonial content -->
            <blockquote
              class="text-slate-700 text-sm sm:text-base md:text-base leading-relaxed mb-5 sm:mb-6 md:mb-8 font-medium"
            >
              "{{ testimonial.content }}"
            </blockquote>

            <!-- Author info -->
            <div class="flex items-center">
              <div
                class="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-emerald-100 to-sky-100 rounded-full flex items-center justify-center mr-3 sm:mr-3.5 md:mr-4 group-hover:scale-110 transition-transform duration-300"
              >
                <span class="text-[#1e90ff] font-bold text-sm sm:text-base md:text-lg">{{
                  testimonial.name.charAt(0)
                }}</span>
              </div>
              <div>
                <h4 class="font-bold text-slate-900 text-sm sm:text-base md:text-base">
                  {{ testimonial.name }}
                </h4>
                <p class="text-[#1e90ff] font-medium text-xs sm:text-sm md:text-sm">
                  {{ testimonial.role }}
                </p>
              </div>
            </div>

            <!-- Hover effect background -->
            <div
              class="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-sky-50/50 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
            ></div>
          </div>
        </div>

        <!-- Trust indicators -->
        <div class="text-center">
          <div
            class="flex items-center justify-center gap-2 sm:gap-4 md:gap-6 lg:gap-8 bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl px-3 sm:px-6 md:px-8 py-3 sm:py-5 md:py-6 border border-white/20 flex-wrap sm:flex-nowrap"
          >
            <div class="flex items-center gap-1 sm:gap-2">
              <div class="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
              <span class="text-slate-700 font-medium text-xs sm:text-sm md:text-base whitespace-nowrap">99.9% Uptime</span>
            </div>
            <div class="hidden sm:block w-px h-4 sm:h-5 md:h-6 bg-slate-300 flex-shrink-0"></div>
            <div class="flex items-center gap-1 sm:gap-2">
              <Shield class="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-[#1e90ff] flex-shrink-0" />
              <span class="text-slate-700 font-medium text-xs sm:text-sm md:text-base whitespace-nowrap"
                >Enterprise Security</span
              >
            </div>
            <div class="hidden sm:block w-px h-4 sm:h-5 md:h-6 bg-slate-300 flex-shrink-0"></div>
            <div class="flex items-center gap-1 sm:gap-2">
              <Award class="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-[#1e90ff] flex-shrink-0" />
              <span class="text-slate-700 font-medium text-xs sm:text-sm md:text-base whitespace-nowrap">Award Winning</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section
      id="faq"
      ref="faqSection"
      class="py-12 sm:py-16 md:py-20 scroll-animate faq-bg"
      :class="{ 'animate-fade-in-up': isVisible.faq }"
    >
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header Section -->
        <div class="text-center mb-12 sm:mb-16 md:mb-20">
          <div
            class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-[#B0E0E6] text-[#1873cc] mb-4 sm:mb-6"
          >
            <HelpCircle class="h-3 w-3 sm:h-4 sm:w-4" />
            Frequently Asked Questions
          </div>
          <h2
            class="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-5 md:mb-6 leading-tight tracking-tight px-4"
          >
            Got Questions? We've Got
            <span
              class="text-transparent bg-clip-text bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]"
            >
              Answers</span
            >
          </h2>
          <p class="text-base sm:text-lg md:text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed px-4">
            Everything you need to know about GoEvent and how it can transform your event planning
            experience.
          </p>
        </div>

        <!-- FAQ Items - Redesigned with Better Spacing and Typography -->
        <div class="space-y-4 sm:space-y-5 md:space-y-6">
          <div
            v-for="(faq, index) in faqs"
            :key="index"
            class="group bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/50 shadow-sm hover:shadow-lg hover:border-[#87CEEB]/50 transition-all duration-300 overflow-hidden"
          >
            <button
              @click="toggleFaq(index)"
              class="w-full px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 text-left flex items-start justify-between font-medium text-slate-900 hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-sky-50/30 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:ring-offset-2 group min-h-[44px]"
            >
              <div class="flex-1 pr-3 sm:pr-4 md:pr-6">
                <h3
                  class="text-base sm:text-lg md:text-xl font-bold text-slate-900 leading-tight tracking-tight group-hover:bg-gradient-to-r group-hover:from-[#2ecc71] group-hover:to-[#1e90ff] group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300"
                >
                  {{ faq.question }}
                </h3>
              </div>
              <div class="flex-shrink-0 ml-2 sm:ml-3 md:ml-4">
                <div
                  class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 group-hover:bg-gradient-to-br group-hover:from-emerald-100 group-hover:to-sky-100 flex items-center justify-center transition-all duration-300"
                >
                  <ChevronDown
                    class="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 group-hover:text-[#1e90ff] transition-all duration-300"
                    :class="{ 'rotate-180': openFaq === index }"
                  />
                </div>
              </div>
            </button>
            <Transition
              enter-active-class="transition-all duration-400 ease-out"
              enter-from-class="max-h-0 opacity-0"
              enter-to-class="max-h-[500px] opacity-100"
              leave-active-class="transition-all duration-300 ease-in"
              leave-from-class="max-h-[500px] opacity-100"
              leave-to-class="max-h-0 opacity-0"
            >
              <div v-show="openFaq === index" class="overflow-hidden">
                <div class="px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8 pt-2">
                  <!-- Visual separator -->
                  <div
                    class="w-12 sm:w-14 md:w-16 h-0.5 sm:h-0.5 md:h-1 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] rounded-full mb-4 sm:mb-5 md:mb-6"
                  ></div>
                  <!-- Answer content with better typography -->
                  <div class="prose prose-slate max-w-none">
                    <p class="text-sm sm:text-base md:text-lg text-slate-700 leading-relaxed font-medium">
                      {{ faq.answer }}
                    </p>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <PricingSection
      ref="pricingSection"
      class="scroll-animate pricing-bg"
      :class="{ 'animate-fade-in-up': isVisible.pricing }"
    />

    <Footer />

    <!-- Scroll to Top Button -->
    <Transition name="fade">
      <button
        v-show="showScrollTop"
        @click="scrollToTop"
        class="fixed bottom-28 lg:bottom-8 right-6 w-14 h-14 z-50 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-full shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:ring-offset-2 flex items-center justify-center"
      >
        <ArrowUp class="w-6 h-6" />
      </button>
    </Transition>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../components/MainLayout.vue'
import Footer from '../components/Footer.vue'
import PricingSection from '../components/PricingSection.vue'
import { useScrollAnimations, useScrollToTop } from '../composables/useScrollAnimations'
import LogoPng from '@/assets/logo.png'
import HeroDevicesImg from '@/assets/hero-devices.webp'
import {
  Calendar,
  Users,
  BarChart3,
  MessageSquare,
  MapPin,
  Camera,
  Check,
  Star,
  Sparkles,
  ArrowRight,
  Play,
  MessageCircle,
  Shield,
  Award,
  ArrowUp,
  HelpCircle,
  ChevronDown,
} from 'lucide-vue-next'

// Scroll animations
const { isVisible, observeElement } = useScrollAnimations()
const { showScrollTop, scrollToTop } = useScrollToTop()

// Router and auth
const router = useRouter()
import { useAuthStore } from '../stores/auth'
const authStore = useAuthStore()

// Refs for sections
const featuresSection = ref<HTMLElement>()
const testimonialsSection = ref<HTMLElement>()
const pricingSection = ref<HTMLElement>()
const faqSection = ref<HTMLElement>()

const showTestimonials = false

// FAQ functionality
const openFaq = ref<number | null>(null)

const toggleFaq = (index: number) => {
  openFaq.value = openFaq.value === index ? null : index
}

const scrollToDemo = () => {
  const features = document.getElementById('features')
  if (features) {
    features.scrollIntoView({ behavior: 'smooth' })
  }
}

const handleStartCreatingEvents = () => {
  if (authStore.isAuthenticated) {
    router.push({ path: '/events', query: { createEvent: '1' } })
  } else {
    router.push({ path: '/signin', query: { redirect: '/events?createEvent=1' } })
  }
}

onMounted(() => {
  // Observe sections for scroll animations
  if (featuresSection.value) {
    observeElement(featuresSection.value, 'features')
  }
  if (testimonialsSection.value) {
    observeElement(testimonialsSection.value, 'testimonials')
  }
  if (pricingSection.value) {
    observeElement(pricingSection.value, 'pricing')
  }
  if (faqSection.value) {
    observeElement(faqSection.value, 'faq')
  }
})

// Computed properties for static data to optimize memory usage
const features = computed(() => [
  {
    icon: Calendar,
    title: 'Smart Event Planning',
    description:
      'Create and manage events with our intuitive planning tools. Set dates, venues, and track progress effortlessly with AI-powered suggestions.',
    bgColor: 'bg-gradient-to-br from-[#B0E0E6] to-[#87CEEB]',
    iconColor: 'text-[#1e90ff]',
  },
  {
    icon: Users,
    title: 'Advanced Guest Management',
    description:
      'Manage attendee lists, send personalized invitations, and track RSVPs with automated follow-ups and custom registration forms.',
    bgColor: 'bg-gradient-to-br from-[#B0E0E6] to-[#87CEEB]',
    iconColor: 'text-[#1e90ff]',
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description:
      'Get detailed insights into event performance, attendance rates, and engagement metrics with beautiful interactive dashboards.',
    bgColor: 'bg-gradient-to-br from-emerald-100 to-emerald-200',
    iconColor: 'text-emerald-600',
  },
  {
    icon: MessageSquare,
    title: 'Communication Hub',
    description:
      'Keep attendees engaged with automated emails, push notifications, announcements, and real-time chat features.',
    bgColor: 'bg-gradient-to-br from-orange-100 to-orange-200',
    iconColor: 'text-orange-600',
  },
  {
    icon: MapPin,
    title: 'Venue & Location',
    description:
      'Seamlessly integrate with venue booking systems, display interactive maps, and provide detailed location information.',
    bgColor: 'bg-gradient-to-br from-red-100 to-red-200',
    iconColor: 'text-red-600',
  },
  {
    icon: Camera,
    title: 'Media & Content',
    description:
      'Upload and share event photos, videos, documents, and create stunning event galleries with automatic organization.',
    bgColor: 'bg-gradient-to-br from-teal-100 to-teal-200',
    iconColor: 'text-teal-600',
  },
])

const testimonials = computed(() => [
  {
    name: 'Sarah Johnson',
    role: 'Corporate Event Manager',
    content:
      'GoEvent transformed how we manage our company conferences. The analytics feature helped us increase attendance by 40%.',
  },
  {
    name: 'Michael Chen',
    role: 'Wedding Planner',
    content:
      'The guest management system is incredible. My clients love how easy it is to track RSVPs and communicate with guests.',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Non-profit Director',
    content:
      "We've organized 50+ charity events using GoEvent. The platform scales beautifully and saves us countless hours.",
  },
])

const faqs = computed(() => [
  {
    question: 'How much does GoEvent cost?',
    answer:
      'GoEvent offers flexible pricing plans to suit different needs. We have a free tier for small events, and paid plans starting at $300/event for customize design. Business solutions are available with custom pricing.',
  },
  {
    question: 'Is my event data secure and private?',
    answer:
      'Absolutely. We take security seriously with enterprise-grade encryption, SOC 2 compliance, and GDPR compliance. Your data is stored securely with regular backups, and we never share your information with third parties. You maintain full ownership and control of your event data.',
  },
  {
    question: 'What types of events can I manage with GoEvent?',
    answer:
      "GoEvent is versatile and supports all types of events including conferences, workshops, webinars, weddings, corporate meetings, trade shows, festivals, and more. Whether it's a 10-person workshop or a 10,000-person conference, our platform scales to meet your needs.",
  },
  {
    question: 'Do you offer customer support?',
    answer:
      'Yes! We provide comprehensive support including 24/7 chat support, email support, extensive documentation, video tutorials, and webinar training sessions. Premium plans include dedicated account managers and priority support with guaranteed response times.',
  },
  {
    question: 'Can I customize the registration forms and event pages?',
    answer:
      "Definitely! GoEvent offers extensive customization options including custom registration forms, branded event pages, personalized email templates, and white-label solutions. You can match your organization's branding and create a seamless experience for your attendees.",
  },
])
</script>

<style scoped>
/* Unified gradient system for positive, user-friendly feel */
.features-bg {
  background: linear-gradient(to bottom, #ffffff, #f8fafc, #ffffff);
}

.testimonials-bg {
  background: linear-gradient(to bottom right, #f8fafc, #ffffff, #faf5ff);
}

.faq-bg {
  background: linear-gradient(to bottom right, #f8fafc, #ffffff, #f8fafc);
}

.pricing-bg {
  background: linear-gradient(to bottom, #ffffff, #dbeafe1a, #ffffff);
}

/* Optimized hero blur effects using will-change for better performance */
.hero-blur-shape {
  filter: blur(40px);
  will-change: transform;
  backface-visibility: hidden;
}

.hero-blur-large {
  filter: blur(80px);
  will-change: auto;
}

/* Optimized animations using transform3d for GPU acceleration */
@keyframes float {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(10px, -20px, 0) scale(1.05);
  }
}

@keyframes float-delayed {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(-15px, 15px, 0) scale(0.95);
  }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float-delayed 8s ease-in-out infinite;
  animation-delay: -2s;
}

/* Hero animations using transform3d for GPU acceleration */
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
    transform: translate3d(-50px, 0, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translate3d(50px, 0, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translate3d(0, 30px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

/* Hide scrollbar for horizontal scroll */
.scrollbar-hide {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}

.scrollbar-hide::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

/* Animation classes */
.animate-fade-in {
  animation: fadeIn 1s ease-out forwards;
}

.animate-slide-in-left {
  animation: slideInLeft 1s ease-out forwards;
}

.animate-slide-in-right {
  animation: slideInRight 1s ease-out forwards;
}

.animate-fade-in-up {
  animation: fadeInUp 0.8s ease-out forwards;
}

/* Animation delays */
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

/* Typing animation */
.typing-text {
  position: relative;
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.typing-cursor {
  animation: blink 1s infinite;
  color: #3b82f6;
  font-weight: normal;
  -webkit-text-fill-color: #3b82f6;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

/* Scroll animations */
.scroll-animate {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s ease-out;
}

.scroll-animate.animate-fade-in-up {
  opacity: 1;
  transform: translateY(0);
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
